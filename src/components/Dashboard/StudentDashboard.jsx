import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
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
  FaClock,
  FaStickyNote,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';
import {
  fetchStudentDailyTimetable,
  formatPeriodLabel,
  uniqueTimetablePeriods,
} from '../../services/TimetableServices/timetableServices';
import { getIndiaGreeting } from './dashboardGreeting';

function StudentDashboard({ user }) {
  const navigate = useNavigate();
  const cds = user.cds || '';
  const [todayClasses, setTodayClasses] = useState([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadTodayClasses = async () => {
      if (!user.instid || !user.brcid || !user.clsid || !user.secid || !user.acdmcyr) {
        setClassesLoading(false);
        return;
      }
      try {
        const response = await fetchStudentDailyTimetable({
          instid: user.instid,
          brcid: user.brcid,
          clsid: user.clsid,
          secid: user.secid,
          acdmcyr: user.acdmcyr,
        });
        if (active) setTodayClasses(response?.status === 'success' ? uniqueTimetablePeriods(response.payload || []) : []);
      } catch (error) {
        if (active) setTodayClasses([]);
      } finally {
        if (active) setClassesLoading(false);
      }
    };
    loadTodayClasses();
    return () => { active = false; };
  }, [user.acdmcyr, user.brcid, user.clsid, user.instid, user.secid]);
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
      label: 'Notes', path: '/notes', icon: <FaStickyNote />, color: 'indigo',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ANNOUNCEMENTS) && {
      label: 'Announcements', icon: <FaBullhorn />, color: 'yellow',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.LEAVE) && {
      label: 'Leave Request', path: '/student-leave', icon: <FaClipboardCheck />, color: 'teal',
    },
    { label: 'Bus Tracking', path: '/bus-tracking', icon: <FaBus />, color: 'cyan' },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.PROFILE) && {
      label: 'Profile', path: '/profile', icon: <FaUserCircle />, color: 'rose',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.SCHOOL_CALENDAR) && {
      label: 'Holidays',
      path: '/holidays',
      icon: <FaCalendarAlt />,
      color: 'orange',
    },
  ].filter(Boolean);

  return (
    <div className="dashboard-content student-dashboard-content">
      <div className="welcome-banner staff-welcome-banner student-welcome-banner">
        <span className="staff-welcome-kicker">STUDENT DASHBOARD</span>
        <h2>{getIndiaGreeting()}, {user.stdnm || 'Student'}!</h2>
        <p>Ready to learn today?</p>
      </div>

      <div className="feed-section">
        <div className="staff-section-heading student-section-heading">
          <div>
            <span>DAILY SCHEDULE</span>
            <h6 className="feed-title">Today's Classes</h6>
          </div>
          {todayClasses.length > 0 && <small>{todayClasses.length} {todayClasses.length === 1 ? 'class' : 'classes'}</small>}
        </div>
        <Card className="feed-card staff-timetable-card student-classes-card mb-4">
          <Card.Body className={todayClasses.length ? 'staff-timetable-preview' : 'text-center text-muted'}>
            {classesLoading ? <div className="student-classes-empty"><Spinner animation="border" size="sm" /><small>Loading today’s classes...</small></div> : todayClasses.length ? todayClasses.slice(0, 4).map((period, index) => <div className="staff-timetable-row" key={period.clsprid || index}><span className="staff-period-badge"><FaClock /> {formatPeriodLabel(period, index)}</span><span className="staff-period-copy"><strong>{period.subnm || period.subcd || 'Subject'}</strong><small>{period.clsnm}{period.secnm ? ` · ${period.secnm}` : ''}</small></span></div>) : <div className="student-classes-empty">
              <span><FaCalendarAlt /></span>
              <strong>No classes scheduled</strong>
              <small>Your timetable is clear for today.</small>
            </div>}
          </Card.Body>
        </Card>

        {exploreItems.length > 0 && (
          <div className="dashboard-explore">
            <h6 className="feed-title">Explore</h6>
            <div className="dashboard-explore-grid">
              {exploreItems.map((item) => item.path || item.action ? (
                <button type="button" className="dashboard-explore-item" key={item.path || item.label} onClick={() => item.action ? item.action() : navigate(item.path)}>
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
