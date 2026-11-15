import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { PlayerProfile } from "@/types/chess"
import { updatePlayerNickname, getRandomNickname } from "@/lib/storage"
import { Trophy, Dices, UserCheck, Flame } from "lucide-react"

interface NicknameModalProps {
  isOpen: boolean
  onClose: () => void
  profile: PlayerProfile
  onProfileUpdated: (profile: PlayerProfile) => void
}

export const NicknameModal: React.FC<NicknameModalProps> = ({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}) => {
  const [nickname, setNickname] = useState(profile.nickname)
  const [saved, setSaved] = useState(false)

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!nickname.trim()) return
    const updated = updatePlayerNickname(nickname)
    onProfileUpdated(updated)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 600)
  }

  const rollRandom = () => {
    setNickname(getRandomNickname())
  }

  const winRate =
    profile.stats.gamesPlayed > 0
      ? Math.round((profile.stats.wins / profile.stats.gamesPlayed) * 100)
      : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">
            Player Profile
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Saved locally in your browser. No registration required.
          </DialogDescription>
        </DialogHeader>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
            <Trophy className="size-4 text-amber-400 mb-1" />
            <span className="text-lg font-mono font-bold text-zinc-100">
              {profile.stats.rating}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Rating
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
            <Flame className="size-4 text-rose-400 mb-1" />
            <span className="text-lg font-mono font-bold text-zinc-100">
              {profile.stats.gamesPlayed}
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Matches
            </span>
          </div>

          <div className="flex flex-col items-center justify-center p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/60">
            <UserCheck className="size-4 text-emerald-400 mb-1" />
            <span className="text-lg font-mono font-bold text-zinc-100">
              {winRate}%
            </span>
            <span className="text-[10px] text-zinc-400 uppercase tracking-wider">
              Win Rate
            </span>
          </div>
        </div>

        {/* Nickname Editor */}
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              Your Nickname
            </label>
            <div className="flex gap-2">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={24}
                placeholder="Enter handle..."
                className="bg-zinc-900/80 border-zinc-800 text-zinc-100 font-medium"
              />
              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={rollRandom}
                title="Generate Random Nickname"
                className="border-zinc-800 hover:bg-zinc-800"
              >
                <Dices className="size-4 text-zinc-400" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saved || !nickname.trim()}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
            >
              {saved ? "Saved!" : "Save Profile"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
