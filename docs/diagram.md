YouTube Summariser - Event-Driven Architecture (ASCII)
═══════════════════════════════════════════════════════════════════════════════

                           ┌─────────────────────┐
                           │     INTERNET        │
                           │  ┌─────────────────┐│
                           │  │YouTube RSS      ││
                           │  │(Captions fetch) ││
                           │  └─────────────────┘│
                           └─────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────┐
                    │      YT-WORKER              │
                    │    (Node.js Poller)         │
                    │  ┌────────────────────────┐ │
                    │  │• Poll RSS (≈15m cfg)  │ │
                    │  │• Fetch transcripts    │ │
                    │  │• VideoDiscovered evt  │ │
                    │  │• TranscriptReady evt  │ │
                    │  └────────────────────────┘ │
                    └─────────────┬───────────────┘
                                  │ events + transcripts
                                  ▼
┌─────────────────────────────────┼─────────────────────────────────┐
│                                 │                                 │
│    ┌─────────────────────────┐  │  ┌─────────────────────────────┐ │
│    │         API             │◄─┼──┼─►│      AI-WORKER           │ │
│    │   (HTTP + minimal UI)   │  │  │    (Summariser)            │ │
│    │   Port: 3000            │  │  │ ┌─────────────────────────┐│ │
│    │ ┌────────────────────┐ │  │  │ │• Reads TranscriptReady   ││ │
│    │ │• POST /channels     │ │  │  │ │• Calls LLM (configurable)││ │
│    │ │• GET /videos        │ │  │  │ │• SummaryCreated evt     ││ │
│    │ └────────────────────┘ │  │  │ │• ProcessingFailed evt    ││ │
│    └─────────────────────────┘  │  │ └─────────────────────────┘│ │
│             │                   │  └─────────────────────────────┘ │
│             ▼                   │                 │                │
│    ┌─────────────────────────┐  │                 ▼                │
│    │      POSTGRES DB        │◄─┼─────────────────┘                │
│    │    (Event Store + RM)   │  │                                  │
│    │ ┌────────────────────┐ │  │    ┌─────────────────────────┐ │
│    │ │channels             │ │  │    │      LOCAL LLM         │ │
│    │ │videos               │ │  │    │ (Ollama/OpenAI API)    │ │
│    │ │transcripts          │ │  │    │    Port: 8000          │ │
│    │ │summaries            │ │  │    │ ┌────────────────────┐ │ │
│    │ │events (event log)   │ │  │    │ │/v1/chat/completions│ │ │
│    │ └────────────────────┘ │  │    │ └────────────────────┘ │ │
│    └─────────────────────────┘  │    └─────────────────────────┘ │
└─────────────────────────────────┴─────────────────────────────────┘

───────────────────────────────────────────────────────────────────────────────
EVENT FLOW: ChannelSubscribed → VideoDiscovered → TranscriptReady → SummaryCreated → (ProcessingFailed on error)
───────────────────────────────────────────────────────────────────────────────

DOCKER SERVICES:
api          → localhost:3000 (HTTP API + UI)
yt-worker    → Polls RSS → Writes events + transcripts
ai-worker    → Reads events → Calls LLM → Writes summaries
db           → Postgres 16 (5432)
llm          → Ollama or OpenAI-compatible endpoint (8000)

NOTES:
- Postgres stores the durable event log and read models.
- Optional: use NOTIFY as a wake-up hint; polling remains the source of truth.
- Transcript fallback: YouTube captions primary; yt-dlp + Whisper optional.

DATA MODELS:
channels     → id, youtube_id, rss_url, title, created_at
videos       → id, channel_id, yt_id, title, published_at, duration
transcripts  → id, video_id, language, text, provider
summaries    → id, video_id, abstract, bullets, model
events       → id, type, aggregate_id, payload, occurred_at

