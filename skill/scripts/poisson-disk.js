// scripts/poisson-disk.js
// Poisson disk 2D sampling. Generates points with guaranteed minimum spacing,
// looking natural — better than uniform random for forests, asteroid fields,
// star scatter. Returns array of [x, y] points.

export function poissonDisk2D ({
  width,
  height,
  minDist,
  rng,
  k = 30,
} = {}) {
  if (!width || !height)
    throw new Error('width and height required')
  if (!minDist)
    throw new Error('minDist required')
  if (!rng)
    throw new Error('rng required (seeded function returning [0,1))')

  const cellSize = minDist / Math.SQRT2
  const cols     = Math.ceil(width / cellSize)
  const rows     = Math.ceil(height / cellSize)
  const grid     = new Array(cols * rows).fill(null)
  const points   = []
  const active   = []

  function addPoint (x, y) {
    const p = [ x, y ]
    points.push(p)
    active.push(p)
    grid[Math.floor(x / cellSize) + Math.floor(y / cellSize) * cols] = p
  }

  addPoint(rng() * width, rng() * height)

  while (active.length > 0) {
    const idx        = Math.floor(rng() * active.length)
    const [ px, py ] = active[idx]
    let placed = false
    for (let i = 0; i < k; i++) {
      const a  = rng() * Math.PI * 2
      const r  = minDist * (1 + rng())
      const nx = px + Math.cos(a) * r
      const ny = py + Math.sin(a) * r
      if (nx < 0 || nx >= width || ny < 0 || ny >= height)
        continue

      const gx = Math.floor(nx / cellSize)
      const gy = Math.floor(ny / cellSize)
      let ok = true
      for (let dy = -2; dy <= 2 && ok; dy++)
        for (let dx = -2; dx <= 2 && ok; dx++) {
          const cgx = gx + dx
          const cgy = gy + dy
          if (cgx < 0 || cgy < 0 || cgx >= cols || cgy >= rows)
            continue

          const n = grid[cgx + cgy * cols]
          if (n && (n[0] - nx) ** 2 + (n[1] - ny) ** 2 < minDist * minDist)
            ok = false
        }
      if (ok) {
        addPoint(nx, ny)
        placed = true
        break
      }
    }
    if (!placed)
      active.splice(idx, 1)
  }
  return points
}

// perf: cheap. O(N) where N = output point count.
