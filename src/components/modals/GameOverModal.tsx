import React, { useEffect } from "react"
import confetti from "canvas-confetti"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import type { GameResult } from "@/types/chess"
import { Trophy, RotateCcw, Eye, ShieldAlert, Award } from "lucide-react"
import type { Color } from "chess.js"

interface GameOverModalProps {
  isOpen: boolean
  result: GameResult
  userColor: Color
  onRematch: () => void
  onClose: () => void
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  result,
  userColor,
  onRematch,
  onClose,
}) => {
  if (!result) return null

  const isWin = result.winner === userColor
  const isLoss = result.winner !== null && result.winner !== userColor
  const isDraw = result.winner === null

  useEffect(() => {
    if (isOpen && isWin) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ["#10b981", "#34d399", "#f59e0b", "#ffffff"],
      })
    }
  }, [isOpen, isWin])

  const getTitle = () => {
    if (isWin) return "Victory!"
    if (isLoss) return "Defeat"
    return "Draw"
  }

  const getDescription = () => {
    switch (result.outcome) {
      case "checkmate":
        return `Checkmate! ${result.winner === "w" ? "White" : "Black"} wins.`
      case "timeout":
        return `Time expired! ${result.winner === "w" ? "White" : "Black"} wins on time.`
      case "resignation":
        return `Resignation! ${result.winner === "w" ? "White" : "Black"} wins.`
      case "stalemate":
        return "Stalemate. No legal moves remaining."
      case "threefold_repetition":
        return "Draw by threefold repetition."
      case "insufficient_material":
        return "Draw by insufficient material."
      case "50_move_rule":
        return "Draw by 50-move rule."
      case "draw_agreement":
        return "Draw agreed by both players."
      default:
        return "Game concluded."
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[380px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6 text-center">
        <div className="flex justify-center mb-3">
          {isWin && (
            <div className="size-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Trophy className="size-7" />
            </div>
          )}
          {isLoss && (
            <div className="size-14 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <ShieldAlert className="size-7" />
            </div>
          )}
          {isDraw && (
            <div className="size-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award className="size-7" />
            </div>
          )}
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight text-center">
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400 text-xs">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 pt-4">
          <Button
            onClick={onRematch}
            size="lg"
            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
          >
            <RotateCcw className="size-4 mr-2" />
            Play Again
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-300"
          >
            <Eye className="size-4 mr-2" />
            Review Position
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
