import React, { useEffect, useRef, useState } from "react"
import type { MoveRecord } from "@/types/chess"
import { Copy, Check, ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MoveHistoryProps {
  moves: MoveRecord[]
  fen: string
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ moves, fen }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copiedPgn, setCopiedPgn] = useState(false)
  const [copiedFen, setCopiedFen] = useState(false)

  // Scroll to bottom as moves arrive
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [moves.length])

  // Group moves into pairs (White & Black)
  const movePairs: { turn: number; white?: MoveRecord; black?: MoveRecord }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    movePairs.push({
      turn: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
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
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-zinc-400" />
          <span className="text-xs font-semibold tracking-wider uppercase text-zinc-300">
            Move History
          </span>
          <span className="text-xs font-mono text-zinc-500">({moves.length})</span>
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
        className="flex-1 overflow-y-auto p-2 font-mono text-xs divide-y divide-zinc-900/60 max-h-[320px] scroll-smooth"
      >
        {movePairs.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 italic">
            Moves will appear here
          </div>
        ) : (
          movePairs.map((pair) => (
            <div
              key={pair.turn}
              className="grid grid-cols-[36px_1fr_1fr] items-center py-1 px-2 hover:bg-zinc-900/40 rounded transition-colors"
            >
              <span className="text-zinc-500 font-medium select-none">{pair.turn}.</span>
              <span className="font-semibold text-zinc-200">{pair.white?.san || ""}</span>
              <span className="font-semibold text-zinc-300">{pair.black?.san || ""}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
