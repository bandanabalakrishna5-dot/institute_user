import { apiDeleteHelper, apiGetHelper, apiPostHelper, apiPutHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

const config = (params) => ({
  headers: { 'Content-Type': 'application/json' },
  ...(params ? { params } : {}),
});

export const fetchStudentsForHomework = async (params) => {
  const response = await apiGetHelper(`${API_URL}/common/fetch-section-student`, config(params));
  return response.data;
};

export const fetchHomeworkCompletions = async (params) => {
  const response = await apiGetHelper(`${API_URL}/homework-complete/fetch`, config(params));
  return response.data;
};

export const createHomeworkCompletion = async (payload) => {
  const response = await apiPostHelper(`${API_URL}/homework-complete/create`, payload, config());
  return response.data;
};

export const updateHomeworkCompletion = async (payload) => {
  const response = await apiPutHelper(`${API_URL}/homework-complete/update`, payload, config());
  return response.data;
};

export const deleteHomeworkCompletion = async (params) => {
  const response = await apiDeleteHelper(`${API_URL}/homework-complete/delete-id`, config(params));
  return response.data;
};
