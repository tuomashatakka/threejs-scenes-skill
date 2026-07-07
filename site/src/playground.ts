// site/src/playground.ts
import type { LibraryModule, PlaySeed } from './types'


interface PlaygroundOptions {
  modules: LibraryModule[]
  baseUrl: string
}

function escapeHtml (value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeScript (value: string): string {
  return value.replace(new RegExp('<' + '/script', 'gi'), '<\\/script')
}

function moduleSpecifier (module: LibraryModule): string {
  return module.specifier
}

function moduleUrl (baseUrl: string, module: LibraryModule): string {
  return `${baseUrl}${module.importUrl.replace(/^\//, '')}`
}

function importMap (seed: PlaySeed, module: LibraryModule, baseUrl: string): string {
  return JSON.stringify({
    imports: {
      three: 'https://esm.sh/three@0.184.0',
      'three/addons/': 'https://esm.sh/three@0.184.0/addons/',
      'three/webgpu': 'https://esm.sh/three@0.184.0/webgpu',
      'three/tsl': 'https://esm.sh/three@0.184.0/tsl',
      '@tuomashatakka/canvas-loop-framecapper': `${baseUrl}lib/vendor/canvas-loop-framecapper/index.js`,
      react: 'https://esm.sh/react@19',
      [moduleSpecifier(module)]: moduleUrl(baseUrl, module),
    },
  }, null, 2)
}

function webgpuFallback (seed: PlaySeed): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    html, body { margin: 0; min-height: 100%; background: #10131a; color: #f3efe7; font: 14px/1.5 system-ui, sans-serif }
    main { min-height: 100vh; display: grid; place-items: center; padding: 24px }
    article { max-width: 42rem; border: 1px solid #5e4d2d; background: #1d1712; padding: 18px; border-radius: 8px }
    code { color: #ffd166 }
  </style>
</head>
<body>
  <main>
    <article>
      <h1>webgpu unavailable</h1>
      <p><code>${escapeHtml(seed.exportName)}</code> is documented and covered, but this browser does not expose <code>navigator.gpu</code>. the page gates it before importing webgpu modules.</p>
    </article>
  </main>
  <script>window.__SCENE_READY__ = true</script>
</body>
</html>`
}

function sharedHarnessHelpers (): string {
  return String.raw `
    const canvas = document.querySelector('#scene')
    const report = document.querySelector('#report')
    const stats = document.querySelector('#stats')
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#10131a')
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    camera.position.set(4, 3, 6)
    const altScene = new THREE.Scene()
    const altCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    altCamera.position.set(-4, 2.5, 5)
    altCamera.lookAt(0, 0, 0)

    let theta = Math.atan2(camera.position.x, camera.position.z)
    let phi = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z))
    let radius = camera.position.length()
    const updateCamera = () => {
      const r = radius * Math.cos(phi)
      camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r)
      camera.lookAt(0, 0, 0)
    }
    updateCamera()

    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = new RoomEnvironment()
    scene.environment = pmrem.fromScene(env, 0.04).texture
    scene.environmentIntensity = 0.6
    pmrem.dispose()
    env.traverse((object) => object.geometry?.dispose())
    const keyLight = new THREE.DirectionalLight('#fff1c6', 2.2)
    keyLight.position.set(8, 12, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    const hemi = new THREE.HemisphereLight('#b5f7ec', '#3d251d', 0.5)
    scene.add(keyLight, keyLight.target, hemi)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7, 48),
      new THREE.MeshStandardMaterial({ color: '#171714', roughness: 0.9 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.2
    floor.receiveShadow = true
    scene.add(floor)

    const demoMaterial = new THREE.MeshStandardMaterial({ color: '#6fe7d2', roughness: 0.42, metalness: 0.16, flatShading: true })
    const demoGeometry = new THREE.IcosahedronGeometry(1, 1)
    const demoMesh = new THREE.Mesh(demoGeometry.clone(), demoMaterial.clone())
    const demoShape = new THREE.Shape()
    demoShape.moveTo(-0.8, -0.5)
    demoShape.lineTo(0.7, -0.55)
    demoShape.lineTo(0.9, 0.35)
    demoShape.quadraticCurveTo(0, 0.85, -0.85, 0.35)
    demoShape.lineTo(-0.8, -0.5)
    const demoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.4, 0, 0),
      new THREE.Vector3(-0.4, 0.7, 0.4),
      new THREE.Vector3(0.5, -0.2, -0.4),
      new THREE.Vector3(1.5, 0.4, 0),
    ])
    const demoPoints = [
      [-1.4, 0, 0],
      [-0.4, 0.9, 0.35],
      [0.6, -0.2, -0.35],
      [1.4, 0.5, 0.1],
    ]
    const demoVectorPoints = demoPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    const demoProfile = [[0.25, -1], [0.75, -0.5], [0.45, 0.25], [0.9, 0.9]]
    const demoTextureCanvas = document.createElement('canvas')
    demoTextureCanvas.width = 64
    demoTextureCanvas.height = 64
    const paintDemoTexture = (ctx = demoTextureCanvas.getContext('2d')) => {
      if (!ctx) return
      const gradient = ctx.createLinearGradient(0, 0, 64, 64)
      gradient.addColorStop(0, '#6fe7d2')
      gradient.addColorStop(1, '#ff7ab6')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 64, 64)
      ctx.fillStyle = 'rgba(10, 10, 20, 0.35)'
      for (let y = 0; y < 64; y += 8) ctx.fillRect(0, y, 64, 3)
    }
    paintDemoTexture()
    const demoTexture = new THREE.CanvasTexture(demoTextureCanvas)
    const demoFragmentShader = 'void mainImage(out vec4 fragColor, in vec2 fragCoord) { vec2 uv = fragCoord / iResolution.xy; fragColor = vec4(uv, 1.0, 1.0); }'
    const postContext = { renderer, scene, camera, width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 }
    const loop = createLoop()
    const tickers = new Set()
    const mixers = []
    let featuredObject = null
    let composer = null
    let outputPass = null
    let customRender = null

    function createLoop () {
      const subs = new Set()
      const clock = new THREE.Clock()
      let frame = 0
      let raf = 0
      const tick = () => {
        const delta = clock.getDelta()
        const elapsed = clock.getElapsedTime()
        frame += 1
        for (const cb of subs) cb({ delta, elapsed, frame })
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return {
        onFrame (cb) { subs.add(cb); return () => subs.delete(cb) },
        dispose () { cancelAnimationFrame(raf); subs.clear() },
      }
    }

    function attachResizeObserver () {
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect
        renderer.setSize(width, height, false)
        camera.aspect = width / Math.max(1, height)
        camera.updateProjectionMatrix()
        altCamera.aspect = camera.aspect
        altCamera.updateProjectionMatrix()
        composer?.setSize(width, height)
        customRender?.setSize?.(width, height)
        postContext.width = width
        postContext.height = height
      })
      ro.observe(canvas.parentElement ?? document.body)
      return () => ro.disconnect()
    }

    function attachPointerGesture (el) {
      const pointers = new Map()
      let lastPinch = 0
      el.style.touchAction = 'none'
      const onDown = (event) => {
        el.setPointerCapture(event.pointerId)
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          lastPinch = Math.hypot(a.x - b.x, a.y - b.y)
        }
      }
      const onMove = (event) => {
        const point = pointers.get(event.pointerId)
        if (!point) return
        const dx = event.clientX - point.x
        const dy = event.clientY - point.y
        point.x = event.clientX
        point.y = event.clientY
        if (pointers.size === 1) {
          theta -= dx * 0.005
          phi = Math.max(-1.3, Math.min(1.3, phi + dy * 0.005))
          updateCamera()
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (lastPinch > 0)
            radius = Math.max(2, Math.min(40, radius / (dist / lastPinch)))
          lastPinch = dist
          updateCamera()
        }
      }
      const onUp = (event) => {
        pointers.delete(event.pointerId)
        if (pointers.size < 2) lastPinch = 0
      }
      const onWheel = (event) => {
        event.preventDefault()
        radius = Math.max(2, Math.min(40, radius * (1 + event.deltaY * 0.001)))
        updateCamera()
      }
      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        el.removeEventListener('wheel', onWheel)
      }
    }

    function disposeMaterial (material) {
      for (const key in material) {
        const value = material[key]
        if (value && typeof value === 'object' && 'minFilter' in value)
          value.dispose?.()
      }
      material.dispose?.()
    }

    function disposeScene (root) {
      root.traverse((object) => {
        object.geometry?.dispose?.()
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
        for (const material of materials)
          disposeMaterial(material)
      })
    }

    function showError (error) {
      report.hidden = false
      report.textContent = error?.stack || error?.message || String(error)
      stats.textContent = 'error'
      window.__SCENE_READY__ = true
    }

    function formatValue (value) {
      if (value === undefined) return 'undefined'
      if (value === null) return 'null'
      if (typeof value === 'string') return value
      if (typeof value === 'number' || typeof value === 'boolean') return String(value)
      if (typeof value === 'function') return value.toString().slice(0, 180)
      if (value?.constructor?.name) return '[' + value.constructor.name + ']'
      try { return JSON.stringify(value, null, 2) ?? String(value) }
      catch { return String(value) }
    }

    function showValue (value) {
      report.hidden = false
      report.textContent = 'value fallback:\n' + formatValue(value) + '\n\nedit the code and press run to wire it differently.'
    }

    function addVisibleObject (object) {
      object.traverse?.((child) => {
        child.castShadow = child.castShadow ?? true
        child.receiveShadow = child.receiveShadow ?? true
      })
      scene.add(object)
      featuredObject = object
      stats.textContent = 'scene object'
      return object
    }

    function previewMaterial (material) {
      const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.22, 96, 14), material)
      addVisibleObject(mesh)
      tickers.add(({ elapsed }) => {
        material.userData?.tick?.({ delta: 0, elapsed, frame: 0 })
      })
    }

    function previewGeometry (geometry) {
      const mesh = new THREE.Mesh(geometry, demoMaterial.clone())
      addVisibleObject(mesh)
    }

    function previewShape (shape) {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 })
      previewGeometry(geometry)
    }

    function previewTexture (texture) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.5),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      )
      addVisibleObject(mesh)
    }

    function previewAnimation (result) {
      const mesh = addVisibleObject(demoMesh.clone())
      const clip = result.tracks ? result : new THREE.AnimationClip('generated-track', 2, [result])
      const mixer = new THREE.AnimationMixer(mesh)
      mixer.clipAction(clip).play()
      mixers.push(mixer)
      stats.textContent = 'animation clip'
    }

    function addPassBeforeOutput (pass) {
      if (!composer || !outputPass)
        return false
      const outputIndex = composer.passes.indexOf(outputPass)
      composer.passes.splice(Math.max(0, outputIndex), 0, pass)
      stats.textContent = 'post pass'
      return true
    }

    function presentResult (result, kind = 'value') {
      if (kind === 'pass') {
        if (result?.isPass && addPassBeforeOutput(result))
          return
        if (result?.render && (result?.setSize || result?.composer || result?.finalComposer)) {
          customRender = result
          stats.textContent = 'custom post renderer'
          return
        }
        if (result?.composer) {
          customRender = { render: (delta) => result.render?.(delta) ?? result.composer.render(delta), setSize: result.setSize?.bind(result) }
          stats.textContent = 'composer handle'
          return
        }
      }
      if (!result) {
        showValue(result)
        return
      }
      if (kind === 'camera' || result.isCamera) {
        scene.add(new THREE.CameraHelper(result))
        stats.textContent = 'camera helper'
        return
      }
      if (result.isObject3D) {
        addVisibleObject(result)
        return
      }
      for (const key of ['object', 'mesh', 'points', 'root']) {
        if (result[key]?.isObject3D) {
          addVisibleObject(result[key])
          if (typeof result.tick === 'function')
            tickers.add(ctx => result.tick(ctx))
          if (typeof result.update === 'function')
            tickers.add(ctx => result.update(ctx))
          return
        }
      }
      if (kind === 'material' || result.isMaterial || /Material$/.test(result.constructor?.name ?? '')) {
        previewMaterial(result)
        return
      }
      if (result.isBufferGeometry || result.attributes?.position) {
        previewGeometry(result)
        return
      }
      if (result instanceof THREE.Shape || Array.isArray(result.curves)) {
        previewShape(result)
        return
      }
      if (result.isTexture) {
        previewTexture(result)
        return
      }
      if (result.tracks || /KeyframeTrack$/.test(result.constructor?.name ?? '')) {
        previewAnimation(result)
        return
      }
      if (typeof result === 'function') {
        tickers.add(result)
        showValue('[registered frame callback]')
        return
      }
      showValue(result)
    }

    function startDemoLoop ({ composerEnabled }) {
      const detachResize = attachResizeObserver()
      const detachGesture = attachPointerGesture(canvas)
      if (composerEnabled) {
        composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))
        outputPass = new OutputPass()
        composer.addPass(outputPass)
      }
      renderer.compile(scene, camera)
      let acc = 0
      let frames = 0
      loop.onFrame((ctx) => {
        for (const ticker of tickers)
          ticker(ctx)
        for (const mixer of mixers)
          mixer.update(ctx.delta)
        if (featuredObject)
          featuredObject.rotation.y += ctx.delta * 0.35
        if (customRender)
          customRender.render(ctx.delta)
        else if (composer)
          composer.render(ctx.delta)
        else
          renderer.render(scene, camera)
        acc += ctx.delta
        frames += 1
        if (acc >= 0.5) {
          stats.textContent = Math.round(frames / acc) + ' fps - ' + renderer.info.render.calls + ' calls'
          acc = 0
          frames = 0
        }
      })
      window.__disposeScene = () => {
        detachGesture()
        detachResize()
        loop.dispose()
        customRender?.dispose?.()
        composer?.dispose?.()
        disposeScene(scene)
        renderer.dispose()
      }
      window.__SCENE_READY__ = true
    }
`
}

function standardHarness (seed: PlaySeed, module: LibraryModule, baseUrl: string, mode = 'standard'): string {
  const renderWithComposer = mode === 'post'
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <style>
    html, body { margin: 0; height: 100%; background: #10131a; overflow: hidden; font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: #f3efe7 }
    main { position: fixed; inset: 0 }
    canvas { display: block; width: 100%; height: 100%; touch-action: none }
    aside { position: fixed; left: 10px; top: 10px; right: 10px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; font-size: 11px; line-height: 1.4 }
    aside span, pre { padding: 6px 8px; border: 1px solid #463e37; border-radius: 6px; background: rgba(16, 19, 26, 0.78) }
    pre { position: fixed; left: 10px; right: 10px; bottom: 10px; max-height: 34%; margin: 0; overflow: auto; white-space: pre-wrap; color: #ffd166 }
    b { color: #6fe7d2 }
  </style>
  <script type="importmap">${importMap(seed, module, baseUrl)}<\/script>
</head>
<body>
  <main><canvas id="scene"></canvas><aside><span>${escapeHtml(module.specifier)} · <b>${escapeHtml(seed.exportName)}</b></span><span id="stats">starting</span></aside><pre id="report" hidden></pre></main>
  <script type="module">
    import * as THREE from 'three'
    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
    ${renderWithComposer ? "import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'\n    import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'\n    import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'" : ''}
    import * as api from '${module.specifier}'
    const { ${seed.exportName} } = api
    const PLAY_MODE = '${mode}'
    ${sharedHarnessHelpers()}
    startDemoLoop({ composerEnabled: ${renderWithComposer} })
    try {
${escapeScript(seed.code).split('\n').map(line => `      ${line}`).join('\n')}
    } catch (error) {
      showError(error)
    }
  <\/script>
</body>
</html>`
}

function jsxHarness (seed: PlaySeed, module: LibraryModule, baseUrl: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <style>
    html, body { margin: 0; height: 100%; background: #10131a; overflow: hidden; font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: #f3efe7 }
    canvas { display: block; width: 100%; height: 100%; touch-action: none }
    aside { position: fixed; left: 10px; top: 10px; right: 10px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; font-size: 11px; line-height: 1.4 }
    aside span, pre { padding: 6px 8px; border: 1px solid #463e37; border-radius: 6px; background: rgba(16, 19, 26, 0.78) }
    pre { position: fixed; left: 10px; right: 10px; bottom: 10px; max-height: 34%; margin: 0; overflow: auto; white-space: pre-wrap; color: #ffd166 }
    b { color: #6fe7d2 }
  </style>
  <script type="importmap">${importMap(seed, module, baseUrl)}<\/script>
</head>
<body>
  <canvas id="scene"></canvas><aside><span>${escapeHtml(module.specifier)} · <b>${escapeHtml(seed.exportName)}</b></span><span id="stats">jsx runtime</span></aside><pre id="report" hidden></pre>
  <script type="module">
    import * as THREE from 'three'
    import * as api from '${module.specifier}'
    const { ${seed.exportName} } = api
    const canvas = document.querySelector('#scene')
    const report = document.querySelector('#report')
    const stats = document.querySelector('#stats')
    canvas.style.touchAction = 'none'
    const pointerEvents = new Set()
    const addEventListenerNative = canvas.addEventListener.bind(canvas)
    canvas.addEventListener = (type, listener, options) => {
      if (String(type).startsWith('pointer') || type === 'wheel')
        pointerEvents.add(String(type))
      return addEventListenerNative(type, listener, options)
    }
    const NativeResizeObserver = window.ResizeObserver
    let resizeObserverAttached = false
    if (NativeResizeObserver) {
      window.ResizeObserver = class extends NativeResizeObserver {
        observe (target, options) {
          resizeObserverAttached = true
          return super.observe(target, options)
        }
      }
    }
    const restoreBrowserPrimitives = () => {
      if (NativeResizeObserver)
        window.ResizeObserver = NativeResizeObserver
    }
    function recordHandle (handle) {
      const rendererPixelRatio = handle?.renderer?.getPixelRatio?.() ?? window.devicePixelRatio
      window.__SCENE_PROOF__ = {
        hasDispose: typeof handle?.dispose === 'function',
        hasPointerEvents: pointerEvents.has('pointerdown') && pointerEvents.has('pointermove'),
        hasResizeObserver: resizeObserverAttached,
        pixelRatioCapped: rendererPixelRatio <= Math.min(window.devicePixelRatio, 2),
        touchAction: getComputedStyle(canvas).touchAction,
      }
    }
    const demoElement = api.h ? api.h('scene', { background: '#10131a' },
      api.h('camera', { type: 'perspective', position: [0, 2.5, 7], makeDefault: true }),
      api.h('light', { type: 'hemisphere', intensity: 0.7 }),
      api.h('light', { type: 'spot', position: [5, 8, 3], intensity: 55, penumbra: 0.45, castShadow: true }),
      api.h('mesh', {
        geometry: new THREE.TorusKnotGeometry(0.8, 0.22, 80, 12),
        material: new THREE.MeshStandardMaterial({ color: '#6fe7d2', roughness: 0.35, metalness: 0.2 }),
        rotation: () => [0, performance.now() * 0.0004, 0],
      }),
    ) : null
    function reportValue (label, value) {
      report.hidden = false
      report.textContent = label + ': ' + formatValue(value)
    }
    function formatValue (value) {
      if (value === undefined) return 'undefined'
      if (value === null) return 'null'
      if (typeof value === 'function') return value.toString().slice(0, 120)
      try { return JSON.stringify(value, null, 2) ?? String(value) }
      catch { return String(value) }
    }
    function presentResult (result) {
      if (result?.type && result?.props && typeof api.render === 'function') {
        const handle = api.render(result, { canvas, background: '#10131a' })
        stats.textContent = 'rendered scene element'
        recordHandle(handle)
        window.__disposeScene = () => { handle.dispose?.(); restoreBrowserPrimitives() }
        window.__SCENE_READY__ = true
        return
      }
      reportValue('result', result)
      if (typeof api.render === 'function' && demoElement) {
        const handle = api.render(demoElement, { canvas, background: '#10131a' })
        recordHandle(handle)
        window.__disposeScene = () => { handle.dispose?.(); restoreBrowserPrimitives() }
      }
      window.__SCENE_READY__ = true
    }
    function showError (error) {
      report.hidden = false
      report.textContent = error?.stack || error?.message || String(error)
      stats.textContent = 'error'
      window.__SCENE_READY__ = true
    }
    try {
${escapeScript(seed.code).split('\n').map(line => `      ${line}`).join('\n')}
    } catch (error) {
      showError(error)
    }
  <\/script>
</body>
</html>`
}

function buildHarness (seed: PlaySeed, module: LibraryModule, baseUrl: string): string {
  if (seed.requiresWebGpu && typeof navigator !== 'undefined' && !('gpu' in navigator))
    return webgpuFallback(seed)
  if (seed.flavor === 'jsx')
    return jsxHarness(seed, module, baseUrl)
  if (seed.flavor === 'post')
    return standardHarness(seed, module, baseUrl, 'post')
  return standardHarness(seed, module, baseUrl, 'standard')
}

export function attachPlayground (root: ParentNode, options: PlaygroundOptions): void {
  const moduleById = new Map(options.modules.map(module => [ module.id, module ]))

  root.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element))
      return
    const button = target.closest<HTMLButtonElement>('[data-play-export]')
    if (!button)
      return
    const card = button.closest<HTMLElement>('[data-export-card]')
    if (!card)
      return

    const seedText = card.querySelector<HTMLScriptElement>('script[type="application/json"][data-play-seed]')?.textContent
    if (!seedText)
      return

    const existing = card.querySelector<HTMLElement>('[data-playground]')
    if (existing) {
      existing.hidden = !existing.hidden
      button.setAttribute('aria-expanded', String(!existing.hidden))
      return
    }

    const seed = JSON.parse(seedText) as PlaySeed
    const module = moduleById.get(seed.moduleId)
    if (!module)
      return

    const panel = document.createElement('section')
    panel.dataset.playground = ''
    panel.setAttribute('aria-label', `${seed.exportName} playground`)

    const editor = document.createElement('textarea')
    editor.spellcheck = false
    editor.value = seed.code
    editor.setAttribute('aria-label', `editable demo code for ${seed.exportName}`)

    const actions = document.createElement('p')
    const run = document.createElement('button')
    run.type = 'button'
    run.textContent = 'run'
    run.dataset.runPlayground = ''
    const status = document.createElement('span')
    status.textContent = seed.requiresWebGpu ? 'webgpu gated' : `${seed.flavor} harness`
    actions.append(run, status)

    const preview = document.createElement('figure')
    const iframe = document.createElement('iframe')
    iframe.title = `${seed.exportName} generated demo`
    iframe.sandbox.add('allow-scripts', 'allow-same-origin')
    preview.append(iframe)

    const execute = () => {
      const nextSeed = { ...seed, code: editor.value }
      status.textContent = 'running'
      iframe.srcdoc = buildHarness(nextSeed, module, options.baseUrl)
      iframe.addEventListener('load', () => { status.textContent = 'running in iframe' }, { once: true })
    }
    run.addEventListener('click', execute)

    panel.append(editor, actions, preview)
    card.append(panel)
    button.setAttribute('aria-expanded', 'true')
    execute()
  })
}
