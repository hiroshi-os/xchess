// Web Audio API Sound Synthesizer for Chess Sound Effects
// 100% client-side, zero latency, no external assets needed

class SoundManager {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume()
    }
    return this.ctx
  }

  public setEnabled(val: boolean) {
    this.enabled = val
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  // Crisp wooden piece click
  public playMove() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(320, now)
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.05)

    gain.gain.setValueAtTime(0.4, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.06)
  }

  // Deep woody capture thud with noise impact
  public playCapture() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Low sine thud
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "triangle"
    osc.frequency.setValueAtTime(220, now)
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.09)

    gain.gain.setValueAtTime(0.6, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.1)

    // Second click micro-delay
    setTimeout(() => {
      this.playMove()
    }, 30)
  }

  // Castling - double swift move
  public playCastle() {
    if (!this.enabled) return
    this.playMove()
    setTimeout(() => {
      this.playMove()
    }, 110)
  }

  // Check alert - harmonic bell chime
  public playCheck() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime
    const freqs = [587.33, 880] // D5 + A5 harmonic chime

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "sine"
      osc.frequency.setValueAtTime(freq, now)

      gain.gain.setValueAtTime(0.25 - idx * 0.05, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.35)
    })
  }

  // Game Victory Arpeggio
  public playVictory() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "triangle"
        osc.frequency.setValueAtTime(freq, now)

        gain.gain.setValueAtTime(0.3, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.45)
      }, idx * 100)
    })
  }

  // Defeat / Draw chime
  public playDefeat() {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [440, 415.3, 392, 349.23] // A4, Ab4, G4, F4
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (!ctx) return
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now)

        gain.gain.setValueAtTime(0.25, now)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 0.5)
      }, idx * 120)
    })
  }
}

export const sounds = new SoundManager()
