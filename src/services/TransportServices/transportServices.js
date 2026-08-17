import { apiPostHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;
const headers = { headers: { 'Content-Type': 'application/json' } };

export const saveDriverGpsLocation = async (payload) => {
  const response = await apiPostHelper(
    `${API_URL}/transport-information/gps-location`,
    payload,
    headers
  );
  return response.data;
};
