# Supabase Setup Guide for Transly

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project
4. Choose a project name (e.g., "Transly")
5. Set a strong database password
6. Select a region close to your users

## Step 2: Run the Database Schema

1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click **Run** to execute the schema

This will create:

- `folders` table
- `videos` table
- `transcriptions` table
- Row Level Security (RLS) policies
- Indexes for performance
- Updated_at triggers

## Step 3: Create Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **Create a new bucket**
3. Bucket name: `videos`
4. Public bucket: **Yes** (or configure authentication as needed)
5. Click **Create bucket**

### Configure Storage Policies

After creating the bucket, set up RLS policies for storage:

1. Click on the `videos` bucket
2. Go to **Policies**
3. Click **New Policy**

Create three policies:

**Policy 1: Users can upload their own videos**

- Policy name: `Users can upload videos`
- Allowed operation: `INSERT`
- Target roles: `authenticated`
- Policy definition:

```sql
bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 2: Users can view their own videos**

- Policy name: `Users can view videos`
- Allowed operation: `SELECT`
- Target roles: `authenticated`
- Policy definition:

```sql
bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
```

**Policy 3: Users can delete their own videos**

- Policy name: `Users can delete videos`
- Allowed operation: `DELETE`
- Target roles: `authenticated`
- Policy definition:

```sql
bucket_id = 'videos' AND (storage.foldername(name))[1] = auth.uid()::text
```

## Step 4: Get API Keys

1. Go to **Project Settings** (gear icon) > **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this secret!)

## Step 5: Configure Environment Variables

### Backend (.env)

Create `backend/.env` file:

```env
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Storage
UPLOAD_DIR=uploads
TEMP_DIR=temp

# OpenAI (optional, for Whisper API alternative)
OPENAI_API_KEY=your_openai_api_key_optional
```

### Frontend (.env)

Create `frontend/.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_API_URL=http://localhost:3001
```

## Step 6: Enable Email Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates if desired

## Step 7: (Optional) Configure Storage Limits

1. Go to **Storage** > **Policies**
2. Configure file size limits and allowed MIME types
3. For production, adjust the bucket settings:
   - Maximum file size: 500MB (or as needed)
   - Allowed MIME types: video/\*

## Step 8: Test the Setup

1. Start the backend: `cd backend && npm run dev`
2. Start the frontend: `cd frontend && npm run dev`
3. Register a new user
4. Try uploading a video
5. Check if the video appears in Supabase Storage

## Troubleshooting

### Videos not uploading

- Check if the `videos` bucket exists
- Verify storage policies are correctly set
- Check browser console for CORS errors

### Authentication issues

- Verify API keys are correct
- Check if email provider is enabled
- Look at network tab for 401/403 errors

### Database errors

- Ensure the schema was executed successfully
- Check if RLS policies are enabled
- Verify foreign key constraints

## Production Checklist

- [ ] Change `service_role` key (keep it secret!)
- [ ] Configure custom domain
- [ ] Set up email templates
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Monitor storage usage
- [ ] Configure rate limiting
- [ ] Set up error logging

## Support

For more information, visit:

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Storage Guide](https://supabase.com/docs/guides/storage)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
