/** Cryptographically secure random utilities using Web Crypto API. */

export function random() {
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('Web Crypto API no está disponible.')
  }
  const values = new Uint32Array(1)
  globalThis.crypto.getRandomValues(values)
  return (values[0] & 0x00ffffff) / 0x01000000
}

export function randomInt(max) {
  return Math.floor(random() * max)
}

export function randomChoice(array) {
  return array[randomInt(array.length)]
}
