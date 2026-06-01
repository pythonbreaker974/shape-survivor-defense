const fs = require('fs');
const path = require('path');

const OUT_DIR = path.join(__dirname, '..', 'assets', 'sounds');
const SAMPLE_RATE = 44100;

fs.mkdirSync(OUT_DIR, { recursive: true });

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function envelope(t, duration, attack = 0.012, release = 0.08) {
  const a = Math.min(1, t / attack);
  const r = Math.min(1, (duration - t) / release);
  return Math.max(0, Math.min(a, r));
}

function tone(t, freq, type = 'sine') {
  const p = Math.PI * 2 * freq * t;
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(p));
  if (type === 'square') return Math.sign(Math.sin(p));
  if (type === 'saw') return 2 * (freq * t - Math.floor(freq * t + 0.5));
  return Math.sin(p);
}

function noise(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453123;
  return (x - Math.floor(x)) * 2 - 1;
}

function writeWav(name, duration, render) {
  const frames = Math.floor(duration * SAMPLE_RATE);
  const data = Buffer.alloc(frames * 2);

  for (let i = 0; i < frames; i += 1) {
    const t = i / SAMPLE_RATE;
    const sample = clamp(render(t, duration, i));
    data.writeInt16LE(Math.round(sample * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);

  fs.writeFileSync(path.join(OUT_DIR, `${name}.wav`), Buffer.concat([header, data]));
  console.log(`Wrote assets/sounds/${name}.wav`);
}

writeWav('select', 0.12, (t, d) => {
  const f = 420 + t * 1200;
  return tone(t, f, 'triangle') * envelope(t, d, 0.006, 0.05) * 0.38;
});

writeWav('start', 0.58, (t, d) => {
  const sweep = tone(t, 160 + t * 380, 'triangle') * 0.34;
  const shimmer = tone(t, 640 + t * 260, 'sine') * 0.16;
  const pulse = Math.sin(t * Math.PI * 7) > 0 ? 1 : 0.72;
  return (sweep + shimmer) * envelope(t, d, 0.018, 0.22) * pulse;
});

writeWav('pickup', 0.2, (t, d) => {
  const a = tone(t, 860, 'sine');
  const b = tone(t, 1290, 'triangle') * 0.45;
  return (a + b) * envelope(t, d, 0.004, 0.07) * 0.36;
});

writeWav('level', 0.5, (t, d) => {
  const steps = [440, 554.37, 659.25, 880];
  const idx = Math.min(steps.length - 1, Math.floor((t / d) * steps.length));
  const f = steps[idx];
  const sparkle = noise(Math.floor(t * SAMPLE_RATE / 80)) * 0.045;
  return (tone(t, f, 'triangle') * 0.42 + tone(t, f * 2, 'sine') * 0.12 + sparkle) * envelope(t, d, 0.008, 0.14);
});

writeWav('damage', 0.22, (t, d, i) => {
  const grit = noise(i) * 0.34;
  const drop = tone(t, 220 - t * 360, 'saw') * 0.46;
  return (drop + grit) * envelope(t, d, 0.003, 0.08);
});

writeWav('boss', 0.92, (t, d, i) => {
  const rumble = tone(t, 72 + Math.sin(t * 9) * 8, 'saw') * 0.42;
  const alarm = tone(t, 190 + Math.sin(t * 22) * 20, 'square') * 0.18;
  const dust = noise(i * 0.4) * 0.06;
  return (rumble + alarm + dust) * envelope(t, d, 0.025, 0.26);
});

writeWav('relic', 0.74, (t, d, i) => {
  const chime = tone(t, 392, 'sine') * 0.28 + tone(t, 588, 'triangle') * 0.24 + tone(t, 784, 'sine') * 0.16;
  const glint = noise(Math.floor(i / 100)) * 0.035;
  return (chime + glint) * envelope(t, d, 0.012, 0.3);
});

writeWav('achievement', 0.92, (t, d, i) => {
  const arpeggio = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  const idx = Math.min(arpeggio.length - 1, Math.floor((t / d) * arpeggio.length));
  const main = tone(t, arpeggio[idx], 'triangle') * 0.38;
  const air = noise(Math.floor(i / 120)) * 0.04;
  return (main + tone(t, arpeggio[idx] * 2, 'sine') * 0.08 + air) * envelope(t, d, 0.01, 0.26);
});

writeWav('shield', 0.36, (t, d) => {
  const bloom = tone(t, 260 + t * 580, 'triangle') * 0.38;
  const glass = tone(t, 1180 - t * 220, 'sine') * 0.16;
  return (bloom + glass) * envelope(t, d, 0.006, 0.13);
});

writeWav('gameover', 1.1, (t, d, i) => {
  const fall = tone(t, 220 * Math.pow(0.24, t / d), 'saw') * 0.34;
  const low = tone(t, 68, 'sine') * 0.32;
  const dust = noise(i * 0.25) * 0.045;
  return (fall + low + dust) * envelope(t, d, 0.018, 0.38);
});
