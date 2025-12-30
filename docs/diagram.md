YouTube Summariser - Event-Driven Architecture (ASCII)
═══════════════════════════════════════════════════════════════════════════════

                           ┌─────────────────────┐
                           │     INTERNET        │
                           │  ┌─────────────────┐│
                           │  │YouTube RSS      ││
                           │  │YouTube API      ││
                           │  └─────────────────┘│
                           └─────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────┐
                    │      YT-WORKER              │
                    │    (Node.js Poller)         │
                    │  ┌────────────────────────┐ │
                    │  │• Poll RSS every 15min │ │
                    │  │• Fetch transcripts    │ │
                    │  │• VideoDiscovered evt  │ │
                    │  └────────────────────────┘ │
                    └─────────────┬───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────┼─────────────────────────────────┐
│                                 │                                 │
│    ┌─────────────────────────┐  │  ┌─────────────────────────────┐ │
│    │         API             │◄─┼──┼─►│      AI-WORKER           │ │
│    │     (Node.js + UI)      │  │  │    (Node.js Summariser)    │ │
│    │     Port: 3000          │  │  │ ┌─────────────────────────┐│ │
│    │ ┌────────────────────┐ │  │  │ │• TranscriptReady evt    ││ │
│    │ │• POST /channels     │ │  │  │ │• Call LLM API           ││ │
│    │ │• GET /videos        │ │  │  │ │• SummaryCreated evt     ││ │
│    │ └────────────────────┘ │  │  │ └─────────────────────────┘│ │
│    └─────────────────────────┘  │  └─────────────────────────────┘ │
│             │                   │                 │                │
│             ▼                   │                 ▼                │
│    ┌─────────────────────────┐  │    ┌─────────────────────────┐ │
│    │      POSTGRES DB        │◄─┼────┼─►│      LOCAL LLM        │ │
│    │    (Event Store)        │  │    │   │     (Ollama)          │ │
│    │ ┌────────────────────┐ │  │    │   │    Port: 8000         │ │
│    │ │channels             │ │  │    │   │ ┌──────────────────┐│ │
│    │ │videos               │ │  │    │   │ │POST /v1/chat/     ││ │
│    │ │transcripts          │ │  │    │   │ │completions        ││ │
│    │ │summaries            │ │  │    │   │ └──────────────────┘│ │
│    │ │events (Event Store) │ │  │    │   └─────────────────────┘ │
│    │ └────────────────────┘ │  │    └───────────────────────────┘ │
│    └─────────────────────────┘  │                                 │
└─────────────────────────────────┴─────────────────────────────────┘

───────────────────────────────────────────────────────────────────────────────
EVENT FLOW: ChannelSubscribed → VideoDiscovered → TranscriptReady → SummaryCreated
───────────────────────────────────────────────────────────────────────────────

DOCKER SERVICES:
api          → localhost:3000 (HTTP API + React UI)
yt-worker    → Polls RSS → Writes Events
ai-worker    → Reads Events → Calls LLM → Writes Summaries
db           → Postgres 16 (5432)
llm          → Ollama (8000)

DATA MODELS:
channels     → id, youtube_id, rss_url, created_at
videos       → id, channel_id, yt_id, title, published_at
transcripts  → id, video_id, language, text
summaries    → id, video_id, abstract, bullets, model
events       → id, type, aggregate_id, payload, occurred_at
