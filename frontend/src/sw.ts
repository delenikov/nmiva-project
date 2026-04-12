/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { registerRoute, setCatchHandler } from 'workbox-routing'
import { NetworkFirst, NetworkOnly, StaleWhileRevalidate } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

const navigationHandler = (() => {
  try {
    return createHandlerBoundToURL('/index.html')
  } catch {
    try {
      return createHandlerBoundToURL('/')
    } catch {
      return null
    }
  }
})()

if (navigationHandler) {
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    navigationHandler
  )
} else {
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({ cacheName: 'nmiva-pages', networkTimeoutSeconds: 5 })
  )
}

registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style' || request.destination === 'image',
  new StaleWhileRevalidate({ cacheName: 'nmiva-assets' })
)

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({ cacheName: 'nmiva-api', networkTimeoutSeconds: 5 })
)

registerRoute(
  ({ request, url }) => request.method === 'POST' && url.pathname.startsWith('/api/'),
  new NetworkOnly()
)

setCatchHandler(async ({ event }) => {
  const request = (event as FetchEvent).request
  if (request.destination === 'document') {
    return caches.match('/offline.html') as Promise<Response>
  }
  return Response.error()
})

self.addEventListener('push', (event) => {
  if (!event.data) {
    return
  }
  const payload = event.data.json() as { title?: string; body?: string; url?: string }
  event.waitUntil(self.registration.showNotification(payload.title ?? 'NMIVA', {
    body: payload.body ?? '',
    icon: '/pwa-icon.svg',
    badge: '/pwa-icon.svg',
    data: { url: payload.url ?? '/app' }
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data?.url as string | undefined) ?? '/app'
  event.waitUntil((async () => {
    const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const client of allClients) {
      if ('focus' in client) {
        client.navigate(targetUrl)
        return client.focus()
      }
    }
    return self.clients.openWindow(targetUrl)
  })())
})
