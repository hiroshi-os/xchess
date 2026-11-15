import React from "react"
import type { PieceSymbol, Color } from "chess.js"

interface PieceProps {
  type: PieceSymbol
  color: Color
  className?: string
}

export const ChessPiece: React.FC<PieceProps> = ({ type, color, className = "size-full" }) => {
  const isWhite = color === "w"

  // Refined Staunton SVG path designs
  // White pieces: White body with dark crisp accents
  // Black pieces: Dark charcoal body with silvery zinc highlights
  const mainColor = isWhite ? "#f8fafc" : "#18181b"
  const strokeColor = isWhite ? "#09090b" : "#e4e4e7"
  const accentColor = isWhite ? "#e2e8f0" : "#27272a"
  const detailColor = isWhite ? "#0f172a" : "#d4d4d8"

  switch (type) {
    case "p": // Pawn
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={mainColor}
            stroke={strokeColor}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="m 11,39.5 23,0 c 0,1.5 -1.5,2.5 -3,2.5 l -17,0 c -1.5,0 -3,-1 -3,-2.5 z"
            fill={accentColor}
            stroke={strokeColor}
            strokeWidth="1.5"
          />
          <circle cx="22.5" cy="13" r="3" fill={isWhite ? "#ffffff" : "#27272a"} />
        </svg>
      )

    case "r": // Rook
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={mainColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
            <path d="M 14,29.5 L 11,32 L 34,32 L 31,29.5" />
            <path d="M 11,39 L 11,41.5 L 34,41.5 L 34,39" />
          </g>
          <line x1="14" y1="20" x2="31" y2="20" stroke={detailColor} strokeWidth="1" />
        </svg>
      )

    case "n": // Knight
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={mainColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
            <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,7.4 17.06,5.05 19.5,7 C 20,7.5 20.5,8.5 21,9 C 23.5,8 24.5,8 26.5,8 C 28.5,8 30,9.5 30.5,10.5" />
            <circle cx="15.5" cy="15.5" r="1.5" fill={detailColor} stroke="none" />
            <path d="M 9.5,39 L 35.5,39 L 35.5,41.5 L 9.5,41.5 z" />
          </g>
        </svg>
      )

    case "b": // Bishop
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={mainColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
            <path d="M 11,39 L 11,41.5 L 34,41.5 L 34,39" />
            <path d="M 15,32 C 15,28 12.5,23.5 16,18 C 17.5,15.5 20,13 22.5,10 C 25,13 27.5,15.5 29,18 C 32.5,23.5 30,28 30,32" />
            <circle cx="22.5" cy="8" r="2.5" />
            <path d="M 17.5,26 L 27.5,26" />
            <path d="M 22.5,21 L 22.5,31" />
          </g>
          <path d="M 20.5,16.5 L 24.5,12.5" stroke={detailColor} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )

    case "q": // Queen
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={mainColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
            <path d="M 11,39 L 11,41.5 L 34,41.5 L 34,39" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
            <path d="M 12.5,32 C 11,26 8,17 7,12.5 C 10.5,15 15,18 16.5,23 C 18,17 21,11 22.5,8 C 24,11 27,17 28.5,23 C 30,18 34.5,15 38,12.5 C 37,17 34,26 32.5,32 L 12.5,32 z" />
            <circle cx="7" cy="11" r="2" />
            <circle cx="14.5" cy="8" r="2" />
            <circle cx="22.5" cy="6.5" r="2" />
            <circle cx="30.5" cy="8" r="2" />
            <circle cx="38" cy="11" r="2" />
          </g>
          <path
            d="M 14,29 C 18,27.5 27,27.5 31,29"
            stroke={detailColor}
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      )

    case "k": // King
      return (
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <g fill={mainColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.5 L 22.5,5" />
            <path d="M 20,8 L 25,8" />
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
            <path d="M 11,39 L 11,41.5 L 34,41.5 L 34,39" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
            <path d="M 12.5,32 C 10,26 12,18 15,16 C 18,14 19,16 22.5,18 C 26,16 27,14 30,16 C 33,18 35,26 32.5,32 L 12.5,32 z" />
            <circle cx="22.5" cy="15" r="2.5" />
          </g>
          <path
            d="M 13.5,29 C 18,27.5 27,27.5 31.5,29"
            stroke={detailColor}
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
      )

    default:
      return null
  }
}
