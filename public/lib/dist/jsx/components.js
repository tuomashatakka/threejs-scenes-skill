// lib/jsx/components.ts
// Host config for the JSX reconciler. Each intrinsic element name maps to a
// Host: a real three object plus a setProp(name, value) applier and a dispose().
// The reconciler owns reactivity and tree-walking; this file owns the mapping
// from <Tag> to lib factories.
import * as THREE from 'three';
import { createIsoCamera } from '../camera/iso-camera.js';
import { createFollowCamera } from '../camera/follow-camera.js';
import { createInstancedProp } from '../props/instanced-prop.js';
import { resolveProp } from '../props/registry.js';
import { createComposer } from '../post/composer.js';
function applyCommon(object, name, value) {
    switch (name) {
        case 'position':
            object.position.fromArray(value);
            return true;
        case 'rotation':
            object.rotation.fromArray(value);
            return true;
        case 'scale':
            if (typeof value === 'number')
                object.scale.setScalar(value);
            else
                object.scale.fromArray(value);
            return true;
        case 'visible':
            object.visible = Boolean(value);
            return true;
        case 'name':
            object.name = String(value);
            return true;
        case 'castShadow':
            object.castShadow = Boolean(value);
            return true;
        case 'receiveShadow':
            object.receiveShadow = Boolean(value);
            return true;
        case 'lookAt':
            object.lookAt(...value);
            return true;
        default: return false;
    }
}
function createLight(type) {
    switch (type) {
        case 'ambient': return new THREE.AmbientLight();
        case 'hemisphere': return new THREE.HemisphereLight();
        case 'directional': return new THREE.DirectionalLight();
        case 'spot': return new THREE.SpotLight();
        case 'point':
        default: return new THREE.PointLight();
    }
}
function lightHost(props) {
    const light = createLight(String(props.type ?? 'point'));
    // ambient/hemisphere lights have no shadow camera — enabling castShadow on
    // them spams "<light> has no shadow" every frame.
    light.castShadow = 'shadow' in light;
    return {
        object: light,
        container: light,
        setProp(name, value) {
            const l = light;
            switch (name) {
                case 'type': break;
                case 'color':
                    light.color.set(value);
                    break;
                case 'intensity':
                    light.intensity = value;
                    break;
                case 'distance':
                    if (l.distance !== undefined)
                        l.distance = value;
                    break;
                case 'decay':
                    if (l.decay !== undefined)
                        l.decay = value;
                    break;
                case 'angle':
                    if (l.angle !== undefined)
                        l.angle = value;
                    break;
                case 'penumbra':
                    if (l.penumbra !== undefined)
                        l.penumbra = value;
                    break;
                case 'groundColor':
                    l.groundColor?.set(value);
                    break;
                default: applyCommon(light, name, value);
            }
        },
        dispose() {
            light.parent?.remove(light);
            light.dispose();
        },
    };
}
function cameraHost(props, rt) {
    const type = String(props.type ?? 'perspective');
    let camera;
    if (type === 'iso')
        camera = createIsoCamera(rt.getAspect(), {
            viewSize: props.viewSize,
            flavor: props.flavor,
        });
    else
        camera = new THREE.PerspectiveCamera(props.fov ?? 50, rt.getAspect(), props.near ?? 0.1, props.far ?? 500);
    rt.setCamera(camera, props.makeDefault !== false);
    if (type === 'follow' && props.target) {
        const offset = new THREE.Vector3().fromArray(props.offset ?? [0, 3, 6]);
        const controller = createFollowCamera(camera, props.target, { offset });
        rt.addDisposer(rt.loop.registerUpdate(ctx => controller.update(ctx)));
        rt.disableOrbit();
    }
    return {
        object: camera,
        container: camera,
        setProp(name, value) {
            const cam = camera;
            switch (name) {
                case 'type':
                case 'makeDefault':
                case 'target':
                case 'offset':
                case 'viewSize':
                case 'flavor':
                    break;
                case 'fov':
                    if (cam.isPerspectiveCamera) {
                        cam.fov = value;
                        cam.updateProjectionMatrix();
                    }
                    break;
                case 'near':
                    cam.near = value;
                    cam.updateProjectionMatrix();
                    break;
                case 'far':
                    cam.far = value;
                    cam.updateProjectionMatrix();
                    break;
                default: applyCommon(camera, name, value);
            }
        },
        dispose() { },
    };
}
function propHost(props, rt) {
    const placeholder = new THREE.Group();
    let instance = null;
    const src = props.src;
    resolveProp(src, { rng: rt.rng, loop: rt.loop })
        .then(inst => {
        instance = inst;
        placeholder.add(inst.object);
    })
        .catch((err) => console.error('<Prop> failed to load', src, err));
    return {
        object: placeholder,
        container: placeholder,
        setProp(name, value) {
            if (name === 'src' || name === 'autoplay')
                return;
            applyCommon(placeholder, name, value);
        },
        dispose() {
            instance?.dispose();
        },
    };
}
function instancesHost(props, rt) {
    const group = new THREE.Group();
    let dispose = () => { };
    const options = {
        count: props.count ?? 100,
        radius: props.radius,
        seed: props.seed,
        place: props.place,
    };
    const factory = props.factory;
    if (factory) {
        const result = createInstancedProp(factory, options, { rng: rt.rng, loop: rt.loop });
        group.add(result.object);
        dispose = result.dispose;
    }
    else if (typeof props.src === 'string')
        import(/* @vite-ignore */ props.src)
            .then(mod => {
            const f = (mod.default ?? mod.prop);
            const result = createInstancedProp(f, options, { rng: rt.rng, loop: rt.loop });
            group.add(result.object);
            dispose = result.dispose;
        })
            .catch((err) => console.error('<Instances> failed to load', props.src, err));
    return {
        object: group,
        container: group,
        setProp(name, value) {
            if (['count', 'radius', 'seed', 'place', 'factory', 'src'].includes(name))
                return;
            applyCommon(group, name, value);
        },
        dispose() {
            dispose();
        },
    };
}
function postHost(props, rt) {
    let handle = null;
    rt.addPostSetup(() => {
        const [width, height] = rt.getSize();
        handle = createComposer({
            renderer: rt.renderer,
            scene: rt.scene,
            camera: rt.getCamera(),
            width,
            height,
            withBloom: props.bloom !== false,
            bloomStrength: props.bloomStrength,
            bloomRadius: props.bloomRadius,
            bloomThreshold: props.bloomThreshold,
        });
        rt.setComposer(handle);
    });
    return {
        object: null,
        container: null,
        setProp() { },
        dispose() {
            handle?.dispose();
        },
    };
}
export function createHost(type, props, rt) {
    switch (type) {
        case 'scene':
            return {
                object: rt.scene,
                container: rt.scene,
                setProp(name, value) {
                    if (name === 'background')
                        rt.scene.background = new THREE.Color(value);
                    else if (name === 'environment')
                        rt.scene.environment = value;
                },
                dispose() { },
            };
        case 'group': {
            const group = new THREE.Group();
            return { object: group, container: group, setProp: (n, v) => applyCommon(group, n, v), dispose() { } };
        }
        case 'mesh': {
            const mesh = new THREE.Mesh();
            return {
                object: mesh,
                container: mesh,
                setProp(name, value) {
                    if (name === 'geometry')
                        mesh.geometry = value;
                    else if (name === 'material')
                        mesh.material = value;
                    else
                        applyCommon(mesh, name, value);
                },
                dispose() { },
            };
        }
        case 'primitive': {
            const object = props.object;
            return {
                object,
                container: object,
                setProp(name, value) {
                    if (name !== 'object')
                        applyCommon(object, name, value);
                },
                dispose() { },
            };
        }
        case 'light': return lightHost(props);
        case 'camera': return cameraHost(props, rt);
        case 'prop': return propHost(props, rt);
        case 'instances': return instancesHost(props, rt);
        case 'post': return postHost(props, rt);
        default:
            throw new Error(`<${type}> is not a known intrinsic element`);
    }
}
export const RAW_FUNCTION_PROPS = new Set(['place', 'build', 'clips', 'lights']);
//# sourceMappingURL=components.js.map