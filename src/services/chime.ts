let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedContext) sharedContext = new AudioContext()
  return sharedContext
}

function playTone(ctx: AudioContext, frequency: number, startTime: number, duration: number): void {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency

  gain.gain.setValueAtTime(0.0001, startTime)
  gain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)

  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start(startTime)
  oscillator.stop(startTime + duration + 0.05)
}

/** A clean two-tone chime synthesized entirely via Web Audio — no external assets. */
export function playChime(): void {
  const ctx = getAudioContext()
  void ctx.resume()
  const now = ctx.currentTime
  playTone(ctx, 880, now, 0.15)
  playTone(ctx, 1318.5, now + 0.15, 0.3)
}
