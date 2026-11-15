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
  const [premove, setPremove] = useState<{ from: Square; to: Square } | null>(null)

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

  // Timer Tick (active in vs-computer, pass-and-play, online, but NOT analysis)
  useEffect(() => {
    if (initialSeconds === 0 || gameResult || gameMode === "analysis") {
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
  }, [chess, gameMode, gameResult, initialSeconds])

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

        const newFen = chess.fen()
        setFen(newFen)
        setLastMove({ from, to })
        setSelectedSquare(null)
        setLegalMoves([])
        setEvalScore(evaluateBoard(chess))

        // Record history (branch if in the past)
        const newRecord: MoveRecord = {
          san: move.san,
          from,
          to,
          piece: move.piece,
          color: move.color,
          captured: move.captured,
          promotion: move.promotion,
          fen: newFen,
        }

        setMoveHistory((prev) => {
          const base = currentHistoryIndex >= 0 && currentHistoryIndex < prev.length - 1
            ? prev.slice(0, currentHistoryIndex + 1)
            : prev
          return [...base, newRecord]
        })
        setCurrentHistoryIndex((prev) => prev + 1)

        // Notify callback
        onMoveMade?.({ from, to, promotion: move.promotion })

        evaluateGameEnd()
        return true
      } catch (err) {
        return false
      }
    },
    [chess, currentHistoryIndex, evaluateGameEnd, onMoveMade]
  )

  // Navigate through move history (essential for Analysis mode)
  const goToMove = useCallback(
    (index: number) => {
      if (index < -1 || index >= moveHistory.length) return
      setCurrentHistoryIndex(index)

      if (index === -1) {
        chess.reset()
        setFen(chess.fen())
        setLastMove(null)
        setEvalScore(0)
      } else {
        const record = moveHistory[index]
        chess.load(record.fen)
        setFen(record.fen)
        setLastMove({ from: record.from, to: record.to })
        setEvalScore(evaluateBoard(chess))
      }
      setSelectedSquare(null)
      setLegalMoves([])
    },
    [chess, moveHistory]
  )

  const stepMove = useCallback(
    (delta: number) => {
      const target = currentHistoryIndex + delta
      if (target >= -1 && target < moveHistory.length) {
        goToMove(target)
      }
    },
    [currentHistoryIndex, goToMove, moveHistory.length]
  )

  // Load Custom Position (FEN or PGN)
  const loadPosition = useCallback(
    (input: string): boolean => {
      const trimmed = input.trim()
      if (!trimmed) return false

      // Try as FEN
      try {
        const testChess = new Chess()
        testChess.load(trimmed)
        chess.load(trimmed)
        setFen(chess.fen())
        setSelectedSquare(null)
        setLegalMoves([])
        setLastMove(null)
        setMoveHistory([])
        setCurrentHistoryIndex(-1)
        setEvalScore(evaluateBoard(chess))
        setGameResult(null)
        return true
      } catch {
        // Try as PGN
        try {
          const pgnChess = new Chess()
          pgnChess.loadPgn(trimmed)
          chess.loadPgn(trimmed)
          setFen(chess.fen())
          const history = pgnChess.history({ verbose: true })
          const records: MoveRecord[] = history.map((m) => ({
            san: m.san,
            from: m.from as Square,
            to: m.to as Square,
            piece: m.piece,
            color: m.color,
            captured: m.captured,
            promotion: m.promotion,
            fen: chess.fen(),
          }))
          setMoveHistory(records)
          setCurrentHistoryIndex(records.length - 1)
          setEvalScore(evaluateBoard(chess))
          setGameResult(null)
          return true
        } catch {
          return false
        }
      }
    },
    [chess]
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

  // Auto-execute Premove when turn becomes userColor
  useEffect(() => {
    if (premove && chess.turn() === userColor && !chess.isGameOver() && !gameResult) {
      const legals = chess.moves({ square: premove.from, verbose: true })
      const matching = legals.find((m) => m.to === premove.to)
      if (matching) {
        executeMove(premove.from, premove.to, (matching.promotion as PieceSymbol) || "q")
      }
      setPremove(null)
    }
  }, [chess, executeMove, fen, gameResult, premove, userColor])

  // Move Attempt (Drag & Drop)
  const handleMoveAttempt = useCallback(
    (from: Square, to: Square) => {
      if (gameResult) return

      const piece = chess.get(from)
      if (!piece) return

      // In analysis mode or pass-and-play, or if it's our turn
      if (gameMode === "analysis" || gameMode === "pass-and-play" || chess.turn() === userColor) {
        const moves = chess.moves({ square: from, verbose: true })
        const move = moves.find((m) => m.to === to)
        if (move) {
          // Pawn Promotion Check
          if (
            piece.type === "p" &&
            ((piece.color === "w" && to[1] === "8") ||
              (piece.color === "b" && to[1] === "1"))
          ) {
            setPendingPromotion({ from, to })
            return
          }
          executeMove(from, to)
          return
        }
      } else {
        // It's opponent's turn -> Pre-drag / Premove!
        if (piece.color === userColor && from !== to) {
          setPremove({ from, to })
          setSelectedSquare(null)
          setLegalMoves([])
        }
      }
    },
    [chess, executeMove, gameMode, gameResult, userColor]
  )

  // Square Click handler (Click-to-Move)
  const handleSquareClick = useCallback(
    (square: Square) => {
      if (gameResult) return

      if (premove) {
        setPremove(null)
      }

      // If it's opponent's turn in vs-computer
      if (gameMode === "vs-computer" && chess.turn() !== userColor) {
        const piece = chess.get(square)
        if (piece && piece.color === userColor) {
          if (selectedSquare === square) {
            setSelectedSquare(null)
            setLegalMoves([])
          } else {
            setSelectedSquare(square)
            const allSquares: Square[] = []
            const files = ["a", "b", "c", "d", "e", "f", "g", "h"]
            for (let r = 1; r <= 8; r++) {
              for (const f of files) {
                const sq = `${f}${r}` as Square
                if (sq !== square) allSquares.push(sq)
              }
            }
            setLegalMoves(allSquares)
          }
        } else if (selectedSquare) {
          handleMoveAttempt(selectedSquare, square)
        }
        return
      }

      // If a square is already selected
      if (selectedSquare) {
        if (selectedSquare === square) {
          setSelectedSquare(null)
          setLegalMoves([])
          return
        }

        if (legalMoves.includes(square)) {
          handleMoveAttempt(selectedSquare, square)
          return
        }
      }

      // Check if clicking moving side's piece
      const piece = chess.get(square)
      if (piece && (gameMode === "analysis" || gameMode === "pass-and-play" || piece.color === chess.turn())) {
        setSelectedSquare(square)
        const moves = chess.moves({ square, verbose: true })
        setLegalMoves(moves.map((m) => m.to as Square))
      } else {
        setSelectedSquare(null)
        setLegalMoves([])
      }
    },
    [chess, gameMode, gameResult, handleMoveAttempt, legalMoves, premove, selectedSquare, userColor]
  )

  const cancelPremove = useCallback(() => {
    setPremove(null)
    setSelectedSquare(null)
    setLegalMoves([])
  }, [])

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

  const agreeDraw = useCallback(() => {
    setGameResult({ outcome: "draw_agreement", winner: null })
    sounds.playDefeat()
    recordGameResult("draw")
  }, [])

  const resetGame = useCallback(
    (newMode?: GameMode, newDifficulty?: BotDifficulty, newColor?: Color) => {
      chess.reset()
      setFen(chess.fen())
      setSelectedSquare(null)
      setLegalMoves([])
      setLastMove(null)
      setPendingPromotion(null)
      setPremove(null)
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
    premove,
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
    handleMoveAttempt,
    goToMove,
    stepMove,
    loadPosition,
    cancelPremove,
    executeMove,
    confirmPromotion,
    cancelPromotion,
    resign,
    agreeDraw,
    resetGame,
  }
}
