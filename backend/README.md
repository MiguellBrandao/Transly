# Transly Backend

Backend API for Transly video transcription platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials.

3. Run development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Videos
- `GET /api/videos` - Get all videos
- `GET /api/videos/:id` - Get single video
- `POST /api/videos/upload` - Upload video
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video

### Transcriptions
- `GET /api/transcriptions/video/:videoId` - Get transcription
- `GET /api/transcriptions/export/:videoId/:format` - Export transcription

### Folders
- `GET /api/folders` - Get all folders
- `POST /api/folders` - Create folder
- `PUT /api/folders/:id` - Update folder
- `DELETE /api/folders/:id` - Delete folder

## Technologies

- Node.js + Express
- TypeScript
- Supabase
- Whisper AI (via @xenova/transformers)
- FFmpeg

