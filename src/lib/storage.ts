import type { PlayerProfile } from "@/types/chess"

const PROFILE_KEY = "xchess_profile"
const SETTINGS_KEY = "xchess_settings"

const RANDOM_NICKNAMES = [
  "TacticalKnight",
  "ShadowBishop",
  "RookMaster",
  "PawnStormer",
  "GrandmasterZinc",
  "ZenithChess",
  "NimzoPlayer",
  "CaroKannKing",
  "SicilianVanguard",
  "EndgameWizard",
]

export function getRandomNickname(): string {
  const name = RANDOM_NICKNAMES[Math.floor(Math.random() * RANDOM_NICKNAMES.length)]
  const suffix = Math.floor(Math.random() * 900) + 100
  return `${name}_${suffix}`
}

export function getPlayerProfile(): PlayerProfile {
  if (typeof window === "undefined") {
    return {
      id: "anon",
      nickname: "Player",
      createdAt: Date.now(),
      stats: { gamesPlayed: 0, wins: 0, losses: 0, draws: 0, rating: 1200 },
    }
  }

  try {
    const raw = localStorage.getItem(PROFILE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.error("Failed to load player profile", e)
  }

  // Create initial profile
  const newProfile: PlayerProfile = {
    id: `player_${Math.random().toString(36).substring(2, 9)}`,
    nickname: getRandomNickname(),
    createdAt: Date.now(),
    stats: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      rating: 1200,
    },
  }

  savePlayerProfile(newProfile)
  return newProfile
}

export function savePlayerProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
  } catch (e) {
    console.error("Failed to save player profile", e)
  }
}

export function updatePlayerNickname(nickname: string): PlayerProfile {
  const profile = getPlayerProfile()
  profile.nickname = nickname.trim() || getRandomNickname()
  savePlayerProfile(profile)
  return profile
}

export function recordGameResult(result: "win" | "loss" | "draw"): PlayerProfile {
  const profile = getPlayerProfile()
  profile.stats.gamesPlayed += 1

  if (result === "win") {
    profile.stats.wins += 1
    profile.stats.rating += 16
  } else if (result === "loss") {
    profile.stats.losses += 1
    profile.stats.rating = Math.max(400, profile.stats.rating - 16)
  } else {
    profile.stats.draws += 1
  }

  savePlayerProfile(profile)
  return profile
}

export interface UserSettings {
  soundEnabled: boolean
  autoQueen: boolean
  showLegalMoves: boolean
  boardTheme: "zinc" | "slate" | "emerald" | "amber"
}

export function getUserSettings(): UserSettings {
  const defaults: UserSettings = {
    soundEnabled: true,
    autoQueen: false,
    showLegalMoves: true,
    boardTheme: "zinc",
  }

  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      return { ...defaults, ...JSON.parse(raw) }
    }
  } catch (e) {
    // ignore
  }

  return defaults
}

export function saveUserSettings(settings: Partial<UserSettings>): UserSettings {
  const current = getUserSettings()
  const updated = { ...current, ...settings }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch (e) {
    // ignore
  }
  return updated
}
