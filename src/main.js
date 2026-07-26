import "./style.css"

import * as THREE from "three"

import Renderer from "./renderer/Renderer"
import ParticleSystem from "./simulation/ParticleSystem"

import { MAX_PARTICLES } from "./constants"

const renderer = new Renderer()

//--------------------------------------------------
// Particle System
//--------------------------------------------------

const particles = new ParticleSystem()

for (let i = 0; i < MAX_PARTICLES; i++) {
  particles.createParticle(
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5,
    (Math.random() - 0.5) * 1.5,
    0.4,
    0.8,
    1.0,
  )
}

//--------------------------------------------------
// Geometry
//--------------------------------------------------

const geometry = new THREE.BufferGeometry()

const positionArray = new Float32Array(MAX_PARTICLES * 3)
const colorArray = new Float32Array(MAX_PARTICLES * 3)

const positionAttribute = new THREE.BufferAttribute(positionArray, 3)
const colorAttribute = new THREE.BufferAttribute(colorArray, 3)

geometry.setAttribute("position", positionAttribute)
geometry.setAttribute("color", colorAttribute)

//--------------------------------------------------
// Material
//--------------------------------------------------

const material = new THREE.PointsMaterial({
  size: 0.02,
  vertexColors: true,
})

//--------------------------------------------------
// Points
//--------------------------------------------------

const points = new THREE.Points(geometry, material)

renderer.setPoints(points)

//--------------------------------------------------
// Update Geometry
//--------------------------------------------------

function updateGeometry() {
  for (let i = 0; i < particles.count; i++) {
    positionAttribute.setXYZ(
      i,
      particles.posX[i],
      particles.posY[i],
      particles.posZ[i],
    )

    colorAttribute.setXYZ(
      i,
      particles.colorR[i],
      particles.colorG[i],
      particles.colorB[i],
    )
  }

  positionAttribute.needsUpdate = true
  colorAttribute.needsUpdate = true

  geometry.setDrawRange(0, particles.count)
}

//--------------------------------------------------
// Animation
//--------------------------------------------------

function animate() {
  requestAnimationFrame(animate)

  updateGeometry()

  renderer.render()
}

animate()
