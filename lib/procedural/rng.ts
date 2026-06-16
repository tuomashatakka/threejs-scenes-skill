// lib/procedural/rng.ts
// Seeded pseudo-random number generators. Same seed -> same output.
// mulberry32 core ported from scripts/rng.js; createSeededRng wraps it with the
// fork(label) determinism API from production-lessons.md (seed once, fork per
// consumer so build order and undo/redo replay never change the output).

import type { SeededRng } from '../types.js'


export function mulberry32 (seed: number): () => number {
  let a = seed >>> 0
  return function rng () {
    a = a + 0x6D2B79F5 >>> 0

    let t = a
    t = Math.imul(t ^ t >>> 15, t | 1)
    t ^= t + Math.imul(t ^ t >>> 7, t | 61)
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

export function hash2 (x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return s - Math.floor(s)
}

export function hash3 (x: number, y: number, z: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453
  return s - Math.floor(s)
}

export function lerp (a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function smoothstep (edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

// FNV-1a string hash, used to derive a stable sub-seed from a fork label.
function hashLabel (label: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function createSeededRng (seed: number): SeededRng {
  const seedInt = seed >>> 0
  const next    = mulberry32(seedInt)

  const rng: SeededRng = {
    next,
    range (min, max) {
      return min + next() * (max - min)
    },
    int (minInclusive, maxInclusive) {
      return Math.floor(minInclusive + next() * (maxInclusive - minInclusive + 1))
    },
    pick (items) {
      if (items.length === 0)
        throw new Error('createSeededRng.pick: empty array')
      return items[Math.floor(next() * items.length)] as (typeof items)[number]
    },
    fork (label) {
      // label-hashed sub-stream: same seed + same label -> identical stream,
      // regardless of how many siblings forked before it.
      return createSeededRng(hashLabel(label, seedInt))
    },
  }
  return rng
}

// perf: cheap. all pure functions; fork allocates one closure per consumer.
