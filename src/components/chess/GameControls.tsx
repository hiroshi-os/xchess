import React, { useState } from "react"
import type { BotDifficulty, GameMode, ChatMessage } from "@/types/chess"
import { BOT_CONFIGS } from "@/lib/engine"
import { Button } from "@/components/ui/button"
import {
  RotateCcw,
  Flag,
  Handshake,
  ArrowUpDown,
  Send,
  Bot,
} from "lucide-react"
import type { Color } from "chess.js"
import { Input } from "@/components/ui/input"

interface GameControlsProps {
  gameMode: GameMode
  botDifficulty: BotDifficulty
  onSelectDifficulty: (level: BotDifficulty) => void
  userColor?: Color
  onSelectColor?: (color: Color) => void
  isCheck: boolean
  turn: Color
  onFlipBoard: () => void
  onResign: () => void
  onOfferDraw: () => void
  onNewGame: () => void
  // Online chat
  isOnline: boolean
  chatMessages: ChatMessage[]
  onSendChat: (text: string) => void
  opponentName?: string
}

export const GameControls: React.FC<GameControlsProps> = ({
  gameMode,
  botDifficulty,
  onSelectDifficulty,
  isCheck,
  turn,
  onFlipBoard,
  onResign,
  onOfferDraw,
  onNewGame,
  isOnline,
  chatMessages,
  onSendChat,
  opponentName,
}) => {
  const [chatInput, setChatInput] = useState("")
  const [showResignConfirm, setShowResignConfirm] = useState(false)

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    onSendChat(chatInput.trim())
    setChatInput("")
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Turn & Status Banner */}
      <div className="flex items-center justify-between px-3.5 h-11 rounded-lg border border-zinc-800 bg-zinc-900/60 shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`size-3 rounded-full border border-zinc-500 ${
              turn === "w" ? "bg-zinc-100" : "bg-zinc-900"
            }`}
          />
          <span className="text-sm font-semibold text-zinc-100">
            {turn === "w" ? "White's Turn" : "Black's Turn"}
          </span>
        </div>

        {isCheck && (
          <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded animate-pulse">
            CHECK
          </span>
        )}
      </div>

      {/* Bot Difficulty Selector (for vs-computer) */}
      {gameMode === "vs-computer" && (
        <div className="p-3 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
              <Bot className="size-3.5 text-zinc-400" />
              Engine Level
            </span>
            <span className="font-mono text-zinc-400">
              {BOT_CONFIGS[botDifficulty].rating} Elo
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {([1, 2, 3, 4] as BotDifficulty[]).map((level) => {
              const config = BOT_CONFIGS[level]
              const isSelected = botDifficulty === level
              return (
                <button
                  key={level}
                  onClick={() => onSelectDifficulty(level)}
                  className={`py-1.5 px-2 rounded text-xs font-semibold border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-100 text-zinc-950 border-zinc-100 shadow-sm"
                      : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                  title={`${config.name} (${config.rating} Elo): ${config.description}`}
                >
                  Lvl {level}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Game Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onFlipBoard}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          <ArrowUpDown className="size-3.5 mr-1.5" />
          Flip Board
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onNewGame}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          <RotateCcw className="size-3.5 mr-1.5" />
          New Match
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOfferDraw}
          className="border-zinc-800 hover:bg-zinc-900 text-zinc-300 text-xs"
        >
          <Handshake className="size-3.5 mr-1.5" />
          Offer Draw
        </Button>

        {showResignConfirm ? (
          <div className="flex gap-1">
            <Button
              variant="destructive"
              size="xs"
              onClick={() => {
                setShowResignConfirm(false)
                onResign()
              }}
              className="flex-1 text-xs"
            >
              Confirm
            </Button>
            <Button
              variant="outline"
              size="xs"
              onClick={() => setShowResignConfirm(false)}
              className="border-zinc-800 text-zinc-400 text-xs"
            >
              No
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResignConfirm(true)}
            className="border-zinc-800 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-900/60 text-zinc-400 text-xs transition-colors"
          >
            <Flag className="size-3.5 mr-1.5" />
            Resign
          </Button>
        )}
      </div>

      {/* In-Game Chat for Online Mode */}
      {isOnline && (
        <div className="flex flex-col h-48 border border-zinc-800 rounded-lg bg-zinc-950/60 overflow-hidden mt-1">
          <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/80 text-[11px] font-semibold text-zinc-400">
            Match Chat with {opponentName || "Opponent"}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
            {chatMessages.length === 0 ? (
              <div className="text-zinc-600 italic text-center pt-8">
                Say hello to your opponent
              </div>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 font-semibold">
                    {msg.sender}
                  </span>
                  <span className="text-zinc-200 bg-zinc-900/70 rounded px-2 py-1 inline-block w-fit max-w-[90%]">
                    {msg.text}
                  </span>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendChat} className="flex p-1.5 border-t border-zinc-800 gap-1.5 bg-zinc-900/50">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Send message..."
              className="h-7 text-xs bg-zinc-950 border-zinc-800 text-zinc-200"
            />
            <Button type="submit" size="xs" variant="ghost" className="h-7 px-2 text-zinc-300">
              <Send className="size-3.5" />
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
