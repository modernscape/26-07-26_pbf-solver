import { MAX_PARTICLES } from "../constants"

export default class ParticleSystem {
  constructor() {
    this.count = 0

    //--------------------------------------------------------------------------
    // Position
    //--------------------------------------------------------------------------

    this.posX = new Float32Array(MAX_PARTICLES)
    this.posY = new Float32Array(MAX_PARTICLES)
    this.posZ = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Previous Position (Verlet)
    //--------------------------------------------------------------------------

    this.prevPosX = new Float32Array(MAX_PARTICLES)
    this.prevPosY = new Float32Array(MAX_PARTICLES)
    this.prevPosZ = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Velocity
    //--------------------------------------------------------------------------

    this.velX = new Float32Array(MAX_PARTICLES)
    this.velY = new Float32Array(MAX_PARTICLES)
    this.velZ = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Force
    //--------------------------------------------------------------------------

    this.forceX = new Float32Array(MAX_PARTICLES)
    this.forceY = new Float32Array(MAX_PARTICLES)
    this.forceZ = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Density
    //--------------------------------------------------------------------------

    this.density = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Lambda (PBF)
    //--------------------------------------------------------------------------

    this.lambda = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Delta Position (PBF)
    //--------------------------------------------------------------------------

    this.deltaPosX = new Float32Array(MAX_PARTICLES)
    this.deltaPosY = new Float32Array(MAX_PARTICLES)
    this.deltaPosZ = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Mass
    //--------------------------------------------------------------------------

    this.mass = new Float32Array(MAX_PARTICLES)

    //--------------------------------------------------------------------------
    // Color
    //--------------------------------------------------------------------------

    this.colorR = new Float32Array(MAX_PARTICLES)
    this.colorG = new Float32Array(MAX_PARTICLES)
    this.colorB = new Float32Array(MAX_PARTICLES)
  }

  clear() {
    this.count = 0
  }

  createParticle(x, y, z, r = 1, g = 1, b = 1, mass = 1.0) {
    if (this.count >= MAX_PARTICLES) return

    const i = this.count++

    //----------------------------------------
    // Position
    //----------------------------------------

    this.posX[i] = x
    this.posY[i] = y
    this.posZ[i] = z

    //----------------------------------------
    // Previous Position
    //----------------------------------------

    this.prevPosX[i] = x
    this.prevPosY[i] = y
    this.prevPosZ[i] = z

    //----------------------------------------
    // Velocity
    //----------------------------------------

    this.velX[i] = 0
    this.velY[i] = 0
    this.velZ[i] = 0

    //----------------------------------------
    // Force
    //----------------------------------------

    this.forceX[i] = 0
    this.forceY[i] = 0
    this.forceZ[i] = 0

    //----------------------------------------
    // Physical Properties
    //----------------------------------------

    this.mass[i] = mass
    this.density[i] = 0
    this.lambda[i] = 0

    //----------------------------------------
    // Delta Position
    //----------------------------------------

    this.deltaPosX[i] = 0
    this.deltaPosY[i] = 0
    this.deltaPosZ[i] = 0

    //----------------------------------------
    // Color
    //----------------------------------------

    this.colorR[i] = r
    this.colorG[i] = g
    this.colorB[i] = b
  }
}
