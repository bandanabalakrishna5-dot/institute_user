import React, { useContext, useEffect, useState } from 'react';
import { Alert, Card, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBus, FaMapMarkerAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  createBusTrackingSocket,
  fetchStudentBusLocation,
} from '../../services/TransportServices/transportServices';
import Layout from '../common/Layout';

function StudentBusTrackingPage() {
  const { stateAuth } = useContext(AuthContext);
  const studentId = stateAuth?.user?.stdid;
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [studentLocation, setStudentLocation] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState('');

  useEffect(() => {
    if (!studentId) {
      setError('Student ID is not available in the login session.');
      setLoading(false);
      return undefined;
    }

    let active = true;
    let trackedTransportId = null;
    const socket = createBusTrackingSocket();
    const subscribeToBus = () => socket.emit('student:track-bus', studentId);

    socket.on('connect', () => {
      if (!active) return;
      setConnected(true);
      setError('');
      subscribeToBus();
    });
    socket.on('disconnect', () => active && setConnected(false));
    socket.on('connect_error', () => {
      if (active) setError('Live bus connection is unavailable. Reconnecting…');
    });
    socket.on('bus:tracking-ready', ({ trspinfid }) => {
      trackedTransportId = trspinfid;
      if (active) setError('');
    });
    socket.on('bus:tracking-error', (message) => {
      if (active) setError(message || 'Unable to start live bus tracking.');
    });
    socket.on('bus:location', (liveLocation) => {
      if (!active) return;
      if (trackedTransportId && Number(liveLocation?.trspinfid) !== Number(trackedTransportId)) return;
      trackedTransportId = liveLocation?.trspinfid;
      setLocation((current) => ({ ...current, ...liveLocation }));
      setError('');
    });

    socket.connect();
    fetchStudentBusLocation(studentId)
      .then((response) => {
        if (!active) return;
        const latestLocation = response?.payload?.[0];
        if (response?.status !== 'success' || !latestLocation) {
          throw new Error('No bus assignment or saved location is available for this student.');
        }
        trackedTransportId = latestLocation.trspinfid;
        setLocation(latestLocation);
        setError('');
        subscribeToBus();
      })
      .catch((requestError) => {
        if (active) setError(requestError?.message || 'Unable to fetch the bus location.');
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
      socket.emit('student:stop-tracking');
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [studentId]);

  const coordinatesAvailable = location?.lat != null && location?.lng != null;
  const embeddedMapUrl = coordinatesAvailable
    ? studentLocation
      ? `https://maps.google.com/maps?saddr=${encodeURIComponent(studentLocation.lat)},${encodeURIComponent(studentLocation.lng)}&daddr=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}&dirflg=d&t=h&z=17&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(location.lat)},${encodeURIComponent(location.lng)}&t=h&z=17&output=embed`
    : '';

  const showRouteToBus = () => {
    if (!navigator.geolocation) {
      setRouteError('Location access is not supported on this device.');
      return;
    }

    setRouteLoading(true);
    setRouteError('');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setStudentLocation({ lat: coords.latitude, lng: coords.longitude });
        setRouteLoading(false);
      },
      (positionError) => {
        setRouteError(positionError.code === 1
          ? 'Allow location permission to show the route to your bus.'
          : 'Unable to find your current location. Please try again.');
        setRouteLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  return (
    <Layout>
      <div className="bus-tracking-page">
        <header className="bus-tracking-header">
          <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
          <div><span className="hw-kicker">Student Transport</span><h1>Bus Tracking</h1><p>{connected ? 'Live location connected.' : 'Connecting to live location…'}</p></div>
        </header>

        {error && <Alert variant="warning">{error}</Alert>}
        {loading ? (
          <div className="bus-tracking-loading"><Spinner animation="border" /><span>Finding your bus…</span></div>
        ) : location ? (
          <Card className="feed-card bus-location-card">
            <Card.Body>
              <div className="bus-location-title">
                <span className="dashboard-explore-icon cyan"><FaBus /></span>
                <div><strong>Your assigned bus</strong><div className="text-muted small">{location.frrt || 'Route start'} → {location.tort || 'Route end'}</div></div>
                <span className={`bus-live-status ${connected ? 'connected' : ''}`}>{connected ? 'LIVE' : 'OFFLINE'}</span>
              </div>
              <div className="bus-location-coordinates">
                <FaMapMarkerAlt />
                <div><span>Current location</span><strong>{coordinatesAvailable ? `${location.lat}, ${location.lng}` : 'Location unavailable'}</strong></div>
              </div>
              {embeddedMapUrl && <div className="bus-live-map"><iframe key={embeddedMapUrl} title="Live bus location" src={embeddedMapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>}
              {routeError && <p className="bus-route-error">{routeError}</p>}
              {location.updt && <p className="bus-location-updated">Last updated: {new Date(location.updt).toLocaleString()}</p>}
              {coordinatesAvailable && (
                <button type="button" className="hw-primary-btn bus-map-link" onClick={showRouteToBus} disabled={routeLoading}>
                  {routeLoading ? <Spinner animation="border" size="sm" /> : <FaMapMarkerAlt />}
                  {studentLocation ? 'Refresh Route to Bus' : 'Show Route to Bus'}
                </button>
              )}
            </Card.Body>
          </Card>
        ) : null}
      </div>
    </Layout>
  );
}

export default StudentBusTrackingPage;
