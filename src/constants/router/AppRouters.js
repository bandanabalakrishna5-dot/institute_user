import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Login from '../../components/Authentication/Login';
import StudentProfileSelector from '../../components/Authentication/StudentProfileSelector';
import DashBoard from '../../components/Dashboard/dashboard';
import Profile from '../../components/Profile/index';
import StaffProfile from '../../components/StaffProfile/index';
import HomeworkPage from '../../components/Homework/HomeworkPage';
import HomeworkCompletePage from '../../components/HomeworkComplete/HomeworkCompletePage';
import AttendanceRoute from '../../components/Attendance/AttendanceRoute';
import StaffSelfAttendancePage from '../../components/Attendance/StaffSelfAttendancePage';
import StaffLeavePage from '../../components/Leave/StaffLeavePage';
import StudentLeavePage from '../../components/Leave/StudentLeavePage';
import TimetablePage from '../../components/Timetable/TimetablePage';
import StudentMarksPage from '../../components/StudentMarks/StudentMarksPage';
import StudentFeeDetails from '../../components/FeeDetails/StudentFeeDetails';
import NotificationsPage from '../../components/Notifications/NotificationsPage';
import StudentBusTrackingPage from '../../components/Transport/StudentBusTrackingPage';
import { ClassesPlaceholder, StudentsPlaceholder } from '../../components/Placeholder/index';
import { USER_PORTAL_PERMISSIONS } from '../../services/commonUtills/FormValidations';

export const AppRouters = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/select-student" element={<StudentProfileSelector />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashBoard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.PROFILE}
              userTypes={['STUDENT']}
            >
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-profile"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.PROFILE}
              userTypes={['STAFF']}
            >
              <StaffProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/homework"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS}
              userTypes={['STUDENT', 'STAFF']}
            >
              <HomeworkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/classes"
          element={
            <ProtectedRoute userTypes={['STUDENT', 'STAFF']}>
              <ClassesPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute
              userTypes={['STUDENT', 'STAFF']}
            >
              <AttendanceRoute />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fee-details"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.FEE_DETAILS}
              userTypes={['STUDENT']}
            >
              <StudentFeeDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute userTypes={['STUDENT', 'STAFF']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable"
          element={<ProtectedRoute permissionCodes={USER_PORTAL_PERMISSIONS.TIMETABLE} userTypes={['STAFF']}><TimetablePage /></ProtectedRoute>}
        />
        <Route
          path="/exam-marks"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.STUDENT_MARKS_ACCESS}
              userTypes={['STAFF']}
            >
              <StudentMarksPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-leave"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.STAFF_LEAVE_MANAGE}
              userTypes={['STAFF']}
            >
              <StaffLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student-leave"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.LEAVE}
              userTypes={['STUDENT']}
            >
              <StudentLeavePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/verify-homework"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS}
              userTypes={['STAFF']}
            >
              <HomeworkCompletePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/staff-attendance"
          element={
            <ProtectedRoute
              permissionCodes={USER_PORTAL_PERMISSIONS.ATTENDANCE}
              userTypes={['STAFF']}
            >
              <StaffSelfAttendancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bus-tracking"
          element={
            <ProtectedRoute userTypes={['STUDENT']}>
              <StudentBusTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute userTypes={['STAFF']}>
              <StudentsPlaceholder />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
