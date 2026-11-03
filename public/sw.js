/* 会场事件 Web Push Service Worker */
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: '会场事件', body: event.data ? event.data.text() : '' }
  }
  const title = data.title || '会场事件'
  const options = {
    body: data.body || '会场有一则新事件',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'mun-event',
    data: { url: data.url || '/#/events' },
    requireInteraction: true,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/#/events'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
