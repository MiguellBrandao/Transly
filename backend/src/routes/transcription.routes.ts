import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { supabaseAdmin } from '../config/supabase';
import { exportTranscriptionTxt, exportTranscriptionCsv, exportTranscriptionDocx } from '../services/export.service';

const router = Router();

// Get transcription for video
router.get('/video/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { videoId } = req.params;

    const { data, error } = await supabaseAdmin
      .from('transcriptions')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export transcription
router.get('/export/:videoId/:format', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { videoId, format } = req.params;

    // Get transcription with video info
    const { data: transcription, error: transcriptionError } = await supabaseAdmin
      .from('transcriptions')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (transcriptionError || !transcription) {
      return res.status(404).json({ error: 'Transcription not found' });
    }

    // Get video title
    const { data: video } = await supabaseAdmin
      .from('videos')
      .select('title')
      .eq('id', videoId)
      .single();

    const videoTitle = video?.title || 'transcription';

    switch (format.toLowerCase()) {
      case 'txt':
        const txtBuffer = await exportTranscriptionTxt(transcription);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.txt"`);
        return res.send(txtBuffer);

      case 'csv':
        const csvBuffer = await exportTranscriptionCsv(transcription);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.csv"`);
        return res.send(csvBuffer);

      case 'docx':
        const docxBuffer = await exportTranscriptionDocx(transcription);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${videoTitle}.docx"`);
        return res.send(docxBuffer);

      default:
        return res.status(400).json({ error: 'Invalid format. Use txt, csv, or docx' });
    }
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

