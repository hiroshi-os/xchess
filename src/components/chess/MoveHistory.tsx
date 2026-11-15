import React, { useEffect, useRef, useState } from "react"
import type { MoveRecord } from "@/types/chess"
import {
  Copy,
  Check,
  ScrollText,
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface MoveHistoryProps {
  moves: MoveRecord[]
  fen: string
  currentIndex: number
  onGoToMove: (index: number) => void
  onStepMove: (delta: number) => void
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moves,
  fen,
  currentIndex,
  onGoToMove,
  onStepMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copiedPgn, setCopiedPgn] = useState(false)
  const [copiedFen, setCopiedFen] = useState(false)

  // Auto-scroll to selected move or bottom
  useEffect(() => {
    if (containerRef.current) {
      const activeEl = containerRef.current.querySelector('[data-active="true"]')
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "nearest" })
      } else {
        containerRef.current.scrollTop = containerRef.current.scrollHeight
      }
    }
  }, [currentIndex, moves.length])

  // Keyboard navigation for stepping moves
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault()
        onStepMove(-1)
      } else if (e.key === "ArrowRight") {
        e.preventDefault()
        onStepMove(1)
      } else if (e.key === "Home") {
        e.preventDefault()
        onGoToMove(-1)
      } else if (e.key === "End") {
        e.preventDefault()
        onGoToMove(moves.length - 1)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [moves.length, onGoToMove, onStepMove])

  // Group moves into pairs (White & Black)
  const movePairs: {
    turn: number
    white?: MoveRecord
    whiteIndex: number
    black?: MoveRecord
    blackIndex: number
  }[] = []

  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      turn: Math.floor(i / 2) + 1,
      white: moves[i],
      whiteIndex: i,
      black: moves[i + 1],
      blackIndex: i + 1,
    })
  }

  const copyPgn = () => {
    let pgn = ""
    movePairs.forEach((pair) => {
      pgn += `${pair.turn}. ${pair.white?.san || ""} ${pair.black?.san || ""} `
    })
    navigator.clipboard.writeText(pgn.trim())
    setCopiedPgn(true)
    setTimeout(() => setCopiedPgn(false), 2000)
  }

  const copyFen = () => {
    navigator.clipboard.writeText(fen)
    setCopiedFen(true)
    setTimeout(() => setCopiedFen(false), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950/70 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-zinc-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">
            Move History
          </span>
          <span className="text-xs font-mono text-zinc-500">
            ({currentIndex + 1}/{moves.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="xs"
            onClick={copyFen}
            className="text-xs h-6 text-zinc-400 hover:text-zinc-100"
            title="Copy FEN string"
          >
            {copiedFen ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            FEN
          </Button>

          <Button
            variant="ghost"
            size="xs"
            onClick={copyPgn}
            className="text-xs h-6 text-zinc-400 hover:text-zinc-100"
            title="Copy PGN notation"
          >
            {copiedPgn ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
            PGN
          </Button>
        </div>
      </div>

      {/* Moves Table */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-2 font-mono text-xs divide-y divide-zinc-900/60 max-h-[300px] scroll-smooth"
      >
        {movePairs.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-zinc-500 italic">
            Moves will appear here
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.turn}
              className="grid grid-cols-[36px_1fr_1fr] items-center py-1 px-1.5 rounded transition-colors text-xs"
            >
              <span className="text-zinc-500 font-medium select-none">{pair.turn}.</span>

              {/* White Move */}
              {pair.white ? (
                <button
                  onClick={() => onGoToMove(pair.whiteIndex)}
                  data-active={currentIndex === pair.whiteIndex}
                  className={`text-left px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    currentIndex === pair.whiteIndex
                      ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-600 shadow-xs"
                      : "text-zinc-200 hover:bg-zinc-900/80 hover:text-zinc-50"
                  }`}
                >
                  {pair.white.san}
                </button>
              ) : (
                <span />
              )}

              {/* Black Move */}
              {pair.black ? (
                <button
                  onClick={() => onGoToMove(pair.blackIndex)}
                  data-active={currentIndex === pair.blackIndex}
                  className={`text-left px-2 py-0.5 rounded font-semibold transition-all cursor-pointer ${
                    currentIndex === pair.blackIndex
                      ? "bg-zinc-800 text-zinc-100 ring-1 ring-zinc-600 shadow-xs"
                      : "text-zinc-300 hover:bg-zinc-900/80 hover:text-zinc-50"
                  }`}
                >
                  {pair.black.san}
                </button>
              ) : (
                <span />
              )}
            </div>
          ))
        )}
      </div>

      {/* Move Navigation Bar (first, prev, next, last) */}
      <div className="flex items-center justify-between px-3 py-1.5 border-t border-zinc-800/80 bg-zinc-900/50 shrink-0">
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onGoToMove(-1)}
          disabled={currentIndex <= -1}
          className="text-zinc-400 hover:text-zinc-100 h-7 px-2"
          title="Start Position (Home)"
        >
          <ChevronFirst className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => onStepMove(-1)}
          disabled={currentIndex <= -1}
          className="text-zinc-400 hover:text-zinc-100 h-7 px-2"
          title="Previous Move (←)"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => onStepMove(1)}
          disabled={currentIndex >= moves.length - 1}
          className="text-zinc-400 hover:text-zinc-100 h-7 px-2"
          title="Next Move (→)"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="xs"
          onClick={() => onGoToMove(moves.length - 1)}
          disabled={currentIndex >= moves.length - 1}
          className="text-zinc-400 hover:text-zinc-100 h-7 px-2"
          title="Current Position (End)"
        >
          <ChevronLast className="size-4" />
        </Button>
      </div>
    </div>
  )
}
