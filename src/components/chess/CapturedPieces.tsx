import React from "react"
import type { PieceSymbol, Color } from "chess.js"
import { ChessPiece } from "@/lib/pieces"

interface CapturedPiecesProps {
  pieces: PieceSymbol[]
  color: Color // which side captured these pieces
  advantage: number // positive if this side has material lead
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  pieces,
  color,
  advantage,
}) => {
  // Opponent color of pieces that were captured
  const capturedPieceColor: Color = color === "w" ? "b" : "w"

  return (
    <div className="flex items-center gap-1 min-h-[22px] px-1">
      <div className="flex items-center -space-x-1 overflow-x-auto">
        {pieces.map((pieceType, idx) => (
          <div key={`${pieceType}-${idx}`} className="size-4 shrink-0 opacity-80 hover:opacity-100 transition-opacity">
            <ChessPiece type={pieceType} color={capturedPieceColor} />
          </div>
        ))}
      </div>
      {advantage > 0 && (
        <span className="text-[11px] font-mono font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1 py-0.2 rounded ml-1">
          +{advantage}
        </span>
      )}
    </div>
  )
}
