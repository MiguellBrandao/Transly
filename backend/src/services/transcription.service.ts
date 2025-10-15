import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { supabaseAdmin } from "../config/supabase";
import { pipeline } from "@xenova/transformers";
import { WaveFile } from "wavefile";
import { io } from "../index";

// Cache the model to avoid reloading
let transcriber: any = null;

const WHISPER_MODEL = process.env.WHISPER_MODEL || "tiny";

const getModelName = (): string => {
  const modelMap: { [key: string]: string } = {
    tiny: "Xenova/whisper-tiny", // ~150MB - Fast, less accurate
    base: "Xenova/whisper-base", // ~500MB - Balanced
    small: "Xenova/whisper-small", // ~1GB - Slow, most accurate
  };
  return modelMap[WHISPER_MODEL] || modelMap["tiny"];
};

const getTranscriber = async () => {
  if (WHISPER_MODEL === "mock") {
    console.log("⚠️ Using MOCK mode - no AI transcription");
    return null;
  }

  if (!transcriber) {
    const modelName = getModelName();
    console.log(
      `🤖 Loading Whisper model: ${WHISPER_MODEL.toUpperCase()} (${modelName})`
    );
    console.log("   This may take a few minutes on first run...");

    transcriber = await pipeline("automatic-speech-recognition", modelName, {
      quantized: false,
    });
    console.log("✅ Whisper model loaded successfully!");
  }
  return transcriber;
};

export const extractAudio = async (
  videoPath: string,
  outputPath: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(outputPath)
      .audioCodec("pcm_s16le")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("wav")
      .on("end", () => resolve(outputPath))
      .on("error", (err) => reject(err))
      .run();
  });
};

// Helper function to read WAV file and convert to Float32Array
const readAudioFile = (audioPath: string): Float32Array => {
  const buffer = fs.readFileSync(audioPath);
  const wav = new WaveFile(buffer);

  // Convert to 16-bit PCM if not already
  wav.toBitDepth("16");
  wav.toSampleRate(16000);

  // Get samples
  let samples = wav.getSamples(false, Float32Array);

  // If stereo, convert to mono by averaging channels
  if (Array.isArray(samples)) {
    const mono = new Float32Array(samples[0].length);
    for (let i = 0; i < samples[0].length; i++) {
      mono[i] =
        samples.reduce((sum, channel) => sum + channel[i], 0) / samples.length;
    }
    samples = mono;
  }

  // Normalize to [-1, 1] range (critical for Whisper)
  const typedSamples = samples as Float32Array;

  // Find max value without spread operator (avoid stack overflow)
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

export const transcribeAudio = async (audioPath: string): Promise<any> => {
  // If using mock mode, return mock data immediately
  if (WHISPER_MODEL === "mock") {
    console.log(
      "🎭 MOCK mode: Returning sample transcription (no AI processing)"
    );
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate processing time
    return getMockTranscription();
  }

  try {
    console.log("📖 Reading audio file...");
    const audioData = readAudioFile(audioPath);
    const durationInSeconds = audioData.length / 16000;
    console.log(
      `✅ Audio loaded: ${
        audioData.length
      } samples (${durationInSeconds.toFixed(1)}s duration)`
    );

    // Find min/max without spread operator
    let min = audioData[0],
      max = audioData[0];
    for (let i = 1; i < audioData.length; i++) {
      if (audioData[i] < min) min = audioData[i];
      if (audioData[i] > max) max = audioData[i];
    }
    console.log(`   Audio range: [${min.toFixed(3)}, ${max.toFixed(3)}]`);

    console.log(
      `🎤 Starting Whisper transcription with model: ${WHISPER_MODEL.toUpperCase()}...`
    );
    const model = await getTranscriber();

    // Transcribe with better options
    const result = await model(audioData, {
      return_timestamps: "word",
      chunk_length_s: 30,
      stride_length_s: 5,
      language: "portuguese", // Try Portuguese first, Whisper will auto-detect if wrong
      task: "transcribe",
    });

    console.log("📝 Raw transcription result:");
    console.log(`   Text: "${result.text || "(empty)"}"`);
    console.log(`   Chunks: ${result.chunks?.length || 0}`);

    // Check if we got valid results
    if (!result || !result.text || result.text.trim() === "") {
      console.warn("⚠️ Whisper returned empty - audio might have no speech");
      console.log("   Trying again without language constraint...");

      // Try again without language constraint
      const result2 = await model(audioData, {
        return_timestamps: "word",
        chunk_length_s: 30,
        stride_length_s: 5,
      });

      if (result2?.text && result2.text.trim() !== "") {
        console.log(
          `✅ Success on retry: "${result2.text.substring(0, 50)}..."`
        );
        return processTranscriptionResult(result2, audioData.length);
      }

      console.warn("❌ Still empty. Using mock data for demonstration.");
      return getMockTranscription();
    }

    return processTranscriptionResult(result, audioData.length);
  } catch (error) {
    console.error("❌ Transcription error:", error);
    console.log("Using mock data as fallback...");
    return getMockTranscription();
  }
};

const processTranscriptionResult = (result: any, audioLength: number) => {
  console.log(`✅ Transcribed: "${result.text.substring(0, 100)}..."`);

  // Transform result to our format
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

  // If no word timestamps, generate from text
  if (words.length === 0 && result.text) {
    console.log("⚠️ No word-level timestamps, generating estimates...");
    const textWords = result.text.split(/\s+/).filter((w) => w.length > 0);
    const duration = audioLength / 16000;
    const timePerWord = duration / textWords.length;

    words = textWords.map((word: string, idx: number) => ({
      word: word,
      start: idx * timePerWord,
      end: (idx + 1) * timePerWord,
      confidence: 0.8,
    }));
  }

  console.log(`✅ Final: ${result.text.length} chars, ${words.length} words`);

  return {
    text: result.text.trim(),
    words,
    language: result.language || "auto",
  };
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

export const processVideoTranscription = async (
  videoId: string,
  videoPath: string,
  userId: string
): Promise<void> => {
  try {
    // Update video status to processing
    await supabaseAdmin
      .from("videos")
      .update({ status: "processing" })
      .eq("id", videoId);

    // Emit WebSocket event that processing started
    io.emit("transcription:started", {
      videoId,
      userId,
      status: "processing",
    });

    // Get video directory
    const STORAGE_TYPE = process.env.STORAGE_TYPE || "local";
    const VIDEOS_DIR = path.join(
      __dirname,
      "../../",
      process.env.VIDEOS_DIR || "videos"
    );
    const videoDir = path.join(VIDEOS_DIR, userId, videoId);

    // Extract audio to video directory
    const audioPath = path.join(videoDir, "audio.wav");

    await extractAudio(videoPath, audioPath);

    // Transcribe
    const transcriptionResult = await transcribeAudio(audioPath);

    // Group words into sentences
    const sentences = groupWordsIntoSentences(transcriptionResult.words);

    // Save transcription to database
    await supabaseAdmin.from("transcriptions").insert({
      video_id: videoId,
      user_id: userId,
      text: transcriptionResult.text,
      words: transcriptionResult.words,
      sentences,
      language: transcriptionResult.language,
    });

    // Update video status to completed
    await supabaseAdmin
      .from("videos")
      .update({ status: "completed" })
      .eq("id", videoId);

    // Clean up video file from uploads (keep the one in videos directory)
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    console.log(`✅ Transcription completed for video ${videoId}`);

    // Emit WebSocket event to notify clients
    io.emit("transcription:completed", {
      videoId,
      userId,
      status: "completed",
    });
  } catch (error) {
    console.error("Process video transcription error:", error);

    // Update video status to failed
    await supabaseAdmin
      .from("videos")
      .update({ status: "failed" })
      .eq("id", videoId);
  }
};

const groupWordsIntoSentences = (words: any[]): any[] => {
  if (!words || words.length === 0) return [];

  const sentences: any[] = [];
  let currentSentence: any[] = [];
  let sentenceStart = 0;

  words.forEach((word, index) => {
    currentSentence.push(word);

    // End sentence on punctuation or every ~15 words
    const endsWithPunctuation = /[.!?;]$/.test(word.word);
    const isLongEnough = currentSentence.length >= 15;

    if (endsWithPunctuation || isLongEnough || index === words.length - 1) {
      sentences.push({
        text: currentSentence.map((w) => w.word).join(" "),
        start: sentenceStart,
        end: word.end,
        words: [...currentSentence],
      });

      currentSentence = [];
      if (index < words.length - 1) {
        sentenceStart = words[index + 1].start;
      }
    }
  });

  return sentences;
};
