import { Client } from 'pg';
import axios from 'axios';
import { EventBus, TranscriptReadyEvent } from '@youtube-summariser/common';

const db = new Client(process.env.DATABASE_URL);
const llmUrl = process.env.LLM_API_URL || 'http://localhost:8000/v1/chat/completions';

async function processTranscript(event: TranscriptReadyEvent) {
  // Stub: call LLM, emit SummaryCreated
  console.log('Processing transcript for video:', event.payload.videoId);
  // TODO: implement LLM call and event emission
}

async function pollEvents() {
  // Stub: poll events table for TranscriptReady
  console.log('Polling for events...');
  // TODO: implement event polling and processing
}

async function main() {
  await db.connect();
  console.log('AI-Worker started');

  setInterval(pollEvents, 10000); // Poll every 10s for now
}

main().catch(console.error);