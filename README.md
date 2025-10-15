# Transly 🎬

> AI-powered video transcription platform with Whisper AI, real-time sync, and advanced playback controls

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- 🎥 **Video Upload & Management** - Drag & drop interface, supports MP4, AVI, MOV, WEBM, MKV (up to 500MB)
- 🤖 **AI Transcription** - Automatic transcription using Whisper AI with word-level timestamps
- 📝 **Advanced Video Player** - Synchronized transcription with playback speed control (0.25x-16x)
- 🔍 **Smart Search** - Accent-insensitive, case-insensitive search across transcriptions
- 📤 **Export** - Export transcriptions as TXT, CSV, or DOCX
- 🌍 **Multilingual** - Portuguese and English interface
- 🎨 **Dark/Light Mode** - Eye-friendly themes with smooth transitions
- 📁 **Folder Organization** - Organize videos in hierarchical folders
- 🔐 **Secure Authentication** - Email-based authentication via Supabase

## 🎯 Demo Features

### Video Player with Synchronized Transcription
- Click any word to jump to that moment in the video
- Current word is underlined during playback
- Hover over words to see detailed timing information
- Search for words ignoring accents and case
- Copy entire transcription or individual sentences

### Playback Controls
- Speed control from 0.25x to 16x
- Precise seek bar
- Play/pause with visual feedback

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- FFmpeg installed on your system
- Supabase account (free tier works)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/transly.git
cd transly
```

2. **Set up Supabase**
   
   Create a new project at [supabase.com](https://supabase.com)
   
   Go to **SQL Editor** and run this:
   ```sql
   -- Enable UUID extension
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

   -- Folders table
   CREATE TABLE folders (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     name TEXT NOT NULL,
     parent_folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
   );

   -- Videos table
   CREATE TABLE videos (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
     title TEXT NOT NULL,
     filename TEXT NOT NULL,
     original_filename TEXT NOT NULL,
     size BIGINT NOT NULL,
     mimetype TEXT NOT NULL,
     storage_url TEXT NOT NULL,
     status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'completed', 'failed')),
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
   );

   -- Transcriptions table
   CREATE TABLE transcriptions (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL UNIQUE,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     text TEXT NOT NULL,
     words JSONB,
     sentences JSONB,
     language TEXT DEFAULT 'auto',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
   );

   -- Enable RLS
   ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
   ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
   ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

   -- RLS Policies for folders
   CREATE POLICY "Users can manage their own folders" ON folders FOR ALL USING (auth.uid() = user_id);

   -- RLS Policies for videos
   CREATE POLICY "Users can manage their own videos" ON videos FOR ALL USING (auth.uid() = user_id);

   -- RLS Policies for transcriptions
   CREATE POLICY "Users can manage their own transcriptions" ON transcriptions FOR ALL USING (auth.uid() = user_id);

   -- Indexes
   CREATE INDEX idx_folders_user_id ON folders(user_id);
   CREATE INDEX idx_videos_user_id ON videos(user_id);
   CREATE INDEX idx_transcriptions_video_id ON transcriptions(video_id);
   ```

   Go to **Storage** and create a public bucket named `videos`
   
   Add storage policies:
   ```sql
   -- Insert policy
   CREATE POLICY "Users can upload videos"
   ON storage.objects FOR INSERT
   WITH CHECK (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Select policy
   CREATE POLICY "Users can view videos"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);

   -- Delete policy
   CREATE POLICY "Users can delete videos"
   ON storage.objects FOR DELETE
   USING (bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text);
   ```

   Go to **Authentication > Providers** and enable **Email**

3. **Backend Setup**
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

UPLOAD_DIR=uploads
TEMP_DIR=temp
```

Start backend:
```bash
npm run dev
```

4. **Frontend Setup** (in new terminal)
```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001
```

Start frontend:
```bash
npm run dev
```

5. **Open http://localhost:3000** and start transcribing! 🎉

## 📖 Usage

1. **Register** a new account or **login**
2. **Upload** a video file (MP4, AVI, MOV, WEBM, MKV)
3. Wait for the **transcription** to process (first time takes longer as it downloads the Whisper model ~300MB)
4. **View** your video with synchronized transcription
5. **Click words** to jump to that moment
6. **Search** for specific words or phrases
7. **Export** transcription in your preferred format

## 🏗️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next (internationalization)
- Lucide Icons
- React Player

### Backend
- Node.js
- Express
- TypeScript
- @xenova/transformers (Whisper AI)
- FFmpeg
- Multer (file uploads)

### Database & Storage
- Supabase (PostgreSQL)
- Supabase Storage
- Row Level Security (RLS)

## 📁 Project Structure

```
transly/
├── backend/              # Node.js API
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Auth middleware
│   │   └── config/      # Configuration
│   └── package.json
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── contexts/    # Context providers
│   │   ├── config/      # Configuration
│   │   └── i18n/        # Translations (PT/EN)
│   └── package.json
└── supabase-schema.sql  # Database schema
```

## 🔧 Development

### Backend
```bash
cd backend
npm run dev      # Start development server
npm run build    # Build for production
npm start        # Start production server
```

### Frontend
```bash
cd frontend
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🚢 Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend on Vercel:**
1. Connect your GitHub repository
2. Set root directory to `frontend`
3. Add environment variables
4. Deploy!

**Backend on Railway:**
1. Connect your GitHub repository
2. Set root directory to `backend`
3. Add environment variables
4. Deploy!

### Option 2: VPS (Full Stack)

1. Install Node.js 18+, FFmpeg, PM2, Nginx
2. Clone repository
3. Set up backend with PM2
4. Build frontend
5. Configure Nginx
6. Set up SSL with Let's Encrypt

See detailed deployment guides in the repo.

## 🐛 Troubleshooting

### FFmpeg not found
**Windows:**
```powershell
winget install FFmpeg
```

**Mac:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

### Transcription takes too long
- First run downloads the Whisper model (~300MB)
- Use shorter videos for testing (1-2 minutes)
- Consider using OpenAI's Whisper API for faster results

### Video not playing
- Check if the `videos` bucket exists in Supabase Storage
- Verify storage policies are configured correctly
- Check browser console for CORS errors

## 🎨 Features Highlights

### Word-Level Transcription
Every word has precise timestamps:
```json
{
  "word": "hello",
  "start": 1.23,
  "end": 1.67,
  "confidence": 0.95
}
```

### Sentence Grouping
Words are intelligently grouped into sentences for better readability.

### Smart Search
Search ignores accents and case:
- "cafe" finds "café"
- "hello" finds "Hello", "HELLO", "hello"

### Export Formats
- **TXT**: Plain text transcription
- **CSV**: Word-level data with timestamps (Excel-ready)
- **DOCX**: Formatted document with timestamps

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 🙏 Acknowledgments

- [Whisper AI](https://github.com/openai/whisper) by OpenAI
- [@xenova/transformers](https://github.com/xenova/transformers.js) for browser-compatible Whisper
- [Supabase](https://supabase.com) for backend infrastructure
- [Tailwind CSS](https://tailwindcss.com) for styling

## 📞 Support

- 🐛 [Report a bug](https://github.com/yourusername/transly/issues)
- 💡 [Request a feature](https://github.com/yourusername/transly/issues)
- 📧 Email: support@transly.app

---

**Made with ❤️ for better video accessibility**

⭐ Star this repo if you find it useful!
