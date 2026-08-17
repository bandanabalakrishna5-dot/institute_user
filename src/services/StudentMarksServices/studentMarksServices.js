import { apiGetHelper, apiPostHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;
const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

export const fetchExamTimeTableMarks = async (params) => {
  const response = await apiGetHelper(
    `${API_URL}/student-marks/fetch-exam-time-table`,
    { ...jsonHeaders, params }
  );
  return response.data;
};

export const createStudentMarks = async (payload) => {
  const response = await apiPostHelper(
    `${API_URL}/student-marks/create`,
    payload,
    jsonHeaders
  );
  return response.data;
};
