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

function getSquareCenter(square: Square, isFlipped: boolean): { x: number; y: number } {
  const file = square.charCodeAt(0) - 97 // 0..7
  const rank = parseInt(square[1], 10) // 1..8

  const col = isFlipped ? 7 - file : file
  const row = isFlipped ? rank - 1 : 8 - rank

  return {
    x: col * 100 + 50,
    y: row * 100 + 50,
  }
}

function getArrowPath(from: Square, to: Square, isFlipped: boolean): string {
  const p1 = getSquareCenter(from, isFlipped)
  const p2 = getSquareCenter(to, isFlipped)

  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy)
  if (len === 0) return ""

  const ux = dx / len
  const uy = dy / len
  const px = -uy
  const py = ux

  const shaftWidth = 14
  const headWidth = 32
  const headLength = 28
  const tipOffset = 18

  const startX = p1.x + ux * 14
  const startY = p1.y + uy * 14

  const endX = p2.x - ux * tipOffset
  const endY = p2.y - uy * tipOffset

  const neckX = endX - ux * headLength
  const neckY = endY - uy * headLength

  const pLeftShaft = { x: startX - px * (shaftWidth / 2), y: startY - py * (shaftWidth / 2) }
  const pRightShaft = { x: startX + px * (shaftWidth / 2), y: startY + py * (shaftWidth / 2) }

  const pLeftNeck = { x: neckX - px * (shaftWidth / 2), y: neckY - py * (shaftWidth / 2) }
  const pRightNeck = { x: neckX + px * (shaftWidth / 2), y: neckY + py * (shaftWidth / 2) }

  const pLeftHead = { x: neckX - px * (headWidth / 2), y: neckY - py * (headWidth / 2) }
  const pRightHead = { x: neckX + px * (headWidth / 2), y: neckY + py * (headWidth / 2) }

  return `
    M ${pLeftShaft.x.toFixed(1)} ${pLeftShaft.y.toFixed(1)}
    L ${pLeftNeck.x.toFixed(1)} ${pLeftNeck.y.toFixed(1)}
    L ${pLeftHead.x.toFixed(1)} ${pLeftHead.y.toFixed(1)}
    L ${endX.toFixed(1)} ${endY.toFixed(1)}
    L ${pRightHead.x.toFixed(1)} ${pRightHead.y.toFixed(1)}
    L ${pRightNeck.x.toFixed(1)} ${pRightNeck.y.toFixed(1)}
    L ${pRightShaft.x.toFixed(1)} ${pRightShaft.y.toFixed(1)}
    Z
  `
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
  const rightDragRef = useRef<{ startSquare: Square; startX: number; startY: number } | null>(null)

  const [activeDrag, setActiveDrag] = useState<{
    piece: { type: PieceSymbol; color: Color }
    fromSquare: Square
    x: number
    y: number
    size: number
  } | null>(null)

  const [hoverSquare, setHoverSquare] = useState<Square | null>(null)
  const [userArrows, setUserArrows] = useState<{ from: Square; to: Square }[]>([])

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
    if (disabled) return

    // Right-click drag to draw analysis / tactical arrows
    if (e.button === 2) {
      e.preventDefault()
      rightDragRef.current = {
        startSquare: square,
        startX: e.clientX,
        startY: e.clientY,
      }
      return
    }

    if (e.button !== 0) return

    // Left click clears custom user arrows
    if (userArrows.length > 0) {
      setUserArrows([])
    }

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

      onSquareClick(square)
    } else {
      onSquareClick(square)
    }
  }

  // Window Pointer Listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (dragRef.current) {
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
    }

    const handlePointerUp = (e: PointerEvent) => {
      // Handle Right-click arrow release
      if (e.button === 2 && rightDragRef.current) {
        const targetSquare = getSquareFromCoords(e.clientX, e.clientY)
        if (targetSquare && targetSquare !== rightDragRef.current.startSquare) {
          setUserArrows((prev) => {
            const exists = prev.some(
              (a) =>
                a.from === rightDragRef.current!.startSquare &&
                a.to === targetSquare
            )
            if (exists) {
              return prev.filter(
                (a) =>
                  !(
                    a.from === rightDragRef.current!.startSquare &&
                    a.to === targetSquare
                  )
              )
            }
            return [
              ...prev,
              { from: rightDragRef.current!.startSquare, to: targetSquare },
            ]
          })
        }
        rightDragRef.current = null
      }

      // Handle Left-click piece drop
      if (dragRef.current) {
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
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [getSquareFromCoords, onMoveAttempt])

  // Context Menu: prevents OS popup and cancels active premove or arrows
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
                  isDarkSquare
                    ? "bg-zinc-800 hover:bg-zinc-750"
                    : "bg-zinc-600 hover:bg-zinc-550",
                  isSelected && "bg-emerald-600/50 ring-2 ring-emerald-400 inset-0 z-10",
                  isHoveredDuringDrag && "bg-emerald-500/30 ring-2 ring-emerald-400/90 z-20",
                  isPremoveSquare && "bg-rose-500/25 ring-2 ring-rose-400/80 z-10",
                  (isLastMoveFrom || isLastMoveTo) && !isSelected && !isPremoveSquare && "bg-amber-500/25",
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
                        : "bg-rose-400/50"
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

                {/* Static Piece on Square */}
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

      {/* SVG Arrow Overlay (Premove arrows & Tactical arrows) */}
      <svg
        className="absolute inset-0 size-full pointer-events-none z-30"
        viewBox="0 0 800 800"
      >
        {/* Premove Arrow (Chess.com Vibrant Coral/Red Glow) */}
        {premove && (
          <g className="animate-in fade-in zoom-in-95 duration-150">
            <circle
              cx={getSquareCenter(premove.from, isFlipped).x}
              cy={getSquareCenter(premove.from, isFlipped).y}
              r="10"
              fill="#f43f5e"
              opacity="0.9"
            />
            <path
              d={getArrowPath(premove.from, premove.to, isFlipped)}
              fill="#f43f5e"
              opacity="0.88"
              className="filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.7)]"
            />
          </g>
        )}

        {/* User Drawn Arrows (Right-click and drag) */}
        {userArrows.map((arrow, idx) => (
          <g key={idx} className="animate-in fade-in duration-100">
            <circle
              cx={getSquareCenter(arrow.from, isFlipped).x}
              cy={getSquareCenter(arrow.from, isFlipped).y}
              r="8"
              fill="#10b981"
              opacity="0.85"
            />
            <path
              d={getArrowPath(arrow.from, arrow.to, isFlipped)}
              fill="#10b981"
              opacity="0.8"
              className="filter drop-shadow-[0_2px_6px_rgba(16,185,129,0.5)]"
            />
          </g>
        ))}
      </svg>

      {/* Floating Active Dragged Piece */}
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
