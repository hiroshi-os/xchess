import type { PieceSymbol, Color, Square } from "chess.js"

export type GameMode = "pass-and-play" | "vs-computer" | "online" | "analysis"

export type BotDifficulty = 1 | 2 | 3 | 4

export interface BotConfig {
  level: BotDifficulty
  name: string
  rating: number
  description: string
  depth: number
}

export type TimeControl = {
  name: string
  initialSeconds: number // 0 for unlimited
  incrementSeconds: number
}

export interface PlayerProfile {
  id: string
  nickname: string
  createdAt: number
  stats: {
    gamesPlayed: number
    wins: number
    losses: number
    draws: number
    rating: number
  }
}

export interface MoveRecord {
  san: string
  from: Square
  to: Square
  piece: PieceSymbol
  color: Color
  captured?: PieceSymbol
  promotion?: PieceSymbol
  fen: string
  timeTaken?: number
}

export type GameResult =
  | { outcome: "checkmate"; winner: Color }
  | { outcome: "stalemate"; winner: null }
  | { outcome: "threefold_repetition"; winner: null }
  | { outcome: "insufficient_material"; winner: null }
  | { outcome: "50_move_rule"; winner: null }
  | { outcome: "timeout"; winner: Color }
  | { outcome: "resignation"; winner: Color }
  | { outcome: "draw_agreement"; winner: null }
  | null

export interface PeerMessage {
  type:
    | "ready"
    | "move"
    | "sync_state"
    | "offer_draw"
    | "accept_draw"
    | "decline_draw"
    | "resign"
    | "rematch_offer"
    | "rematch_accept"
    | "chat"
  payload?: any
}

export interface ChatMessage {
  sender: string
  text: string
  timestamp: number
  isSystem?: boolean
}
