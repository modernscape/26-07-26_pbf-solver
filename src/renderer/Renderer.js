import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export default class Renderer {
  constructor(container = document.body) {
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x111111)

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    )

    this.camera.position.set(0, 0, 3)

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    })

    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(window.innerWidth, window.innerHeight)

    container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.controls.enableDamping = true

    window.addEventListener("resize", () => this.onResize())

    this.points = null
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  setPoints(points) {
    if (this.points) {
      this.scene.remove(this.points)
    }

    this.points = points
    this.scene.add(points)
  }

  render() {
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }
}
