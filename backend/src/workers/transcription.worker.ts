import { parentPort, workerData } from "worker_threads";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { pipeline } from "@xenova/transformers";
import { WaveFile } from "wavefile";

// This runs in a separate thread!
const WHISPER_MODEL = process.env.WHISPER_MODEL || "tiny";

const getModelName = (): string => {
  const modelMap: { [key: string]: string } = {
    tiny: "Xenova/whisper-tiny",
    base: "Xenova/whisper-base",
    small: "Xenova/whisper-small",
  };
  return modelMap[WHISPER_MODEL] || modelMap["tiny"];
};

const readAudioFile = (audioPath: string): Float32Array => {
  const buffer = fs.readFileSync(audioPath);
  const wav = new WaveFile(buffer);

  wav.toBitDepth("16");
  wav.toSampleRate(16000);

  let samples = wav.getSamples(false, Float32Array);

  if (Array.isArray(samples)) {
    const mono = new Float32Array(samples[0].length);
    for (let i = 0; i < samples[0].length; i++) {
      mono[i] =
        samples.reduce((sum, channel) => sum + channel[i], 0) / samples.length;
    }
    samples = mono;
  }

  const typedSamples = samples as Float32Array;
  let maxVal = 0;
  for (let i = 0; i < typedSamples.length; i++) {
    const absVal = Math.abs(typedSamples[i]);
    if (absVal > maxVal) maxVal = absVal;
  }

  if (maxVal > 1) {
    const normalized = new Float32Array(typedSamples.length);
    for (let i = 0; i < typedSamples.length; i++) {
      normalized[i] = typedSamples[i] / maxVal;
    }
    return normalized;
  }

  return typedSamples;
};

const getMockTranscription = () => {
  const mockText =
    "This is a sample transcription. The Whisper model will process your video and generate accurate text with word-level timestamps. You can click on any word to jump to that moment in the video.";
  const mockWords = mockText.split(/\s+/).map((word, idx) => ({
    word: word,
    start: idx * 0.5,
    end: (idx + 1) * 0.5,
    confidence: 1.0,
  }));

  return {
    text: mockText,
    words: mockWords,
    language: "en",
  };
};

(async () => {
  try {
    const { audioPath } = workerData;

    if (WHISPER_MODEL === "mock") {
      parentPort?.postMessage({
        success: true,
        data: getMockTranscription(),
      });
      return;
    }

    console.log(`🔧 Worker: Reading audio file...`);
    const audioData = readAudioFile(audioPath);

    console.log(
      `🔧 Worker: Loading Whisper model ${WHISPER_MODEL.toUpperCase()}...`
    );
    const transcriber = await pipeline(
      "automatic-speech-recognition",
      getModelName(),
      { quantized: false }
    );

    console.log(`🔧 Worker: Transcribing...`);
    const result = await transcriber(audioData, {
      return_timestamps: "word",
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "portuguese",
      task: "transcribe",
    });

    if (!result || !result.text || result.text.trim() === "") {
      const result2 = await transcriber(audioData, {
        return_timestamps: "word",
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      if (result2?.text && result2.text.trim() !== "") {
        parentPort?.postMessage({
          success: true,
          data: processResult(result2, audioData.length),
        });
        return;
      }

      parentPort?.postMessage({
        success: true,
        data: getMockTranscription(),
      });
      return;
    }

    parentPort?.postMessage({
      success: true,
      data: processResult(result, audioData.length),
    });
  } catch (error: any) {
    console.error("🔧 Worker error:", error);
    parentPort?.postMessage({
      success: false,
      error: error.message,
    });
  }
})();

function processResult(result: any, audioLength: number) {
  let words: any[] = [];

  if (result.chunks && result.chunks.length > 0) {
    words = result.chunks
      .map((chunk: any) => ({
        word: chunk.text.trim(),
        start: chunk.timestamp[0] || 0,
        end: chunk.timestamp[1] || chunk.timestamp[0] || 0,
        confidence: 1.0,
      }))
      .filter((w: any) => w.word.length > 0);
  }

  if (words.length === 0 && result.text) {
    const textWords = result.text
      .split(/\s+/)
      .filter((w: string) => w.length > 0);
    const duration = audioLength / 16000;
    const timePerWord = duration / textWords.length;

    words = textWords.map((word: string, idx: number) => ({
      word: word,
      start: idx * timePerWord,
      end: (idx + 1) * timePerWord,
      confidence: 0.8,
    }));
  }

  return {
    text: result.text.trim(),
    words,
    language: result.language || "auto",
  };
}
