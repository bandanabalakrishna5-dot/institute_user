import axios from 'axios';
import { getSessionToken, invalidateAuthSession, loadAuthSession } from '../Authentication/authSession';

export const API_SUCCESS_EVENT = 'institute-api-success';

const silentMutationPaths = [
  '/B2C-login',
  '/gps-location',
  '/absent-notification',
  '/push-subscribe',
  '/push-unsubscribe',
  '/files/upload',
];

const announceSuccessfulMutation = (response) => {
  const method = String(response?.config?.method || '').toLowerCase();
  const url = String(response?.config?.url || '');
  if (!['post', 'put', 'patch', 'delete'].includes(method)) return;
  if (silentMutationPaths.some((path) => url.includes(path))) return;
  if (response?.data?.status === 'error' || response?.data?.errors?.length) return;

  const serverMessage = response?.data?.payload?.message || response?.data?.message;
  const fallback = method === 'delete' ? 'Deleted successfully.' : 'Saved successfully.';
  window.dispatchEvent(new CustomEvent(API_SUCCESS_EVENT, {
    detail: { message: typeof serverMessage === 'string' ? serverMessage : fallback },
  }));
};

axios.interceptors.request.use((config) => {
  const token = getSessionToken(loadAuthSession());
  if (token && !config.headers.Authorization && !config.headers['x-access-token']) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['x-access-token'] = token;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    announceSuccessfulMutation(response);
    return response;
  },
  (error) => {
    if (error?.response?.status === 401) invalidateAuthSession();
    return Promise.reject(error);
  }
);

export const apiPostHelper = async (URL, PAYLOAD, HEADERS) => {
  try {
    const responseData = await axios.post(URL, PAYLOAD, HEADERS);
    return responseData;
  } catch (e) {
    if (!e.response) {
      const obj = {
        data: {
          errors: [
            {
              errorMessage: 'Error: Network Error',
            },
          ],
        },
      };
      return obj;
    } else {
      if (e && e.response && e.response.data) {
        return { data: e.response.data };
      } else {
        return {
          data: {
            errors: [{ errorMessage: 'Something went wrong' }],
          },
        };
      }
    }
  }
};

export const apiGetHelper = async (URL, HEADERS_PARAMS) => {
  try {
    const responseData = await axios.get(URL, HEADERS_PARAMS);
    return responseData;
  } catch (e) {
    if (!e.response) {
      return {
        data: {
          errors: [{ errorMessage: 'Error: Network Error' }],
        },
      };
    } else {
      if (e && e.response && e.response.data) {
        return { data: e.response.data };
      } else {
        return {
          data: {
            errors: [{ errorMessage: 'Something went wrong' }],
          },
        };
      }
    }
  }
};

export const apiPutHelper = async (URL, PAYLOAD, HEADERS) => {
  try {
    const responseData = await axios.put(URL, PAYLOAD, HEADERS);
    return responseData;
  } catch (e) {
    if (!e.response) {
      return {
        data: {
          errors: [{ errorMessage: 'Error: Network Error' }],
        },
      };
    } else {
      if (e && e.response && e.response.data) {
        return { data: e.response.data };
      } else {
        return {
          data: {
            errors: [{ errorMessage: 'Something went wrong' }],
          },
        };
      }
    }
  }
};

export const apiDeleteHelper = async (URL, HEADERS_PARAMS) => {
  try {
    const responseData = await axios.delete(URL, HEADERS_PARAMS);
    return responseData;
  } catch (e) {
    if (!e.response) {
      return {
        data: {
          errors: [{ errorMessage: 'Error: Network Error' }],
        },
      };
    } else {
      if (e && e.response && e.response.data) {
        return { data: e.response.data };
      } else {
        return {
          data: {
            errors: [{ errorMessage: 'Something went wrong' }],
          },
        };
      }
    }
  }
};

export const apiPostFormDataHelper = async (URL, PAYLOAD, HEADERS) => {
  try {
    const responseData = await axios.post(URL, PAYLOAD, HEADERS);
    return responseData;
  } catch (e) {
    if (!e.response) {
      const obj = {
        data: {
          errors: [
            {
              errorMessage: 'Error: Network Error',
            },
          ],
        },
      };
      return obj;
    } else {
      if (e && e.response && e.response.data) {
        return { data: e.response.data };
      } else {
        return {
          data: {
            errors: [{ errorMessage: 'Something went wrong' }],
          },
        };
      }
    }
  }
};
