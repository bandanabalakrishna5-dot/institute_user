import { apiGetHelper, apiPutHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const formatPeriodLabel = (period, fallbackIndex = 0) => {
  const value = period?.prd;
  return `Period ${value !== undefined && value !== null && value !== '' ? value : fallbackIndex + 1}`;
};

export const uniqueTimetablePeriods = (periods = []) => {
  const seen = new Set();
  return periods.filter((period) => {
    const key = period.clsprid ?? [
      period.clstmtbleid,
      period.prd,
      period.clsid,
      period.secid,
      period.subid,
    ].join('-');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const fetchTimetableData = async (path, params, resource = 'miscellaneous') => {
  const response = await apiGetHelper(`${API_URL}/${resource}/${path}`, {
    headers: { 'Content-Type': 'application/json' },
    params,
  });
  return response.data;
};

export const fetchStaffDailyTimetable = (params) =>
  fetchTimetableData('fetch-staff-daily-timetable', params, 'common');

export const fetchStudentDailyTimetable = (params) =>
  fetchTimetableData('fetch-student-daily-timetable', params, 'common');

export const fetchStaffPeriodTopicDetails = (params) =>
  fetchTimetableData('fetch-staff-period-topic-details', params, 'common');

export const updateSubSyllabusStatus = async (payload) => {
  const response = await apiPutHelper(`${API_URL}/common/update-sub-syllabus-status`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  return response.data;
};
