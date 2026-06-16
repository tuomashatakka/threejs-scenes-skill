// scripts/glyph-atlas.js
// Build a sprite atlas of glyphs via OffscreenCanvas. Returns a CanvasTexture
// plus grid metadata so consumers can compute per-glyph UVs.

import * as THREE from 'three'

export function createGlyphAtlas (glyphs, {
  cellSize = 64,
  font = `${0.7}em sans-serif`,
  color = '#ffffff',
  background = 'transparent',
} = {}) {
  const cols = Math.ceil(Math.sqrt(glyphs.length))
  const rows = Math.ceil(glyphs.length / cols)
  const canvas = new OffscreenCanvas(cols * cellSize, rows * cellSize)
  const ctx = canvas.getContext('2d')

  if (background !== 'transparent') {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }

  ctx.font = `${cellSize * 0.7}px ${font}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = color

  glyphs.forEach((g, i) => {
    const cx = (i % cols) * cellSize + cellSize / 2
    const cy = Math.floor(i / cols) * cellSize + cellSize / 2
    ctx.fillText(g, cx, cy)
  })

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true

  return {
    texture,
    cols,
    rows,
    cellSize,
    uvFor (glyphIndex) {
      const col = glyphIndex % cols
      const row = Math.floor(glyphIndex / cols)
      return {
        x: col / cols,
        y: 1 - (row + 1) / rows,
        w: 1 / cols,
        h: 1 / rows,
      }
    },
  }
}

// perf: cheap. one-time generation, then sampled as a regular texture.
