import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes';
import videoRoutes from './routes/video.routes';
import transcriptionRoutes from './routes/transcription.routes';
import folderRoutes from './routes/folder.routes';

const app: Application = express();
const PORT = process.env.PORT || 3001;
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create necessary directories
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
const tempDir = path.join(__dirname, '..', process.env.TEMP_DIR || 'temp');
const videosDir = path.join(__dirname, '..', process.env.VIDEOS_DIR || 'videos');

[uploadDir, tempDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create videos directory if using local storage
if (STORAGE_TYPE === 'local' && !fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Serve videos statically if using local storage
if (STORAGE_TYPE === 'local') {
  app.use('/videos', express.static(videosDir));
  console.log(`📹 Serving videos from: ${videosDir}`);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/transcriptions', transcriptionRoutes);
app.use('/api/folders', folderRoutes);

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    message: 'Transly API is running',
    storage: STORAGE_TYPE 
  });
});

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Transly API running on port ${PORT}`);
  console.log(`💾 Storage type: ${STORAGE_TYPE.toUpperCase()}`);
  console.log(`📁 Upload directory: ${uploadDir}`);
  console.log(`📁 Temp directory: ${tempDir}`);
  if (STORAGE_TYPE === 'local') {
    console.log(`📁 Videos directory: ${videosDir}`);
  }
});

export default app;

