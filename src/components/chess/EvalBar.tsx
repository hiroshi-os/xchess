import React from "react"
import { cn } from "@/lib/utils"

interface EvalBarProps {
  score: number // centipawns (+ is White advantage, - is Black advantage)
  isFlipped?: boolean
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, isFlipped = false }) => {
  // Convert centipawns to winning probability / percentage using standard logistic function
  // sigmoid(score / 400) gives realistic 0..100% curve
  const evalPawns = score / 100
  const winProbability = 1 / (1 + Math.pow(10, -evalPawns / 4))
  const whitePercent = Math.min(95, Math.max(5, winProbability * 100))
  const blackPercent = 100 - whitePercent

  const formattedScore =
    Math.abs(evalPawns) >= 20
      ? evalPawns > 0
        ? "M"
        : "-M"
      : evalPawns > 0
      ? `+${evalPawns.toFixed(1)}`
      : evalPawns.toFixed(1)

  return (
    <div className="hidden md:flex flex-col items-center w-7 h-full max-h-[620px] rounded-md overflow-hidden border border-zinc-800 bg-zinc-950/80 shadow-md">
      {/* Black portion (top by default, unless flipped) */}
      <div
        className={cn(
          "w-full transition-all duration-300 relative flex items-start justify-center pt-1.5",
          isFlipped ? "bg-zinc-100 text-zinc-900" : "bg-zinc-900 text-zinc-300"
        )}
        style={{ height: `${isFlipped ? whitePercent : blackPercent}%` }}
      >
        {!isFlipped && evalPawns < 0 && (
          <span className="text-[10px] font-mono font-bold">{formattedScore}</span>
        )}
      </div>

      {/* White portion (bottom by default, unless flipped) */}
      <div
        className={cn(
          "w-full transition-all duration-300 relative flex items-end justify-center pb-1.5",
          isFlipped ? "bg-zinc-900 text-zinc-300" : "bg-zinc-100 text-zinc-900"
        )}
        style={{ height: `${isFlipped ? blackPercent : whitePercent}%` }}
      >
        {!isFlipped && evalPawns >= 0 && (
          <span className="text-[10px] font-mono font-bold">{formattedScore}</span>
        )}
      </div>
    </div>
  )
}
