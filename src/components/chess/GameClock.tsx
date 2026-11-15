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
        "flex items-center justify-between px-3.5 py-2 rounded-lg border transition-all duration-200",
        isActive
          ? "bg-zinc-900 border-zinc-700 shadow-md ring-1 ring-zinc-700/80"
          : "bg-zinc-950/60 border-zinc-800/80 opacity-80"
      )}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "size-3 rounded-full border border-zinc-600",
            playerColor === "w" ? "bg-zinc-100" : "bg-zinc-900"
          )}
        />
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium tracking-tight text-zinc-100">
              {playerName}
            </span>
            {rating && (
              <span className="text-xs font-mono text-zinc-400">
                ({rating})
              </span>
            )}
          </div>
          {isBotThinking && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 animate-pulse">
              thinking...
            </span>
          )}
        </div>
      </div>

      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded font-mono font-bold text-sm tracking-wider border",
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
