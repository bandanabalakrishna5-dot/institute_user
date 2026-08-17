import {
  apiGetHelper,
  apiPostHelper,
  apiPutHelper,
  apiDeleteHelper,
  apiPostFormDataHelper,
} from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const uploadHomeworkAttachment = async (file) => {
  const data = new FormData();
  data.append('image', file);
  data.append('imgtyp', 'common');

  const response = await apiPostFormDataHelper(
    `${API_URL}/files/upload`,
    data,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return response.data;
};

export const fetchClassSubjects = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: {
      'Content-Type': 'application/json',
    },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/common/fetch-class-subjects`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const createHomeworkUpload = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  await apiPostHelper(
    `${API_URL}/homework-upload/create`,
    obj,
    headers
  ).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const fetchHomeWorkUploads = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/homework-upload/fetch`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const updateHomeworkUpload = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
  };
  await apiPutHelper(
    `${API_URL}/homework-upload/update`,
    obj,
    headers
  ).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const deleteHomeworkUpload = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiDeleteHelper(
    `${API_URL}/homework-upload/delete-id`,
    headers
  ).then((response) => {
    finalRes = response.data;
  });
  return Promise.resolve(finalRes);
};

export const fetchInstituteNames = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/institute-information/fetch-all`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const fetchBranchNames = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/institute-branch/fetch-all`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const fetchAcademicYears = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/year/fetch`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const fetchBranchClasses = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/common/fetch-branch-class`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};

export const fetchClassSections = async (obj) => {
  let finalRes = {};
  const headers = {
    headers: { 'Content-Type': 'application/json' },
    params: obj,
  };
  await apiGetHelper(`${API_URL}/common/fetch-class-section`, headers).then(
    (response) => {
      finalRes = response.data;
    }
  );
  return Promise.resolve(finalRes);
};
