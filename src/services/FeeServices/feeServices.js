import { apiGetHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;
const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

export const fetchStudentFeeSummary = async (params) => {
  const response = await apiGetHelper(
    `${API_URL}/common/student-fee-summary`,
    { ...jsonHeaders, params },
  );
  return response.data;
};

export const fetchStudentPaymentDates = async (params) => {
  const response = await apiGetHelper(
    `${API_URL}/common/student-payment-dates`,
    { ...jsonHeaders, params },
  );
  return response.data;
};
