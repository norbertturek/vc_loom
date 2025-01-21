-- Create transcriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS transcriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recording_id UUID NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
    start_time BIGINT NOT NULL,
    end_time BIGINT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT transcriptions_start_time_check CHECK (start_time >= 0),
    CONSTRAINT transcriptions_end_time_check CHECK (end_time >= start_time)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_transcriptions_recording_id ON transcriptions(recording_id);

-- Enable RLS
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own transcriptions" ON transcriptions;
DROP POLICY IF EXISTS "Users can view transcriptions for their recordings" ON transcriptions;
DROP POLICY IF EXISTS "Users can update transcriptions for their recordings" ON transcriptions;
DROP POLICY IF EXISTS "Users can delete transcriptions for their recordings" ON transcriptions;
DROP POLICY IF EXISTS "Anyone can view transcriptions for shared videos" ON transcriptions;

-- Create policies
CREATE POLICY "Users can insert their own transcriptions"
ON transcriptions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = transcriptions.recording_id
    AND recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view transcriptions for their recordings"
ON transcriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = transcriptions.recording_id
    AND recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update transcriptions for their recordings"
ON transcriptions FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = transcriptions.recording_id
    AND recordings.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = transcriptions.recording_id
    AND recordings.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete transcriptions for their recordings"
ON transcriptions FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM recordings
    WHERE recordings.id = transcriptions.recording_id
    AND recordings.user_id = auth.uid()
  )
);

-- Allow public access for shared videos
CREATE POLICY "Anyone can view transcriptions for shared videos"
ON transcriptions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM share_links
    WHERE share_links.recording_id = transcriptions.recording_id
    AND (share_links.expires_at IS NULL OR share_links.expires_at > NOW())
  )
); 