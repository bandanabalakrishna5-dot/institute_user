import { apiGetHelper, apiPostHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const fetchStaffLeaves = async (params) => {
  let finalRes = {};
  await apiGetHelper(`${API_URL}/leave-management/fetch`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const createStaffLeave = async (payload) => {
  let finalRes = {};
  await apiPostHelper(`${API_URL}/leave-management/create`, payload, {
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const fetchStudentLeaves = (params) => fetchStaffLeaves(params);

export const createStudentLeave = (payload) => createStaffLeave(payload);

export const fetchLeaveTypes = async () => {
  let finalRes = {};
  await apiGetHelper(`${API_URL}/leave-type/fetch`, {
    headers: { 'Content-Type': 'application/json' },
  }).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};
