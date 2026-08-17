import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaCalendarCheck, FaCalendarMinus, FaUserCircle, FaUsers, FaBookOpen } from 'react-icons/fa';
import { AuthContext } from '../../App';
import { hasAnyPermission, USER_PORTAL_PERMISSIONS } from '../../services/commonUtills/FormValidations';
import './BottomNav.css';

function BottomNav() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const user = stateAuth?.user || {};
  const typ = (user.typ || '').toUpperCase();

  const cds = user.cds || '';
  const canOpenHomework = hasAnyPermission(
    cds,
    USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS
  );

  const navItems = [];

  // Home is common for all logged in users
  navItems.push({ label: 'Home', path: '/dashboard', icon: <FaHome /> });

  if (typ === 'STUDENT') {
    if (canOpenHomework) {
      navItems.push({ label: 'Homework', path: '/homework', icon: <FaBookOpen /> });
    }
    if (hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.PROFILE)) {
      navItems.push({ label: 'Profile', path: '/profile', icon: <FaUserCircle /> });
    }
  } else if (typ === 'STAFF') {
    if (canOpenHomework) {
      navItems.push({ label: 'Homework', path: '/homework', icon: <FaBookOpen /> });
    }

    if (hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDENTS)) {
      navItems.push({ label: 'Students', path: '/students', icon: <FaUsers /> });
    }
    if (hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ATTENDANCE)) {
      navItems.push({ label: 'Attendance', path: '/attendance', icon: <FaCalendarCheck /> });
    }
    if (hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STAFF_LEAVE_MANAGE)) {
      navItems.push({ label: 'Leave', path: '/staff-leave', icon: <FaCalendarMinus /> });
    }
    if (hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.PROFILE)) {
      navItems.push({ label: 'Profile', path: '/staff-profile', icon: <FaUserCircle /> });
    }
  }

  if (navItems.length === 0) return null;

  return (
    <div className="bottom-nav">
      {navItems.map((item, index) => (
        <button
          key={index}
          className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="bottom-nav-icon">{item.icon}</div>
          <span className="bottom-nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export default BottomNav;
