import { apiGetHelper } from '../commonUtills/helperAxios';

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
