import * as THREE from 'three';
import type { Disposable } from '../types.js';
export interface SceneEventHandlers {
    onTap?: (hit: THREE.Intersection, event: PointerEvent) => void;
    onPointerDown?: (hit: THREE.Intersection, event: PointerEvent) => void;
    onPointerUp?: (hit: THREE.Intersection, event: PointerEvent) => void;
    onEnter?: (hit: THREE.Intersection) => void;
    onLeave?: () => void;
}
export interface SceneEventBinding extends SceneEventHandlers {
    object: THREE.Object3D;
    /** Raycast descendants too. Default true. */
    recursive?: boolean;
}
export interface SceneEventsOptions {
    element: HTMLElement;
    camera: THREE.Camera;
    bindings?: SceneEventBinding[];
    /** Invert screen-space distortion (e.g. CRT warp) before raycasting. */
    correctPointer?: (ndc: THREE.Vector2) => THREE.Vector2;
}
export interface SceneEvents extends Disposable {
    /** Register a binding; returns its unbinder. */
    add(binding: SceneEventBinding): () => void;
}
export declare function bindSceneEvents({ element, camera, bindings, correctPointer, }: SceneEventsOptions): SceneEvents;
//# sourceMappingURL=scene-events.d.ts.map