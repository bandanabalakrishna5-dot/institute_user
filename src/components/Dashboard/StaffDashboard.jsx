import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import {
  FaBookOpen,
  FaCalendarCheck,
  FaCalendarMinus,
  FaUserCircle,
  FaUsers,
  FaClock,
  FaCalendarDay,
  FaClipboardCheck,
} from 'react-icons/fa';
import { fetchStaffDailyTimetable } from '../../services/TimetableServices/timetableServices';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';

function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const cds = user.cds || '';
  const canOpenTimetable = hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.TIMETABLE);
  const [todayPeriods, setTodayPeriods] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!canOpenTimetable || !user.stfid || !user.instid || !user.brcid || !user.acdmcyr) { setTimetableLoading(false); return; }
      const response = await fetchStaffDailyTimetable({ stfid: user.stfid, instid: user.instid, brcid: user.brcid, acdmcyr: user.acdmcyr });
      if (active) { setTodayPeriods(response?.status === 'success' ? response.payload || [] : []); setTimetableLoading(false); }
    };
    load();
    return () => { active = false; };
  }, [user.stfid, user.instid, user.brcid, user.acdmcyr, canOpenTimetable]);
  const exploreItems = [
    canOpenTimetable && { label: 'Daily Timetable', path: '/timetable', icon: <FaCalendarDay />, color: 'blue' },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS) && {
      label: 'Homework',
      path: '/homework',
      icon: <FaBookOpen />,
      color: 'violet',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ATTENDANCE) && {
      label: 'Attendance',
      path: '/attendance',
      icon: <FaCalendarCheck />,
      color: 'green',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDENT_MARKS_ACCESS) && {
      label: 'Exam Marks',
      path: '/exam-marks',
      icon: <FaClipboardCheck />,
      color: 'blue',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDENTS) && {
      label: 'Students',
      path: '/students',
      icon: <FaUsers />,
      color: 'orange',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STAFF_LEAVE_MANAGE) && {
      label: 'Staff Leave',
      path: '/staff-leave',
      icon: <FaCalendarMinus />,
      color: 'orange',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.PROFILE) && {
      label: 'Profile',
      path: '/staff-profile',
      icon: <FaUserCircle />,
      color: 'rose',
    },
  ].filter(Boolean);

  return (
    <div className="dashboard-content">
      <div className="welcome-banner">
        <h2>Good Morning, {user.stfnm || 'Staff'}!</h2>
        <p>Here's your schedule for today.</p>
      </div>

      <div className="feed-section">
        {canOpenTimetable && <>
        <h6 className="feed-title">Today's Timetable</h6>
        <Card className="feed-card mb-4">
          <Card.Body className={todayPeriods.length ? 'staff-timetable-preview' : 'text-center text-muted'}>
            {timetableLoading ? <div className="py-3"><Spinner animation="border" size="sm" /> Loading timetable...</div> : todayPeriods.length ? todayPeriods.slice(0, 4).map((period, index) => <button type="button" className="staff-timetable-row" key={period.clsprid || index} onClick={() => navigate('/timetable')}><span><FaClock /> {period.prd || `Period ${index + 1}`}</span><strong>{period.subnm || period.subcd || 'Subject'}</strong><small>{period.clsnm}{period.secnm ? ` · ${period.secnm}` : ''}</small></button>) : <div className="py-3">No classes assigned for today</div>}
          </Card.Body>
        </Card>
        </>}

        <div className="dashboard-explore">
          <h6 className="feed-title">Explore</h6>
          <div className="dashboard-explore-grid">
            {exploreItems.map((item) => (
              <button
                type="button"
                className="dashboard-explore-item"
                key={item.path}
                onClick={() => navigate(item.path)}
              >
                <span className={`dashboard-explore-icon ${item.color}`}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StaffDashboard;
