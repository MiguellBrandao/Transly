import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class VideoCompressionService {
  private ffmpeg: FFmpeg | null = null;
  private isLoading: boolean = false;
  private isLoaded: boolean = false;

  async load(): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      // Wait for loading to complete
      while (this.isLoading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.isLoading = true;
    this.ffmpeg = new FFmpeg();

    try {
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isLoaded = true;
      console.log('✅ FFmpeg loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load FFmpeg:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  async compressVideo(
    file: File,
    onProgress?: (progress: number, stage: 'loading' | 'compressing') => void
  ): Promise<File> {
    if (!this.ffmpeg) {
      await this.load();
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    try {
      console.log('🗜️ Starting video compression...');
      console.log(`   Original size: ${this.formatBytes(file.size)}`);

      onProgress?.(0, 'loading');

      // Write input file
      const inputName = 'input' + this.getFileExtension(file.name);
      const outputName = 'output.mp4';

      await this.ffmpeg.writeFile(inputName, await fetchFile(file));

      onProgress?.(10, 'compressing');

      // Get compression settings from environment or use defaults
      const fileSizeMB = file.size / (1024 * 1024);
      const compressionThreshold = Number(import.meta.env.VITE_COMPRESSION_THRESHOLD_MB) || 100;
      
      // Check if file needs compression
      if (fileSizeMB < compressionThreshold) {
        console.log(`📹 File is ${fileSizeMB.toFixed(1)}MB (threshold: ${compressionThreshold}MB), skipping compression`);
        return file;
      }

      // Get compression settings from environment variables
      const resolution = import.meta.env.VITE_VIDEO_RESOLUTION || '640';
      const videoBitrate = import.meta.env.VITE_VIDEO_BITRATE || '200k';
      const audioBitrate = import.meta.env.VITE_AUDIO_BITRATE || '96k';

      console.log(`   Target: ${resolution}p @ ${videoBitrate}`);

      // Set up progress monitoring
      this.ffmpeg.on('progress', ({ progress }) => {
        const percent = Math.round(progress * 100);
        onProgress?.(10 + (percent * 0.9), 'compressing');
      });

      // Compress video
      await this.ffmpeg.exec([
        '-i', inputName,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '28',
        '-vf', `scale=${resolution}:-2`,
        '-b:v', videoBitrate,
        '-c:a', 'aac',
        '-b:a', audioBitrate,
        '-movflags', '+faststart',
        outputName
      ]);

      // Read output file
      const data = await this.ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([data], { type: 'video/mp4' });
      
      const compressedFile = new File(
        [compressedBlob],
        file.name.replace(/\.[^/.]+$/, '.mp4'),
        { type: 'video/mp4' }
      );

      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      console.log('✅ Compression complete!');
      console.log(`   Original: ${this.formatBytes(file.size)}`);
      console.log(`   Compressed: ${this.formatBytes(compressedFile.size)}`);
      console.log(`   Reduction: ${reduction}%`);

      onProgress?.(100, 'compressing');

      return compressedFile;
    } catch (error) {
      console.error('❌ Compression failed:', error);
      throw error;
    }
  }

  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? '.' + ext : '.mp4';
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }
}

export const videoCompressionService = new VideoCompressionService();

