import { apiGetHelper, apiPostHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

const toApplicationServerKey = (value) => {
  const padding = '='.repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  const bytes = window.atob(base64);
  return Uint8Array.from(bytes, (character) => character.charCodeAt(0));
};

export const enablePushNotifications = async (user) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission;
  if (permission !== 'granted') return false;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const keyResponse = await apiGetHelper(`${API_URL}/notification/push-public-key`, {
      headers: { 'Content-Type': 'application/json' },
    });
    const publicKey = keyResponse?.data?.payload?.publicKey;
    if (!publicKey) return false;
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: toApplicationServerKey(publicKey),
    });
  }

  const response = await apiPostHelper(`${API_URL}/notification/push-subscribe`, {
    subscription: subscription.toJSON(),
    usrid: user.usrid,
    typ: user.typ,
    instid: user.instid,
    brcid: user.brcid,
    clsnm: user.clsnm || '',
  }, { headers: { 'Content-Type': 'application/json' } });
  return response?.data?.status === 'success';
};

export const disablePushNotifications = async () => {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager?.getSubscription();
  if (!subscription) return;
  await apiPostHelper(`${API_URL}/notification/push-unsubscribe`, {
    endpoint: subscription.endpoint,
  }, { headers: { 'Content-Type': 'application/json' } });
  await subscription.unsubscribe();
};
