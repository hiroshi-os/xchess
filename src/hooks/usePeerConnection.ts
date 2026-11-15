import { useState, useEffect, useRef, useCallback } from "react"
import Peer, { type DataConnection } from "peerjs"
import type { PeerMessage, ChatMessage } from "@/types/chess"

export type ConnectionStatus =
  | "idle"
  | "creating"
  | "waiting"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"

interface UsePeerConnectionProps {
  onMoveReceived?: (moveData: { from: string; to: string; promotion?: string }) => void
  onOpponentJoined?: (opponentName: string, role: "w" | "b") => void
  onMessageReceived?: (msg: PeerMessage) => void
  onChatReceived?: (chat: ChatMessage) => void
  onOpponentResign?: () => void
  onOpponentOfferDraw?: () => void
  onOpponentAcceptDraw?: () => void
  onOpponentRematch?: () => void
}

export function usePeerConnection({
  onMoveReceived,
  onOpponentJoined,
  onMessageReceived,
  onChatReceived,
  onOpponentResign,
  onOpponentOfferDraw,
  onOpponentAcceptDraw,
  onOpponentRematch,
}: UsePeerConnectionProps) {
  const [peerId, setPeerId] = useState<string | null>(null)
  const [roomCode, setRoomCode] = useState<string>("")
  const [status, setStatus] = useState<ConnectionStatus>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [opponentName, setOpponentName] = useState<string>("Opponent")
  const [isHost, setIsHost] = useState<boolean>(false)

  const peerRef = useRef<Peer | null>(null)
  const connRef = useRef<DataConnection | null>(null)

  // Clean up on unmount
  useEffect(() => {
    return () => {
      connRef.current?.close()
      peerRef.current?.destroy()
    }
  }, [])

  const setupConnectionListeners = useCallback(
    (conn: DataConnection, hostSide: boolean) => {
      connRef.current = conn

      conn.on("open", () => {
        setStatus("connected")
        setErrorMessage(null)

        // Handshake: exchange nickname
        const myNickname = localStorage.getItem("xchess_profile")
          ? JSON.parse(localStorage.getItem("xchess_profile")!).nickname
          : "Player"

        conn.send({
          type: "ready",
          payload: {
            nickname: myNickname,
            color: hostSide ? "b" : "w", // host plays White, guest Black
          },
        })
      })

      conn.on("data", (rawData: unknown) => {
        const msg = rawData as PeerMessage
        onMessageReceived?.(msg)

        switch (msg.type) {
          case "ready": {
            if (msg.payload?.nickname) {
              setOpponentName(msg.payload.nickname)
            }
            onOpponentJoined?.(
              msg.payload?.nickname || "Opponent",
              hostSide ? "w" : "b"
            )
            break
          }

          case "move": {
            if (msg.payload) {
              onMoveReceived?.(msg.payload)
            }
            break
          }

          case "chat": {
            if (msg.payload) {
              onChatReceived?.(msg.payload)
            }
            break
          }

          case "resign": {
            onOpponentResign?.()
            break
          }

          case "offer_draw": {
            onOpponentOfferDraw?.()
            break
          }

          case "accept_draw": {
            onOpponentAcceptDraw?.()
            break
          }

          case "rematch_offer": {
            onOpponentRematch?.()
            break
          }
        }
      })

      conn.on("close", () => {
        setStatus("disconnected")
      })

      conn.on("error", (err) => {
        console.error("Connection error:", err)
        setErrorMessage("Connection lost with opponent.")
        setStatus("error")
      })
    },
    [
      onChatReceived,
      onMessageReceived,
      onMoveReceived,
      onOpponentAcceptDraw,
      onOpponentJoined,
      onOpponentOfferDraw,
      onOpponentRematch,
      onOpponentResign,
    ]
  )

  // Host a game
  const createRoom = useCallback(async () => {
    setStatus("creating")
    setErrorMessage(null)
    setIsHost(true)

    // Generate clean 6-char room code
    const generatedCode = `xc-${Math.random().toString(36).substring(2, 8)}`
    setRoomCode(generatedCode)

    if (peerRef.current) {
      peerRef.current.destroy()
    }

    try {
      const peer = new Peer(generatedCode, {
        debug: 1,
      })

      peerRef.current = peer

      peer.on("open", (id) => {
        setPeerId(id)
        setStatus("waiting")
      })

      peer.on("connection", (conn) => {
        setupConnectionListeners(conn, true)
      })

      peer.on("error", (err) => {
        console.error("Peer error:", err)
        setErrorMessage(`Peer connection error: ${err.type}`)
        setStatus("error")
      })
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to initialize multiplayer")
      setStatus("error")
    }
  }, [setupConnectionListeners])

  // Join a game
  const joinRoom = useCallback(
    (codeToJoin: string) => {
      const trimmed = codeToJoin.trim()
      if (!trimmed) return

      setStatus("connecting")
      setErrorMessage(null)
      setIsHost(false)
      setRoomCode(trimmed)

      if (peerRef.current) {
        peerRef.current.destroy()
      }

      const clientPeer = new Peer({ debug: 1 })
      peerRef.current = clientPeer

      clientPeer.on("open", () => {
        const conn = clientPeer.connect(trimmed, { reliable: true })
        setupConnectionListeners(conn, false)
      })

      clientPeer.on("error", (err) => {
        console.error("Join peer error:", err)
        setErrorMessage("Unable to connect to room. Check code and try again.")
        setStatus("error")
      })
    },
    [setupConnectionListeners]
  )

  const sendMove = useCallback((from: string, to: string, promotion?: string) => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({
        type: "move",
        payload: { from, to, promotion },
      })
    }
  }, [])

  const sendChat = useCallback((text: string, senderName: string) => {
    if (connRef.current && connRef.current.open) {
      const msg: ChatMessage = {
        sender: senderName,
        text,
        timestamp: Date.now(),
      }
      connRef.current.send({
        type: "chat",
        payload: msg,
      })
      return msg
    }
    return null
  }, [])

  const sendResign = useCallback(() => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: "resign" })
    }
  }, [])

  const sendDrawOffer = useCallback(() => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: "offer_draw" })
    }
  }, [])

  const sendDrawAccept = useCallback(() => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: "accept_draw" })
    }
  }, [])

  const sendRematchOffer = useCallback(() => {
    if (connRef.current && connRef.current.open) {
      connRef.current.send({ type: "rematch_offer" })
    }
  }, [])

  const disconnect = useCallback(() => {
    connRef.current?.close()
    peerRef.current?.destroy()
    connRef.current = null
    peerRef.current = null
    setStatus("idle")
    setRoomCode("")
    setPeerId(null)
    setOpponentName("Opponent")
  }, [])

  return {
    status,
    peerId,
    roomCode,
    errorMessage,
    opponentName,
    isHost,
    createRoom,
    joinRoom,
    sendMove,
    sendChat,
    sendResign,
    sendDrawOffer,
    sendDrawAccept,
    sendRematchOffer,
    disconnect,
  }
}
