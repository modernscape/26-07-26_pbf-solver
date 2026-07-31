// js/main.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js"
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js"
import { ParticleSystem } from "./particleSystem.js"
import { SpatialHash } from "./spatialHash.js"
import { PbfSolver } from "./pbfSolver.js"
import { vertexColor } from "three/tsl"
import { ColladaLoader } from "three/examples/jsm/Addons.js"

// 1. パラメータ設定
// const NUM_PARTICLES = 4096 // 16x16x16 = 4096個
const NUM_PARTICLES = 2048 // 16x16x16 = 4096個
// const NUM_PARTICLES = 1024 // 16x16x16 = 4096個
const SMOOTHING_RADIUS = 0.2
const CELL_SIZE = SMOOTHING_RADIUS

// 2. シミュレーションコンポーネントの初期化
const particleSystem = new ParticleSystem(NUM_PARTICLES, SMOOTHING_RADIUS)
const spatialHash = new SpatialHash(CELL_SIZE)
const pbfSolver = new PbfSolver(particleSystem, spatialHash)

// 3. Three.js セットアップ
const scene = new THREE.Scene()

// カメラ
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
)
camera.position.set(0, 3, 10)

// レンダラー
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(window.devicePixelRatio)
document.body.appendChild(renderer.domElement)

// カメラ操作用コントロール
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

// 例: controls を初期化したあとのコードに組み込む

const STORAGE_KEY = "fluid_sim_camera_state_v1"

// 1. 保存されている視点があれば、初期位置として復元する
const savedState = localStorage.getItem(STORAGE_KEY)
if (savedState) {
  try {
    const state = JSON.parse(savedState)

    // カメラの位置を復元
    camera.position.set(state.cameraPos.x, state.cameraPos.y, state.cameraPos.z)

    // コントローラーの注視点（ターゲット）を復元
    controls.target.set(state.target.x, state.target.y, state.target.z)

    // 変更をコントロールに反映
    controls.update()
  } catch (e) {
    console.error("保存されたカメラ状態の復元に失敗しました:", e)
  }
}

// 2. 画面ドラッグなどの操作が「終わったタイミング」で状態を保存する
controls.addEventListener("end", () => {
  const state = {
    cameraPos: {
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
    },
    target: {
      x: controls.target.x,
      y: controls.target.y,
      z: controls.target.z,
    },
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
})

// 4. パーティクルの描画セットアップ
// Float32Array をそのまま BufferAttribute として Three.js に渡す
const geometry = new THREE.BufferGeometry()
geometry.setAttribute(
  "position",
  new THREE.BufferAttribute(particleSystem.positions, 3),
)

const colors = new Float32Array(NUM_PARTICLES * 3)
for (let i = 0; i < NUM_PARTICLES; i++) {
  colors[i * 3 + 0] = 0.0
  colors[i * 3 + 1] = 0.67
  colors[i * 3 + 2] = 1.0
}
geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3))

// マテリアル (水のような青色)
const material = new THREE.PointsMaterial({
  // color: 0x00abff,
  size: 0.02,
  transparent: true,
  opacity: 0.8,
  vertexColors: true,
})

const points = new THREE.Points(geometry, material)
scene.add(points)

// 5. 境界ボックス（水槽）の視覚化
const boundSize = pbfSolver.boundSize
const boxGeo = new THREE.BoxGeometry(
  boundSize * 2,
  boundSize * 2,
  boundSize * 2,
)
const boxMat = new THREE.LineBasicMaterial({ color: 0x444444 })
const boxEdges = new THREE.EdgesGeometry(boxGeo)
const boxLine = new THREE.LineSegments(boxEdges, boxMat)
scene.add(boxLine)

// 6. ウィンドウリサイズ対応
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// 7. アニメーションループ
function animate() {
  requestAnimationFrame(animate)

  // 物理シミュレーションを1ステップ進める
  pbfSolver.step()

  const colorAttr = geometry.attributes.color
  for (let i = 0; i < NUM_PARTICLES; i++) {
    const ink = particleSystem.inkAmounts[i]

    colors[i * 3 + 0] = ink * 1.0 + (1.0 - ink) * 0.0
    colors[i * 3 + 1] = ink * 0.0 + (1.0 - ink) * 0.67
    colors[i * 3 + 2] = ink * 0.0 + (1.0 - ink) * 1.0
  }
  colorAttr.needsUpdate = true

  // 頂点座標が更新されたことを Three.js に通知して再描画させる
  geometry.attributes.position.needsUpdate = true

  controls.update()
  renderer.render(scene, camera)
}

// 実行開始
animate()
