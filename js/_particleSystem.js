// js/particleSystem.js
export class ParticleSystem {
  constructor(numParticles, smoothingRadius) {
    this.numParticles = numParticles
    this.h = smoothingRadius // 粒子の影響半径 (h)
    this.mass = 1.0 // 粒子の質量

    // 物理変数の割り当て (Float32Arrayによる高速化)
    this.positions = new Float32Array(numParticles * 3) // 現在の位置 (x, y, z)
    this.predictedPositions = new Float32Array(numParticles * 3) // 予測位置 (x*, y*, z*)
    this.velocities = new Float32Array(numParticles * 3) // 速度 (vx, vy, vz)
    this.densities = new Float32Array(numParticles) // 密度 (rho)
    this.lambdas = new Float32Array(numParticles) // ラグランジュ乗数 (lambda)
    this.deltaPositions = new Float32Array(numParticles * 3) // 位置の補正量 (dx, dy, dz)

    this.initParticles()
  }

  initParticles() {
    let index = 0
    // 例: XとZは狭く、Y方向に長い直方体状に配置する
    const sideX = 12
    const sideY = 28
    const sideZ = 12
    const spacing = this.h * 0.5

    for (let x = 0; x < sideX; x++) {
      for (let y = 0; y < sideY; y++) {
        for (let z = 0; z < sideZ; z++) {
          if (index >= this.numParticles) break

          const i3 = index * 3
          const noiseRange = spacing * 0.1
          const offsetX = (Math.random() - 0.5) * noiseRange
          const offsetY = (Math.random() - 0.5) * noiseRange
          const offsetZ = (Math.random() - 0.5) * noiseRange

          // 中心を基準に配置し、Y方向を上方に引き伸ばす
          this.positions[i3 + 0] = (x - sideX / 2) * spacing + offsetX
          this.positions[i3 + 1] = y * spacing + 1.0 + offsetY // 少し低い位置から高い柱状に
          this.positions[i3 + 2] = (z - sideZ / 2) * spacing + offsetZ

          this.velocities[i3 + 0] = 0
          this.velocities[i3 + 1] = 0
          this.velocities[i3 + 2] = 0

          index++
        }
      }
    }
  }
}
