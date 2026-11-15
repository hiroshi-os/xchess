import { useState, useRef, useEffect, useCallback } from "react"
import { Chess, type Square, type PieceSymbol, type Color } from "chess.js"
import type { GameMode, BotDifficulty, GameResult, MoveRecord } from "@/types/chess"
import { sounds } from "@/lib/audio"
import { evaluateBoard, getBestBotMove } from "@/lib/engine"
import { recordGameResult } from "@/lib/storage"

interface UseChessGameProps {
  initialMode?: GameMode
  initialDifficulty?: BotDifficulty
  initialTimeMinutes?: number // 0 for unlimited, 1, 3, 5, 10
  playerColor?: Color // For vs-computer or online
  onMoveMade?: (move: { from: string; to: string; promotion?: string }) => void
}

export function useChessGame({
  initialMode = "vs-computer",
  initialDifficulty = 2,
  initialTimeMinutes = 5,
  playerColor = "w",
  onMoveMade,
}: UseChessGameProps = {}) {
  const [chess] = useState<Chess>(() => new Chess())
  const [fen, setFen] = useState<string>(() => chess.fen())
  const [gameMode, setGameMode] = useState<GameMode>(initialMode)
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(initialDifficulty)
  const [userColor, setUserColor] = useState<Color>(playerColor)
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false)

  // Selection & Interaction
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null)
  const [legalMoves, setLegalMoves] = useState<Square[]>([])
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null)
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null)

  // History & Evaluation
  const [moveHistory, setMoveHistory] = useState<MoveRecord[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState<number>(-1)
  const [evalScore, setEvalScore] = useState<number>(0)
  const [gameResult, setGameResult] = useState<GameResult>(null)

  // Clocks (seconds remaining)
  const initialSeconds = initialTimeMinutes * 60
  const [whiteTime, setWhiteTime] = useState<number>(initialSeconds)
  const [blackTime, setBlackTime] = useState<number>(initialSeconds)
  const timerRef = useRef<number | null>(null)

  // Check state helper
  const isCheck = chess.inCheck()
  const currentTurn = chess.turn()

  // Find King square if in check
  const getCheckedKingSquare = useCallback((): Square | null => {
    if (!chess.inCheck()) return null
    const board = chess.board()
    const targetTurn = chess.turn()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (piece && piece.type === "k" && piece.color === targetTurn) {
          const file = String.fromCharCode(97 + c)
          const rank = 8 - r
          return `${file}${rank}` as Square
        }
      }
    }
    return null
  }, [chess])

  const checkedKingSquare = getCheckedKingSquare()

  // Captured pieces and material differential
  const getCapturedPieces = useCallback(() => {
    const pieces: { w: PieceSymbol[]; b: PieceSymbol[]; advantage: number } = {
      w: [],
      b: [],
      advantage: 0,
    }

    const counts: Record<Color, Record<PieceSymbol, number>> = {
      w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
      b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    }

    const initialCounts: Record<PieceSymbol, number> = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    }

    const board = chess.board()
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c]
        if (piece) {
          counts[piece.color][piece.type]++
        }
      }
    }

    // Pieces captured by White (meaning Black lost them)
    const pieceOrder: PieceSymbol[] = ["q", "r", "b", "n", "p"]
    const values: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 }
    let whiteMaterial = 0
    let blackMaterial = 0

    pieceOrder.forEach((type) => {
      const missingBlack = initialCounts[type] - counts.b[type]
      for (let i = 0; i < missingBlack; i++) {
        pieces.w.push(type)
      }

      const missingWhite = initialCounts[type] - counts.w[type]
      for (let i = 0; i < missingWhite; i++) {
        pieces.b.push(type)
      }

      whiteMaterial += counts.w[type] * values[type]
      blackMaterial += counts.b[type] * values[type]
    })

    pieces.advantage = whiteMaterial - blackMaterial
    return pieces
  }, [chess])

  // Check Game Result
  const evaluateGameEnd = useCallback(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "b" : "w"
      setGameResult({ outcome: "checkmate", winner })
      if (winner === userColor) {
        sounds.playVictory()
        recordGameResult("win")
      } else {
        sounds.playDefeat()
        recordGameResult("loss")
      }
      return true
    }
    if (chess.isStalemate()) {
      setGameResult({ outcome: "stalemate", winner: null })
      sounds.playDefeat()
      recordGameResult("draw")
      return true
    }
    if (chess.isThreefoldRepetition()) {
      setGameResult({ outcome: "threefold_repetition", winner: null })
      sounds.playDefeat()
      recordGameResult("draw")
      return true
    }
    if (chess.isInsufficientMaterial()) {
      setGameResult({ outcome: "insufficient_material", winner: null })
      sounds.playDefeat()
      recordGameResult("draw")
      return true
    }
    return false
  }, [chess, userColor])

  // Timer Tick
  useEffect(() => {
    if (initialSeconds === 0 || gameResult) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    timerRef.current = window.setInterval(() => {
      if (chess.turn() === "w") {
        setWhiteTime((prev) => {
          if (prev <= 1) {
            setGameResult({ outcome: "timeout", winner: "b" })
            sounds.playDefeat()
            return 0
          }
          return prev - 1
        })
      } else {
        setBlackTime((prev) => {
          if (prev <= 1) {
            setGameResult({ outcome: "timeout", winner: "w" })
            sounds.playDefeat()
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [chess, gameResult, initialSeconds])

  // Make Move
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece: PieceSymbol = "q") => {
      try {
        const move = chess.move({
          from,
          to,
          promotion: promotionPiece,
        })

        if (!move) return false

        // Sound triggers
        if (chess.inCheck()) {
          sounds.playCheck()
        } else if (move.captured) {
          sounds.playCapture()
        } else if (move.san.includes("O-O")) {
          sounds.playCastle()
        } else {
          sounds.playMove()
        }

        setFen(chess.fen())
        setLastMove({ from, to })
        setSelectedSquare(null)
        setLegalMoves([])
        setEvalScore(evaluateBoard(chess))

        // Record history
        const newRecord: MoveRecord = {
          san: move.san,
          from,
          to,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
          fen: chess.fen(),
        }

        setMoveHistory((prev) => [...prev, newRecord])
        setCurrentHistoryIndex((prev) => prev + 1)

        // Notify callback (e.g. for peer connection)
        onMoveMade?.({ from, to, promotion: move.promotion })

        evaluateGameEnd()
        return true
      } catch (err) {
        return false
      }
    },
    [chess, evaluateGameEnd, onMoveMade]
  )

  // Bot Turn Trigger
  useEffect(() => {
    if (
      gameMode === "vs-computer" &&
      chess.turn() !== userColor &&
      !chess.isGameOver() &&
      !gameResult
    ) {
      let cancelled = false
      setIsBotThinking(true)

      getBestBotMove(chess, botDifficulty).then((botMove) => {
        if (!cancelled && botMove) {
          executeMove(botMove.from as Square, botMove.to as Square, (botMove.promotion as PieceSymbol) || "q")
        }
        setIsBotThinking(false)
      })

      return () => {
        cancelled = true
        setIsBotThinking(false)
      }
    }
  }, [botDifficulty, chess, currentTurn, executeMove, gameMode, gameResult, userColor])

  // Square Click handler
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (gameResult) return

      // In vs-computer, lock user to userColor
      if (gameMode === "vs-computer" && chess.turn() !== userColor) {
        return
      }

      // If a square is already selected
      if (selectedSquare) {
        // If clicking on same square, deselect
        if (selectedSquare === square) {
          setSelectedSquare(null)
          setLegalMoves([])
          return
        }

        // Check if destination is a legal move
        if (legalMoves.includes(square)) {
          // Check for Pawn Promotion (White to 8th rank, Black to 1st rank)
          const piece = chess.get(selectedSquare)
          if (
            piece &&
            piece.type === "p" &&
            ((piece.color === "w" && square[1] === "8") ||
              (piece.color === "b" && square[1] === "1"))
          ) {
            setPendingPromotion({ from: selectedSquare, to: square })
            return
          }

          executeMove(selectedSquare, square)
          return
        }
      }

      // Check if clicking own piece
      const piece = chess.get(square)
      if (piece && piece.color === chess.turn()) {
        setSelectedSquare(square)
        const moves = chess.moves({ square, verbose: true })
        setLegalMoves(moves.map((m) => m.to as Square))
      } else {
        setSelectedSquare(null)
        setLegalMoves([])
      }
    },
    [chess, executeMove, gameMode, gameResult, legalMoves, selectedSquare, userColor]
  )

  // Promotion choice
  const confirmPromotion = useCallback(
    (piece: PieceSymbol) => {
      if (pendingPromotion) {
        executeMove(pendingPromotion.from, pendingPromotion.to, piece)
        setPendingPromotion(null)
      }
    },
    [executeMove, pendingPromotion]
  )

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null)
    setSelectedSquare(null)
    setLegalMoves([])
  }, [])

  // Resign
  const resign = useCallback(
    (color: Color) => {
      const winner = color === "w" ? "b" : "w"
      setGameResult({ outcome: "resignation", winner })
      if (winner === userColor) {
        sounds.playVictory()
        recordGameResult("win")
      } else {
        sounds.playDefeat()
        recordGameResult("loss")
      }
    },
    [userColor]
  )

  // Agree Draw
  const agreeDraw = useCallback(() => {
    setGameResult({ outcome: "draw_agreement", winner: null })
    sounds.playDefeat()
    recordGameResult("draw")
  }, [])

  // Reset Game
  const resetGame = useCallback(
    (newMode?: GameMode, newDifficulty?: BotDifficulty, newColor?: Color) => {
      chess.reset()
      setFen(chess.fen())
      setSelectedSquare(null)
      setLegalMoves([])
      setLastMove(null)
      setPendingPromotion(null)
      setMoveHistory([])
      setCurrentHistoryIndex(-1)
      setEvalScore(0)
      setGameResult(null)
      setWhiteTime(initialSeconds)
      setBlackTime(initialSeconds)
      setIsBotThinking(false)

      if (newMode) setGameMode(newMode)
      if (newDifficulty) setBotDifficulty(newDifficulty)
      if (newColor) setUserColor(newColor)
    },
    [chess, initialSeconds]
  )

  return {
    chess,
    fen,
    turn: chess.turn(),
    isCheck,
    checkedKingSquare,
    selectedSquare,
    legalMoves,
    lastMove,
    pendingPromotion,
    moveHistory,
    currentHistoryIndex,
    evalScore,
    gameResult,
    gameMode,
    botDifficulty,
    userColor,
    isBotThinking,
    whiteTime,
    blackTime,
    capturedPieces: getCapturedPieces(),
    setGameMode,
    setBotDifficulty,
    setUserColor,
    handleSquareClick,
    executeMove,
    confirmPromotion,
    cancelPromotion,
    resign,
    agreeDraw,
    resetGame,
  }
}
