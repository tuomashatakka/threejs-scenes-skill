// lib/post/webgpu/dof.ts
// Depth of field — bokeh blur by distance from the focus plane. Wraps three's
// DepthOfFieldNode. Pattern: COLOUR + VIEW-Z effect (needs the pass viewZ node).
// Also exports a `createDofBasic` mirroring the dof/basic example: a cheap
// boxBlur lerped by a view-space focus distance, no dedicated node.
import * as THREE from 'three';
import { mix, smoothstep, uniform } from 'three/tsl';
import { boxBlur } from 'three/addons/tsl/display/boxBlur.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
export function createDof(input, viewZ, options = {}) {
    const { focusDistance = 10, focalLength = 1, bokehScale = 1 } = options;
    return dof(input, viewZ, focusDistance, focalLength, bokehScale);
}
// Cheap DOF (dof/basic example): box-blur the colour, then lerp sharp<->blurred
// by smoothstep over the absolute view-Z distance to the focus point.
export function createDofBasic(input, viewZ, options = {}) {
    const { focusPoint = new THREE.Vector3(), minDistance = 1, maxDistance = 3, blurSize = 2, blurSpread = 4, } = options;
    const focusPointView = uniform(focusPoint);
    const blurred = boxBlur(input, { size: uniform(blurSize), separation: uniform(blurSpread) });
    const blur = smoothstep(minDistance, maxDistance, viewZ.sub(focusPointView.z).abs());
    return mix(input, blurred, blur);
}
// perf: medium. One box-blur pass; far cheaper than the bokeh DepthOfFieldNode.
//# sourceMappingURL=dof.js.map