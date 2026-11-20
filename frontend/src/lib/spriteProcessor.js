const spriteCache = new Map()
const spriteStripCache = new Map()

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`No se pudo cargar el sprite: ${src}`))
    image.src = src
  })
}

function isExteriorWhite(data, pixel) {
  const offset = pixel * 4
  const red = data[offset]; const green = data[offset + 1]; const blue = data[offset + 2]
  return data[offset + 3] > 0 && Math.min(red, green, blue) > 212 && Math.max(red, green, blue) - Math.min(red, green, blue) < 34
}

function removeConnectedWhite(data, width, height) {
  const count = width * height
  const visited = new Uint8Array(count)
  const queue = new Int32Array(count)
  let head = 0
  let tail = 0
  const enqueue = (pixel) => {
    if (!visited[pixel] && isExteriorWhite(data, pixel)) {
      visited[pixel] = 1
      queue[tail++] = pixel
    }
  }

  for (let x = 0; x < width; x += 1) { enqueue(x); enqueue((height - 1) * width + x) }
  for (let y = 0; y < height; y += 1) { enqueue(y * width); enqueue(y * width + width - 1) }

  while (head < tail) {
    const pixel = queue[head++]
    const x = pixel % width
    const y = (pixel - x) / width
    const offset = pixel * 4
    data[offset] = 0; data[offset + 1] = 0; data[offset + 2] = 0; data[offset + 3] = 0
    if (x > 0) enqueue(pixel - 1)
    if (x + 1 < width) enqueue(pixel + 1)
    if (y > 0) enqueue(pixel - width)
    if (y + 1 < height) enqueue(pixel + width)
  }
}

function findOpaqueBounds(data, width, height) {
  let left = width; let top = height; let right = -1; let bottom = -1
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= 8) continue
      if (x < left) left = x
      if (x > right) right = x
      if (y < top) top = y
      if (y > bottom) bottom = y
    }
  }
  if (right < left || bottom < top) return { x: 0, y: 0, width, height }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}

function createHitFlashCanvas(spriteCanvas) {
  const canvas = document.createElement('canvas')
  canvas.width = spriteCanvas.width
  canvas.height = spriteCanvas.height
  const context = canvas.getContext('2d', { willReadFrequently: true })
  const source = spriteCanvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height)
  const result = context.createImageData(canvas.width, canvas.height)
  for (let i = 0; i < source.data.length; i += 4) {
    const alpha = source.data[i + 3]
    if (!alpha) continue
    const pixelX = (i / 4) % canvas.width
    const redSide = pixelX < canvas.width * .56
    result.data[i] = 255
    result.data[i + 1] = redSide ? 54 : 246
    result.data[i + 2] = redSide ? 72 : 255
    result.data[i + 3] = alpha
  }
  context.putImageData(result, 0, 0)
  return canvas
}

async function processSprite(src) {
  const image = await loadImage(src)
  const original = document.createElement('canvas')
  original.width = image.naturalWidth
  original.height = image.naturalHeight
  const context = original.getContext('2d', { willReadFrequently: true })
  context.drawImage(image, 0, 0)
  const pixels = context.getImageData(0, 0, original.width, original.height)
  removeConnectedWhite(pixels.data, original.width, original.height)
  const bounds = findOpaqueBounds(pixels.data, original.width, original.height)
  const cropped = document.createElement('canvas')
  cropped.width = bounds.width
  cropped.height = bounds.height
  cropped.getContext('2d').putImageData(pixels, -bounds.x, -bounds.y)
  const hitFlashCanvas = createHitFlashCanvas(cropped)
  return {
    canvas: cropped,
    hitFlashCanvas,
    bounds,
    width: cropped.width,
    height: cropped.height,
    groundYOffset: cropped.height,
  }
}

/** Removes only edge-connected white, crops transparent margins, and prepares a hit flash. */
export function prepareArcadeSprite(src) {
  if (!spriteCache.has(src)) spriteCache.set(src, processSprite(src))
  return spriteCache.get(src)
}

/** Loads a horizontal frame strip and normalizes every transparent frame to one baseline. */
export function prepareArcadeSpriteStrip(src, frameCount = 8) {
  const key = `${src}#${frameCount}`
  if (!spriteStripCache.has(key)) {
    spriteStripCache.set(key, (async () => {
      const image = await loadImage(src)
      const cellWidth = image.naturalWidth / frameCount
      const source = document.createElement('canvas')
      source.width = image.naturalWidth
      source.height = image.naturalHeight
      const context = source.getContext('2d', { willReadFrequently: true })
      context.drawImage(image, 0, 0)
      const sourcePixels = context.getImageData(0, 0, source.width, source.height).data
      const boundsPerFrame = []
      let maxWidth = 1
      let maxHeight = 1
      for (let index = 0; index < frameCount; index += 1) {
        const left = Math.floor(index * cellWidth)
        const right = Math.floor((index + 1) * cellWidth)
        const frameWidth = right - left
        const framePixels = new Uint8ClampedArray(frameWidth * source.height * 4)
        for (let y = 0; y < source.height; y += 1) {
          const start = (y * source.width + left) * 4
          framePixels.set(sourcePixels.subarray(start, start + frameWidth * 4), y * frameWidth * 4)
        }
        removeConnectedWhite(framePixels, frameWidth, source.height)
        const bounds = findOpaqueBounds(framePixels, frameWidth, source.height)
        boundsPerFrame.push({ left, bounds, pixels: framePixels, frameWidth })
        maxWidth = Math.max(maxWidth, bounds.width)
        maxHeight = Math.max(maxHeight, bounds.height)
      }
      const frames = boundsPerFrame.map(({ bounds, pixels, frameWidth }) => {
        const frame = document.createElement('canvas')
        frame.width = maxWidth
        frame.height = maxHeight
        const frameContext = frame.getContext('2d')
        const framePixels = new Uint8ClampedArray(bounds.width * bounds.height * 4)
        for (let y = 0; y < bounds.height; y += 1) {
          const start = ((bounds.y + y) * frameWidth + bounds.x) * 4
          framePixels.set(pixels.subarray(start, start + bounds.width * 4), y * bounds.width * 4)
        }
        const croppedFrame = document.createElement('canvas')
        croppedFrame.width = bounds.width
        croppedFrame.height = bounds.height
        croppedFrame.getContext('2d').putImageData(new ImageData(framePixels, bounds.width, bounds.height), 0, 0)
        frameContext.drawImage(croppedFrame, Math.floor((maxWidth - bounds.width) / 2), maxHeight - bounds.height)
        return frame
      })
      return { frames, frameCount, frameWidth: maxWidth, frameHeight: maxHeight }
    })())
  }
  return spriteStripCache.get(key)
}

function hueToRgb(p, q, t) {
  let value = t
  if (value < 0) value += 1
  if (value > 1) value -= 1
  if (value < 1 / 6) return p + (q - p) * 6 * value
  if (value < 1 / 2) return q
  if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6
  return p
}

/** Recolors teal cloth while keeping the pixel-art shading and outlines intact. */
export function recolorStudentHoodie(strip, hueDegrees) {
  if (!strip?.frames) return strip
  const frames = strip.frames.map((source) => {
    const canvas = document.createElement('canvas')
    canvas.width = source.width; canvas.height = source.height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(source, 0, 0)
    const image = context.getImageData(0, 0, canvas.width, canvas.height)
    for (let i = 0; i < image.data.length; i += 4) {
      const alpha = image.data[i + 3]
      if (!alpha) continue
      const red = image.data[i] / 255; const green = image.data[i + 1] / 255; const blue = image.data[i + 2] / 255
      const max = Math.max(red, green, blue); const min = Math.min(red, green, blue); const delta = max - min
      let hue = 0
      if (delta) {
        if (max === red) hue = ((green - blue) / delta) % 6
        else if (max === green) hue = (blue - red) / delta + 2
        else hue = (red - green) / delta + 4
        hue = ((hue * 60) + 360) % 360
      }
      const saturation = max === 0 ? 0 : delta / max
      if (hue < 148 || hue > 205 || saturation < .24) continue
      const lightness = (max + min) / 2
      const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
      const h = ((hueDegrees % 360) + 360) % 360 / 360
      const q = lightness < .5 ? lightness * (1 + s) : lightness + s - lightness * s
      const p = 2 * lightness - q
      image.data[i] = Math.round(hueToRgb(p, q, h + 1 / 3) * 255)
      image.data[i + 1] = Math.round(hueToRgb(p, q, h) * 255)
      image.data[i + 2] = Math.round(hueToRgb(p, q, h - 1 / 3) * 255)
    }
    context.putImageData(image, 0, 0)
    return canvas
  })
  return { ...strip, frames }
}

export function clearArcadeSpriteCache() {
  spriteCache.clear()
  spriteStripCache.clear()
}
