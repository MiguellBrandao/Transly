# Transly 🎬

A modern video transcription platform powered by AI. Upload videos, get automatic transcriptions with Whisper AI, and manage your content with an intuitive interface.

## Features

- 🎥 **Video Upload**: Upload and manage video files
- 🤖 **AI Transcription**: Automatic transcription using Whisper AI
- 📁 **File Manager**: Organize videos in folders with easy navigation
- ⏯️ **Smart Player**: Video player with synchronized transcription
- 🔍 **Advanced Search**: Find words in transcription (accent-insensitive)
- 📝 **Export**: Export transcriptions to TXT, CSV, or DOCX
- 🌐 **Multilingual**: Portuguese and English support
- 🌓 **Dark/Light Mode**: Comfortable viewing in any environment
- 🔐 **Authentication**: Secure login with Supabase

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- i18next (internationalization)

### Backend
- Node.js
- Express
- TypeScript
- Whisper AI (transcription)
- FFmpeg (audio extraction)

### Database & Storage
- Supabase (PostgreSQL)
- Supabase Storage (video files)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- FFmpeg installed on your system
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/transly.git
cd transly
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend folders
   - Fill in your Supabase credentials

5. Run the development servers:

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Project Structure

```
transly/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── i18n/
│   └── package.json
├── backend/           # Node.js backend API
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   └── middleware/
│   └── package.json
└── README.md
```

## License

MIT

## Author

Created with ❤️ for better video transcription

