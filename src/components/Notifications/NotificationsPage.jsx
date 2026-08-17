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

function NotificationsPage() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};
  const userType = String(user.typ || '').toUpperCase();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError('');
    const response = await fetchUserNotifications({
      instid: user.instid,
      brcid: user.brcid,
      acdmcyr: user.acdmcyr,
      typ: userType,
      ...(userType === 'STUDENT' && user.clsnm ? { clsnm: user.clsnm } : {}),
    });
    if (response?.status === 'error' || response?.errors?.length) {
      setError(response?.error?.message || response?.errors?.[0]?.errorMessage || 'Unable to load notifications.');
      setNotifications([]);
    } else {
      setNotifications(unwrapList(response));
    }
    setLoading(false);
  }, [user.acdmcyr, user.brcid, user.clsnm, user.instid, userType]);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

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
              <article className="notification-card" key={item.ntfid || index}>
                <div className="notification-card-icon"><FaBell /></div>
                <div className="notification-card-copy">
                  <div className="notification-card-heading">
                    <h2>{item.hdng || 'Institute notification'}</h2>
                    {item.dt && <time><FaCalendarAlt /> {item.dt}</time>}
                  </div>
                  <p>{item.desc || 'No additional details provided.'}</p>
                  {(item.instnm || item.brcnm) && <small>{[item.instnm, item.brcnm].filter(Boolean).join(' • ')}</small>}
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
