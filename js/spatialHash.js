// js/spatialHash.js
export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize
    this.invCellSize = 1.0 / cellSize
    // キー（文字列）を配列のインデックス（粒子の番号）のリストにマッピングする Map
    this.grid = new Map()
  }

  // 3次元座標からグリッドのキー文字列を生成
  _getKey(x, y, z) {
    const gx = Math.floor(x * this.invCellSize)
    const gy = Math.floor(y * this.invCellSize)
    const gz = Math.floor(z * this.invCellSize)
    return `${gx},${gy},${gz}`
  }

  // グリッドをクリアし、現在の粒子の位置からハッシュマップを再構築
  update(positions, numParticles) {
    this.grid.clear()

    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3
      const key = this._getKey(
        positions[i3 + 0],
        positions[i3 + 1],
        positions[i3 + 2],
      )

      if (!this.grid.has(key)) {
        this.grid.set(key, [])
      }
      this.grid.get(key).push(i)
    }
  }

  // 指定した位置の周辺（3x3x3 = 最大27セル）にいる粒子インデックスを収集してコールバックに渡す
  query(x, y, z, callback) {
    const gx = Math.floor(x * this.invCellSize)
    const gy = Math.floor(y * this.invCellSize)
    const gz = Math.floor(z * this.invCellSize)

    // 3x3x3 の近傍セルを走査
    for (let dz = -1; dz <= 1; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const key = `${gx + dx},${gy + dy},${gz + dz}`
          const neighbors = this.grid.get(key)
          if (neighbors) {
            for (let i = 0; i < neighbors.length; i++) {
              callback(neighbors[i])
            }
          }
        }
      }
    }
  }
}
