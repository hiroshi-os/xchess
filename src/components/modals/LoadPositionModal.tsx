import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileCode2, Play } from "lucide-react"

interface LoadPositionModalProps {
  isOpen: boolean
  onClose: () => void
  onLoad: (input: string) => boolean
}

const PRESETS = [
  {
    name: "Starting Position",
    type: "FEN",
    data: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  },
  {
    name: "Ruy Lopez: Berlin Defense",
    type: "FEN",
    data: "r1bqkb1r/pppp1ppp/2n2n2/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4",
  },
  {
    name: "Sicilian: Najdorf Variation",
    type: "FEN",
    data: "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
  },
  {
    name: "Lucena Position (Winning Rook Endgame)",
    type: "FEN",
    data: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1",
  },
  {
    name: "Philidor Position (Drawing Rook Endgame)",
    type: "FEN",
    data: "7k/R7/8/4r3/8/8/4P3/4K3 b - - 0 1",
  },
  {
    name: "Morphy's Opera Game (1858)",
    type: "PGN",
    data: "1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#",
  },
]

export const LoadPositionModal: React.FC<LoadPositionModalProps> = ({
  isOpen,
  onClose,
  onLoad,
}) => {
  const [input, setInput] = useState("")
  const [error, setError] = useState(false)

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return

    const success = onLoad(input.trim())
    if (success) {
      setError(false)
      setInput("")
      onClose()
    } else {
      setError(true)
    }
  }

  const handleApplyPreset = (data: string) => {
    setInput(data)
    const success = onLoad(data)
    if (success) {
      setError(false)
      setInput("")
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <FileCode2 className="size-5 text-emerald-400" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Load FEN or PGN
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs">
            Paste a Forsyth-Edwards Notation (FEN) string or a Portable Game Notation (PGN) move list.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setError(false)
              }}
              rows={4}
              placeholder="e.g. rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
              className="w-full rounded-md bg-zinc-900 border border-zinc-800 p-2.5 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-600 resize-none"
            />
            {error && (
              <p className="text-xs text-rose-400">
                Invalid FEN or PGN string. Please check the notation.
              </p>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              Popular Presets & Studies
            </span>
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset.data)}
                  className="flex items-center justify-between p-2 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-zinc-700 text-left transition-colors cursor-pointer group"
                >
                  <span className="text-xs text-zinc-300 group-hover:text-zinc-100 font-medium truncate max-w-[140px]">
                    {preset.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-950 px-1 py-0.5 rounded shrink-0">
                    {preset.type}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800/80">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!input.trim()}
              className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold text-xs"
            >
              <Play className="size-3.5 mr-1.5" />
              Load Position
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
