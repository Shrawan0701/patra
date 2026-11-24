import { getMusicById } from '@patra/shared';

/**
 * Multi-voice ambient Web Audio synthesizer producing a ~15-second seamless
 * looping musical bed (warm chord pads + expressive category-specific lead + harmonic shimmer).
 */
export class MusicSynth {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private step = 0;
  private trackId = 'shehnai_bliss';
  private muted = true;
  private streamDest: MediaStreamAudioDestinationNode | null = null;
  private masterGain: GainNode | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 3;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.2;
      this.masterGain.connect(comp);
      comp.connect(this.ctx.destination);

      this.streamDest = this.ctx.createMediaStreamDestination();
      comp.connect(this.streamDest);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public setTrack(trackId: string) {
    this.trackId = trackId;
    this.step = 0;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
    if (!muted) {
      this.start();
    } else {
      this.stop();
    }
  }

  public isMuted() {
    return this.muted;
  }

  private playChordPad(freqs: number[], durationSec: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(680, now);

    const padGain = this.ctx.createGain();
    padGain.gain.setValueAtTime(0.001, now);
    padGain.gain.linearRampToValueAtTime(0.16, now + 0.45);
    padGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

    filter.connect(padGain);
    padGain.connect(this.masterGain);

    for (const f of freqs) {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.connect(filter);
      osc.start(now);
      osc.stop(now + durationSec + 0.05);
    }
  }

  private playLeadVoice(freq: number, timbre: string, durationSec: number) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(
      timbre === 'shehnai' || timbre === 'sitar' ? 1900 : timbre === 'flute' ? 1400 : 2800,
      now
    );

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);

    const attack = timbre === 'flute' || timbre === 'shehnai' ? 0.09 : 0.02;
    gain.gain.linearRampToValueAtTime(0.32, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 1.15);

    const osc = this.ctx.createOscillator();
    osc.type =
      timbre === 'shehnai' || timbre === 'sitar' || timbre === 'santoor'
        ? 'triangle'
        : 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle surreal octave-fifth shimmer on celesta / santoor / harp / bells
    if (timbre === 'celesta' || timbre === 'santoor' || timbre === 'harp' || timbre === 'bells') {
      const shimmer = this.ctx.createOscillator();
      const shimmerGain = this.ctx.createGain();
      shimmer.type = 'sine';
      shimmer.frequency.setValueAtTime(freq * 2, now);
      shimmerGain.gain.setValueAtTime(0.001, now);
      shimmerGain.gain.linearRampToValueAtTime(0.09, now + 0.015);
      shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + durationSec * 0.85);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(this.masterGain);
      shimmer.start(now);
      shimmer.stop(now + durationSec + 0.05);
    }

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + durationSec * 1.2 + 0.05);
  }

  public start(forceStreamOnly = false): MediaStream | null {
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return null;

    // Route only to streamDest during silent capture, or both destination + streamDest during live play
    if (forceStreamOnly) {
      this.masterGain.gain.value = 0.22;
    }

    if (this.timer !== null) {
      window.clearInterval(this.timer);
    }

    // 16-note phrase * ~937ms = ~15-second seamless loop that repeats cleanly until video ends
    const track = getMusicById(this.trackId);
    const stepMs = Math.max(700, Math.round((60 / track.bpm) * 1000));

    const playStep = () => {
      const t = getMusicById(this.trackId);
      const noteIdx = this.step % t.notes.length;
      const freq = t.notes[noteIdx];

      // Trigger a lush warm chord pad every 4 notes
      if (noteIdx % 4 === 0 && t.chords?.length) {
        const chordIdx = Math.floor(noteIdx / 4) % t.chords.length;
        this.playChordPad(t.chords[chordIdx], (stepMs * 4) / 1000);
      }

      this.playLeadVoice(freq, t.timbre, stepMs / 1000);
      this.step += 1;
    };

    playStep();
    this.timer = window.setInterval(playStep, stepMs);
    return this.streamDest ? this.streamDest.stream : null;
  }

  public stop() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }
}
