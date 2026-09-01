import axios from 'axios';

// Attach the server-issued token to every authenticated API request.
const withAuthentication = (config = {}) => {
  const token = sessionStorage.getItem('institute-auth-token');
  return token
    ? { ...config, headers: { ...config.headers, Authorization: `Bearer ${token}` } }
    : config;
};

export const apiPostHelper = async (URL, PAYLOAD, HEADERS) => {
  try {
    const responseData = await axios.post(URL, PAYLOAD, withAuthentication(HEADERS));
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
    const responseData = await axios.get(URL, withAuthentication(HEADERS_PARAMS));
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
    const responseData = await axios.put(URL, PAYLOAD, withAuthentication(HEADERS));
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
    const responseData = await axios.delete(URL, withAuthentication(HEADERS_PARAMS));
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
    const responseData = await axios.post(URL, PAYLOAD, withAuthentication(HEADERS));
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
