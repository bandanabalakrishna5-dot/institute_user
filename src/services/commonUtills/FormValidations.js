export const emailValidation = (email) => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const escapeRegExpMatch = (s) => {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const isExactMatch = (str, match) => {
  return new RegExp(`\\b${escapeRegExpMatch(match)}\\b`).test(str);
};

/** Convert the B2C login `cds` value into normalized permission codes. */
export const getPermissionCodes = (cds) => {
  const values = Array.isArray(cds) ? cds : String(cds || '').split(',');
  return new Set(
    values
      .map((code) => String(code || '').trim().toUpperCase())
      .filter(Boolean)
  );
};

export const hasPermission = (cds, permission) =>
  getPermissionCodes(cds).has(String(permission || '').trim().toUpperCase());

export const hasAnyPermission = (cds, permissions = []) => {
  const codes = getPermissionCodes(cds);
  return permissions.some((permission) =>
    codes.has(String(permission || '').trim().toUpperCase())
  );
};

// B2C portal navigation permissions returned by the login API.
export const USER_PORTAL_PERMISSIONS = Object.freeze({
  PROFILE:          ['P_F', 'P_F_C', 'P_F_U', 'P_F_D'],
  HOMEWORK:         ['H_W_M', 'H_W_M_F'],
  HOMEWORK_ACCESS:  ['H_W_M', 'H_W_M_F', 'H_W_M_C', 'H_W_M_U', 'H_W_M_D'],
  HOMEWORK_CREATE:  ['H_W_M_C'],
  HOMEWORK_UPDATE:  ['H_W_M_U'],
  HOMEWORK_DELETE:  ['H_W_M_D'],
  HOMEWORK_MANAGE:  ['H_W_M_C', 'H_W_M_U', 'H_W_M_D'],
  STUDENT_JOINING_FORM_ACCESS: ['I_N_T_J_F', 'I_N_T_J_F_C'],
  TIMETABLE:        ['D_T_T'],
  ATTENDANCE:       ['A_T_D', 'A_T_D_V', 'A_T_D_M'],
  EXAMS:            ['E_X_M', 'E_X_M_V'],
  STUDENT_MARKS_ACCESS: ['S_T_S_M_K', 'S_T_S_M_K_C', 'S_T_S_M_K_U', 'E_X_M_D'],
  RESULTS:          ['R_S_T', 'R_S_T_V'],
  FEES:             ['F_E_E', 'F_E_E_V', 'F_E_E_P'],
  FEE_DETAILS:      ['S_F_S_R'],
  TRANSPORT:        ['T_R_P', 'T_R_P_V', 'T_S_P', 'T_S_P_S_V_I'],
  LEAVE:            [
    'L_V_M', 'L_V_M_V', 'L_V_M_A',
    'S_T_L_M', 'S_T_L_M_C', 'S_T_L_M_F', 'S_T_L_M_U', 'S_T_L_M_D',
  ],
  STAFF_LEAVE_MANAGE: ['S_L_V', 'S_L_V_C', 'S_L_V_U', 'S_L_V_D'],
  SALARY:           ['S_L_R', 'S_L_R_V'],
  STUDENTS:         ['S_T_D_L', 'S_T_D_V'],
  ANNOUNCEMENTS:    ['A_N_C', 'A_N_C_V', 'S_T_S_N', 'I_N_T_N'],
  STUDY_MATERIALS:  ['S_F_S_S'],
  SCHOOL_CALENDAR:  ['I_N_T_H_D', 'S_T_S_E_U'],
  NOTIFICATIONS:    ['N_T_F', 'N_T_F_V', 'S_T_S_N', 'I_N_T_N'],
  MESSAGES:         ['M_S_G', 'M_S_G_V'],
  STAFFLEAVE:       ['S_L_V', 'S_L_V_V'],
  
});
