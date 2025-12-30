# YouTube Summariser

Event-driven system that discovers YouTube videos, fetches transcripts, and generates concise AI summaries using a local or remote LLM. The project is modular and designed for local development with Docker, but components can be deployed individually.

## Table of contents
- [Quick start](#quick-start)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)
- [Usage example](#usage-example)
- [Development & testing](#development--testing)
- [Architecture & components](#architecture--components)
- [Contributing](#contributing)
- [License](#license)

## Quick start
Clone and run the whole stack with Docker Compose:

```bash
git clone <repo-url>
cd event-driven-youtube-ai-summariser-
cp .env.example .env
docker compose up -d
open http://localhost:3000
```

Optional: pull a local model for Ollama (if using Ollama):

```bash
docker exec -it <llm-container> ollama pull <model-name>
```

## Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local tooling or running services without Docker)
- Optional: `yt-dlp` or other transcript tools for higher-quality captions

## Configuration
Environment variables live in `.env` (copy from `.env.example`). Important vars:

```env
DATABASE_URL=postgres://app:app@db:5432/youtube_summariser
LLM_API_URL=http://llm:8000/v1/chat/completions
YOUTUBE_API_KEY=your_key_here       # optional
POLL_INTERVAL_MINUTES=15
```

## Usage example
Add a channel (API endpoint depends on the `api` service). Example using `curl` against a local API:

```bash
curl -X POST http://localhost:3000/channels \
   -H "Content-Type: application/json" \
   -d '{"rssUrl":"https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxx"}'
```

Check discovered videos and summaries:

```bash
curl http://localhost:3000/videos
```

## Development & testing
Run the development compose file (hot reload for services that support it):

```bash
docker compose -f docker-compose.dev.yml up
```

Inspect logs or shell into services:

```bash
docker compose logs -f api
docker compose exec api sh
```

Run unit tests for a service (example):

```bash
cd services/api
npm ci
npm test
```

## Architecture & components
High-level flow:

Internet (RSS/API) → yt-worker → Postgres (events) → ai-worker → LLM

Key services:
- `api` — HTTP API + small UI for subscriptions and viewing summaries (Port 3000)
- `yt-worker` — polls feeds, discovers videos, fetches transcripts
- `ai-worker` — produces summaries using a configured LLM
- `db` — Postgres event store and read models
- `llm` — local LLM endpoint (Ollama / Docker Model Runner)

Folder layout (top-level):

```
├── docker-compose.yml
├── services/
│   ├── api/
│   ├── yt-worker/
│   ├── ai-worker/
│   └── common/
├── migrations/
└── README.md
```

## Contributing
- Read `COPILOT_INSTRUCTIONS.md` and `.github/copilot-instructions.md` for Copilot guidance.
- Follow commit message conventions in `GIT_COMMIT_INSTRUCTIONS.md`. A local commit template is provided at `.gitmessage`.
- Add unit tests for business logic and mock external APIs when possible.

PR checklist:
- Clear description and rationale
- Tests added or updated
- Documentation updated if public behavior changed
- No secrets committed

## License
MIT — see repository root for full license text.

