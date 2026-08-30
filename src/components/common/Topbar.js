/**
 * @description : User Portal Topbar – notification bell, search, dark mode,
 *                profile drawer with role-based quick-action links.
 * @author : Institute User Portal
 * @date   : Aug-2026
 */

import React, { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaSignOutAlt,
  FaChevronDown,
  FaIdCard,
  FaCalendarAlt,
  FaTimes,
  FaBell,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaBookOpen,
  FaClipboardList,
  FaMoneyBillWave,
  FaBus,
  FaFileAlt,
  FaUsers,
  FaDollarSign,
  FaChevronRight,
  FaStickyNote,
} from 'react-icons/fa';
import { AuthContext } from '../../App';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';
import { fetchInstituteNotificationCount } from '../../services/NotificationServices/notificationServices';
import {
  disablePushNotifications,
  enablePushNotifications,
} from '../../services/NotificationServices/pushNotificationServices';

let notificationAudioContext;

const getNotificationAudioContext = () => {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  if (!notificationAudioContext) notificationAudioContext = new AudioContext();
  return notificationAudioContext;
};

const playNotificationSound = async () => {
  try {
    const context = getNotificationAudioContext();
    if (!context) return;
    if (context.state === 'suspended') await context.resume();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(660, context.currentTime);
    oscillator.frequency.setValueAtTime(880, context.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.32);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.34);
  } catch (error) {
    // Audio can be blocked until the user interacts with the page.
  }
};
const RoleLabels = {
  STUDENT: 'Student',
  STAFF: 'Staff',
  TRANSPORT: 'Transport',
};

// Quick-action menu items per role
const STUDENT_MENU = [
  { label: 'My Profile',    icon: <FaUserGraduate />,    path: '/profile',       color: '#eff6ff', iconColor: '#2f54eb', perm: USER_PORTAL_PERMISSIONS.PROFILE },
  { label: 'Timetable',     icon: <FaCalendarAlt />,     path: '/timetable',     color: '#fdf4ff', iconColor: '#9333ea', perm: USER_PORTAL_PERMISSIONS.TIMETABLE },
  { label: 'Homework',      icon: <FaBookOpen />,        path: '/homework',      color: '#f0fdf4', iconColor: '#16a34a', perm: USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS },
  { label: 'Notes',         icon: <FaStickyNote />,      path: '/notes',         color: '#f5f3ff', iconColor: '#7c3aed', perm: USER_PORTAL_PERMISSIONS.STUDY_MATERIALS },
  { label: 'Fees',          icon: <FaMoneyBillWave />,   path: '/fees',          color: '#fef9c3', iconColor: '#ca8a04', perm: USER_PORTAL_PERMISSIONS.FEES },
  { label: 'Transport',     icon: <FaBus />,             path: '/transport',     color: '#ecfdf5', iconColor: '#059669', perm: USER_PORTAL_PERMISSIONS.TRANSPORT },
  { label: 'Results',       icon: <FaFileAlt />,         path: '/results',       color: '#e0f2fe', iconColor: '#0369a1', perm: USER_PORTAL_PERMISSIONS.RESULTS },
  { label: 'Notifications', icon: <FaBell />,            path: '/notifications', color: '#fdf4ff', iconColor: '#7c3aed', perm: USER_PORTAL_PERMISSIONS.NOTIFICATIONS },
];

const STAFF_MENU = [
  { label: 'My Profile',    icon: <FaChalkboardTeacher />, path: '/staff-profile',  color: '#eff6ff', iconColor: '#2f54eb', perm: USER_PORTAL_PERMISSIONS.PROFILE },
  { label: 'Timetable',     icon: <FaCalendarAlt />,       path: '/timetable',      color: '#fdf4ff', iconColor: '#9333ea', perm: USER_PORTAL_PERMISSIONS.TIMETABLE },
  { label: 'Students',      icon: <FaUsers />,             path: '/students',       color: '#f0fdf4', iconColor: '#16a34a', perm: USER_PORTAL_PERMISSIONS.STUDENTS },
  { label: 'Attendance',    icon: <FaClipboardList />,     path: '/attendance',     color: '#fff7ed', iconColor: '#ea580c', perm: USER_PORTAL_PERMISSIONS.ATTENDANCE },
  { label: 'Homework',      icon: <FaBookOpen />,          path: '/homework',       color: '#ecfdf5', iconColor: '#059669', perm: USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS },
  { label: 'Notes',         icon: <FaStickyNote />,        path: '/notes',          color: '#f5f3ff', iconColor: '#7c3aed', perm: USER_PORTAL_PERMISSIONS.STUDY_MATERIALS },
  { label: 'Exam Marks',    icon: <FaClipboardList />,      path: '/exam-marks',     color: '#eff6ff', iconColor: '#2563eb', perm: USER_PORTAL_PERMISSIONS.STUDENT_MARKS_ACCESS },
  { label: 'Salary',        icon: <FaDollarSign />,        path: '/salary',         color: '#fef9c3', iconColor: '#ca8a04', perm: USER_PORTAL_PERMISSIONS.SALARY },
  { label: 'Leave',         icon: <FaFileAlt />,           path: '/leave',          color: '#e0f2fe', iconColor: '#0369a1', perm: USER_PORTAL_PERMISSIONS.LEAVE },
  { label: 'Notifications', icon: <FaBell />,              path: '/notifications',  color: '#fdf4ff', iconColor: '#7c3aed', perm: USER_PORTAL_PERMISSIONS.NOTIFICATIONS },
];

const TRANSPORT_MENU = [
  { label: 'Transport Home', icon: <FaBus />, path: '/dashboard', color: '#ecfdf5', iconColor: '#059669' },
];

function Topbar() {
  const { stateAuth, dispatchAuth } = useContext(AuthContext);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [avatarImageFailed, setAvatarImageFailed] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const latestNotificationIdRef = useRef(null);
  const pushRegistrationAttemptedRef = useRef(false);
  const drawerRef = useRef(null);
  const navigate  = useNavigate();

  const user        = stateAuth?.user || {};
  const displayName = user.stdnm || user.stfnm || user.drvnm || 'User';
  const roleId      = user.stdrolid || user.stfrolid || user.drvid || '';
  const academicYear= user.acdmcyr || '';
  const typ         = String(user.typ || '').toUpperCase();
  const roleLabel   = RoleLabels[typ] || user.typ || '';
  const cds         = user.cds || '';
  const instituteName = user.instnm || 'Institute';
  const branchName = user.brcnm || user.brnchnm || user.branchName || user.bracnm || 'Branch';
  const profileImageUrl = ['STAFF', 'STUDENT'].includes(typ)
    ? String(user.pturl || '').trim()
    : '';
  const notificationSeenKey = `portal-notifications-seen:${typ}:${user.usrid || 'unknown'}`;

  useEffect(() => {
    setAvatarImageFailed(false);
  }, [profileImageUrl]);

  useEffect(() => {
    const unlockNotificationAudio = () => {
      const context = getNotificationAudioContext();
      if (context?.state === 'suspended') context.resume().catch(() => {});
    };
    window.addEventListener('pointerdown', unlockNotificationAudio, { once: true });
    window.addEventListener('keydown', unlockNotificationAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockNotificationAudio);
      window.removeEventListener('keydown', unlockNotificationAudio);
    };
  }, []);

  useEffect(() => {
    if (pushRegistrationAttemptedRef.current
      || !user.usrid
      || !['STAFF', 'STUDENT'].includes(typ)
      || !('Notification' in window)
      || Notification.permission !== 'granted') return;
    pushRegistrationAttemptedRef.current = true;
    enablePushNotifications({
      usrid: user.usrid,
      typ: user.typ,
      instid: user.instid,
      brcid: user.brcid,
      clsnm: user.clsnm,
    }).catch((error) => {
      console.error('Unable to restore push notifications:', error);
    });
  }, [typ, user.brcid, user.clsnm, user.instid, user.typ, user.usrid]);

  useEffect(() => {
    let active = true;
    const loadNotificationCount = async () => {
      if (!user.usrid || !['STAFF', 'STUDENT'].includes(typ)) return;
      try {
        const response = await fetchInstituteNotificationCount({
          instid: user.instid,
          brcid: user.brcid,
          acdmcyr: user.acdmcyr,
          usrid: user.usrid,
          typ,
          ...(typ === 'STUDENT' && user.clsnm ? { clsnm: user.clsnm } : {}),
        });
        const count = typ === 'STAFF'
          ? response?.payload?.staffCount
          : response?.payload?.classCount;
        const latestNotificationId = Number(response?.payload?.latestNotificationId) || 0;
        if (active) {
          const lastSeenNotificationId = Number(localStorage.getItem(notificationSeenKey)) || 0;
          if (latestNotificationIdRef.current !== null && latestNotificationId > latestNotificationIdRef.current) {
            playNotificationSound();
          }
          latestNotificationIdRef.current = latestNotificationId;
          setNotificationCount(latestNotificationId > lastSeenNotificationId ? Number(count) || 0 : 0);
        }
      } catch (error) {
        if (active) setNotificationCount(0);
      }
    };
    loadNotificationCount();
    const notificationPoll = window.setInterval(loadNotificationCount, 5000);
    return () => {
      active = false;
      window.clearInterval(notificationPoll);
    };
  }, [notificationSeenKey, typ, user.acdmcyr, user.brcid, user.clsnm, user.instid, user.usrid]);

  const openNotifications = async () => {
    if (['STAFF', 'STUDENT'].includes(typ)) {
      enablePushNotifications(user).catch((error) => {
        console.error('Unable to enable push notifications:', error);
      });
    }
    if (latestNotificationIdRef.current) {
      localStorage.setItem(notificationSeenKey, String(latestNotificationIdRef.current));
    }
    setNotificationCount(0);
    setShowProfileDrawer(false);
    navigate('/notifications');
  };

  const getInitials = () => {
    if (!displayName || displayName === 'User') return 'US';
    return displayName
      .split(' ').filter(Boolean)
      .map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  };



  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target)) {
        setShowProfileDrawer(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const logout = async () => {
    setShowProfileDrawer(false);
    try {
      await disablePushNotifications();
    } catch (error) {
      console.error('Unable to disable push notifications:', error);
    }
    dispatchAuth({ type: 'LOGOUT' });
    navigate('/');
  };

  const goTo = (path) => {
    setShowProfileDrawer(false);
    navigate(path);
  };

  if (!stateAuth?.user) return null;

  // Build menu based on role + permissions
  const roleMenu = typ === 'STAFF'
    ? STAFF_MENU
    : typ === 'TRANSPORT'
      ? TRANSPORT_MENU
      : STUDENT_MENU;
  const menuItems = roleMenu.filter(
    (item) => !item.perm || hasAnyPermission(cds, item.perm)
  );

  return (
    <div className="user-topbar" style={{ justifyContent: 'space-between' }}>
      {/* Left: Logo / Home */}
      <button
        onClick={() => navigate('/dashboard')}
        className="user-topbar-identity"
        title={`${instituteName} - ${branchName}`}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
          borderRadius: 10,
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #2f54eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 15, fontWeight: 900,
        }}>
          I
        </div>
        <span className="user-topbar-school-copy">
          <strong>{instituteName}</strong>
          <small>{branchName}</small>
        </span>
      </button>

      {/* Right: actions + profile */}
      <div className="topbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Notification bell */}
        <button
          className="topbar-icon-btn notification-bell-btn"
          aria-label="Notifications"
          onClick={openNotifications}
        >
          <FaBell size={15} />
          {notificationCount > 0 && <span className="topbar-notification-count">{notificationCount > 99 ? '99+' : notificationCount}</span>}
        </button>

        {/* Profile avatar */}
        <div className="user-profile-container" ref={drawerRef}>
          <div
            className="user-profile-trigger"
            onClick={() => setShowProfileDrawer(!showProfileDrawer)}
          >
            <div className={`user-profile-avatar ${typ === 'STAFF' ? 'staff' : typ === 'TRANSPORT' ? 'transport' : 'student'}`}
              style={{
                background: typ === 'STAFF'
                  ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                  : typ === 'TRANSPORT'
                    ? 'linear-gradient(135deg,#059669,#34d399)'
                  : 'linear-gradient(135deg,#2f54eb,#60a5fa)',
              }}
            >
              {profileImageUrl && !avatarImageFailed ? (
                <img
                  src={profileImageUrl}
                  alt=""
                  className="user-profile-avatar-image"
                  onError={() => setAvatarImageFailed(true)}
                />
              ) : getInitials()}
            </div>
            <FaChevronDown className="user-profile-chevron" />
          </div>

          {showProfileDrawer && (
            <>
              <div
                className="user-profile-drawer-overlay"
                onClick={() => setShowProfileDrawer(false)}
              />
              <aside className="user-profile-drawer">
                {/* Drawer header */}
                <div className="user-profile-drawer-header">
                  <div className="user-profile-drawer-title">
                    <div className="user-profile-drawer-avatar"
                      style={{
                        background: typ === 'STAFF'
                          ? 'linear-gradient(135deg,#7c3aed,#a78bfa)'
                          : typ === 'TRANSPORT'
                            ? 'linear-gradient(135deg,#059669,#34d399)'
                          : 'linear-gradient(135deg,#2f54eb,#60a5fa)',
                      }}
                    >
                      {profileImageUrl && !avatarImageFailed ? (
                        <img
                          src={profileImageUrl}
                          alt=""
                          className="user-profile-drawer-avatar-image"
                          onError={() => setAvatarImageFailed(true)}
                        />
                      ) : getInitials()}
                    </div>
                    <div>
                      <h5>{displayName}</h5>
                      <span>{user.emlid || ''}</span>
                      {roleLabel && (
                        <span className={`role-badge ${typ === 'STAFF' ? 'staff' : typ === 'TRANSPORT' ? 'transport' : 'student'}`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: 6 }}
                        >
                          {typ === 'STAFF' ? <FaChalkboardTeacher size={12} /> : typ === 'TRANSPORT' ? <FaBus size={12} /> : <FaUserGraduate size={12} />}
                          {roleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="user-drawer-close"
                    aria-label="Close menu"
                    onClick={() => setShowProfileDrawer(false)}
                  >
                    <FaTimes />
                  </button>
                </div>

                {/* Summary */}
                <div className="user-profile-drawer-body">
                  <div className="user-profile-drawer-summary">
                    <div className="user-profile-row">
                      <span><FaIdCard /> Role ID</span>
                      <strong>{roleId || '—'}</strong>
                    </div>
                    <div className="user-profile-row">
                      <span><FaCalendarAlt /> Academic Year</span>
                      <strong>{academicYear || '—'}</strong>
                    </div>
                  </div>

                  {/* Quick Module Links */}
                  <div style={{ marginTop: 20 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: '#94a3b8',
                      textTransform: 'uppercase', letterSpacing: '0.07em',
                      marginBottom: 10,
                    }}>
                      Quick Access
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {menuItems.map((item) => (
                        <button
                          key={item.path}
                          onClick={() => goTo(item.path)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 10,
                            border: 'none', background: 'transparent',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 9,
                            background: item.color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: item.iconColor, fontSize: 14, flexShrink: 0,
                          }}>
                            {item.icon}
                          </div>
                          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                            {item.label}
                          </span>
                          <FaChevronRight style={{ color: '#94a3b8', fontSize: 10 }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <button className="user-logout-btn user-drawer-logout" onClick={logout}
                    style={{ marginTop: 20, width: '100%', justifyContent: 'center' }}
                  >
                    <FaSignOutAlt className="user-logout-icon" />
                    <span>Logout</span>
                  </button>
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;
