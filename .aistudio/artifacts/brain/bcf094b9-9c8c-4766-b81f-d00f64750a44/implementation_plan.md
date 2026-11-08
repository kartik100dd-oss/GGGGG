# Environment Configuration & Multi-Provider API Integration

Implementation plan to configure and support environment variables (`.env` and `.env.example`) for Anthropic Claude, xAI Grok, OpenAI ChatGPT, Google Gemini, and Jitsi Meet, with zero-cost fallback resilience.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed in Phase 1 interactive clarification:
> - **Configuration Mechanism**: Standard server-side environment variables loaded via `.env` (no sensitive secrets exposed to browser client).
> - **Jitsi Meet Infrastructure**: Free public `meet.jit.si` server with room naming security and optional JaaS/custom domain support.
> - **Fallback Handling**: Seamless zero-cost fallback to built-in algorithmic intelligence personas whenever API keys are absent, quota-depleted, or rate-limited.

- **Confirmed Decision 1**: Store all 3P API keys (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `GEMINI_API_KEY`, `JITSI_DOMAIN`) in `.env` and provide a thoroughly documented `.env.example`.
- **Confirmed Decision 2**: Keep server-side API proxy routes in `server.ts` so that browser network requests never expose API keys to end users.
- **Confirmed Decision 3**: Retain offline, zero-dollar intelligence engine so that the application operates at 100% functionality even with empty keys.

---

## 1. Overview & Core Concept

- **What It Does**: Provides a structured `.env` configuration file and `.env.example` template with clear documentation for all major AI providers (Claude 3.5 Sonnet, Grok-3, ChatGPT-4o, Gemini 2.5 Flash) and Jitsi Meet video conferencing. Updates the backend server to dispatch requests directly to the respective official provider APIs when keys are present, while maintaining automatic fallback to local persona models.
- **Target Audience**: Developers, educators, and administrators self-hosting or deploying the AI RED DRAGON platform who want to plug in their own proprietary AI keys or use the default zero-cost engine.
- **Key Value**: Simple plug-and-play configuration where adding an API key instantly activates live model reasoning from OpenAI, Anthropic, or xAI without touching frontend code.

---

## 2. User Experience & Visual Design

- **Multi-AI Switcher Feedback**:
  - The Multi-AI Assistant interface displays the active model badge (`Gemini 3.8 Flash`, `ChatGPT-4o`, `Claude 3.5 Sonnet`, `Grok-3`).
  - When a live API key is active for a selected persona, the response renders with live provider attribution and web search citations.
  - When an API key is not present, the assistant displays a subtle non-blocking status indicator (`Autonomous Persona Mode ($0)`) and serves intelligent structured guidance seamlessly.
- **Jitsi Faculty Rooms**:
  - The Jitsi Meet consultation room automatically respects custom domain or room prefixes configured in `.env`, falling back cleanly to `meet.jit.si`.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Server-Side Proxies vs Client-Side Direct Calls**:
  - *Chosen Approach*: Server-side dispatch in `server.ts` via Express routes (`/api/multi-ai-chat`).
  - *Why*: In accordance with platform security constraints, third-party API keys must never be exposed to the browser client or client bundles.
  - *Alternatives Considered*: Client-side SDK calls rejected due to security and CORS restrictions.
- **Decision 2: Universal Fetch Dispatcher vs Heavy External SDKs**:
  - *Chosen Approach*: Standard `fetch` dispatcher for OpenAI, Anthropic, and xAI with proper headers and streaming/JSON responses; official `@google/genai` SDK for Gemini.
  - *Why*: Keeps dependencies lightweight and eliminates package version conflicts while ensuring standard REST API compatibility across providers.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   .env Configuration                   │
│  GEMINI_API_KEY | OPENAI_API_KEY | ANTHROPIC_API_KEY   │
│         XAI_API_KEY | JITSI_DOMAIN | APP_URL           │
└──────────────────────────┬─────────────────────────────┘
                           │ Loaded on Server Boot (dotenv)
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Express Server.ts                    │
│                 /api/multi-ai-chat                     │
│  ┌───────────────────────┬──────────────────────────┐  │
│  │ Model Router          │ Key Detection Matrix     │  │
│  ├───────────────────────┼──────────────────────────┤  │
│  │ gemini   ──► @google/genai (Search Grounding)    │  │
│  │ chatgpt  ──► api.openai.com/v1/chat/completions  │  │
│  │ claude   ──► api.anthropic.com/v1/messages       │  │
│  │ grok     ──► api.x.ai/v1/chat/completions        │  │
│  └───────────────────────┴──────────────────────────┘  │
│                          │                             │
│       Fallback Trigger   │ [If Key Missing / Error]    │
│                          ▼                             │
│        Algorithmic Zero-Cost Persona Engine            │
└──────────────────────────┬─────────────────────────────┘
                           │ JSON Response { reply, urls }
                           ▼
┌────────────────────────────────────────────────────────┐
│              React SPA Frontend (Port 3000)            │
│         MultiAiAssistant | ProfessorPortal (Jitsi)     │
└────────────────────────────────────────────────────────┘
```

### Environment Variables Matrix

| Variable | Description | Provider Endpoint / Service | Fallback Default |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google Gemini AI Key | Google DeepMind `@google/genai` | Algorithmic Gemini Persona |
| `OPENAI_API_KEY` | OpenAI ChatGPT Key | `https://api.openai.com/v1` (`gpt-4o`) | Algorithmic ChatGPT Persona |
| `ANTHROPIC_API_KEY` | Anthropic Claude Key | `https://api.anthropic.com/v1` (`claude-3-5-sonnet`) | Algorithmic Claude Persona |
| `XAI_API_KEY` | xAI Grok Key | `https://api.x.ai/v1` (`grok-2-latest`) | Algorithmic Grok Persona |
| `JITSI_DOMAIN` | Jitsi Meet Instance | `meet.jit.si` or custom domain | `meet.jit.si` |
| `JITSI_ROOM_PREFIX` | Room namespace prefix | Consultation room namespace | `AI_Red_Dragon_` |

### Step-by-Step Execution Plan

1. **Create `.env` & Update `.env.example`**:
   - Provide a complete `.env` file with placeholders and documentation for all 5 services (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `JITSI_DOMAIN`, `JITSI_ROOM_PREFIX`).
   - Sync `.env.example` with exact variable names and configuration guides.
2. **Enhance Server-Side Multi-AI Router (`server.ts`)**:
   - Add native dispatchers for OpenAI (`OPENAI_API_KEY`), Anthropic (`ANTHROPIC_API_KEY`), and xAI (`XAI_API_KEY`).
   - Include proper header formats (`x-api-key`, `anthropic-version: 2023-06-01`, `Bearer ${key}`).
   - Wrap each call in resilient error handling that falls back to the zero-dollar persona engine if the key is empty, unauthorized, or quota-exceeded.
3. **Verify Dev Server & Compilation**:
   - Verify compilation and linting with zero errors.
   - Test `/api/multi-ai-chat` with each model persona.
