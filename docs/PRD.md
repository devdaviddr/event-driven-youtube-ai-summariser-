# YouTube Summariser PRD

**Product**: Local Docker-based event-driven YouTube channel summariser  
**Version**: 1.1  
**Date**: Dec 31, 2025  

## Summary
Local-first system that auto-discovers new YouTube videos on subscribed channels, fetches transcripts, and produces concise AI summaries. Runs in Docker, uses Node.js/TypeScript services, and keeps data private.

## Problem Statement
Technical content on YouTube is time-consuming to triage. Builders need automated discovery, transcription, and summarization that runs locally (privacy, cost control) with minimal manual effort.

## Target Users
- **Primary**: Senior developers building portfolio/side projects, self-hosters
- **Secondary**: Tech enthusiasts and researchers who prefer local control
- **Needs**: Local-first, Docker-native, auditable pipeline, TypeScript/Node.js stack

## Goals & Success Metrics
| Goal | Metric | Target |
|------|--------|--------|
| Cover initial set of channels | Channels processed | 10+ within week 1 |
| Timely summaries | Publish-to-summary latency | 95% < 5 minutes |
| Reliability | Successful pipeline runs | 99% of discovered videos |
| Cost/privacy | External dependencies | RSS only; no paid APIs |

## Scope
- **In**: RSS-based discovery, transcript fetch, summarization via local/compatible LLM, minimal UI for channel mgmt and viewing summaries.
- **Out (for MVP)**: Mobile app, payments/monetization, multi-tenant auth, advanced analytics, real-time webhooks from YouTube (API-key based).

## User Stories (MVP → Later)
- As a user, I subscribe/unsubscribe channels to auto-discover new videos. *(MVP)*
- As a user, I see summaries (abstract + bullets) and can open the transcript. *(MVP)*
- As a user, I see channel health (last poll, last success, failures). *(MVP)*
- As a user, I filter by channel/date/keyword. *(Post-MVP)*
- As a user, I export summaries (Markdown/PDF). *(Post-MVP)*
- As a user, I set custom prompts per channel. *(Post-MVP)*

## Functional Requirements
**Channel Management**
- Add channel by URL/ID; validate before storing.
- List channels with stats: last poll time, videos discovered, failures.
- Unsubscribe channel and optionally prune stored data.

**Video Pipeline**
- Poll RSS on interval (default 15m; configurable env).
- Detect new videos (dedupe by video ID) and persist metadata.
- Fetch captions (YouTube) with yt-dlp + Whisper fallback.
- Store transcript and metadata; mark transcript source.

**AI Summarization**
- Generate summary formats: abstract + bullets; timestamps optional.
- Support Ollama and OpenAI-compatible endpoints (configurable URL/model).
- Retry transient failures up to 3x; emit failure events with reason.
- Store raw LLM payload, prompt/version for auditability.

**UI / Dashboard**
- View channels and health indicators.
- View latest videos with summary and link to transcript.
- Simple filters: channel and date range (MVP minimal).

## Non-Functional Requirements
| Category | Requirement |
|----------|-------------|
| Performance | 50 channels, 10 videos/day each; 95% summaries <5 min |
| Reliability | Auto-restart via Docker; retries on fetch/summarize |
| Storage | ~1 GB transcripts/summaries for 1 year retained |
| Privacy | Local processing; only RSS/network fetches to YouTube and model endpoint |
| Operability | Structured logs; health endpoints per service; basic metrics (poll counts, failures) |
| Security | No secrets in code; env-based secrets; validate URLs to avoid SSRF |

## Architecture (logical)
```
Internet (RSS/API) → yt-worker → Postgres (events) → ai-worker → LLM
                                             ↑
                                       API/UI (3000)
```

Event types: `ChannelSubscribed`, `VideoDiscovered`, `TranscriptReady`, `SummaryCreated`, `ProcessingFailed`.

## Data Models (simplified)
```sql
channels(id, youtube_id, title, rss_url, created_at)
videos(id, channel_id, yt_id, title, published_at, duration)
transcripts(id, video_id, language, text, provider)
summaries(id, video_id, model, abstract, bullets, created_at)
events(id, aggregate_id, type, payload, occurred_at)
```

## API Surface (MVP)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/channels` | Subscribe `{url}` (auto-derive title if possible) |
| GET | `/channels` | List channels + stats |
| DELETE | `/channels/:id` | Unsubscribe |
| GET | `/videos` | List with summaries; query: `channelId`, `since` |
| GET | `/videos/:id` | Video detail with transcript + summary |

## Launch Criteria (MVP)
- 5–10 test channels processed end-to-end.
- UI shows summaries under 5 minutes from publish (95th percentile).
- `docker compose up` works on a clean Mac with Docker Desktop.
- Basic screenshots or short demo recording.
- No secrets checked in; `.env.example` provided.

## Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| RSS rate limits or gaps | Medium | Staggered polling, backoff, small channel sets |
| Caption unavailability | High | yt-dlp + Whisper fallback; mark source in UI |
| LLM quality variance | Medium | Configurable model/prompt; allow retry/regenerate |
| Event backlog growth | Low | Worker scaling; visibility via metrics/logs |

## Open Questions
- Do we need per-channel custom prompts in MVP?
- Minimum acceptable transcript quality for publish?
- Should summaries be regenerated when model/prompt changes?

## Phases
**Phase 1 (MVP, ~1 weekend)**
- docker-compose + Postgres
- common event bus
- api service endpoints
- yt-worker RSS polling + caption fetch
- ai-worker with Ollama/OpenAI-compatible client
- Minimal UI (channels list, recent summaries)

**Phase 2 (Polish, ~1 week)**
- UI filters and health indicators
- Error handling surfacing in UI
- Configurable poll intervals per channel
- Export summaries (Markdown)

**Future**
- Real-time via LISTEN/NOTIFY
- RAG over transcripts
- Mobile-friendly UI / app
- Shareable links and auth

