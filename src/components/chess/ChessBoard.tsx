import React, { useState, useRef, useEffect, useCallback } from "react"
import type { Square, Color, PieceSymbol } from "chess.js"
import { ChessPiece } from "@/lib/pieces"
import { cn } from "@/lib/utils"

interface ChessBoardProps {
  board: ({ square: Square; type: PieceSymbol; color: Color } | null)[][]
  orientation?: Color
  turn: Color
  userColor: Color
  gameMode: string
  selectedSquare: Square | null
  legalMoves: Square[]
  lastMove: { from: Square; to: Square } | null
  checkedKingSquare: Square | null
  premove: { from: Square; to: Square } | null
  onSquareClick: (square: Square) => void
  onMoveAttempt: (from: Square, to: Square) => void
  onCancelPremove: () => void
  disabled?: boolean
}

interface DragInfo {
  startX: number
  startY: number
  fromSquare: Square
  piece: { type: PieceSymbol; color: Color }
  isDragging: boolean
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  board,
  orientation = "w",
  turn,
  userColor,
  gameMode,
  selectedSquare,
  legalMoves,
  lastMove,
  checkedKingSquare,
  premove,
  onSquareClick,
  onMoveAttempt,
  onCancelPremove,
  disabled = false,
}) => {
  const boardRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragInfo | null>(null)

  const [activeDrag, setActiveDrag] = useState<{
    piece: { type: PieceSymbol; color: Color }
    fromSquare: Square
    x: number
    y: number
    size: number
  } | null>(null)

  const [hoverSquare, setHoverSquare] = useState<Square | null>(null)

  const isFlipped = orientation === "b"
  const ranks = isFlipped ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const files = isFlipped ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]

  const getSquareFromCoords = useCallback(
    (clientX: number, clientY: number): Square | null => {
      if (!boardRef.current) return null
      const rect = boardRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
        return null
      }

      const col = Math.floor((x / rect.width) * 8)
      const row = Math.floor((y / rect.height) * 8)

      const fileIdx = isFlipped ? 7 - col : col
      const rankIdx = isFlipped ? row : 7 - row

      const fileChar = String.fromCharCode(97 + fileIdx)
      const rankChar = String(rankIdx + 1)
      return `${fileChar}${rankChar}` as Square
    },
    [isFlipped]
  )

  const handlePointerDown = (
    e: React.PointerEvent,
    square: Square,
    piece: { type: PieceSymbol; color: Color } | null
  ) => {
    if (disabled || e.button !== 0) return

    // Check if player can interact with this piece
    const isPlayerTurn = gameMode === "pass-and-play" || turn === userColor
    const canInteract =
      piece &&
      (isPlayerTurn ? piece.color === turn : piece.color === userColor)

    if (canInteract && piece) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        fromSquare: square,
        piece,
        isDragging: false,
      }

      // Also trigger selection on pointer down for immediate legal move display
      onSquareClick(square)
    } else {
      // Clicking empty square or opponent piece
      onSquareClick(square)
    }
  }

  // Window Pointer Listeners for flawless continuous dragging across the screen
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragRef.current) return

      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      const dist = Math.hypot(dx, dy)

      if (dist > 4) {
        dragRef.current.isDragging = true
        const squareSize = boardRef.current
          ? boardRef.current.clientWidth / 8
          : 64

        setActiveDrag({
          piece: dragRef.current.piece,
          fromSquare: dragRef.current.fromSquare,
          x: e.clientX,
          y: e.clientY,
          size: squareSize,
        })

        const sq = getSquareFromCoords(e.clientX, e.clientY)
        setHoverSquare(sq)
      }
    }

    const handlePointerUp = (e: PointerEvent) => {
      if (!dragRef.current) return

      if (dragRef.current.isDragging) {
        const targetSquare = getSquareFromCoords(e.clientX, e.clientY)
        if (targetSquare && targetSquare !== dragRef.current.fromSquare) {
          onMoveAttempt(dragRef.current.fromSquare, targetSquare)
        }
      }

      dragRef.current = null
      setActiveDrag(null)
      setHoverSquare(null)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [getSquareFromCoords, onMoveAttempt])

  // Right Click cancels pre-drag or premove
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (activeDrag) {
      dragRef.current = null
      setActiveDrag(null)
      setHoverSquare(null)
    }
    if (premove) {
      onCancelPremove()
    }
  }

  const isPlayerTurn = gameMode === "pass-and-play" || turn === userColor

  return (
    <div
      ref={boardRef}
      onContextMenu={handleContextMenu}
      className="relative w-full aspect-square max-w-[620px] mx-auto select-none rounded-xl overflow-hidden border border-border shadow-2xl bg-zinc-950/40 p-1 touch-none"
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full rounded-lg overflow-hidden border border-border/80">
        {ranks.map((rankIdx) =>
          files.map((fileIdx) => {
            const fileChar = String.fromCharCode(97 + fileIdx)
            const rankChar = String(rankIdx + 1)
            const squareName = `${fileChar}${rankChar}` as Square

            const arrayRow = 7 - rankIdx
            const arrayCol = fileIdx
            const piece = board[arrayRow]?.[arrayCol]

            const isDarkSquare = (fileIdx + rankIdx) % 2 === 0
            const isSelected = selectedSquare === squareName
            const isLegalTarget = legalMoves.includes(squareName)
            const isLastMoveFrom = lastMove?.from === squareName
            const isLastMoveTo = lastMove?.to === squareName
            const isKingInCheck = checkedKingSquare === squareName

            const isPremoveSquare =
              premove &&
              (premove.from === squareName || premove.to === squareName)

            const isHoveredDuringDrag =
              activeDrag &&
              hoverSquare === squareName &&
              activeDrag.fromSquare !== squareName

            const isBeingDragged =
              activeDrag && activeDrag.fromSquare === squareName

            const showFile = isFlipped ? rankIdx === 7 : rankIdx === 0
            const showRank = isFlipped ? fileIdx === 7 : fileIdx === 0

            return (
              <div
                key={squareName}
                onPointerDown={(e) => handlePointerDown(e, squareName, piece)}
                className={cn(
                  "relative flex items-center justify-center transition-colors cursor-pointer select-none",
                  // Shadcn Zinc refined board palette
                  isDarkSquare
                    ? "bg-zinc-800 hover:bg-zinc-750"
                    : "bg-zinc-600 hover:bg-zinc-550",
                  // Selected square highlight
                  isSelected && "bg-emerald-600/50 ring-2 ring-emerald-400 inset-0 z-10",
                  // Hover highlight while dragging piece over this square
                  isHoveredDuringDrag && "bg-emerald-500/30 ring-2 ring-emerald-400/90 z-20",
                  // Premove highlights (Chess.com style coral-red)
                  isPremoveSquare && "bg-rose-500/30 ring-2 ring-rose-400/80 z-10 animate-pulse",
                  // Last move highlights
                  (isLastMoveFrom || isLastMoveTo) && !isSelected && !isPremoveSquare && "bg-amber-500/25",
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

                {/* Legal Move Indicators (Empty square) */}
                {isLegalTarget && !piece && (
                  <div
                    className={cn(
                      "absolute size-3.5 rounded-full pointer-events-none transition-transform transform scale-100 animate-in fade-in zoom-in",
                      isPlayerTurn
                        ? "bg-emerald-400/60"
                        : "bg-rose-400/50" // Pre-drag / premove pseudo indicators
                    )}
                  />
                )}

                {/* Legal Move Indicators (Capture square) */}
                {isLegalTarget && piece && (
                  <div
                    className={cn(
                      "absolute inset-0 ring-4 ring-inset pointer-events-none animate-in fade-in",
                      isPlayerTurn
                        ? "ring-emerald-500/70"
                        : "ring-rose-500/60"
                    )}
                  />
                )}

                {/* Static Piece on Square (dimmed if actively dragging it) */}
                {piece && (
                  <div
                    className={cn(
                      "size-[84%] flex items-center justify-center transition-transform duration-75 pointer-events-none select-none",
                      isBeingDragged ? "opacity-25 scale-95" : "hover:scale-105"
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

      {/* Floating Active Dragged Piece (follows cursor directly with zero OS ghosting) */}
      {activeDrag && (
        <div
          className="fixed pointer-events-none z-50 select-none -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl cursor-grabbing"
          style={{
            left: `${activeDrag.x}px`,
            top: `${activeDrag.y}px`,
            width: `${activeDrag.size * 0.9}px`,
            height: `${activeDrag.size * 0.9}px`,
          }}
        >
          <ChessPiece
            type={activeDrag.piece.type}
            color={activeDrag.piece.color}
            className="size-full filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)] scale-110"
          />
        </div>
      )}
    </div>
  )
}
