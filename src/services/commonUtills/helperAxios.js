import axios from 'axios';

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
