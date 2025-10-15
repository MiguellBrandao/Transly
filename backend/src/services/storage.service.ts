import { supabaseAdmin } from '../config/supabase';
import fs from 'fs';
import path from 'path';

const BUCKET_NAME = 'videos';
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';
const VIDEOS_DIR = path.join(__dirname, '../../', process.env.VIDEOS_DIR || 'videos');
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

// Ensure videos directory exists (for local storage)
if (STORAGE_TYPE === 'local' && !fs.existsSync(VIDEOS_DIR)) {
  fs.mkdirSync(VIDEOS_DIR, { recursive: true });
  console.log(`📁 Created videos directory: ${VIDEOS_DIR}`);
}

export const uploadVideoToStorage = async (
  filePath: string,
  filename: string,
  userId: string
): Promise<string> => {
  if (STORAGE_TYPE === 'local') {
    // LOCAL STORAGE: Move file to videos directory
    try {
      const userDir = path.join(VIDEOS_DIR, userId);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }

      const destinationPath = path.join(userDir, filename);
      fs.copyFileSync(filePath, destinationPath);

      // Return URL that will be served by Express
      const publicUrl = `${BASE_URL}/videos/${userId}/${filename}`;
      console.log(`📹 Video stored locally: ${destinationPath}`);
      return publicUrl;
    } catch (error: any) {
      console.error('Local storage error:', error);
      throw error;
    }
  } else {
    // SUPABASE STORAGE
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const storagePath = `${userId}/${filename}`;

      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType: 'video/*',
          upsert: false,
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      console.log(`☁️ Video stored in Supabase: ${storagePath}`);
      return publicUrl;
    } catch (error: any) {
      console.error('Upload to storage error:', error);
      throw error;
    }
  }
};

export const deleteVideoFromStorage = async (
  filename: string,
  userId: string
): Promise<void> => {
  if (STORAGE_TYPE === 'local') {
    // LOCAL STORAGE: Delete file from videos directory
    try {
      const filePath = path.join(VIDEOS_DIR, userId, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted local video: ${filePath}`);
      }
    } catch (error: any) {
      console.error('Delete from local storage error:', error);
    }
  } else {
    // SUPABASE STORAGE
    try {
      const storagePath = `${userId}/${filename}`;

      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([storagePath]);

      if (error) {
        console.error('Storage delete error:', error);
      }
    } catch (error: any) {
      console.error('Delete from storage error:', error);
    }
  }
};

