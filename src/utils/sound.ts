/**
 * Synthesizes clean, pleasant Web Audio API tones without requiring any external assets.
 */

let activeCallAudioContext: AudioContext | null = null
let callAudioInterval: any = null

export function playNotificationSound() {
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') {
      ctx.resume()
    }

    const now = ctx.currentTime

    // First tone (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(587.33, now)

    gain1.gain.setValueAtTime(0, now)
    gain1.gain.linearRampToValueAtTime(0.18, now + 0.03)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

    osc1.connect(gain1)
    gain1.connect(ctx.destination)

    osc1.start(now)
    osc1.stop(now + 0.22)

    // Second harmonic tone (A5 - 880 Hz)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.08)

    gain2.gain.setValueAtTime(0, now + 0.08)
    gain2.gain.linearRampToValueAtTime(0.22, now + 0.11)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

    osc2.connect(gain2)
    gain2.connect(ctx.destination)

    osc2.start(now + 0.08)
    osc2.stop(now + 0.4)
  } catch (err) {
    console.debug('Notification sound failed or blocked by autoplay policy:', err)
  }
}

/**
 * Plays periodic outgoing dial tone (tut... tut...)
 */
export function playOutgoingDialTone() {
  stopCallAudio()
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    activeCallAudioContext = new AudioContextClass()
    if (activeCallAudioContext.state === 'suspended') {
      activeCallAudioContext.resume()
    }

    const playTone = () => {
      if (!activeCallAudioContext || activeCallAudioContext.state === 'closed') return
      try {
        const ctx = activeCallAudioContext
        const now = ctx.currentTime
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = 'sine'
        osc.frequency.setValueAtTime(425, now)

        gain.gain.setValueAtTime(0, now)
        gain.gain.linearRampToValueAtTime(0.15, now + 0.05)
        gain.gain.setValueAtTime(0.15, now + 0.95)
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(now)
        osc.stop(now + 1.0)
      } catch {
        /* ignore */
      }
    }

    playTone()
    callAudioInterval = setInterval(playTone, 3000)
  } catch (err) {
    console.debug('Outgoing dial tone error:', err)
  }
}

/**
 * Plays rhythmic musical ringtone for incoming calls
 */
export function playIncomingRingtone() {
  stopCallAudio()
  if (typeof window === 'undefined') return

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) return

    activeCallAudioContext = new AudioContextClass()
    if (activeCallAudioContext.state === 'suspended') {
      activeCallAudioContext.resume()
    }

    const playChime = () => {
      if (!activeCallAudioContext || activeCallAudioContext.state === 'closed') return
      try {
        const ctx = activeCallAudioContext
        const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
        notes.forEach((freq, i) => {
          const now = ctx.currentTime + i * 0.12
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()

          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, now)

          gain.gain.setValueAtTime(0, now)
          gain.gain.linearRampToValueAtTime(0.2, now + 0.03)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

          osc.connect(gain)
          gain.connect(ctx.destination)

          osc.start(now)
          osc.stop(now + 0.5)
        })
      } catch {
        /* ignore */
      }
    }

    playChime()
    callAudioInterval = setInterval(playChime, 2500)
  } catch (err) {
    console.debug('Incoming ringtone error:', err)
  }
}

/**
 * Stops any ongoing ringing or dial tones
 */
export function stopCallAudio() {
  if (callAudioInterval) {
    clearInterval(callAudioInterval)
    callAudioInterval = null
  }
  if (activeCallAudioContext) {
    try {
      activeCallAudioContext.close()
    } catch {
      /* ignore */
    }
    activeCallAudioContext = null
  }
}
