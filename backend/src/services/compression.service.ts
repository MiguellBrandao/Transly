import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';

const ENABLE_COMPRESSION = process.env.ENABLE_VIDEO_COMPRESSION === 'true';
const VIDEO_RESOLUTION = parseInt(process.env.VIDEO_RESOLUTION || '640');
const VIDEO_BITRATE = process.env.VIDEO_BITRATE || '200k';
const AUDIO_BITRATE = process.env.AUDIO_BITRATE || '96k';

export const compressVideo = async (
  inputPath: string,
  outputPath: string,
  onProgress?: (percent: number) => void
): Promise<string> => {
  if (!ENABLE_COMPRESSION) {
    console.log('📹 Compression disabled, using original video');
    // Just copy the file
    fs.copyFileSync(inputPath, outputPath);
    return outputPath;
  }

  return new Promise((resolve, reject) => {
    console.log(`🗜️ Compressing video: ${path.basename(inputPath)}`);
    console.log(`   Target: ${VIDEO_RESOLUTION}p @ ${VIDEO_BITRATE}`);

    const command = ffmpeg(inputPath)
      .output(outputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoBitrate(VIDEO_BITRATE)
      .audioBitrate(AUDIO_BITRATE)
      .size(`${VIDEO_RESOLUTION}x?`) // Maintain aspect ratio
      .format('mp4')
      .outputOptions([
        '-preset fast',           // Compression speed (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
        '-crf 28',               // Quality (0-51, lower is better, 23 is default, 28 is smaller files)
        '-movflags +faststart',  // Enable streaming
      ]);

    // Progress callback
    command.on('progress', (progress) => {
      if (onProgress && progress.percent) {
        onProgress(Math.round(progress.percent));
        if (progress.percent % 20 === 0 || progress.percent > 95) {
          console.log(`   Compression progress: ${Math.round(progress.percent)}%`);
        }
      }
    });

    command.on('end', () => {
      const originalSize = fs.statSync(inputPath).size;
      const compressedSize = fs.statSync(outputPath).size;
      const reduction = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ Compression complete!`);
      console.log(`   Original: ${formatBytes(originalSize)}`);
      console.log(`   Compressed: ${formatBytes(compressedSize)}`);
      console.log(`   Reduction: ${reduction}%`);
      
      resolve(outputPath);
    });

    command.on('error', (err) => {
      console.error('❌ Compression error:', err);
      reject(err);
    });

    command.run();
  });
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

