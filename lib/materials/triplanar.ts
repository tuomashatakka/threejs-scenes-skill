// lib/materials/triplanar.ts
// Triplanar grid material, ported from shaders-fr's room material. World-space
// UVs picked per-fragment by the dominant normal axis — no unwrapping, no
// seams on procedural geometry. Palette-driven: base gradient between two
// colours, grid lines in a third, cheap directional shading + fog tint.

import * as THREE from 'three'


export interface TriplanarMaterialOptions {

  /** [base A, base B, grid/accent]. */
  palette?: [THREE.ColorRepresentation, THREE.ColorRepresentation, THREE.ColorRepresentation]

  /** World units per grid cell (smaller = denser grid). Default 0.4. */
  tileScale?: number

  /** Distance where the fog tint saturates. Default 40. */
  fogDistance?: number

  side?: THREE.Side
}

export function createTriplanarMaterial ({
  palette = [ '#2c3244', '#3c4a66', '#79f7ff' ],
  tileScale = 0.4,
  fogDistance = 40,
  side = THREE.DoubleSide,
}: TriplanarMaterialOptions = {}): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side,
    uniforms: {
      uA:         { value: new THREE.Color(palette[0]) },
      uB:         { value: new THREE.Color(palette[1]) },
      uC:         { value: new THREE.Color(palette[2]) },
      uTime:      { value: 0 },
      uTileScale: { value: tileScale },
      uFogDist:   { value: fogDistance },
    },
    vertexShader: /* glsl */`
      varying vec3 vWorldPos;
      varying vec3 vNormal;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        vNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform vec3 uA;
      uniform vec3 uB;
      uniform vec3 uC;
      uniform float uTime;
      uniform float uTileScale;
      uniform float uFogDist;
      varying vec3 vWorldPos;
      varying vec3 vNormal;

      float grid(vec2 uv, float w) {
        vec2 g = abs(fract(uv) - 0.5);
        float d = min(g.x, g.y);
        return smoothstep(w, w - 0.02, d);
      }

      void main() {
        vec3 n = normalize(vNormal);
        // world-space UVs by dominant axis — triplanar without 3 samples
        vec2 uv = mix(vWorldPos.xz, vWorldPos.xy, abs(n.z));
        uv = mix(uv, vWorldPos.zy, abs(n.x));
        uv *= uTileScale;

        float g = grid(uv, 0.04);
        vec3 base = mix(uA, uB, 0.5 + 0.5 * sin(uv.x * 0.3 + uv.y * 0.2));
        base = mix(base, uC, g);

        // cheap directional shading using the normal
        float light = 0.45 + 0.55 * clamp(dot(n, normalize(vec3(0.4, 1.0, 0.3))), 0.0, 1.0);
        vec3 col = base * light;

        // subtle distance fog tint
        float fog = smoothstep(0.0, uFogDist, length(vWorldPos.xz));
        col = mix(col, uC * 0.7, fog * 0.2);

        gl_FragColor = vec4(pow(col, vec3(0.4545)), 1.0);
      }
    `,
  })
}

// perf: cheap. One pass, no textures — the grid and shading are analytic.
// Share one instance across every surface using the same palette.
