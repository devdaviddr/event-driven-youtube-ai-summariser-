-- Initial schema for YouTube Summariser

CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_id TEXT UNIQUE,
  title TEXT,
  rss_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id),
  yt_id TEXT UNIQUE NOT NULL,
  title TEXT,
  published_at TIMESTAMP,
  duration INTERVAL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  language TEXT DEFAULT 'en',
  text TEXT,
  provider TEXT DEFAULT 'youtube',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id),
  model TEXT,
  abstract TEXT,
  bullets JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  type TEXT NOT NULL,
  payload JSONB,
  occurred_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_videos_channel_id ON videos(channel_id);