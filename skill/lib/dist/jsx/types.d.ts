import type * as THREE from 'three';
import type { InstancePlaceFn, PropFactory } from '../types.js';
import type { SceneElement } from './jsx-runtime.js';
type Vec3 = [number, number, number];
type Reactive<T> = T | (() => T);
interface CommonProps {
    position?: Reactive<Vec3>;
    rotation?: Reactive<Vec3>;
    scale?: Reactive<number | Vec3>;
    visible?: Reactive<boolean>;
    lookAt?: Reactive<Vec3>;
    name?: string;
    castShadow?: boolean;
    receiveShadow?: boolean;
    children?: unknown;
}
export interface SceneProps {
    background?: THREE.ColorRepresentation;
    environment?: THREE.Texture;
    children?: unknown;
}
export interface MeshProps extends CommonProps {
    geometry?: THREE.BufferGeometry;
    material?: THREE.Material;
}
export interface PrimitiveProps extends CommonProps {
    object: THREE.Object3D;
}
export interface LightProps extends CommonProps {
    type?: 'spot' | 'point' | 'directional' | 'ambient' | 'hemisphere';
    color?: Reactive<THREE.ColorRepresentation>;
    intensity?: Reactive<number>;
    distance?: number;
    decay?: number;
    angle?: number;
    penumbra?: number;
    groundColor?: THREE.ColorRepresentation;
}
export interface CameraProps extends CommonProps {
    type?: 'perspective' | 'iso' | 'follow';
    fov?: number;
    near?: number;
    far?: number;
    makeDefault?: boolean;
    target?: THREE.Object3D;
    offset?: Vec3;
    viewSize?: number;
    flavor?: 'true-iso' | 'dimetric';
}
export interface PropProps extends CommonProps {
    src: PropFactory | string;
    autoplay?: boolean;
}
export interface InstancesProps extends CommonProps {
    factory?: PropFactory;
    src?: string;
    count?: number;
    radius?: number;
    seed?: number;
    place?: InstancePlaceFn;
}
export interface PostProps {
    bloom?: boolean;
    bloomStrength?: number;
    bloomRadius?: number;
    bloomThreshold?: number;
    children?: unknown;
}
declare global {
    namespace JSX {
        type Element = SceneElement;
        interface ElementChildrenAttribute {
            children: object;
        }
        interface IntrinsicElements {
            scene: SceneProps;
            group: CommonProps;
            mesh: MeshProps;
            primitive: PrimitiveProps;
            light: LightProps;
            camera: CameraProps;
            prop: PropProps;
            instances: InstancesProps;
            post: PostProps;
        }
    }
}
export {};
//# sourceMappingURL=types.d.ts.map