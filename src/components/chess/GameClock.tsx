import React from "react"
import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface GameClockProps {
  seconds: number
  isActive: boolean
  playerName: string
  playerColor: "w" | "b"
  rating?: number
  isBotThinking?: boolean
}

export const GameClock: React.FC<GameClockProps> = ({
  seconds,
  isActive,
  playerName,
  playerColor,
  rating,
  isBotThinking,
}) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const formattedTime = `${mins}:${secs < 10 ? "0" : ""}${secs}`
  const isLowTime = seconds <= 20 && seconds > 0

  return (
    <div
      className={cn(
        "flex items-center justify-between px-3.5 h-11 rounded-lg border transition-colors duration-150",
        isActive
          ? "bg-zinc-900 border-zinc-700 shadow-md ring-1 ring-zinc-700/80"
          : "bg-zinc-950/60 border-zinc-800/80 opacity-80"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={cn(
            "size-3 rounded-full border border-zinc-600 shrink-0",
            playerColor === "w" ? "bg-zinc-100" : "bg-zinc-900"
          )}
        />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium tracking-tight text-zinc-100 truncate max-w-[130px] sm:max-w-[200px]">
            {playerName}
          </span>
          {rating && (
            <span className="text-xs font-mono text-zinc-400 shrink-0">
              ({rating})
            </span>
          )}
          {isBotThinking && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded shrink-0 animate-pulse">
              <span className="size-1 rounded-full bg-emerald-400" />
              thinking
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded font-mono font-bold text-sm tracking-wider border shrink-0",
          isActive
            ? isLowTime
              ? "bg-rose-950/80 text-rose-300 border-rose-800/80 animate-pulse"
              : "bg-zinc-800 text-zinc-100 border-zinc-700"
            : "bg-zinc-900 text-zinc-400 border-zinc-800"
        )}
      >
        <Clock className={cn("size-3.5", isLowTime ? "text-rose-400" : "text-zinc-400")} />
        <span>{formattedTime}</span>
      </div>
    </div>
  )
}
