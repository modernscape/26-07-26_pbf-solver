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

    this.inkAmounts = new Float32Array(numParticles * 3)

    this.initParticles()
  }

  initParticles() {
    let index = 0

    // 例: XとZは狭く、Y方向に長い直方体状に配置する
    // 2048個を綺麗に配置するための固定グリッド
    // 16 × 16 × 8 = 2048個
    const sideX = 16
    const sideZ = 16
    const sideY = 8 // ちゃんと8段の高さを持たせる

    const spacing = 0.08 // 粒子同士の間隔を固定で狭すぎず広すぎず調整

    for (let x = 0; x < sideX; x++) {
      for (let y = 0; y < sideY; y++) {
        for (let z = 0; z < sideZ; z++) {
          if (index >= this.numParticles) break

          const i3 = index * 3

          // 中心を原点にして配置し、Y方向は上空（プラス側）に持ち上げる
          this.positions[i3 + 0] = (x - sideX / 2) * spacing
          this.positions[i3 + 1] = y * spacing + 1.5 // ★上空からスタート
          this.positions[i3 + 2] = (z - sideZ / 2) * spacing

          this.velocities[i3 + 0] = 0
          this.velocities[i3 + 1] = 0
          this.velocities[i3 + 2] = 0

          index++
        }
      }
    }

    for (let i = 0; i < this.numParticles; i++) {
      this.inkAmounts[i] = 0.0
    }
  }
}
