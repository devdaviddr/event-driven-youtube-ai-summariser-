# YouTube Summariser PRD

**Product**: Local Docker-based event-driven YouTube channel summariser  
**Version**: 1.0  
**Date**: Dec 31, 2025  
**Owner**: Senior Full-Stack Developer (Melbourne, AU)

## Problem Statement

Manual YouTube consumption is time-intensive for technical content. Developers need automated discovery, transcription, and AI summarization of subscribed channels while maintaining full privacy/control via local infrastructure.[1][2]

## Target Users

- **Primary**: Senior developers building portfolio projects (like you)
- **Secondary**: Tech enthusiasts, researchers, self-hosting hobbyists
- **Key needs**: Local-first, Docker-native, event-driven, TypeScript/Node.js stack

## Goals & Success Metrics

| Goal | Metric | Target |
|------|--------|--------|
| Process 10 channels | Videos summarized/week | 50+ |
| <5min summary latency | Time from video publish to summary | 95% within target |
| 100% local processing | External API dependency | None (RSS only) |
| Zero-cost operation | Monthly hosting cost | $0 |

## User Stories

### Core Workflow
```
As a developer, I want to subscribe to channels so I can auto-discover new videos
As a developer, I want AI summaries so I can quickly triage content  
As a developer, I want transcripts so I can search/reference full content
```

**Priority 1 (MVP)**:
1. Subscribe/unsubscribe channels via web UI
2. View latest summaries with bullet points
3. Channel health status (last polled, videos found)

**Priority 2**:
1. Filter videos by date/channel/keywords
2. Export summaries (Markdown/PDF)
3. Custom LLM prompts per channel

**Priority 3**:
1. Audio download + Whisper transcription
2. Multi-language translation
3. Mobile-responsive UI

## Functional Requirements

### 1. Channel Management
- [ ] Add channel by URL/ID → auto-fetch RSS
- [ ] List channels with stats (videos processed, last poll)
- [ ] Delete channel + cleanup data
- [ ] Validate channel before subscribe

### 2. Video Pipeline
- [ ] Poll RSS every 15min (configurable)
- [ ] Detect new videos (dedupe by video ID)
- [ ] Fetch YouTube captions (primary) or yt-dlp fallback
- [ ] Store metadata + transcript

### 3. AI Summarization
- [ ] Generate 3 formats: abstract, bullets, timestamps
- [ ] Support Ollama + OpenAI-compatible endpoints
- [ ] Retry failed summaries (3x max)
- [ ] Store raw LLM response + metadata

### 4. UI/Dashboard
```
┌─────────────┐ ┌──────────────────┐
│ Channels    │ │ Latest Summaries │
│ • Vercel    │ │ ┌──────────────┘ │
│ • Fireship  │ │ │ Fireship #127   │
│ + Add       │ │ │ 📺 React 19     │
└─────────────┘ │   • New hooks... │
                │   • Bundle size ↓ │
                └──────────────────┘
```

## Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Handle 50 channels, 10 videos/day, <5min summary latency |
| **Storage** | 1GB transcripts + summaries for 1 year |
| **Availability** | 99% uptime via Docker restart policies |
| **Privacy** | 100% local processing, no external APIs beyond RSS |
| **Scalability** | Add workers via docker-compose scale |
| **Tech Stack** | Node.js 20, Postgres 16, TypeScript, Docker Compose |

## Technical Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Internet  │───▶│ YT-Worker   │───▶│ Postgres    │───▶│ AI-Worker  │───▶│ Local LLM │
│ RSS Feeds   │    │ Node.js     │    │ Event Store │    │ Node.js    │    │ Ollama    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                         ▲                      ▲
                         └──────────────────────┼──────────────┐
                                                │              │
                                          ┌─────────────┐ ┌─────────────┐
                                          │   API/UI    │ │ React UI    │
                                          │ Node.js     │ │ Port 3000   │
                                          │ Hono        │ └─────────────┘
                                          └─────────────┘
```

**Event Types**:
- `ChannelSubscribed`
- `VideoDiscovered` 
- `TranscriptReady`
- `SummaryCreated`
- `ProcessingFailed`

## Data Models

```sql
channels: id, youtube_id, title, rss_url, created_at
videos: id, channel_id, yt_id, title, published_at, duration
transcripts: id, video_id, language, text, provider
summaries: id, video_id, model, abstract, bullets, created_at
events: id, aggregate_id, type, payload, occurred_at
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/channels` | Subscribe channel `{url, name}` |
| GET | `/channels` | List channels + stats |
| DELETE | `/channels/:id` | Unsubscribe |
| GET | `/videos` | List videos + summaries `?channelId=&since=` |
| GET | `/videos/:id` | Full video + transcript + summary |

## Implementation Phases

### Phase 1: MVP (1 weekend)
```
Week 1:
☐ docker-compose.yml + postgres
☐ common event bus library
☐ api service + basic endpoints
☐ yt-worker RSS polling
☐ Minimal Hono API
Week 2:
☐ ai-worker + ollama integration
☐ Basic React UI
☐ End-to-end testing
```

### Phase 2: Polish (1 week)
```
☐ React dashboard
☐ Error handling + retries
☐ Channel health monitoring
☐ Configurable poll intervals
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| YouTube RSS rate limits | High | Staggered polling, RSS-only |
| LLM summarization quality | Medium | Multiple models, prompt tuning |
| Transcript availability | High | Fallback to yt-dlp + Whisper |
| Postgres event backlog | Low | Worker scaling, dead letter queue |

## Dependencies

- **External**: YouTube RSS feeds (free), no API keys needed
- **Local**: Docker, Node.js 20, Ollama (or Docker Model Runner)
- **Optional**: yt-dlp for audio fallback, Whisper container

## Launch Criteria

- [ ] 5 test channels processing end-to-end
- [ ] UI shows summaries <5min after video publish
- [ ] docker-compose up works on clean Mac/Docker
- [ ] GitHub repo with README + screenshots
- [ ] Portfolio-ready demo video

## Future Enhancements

1. **Real-time**: Postgres LISTEN/NOTIFY events
2. **Advanced**: RAG over all transcripts
3. **Mobile**: React Native companion app
4. **Social**: Shareable summary links
5. **Monetization**: Cloudflare Workers SaaS version

---

