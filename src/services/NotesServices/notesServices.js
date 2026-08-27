import {
  apiDeleteHelper,
  apiGetHelper,
  apiPostFormDataHelper,
  apiPostHelper,
  apiPutHelper,
} from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;
const jsonHeaders = { headers: { 'Content-Type': 'application/json' } };

export const uploadNoteAttachment = async (file) => {
  const data = new FormData();
  data.append('image', file);
  data.append('imgtyp', 'common');
  const response = await apiPostFormDataHelper(`${API_URL}/files/upload`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const createNotes = async (payload) => {
  const response = await apiPostHelper(`${API_URL}/notes/create`, payload, jsonHeaders);
  return response.data;
};

export const fetchNotes = async (params) => {
  const response = await apiGetHelper(`${API_URL}/notes/fetch`, { ...jsonHeaders, params });
  return response.data;
};

export const updateNotes = async (payload) => {
  const response = await apiPutHelper(`${API_URL}/notes/update`, payload, jsonHeaders);
  return response.data;
};

export const deleteNotes = async (ntid) => {
  const response = await apiDeleteHelper(`${API_URL}/notes/delete-id`, {
    ...jsonHeaders,
    params: { ntid },
  });
  return response.data;
};
