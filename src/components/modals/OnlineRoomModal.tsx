import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Copy, Check, Users, Link as LinkIcon, Loader2 } from "lucide-react"
import type { ConnectionStatus } from "@/hooks/usePeerConnection"

interface OnlineRoomModalProps {
  isOpen: boolean
  onClose: () => void
  roomCode: string
  connectionStatus: ConnectionStatus
  onCreateRoom: () => void
  onJoinRoom: (code: string) => void
}

export const OnlineRoomModal: React.FC<OnlineRoomModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  connectionStatus,
  onCreateRoom,
  onJoinRoom,
}) => {
  const [inputCode, setInputCode] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const inviteLink = typeof window !== "undefined" && roomCode
    ? `${window.location.origin}${window.location.pathname}?room=${roomCode}`
    : ""

  const copyCode = () => {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const copyLink = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputCode.trim()) return

    // If pasted full URL, extract code
    let code = inputCode.trim()
    if (code.includes("room=")) {
      const match = code.match(/room=([a-zA-Z0-9_-]+)/)
      if (match && match[1]) {
        code = match[1]
      }
    }

    onJoinRoom(code)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <Users className="size-5 text-emerald-400" />
            <DialogTitle className="text-xl font-bold tracking-tight">
              Play with a Friend
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400 text-xs">
            Direct peer-to-peer multiplayer. No server accounts needed.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="create" className="w-full mt-2">
          <TabsList className="grid grid-cols-2 bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg mb-4">
            <TabsTrigger
              value="create"
              onClick={() => !roomCode && onCreateRoom()}
              className="text-xs font-semibold py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Host Match
            </TabsTrigger>
            <TabsTrigger
              value="join"
              className="text-xs font-semibold py-1.5 data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
            >
              Join Match
            </TabsTrigger>
          </TabsList>

          {/* Host Game Tab */}
          <TabsContent value="create" className="space-y-4">
            {connectionStatus === "waiting" || roomCode ? (
              <div className="space-y-3.5">
                <div className="p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-400">
                      Room Code
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      onClick={copyCode}
                      className="text-xs h-6 text-zinc-300 hover:text-zinc-100"
                    >
                      {copiedCode ? (
                        <Check className="size-3 text-emerald-400 mr-1" />
                      ) : (
                        <Copy className="size-3 mr-1" />
                      )}
                      {copiedCode ? "Copied" : "Copy"}
                    </Button>
                  </div>
                  <div className="font-mono text-lg font-bold text-center tracking-widest text-emerald-400 bg-zinc-950/80 py-2 rounded border border-zinc-800">
                    {roomCode}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    onClick={copyLink}
                    variant="outline"
                    className="w-full border-zinc-800 hover:bg-zinc-900 font-medium text-xs"
                  >
                    {copiedLink ? (
                      <Check className="size-3.5 text-emerald-400 mr-1.5" />
                    ) : (
                      <LinkIcon className="size-3.5 text-zinc-400 mr-1.5" />
                    )}
                    {copiedLink ? "Invite Link Copied!" : "Copy Direct Invite Link"}
                  </Button>

                  <div className="flex items-center justify-center gap-2 py-2 text-xs text-zinc-400">
                    <Loader2 className="size-3.5 animate-spin text-emerald-400" />
                    <span>Waiting for your opponent to join...</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 flex flex-col items-center justify-center space-y-3">
                <Button
                  onClick={onCreateRoom}
                  className="bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold w-full"
                >
                  Generate Room Code
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Join Game Tab */}
          <TabsContent value="join" className="space-y-4">
            <form onSubmit={handleJoin} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Enter Room Code or Invite Link
                </label>
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="e.g. xc-9b4f2a"
                  className="bg-zinc-900/80 border-zinc-800 text-zinc-100 font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={!inputCode.trim() || connectionStatus === "connecting"}
                className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 font-semibold"
              >
                {connectionStatus === "connecting" ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" />
                    Connecting...
                  </>
                ) : (
                  "Connect & Play"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
