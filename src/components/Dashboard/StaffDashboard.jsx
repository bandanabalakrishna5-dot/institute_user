import React, { useEffect, useState } from 'react';
import { Alert, Card, Spinner } from 'react-bootstrap';
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
  FaChevronRight,
  FaChevronLeft,
  FaUserCheck,
  FaCalendarAlt,
  FaTasks,
  FaStickyNote,
  FaFileSignature,
} from 'react-icons/fa';
import {
  fetchStaffDailyTimetable,
  formatPeriodLabel,
  uniqueTimetablePeriods,
} from '../../services/TimetableServices/timetableServices';
import {
  hasAnyPermission,
  USER_PORTAL_PERMISSIONS,
} from '../../services/commonUtills/FormValidations';
import { fetchInstituteEvents } from '../../services/EventServices/eventServices';
import {
  fetchStudentJoiningFormKey,
  getStudentJoiningFormUrl,
} from '../../services/JoiningFormServices/joiningFormServices';
import { getIndiaGreeting } from './dashboardGreeting';

const eventDateValue = (value = '') => {
  const [day, month, year] = String(value).split('-').map(Number);
  return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
};

function EventGallery({ event }) {
  const galleryRef = React.useRef(null);
  const images = Array.isArray(event.urls) ? event.urls.filter((image) => image?.url) : [];
  const scrollGallery = (direction) => galleryRef.current?.scrollBy({
    left: direction * galleryRef.current.clientWidth,
    behavior: 'smooth',
  });

  return (
    <article className="staff-event-card">
      <div className="staff-event-gallery-wrap">
        <div className="staff-event-gallery" ref={galleryRef}>
          {images.length ? images.map((image, index) => <div className="staff-event-slide" key={image.evtuimgid || image.url || index}><img src={image.url} alt={`${event.nm || 'Event'} ${index + 1}`} /></div>) : <div className="staff-event-slide staff-event-image-empty"><FaCalendarAlt /></div>}
        </div>
        {images.length > 1 && <><button type="button" className="staff-event-gallery-arrow previous" aria-label="Previous event image" onClick={() => scrollGallery(-1)}><FaChevronLeft /></button><button type="button" className="staff-event-gallery-arrow next" aria-label="Next event image" onClick={() => scrollGallery(1)}><FaChevronRight /></button></>}
        {images.length > 1 && <span className="staff-event-image-count">{images.length} photos</span>}
      </div>
      <div className="staff-event-details"><strong>{event.nm || 'Institute event'}</strong><small><FaCalendarAlt /> {event.dt}</small>{event.desc && <p>{event.desc}</p>}</div>
    </article>
  );
}

function StaffDashboard({ user }) {
  const navigate = useNavigate();
  const cds = user.cds || '';
  const canOpenTimetable = hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.TIMETABLE);
  const [todayPeriods, setTodayPeriods] = useState([]);
  const [timetableLoading, setTimetableLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [joiningFormLoading, setJoiningFormLoading] = useState(false);
  const [joiningFormError, setJoiningFormError] = useState('');

  const openStudentJoiningForm = async () => {
    if (joiningFormLoading) return;
    setJoiningFormLoading(true);
    setJoiningFormError('');

    try {
      const response = await fetchStudentJoiningFormKey({
        instid: user.instid,
        brcid: user.brcid,
      });
      const key = response?.status === 'success' ? response.payload?.key : '';
      if (!key) {
        throw new Error(response?.error?.message || 'Unable to open the student joining form.');
      }
      window.location.assign(getStudentJoiningFormUrl(key));
    } catch (error) {
      setJoiningFormError(error.message || 'Unable to open the student joining form.');
      setJoiningFormLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!canOpenTimetable || !user.stfid || !user.instid || !user.brcid || !user.acdmcyr) { setTimetableLoading(false); return; }
      const response = await fetchStaffDailyTimetable({ stfid: user.stfid, instid: user.instid, brcid: user.brcid, acdmcyr: user.acdmcyr });
      if (active) {
        setTodayPeriods(response?.status === 'success' ? uniqueTimetablePeriods(response.payload || []) : []);
        setTimetableLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [user.stfid, user.instid, user.brcid, user.acdmcyr, canOpenTimetable]);

  useEffect(() => {
    let active = true;
    const loadEvents = async () => {
      if (!user.instid || !user.brcid || !user.acdmcyr) { setEventsLoading(false); return; }
      try {
        const response = await fetchInstituteEvents({
          instid: user.instid,
          brcid: user.brcid,
          acdmcyr: user.acdmcyr,
          typ: String(user.typ || 'STAFF').toUpperCase(),
          type: 'institute',
        });
        if (!active) return;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const events = response?.status === 'success' && Array.isArray(response.payload)
          ? response.payload
            .filter((event) => eventDateValue(event.dt) >= startOfToday.getTime())
            .sort((left, right) => eventDateValue(left.dt) - eventDateValue(right.dt))
            .slice(0, 3)
          : [];
        setUpcomingEvents(events);
      } catch (error) {
        if (active) setUpcomingEvents([]);
      } finally {
        if (active) setEventsLoading(false);
      }
    };
    loadEvents();
    return () => { active = false; };
  }, [user.instid, user.brcid, user.acdmcyr, user.typ]);
  const exploreItems = [
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDENT_JOINING_FORM_ACCESS) && {
      label: joiningFormLoading ? 'Opening Form...' : 'Student Joining Form',
      action: openStudentJoiningForm,
      icon: joiningFormLoading ? <Spinner animation="border" size="sm" /> : <FaFileSignature />,
      color: 'green',
    },
    canOpenTimetable && { label: 'Daily Timetable', path: '/timetable', icon: <FaCalendarDay />, color: 'blue' },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS) && {
      label: 'Homework',
      path: '/homework',
      icon: <FaBookOpen />,
      color: 'violet',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.STUDY_MATERIALS) && {
      label: 'Notes',
      path: '/notes',
      icon: <FaStickyNote />,
      color: 'violet',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.HOMEWORK_ACCESS) && {
      label: 'Verify Homework',
      path: '/verify-homework',
      icon: <FaTasks />,
      color: 'teal',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ATTENDANCE) && {
      label: 'Student Attendance',
      path: '/attendance',
      icon: <FaCalendarCheck />,
      color: 'green',
    },
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.ATTENDANCE) && {
      label: 'My Attendance',
      path: '/staff-attendance',
      icon: <FaUserCheck />,
      color: 'teal',
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
    hasAnyPermission(cds, USER_PORTAL_PERMISSIONS.SCHOOL_CALENDAR) && {
      label: 'Holidays',
      path: '/holidays',
      icon: <FaCalendarAlt />,
      color: 'orange',
    },
  ].filter(Boolean);

  return (
    <div className="dashboard-content staff-dashboard-content">
      <div className="welcome-banner staff-welcome-banner">
        <span className="staff-welcome-kicker">STAFF DASHBOARD</span>
        <h2>{getIndiaGreeting()}, {user.stfnm || 'Staff'}!</h2>
        <p>Here's your schedule for today.</p>
      </div>

      <div className="feed-section">
        {canOpenTimetable && <>
        <div className="staff-section-heading">
          <div>
            <span>DAILY SCHEDULE</span>
            <h6 className="feed-title">Today's Timetable</h6>
          </div>
          {todayPeriods.length > 0 && <small>{todayPeriods.length} {todayPeriods.length === 1 ? 'class' : 'classes'}</small>}
        </div>
        <Card className="feed-card staff-timetable-card mb-4">
          <Card.Body className={todayPeriods.length ? 'staff-timetable-preview' : 'text-center text-muted'}>
            {timetableLoading ? <div className="py-3"><Spinner animation="border" size="sm" /> Loading timetable...</div> : todayPeriods.length ? todayPeriods.slice(0, 4).map((period, index) => <button type="button" className="staff-timetable-row" key={period.clsprid || index} onClick={() => navigate('/timetable')}><span className="staff-period-badge"><FaClock /> {formatPeriodLabel(period, index)}</span><span className="staff-period-copy"><strong>{period.subnm || period.subcd || 'Subject'}</strong><small>{period.clsnm}{period.secnm ? ` · ${period.secnm}` : ''}</small></span><FaChevronRight className="staff-period-arrow" /></button>) : <div className="py-3">No classes assigned for today</div>}
          </Card.Body>
        </Card>
        </>}

        <div className="staff-section-heading staff-events-heading">
          <div><span>WHAT'S NEXT</span><h6 className="feed-title">Upcoming Events</h6></div>
          {upcomingEvents.length > 0 && <small>{upcomingEvents.length} upcoming</small>}
        </div>
        <Card className="feed-card staff-events-card mb-4">
          <Card.Body>
            {eventsLoading ? <div className="staff-events-empty"><Spinner animation="border" size="sm" /> Loading events...</div> : upcomingEvents.length ? (
              <div className="staff-events-list">
                {upcomingEvents.map((event) => <EventGallery event={event} key={event.evtupdid} />)}
              </div>
            ) : <div className="staff-events-empty"><FaCalendarAlt /> No upcoming events</div>}
          </Card.Body>
        </Card>

        <div className="dashboard-explore">
          <h6 className="feed-title">Explore</h6>
          {joiningFormError && <Alert variant="danger" className="mb-3 py-2">{joiningFormError}</Alert>}
          <div className="dashboard-explore-grid">
            {exploreItems.map((item) => (
              <button
                type="button"
                className="dashboard-explore-item"
                key={item.path || item.label}
                disabled={joiningFormLoading && item.action === openStudentJoiningForm}
                onClick={() => item.action ? item.action() : navigate(item.path)}
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
