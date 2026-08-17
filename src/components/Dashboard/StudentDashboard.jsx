import React from 'react';
import { Card } from 'react-bootstrap';
import {
  FaBookOpen,
  FaBus,
  FaBullhorn,
  FaCalendarAlt,
  FaCalendarCheck,
  FaChalkboardTeacher,
  FaClipboardCheck,
  FaFileInvoiceDollar,
  FaGraduationCap,
  FaUserCircle,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';

function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const cds = user.cds || '';
  const exploreItems = [
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.TIMETABLE) && {
      label: 'Today’s Timetable', icon: <FaChalkboardTeacher />, color: 'blue',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS) && {
      label: 'Homework', path: '/homework', icon: <FaBookOpen />, color: 'violet',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ATTENDANCE) && {
      label: 'Attendance', path: '/attendance', icon: <FaCalendarCheck />, color: 'green',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.FEE_DETAILS) && {
      label: 'Fee Details', path: '/fee-details', icon: <FaFileInvoiceDollar />, color: 'orange',
    },
    hasAnyPermission(cds, [
      ...USER_PORTAL_PERMISSIONS.EXAMS,
      ...USER_PORTAL_PERMISSIONS.RESULTS,
      ...USER_PORTAL_PERMISSIONS.STUDENT_MARKS_ACCESS,
    ]) && { label: 'Exam & Results', icon: <FaGraduationCap />, color: 'rose' },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDY_MATERIALS) && {
      label: 'Study Materials', icon: <FaBookOpen />, color: 'indigo',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ANNOUNCEMENTS) && {
      label: 'Announcements', icon: <FaBullhorn />, color: 'yellow',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.LEAVE) && {
      label: 'Leave Request', path: '/student-leave', icon: <FaClipboardCheck />, color: 'teal',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.TRANSPORT) && {
      label: 'Bus Tracking', icon: <FaBus />, color: 'cyan',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.SCHOOL_CALENDAR) && {
      label: 'School Calendar', icon: <FaCalendarAlt />, color: 'blue',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.PROFILE) && {
      label: 'Profile', path: '/profile', icon: <FaUserCircle />, color: 'rose',
    },
  ].filter(Boolean);

  return (
    <div className="dashboard-content">
      <div className="welcome-banner">
        <h2>Good Morning, {user.stdnm || 'Student'}!</h2>
        <p>Ready to learn today?</p>
      </div>

      <div className="feed-section">
        <h6 className="feed-title">Today's Classes</h6>
        <Card className="feed-card mb-4">
          <Card.Body className="text-center text-muted">
            <div className="py-3">No classes scheduled for today</div>
          </Card.Body>
        </Card>

        {exploreItems.length > 0 && (
          <div className="dashboard-explore">
            <h6 className="feed-title">Explore</h6>
            <div className="dashboard-explore-grid">
              {exploreItems.map((item) => item.path ? (
                <button type="button" className="dashboard-explore-item" key={item.path} onClick={() => navigate(item.path)}>
                  <span className={`dashboard-explore-icon ${item.color}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ) : (
                <div className="dashboard-explore-item dashboard-explore-placeholder" key={item.label} aria-label={`${item.label} coming soon`}>
                  <span className={`dashboard-explore-icon ${item.color}`}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;
