self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil(self.registration.showNotification(data.title || 'Institute notification', {
    body: data.body || 'You have a new update.',
    icon: '/icons/app-icon-192.png', badge: '/icons/app-icon-192.png',
    tag: data.tag || 'institute-notification', renotify: true,
    vibrate: [180, 80, 180], data: { url: data.url || '/notifications' },
  }));
});
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/notifications', self.location.origin).href;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) return existing.focus().then(() => existing.navigate(url));
    return clients.openWindow(url);
  }));
});
