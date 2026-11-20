/** Draws a cropped sprite with a lightweight articulated leg layer and animated torso. */
export function drawArticulatedCharacter(ctx, sprite, config = {}) {
  if (!ctx || !sprite) return
  const { x = 0, groundY = 0, width = 72, height = 88, pose = 'idle', locomotion = pose, time = 0, cycle, landSquash = 0, color = '#55e8ff', recoil = 0, flash = false } = config
  const image = flash ? sprite.hitFlashCanvas || sprite.canvas || sprite : sprite.canvas || sprite
  const phase = locomotion === 'run' && Number.isFinite(cycle) ? cycle : time * (locomotion === 'run' ? 12 : 2.5)
  const bob = pose === 'idle' ? Math.sin(phase) * height * .012 : locomotion === 'run' ? Math.abs(Math.sin(phase)) * 2 : 0
  const split = Math.round(image.height * .62)
  ctx.save()
  ctx.imageSmoothingEnabled = false
  ctx.translate(Math.round(x), Math.round(groundY - height - bob))
  // Torso stays whole; each half of the lower sprite pivots as an independent leg.
  ctx.save()
  ctx.translate(-recoil, 0)
  if (locomotion === 'run') ctx.rotate(.025)
  if (pose === 'hurt') ctx.rotate(-.07)
  const squash = pose === 'idle' ? 1 + Math.sin(phase) * .025 : 1 - Math.max(0, landSquash) * .18
  ctx.scale(1, squash)
  ctx.drawImage(image, 0, 0, image.width, split, 0, 0, width, height * .62)
  ctx.restore()
  const half = Math.floor(image.width / 2)
  const legH = height * .38 * (1 - Math.max(0, landSquash) * .45)
  const pivotY = height * .62 + legH * .08
  const swing = locomotion === 'run' ? Math.sin(phase) * .34 : 0
  for (const side of [0, 1]) {
    const sx = side === 0 ? 0 : half
    const sw = side === 0 ? half : image.width - half
    const angle = locomotion === 'run' ? (side === 0 ? swing : -swing) : locomotion === 'jump' || locomotion === 'fall' ? (side === 0 ? -.12 : .12) : 0
    ctx.save()
    const footLift = locomotion === 'run' ? Math.max(0, Math.sin(phase * (side === 0 ? 1 : -1))) * height * .045 : 0
    ctx.translate((side * width / 2) + width / 4, pivotY - footLift)
    ctx.rotate(angle)
    ctx.drawImage(image, sx, split, sw, image.height - split, -width / 4, -legH * .08, width / 2, legH)
    ctx.restore()
  }
  if (locomotion === 'run' && Math.sin(phase) > .86) {
    ctx.globalAlpha = .38; ctx.fillStyle = '#d7c7ad'
    ctx.fillRect(-5, height - 5, 5, 3); ctx.fillRect(-10, height - 8, 3, 3)
  }
  ctx.restore()
}
