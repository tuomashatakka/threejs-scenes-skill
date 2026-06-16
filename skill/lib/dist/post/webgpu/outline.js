// lib/post/webgpu/outline.ts
// Outline — edge highlight around selected objects. Wraps three's OutlineNode.
// Pattern: SCENE/CAMERA effect (renders its own selection pass). Composite over
// the scene colour using the example's recommended blend.
import { outline } from 'three/addons/tsl/display/OutlineNode.js';
export function createOutline(scene, camera, options) {
    return outline(scene, camera, options);
}
// perf: medium. Renders a separate selection pass + edge detection.
//# sourceMappingURL=outline.js.map