import { processVideoTranscription } from './transcription.service';

interface QueueItem {
  videoId: string;
  videoPath: string;
  userId: string;
}

class TranscriptionQueue {
  private queue: QueueItem[] = [];
  private processing = false;

  add(item: QueueItem) {
    this.queue.push(item);
    console.log(`📋 Added to queue: ${item.videoId} (Total in queue: ${this.queue.length})`);
    
    // Start processing if not already processing
    if (!this.processing) {
      this.processNext();
    } else {
      console.log(`⏳ Video queued, waiting for current transcription to finish...`);
    }
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const item = this.queue.shift()!;

    console.log(`⚙️ Processing video ${item.videoId} (${this.queue.length} remaining in queue)`);

    try {
      await processVideoTranscription(item.videoId, item.videoPath, item.userId);
    } catch (error) {
      console.error(`❌ Failed to process ${item.videoId}:`, error);
    } finally {
      this.processing = false;
      // Process next item in queue
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 1000);
      }
    }
  }

  getQueueSize() {
    return this.queue.length;
  }

  isProcessing() {
    return this.processing;
  }
}

export const transcriptionQueue = new TranscriptionQueue();

