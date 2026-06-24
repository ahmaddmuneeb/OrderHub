'use client'

import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuthStore } from '../../store/useAuthStore'
import { Modal } from '../ui/Modal'
import { Platform, StoreCredentials } from '../../types'
import toast from 'react-hot-toast'
import { Info } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
}

const PLATFORM_FIELDS: Record<Platform, { label: string; key: keyof StoreCredentials; secret?: boolean; placeholder?: string }[]> = {
  shopify: [
    { label: 'Store URL', key: 'storeUrl', placeholder: 'mystore.myshopify.com' },
    { label: 'Admin API Access Token', key: 'apiKey', secret: true, placeholder: 'shpat_…' },
  ],
  woocommerce: [
    { label: 'WordPress Store URL', key: 'storeUrl', placeholder: 'https://mystore.com' },
    { label: 'Consumer Key', key: 'consumerKey', placeholder: 'ck_…' },
    { label: 'Consumer Secret', key: 'consumerSecret', secret: true, placeholder: 'cs_…' },
  ],
  bigcommerce: [
    { label: 'Store URL', key: 'storeUrl', placeholder: 'https://mystore.mybigcommerce.com' },
    { label: 'Store Hash', key: 'storeHash', placeholder: 'abc123' },
    { label: 'Client ID', key: 'clientId', placeholder: 'xxxx' },
    { label: 'Access Token', key: 'accessToken', secret: true, placeholder: 'xxxx' },
  ],
}

const PLATFORM_HELP: Record<Platform, { steps: string; note?: string }> = {
  shopify: {
    steps: 'Shopify Admin → Settings → Apps → Develop apps → Create app → Configuration → Admin API scopes: enable read_orders + write_orders → Save → API credentials → Install app → copy the Admin API access token (shpat_…)',
    note: 'The token is only shown once. Do NOT use the API key or secret key — you need the access token that starts with shpat_',
  },
  woocommerce: {
    steps: 'WooCommerce → Settings → Advanced → REST API → Add key → Permissions: Read/Write → Generate API key',
  },
  bigcommerce: {
    steps: 'BigCommerce Admin → Settings → API → Store-level API Accounts → Create API account → Scope: Orders (Read-Write)',
  },
}

function requiredKeys(platform: Platform): (keyof StoreCredentials)[] {
  return PLATFORM_FIELDS[platform].map((f) => f.key)
}

export function AddStoreModal({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const [platform, setPlatform] = useState<Platform>('shopify')
  const [storeName, setStoreName] = useState('')
  const [creds, setCreds] = useState<Partial<StoreCredentials>>({})
  const [saving, setSaving] = useState(false)

  function reset() {
    setPlatform('shopify')
    setStoreName('')
    setCreds({})
  }

  function handleClose() {
    reset()
    onClose()
  }

  function isFormValid() {
    return requiredKeys(platform).every((k) => Boolean((creds[k] as string)?.trim()))
  }

  async function handleSave() {
    if (!user) return
    if (!isFormValid()) {
      toast.error('Please fill in all fields.')
      return
    }

    setSaving(true)
    try {
      const rawUrl = (creds.storeUrl as string).trim().replace(/\/$/, '')
      const storeUrl = platform === 'shopify'
        ? rawUrl.replace(/^https?:\/\//, '')
        : rawUrl
      await addDoc(collection(db, 'stores'), {
        userId: user.uid,
        platform,
        name: storeName.trim() || storeUrl,
        storeUrl,
        credentials: { ...creds, storeUrl, platform },
        status: 'connected',
        lastSyncedAt: null,
        createdAt: serverTimestamp(),
      })
      toast.success('Store connected!')
      handleClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save store'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const fields = PLATFORM_FIELDS[platform]

  return (
    <Modal open={open} onClose={handleClose} title="Connect a Store" size="md">
      <div className="space-y-4">

        {/* Platform picker */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">Platform</label>
          <select
            value={platform}
            onChange={(e) => { setPlatform(e.target.value as Platform); setCreds({}) }}
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 [color-scheme:dark]"
          >
            <option value="shopify">Shopify</option>
            <option value="woocommerce">WooCommerce</option>
            <option value="bigcommerce">BigCommerce</option>
          </select>
        </div>

        {/* Help hint */}
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-3 py-2.5 text-xs text-indigo-300">
          <div className="flex gap-2">
            <Info size={13} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Where to find credentials</p>
              <p className="leading-relaxed text-indigo-400">{PLATFORM_HELP[platform].steps}</p>
              {PLATFORM_HELP[platform].note && (
                <p className="mt-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-amber-400 font-medium">
                  ⚠ {PLATFORM_HELP[platform].note}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Display name */}
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-400">
            Display Name <span className="font-normal text-slate-600">(optional)</span>
          </label>
          <input
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            placeholder="My Main Store"
            className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Dynamic credential fields */}
        {fields.map(({ label, key, secret, placeholder }) => (
          <div key={key}>
            <label className="mb-1.5 block text-sm font-semibold text-slate-400">{label}</label>
            <input
              value={(creds[key] as string) ?? ''}
              onChange={(e) => setCreds({ ...creds, [key]: e.target.value })}
              type={secret ? 'password' : 'text'}
              placeholder={placeholder}
              autoComplete="off"
              className="w-full rounded-xl border border-white/[0.1] bg-white/[0.07] px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        ))}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1 border-t border-white/[0.07]">
          <button
            onClick={handleClose}
            className="rounded-xl border border-white/[0.1] px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isFormValid()}
            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/25 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Connecting…' : 'Connect Store'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
