import React, { useState } from "react"
import type { Square, Color, PieceSymbol } from "chess.js"
import { ChessPiece } from "@/lib/pieces"
import { cn } from "@/lib/utils"

interface ChessBoardProps {
  board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][]
  orientation?: Color
  selectedSquare: Square | null
  legalMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKingSquare: Square | null
  onSquareClick: (square: Square) => void
  disabled?: boolean
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  orientation = "w",
  selectedSquare,
  legalMoves,
  lastMove,
  checkedKingSquare,
  onSquareClick,
  disabled = false,
}) => {
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null)

  const isFlipped = orientation === "b"
  const ranks = isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const files = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]

  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (disabled) return
    setDraggedSquare(square)
    e.dataTransfer.setData("text/plain", square)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault()
    if (disabled || !draggedSquare) return
    if (draggedSquare !== targetSquare) {
      onSquareClick(draggedSquare)
      setTimeout(() => {
        onSquareClick(targetSquare)
      }, 0)
    }
    setDraggedSquare(null)
  }

  return (
    <div className="relative w-full aspect-square max-w-[620px] mx-auto select-none rounded-xl overflow-hidden border border-border shadow-2xl bg-zinc-950/40 p-1">
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden border border-border/80">
        {ranks.map((rankIdx) =>
          files.map((fileIdx) => {
            const fileChar = String.fromCharCode(97 + fileIdx)
            const rankChar = String(rankIdx + 1)
            const squareName = `${fileChar}${rankChar}` as Square

            // In chess board layout, board is an 8x8 array where board[0] is rank 8, board[7] is rank 1
            const arrayRow = 7 - rankIdx
            const arrayCol = fileIdx
            const piece = board[arrayRow]?.[arrayCol]

            const isDarkSquare = (fileIdx + rankIdx) % 2 === 0
            const isSelected = selectedSquare === squareName
            const isLegalTarget = legalMoves.includes(squareName)
            const isLastMoveFrom = lastMove?.from === squareName
            const isLastMoveTo = lastMove?.to === squareName
            const isKingInCheck = checkedKingSquare === squareName

            // Coordinates display on edge squares
            const showFile = isFlipped ? rankIdx === 7 : rankIdx === 0
            const showRank = isFlipped ? fileIdx === 7 : fileIdx === 0

            return (
              <div
                key={squareName}
                onClick={() => !disabled && onSquareClick(squareName)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, squareName)}
                className={cn(
                  "relative flex items-center justify-center transition-colors cursor-pointer",
                  // Shadcn Zinc refined board palette
                  isDarkSquare
                    ? "bg-zinc-800 hover:bg-zinc-750"
                    : "bg-zinc-600 hover:bg-zinc-550",
                  // Selected square highlight
                  isSelected && "bg-emerald-600/50 hover:bg-emerald-600/60 ring-2 ring-emerald-400 inset-0 z-10",
                  // Last move highlights
                  (isLastMoveFrom || isLastMoveTo) && !isSelected && "bg-amber-500/25",
                  // Checked king warning
                  isKingInCheck && "bg-rose-500/40 ring-2 ring-rose-500 animate-pulse z-10"
                )}
              >
                {/* File coordinate label */}
                {showFile && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 right-1 text-[10px] font-mono font-semibold pointer-events-none select-none",
                      isDarkSquare ? "text-zinc-500" : "text-zinc-300"
                    )}
                  >
                    {fileChar}
                  </span>
                )}

                {/* Rank coordinate label */}
                {showRank && (
                  <span
                    className={cn(
                      "absolute top-0.5 left-1 text-[10px] font-mono font-semibold pointer-events-none select-none",
                      isDarkSquare ? "text-zinc-500" : "text-zinc-300"
                    )}
                  >
                    {rankChar}
                  </span>
                )}

                {/* Legal Move Indicators */}
                {isLegalTarget && !piece && (
                  <div className="absolute size-3.5 rounded-full bg-emerald-400/50 group-hover:bg-emerald-400/80 pointer-events-none transition-transform transform scale-100 animate-in fade-in zoom-in" />
                )}

                {isLegalTarget && piece && (
                  <div className="absolute inset-0 rounded-none ring-4 ring-emerald-500/60 ring-inset pointer-events-none animate-in fade-in" />
                )}

                {/* Chess Piece with Drag & Drop */}
                {piece && (
                  <div
                    draggable={!disabled}
                    onDragStart={(e) => handleDragStart(e, squareName)}
                    className={cn(
                      "size-[84%] flex items-center justify-center transition-transform duration-75",
                      draggedSquare === squareName && "opacity-40 scale-105",
                      "active:scale-95 hover:scale-105"
                    )}
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
