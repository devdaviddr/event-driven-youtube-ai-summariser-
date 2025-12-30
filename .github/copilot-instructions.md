# GitHub Copilot Instructions for this Repository

This file provides context to GitHub Copilot when generating code suggestions.

## Project Context
This is an event-driven YouTube AI summariser. The project listens for events (webhooks, queue messages) and generates AI summaries of YouTube videos.

## Code Style & Conventions
- Use clear, descriptive variable and function names
- Prefer small, testable functions over large monolithic ones
- Add type hints (Python) or TypeScript types where applicable
- Include docstrings for public functions explaining purpose, parameters, and return values

## Testing Requirements
- Write unit tests for all business logic
- Mock external API calls (YouTube API, AI services)
- Test edge cases: missing video metadata, network failures, invalid URLs

## Security Reminders
- Never hard-code API keys, secrets, or credentials
- Use environment variables for configuration
- Validate and sanitize all external inputs (URLs, user data)
- Be cautious with video metadata that may contain untrusted content

## Architecture Patterns
- Keep event handlers thin - delegate to service/business logic layers
- Use dependency injection for testability
- Separate concerns: event handling, video fetching, AI processing, storage

## Error Handling
- Catch specific exceptions rather than broad try-catch blocks
- Log errors with context (video ID, event type, timestamp)
- Implement retry logic for transient failures (network, rate limits)
- Fail gracefully and return meaningful error messages

## When Suggesting Code
- Prioritize readability and maintainability over cleverness
- Include error handling in generated code
- Add TODO comments for areas that need configuration or review
- Suggest appropriate logging statements for debugging

## Commit Message Conventions
When generating commit messages, use the Conventional Commits format:

**Format**: `<type>(<scope>): <short summary>`

**Types**:
- `feat` - new feature
- `fix` - bug fix
- `docs` - documentation changes
- `style` - formatting, whitespace
- `refactor` - code restructuring
- `test` - test additions or updates
- `chore` - build, dependencies, tooling

**Examples**:
- `feat(api): add video summarization endpoint`
- `fix(worker): handle missing video metadata gracefully`
- `docs(readme): update quick start instructions`
- `test(parser): add tests for malformed URLs`

**Guidelines**:
- Keep summary under 72 characters
- Use imperative mood ("add" not "added")
- Include scope when relevant (component/module name)
- Reference issue numbers in body if applicable
