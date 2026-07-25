/**
 * Soft payment confirmation tone — warm chord bloom via Web Audio API.
 * Production browsers keep AudioContext suspended until a user gesture;
 * call unlockPayAudio() early (pointer/key) so Pay can actually sound.
 */
let sharedCtx: AudioContext | null = null
let unlocked = false
let unlockPromise: Promise<boolean> | null = null

function getAudioContextCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  )
}

function getCtx(): AudioContext | null {
  const AC = getAudioContextCtor()
  if (!AC) return null
  if (!sharedCtx || sharedCtx.state === 'closed') {
    sharedCtx = new AC()
    unlocked = false
  }
  return sharedCtx
}

/** Silent buffer + resume — required for Safari / mobile Chrome on live HTTPS. */
async function resumeContext(ctx: AudioContext): Promise<boolean> {
  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    // Extra unlock tick some mobile browsers need after resume
    const buffer = ctx.createBuffer(1, 1, ctx.sampleRate)
    const source = ctx.createBufferSource()
    source.buffer = buffer
    source.connect(ctx.destination)
    source.start(0)
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    unlocked = ctx.state === 'running'
    return unlocked
  } catch {
    return false
  }
}

/** Call from first pointer/key interaction so Pay isn't blocked by autoplay policy. */
export function unlockPayAudio(): void {
  if (unlocked && sharedCtx?.state === 'running') return
  const ctx = getCtx()
  if (!ctx) return
  if (!unlockPromise) {
    unlockPromise = resumeContext(ctx).finally(() => {
      unlockPromise = null
    })
  }
}

/** Soft rounded voice: sine + quiet triangle, long fade */
function softPartial(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  peak: number,
) {
  const master = ctx.createGain()
  master.connect(ctx.destination)

  const sine = ctx.createOscillator()
  const tri = ctx.createOscillator()
  const sineGain = ctx.createGain()
  const triGain = ctx.createGain()

  sine.type = 'sine'
  tri.type = 'triangle'
  sine.frequency.setValueAtTime(freq, start)
  tri.frequency.setValueAtTime(freq, start)

  sineGain.gain.setValueAtTime(1, start)
  triGain.gain.setValueAtTime(0.18, start)

  master.gain.setValueAtTime(0.0001, start)
  master.gain.exponentialRampToValueAtTime(peak, start + 0.12)
  master.gain.exponentialRampToValueAtTime(peak * 0.55, start + duration * 0.45)
  master.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  sine.connect(sineGain)
  tri.connect(triGain)
  sineGain.connect(master)
  triGain.connect(master)

  sine.start(start)
  tri.start(start)
  sine.stop(start + duration + 0.05)
  tri.stop(start + duration + 0.05)
}

export async function playPayChime(): Promise<void> {
  try {
    const ctx = getCtx()
    if (!ctx) return

    // Prefer finishing an in-flight unlock from an earlier gesture
    if (unlockPromise) await unlockPromise
    const ready = await resumeContext(ctx)
    if (!ready) return

    const t = ctx.currentTime + 0.02
    softPartial(ctx, 220.0, t, 0.95, 0.14)
    softPartial(ctx, 277.2, t + 0.04, 1.05, 0.18)
    softPartial(ctx, 329.6, t + 0.08, 1.15, 0.16)
    softPartial(ctx, 440.0, t + 0.14, 1.25, 0.12)
  } catch {
    // Autoplay / unsupported — ignore
  }
}
