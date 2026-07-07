// lib/compose/skybox.ts
// Skybox factory: flat color, procedural vertical gradient (a BackSide shader
// dome — texture-free, works headless), equirect panorama, or six-face cube.
// Texture-loading paths are DOM-guarded; the gradient/color paths are pure GL
// objects and safe anywhere.
import * as THREE from 'three';
const GRADIENT_VERTEX = /* glsl */ `
varying vec3 vDir;
void main () {
  vDir = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww; // depth = far plane: the dome never occludes anything
}
`;
const GRADIENT_FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uExponent;
varying vec3 vDir;
void main () {
  float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(mix(uBottom, uTop, pow(h, uExponent)), 1.0);
}
`;
export function createSkybox(scene, { color, gradient, equirect, cube, environment = false, radius = 400, }) {
    const previousBackground = scene.background;
    const previousEnvironment = scene.environment;
    const owned = [];
    let object = null;
    function setTexture(texture, ownsTexture) {
        scene.background = texture;
        if (environment)
            scene.environment = texture;
        if (ownsTexture)
            owned.push(texture);
    }
    if (gradient) {
        const material = new THREE.ShaderMaterial({
            vertexShader: GRADIENT_VERTEX,
            fragmentShader: GRADIENT_FRAGMENT,
            uniforms: {
                uTop: { value: new THREE.Color(gradient.top) },
                uBottom: { value: new THREE.Color(gradient.bottom) },
                uExponent: { value: gradient.exponent ?? 1.5 },
            },
            side: THREE.BackSide,
            depthWrite: false,
            fog: false,
        });
        const geometry = new THREE.SphereGeometry(radius, 32, 16);
        const dome = new THREE.Mesh(geometry, material);
        dome.frustumCulled = false;
        dome.renderOrder = -1;
        object = dome;
        scene.add(dome);
        owned.push(geometry, material);
    }
    else if (color !== undefined)
        scene.background = new THREE.Color(color);
    else if (equirect)
        if (typeof equirect === 'string')
            if (typeof document === 'undefined')
                console.warn('createSkybox: equirect URL needs a DOM; skipped');
            else
                new THREE.TextureLoader().load(equirect, texture => {
                    texture.mapping = THREE.EquirectangularReflectionMapping;
                    texture.colorSpace = THREE.SRGBColorSpace;
                    setTexture(texture, true);
                });
        else {
            equirect.mapping = THREE.EquirectangularReflectionMapping;
            setTexture(equirect, false);
        }
    else if (cube)
        if (Array.isArray(cube))
            if (typeof document === 'undefined')
                console.warn('createSkybox: cube URLs need a DOM; skipped');
            else
                new THREE.CubeTextureLoader().load(cube, texture => {
                    texture.colorSpace = THREE.SRGBColorSpace;
                    setTexture(texture, true);
                });
        else
            setTexture(cube, false);
    return {
        object,
        dispose() {
            if (object)
                scene.remove(object);
            for (const resource of owned)
                resource.dispose();
            scene.background = previousBackground;
            if (environment)
                scene.environment = previousEnvironment;
        },
    };
}
// perf: cheap. gradient mode is one BackSide dome draw at far-plane depth;
// texture modes are zero extra draws (scene.background).
//# sourceMappingURL=skybox.js.map