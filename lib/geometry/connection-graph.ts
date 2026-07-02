// lib/geometry/connection-graph.ts
// k-nearest-neighbour connection graph as one LineSegments draw call, with
// per-edge draw-on progress and per-node highlighting done in-shader — the
// star-map / constellation-lines pattern from stellar-cartogrph, generalized.

import * as THREE from 'three'

import type { Disposable } from '../types.js'


export interface ConnectionGraphOptions {

  /** Edges per node. Default 3. */
  neighbors?: number

  /** Skip edges longer than this. Default Infinity. */
  maxDistance?:    number
  color?:          THREE.ColorRepresentation
  highlightColor?: THREE.ColorRepresentation
  opacity?:        number
}

export interface ConnectionGraph extends Disposable {
  object: THREE.LineSegments

  /** [nodeIndexA, nodeIndexB] per edge, in attribute order. */
  edges: ReadonlyArray<readonly [number, number]>

  /** Draw-on animation: 0 = no edges, 1 = all edges visible. */
  setProgress (t: number): void

  /** Brighten every edge touching this node; null clears. */
  setHighlight (nodeIndex: number | null): void
}

export function createConnectionGraph (
  nodes: ReadonlyArray<readonly [number, number, number]>,
  {
    neighbors = 3,
    maxDistance = Infinity,
    color = '#4488ff',
    highlightColor = '#aaddff',
    opacity = 0.55,
  }: ConnectionGraphOptions = {},
): ConnectionGraph {
  // brute-force kNN — fine to a few thousand nodes; the draw is one call anyway.
  const edges: Array<readonly [number, number]> = []
  const seen                                    = new Set<number>()
  const maxSq                                   = maxDistance * maxDistance
  for (let i = 0; i < nodes.length; i++) {
    const a                                          = nodes[i] as readonly [number, number, number]
    const distances: Array<{ j: number; d: number }> = []
    for (let j = 0; j < nodes.length; j++) {
      if (j === i)
        continue

      const b  = nodes[j] as readonly [number, number, number]
      const dx = a[0] - b[0]
      const dy = a[1] - b[1]
      const dz = a[2] - b[2]
      const d  = dx * dx + dy * dy + dz * dz
      if (d <= maxSq)
        distances.push({ j, d })
    }
    distances.sort((p, q) => p.d - q.d)
    for (const { j } of distances.slice(0, neighbors)) {
      const key = i < j ? i * nodes.length + j : j * nodes.length + i
      if (seen.has(key))
        continue
      seen.add(key)
      edges.push([ i, j ])
    }
  }

  const positions = new Float32Array(edges.length * 6)
  const progress  = new Float32Array(edges.length * 2)
  const nodeIds   = new Float32Array(edges.length * 2)
  for (let e = 0; e < edges.length; e++) {
    const [ i, j ] = edges[e] as readonly [number, number]
    const a        = nodes[i] as readonly [number, number, number]
    const b        = nodes[j] as readonly [number, number, number]
    positions.set(a, e * 6)
    positions.set(b, e * 6 + 3)

    // both verts of an edge share its normalized order for the draw-on reveal
    const t             = edges.length > 1 ? e / (edges.length - 1) : 0
    progress[e * 2 + 0] = t
    progress[e * 2 + 1] = t
    nodeIds[e * 2 + 0]  = i
    nodeIds[e * 2 + 1]  = j
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aProgress', new THREE.BufferAttribute(progress, 1))
  geometry.setAttribute('aNode', new THREE.BufferAttribute(nodeIds, 1))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uProgress:  { value: 1 },
      uHighlight: { value: -1 },
      uColor:     { value: new THREE.Color(color) },
      uHiColor:   { value: new THREE.Color(highlightColor) },
      uOpacity:   { value: opacity },
    },
    vertexShader: /* glsl */`
      attribute float aProgress;
      attribute float aNode;
      uniform float uHighlight;
      varying float vVisible;
      varying float vHi;
      void main () {
        vVisible = aProgress;
        vHi = abs(aNode - uHighlight) < 0.5 ? 1.0 : 0.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform float uProgress, uOpacity;
      uniform vec3 uColor, uHiColor;
      varying float vVisible;
      varying float vHi;
      void main () {
        if (vVisible > uProgress) discard;
        vec3 c = mix(uColor, uHiColor, vHi);
        gl_FragColor = vec4(c, uOpacity + vHi * (1.0 - uOpacity));
      }
    `,
    transparent: true,
    depthWrite:  false,
  })

  const lines = new THREE.LineSegments(geometry, material)

  return {
    object: lines,
    edges,
    setProgress (t) {
      material.uniforms.uProgress.value = t
    },
    setHighlight (nodeIndex) {
      material.uniforms.uHighlight.value = nodeIndex ?? -1
    },
    dispose () {
      geometry.dispose()
      material.dispose()
    },
  }
}

// perf: build is O(n²) kNN — fine to ~3k nodes, precompute above that. Render
// is a single LineSegments draw call regardless of edge count.
