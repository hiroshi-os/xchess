import React, { useMemo } from "react"
import { Chess, type Color } from "chess.js"
import { getTopAnalysisLines } from "@/lib/engine"
import { Button } from "@/components/ui/button"
import {
  Sparkles,
  ArrowUpDown,
  RotateCcw,
  FileCode2,
  Play,
  Share2,
  Check,
} from "lucide-react"

interface AnalysisPanelProps {
  fen: string
  turn: Color
  evalScore: number
  isCheck: boolean
  onFlipBoard: () => void
  onReset: () => void
  onOpenLoadModal: () => void
  onPlayMove: (from: string, to: string) => void
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  fen,
  turn,
  evalScore,
  isCheck,
  onFlipBoard,
  onReset,
  onOpenLoadModal,
  onPlayMove,
}) => {
  const [copiedFen, setCopiedFen] = React.useState(false)

  // Compute live engine lines for current position
  const topLines = useMemo(() => {
    try {
      const c = new Chess(fen)
      return getTopAnalysisLines(c, 3)
    } catch {
      return []
    }
  }, [fen])

  const pawns = evalScore / 100
  const advantageText =
    Math.abs(pawns) < 0.2
      ? "Equal Position"
      : pawns > 0
      ? `White advantage (+${pawns.toFixed(1)})`
      : `Black advantage (${pawns.toFixed(1)})`

  const copyFen = () => {
    navigator.clipboard.writeText(fen)
    setCopiedFen(true)
    setTimeout(() => setCopiedFen(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Position & Eval Banner */}
      <div className="flex items-center justify-between px-3.5 h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`size-3 rounded-full border border-zinc-500 ${
              turn === "w" ? "bg-zinc-100" : "bg-zinc-900"
            }`}
          />
          <span className="text-sm font-semibold text-zinc-100">
            {turn === "w" ? "White to Move" : "Black to Move"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isCheck && (
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded animate-pulse">
              CHECK
            </span>
          )}
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded">
            {pawns >= 0 ? `+${pawns.toFixed(1)}` : pawns.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Top Engine Analysis Recommendations */}
      <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-emerald-400" />
            Engine Recommendations
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {advantageText}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          {topLines.length === 0 ? (
            <div className="text-xs text-zinc-500 italic py-2 text-center">
              No legal moves available (Checkmate or Stalemate)
            </div>
          ) : (
            topLines.map((line, idx) => (
              <div
                key={line.san}
                className="flex items-center justify-between p-2 rounded border border-zinc-800/80 bg-zinc-900/70 hover:bg-zinc-850 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="size-5 rounded-full bg-zinc-800 text-[11px] font-mono font-bold flex items-center justify-center text-zinc-400">
                    {idx + 1}
                  </span>
                  <span className="text-sm font-mono font-bold text-zinc-100">
                    {line.san}
                  </span>
                  <span className="text-xs font-mono text-zinc-400">
                    ({line.evalText})
                  </span>
                </div>

                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onPlayMove(line.from, line.to)}
                  className="h-6 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40"
                  title="Play this recommendation"
                >
                  <Play className="size-3 mr-1" />
                  Play
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Analysis Tools & Actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenLoadModal}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-200 text-xs font-medium"
        >
          <FileCode2 className="size-3.5 mr-1.5 text-emerald-400" />
          Load FEN / PGN
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onFlipBoard}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          <ArrowUpDown className="size-3.5 mr-1.5" />
          Flip Board
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyFen}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          {copiedFen ? (
            <Check className="size-3.5 mr-1.5 text-emerald-400" />
          ) : (
            <Share2 className="size-3.5 mr-1.5" />
          )}
          {copiedFen ? "FEN Copied" : "Share FEN"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          <RotateCcw className="size-3.5 mr-1.5" />
          Reset Position
        </Button>
      </div>
    </div>
  )
}
