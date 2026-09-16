import { argon2, randomBytes, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const derive = promisify(argon2)
const PARAMS = { memory: 19456, passes: 2, parallelism: 1, tagLength: 32 }

export async function hashPassword(password) {
  const nonce = randomBytes(16)
  const tag = await derive('argon2id', { message: Buffer.from(password, 'utf8'), nonce, ...PARAMS })
  const settings = `m=${PARAMS.memory},t=${PARAMS.passes},p=${PARAMS.parallelism}`
  return `$argon2id$v=19$${settings}$${nonce.toString('base64')}$${tag.toString('base64')}`
}

export async function verifyPassword(password, stored) {
  const parts = String(stored).split('$')
  if (parts.length !== 6 || parts[1] !== 'argon2id') return false
  const settings = Object.fromEntries(parts[3].split(',').map((pair) => pair.split('=')))
  const nonce = Buffer.from(parts[4], 'base64')
  const expected = Buffer.from(parts[5], 'base64')
  if (expected.length === 0) return false
  const actual = await derive('argon2id', {
    message: Buffer.from(password, 'utf8'),
    nonce,
    memory: Number(settings.m),
    passes: Number(settings.t),
    parallelism: Number(settings.p),
    tagLength: expected.length,
  })
  return timingSafeEqual(actual, expected)
}

let dummyHash = null

export async function spendVerificationTime(password) {
  dummyHash ??= hashPassword('foxtrack-timing-equalizer')
  await verifyPassword(password, await dummyHash)
}
