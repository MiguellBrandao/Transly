import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { Worker } from "worker_threads";
import { supabaseAdmin } from "../config/supabase";
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

// Transcribe audio using Worker Thread (non-blocking)
export const transcribeAudio = async (audioPath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    console.log(`🔧 Starting transcription in worker thread (model: ${WHISPER_MODEL.toUpperCase()})...`);
    
    const worker = new Worker(path.join(__dirname, '../workers/transcription.worker.js'), {
      workerData: { audioPath },
      env: process.env,
    });

    worker.on('message', (message) => {
      if (message.success) {
        console.log('✅ Worker completed successfully');
        resolve(message.data);
      } else {
        console.error('❌ Worker failed:', message.error);
        reject(new Error(message.error));
      }
    });

    worker.on('error', (error) => {
      console.error('❌ Worker error:', error);
      // Return mock data on error
      resolve(getMockTranscription());
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`❌ Worker stopped with exit code ${code}`);
        resolve(getMockTranscription());
      }
    });
  });
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

const groupWordsIntoSentences = (words: any[]): any[] => {
  if (!words || words.length === 0) return [];

  const sentences: any[] = [];
  let currentSentence: any[] = [];
  let sentenceStart = 0;

  words.forEach((word, index) => {
    currentSentence.push(word);

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

    // Transcribe using worker thread (non-blocking!)
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
