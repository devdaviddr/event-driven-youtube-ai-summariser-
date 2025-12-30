import { config } from 'dotenv';
config({ path: '../../.env' });
import Parser from 'rss-parser';
import { YoutubeTranscript } from 'youtube-transcript-plus';
import { VideoDiscoveredEvent, TranscriptReadyEvent } from '@youtube-summariser/common';

const parser = new Parser();
const pollInterval = parseInt(process.env.POLL_INTERVAL_MINUTES || '15') * 60 * 1000;
const testChannelRss = process.env.TEST_CHANNEL_RSS;
const rssChannelId = extractChannelIdFromUrl(testChannelRss || '');

if (!testChannelRss) {
  console.error('TEST_CHANNEL_RSS not set in environment');
  process.exit(1);
}

// Track processed video IDs to avoid duplicates
const processedVideos = new Set<string>();

async function pollChannel() {
  try {
    console.log(`Polling channel: ${testChannelRss}`);
    
    // Parse RSS feed
    const feed = await parser.parseURL(testChannelRss!);
    
    console.log(`Found ${feed.items?.length || 0} videos in feed`);
    
    for (const item of feed.items || []) {
      const ytId = item.id || item.link?.split('v=')[1] || item.guid;
      
      if (!ytId) {
        console.warn('Could not extract video ID from item:', item.title);
        continue;
      }
      
      if (processedVideos.has(ytId)) {
        console.log(`Skipping already processed video: ${ytId}`);
        continue;
      }
      
      console.log(`Discovered new video: ${item.title} (${ytId}) from channel ${feed.title || rssChannelId || 'unknown-channel'}`);
      
      // Mark as processed
      processedVideos.add(ytId);
      
      // Emit VideoDiscovered event (for now, just log)
      const videoDiscoveredEvent: VideoDiscoveredEvent = {
        id: `event-${Date.now()}-${ytId}`,
        type: 'VideoDiscovered',
        aggregateId: ytId,
        payload: {
          videoId: ytId, // Using ytId as videoId for now
          channelId: rssChannelId || 'test-channel',
          ytId,
          title: item.title || 'Unknown',
          publishedAt: item.pubDate || item.published || new Date().toISOString()
        },
        occurredAt: new Date().toISOString()
      };
      
      console.log('VideoDiscovered event:', JSON.stringify(videoDiscoveredEvent, null, 2));
      
      // TODO: Fetch transcript and emit TranscriptReady
      const transcript = await fetchTranscript(ytId);
      if (transcript) {
        const transcriptReadyEvent: TranscriptReadyEvent = {
          id: `event-${Date.now()}-${ytId}-transcript`,
          type: 'TranscriptReady',
          aggregateId: ytId,
          payload: {
            videoId: ytId,
            channelId: 'test-channel',
            language: 'en',
            provider: 'youtube',
            text: transcript
          },
          occurredAt: new Date().toISOString()
        };
        
        console.log('TranscriptReady event:', JSON.stringify(transcriptReadyEvent, null, 2));
      }
    }
  } catch (error) {
    console.error('Error polling channel:', error);
  }
}

async function fetchTranscript(ytId: string): Promise<string | null> {
  // Extract video ID from yt:video:VIDEO_ID format
  const videoId = ytId.replace('yt:video:', '');
  
  try {
    console.log(`Fetching transcript for video ${videoId} via youtube-transcript-plus...`);
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (transcriptItems && transcriptItems.length > 0) {
      const fullText = transcriptItems.map(item => item.text).join(' ');
      console.log(`Fetched transcript with ${transcriptItems.length} segments (${fullText.length} characters)`);
      return fullText;
    }
    
    console.log(`No transcript available via youtube-transcript-plus for video ${videoId}`);
  } catch (error) {
    console.warn(`youtube-transcript-plus failed for ${videoId}:`, error);
  }
  
  console.log(`No transcript available for video ${videoId}`);
  return null;
}

function extractChannelIdFromUrl(rssUrl: string): string | null {
  if (!rssUrl) return null;
  try {
    const url = new URL(rssUrl);
    const byChannel = url.searchParams.get('channel_id');
    if (byChannel) return byChannel;
    // Handle playlist-based feeds (not common here) or user-based feeds
    const parts = url.pathname.split('/').filter(Boolean);
    // e.g., /feeds/videos.xml?channel_id=UC... already handled; for /playlist?list=... return null
    if (parts.length > 0) {
      return parts[parts.length - 1];
    }
  } catch (_) {
    return null;
  }
  return null;
}

async function main() {
  console.log('YT-Worker started (no DB mode)');
  console.log(`Polling interval: ${pollInterval / 1000 / 60} minutes`);
  console.log(`Test channel RSS: ${testChannelRss}`);
  
  // Initial poll
  await pollChannel();
  
  // Set up polling interval
  setInterval(pollChannel, pollInterval);
}

main().catch(console.error);
