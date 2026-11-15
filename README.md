# xchess — Minimalist Chess in Shadcn Zinc

A high-fidelity chess web application crafted with a minimalist **shadcn/ui Zinc** dark aesthetic, inspired by Vercel's clean monochromatic design.

## Features

- **Shadcn Zinc Dark UI**: Sleek, distraction-free aesthetic with subtle emerald/amber accents, Geist typography, and custom high-contrast Staunton SVG piece artwork optimized for dark backgrounds.
- **No Login Required**: Instant play with client-side player profiles and custom nicknames persisted in `localStorage`.
- **Game Modes**:
  - **vs Computer**: Built-in minimax chess engine with Alpha-Beta pruning, piece-square positional evaluation, quiescence search, and 4 selectable difficulty levels (Novice 800, Tactician 1300, Master 1750, Grandmaster 2150).
  - **Online P2P with Friends**: Direct peer-to-peer multiplayer powered by WebRTC (PeerJS) — share a 1-click room code or invite link to play live with in-game chat, draw offers, resignations, and rematch capability without any server accounts.
  - **Pass & Play**: Local 2-player mode on the same device.
  - **Analysis**: Interactive move review and sandbox board.
- **FIDE Rules Compliant**: Full chess rule enforcement via `chess.js` (castling, en passant, pawn promotion dialog, threefold repetition, 50-move rule, stalemate, checkmate).
- **Web Audio Sound Synthesizer**: Zero-latency acoustic piece clicks, capture thuds, check chimes, and victory fanfares generated via native Web Audio API oscillators (no broken CDN audio files).
- **Real-Time Clocks & Evaluation**: Live game clocks with low-time indicators and dynamic positional evaluation bar.
- **Move History & Export**: Formatted SAN notation table with 1-click FEN and PGN clipboard export.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + PostCSS
- **Component Primitives**: shadcn/ui (`@base-ui/react`, Lucide icons, Geist font)
- **Chess Logic**: `chess.js`
- **Networking**: `peerjs` (WebRTC P2P)
- **Audio**: Web Audio API (native zero-latency synthesizer)

## Getting Started

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Production build
npm run build
```
