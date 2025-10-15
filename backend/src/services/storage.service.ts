import { supabaseAdmin } from '../config/supabase';
import fs from 'fs';

const BUCKET_NAME = 'videos';

export const uploadVideoToStorage = async (
  filePath: string,
  filename: string,
  userId: string
): Promise<string> => {
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

    return publicUrl;
  } catch (error: any) {
    console.error('Upload to storage error:', error);
    throw error;
  }
};

export const deleteVideoFromStorage = async (
  filename: string,
  userId: string
): Promise<void> => {
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
};

