import { sendTestPush, subscribePush, unsubscribePush } from './api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function arrayBufferToBase64Url(input: ArrayBuffer): string {
  const bytes = new Uint8Array(input)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    const byte = bytes[i]
    if (byte === undefined) {
      continue
    }
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function serviceWorkerReady(timeoutMs = 12000): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser')
  }
  if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    throw new Error('Push notifications require HTTPS (or localhost)')
  }
  const existing = await navigator.serviceWorker.getRegistration()
  if (existing?.active) {
    return existing
  }
  const timeout = new Promise<never>((_, reject) => {
    window.setTimeout(() => reject(new Error('Service worker is not ready yet. Reload and try again.')), timeoutMs)
  })
  await Promise.race([navigator.serviceWorker.ready, timeout])
  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    throw new Error('Service worker is not registered')
  }
  return registration
}

function readSubscriptionFields(subscription: PushSubscription): { endpoint: string; p256dh: string; auth: string } | null {
  const json = subscription.toJSON()
  const endpoint = json.endpoint ?? subscription.endpoint
  const jsonP256dh = json.keys?.p256dh
  const jsonAuth = json.keys?.auth
  const keyP256dh = subscription.getKey('p256dh')
  const keyAuth = subscription.getKey('auth')
  const p256dh = jsonP256dh ?? (keyP256dh ? arrayBufferToBase64Url(keyP256dh) : null)
  const auth = jsonAuth ?? (keyAuth ? arrayBufferToBase64Url(keyAuth) : null)
  if (!endpoint || !p256dh || !auth) {
    return null
  }
  return { endpoint, p256dh, auth }
}

export async function getPermissionState(): Promise<NotificationPermission> {
  return Notification.permission
}

export async function subscribeToPush(token: string): Promise<'subscribed'> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push notifications are not supported in this browser')
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY ?? "BNqacTJj2ZddeM5Wa7r2XTlXbmxSguqGuBjIrsxRWX-hngqRFAtlJ7p8r3LXxpJgmHGPdHkr7d7qcxaeuY7NJs0"
  if (!vapidPublicKey) {
    throw new Error('VAPID public key missing in frontend environment')
  }

  const permission = await Notification.requestPermission()
  console.log(permission);
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted')
  }

  const registration = await serviceWorkerReady()
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    })
  }

  let fields = readSubscriptionFields(subscription)
  if (!fields) {
    await subscription.unsubscribe()
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
    })
    fields = readSubscriptionFields(subscription)
  }
  if (!fields) {
    throw new Error('Invalid push subscription object: missing endpoint/keys')
  }
  await subscribePush(token, fields.endpoint, fields.p256dh, fields.auth)
  return 'subscribed'
}

export async function unsubscribeFromPush(token: string): Promise<'unsubscribed'> {
  await unsubscribePush(token, null)
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return 'unsubscribed'
  }
  try {
    const registration = await serviceWorkerReady()
    const subscription = await registration.pushManager.getSubscription()
    if (subscription) {
      await subscription.unsubscribe()
    }
  } catch {
    // Backend unsubscribe already succeeded; ignore local SW cleanup errors.
  }
  return 'unsubscribed'
}

export async function sendPushTest(token: string): Promise<void> {
  await sendTestPush(token)
}
