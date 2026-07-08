// scripts/gltf-prop.js
// Load a glTF model and wire its baked animations into the frame loop. loadGLTF
// + createAnimationController come from the library's loaders/animation modules.
// 'threejs-scenes' maps to the esm.sh package (version-pinned) in an
// artifact (see references/library.md).

import {
  loadGLTF, createAnimationController,
} from 'threejs-scenes'


export async function loadGltfProp (url, ctx) {
  // pass { draco: true } / { ktx2, renderer } if the asset is compressed
  const { scene, animations } = await loadGLTF(url)
  ctx.scene.add(scene)

  let controller = null
  if (animations.length) {
    controller = createAnimationController(scene, animations, ctx.loop)
    controller.play(animations[0].name, { reset: true }) // play the first clip, looping
  }

  function dispose () {
    controller?.dispose()
    scene.parent?.remove(scene)
    scene.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose()
      const mats = Array.isArray(obj.material) ? obj.material : obj.material ? [ obj.material ] : []
      mats.forEach(m => m.dispose())
    })
  }

  return { object: scene, controller, dispose }
}

// perf: loading is async + off the render thread. Reuse one loader across calls;
// dispose frees the model's geometry/materials (three never auto-frees).
