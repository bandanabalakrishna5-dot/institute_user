import { apiGetHelper, apiPutHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

const fetchTimetableData = async (path, params, resource = 'miscellaneous') => {
  const response = await apiGetHelper(`${API_URL}/${resource}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  });
  return response.data;
};

export const fetchStaffDailyTimetable = (params) =>
  fetchTimetableData('fetch-staff-daily-timetable', params, 'common');

export const fetchStaffPeriodTopicDetails = (params) =>
  fetchTimetableData('fetch-staff-period-topic-details', params, 'common');

export const updateSubSyllabusStatus = async (payload) => {
  const response = await apiPutHelper(`${API_URL}/common/update-sub-syllabus-status`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};
