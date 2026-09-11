import { apiGetHelper, apiPostHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const fetchUserNotifications = async (params) => {
  const response = await apiGetHelper(`${API_URL}/notification/portal-messages`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  });
  return response.data;
};

export const fetchInstituteNotificationCount = async (params) => {
  const response = await apiGetHelper(`${API_URL}/notification/portal-count`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  });
  return response.data;
};

export const fetchHomeworkNotifications = async (studentId, params) => {
  const response = await apiGetHelper(
    `${API_URL}/homework-notification/notification/${studentId}`,
    {
      headers: { 'Content-Type': 'application/json' },
      params,
    },
  );
  return response.data;
};

const urlBase64ToUint8Array = (value) => {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const raw = atob((value + padding).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
};

export const enablePushNotifications = async (user, askPermission = false) => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !user?.usrid) return false;
  if (askPermission && Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return false;
  const registration = await navigator.serviceWorker.ready;
  const keyResponse = await apiGetHelper(`${API_URL}/notification/push-public-key`);
  const publicKey = keyResponse?.data?.payload?.publicKey || keyResponse?.data?.payload;
  if (!publicKey) return false;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }
  const response = await apiPostHelper(`${API_URL}/notification/push-subscribe`, {
    subscription: subscription.toJSON(), usrid: user.usrid, typ: user.typ,
    instid: user.instid, brcid: user.brcid, clsnm: user.clsnm || '',
  });
  return response?.data?.status === 'success';
};
