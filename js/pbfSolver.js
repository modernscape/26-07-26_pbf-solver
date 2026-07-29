// js/pbfSolver.js
export class PbfSolver {
  constructor(particleSystem, spatialHash) {
    this.ps = particleSystem
    this.hash = spatialHash

    // PBF のパラメータ
    this.density0 = 6378.0 //6378.0 // 目標密度 (Rest density)
    this.solverIterations = 2 // 軽快に動かすため、反復回数を2回に最適化
    this.dt = 0.03 // タイムステップ（少し広げて速度感をアップ）
    this.gravity = -9.81 // 重力加速度 (Y軸下向き)
    this.eps = 600.0 // 密度制約の安定化パラメータ

    // 粘性パラメータ (XSPH Viscosity の係数)
    this.c = 0.01

    // 境界ボックスのサイズ
    this.boundSize = 1.5
    this.particleRadius = 0.1

    // カーネル用定数の事前計算
    this.h = this.ps.h
    this.h2 = this.h * this.h
    this.h3 = this.h * this.h2
    this.h6 = this.h3 * this.h3
    this.h9 = this.h6 * this.h3

    this.poly6Const = 315.0 / (64.0 * Math.PI * this.h9)
    this.spikyConst = -45.0 / (Math.PI * this.h6)
  }

  _poly6(rSq) {
    if (rSq >= this.h2) return 0.0
    const diff = this.h2 - rSq
    return this.poly6Const * diff * diff * diff
  }

  _spikyGradient(distVecX, distVecY, distVecZ, r) {
    if (r >= this.h || r === 0.0) return { x: 0, y: 0, z: 0 }
    const diff = this.h - r
    const factor = (this.spikyConst * (diff * diff)) / r
    return {
      x: factor * distVecX,
      y: factor * distVecY,
      z: factor * distVecZ,
    }
  }

  step() {
    const n = this.ps.numParticles
    const pos = this.ps.positions
    const pred = this.ps.predictedPositions
    const vel = this.ps.velocities
    const dens = this.ps.densities
    const lambdas = this.ps.lambdas
    const deltaPos = this.ps.deltaPositions

    // 1. 外力の適用 & 予測位置の計算
    for (let i = 0; i < n; i++) {
      const i3 = i * 3
      vel[i3 + 1] += this.gravity * this.dt

      pred[i3 + 0] = pos[i3 + 0] + vel[i3 + 0] * this.dt
      pred[i3 + 1] = pos[i3 + 1] + vel[i3 + 1] * this.dt
      pred[i3 + 2] = pos[i3 + 2] + vel[i3 + 2] * this.dt
    }

    this.hash.update(pred, n)

    // 2. 制約ソルバーのループ（流体粒子のみの純粋な非圧縮性計算）
    for (let iter = 0; iter < this.solverIterations; iter++) {
      for (let i = 0; i < n; i++) {
        const i3 = i * 3
        const px = pred[i3 + 0]
        const py = pred[i3 + 1]
        const pz = pred[i3 + 2]

        let density = 0.0
        density += this.ps.mass * this.poly6Const * this.h6

        this.hash.query(px, py, pz, (j) => {
          if (i === j) return
          const j3 = j * 3
          const dx = px - pred[j3 + 0]
          const dy = py - pred[j3 + 1]
          const dz = pz - pred[j3 + 2]
          const rSq = dx * dx + dy * dy + dz * dz

          if (rSq < this.h2) {
            density += this.ps.mass * this._poly6(rSq)
          }
        })

        dens[i] = density

        const constraint = Math.max(dens[i] / this.density0 - 1.0, 0.0)
        if (constraint === 0.0) {
          lambdas[i] = 0.0
          continue
        }

        let gradSumSq = 0.0
        let gradCi_x = 0,
          gradCi_y = 0,
          gradCi_z = 0

        this.hash.query(px, py, pz, (j) => {
          if (i === j) return
          const j3 = j * 3
          const dx = px - pred[j3 + 0]
          const dy = py - pred[j3 + 1]
          const dz = pz - pred[j3 + 2]
          const r = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (r < this.h) {
            const gradJ = this._spikyGradient(dx, dy, dz, r)
            const gx = gradJ.x / this.density0
            const gy = gradJ.y / this.density0
            const gz = gradJ.z / this.density0

            gradSumSq += gx * gx + gy * gy + gz * gz
            gradCi_x += gx
            gradCi_y += gy
            gradCi_z += gz
          }
        })

        gradSumSq +=
          gradCi_x * gradCi_x + gradCi_y * gradCi_y + gradCi_z * gradCi_z
        lambdas[i] = -constraint / (gradSumSq + this.eps)
      }

      for (let i = 0; i < n; i++) {
        const i3 = i * 3
        const px = pred[i3 + 0]
        const py = pred[i3 + 1]
        const pz = pred[i3 + 2]
        const lambdaI = lambdas[i]

        let dpx = 0.0,
          dpy = 0.0,
          dpz = 0.0

        this.hash.query(px, py, pz, (j) => {
          if (i === j) return
          const j3 = j * 3
          const dx = px - pred[j3 + 0]
          const dy = py - pred[j3 + 1]
          const dz = pz - pred[j3 + 2]
          const r = Math.sqrt(dx * dx + dy * dy + dz * dz)

          if (r < this.h) {
            const gradJ = this._spikyGradient(dx, dy, dz, r)
            const lambdaJ = lambdas[j]
            const factor = (lambdaI + lambdaJ) / this.density0
            dpx += factor * gradJ.x
            dpy += factor * gradJ.y
            dpz += factor * gradJ.z
          }
        })

        deltaPos[i3 + 0] = dpx
        deltaPos[i3 + 1] = dpy
        deltaPos[i3 + 2] = dpz
      }

      for (let i = 0; i < n; i++) {
        const i3 = i * 3
        pred[i3 + 0] += deltaPos[i3 + 0]
        pred[i3 + 1] += deltaPos[i3 + 1]
        pred[i3 + 2] += deltaPos[i3 + 2]
      }
    }

    // 3. XSPH 粘性 (Viscosity) の適用
    for (let i = 0; i < n; i++) {
      const i3 = i * 3
      const px = pred[i3 + 0]
      const py = pred[i3 + 1]
      const pz = pred[i3 + 2]

      let vxCorr = 0.0
      let vyCorr = 0.0
      let vzCorr = 0.0

      this.hash.query(px, py, pz, (j) => {
        if (i === j) return
        const j3 = j * 3
        const dx = pred[j3 + 0] - px
        const dy = pred[j3 + 1] - py
        const dz = pred[j3 + 2] - pz
        const r = Math.sqrt(dx * dx + dy * dy + dz * dz)

        if (r < this.h) {
          const rSq = r * r
          const w = this._poly6(rSq)
          vxCorr += (vel[j3 + 0] - vel[i3 + 0]) * w
          vyCorr += (vel[j3 + 1] - vel[i3 + 1]) * w
          vzCorr += (vel[j3 + 2] - vel[i3 + 2]) * w
        }
      })

      vel[i3 + 0] += this.c * vxCorr
      vel[i3 + 1] += this.c * vyCorr
      vel[i3 + 2] += this.c * vzCorr
    }

    // 4. 速度と位置の確定、および壁の境界条件（遅延のないスムーズな滑り処理）
    for (let i = 0; i < n; i++) {
      const i3 = i * 3

      // 予測位置から実際の速度を逆算
      vel[i3 + 0] = (pred[i3 + 0] - pos[i3 + 0]) / this.dt
      vel[i3 + 1] = (pred[i3 + 1] - pos[i3 + 1]) / this.dt
      vel[i3 + 2] = (pred[i3 + 2] - pos[i3 + 2]) / this.dt

      const b = this.boundSize - this.particleRadius
      const restitution = 0.1

      // 左右・前後の壁
      if (pred[i3 + 0] < -b) {
        pred[i3 + 0] = -b
        vel[i3 + 0] *= -restitution
      }
      if (pred[i3 + 0] > b) {
        pred[i3 + 0] = b
        vel[i3 + 0] *= -restitution
      }

      // ★床面 (Y = -b) でのダイレクトなスライド・広がり処理
      if (pred[i3 + 1] < -b) {
        pred[i3 + 1] = -b

        let vy = vel[i3 + 1]
        if (vy < 0) {
          const downSpeed = Math.abs(vy)
          vy = 0 // 下向きの速度をストップ

          // 落下エネルギーを横方向の推進力に変換してスムーズに広げる
          const slideBoost = 0.1
          vel[i3 + 0] += vel[i3 + 0] * slideBoost
          vel[i3 + 2] += vel[i3 + 2] * slideBoost

          // 完全に真下に落ちて横方向の勢いがゼロの場合のセーフティ
          if (Math.abs(vel[i3 + 0]) < 0.001 && Math.abs(vel[i3 + 2]) < 0.001) {
            const px = pred[i3 + 0]
            const pz = pred[i3 + 2]
            const dist = Math.sqrt(px * px + pz * pz) + 0.0001
            vel[i3 + 0] += (px / dist) * downSpeed * 0.1
            vel[i3 + 2] += (pz / dist) * downSpeed * 0.1
          }
        }
        vel[i3 + 1] = vy

        // 床面での摩擦（広がり具合の調整）
        vel[i3 + 0] *= 0.9
        vel[i3 + 2] *= 0.9
      }
      if (pred[i3 + 1] > b) {
        pred[i3 + 1] = b
        vel[i3 + 1] *= -restitution
      }

      // 奥・手前の壁
      if (pred[i3 + 2] < -b) {
        pred[i3 + 2] = -b
        vel[i3 + 2] *= -restitution
      }
      if (pred[i3 + 2] > b) {
        pred[i3 + 2] = b
        vel[i3 + 2] *= -restitution
      }

      // 位置を確定
      pos[i3 + 0] = pred[i3 + 0]
      pos[i3 + 1] = pred[i3 + 1]
      pos[i3 + 2] = pred[i3 + 2]
    }
  }
}
