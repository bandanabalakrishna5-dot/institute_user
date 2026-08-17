import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';
import AttendancePage from './AttendancePage';
import StudentAttendancePage from './StudentAttendancePage';

function AttendanceRoute() {
  const { stateAuth } = useContext(AuthContext);
  const type = String(stateAuth?.user?.typ || '').toUpperCase();

  if (!hasAnyPermission(stateAuth?.user?.cds, USER_PORTAL_PERMISSIONS.ATTENDANCE)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (type === 'STUDENT') return <StudentAttendancePage />;

  return <AttendancePage />;
}

export default AttendanceRoute;
