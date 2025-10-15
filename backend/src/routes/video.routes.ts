import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/supabase';
import { uploadVideoToStorage, deleteVideoFromStorage } from '../services/storage.service';
import { processVideoTranscription } from '../services/transcription.service';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'));
    }
  },
});

// Get all videos for user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { folder_id } = req.query;

    let query = supabaseAdmin
      .from('videos')
      .select('*')
      .eq('user_id', userId);

    if (folder_id) {
      query = query.eq('folder_id', folder_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single video
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Upload video
router.post('/upload', authMiddleware, upload.single('video'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const file = req.file;
    const { title, folder_id } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    // Create video record in database first to get video ID
    const { data: video, error } = await supabaseAdmin
      .from('videos')
      .insert({
        user_id: userId,
        title: title || file.originalname,
        filename: file.filename,
        original_filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        storage_url: 'pending', // Will update after upload
        folder_id: folder_id || null,
        status: 'uploaded',
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    // Upload to storage with video ID
    const storageUrl = await uploadVideoToStorage(file.path, file.filename, userId!, video.id);

    // Update video with storage URL
    await supabaseAdmin
      .from('videos')
      .update({ storage_url: storageUrl })
      .eq('id', video.id);

    // Start transcription process in background
    processVideoTranscription(video.id, file.path, userId!).catch(err => {
      console.error('Transcription process error:', err);
    });

    res.json({
      message: 'Video uploaded successfully. Transcription started.',
      video,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update video
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { title, folder_id } = req.body;

    const { data, error } = await supabaseAdmin
      .from('videos')
      .update({ title, folder_id })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete video
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    // Get video info
    const { data: video, error: fetchError } = await supabaseAdmin
      .from('videos')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete from storage
    await deleteVideoFromStorage(video.id, userId!);

    // Delete from database
    const { error } = await supabaseAdmin
      .from('videos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

