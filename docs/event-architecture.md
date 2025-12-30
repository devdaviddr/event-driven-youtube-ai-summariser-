# Event Architecture

This doc explains how the event-driven pipeline works, the responsibilities of each service, and how events are transported, stored, and retried.

## Goals
- Durable, replayable event log (Postgres) for discovery → transcript → summary.
- Low-latency signaling with optional NOTIFY; polling remains the source of truth.
- Clear contracts for event payloads to keep workers independent and testable.

## Components & Responsibilities
- **yt-worker**: polls RSS, detects new videos, fetches captions; emits `VideoDiscovered` and `TranscriptReady`.
- **ai-worker**: consumes transcript-ready events; calls LLM; emits `SummaryCreated` or `ProcessingFailed`.
- **api**: accepts channel subscriptions, reads projections (channels/videos/summaries), triggers `ChannelSubscribed`.
- **db (Postgres)**: stores durable event log and read models (channels, videos, transcripts, summaries).
- **llm**: Ollama or OpenAI-compatible endpoint; stateless, invoked by ai-worker.

## Transport & Durability
- **Event log**: Postgres `events` table, append-only. Consumers read by increasing `id` (or timestamp) with checkpoints.
- **Signaling**: optional `LISTEN/NOTIFY` as a wake-up hint; workers still poll to avoid missed messages.
- **At-least-once**: consumers must be idempotent (see below) and tolerate replays.

## Event Flow (MVP)
1. `ChannelSubscribed` (api) → channel row + event.
2. `VideoDiscovered` (yt-worker) → video metadata persisted.
3. `TranscriptReady` (yt-worker) → transcript stored, payload marks provider.
4. `SummaryCreated` (ai-worker) → summary stored; UI reads projection.
5. `ProcessingFailed` (ai-worker) → failure reason logged; surfaced in UI/metrics.

## Event Schemas (proposed)
```json
// ChannelSubscribed
{
  "type": "ChannelSubscribed",
  "channelId": "uuid",
  "rssUrl": "https://...",
  "title": "string",
  "occurredAt": "2025-01-01T00:00:00Z"
}

// VideoDiscovered
{
  "type": "VideoDiscovered",
  "videoId": "uuid",
  "channelId": "uuid",
  "ytId": "string",
  "title": "string",
  "publishedAt": "ISO-8601",
  "occurredAt": "2025-01-01T00:00:00Z"
}

// TranscriptReady
{
  "type": "TranscriptReady",
  "videoId": "uuid",
  "channelId": "uuid",
  "language": "en",
  "provider": "youtube|yt-dlp|whisper",
  "textLocation": "transcripts/{videoId}.txt", // or inline length-safe field
  "occurredAt": "2025-01-01T00:00:00Z"
}

// SummaryCreated
{
  "type": "SummaryCreated",
  "videoId": "uuid",
  "channelId": "uuid",
  "model": "llama3:8b",
  "abstract": "...",
  "bullets": ["..."],
  "occurredAt": "2025-01-01T00:00:00Z"
}

// ProcessingFailed
{
  "type": "ProcessingFailed",
  "videoId": "uuid",
  "stage": "transcript|summary",
  "reason": "LLM timeout" ,
  "occurredAt": "2025-01-01T00:00:00Z"
}
```

## Ordering, Idempotency, and Retries
- **Ordering**: single-writer per aggregate keeps events naturally ordered; consumers sort by event `id`.
- **Idempotency**: consumers upsert by natural keys (`videoId`, `channelId`) and skip work if the same event is replayed.
- **Retries**: transient failures retried with backoff (e.g., 3 attempts) before emitting `ProcessingFailed`.
- **DLQ**: not mandatory for MVP; failed events are persisted as `ProcessingFailed` for visibility.

## Polling & Wake-up Strategy
- Poll interval default: 15 minutes; make it configurable via env.
- Optional `NOTIFY events_new` after insert to wake listeners; listeners still poll if no notify arrives.

## Projections (Read Models)
- `channels`, `videos`, `transcripts`, `summaries` tables act as projections for fast queries.
- Rebuild strategy: replay `events` table in order to regenerate projections if needed.

## Observability
- Logs include `channelId`, `videoId`, `eventType`, and duration for fetch/summarize steps.
- Counters: videos discovered, transcripts fetched, summaries created, failures by reason.
- Latency: publish-to-summary p95 as a key SLO.

## Local Development Notes
- Bring up stack: `docker compose up -d`.
- Develop a worker: run only the target service + db; point to local Postgres; seed channels manually.
- Tests: mock LLM and RSS; emit fixture events into Postgres to validate handlers.

## Security & Privacy
- No secrets in events; use IDs/locations for large or sensitive payloads.
- Validate URLs on subscribe to avoid SSRF.
- Keep processing local (RSS + chosen LLM endpoint) per PRD goals.
