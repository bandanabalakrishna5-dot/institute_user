import { apiPostHelper, apiGetHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const b2cLogin = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  await apiPostHelper(`${API_URL}/user-table/B2C-login`, obj, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const fetchStaffProfileById = async (obj) => {
  let finalRes = {};
  const headers = { params: obj };
  await apiGetHelper(
    `${API_URL}/staff-info/fetch-staff-profile`,
    headers
  ).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const fetchStudentProfileById = async (obj) => {
  let finalRes = {};
  const headers = { params: obj };
  await apiGetHelper(
    `${API_URL}/student/fetch-student-profile`,
    headers
  ).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};