import { Chess, type Move, type PieceSymbol } from "chess.js"
import type { BotConfig, BotDifficulty } from "@/types/chess"

export const BOT_CONFIGS: Record<BotDifficulty, BotConfig> = {
  1: {
    level: 1,
    name: "Novice Bot",
    rating: 800,
    description: "Casual play with occasional oversights. Great for warming up.",
    depth: 1,
  },
  2: {
    level: 2,
    name: "Tactician",
    rating: 1300,
    description: "Solid tactical play with basic piece positioning.",
    depth: 2,
  },
  3: {
    level: 3,
    name: "Master AI",
    rating: 1750,
    description: "Deep positional awareness and tactical calculation.",
    depth: 3,
  },
  4: {
    level: 4,
    name: "Grandmaster",
    rating: 2150,
    description: "Deep minimax alpha-beta pruning with quiescence search.",
    depth: 4,
  },
}

// Piece base values (Centipawns)
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
}

// Piece-Square Tables (White perspective, flipped for black)
// High values encourage central control, piece development, king safety
const PAWN_PST: number[] = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
]

const KNIGHT_PST: number[] = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
]

const BISHOP_PST: number[] = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
]

const ROOK_PST: number[] = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0
]

const QUEEN_PST: number[] = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
]

const KING_MIDGAME_PST: number[] = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
]

function getPieceSquareValue(piece: PieceSymbol, squareIndex: number, isWhite: boolean): number {
  // If black, mirror row index
  const index = isWhite ? squareIndex : (7 - Math.floor(squareIndex / 8)) * 8 + (squareIndex % 8)

  switch (piece) {
    case "p":
      return PAWN_PST[index] || 0
    case "n":
      return KNIGHT_PST[index] || 0
    case "b":
      return BISHOP_PST[index] || 0
    case "r":
      return ROOK_PST[index] || 0
    case "q":
      return QUEEN_PST[index] || 0
    case "k":
      return KING_MIDGAME_PST[index] || 0
    default:
      return 0
  }
}

/**
 * Static board evaluation in centipawns from White's perspective (+ is white advantage, - is black advantage)
 */
export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === "w" ? -99999 : 99999
  }
  if (game.isDraw()) {
    return 0
  }

  let score = 0
  const board = game.board()

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (piece) {
        const squareIndex = r * 8 + c
        const isWhite = piece.color === "w"
        const material = PIECE_VALUES[piece.type]
        const positional = getPieceSquareValue(piece.type, squareIndex, isWhite)
        const total = material + positional

        if (isWhite) {
          score += total
        } else {
          score -= total
        }
      }
    }
  }

  return score
}

// Order moves to optimize alpha-beta pruning (captures and promotions first)
function orderMoves(moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    let scoreA = 0
    let scoreB = 0

    if (a.captured) {
      scoreA += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0)
    }
    if (a.promotion) {
      scoreA += 900
    }

    if (b.captured) {
      scoreB += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0)
    }
    if (b.promotion) {
      scoreB += 900
    }

    return scoreB - scoreA
  })
}

// Quiescence search for unstable capture positions
function quiescence(game: Chess, alpha: number, beta: number, maxDepth: number = 2): number {
  const standPat = evaluateBoard(game)
  const isWhite = game.turn() === "w"

  if (maxDepth === 0) return standPat

  if (isWhite) {
    if (standPat >= beta) return beta
    if (alpha < standPat) alpha = standPat
  } else {
    if (standPat <= alpha) return alpha
    if (beta > standPat) beta = standPat
  }

  // Only examine captures in quiescence
  const captureMoves = game.moves({ verbose: true }).filter((m) => !!m.captured)
  const ordered = orderMoves(captureMoves)

  for (const move of ordered) {
    game.move(move)
    const score = quiescence(game, alpha, beta, maxDepth - 1)
    game.undo()

    if (isWhite) {
      if (score >= beta) return beta
      if (score > alpha) alpha = score
    } else {
      if (score <= alpha) return alpha
      if (score < beta) beta = score
    }
  }

  return isWhite ? alpha : beta
}

// Alpha-Beta Minimax
function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    return quiescence(game, alpha, beta, 1)
  }

  const moves = orderMoves(game.moves({ verbose: true }))

  if (isMaximizing) {
    let maxEval = -Infinity
    for (const move of moves) {
      game.move(move)
      const evaluation = minimax(game, depth - 1, alpha, beta, false)
      game.undo()
      maxEval = Math.max(maxEval, evaluation)
      alpha = Math.max(alpha, evaluation)
      if (beta <= alpha) break
    }
    return maxEval
  } else {
    let minEval = Infinity
    for (const move of moves) {
      game.move(move)
      const evaluation = minimax(game, depth - 1, alpha, beta, true)
      game.undo()
      minEval = Math.min(minEval, evaluation)
      beta = Math.min(beta, evaluation)
      if (beta <= alpha) break
    }
    return minEval
  }
}

/**
 * Finds the optimal move for the current position given difficulty level
 */
export async function getBestBotMove(
  game: Chess,
  difficulty: BotDifficulty
): Promise<Move | null> {
  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  // Add realistic human calculation delay (400ms - 800ms)
  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 350) + 400))

  const isWhite = game.turn() === "w"

  // Level 1: Beginner with 35% chance of random move, otherwise shallow eval
  if (difficulty === 1) {
    if (Math.random() < 0.35) {
      return moves[Math.floor(Math.random() * moves.length)]
    }
  }

  const depth = BOT_CONFIGS[difficulty].depth
  const orderedMoves = orderMoves(moves)

  let bestMove: Move | null = null
  let bestScore = isWhite ? -Infinity : Infinity

  let alpha = -Infinity
  let beta = Infinity

  for (const move of orderedMoves) {
    game.move(move)
    const score = minimax(game, depth - 1, alpha, beta, !isWhite)
    game.undo()

    if (isWhite) {
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
      alpha = Math.max(alpha, score)
    } else {
      if (score < bestScore) {
        bestScore = score
        bestMove = move
      }
      beta = Math.min(beta, score)
    }
  }

  return bestMove || moves[0]
}
