import React from "react"
import { Volume2, VolumeX, User, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { PlayerProfile, GameMode } from "@/types/chess"
import type { ConnectionStatus } from "@/hooks/usePeerConnection"

interface NavbarProps {
  profile: PlayerProfile
  onOpenProfile: () => void
  gameMode: GameMode
  onSelectMode: (mode: GameMode) => void
  connectionStatus: ConnectionStatus
  onOpenOnlineModal: () => void
  soundEnabled: boolean
  onToggleSound: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  onOpenProfile,
  gameMode,
  onSelectMode,
  connectionStatus,
  onOpenOnlineModal,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-950 shadow-sm font-bold text-base tracking-tighter">
              ♞
            </div>
            <div className="flex flex-col">
              <span className="font-bold tracking-tight text-base text-zinc-100">
                xchess
              </span>
            </div>
          </div>

          {/* Mode Switcher */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/80 border border-zinc-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => onSelectMode("vs-computer")}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                gameMode === "vs-computer"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              vs Computer
            </button>
            <button
              onClick={() => onSelectMode("pass-and-play")}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                gameMode === "pass-and-play"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Pass & Play
            </button>
            <button
              onClick={onOpenOnlineModal}
              className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                gameMode === "online"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Globe className="size-3 text-emerald-400" />
              <span>Online P2P</span>
              {connectionStatus === "connected" && (
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
            <button
              onClick={() => onSelectMode("analysis")}
              className={`px-3 py-1 rounded font-medium transition-all cursor-pointer ${
                gameMode === "analysis"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Analysis
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSound}
            className="text-zinc-400 hover:text-zinc-100 size-8"
            title={soundEnabled ? "Mute sound" : "Unmute sound"}
          >
            {soundEnabled ? (
              <Volume2 className="size-4" />
            ) : (
              <VolumeX className="size-4 text-zinc-600" />
            )}
          </Button>

          {/* Nickname & Profile Pill */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 transition-all cursor-pointer group"
          >
            <div className="size-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 group-hover:text-zinc-100 text-xs">
              <User className="size-3.5" />
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-zinc-200 group-hover:text-zinc-50 max-w-[110px] truncate">
                {profile.nickname}
              </span>
              <span className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
                {profile.stats.rating}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
