import Stats from 'stats.js'
import './style.css'
import * as THREE from 'three'
import { createProgressBar } from './progressBar'

import type { ProgressBarAPI } from './progressBar'
import { RoomEnvironment } from 'three/examples/jsm/Addons.js'

let gScene = new THREE.Scene()
let gRenderer: THREE.WebGLRenderer
let gCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight)
let gMesh: THREE.Mesh

let gStats = new Stats()
let gProgressBar: ProgressBarAPI | null = null
let gMaxRenderedPixels: number = Infinity
let gAutorotate: boolean = true

let initialDPR = 1
/**
 * `updateDPR = false` emulates what many ThreeJS official examples do.  \
 * `updateDPR = true` makes the app take into account DPR changes.
 *
 * Note: DPR changes if the user zooms the page or if it changes the OS UI scale.
 */
let updateDPR = true

if (document.readyState === 'complete') {
    init()
} else {
    document.onreadystatechange = () => {
        if (document.readyState === 'complete') {
            init()
        }
    }
}

function init() {
    gRenderer = new THREE.WebGLRenderer({
        antialias: false,
        canvas: document.querySelector('#canvas')!,
    })
    gRenderer.setPixelRatio(1) // redundant but explicitly force pixel ratio to 1 as the resizeRenderer() handles it internally
    initialDPR = window.devicePixelRatio
    document.body.appendChild(gRenderer.domElement)

    gCamera.position.z = 3

    const pmremGenerator = new THREE.PMREMGenerator(gRenderer)
    gScene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
    gScene.environmentIntensity = 0.1

    const loader = new THREE.TextureLoader()
    const texUvmap = loader.load('/uvmap.jpg')
    texUvmap.flipY = true
    texUvmap.needsUpdate = true
    const texGrid = loader.load('/texture_02.png')
    texGrid.wrapS = THREE.RepeatWrapping
    texGrid.wrapT = THREE.RepeatWrapping
    texGrid.needsUpdate = true
    texGrid.repeat.set(6, 2)

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(45, 15),
        new THREE.MeshStandardMaterial({
            map: texGrid,
        })
    )
    plane.position.z = -2
    gScene.add(plane)

    gMesh = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1.5, 1.5),
        new THREE.MeshStandardMaterial({
            map: texUvmap,
            roughness: 1,
            metalness: 0.2,
        })
    )
    gScene.add(gMesh)

    const spotLight = new THREE.SpotLight(0xffffff, 5, 30, Math.PI * 0.2, 0.8, 0.3)
    spotLight.target = gMesh
    spotLight.position.set(0.1, 0.1, 8)
    gScene.add(spotLight)

    const radioGroup = document.getElementById('megapixel-limit-group')
    if (radioGroup) {
        radioGroup.addEventListener('change', (event) => {
            const target = event.target as HTMLInputElement
            if (target && target.name === 'megapixel-limit') {
                const value = target.value
                gMaxRenderedPixels = value === 'Infinity' ? Infinity : parseFloat(value) * 1e6
                resizeRenderer(gRenderer, gCamera, gMaxRenderedPixels)
                updateWidgets(gRenderer)
            }
        })
        // Set initial value from checked radio
        const checked = radioGroup.querySelector(
            'input[name="megapixel-limit"]:checked'
        ) as HTMLInputElement
        if (checked) {
            const value = checked.value
            gMaxRenderedPixels = value === 'Infinity' ? Infinity : parseFloat(value) * 1e6
        }
    }

    const updateDPRCheckbox = document.getElementById('update-dpr') as HTMLInputElement
    if (updateDPRCheckbox) {
        updateDPR = updateDPRCheckbox.checked
        updateDPRCheckbox.addEventListener('change', () => {
            updateDPR = updateDPRCheckbox.checked
            resizeRenderer(gRenderer, gCamera, gMaxRenderedPixels)
            updateWidgets(gRenderer)
        })
    }

    // setup progress bar
    const widget = document.getElementById('progress-bar-container')
    if (widget) {
        gProgressBar = createProgressBar({
            container: widget,
        })
    }

    const autorotateCheckbox = document.getElementById(
        'autorotate-checkbox'
    ) as HTMLInputElement | null
    if (autorotateCheckbox) {
        gAutorotate = autorotateCheckbox.checked
        autorotateCheckbox.addEventListener('change', () => {
            gAutorotate = autorotateCheckbox.checked
        })
    }

    // setup callbacks
    window.addEventListener('resize', onWindowResize)

    /**
     * The following code helps testing with browser debug tools.
     * EG: on Firefox you can open Responsive Design Mode and change the DPR
     * and see the app react to DPR change immediately.
     * You will notice changes in the total rendered pixel count if `updateDPR = true`
     */
    let remove: Function
    const handleDevicePixelRatioChanges = () => {
        resizeRenderer(gRenderer, gCamera, gMaxRenderedPixels)
        updateWidgets(gRenderer)
        if (remove) {
            console.log('[DPR]: dpr changed to ' + window.devicePixelRatio)
            remove?.()
        }
        const media = matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`)
        media.addEventListener('change', handleDevicePixelRatioChanges)
        remove = () => {
            media.removeEventListener('change', handleDevicePixelRatioChanges)
        }
    }
    handleDevicePixelRatioChanges()

    // setup stats
    gStats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(gStats.dom)

    resizeRenderer(gRenderer, gCamera, gMaxRenderedPixels)
    updateWidgets(gRenderer)

    gRenderer.setAnimationLoop(animate)
}

function animate() {
    gStats.begin()

    if (gMesh && gAutorotate) {
        gMesh.rotation.x += 0.001 * 4
        gMesh.rotation.y += 0.001 * 4
    }
    gRenderer.render(gScene, gCamera)

    gStats.end()
}

function onWindowResize() {
    console.log('[window]: window size changed to ' + window.innerWidth + ' ' + window.innerHeight)
    resizeRenderer(gRenderer, gCamera, gMaxRenderedPixels)
    updateWidgets(gRenderer)
}

/**
 * See https://threejs.org/manual/?q=res#en/responsive
 */
function resizeRenderer(
    renderer: THREE.WebGLRenderer,
    camera: THREE.PerspectiveCamera,
    maxPixelCount: number = Infinity
) {
    const canvas = renderer.domElement
    const dpr = updateDPR ? window.devicePixelRatio : initialDPR
    const w = Math.floor(canvas.clientWidth * dpr)
    const h = Math.floor(canvas.clientHeight * dpr)

    camera.aspect = w / h
    camera.updateProjectionMatrix()

    const pixelCount = w * h
    const renderScale = pixelCount > maxPixelCount ? Math.sqrt(maxPixelCount / pixelCount) : 1

    if (renderer.getPixelRatio() !== 1) {
        console.warn(
            `renderer.getPixelRatio()=${renderer.getPixelRatio()} but it should be set to 1 when using this resizeRenderer().`
        )
    }
    canvas.width !== w || canvas.height !== h
    renderer.setSize(w * renderScale, h * renderScale, false)
}

function updateWidgets(renderer: THREE.WebGLRenderer, dpr = window.devicePixelRatio) {
    const infoRenderer = document.getElementById('renderer-size')
    const infoRendererMP = document.getElementById('renderer-size-mp')
    const infoWindow = document.getElementById('window-size')
    const infoWindowMP = document.getElementById('window-size-mp')
    const infoDPR = document.getElementById('window-dpr')
    const infoInitialDPR = document.getElementById('window-initial-dpr')

    const rendererMegaPixels = renderer.domElement.width * renderer.domElement.height * 1e-6
    const w = window.innerWidth
    const h = window.innerHeight

    if (infoWindow && infoRenderer && infoDPR && infoRendererMP && infoWindowMP && infoInitialDPR) {
        infoRenderer.innerText = `${renderer.domElement.width} x ${renderer.domElement.height}`
        infoRendererMP.innerText = ` = ${rendererMegaPixels.toFixed(2)} MegaPixels`
        infoWindow.innerText = `${w} x ${h}`
        infoWindowMP.innerText = ` = ${(w * h * 1e-6).toFixed(2)} MegaPixels`
        infoDPR.innerText = `${dpr.toFixed(2)}`
        infoInitialDPR.innerText = `${initialDPR.toFixed(2)}`
    }

    if (gProgressBar) {
        gProgressBar.update(rendererMegaPixels)
    }
}
