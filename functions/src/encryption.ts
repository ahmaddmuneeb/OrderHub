import * as CryptoJS from 'crypto-js'

function getKey(): string {
  const key = process.env.ENCRYPTION_KEY
  if (!key) throw new Error('ENCRYPTION_KEY env var not set')
  return key
}

export function encrypt(data: object): string {
  const json = JSON.stringify(data)
  return CryptoJS.AES.encrypt(json, getKey()).toString()
}

export function decrypt<T = unknown>(ciphertext: string): T {
  const bytes = CryptoJS.AES.decrypt(ciphertext, getKey())
  const json = bytes.toString(CryptoJS.enc.Utf8)
  return JSON.parse(json) as T
}
