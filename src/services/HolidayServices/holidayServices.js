import { apiGetHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const fetchInstituteHolidays = async (params) => {
  const response = await apiGetHelper(`${API_URL}/institute-holidays/fetch`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  });
  return response.data;
};
