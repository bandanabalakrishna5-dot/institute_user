import { apiGetHelper } from '../commonUtills/helperAxios';

const API_URL = process.env.REACT_APP_SCHOOL_BACKEND_URL;

export const fetchStudentJoiningFormKey = async ({ instid, brcid }) => {
  const response = await apiGetHelper(`${API_URL}/joining-form/key`, {
    headers: { 'Content-Type': 'application/json' },
    params: {
      typ: 'STAFF',
      jtyp: 'student',
      fkinstid: instid,
      fkbrcid: brcid,
    },
  });

  return response.data;
};

export const getStudentJoiningFormUrl = (key) => {
  const configuredPortalUrl = process.env.REACT_APP_INSTITUTE_PORTAL_URL?.replace(/\/$/, '');
  const developmentPortalUrl = `${window.location.protocol}//${window.location.hostname}:3000`;
  const portalUrl = configuredPortalUrl || (window.location.port === '3001' ? developmentPortalUrl : window.location.origin);

  return `${portalUrl}/student/joining-form/create?data=${encodeURIComponent(key)}`;
};
