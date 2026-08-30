import { apiGetHelper, apiPostHelper } from '../commonUtills/helperAxios';
import { io } from 'socket.io-client';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;
const SOCKET_URL = API_URL?.replace(/\/api\/v1\/?$/, '');
const headers = { headers: { 'Content-Type': 'application/json' } };

export const saveDriverGpsLocation = async (payload) => {
  const response = await apiPostHelper(
    `${API_URL}/transport-information/gps-location`,
    payload,
    headers
  );
  return response.data;
};

export const fetchStudentBusLocation = async (studentId) => {
  const response = await apiGetHelper(`${API_URL}/common/student-bus-location`, {
    headers: { 'Content-Type': 'application/json' },
    params: { stdid: studentId },
  });
  return response.data;
};

export const createBusTrackingSocket = () => io(SOCKET_URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
  auth: { token: sessionStorage.getItem('institute-auth-token') || '' },
});
