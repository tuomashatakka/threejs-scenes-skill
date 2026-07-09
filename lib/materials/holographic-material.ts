// lib/materials/holographic-material.ts
// Holographic ShaderMaterial — fresnel rim, animated scanlines, noise opacity.
// Demonstrates the standard ShaderMaterial composition pattern. Ported from
// scripts/holographic-material.js. GLSL is kept in /* glsl */ literals.

import * as THREE from 'three'

import type { FrameContext } from '../types.js'


const VERTEX_SHADER = /* glsl */`
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  void main () {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAGMENT_SHADER = /* glsl */`
  uniform float uTime;
  uniform vec3 uBaseColor;
  uniform float uFresnelStrength;
  uniform float uScanlineDensity;
  uniform float uOpacity;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  float hash3 (vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  void main () {
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(vWorldNormal, viewDir), 0.0), uFresnelStrength);

    float scan = sin(vWorldPosition.y * uScanlineDensity + uTime * 2.0) * 0.5 + 0.5;
    float noise = hash3(floor(vWorldPosition * 12.0) + floor(uTime * 6.0));

    vec3 color = uBaseColor * (scan * 0.5 + 0.5);
    color += uBaseColor * fresnel * 2.0;
    color *= 0.85 + noise * 0.15;

    float alpha = clamp(fresnel * 0.8 + scan * 0.2, 0.0, 1.0) * uOpacity;
    gl_FragColor = vec4(color, alpha);
  }
`

/** Options for {@link createHolographicMaterial}: base color, fresnel rim strength, scanline density, and opacity. */
export interface HolographicMaterialOptions {
  baseColor?:       THREE.ColorRepresentation
  fresnelStrength?: number
  scanlineDensity?: number
  opacity?:         number
}

/** A `ShaderMaterial` carrying a `userData.tick(ctx)` that advances its time uniform — register it on the frame loop. */
export interface TickableMaterial extends THREE.ShaderMaterial {
  userData: { tick: (ctx: FrameContext) => void }
}

/**
 * Sci-fi hologram `ShaderMaterial`: fresnel rim glow, animated scanlines, and
 * noise-flicker opacity, additively blended and double-sided.
 *
 * @param options - Color and effect tuning.
 * @returns A {@link TickableMaterial}; call `material.userData.tick(ctx)`
 * each frame (or register it with the loop) to animate.
 */
export function createHolographicMaterial ({
  baseColor = '#79f7ff',
  fresnelStrength = 2,
  scanlineDensity = 40,
  opacity = 1,
}: HolographicMaterialOptions = {}): TickableMaterial {
  const uniforms = {
    uTime:            { value: 0 },
    uBaseColor:       { value: baseColor instanceof THREE.Color ? baseColor : new THREE.Color(baseColor) },
    uFresnelStrength: { value: fresnelStrength },
    uScanlineDensity: { value: scanlineDensity },
    uOpacity:         { value: opacity },
  }

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader:   VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent:    true,
    depthWrite:     false,
    blending:       THREE.AdditiveBlending,
  }) as TickableMaterial

  material.userData.tick = ({ elapsed }: FrameContext) => {
    uniforms.uTime.value = elapsed
  }

  return material
}

// perf: medium. one shader compile per material instance. Share across meshes.
