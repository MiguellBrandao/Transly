# Storage Configuration Guide

Transly supports two storage modes for videos:

## 🔧 Storage Options

### 1. Local Storage (Recommended for Development)

**Pros:**
- ✅ No size limits
- ✅ Free
- ✅ Fast
- ✅ Works offline
- ✅ Good for development and testing

**Cons:**
- ❌ Videos stored on your server disk
- ❌ Requires manual backup
- ❌ Not distributed (single point of failure)

**Configuration:**
```env
STORAGE_TYPE=local
VIDEOS_DIR=videos
BASE_URL=http://localhost:3001
```

Videos are stored in `backend/videos/[user-id]/[filename]` and served via Express.

### 2. Supabase Storage (Recommended for Production - Small Scale)

**Pros:**
- ✅ Distributed storage
- ✅ Automatic backups
- ✅ CDN delivery
- ✅ Better for production

**Cons:**
- ❌ 500MB limit (free tier)
- ❌ Paid plans for more storage
- ❌ Network dependency

**Configuration:**
```env
STORAGE_TYPE=supabase
```

Requires Supabase Storage bucket setup (see README).

## 🚀 Which to Choose?

### For Development/Testing:
→ Use **Local Storage** (`STORAGE_TYPE=local`)

### For Production (Small):
→ Use **Supabase Storage** (`STORAGE_TYPE=supabase`)

### For Production (Large):
→ Use **Local Storage** with:
- External storage service (AWS S3, Google Cloud Storage)
- CDN for delivery
- Regular backups

## 💡 Switching Between Storage Types

You can switch anytime by changing `STORAGE_TYPE` in `.env`:

```env
# Development
STORAGE_TYPE=local

# Production
STORAGE_TYPE=supabase
```

**Important:** Existing videos won't migrate automatically. Choose before uploading videos.

## 📁 Local Storage Directory Structure

```
backend/
└── videos/
    ├── user-id-1/
    │   ├── video1.mp4
    │   └── video2.mp4
    └── user-id-2/
        └── video3.mp4
```

Videos are automatically organized by user ID.

## 🔒 Security

Both storage types implement user isolation:
- Local: Files organized by user ID folders
- Supabase: Row-level security policies

Users can only access their own videos.

## 🎯 Best Practices

1. **Start with Local** for development
2. **Use Supabase** for small-scale production
3. **Migrate to dedicated storage** (S3, etc.) for large-scale
4. **Always backup** your videos directory if using local storage
5. **Monitor disk space** when using local storage

## 🔄 Migration (Future)

To migrate videos between storage types, you'll need to:
1. Download videos from source
2. Change `STORAGE_TYPE`
3. Re-upload videos
4. Update database `storage_url` field

(Automated migration script coming soon)

