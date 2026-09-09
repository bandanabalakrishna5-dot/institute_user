import axios from 'axios';
import { getStoredAccessToken } from '../Authentication/sessionStorage';

axios.interceptors.request.use((config) => {
  const token = getStoredAccessToken();
  if (token && !config.headers['x-access-token']) config.headers['x-access-token'] = token;
  return config;
});

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) window.dispatchEvent(new Event('institute-auth-invalid'));
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
