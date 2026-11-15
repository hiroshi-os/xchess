import React from "react"
import type { PieceSymbol, Color } from "chess.js"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ChessPiece } from "@/lib/pieces"

interface PromotionDialogProps {
  isOpen: boolean
  color: Color
  onSelectPiece: (piece: PieceSymbol) => void
  onCancel: () => void
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  isOpen,
  color,
  onSelectPiece,
  onCancel,
}) => {
  const pieces: { type: PieceSymbol; name: string }[] = [
    { type: "q", name: "Queen" },
    { type: "r", name: "Rook" },
    { type: "b", name: "Bishop" },
    { type: "n", name: "Knight" },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[360px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Promote Pawn
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-xs">
            Choose a piece for promotion
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-3 pt-3">
          {pieces.map(({ type, name }) => (
            <button
              key={type}
              onClick={() => onSelectPiece(type)}
              className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
            >
              <div className="size-12 mb-1 flex items-center justify-center">
                <ChessPiece type={type} color={color} />
              </div>
              <span className="text-[11px] font-medium text-zinc-400 group-hover:text-zinc-200">
                {name}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
