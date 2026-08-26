import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBell, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { fetchUserNotifications } from '../../services/NotificationServices/notificationServices';
import Layout from '../common/Layout';

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.payload)) return response.payload;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.result)) return response.result;
  return [];
};

const getNotificationSource = (type) => ({
  STAFF: 'Staff',
  STUDENT: 'Student',
  INSTITUTE: 'Institute',
}[String(type || '').toUpperCase()] || 'Institute');
function NotificationsPage() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};
  const userType = String(user.typ || '').toUpperCase();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setError('');
    const baseParams = {
      instid: user.instid,
      brcid: user.brcid,
      acdmcyr: user.acdmcyr,
      usrid: user.usrid,
      typ: userType,
      ...(userType === 'STUDENT' && user.clsnm ? { clsnm: user.clsnm } : {}),
    };

    const responses = [await fetchUserNotifications(baseParams)];

    const successfulResponses = responses
      .map((response) => ({ response }))
      .filter(({ response }) => response?.status !== 'error' && !response?.errors?.length);
    const combined = successfulResponses.flatMap(({ response }) =>
      unwrapList(response).map((item) => ({
        ...item,
        notificationSource: getNotificationSource(item.typ),
      })),
    );
    const uniqueNotifications = Array.from(
      new Map(combined.map((item, index) => [`${item.ntfid ?? index}-${item.notificationSource}`, item])).values(),
    );

    if (!successfulResponses.length) {
      const response = responses[0];
      setError(response?.error?.message || response?.errors?.[0]?.errorMessage || 'Unable to load notifications.');
      setNotifications([]);
    } else {
      setNotifications(uniqueNotifications);
    }
    setLoading(false);
  }, [user.acdmcyr, user.brcid, user.clsnm, user.instid, user.usrid, userType]);

  useEffect(() => {
    loadNotifications();
    const notificationPoll = window.setInterval(loadNotifications, 5000);
    return () => window.clearInterval(notificationPoll);
  }, [loadNotifications]);

  return (
    <Layout>
      <section className="notifications-page">
        <header className="notifications-hero">
          <button type="button" className="notifications-back" aria-label="Back" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div>
            <span>NOTIFICATIONS</span>
            <h1>Updates for you</h1>
            <p>Institute and {userType === 'STAFF' ? 'staff' : 'student'} announcements.</p>
          </div>
        </header>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? (
          <div className="notifications-state"><Spinner animation="border" size="sm" /> Loading notifications...</div>
        ) : notifications.length ? (
          <div className="notifications-list">
            {notifications.map((item, index) => (
              <article className="notification-card" key={`${item.notificationSource || 'notification'}-${item.ntfid || index}`}>
                <div className="notification-card-icon"><FaBell /></div>
                <div className="notification-card-copy">
                  <div className="notification-card-heading">
                    <h2>{item.hdng || `${item.notificationSource || 'Institute'} notification`}</h2>
                    {item.dt && <time><FaCalendarAlt /> {item.dt}</time>}
                  </div>
                  <p>{item.desc || 'No additional details provided.'}</p>
                  <small>{[item.notificationSource && `${item.notificationSource} notification`, item.instnm, item.brcnm].filter(Boolean).join(' • ')}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="notifications-state notifications-empty">
            <FaBell />
            <h2>No notifications</h2>
            <p>New institute updates will appear here.</p>
          </div>
        )}
      </section>
    </Layout>
  );
}

export default NotificationsPage;
