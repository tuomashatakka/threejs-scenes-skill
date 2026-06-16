// scripts/sprite-batch.js
// Shader-billboarded InstancedMesh. One draw call for 100k+ camera-facing
// quads. Cylindrical (y-axis only) for trees/grass; spherical for UI markers.

import * as THREE from 'three'

const VERTEX_SHADER = /* glsl */`
  attribute vec3 aInstancePos;
  attribute vec2 aInstanceScale;
  attribute vec2 aInstanceUvOffset;
  attribute vec2 aInstanceUvScale;
  uniform float uMode;   // 0 = spherical, 1 = cylindrical

  varying vec2 vUv;
  varying float vDistance;

  void main () {
    // instance center in view space
    vec4 viewCenter = modelViewMatrix * vec4(aInstancePos, 1.0);

    vec3 right = vec3(1.0, 0.0, 0.0);
    vec3 up    = vec3(0.0, 1.0, 0.0);
    if (uMode > 0.5) {
      // cylindrical: keep world up, recompute right from view-space forward
      vec3 viewForward = normalize(-viewCenter.xyz);
      right = normalize(cross(up, viewForward));
    }

    vec3 offset = right * (position.x * aInstanceScale.x)
                + up    * (position.y * aInstanceScale.y);

    vec4 viewPos = viewCenter + vec4(offset, 0.0);
    gl_Position = projectionMatrix * viewPos;
    vUv = aInstanceUvOffset + uv * aInstanceUvScale;
    vDistance = -viewPos.z;
  }
`

const FRAGMENT_SHADER = /* glsl */`
  uniform sampler2D uMap;
  uniform float uNearFade;
  uniform float uFarFade;
  varying vec2 vUv;
  varying float vDistance;

  void main () {
    vec4 c = texture2D(uMap, vUv);
    float nearAlpha = smoothstep(uNearFade - 1.0, uNearFade, vDistance);
    float farAlpha  = 1.0 - smoothstep(uFarFade - 5.0, uFarFade, vDistance);
    c.a *= nearAlpha * farAlpha;
    if (c.a < 0.01) discard;
    gl_FragColor = c;
  }
`

export function createSpriteBatch ({
  count,
  texture,
  mode = 'spherical',
  nearFade = 1,
  farFade = 100,
} = {}) {
  const geometry = new THREE.PlaneGeometry(1, 1)
  const instancedGeometry = new THREE.InstancedBufferGeometry()
  instancedGeometry.setAttribute('position', geometry.getAttribute('position'))
  instancedGeometry.setAttribute('uv', geometry.getAttribute('uv'))
  instancedGeometry.setIndex(geometry.getIndex())

  const aInstancePos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)
  const aInstanceScale = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2)
  const aInstanceUvOffset = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2)
  const aInstanceUvScale = new THREE.InstancedBufferAttribute(new Float32Array(count * 2), 2)

  // sensible defaults
  for (let i = 0; i < count; i++) {
    aInstanceScale.setXY(i, 1, 1)
    aInstanceUvScale.setXY(i, 1, 1)
  }

  instancedGeometry.setAttribute('aInstancePos',      aInstancePos)
  instancedGeometry.setAttribute('aInstanceScale',    aInstanceScale)
  instancedGeometry.setAttribute('aInstanceUvOffset', aInstanceUvOffset)
  instancedGeometry.setAttribute('aInstanceUvScale',  aInstanceUvScale)
  instancedGeometry.instanceCount = count

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap:      { value: texture },
      uMode:     { value: mode === 'cylindrical' ? 1 : 0 },
      uNearFade: { value: nearFade },
      uFarFade:  { value: farFade },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })

  const mesh = new THREE.Mesh(instancedGeometry, material)
  mesh.frustumCulled = false

  return {
    mesh,
    setInstance (i, { x, y, z, width = 1, height = 1, uvOffset = [0, 0], uvScale = [1, 1] }) {
      aInstancePos.setXYZ(i, x, y, z)
      aInstanceScale.setXY(i, width, height)
      aInstanceUvOffset.setXY(i, uvOffset[0], uvOffset[1])
      aInstanceUvScale.setXY(i, uvScale[0], uvScale[1])
    },
    flush () {
      aInstancePos.needsUpdate = true
      aInstanceScale.needsUpdate = true
      aInstanceUvOffset.needsUpdate = true
      aInstanceUvScale.needsUpdate = true
    },
    dispose () {
      instancedGeometry.dispose()
      material.dispose()
    },
  }
}

// perf: cheap. 1 draw call for the whole batch. Billboarding happens in vertex
// shader; no JS-side lookAt cost.
