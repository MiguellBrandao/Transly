# Video Compression Guide 🗜️

## How It Works

The Transly platform includes **client-side video compression** using FFmpeg.wasm. This means videos are compressed **in your browser** before being uploaded to the server.

### Benefits

- ⚡ **Faster uploads** - A 3GB video can be compressed to <100MB before upload
- 💰 **Saves bandwidth** - Both for you and the server
- 🖥️ **No server load** - All compression happens on your machine
- 🎚️ **Configurable** - Adjust quality vs file size

### How Compression Works

1. You select a video file
2. If the file is larger than the threshold (default: 100MB), compression starts automatically
3. FFmpeg.wasm loads in your browser from a CDN
4. The video is compressed using H.264 codec
5. The compressed video is uploaded to the server
6. Original quality audio is extracted from the uploaded video for best transcription results

## Configuration

### Frontend Environment Variables

Edit `frontend/.env`:

```env
# Compress videos larger than this size (in MB)
VITE_COMPRESSION_THRESHOLD_MB=100

# Compression quality settings
VITE_VIDEO_RESOLUTION=640     # 480, 640, 720, or 1080
VITE_VIDEO_BITRATE=200k       # 150k, 200k, 300k, or 500k
VITE_AUDIO_BITRATE=96k        # 64k, 96k, or 128k
```

### Quality Presets

**Fast & Small** (for very large files):
```env
VITE_VIDEO_RESOLUTION=480
VITE_VIDEO_BITRATE=150k
VITE_AUDIO_BITRATE=64k
```

**Balanced** (recommended):
```env
VITE_VIDEO_RESOLUTION=640
VITE_VIDEO_BITRATE=200k
VITE_AUDIO_BITRATE=96k
```

**Better Quality**:
```env
VITE_VIDEO_RESOLUTION=720
VITE_VIDEO_BITRATE=300k
VITE_AUDIO_BITRATE=128k
```

## Troubleshooting

### Compression Fails in Development

**Symptom**: Error message "failed to import ffmpeg-core.js"

**Cause**: FFmpeg.wasm requires `SharedArrayBuffer`, which needs specific CORS headers. These headers don't always work correctly in local development.

**Solutions**:

1. **Use a different browser**:
   - Chrome/Edge: Usually works best
   - Firefox: May require enabling SharedArrayBuffer in `about:config`
   - Safari: Limited support

2. **Test in production**:
   - The compression works better when deployed with proper server headers
   - In development, it's normal for compression to fail sometimes

3. **Disable compression for testing**:
   - Set `VITE_COMPRESSION_THRESHOLD_MB=999999` to disable compression
   - Videos will upload without compression (slower for large files)

4. **Check browser console**:
   - The service tries multiple CDN sources automatically
   - Check which CDN is being used or why they're all failing

### Compression is Too Slow

**Symptom**: Compression takes a long time

**Cause**: FFmpeg.wasm runs in the browser, which is slower than native FFmpeg

**Solutions**:

1. **Increase bitrate** (faster compression, larger files):
   ```env
   VITE_VIDEO_BITRATE=300k
   ```

2. **Lower resolution** (faster compression, smaller files):
   ```env
   VITE_VIDEO_RESOLUTION=480
   ```

3. **Upload smaller videos** for testing

### File is Still Too Large After Compression

**Symptom**: Compressed file is still very large

**Cause**: Settings are too high quality

**Solutions**:

1. **Lower the resolution**:
   ```env
   VITE_VIDEO_RESOLUTION=480
   ```

2. **Reduce bitrate**:
   ```env
   VITE_VIDEO_BITRATE=150k
   VITE_AUDIO_BITRATE=64k
   ```

3. **Check original video**:
   - Some videos are already compressed and won't compress much more
   - Videos with lots of detail/motion compress less than static videos

## Browser Compatibility

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 92+ | ✅ Full | Recommended |
| Edge 92+ | ✅ Full | Recommended |
| Firefox 89+ | ⚠️ Partial | May need manual enable |
| Safari 15.2+ | ⚠️ Partial | Limited support |
| Opera 78+ | ✅ Full | Works well |

## Production Deployment

When deploying to production, make sure your server sends these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

### Example: Nginx

```nginx
location / {
    add_header Cross-Origin-Opener-Policy same-origin;
    add_header Cross-Origin-Embedder-Policy require-corp;
}
```

### Example: Vercel

Create `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Opener-Policy",
          "value": "same-origin"
        },
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        }
      ]
    }
  ]
}
```

### Example: Netlify

Create `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Cross-Origin-Opener-Policy = "same-origin"
    Cross-Origin-Embedder-Policy = "require-corp"
```

## Fallback Behavior

**Important**: If compression fails for any reason, the system automatically falls back to uploading the original file without compression. This ensures the upload always works, even if compression is unavailable.

You'll see a warning in the console:
```
⚠️ Compression failed, uploading original file
💡 This is normal if FFmpeg.wasm cannot load in your browser.
💡 The video will be uploaded without compression.
```

## Technical Details

### Compression Settings

The compression uses these FFmpeg parameters:

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 \          # H.264 video codec
  -preset fast \          # Compression speed
  -crf 28 \              # Quality (0-51, lower is better)
  -vf scale=640:-2 \     # Scale to 640px width, maintain aspect ratio
  -b:v 200k \            # Video bitrate
  -c:a aac \             # AAC audio codec
  -b:a 96k \             # Audio bitrate
  -movflags +faststart \ # Enable streaming
  output.mp4
```

### CDN Sources

The service tries to load FFmpeg from multiple CDNs in order:

1. unpkg.com (version 0.12.6)
2. unpkg.com (version 0.12.4) - fallback for compatibility
3. jsdelivr.net (version 0.12.6) - alternative CDN

If one CDN fails, it automatically tries the next one.

## FAQ

**Q: Why is compression done in the browser instead of the server?**  
A: Client-side compression saves server resources and bandwidth. It also means the compressed file is uploaded faster.

**Q: Does compression affect transcription quality?**  
A: No! The audio is extracted from the original uploaded file before compression for the best transcription results.

**Q: Can I disable compression?**  
A: Yes, set `VITE_COMPRESSION_THRESHOLD_MB=999999` to disable it, or keep it for files under 100MB.

**Q: What happens if my browser doesn't support FFmpeg.wasm?**  
A: The system automatically uploads the original file without compression. Everything still works, just slower for large files.

**Q: Why does compression take so long?**  
A: FFmpeg.wasm runs in JavaScript in the browser, which is slower than native FFmpeg. For a 3GB video, it might take 5-10 minutes depending on your computer.

**Q: Can I use my own FFmpeg server instead?**  
A: Not currently, but this could be added as a feature. The advantage of client-side compression is zero server load.

## Performance Tips

1. **Use Chrome/Edge** for best FFmpeg.wasm performance
2. **Close other tabs** while compressing to free up memory
3. **Use wired internet** for uploading large files
4. **Test with small videos** first (1-2 minutes)
5. **Lower quality settings** if compression is too slow
6. **Compress locally** with native FFmpeg if you prefer, then upload the compressed file

---

**Need help?** Open an issue on GitHub with your browser version and console logs.

