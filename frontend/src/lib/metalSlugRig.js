export const PLAYER_STATE = Object.freeze({ IDLE: 'idle', RUN: 'run', JUMP: 'jump', FALL: 'fall', SHOOT: 'shoot', HURT: 'hurt' })

// One-way ledges placed against the long TecNM panorama: garden walls and raised campus walkways.
export const CAMPUS_PLATFORMS = Object.freeze([
  { id: 'jardin', x: 325, y: 370, width: 176, height: 28, style: 'stone' },
  { id: 'pasillo', x: 900, y: 370, width: 190, height: 28, style: 'campus' },
  { id: 'laboratorio', x: 1490, y: 370, width: 188, height: 28, style: 'campus' },
])

export function createMetalSlugRig() {
  return { vx: 0, vy: 0, state: PLAYER_STATE.IDLE, coyoteUntil: 0, jumpQueued: false, jumpQueuedAt: 0, hurtUntil: 0, shotRecoil: 0, legPhase: 0, landSquash: 0 }
}

/** Delta-time physics with acceleration, coyote jumps, fast-fall and a camera deadzone. */
export function stepMetalSlugRig(game, dt, now, platformLayout = [], cameraScale = 0.18, cameraRange = 960) {
  const rig = game.rig || (game.rig = createMetalSlugRig())
  const worldWidth = game.worldWidth || 960
  const playerWidth = game.playerWidth || 72
  const playerHeight = game.playerHeight || 88
  const previousBottom = game.y + playerHeight
  const axis = Number(Boolean(game.input.right)) - Number(Boolean(game.input.left))
  const acceleration = 1750
  const maxSpeed = 260
  if (axis) rig.vx += axis * acceleration * dt
  else rig.vx += (0 - rig.vx) * Math.min(1, 12 * dt)
  rig.vx = Math.max(-maxSpeed, Math.min(maxSpeed, rig.vx))
  if (Math.abs(rig.vx) < 7 && !axis) rig.vx = 0

  let scrollDelta = 0
  game.x += rig.vx * dt
  const deadzoneRight = Math.min(worldWidth - playerWidth - 24, Math.round(worldWidth * .58))
  const deadzoneLeft = 330
  if (game.x > deadzoneRight) { scrollDelta = game.x - deadzoneRight; game.x = deadzoneRight }
  else if (game.x < deadzoneLeft && game.worldDistance > 0) { scrollDelta = Math.max(-game.worldDistance, game.x - deadzoneLeft); game.x -= scrollDelta }
  game.x = Math.max(24, Math.min(worldWidth - playerWidth - 12, game.x))

  const nextDistance = Math.max(0, game.worldDistance + scrollDelta)
  const cameraOffset = Math.min(cameraRange, nextDistance * cameraScale)
  if (game.onGround && game.groundPlatformId) {
    const standing = platformLayout.find((platform) => platform.id === game.groundPlatformId)
    const left = standing ? standing.x - cameraOffset : -Infinity
    if (!standing || game.x + playerWidth - 8 <= left || game.x + 8 >= left + standing.width) {
      game.onGround = false
      game.groundPlatformId = null
    }
  }

  if (game.onGround) rig.coyoteUntil = now + 115
  if (rig.jumpQueued && now - rig.jumpQueuedAt > 145) rig.jumpQueued = false
  if (rig.jumpQueued && now <= rig.coyoteUntil && !game.done) {
    game.vy = -650
    game.onGround = false
    game.groundPlatformId = null
    rig.jumpQueued = false
    rig.landSquash = 0
  }
  if (!game.onGround) {
    game.vy += (game.vy > 0 ? 2580 : 1850) * dt
    game.vy = Math.min(game.vy, 1050)
    game.y += game.vy * dt
    if (game.y >= 470 - playerHeight) {
      game.y = 470 - playerHeight
      game.vy = 0
      game.onGround = true
      game.groundPlatformId = null
      rig.landSquash = .12
    }
  }
  if (!game.onGround && game.vy >= 0) {
    const bottom = game.y + playerHeight
    const landing = platformLayout.find((platform) => {
      const left = platform.x - cameraOffset
      const overlapsHorizontally = game.x + playerWidth - 8 > left && game.x + 8 < left + platform.width
      return overlapsHorizontally && previousBottom <= platform.y + 3 && bottom >= platform.y
    })
    if (landing) {
      game.y = landing.y - playerHeight
      game.vy = 0
      game.onGround = true
      game.groundPlatformId = landing.id
      rig.coyoteUntil = now + 115
      rig.landSquash = .12
    }
  }
  rig.landSquash *= Math.max(0, 1 - dt * 8)
  rig.legPhase += Math.abs(rig.vx) / maxSpeed * dt * 15
  rig.shotRecoil += (0 - rig.shotRecoil) * Math.min(1, dt * 20)
  if (now < rig.hurtUntil) rig.state = PLAYER_STATE.HURT
  else if (!game.onGround) rig.state = game.vy < 0 ? PLAYER_STATE.JUMP : PLAYER_STATE.FALL
  else if (game.input.fire) rig.state = PLAYER_STATE.SHOOT
  else if (Math.abs(rig.vx) > 18) rig.state = PLAYER_STATE.RUN
  else rig.state = PLAYER_STATE.IDLE
  return { scrollDelta, state: rig.state, speed: rig.vx }
}
