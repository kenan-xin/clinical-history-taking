# Gemini Live API - Python SDK & React

A demonstration of the Gemini Live API using the [Google Gen AI Python SDK](https://github.com/googleapis/python-genai) for the backend and a React 19 + shadcn/ui frontend. This example shows how to build a real-time multimodal application with a robust Python backend handling the API connection.

## Quick Start

### 1. Backend Setup

Install dependencies and start the FastAPI server using `uv`:

```bash
# Create a virtual environment and install dependencies
uv venv
source .venv/bin/activate
uv pip install -r requirements.txt

# Start the server
uv run main.py
```

### 2. Frontend

The React app lives in `frontend/`. For normal use, build it once and let FastAPI serve it:

```bash
cd frontend
npm install
npm run build
```

Then open your browser and navigate to:

[http://localhost:8000](http://localhost:8000)

#### Frontend development mode

For hot reload while working on the UI, run the Vite dev server alongside the
backend — it proxies `/ws` to port 8000:

```bash
cd frontend
npm run dev   # open http://localhost:5173
```

## Features

- **Google Gen AI SDK**: Uses the official Python SDK (`google-genai`) for simplified API interaction.
- **FastAPI Backend**: Robust, async-ready web server handling WebSocket connections.
- **Real-time Streaming**: Bi-directional audio and video streaming.
- **Tool Use**: Demonstrates how to register and handle server-side tools.
- **React 19 + shadcn/ui Frontend**: Patient-facing UI built from the reference design in `design/` (mobile-first, tablet/desktop adaptive, 4 interface languages: English, 中文, Melayu, தமிழ்).

## Project Structure

```
/
├── main.py             # FastAPI server & WebSocket endpoint
├── gemini_live.py      # Gemini Live API wrapper using Gen AI SDK
├── requirements.txt    # Python dependencies
├── design/             # Reference design export (visual contract)
└── frontend/
    ├── index.html      # Vite entry
    ├── public/
    │   └── pcm-processor.js  # AudioWorklet for PCM processing
    └── src/
        ├── App.tsx           # Screen flow: start → chat → ended
        ├── hooks/
        │   ├── use-clinical-session.ts  # Session state machine (WS + media)
        │   └── use-visual-viewport.ts   # Keyboard-aware viewport fitting
        ├── lib/
        │   ├── gemini-client.ts  # WebSocket client (same wire format)
        │   ├── media-handler.ts  # Mic capture, playback, camera/screen frames
        │   └── protocol.ts       # Typed server events
        ├── i18n/                 # en / zh / ms / ta strings
        └── components/           # shadcn ui primitives + screens
```

## Configuration

You can configure the application by setting environment variables or by using a `.env` file.

**Important:** You must set the `GEMINI_API_KEY` to your Google AI Studio API key.

1.  Create a `.env` file in the root directory.
2.  Add your API key:

```env
GEMINI_API_KEY=your_api_key_here
```

Alternatively, you can set it in your shell:

```bash
export GEMINI_API_KEY=your_api_key_here
```

## Core Components

### Backend (`gemini_live.py`)

The `GeminiLive` class wraps the `genai.Client` to manage the session:

```python
# Connects using the SDK
async with self.client.aio.live.connect(model=self.model, config=config) as session:
    # Manages input/output queues
    await asyncio.gather(
        send_audio(),
        send_video(),
        receive_responses()
    )
```

### Frontend (`gemini-client.js`)

The frontend communicates with the FastAPI backend via WebSockets, sending base64-encoded media chunks and receiving audio responses.
