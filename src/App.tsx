import { useState, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { ChessBoard } from "@/components/chess/ChessBoard"
import { GameClock } from "@/components/chess/GameClock"
import { CapturedPieces } from "@/components/chess/CapturedPieces"
import { MoveHistory } from "@/components/chess/MoveHistory"
import { GameControls } from "@/components/chess/GameControls"
import { AnalysisPanel } from "@/components/chess/AnalysisPanel"
import { EvalBar } from "@/components/chess/EvalBar"
import { PromotionDialog } from "@/components/chess/PromotionDialog"
import { NicknameModal } from "@/components/modals/NicknameModal"
import { GameOverModal } from "@/components/modals/GameOverModal"
import { OnlineRoomModal } from "@/components/modals/OnlineRoomModal"
import { LoadPositionModal } from "@/components/modals/LoadPositionModal"
import { useChessGame } from "@/hooks/useChessGame"
import { usePeerConnection } from "@/hooks/usePeerConnection"
import { getPlayerProfile, getUserSettings, saveUserSettings } from "@/lib/storage"
import { sounds } from "@/lib/audio"
import type { Color } from "chess.js"
import type { GameMode, ChatMessage } from "@/types/chess"
import { BOT_CONFIGS } from "@/lib/engine"

export default function App() {
  const [profile, setProfile] = useState(() => getPlayerProfile())
  const [settings, setSettings] = useState(() => getUserSettings())
  const [boardOrientation, setBoardOrientation] = useState<Color>("w")

  // Modals
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false)
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState(false)
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false)

  // Online Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  // Peer Connection
  const peer = usePeerConnection({
    onMoveReceived: (moveData) => {
      game.executeMove(moveData.from as any, moveData.to as any, (moveData.promotion as any) || "q")
    },
    onOpponentJoined: (oppName, assignedColor) => {
      setBoardOrientation(assignedColor)
      game.setUserColor(assignedColor)
      setIsOnlineModalOpen(false)
      addSystemChat(`${oppName} entered the room as ${assignedColor === "w" ? "White" : "Black"}.`)
    },
    onChatReceived: (chat) => {
      setChatMessages((prev) => [...prev, chat])
    },
    onOpponentResign: () => {
      game.resign(game.userColor === "w" ? "b" : "w")
    },
    onOpponentOfferDraw: () => {
      if (window.confirm(`${peer.opponentName} offered a draw. Accept?`)) {
        peer.sendDrawAccept()
        game.agreeDraw()
      }
    },
    onOpponentAcceptDraw: () => {
      game.agreeDraw()
    },
    onOpponentRematch: () => {
      if (window.confirm(`${peer.opponentName} wants a rematch. Accept?`)) {
        game.resetGame("online")
      }
    },
  })

  // Chess Game State
  const game = useChessGame({
    initialMode: "vs-computer",
    initialDifficulty: 2,
    initialTimeMinutes: 5,
    playerColor: boardOrientation,
    onMoveMade: (move) => {
      if (game.gameMode === "online") {
        peer.sendMove(move.from, move.to, move.promotion)
      }
    },
  })

  // Synchronize sound enabled
  useEffect(() => {
    sounds.setEnabled(settings.soundEnabled)
  }, [settings.soundEnabled])

  // Open Game Over modal when result is computed
  useEffect(() => {
    if (game.gameResult) {
      setIsGameOverModalOpen(true)
    }
  }, [game.gameResult])

  // Check URL params for room invite on initial load (e.g. ?room=xc-123456)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const roomParam = params.get("room")
      if (roomParam) {
        game.setGameMode("online")
        peer.joinRoom(roomParam)
        setIsOnlineModalOpen(true)
      }
    }
  }, [])

  const addSystemChat = (text: string) => {
    setChatMessages((prev) => [
      ...prev,
      { sender: "System", text, timestamp: Date.now(), isSystem: true },
    ])
  }

  const handleToggleSound = () => {
    const updated = saveUserSettings({ soundEnabled: !settings.soundEnabled })
    setSettings(updated)
  }

  const handleSelectMode = (mode: GameMode) => {
    if (mode === "online") {
      setIsOnlineModalOpen(true)
      return
    }
    if (game.gameMode === "online") {
      peer.disconnect()
    }
    game.resetGame(mode)
  }

  const handleFlipBoard = () => {
    setBoardOrientation((prev) => (prev === "w" ? "b" : "w"))
  }

  const handleNewGame = () => {
    game.resetGame()
  }

  const handleSendChat = (text: string) => {
    const msg = peer.sendChat(text, profile.nickname)
    if (msg) {
      setChatMessages((prev) => [...prev, msg])
    }
  }

  const handleResign = () => {
    if (game.gameMode === "online") {
      peer.sendResign()
    }
    game.resign(game.userColor)
  }

  const handleOfferDraw = () => {
    if (game.gameMode === "online") {
      peer.sendDrawOffer()
      addSystemChat("Draw offer sent to opponent.")
    } else {
      game.agreeDraw()
    }
  }

  // Top and Bottom Player Labels & Clocks
  const isPlayingAsBlack = boardOrientation === "b"

  const topColor: Color = isPlayingAsBlack ? "w" : "b"
  const bottomColor: Color = isPlayingAsBlack ? "b" : "w"

  const isAnalysis = game.gameMode === "analysis"

  const topPlayerName = isAnalysis
    ? "Analysis Board"
    : game.gameMode === "vs-computer"
    ? BOT_CONFIGS[game.botDifficulty].name
    : game.gameMode === "online"
    ? peer.opponentName
    : isPlayingAsBlack
    ? "White"
    : "Black"

  const topPlayerRating =
    !isAnalysis && game.gameMode === "vs-computer"
      ? BOT_CONFIGS[game.botDifficulty].rating
      : undefined

  const bottomPlayerName = isAnalysis
    ? "Interactive Engine"
    : game.gameMode === "pass-and-play"
    ? isPlayingAsBlack
      ? "Black"
      : "White"
    : profile.nickname

  const bottomPlayerRating =
    !isAnalysis && game.gameMode !== "pass-and-play" ? profile.stats.rating : undefined

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Sleek Header */}
      <Navbar
        profile={profile}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        gameMode={game.gameMode}
        onSelectMode={handleSelectMode}
        connectionStatus={peer.status}
        onOpenOnlineModal={() => setIsOnlineModalOpen(true)}
        soundEnabled={settings.soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_360px] gap-6 items-start justify-center">
          {/* 1. Evaluation Bar (Desktop) */}
          <div className="hidden lg:flex h-[620px] items-center">
            <EvalBar score={game.evalScore} isFlipped={isPlayingAsBlack} />
          </div>

          {/* 2. Center Chess Board Section */}
          <div className="flex flex-col gap-2 max-w-[620px] w-full mx-auto">
            {/* Top Player Info & Clock */}
            <div className="space-y-1">
              <GameClock
                seconds={topColor === "w" ? game.whiteTime : game.blackTime}
                isActive={game.turn === topColor && !game.gameResult && !isAnalysis}
                playerName={topPlayerName}
                playerColor={topColor}
                rating={topPlayerRating}
                isBotThinking={game.isBotThinking && topColor !== game.userColor}
              />
              <CapturedPieces
                pieces={topColor === "w" ? game.capturedPieces.w : game.capturedPieces.b}
                color={topColor}
                advantage={
                  topColor === "w"
                    ? game.capturedPieces.advantage
                    : -game.capturedPieces.advantage
                }
              />
            </div>

            {/* Chess Board */}
            <ChessBoard
              board={game.chess.board()}
              orientation={boardOrientation}
              turn={game.turn}
              userColor={game.userColor}
              gameMode={game.gameMode}
              selectedSquare={game.selectedSquare}
              legalMoves={game.legalMoves}
              lastMove={game.lastMove}
              checkedKingSquare={game.checkedKingSquare}
              premove={game.premove}
              onSquareClick={game.handleSquareClick}
              onMoveAttempt={game.handleMoveAttempt}
              onCancelPremove={game.cancelPremove}
              disabled={!!game.gameResult}
            />

            {/* Bottom Player Info & Clock */}
            <div className="space-y-1">
              <CapturedPieces
                pieces={bottomColor === "w" ? game.capturedPieces.w : game.capturedPieces.b}
                color={bottomColor}
                advantage={
                  bottomColor === "w"
                    ? game.capturedPieces.advantage
                    : -game.capturedPieces.advantage
                }
              />
              <GameClock
                seconds={bottomColor === "w" ? game.whiteTime : game.blackTime}
                isActive={game.turn === bottomColor && !game.gameResult && !isAnalysis}
                playerName={bottomPlayerName}
                playerColor={bottomColor}
                rating={bottomPlayerRating}
              />
            </div>
          </div>

          {/* 3. Right Sidebar: Move History & Controls/Analysis Panel */}
          <div className="flex flex-col gap-4 w-full max-w-[620px] lg:max-w-[360px] mx-auto lg:h-[620px]">
            <div className="flex-1 min-h-[260px]">
              <MoveHistory
                moves={game.moveHistory}
                fen={game.fen}
                currentIndex={game.currentHistoryIndex}
                onGoToMove={game.goToMove}
                onStepMove={game.stepMove}
              />
            </div>

            {isAnalysis ? (
              <AnalysisPanel
                fen={game.fen}
                turn={game.turn}
                evalScore={game.evalScore}
                isCheck={game.isCheck}
                onFlipBoard={handleFlipBoard}
                onReset={() => game.resetGame("analysis")}
                onOpenLoadModal={() => setIsLoadModalOpen(true)}
                onPlayMove={(from, to) => game.handleMoveAttempt(from as any, to as any)}
              />
            ) : (
              <GameControls
                gameMode={game.gameMode}
                botDifficulty={game.botDifficulty}
                onSelectDifficulty={(lvl) => game.setBotDifficulty(lvl)}
                isCheck={game.isCheck}
                turn={game.turn}
                onFlipBoard={handleFlipBoard}
                onResign={handleResign}
                onOfferDraw={handleOfferDraw}
                onNewGame={handleNewGame}
                isOnline={game.gameMode === "online"}
                chatMessages={chatMessages}
                onSendChat={handleSendChat}
                opponentName={peer.opponentName}
              />
            )}
          </div>
        </div>
      </main>

      {/* Pawn Promotion Dialog */}
      <PromotionDialog
        isOpen={!!game.pendingPromotion}
        color={game.turn}
        onSelectPiece={game.confirmPromotion}
        onCancel={game.cancelPromotion}
      />

      {/* Nickname & Profile Modal */}
      <NicknameModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      {/* Online Matchmaking Modal */}
      <OnlineRoomModal
        isOpen={isOnlineModalOpen}
        onClose={() => setIsOnlineModalOpen(false)}
        roomCode={peer.roomCode}
        connectionStatus={peer.status}
        onCreateRoom={peer.createRoom}
        onJoinRoom={(code) => {
          game.setGameMode("online")
          peer.joinRoom(code)
        }}
      />

      {/* Load FEN or PGN Modal */}
      <LoadPositionModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
        onLoad={game.loadPosition}
      />

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={isGameOverModalOpen}
        result={game.gameResult}
        userColor={game.userColor}
        onRematch={() => {
          setIsGameOverModalOpen(false)
          game.resetGame()
        }}
        onClose={() => setIsGameOverModalOpen(false)}
      />
    </div>
  )
}
