import { apiGetHelper, apiPutHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const fetchStudentAttendance = async (params) => {
  let finalRes = {};
  await apiGetHelper(`${API_URL}/attendance/fetch`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const fetchStudentYearlyAttendance = async (params) => {
  let finalRes = {};
  await apiGetHelper(`${API_URL}/attendance/yearly-attendance`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const updateStudentAttendance = async (payload) => {
  let finalRes = {};
  await apiPutHelper(`${API_URL}/attendance/update`, payload, {
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};
