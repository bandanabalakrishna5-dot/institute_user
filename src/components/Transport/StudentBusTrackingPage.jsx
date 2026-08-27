import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBell, FaBus, FaClock, FaCrosshairs, FaMapMarkerAlt, FaRoute } from 'react-icons/fa';
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
  const [mapSnapshot, setMapSnapshot] = useState(null);
  const locationWatchRef = useRef(null);
  const latestBusLocationRef = useRef(null);
  const latestStudentLocationRef = useRef(null);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setRouteError('Location access is not supported on this device.');
      return undefined;
    }

    setRouteLoading(true);
    locationWatchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        setStudentLocation({ lat: coords.latitude, lng: coords.longitude });
        setRouteError('');
        setRouteLoading(false);
      },
      (positionError) => {
        setRouteError(positionError.code === 1
          ? 'Allow location permission to show the blue route to your bus.'
          : 'Unable to find your current location. Please try again.');
        setRouteLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
    );

    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(locationWatchRef.current);
      }
    };
  }, []);

  useEffect(() => {
    latestBusLocationRef.current = location;
    latestStudentLocationRef.current = studentLocation;

    if (!mapSnapshot && location?.lat != null && location?.lng != null) {
      setMapSnapshot({
        bus: { lat: location.lat, lng: location.lng },
        student: studentLocation,
      });
    } else if (mapSnapshot && !mapSnapshot.student && studentLocation) {
      setMapSnapshot((current) => ({ ...current, student: studentLocation }));
    }
  }, [location, studentLocation, mapSnapshot]);

  useEffect(() => {
    const mapRefreshInterval = window.setInterval(() => {
      const bus = latestBusLocationRef.current;
      if (bus?.lat == null || bus?.lng == null) return;
      setMapSnapshot({
        bus: { lat: bus.lat, lng: bus.lng },
        student: latestStudentLocationRef.current,
      });
    }, 30000);
    return () => window.clearInterval(mapRefreshInterval);
  }, []);

  const coordinatesAvailable = location?.lat != null && location?.lng != null;
  const embeddedMapUrl = mapSnapshot?.bus
    ? mapSnapshot.student
      ? `https://maps.google.com/maps?saddr=${encodeURIComponent(mapSnapshot.student.lat)},${encodeURIComponent(mapSnapshot.student.lng)}&daddr=${encodeURIComponent(mapSnapshot.bus.lat)},${encodeURIComponent(mapSnapshot.bus.lng)}&dirflg=d&t=h&z=17&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(mapSnapshot.bus.lat)},${encodeURIComponent(mapSnapshot.bus.lng)}&t=h&z=17&output=embed`
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
        const refreshedStudentLocation = { lat: coords.latitude, lng: coords.longitude };
        setStudentLocation(refreshedStudentLocation);
        if (location?.lat != null && location?.lng != null) {
          setMapSnapshot({
            bus: { lat: location.lat, lng: location.lng },
            student: refreshedStudentLocation,
          });
        }
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
      <div className="bus-tracking-page bus-tracking-live-page">
        <header className="bus-tracking-live-header">
          <button type="button" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
          <h1>Live Bus Tracking</h1>
          <button type="button" onClick={() => navigate('/notifications')} aria-label="Notifications"><FaBell /></button>
        </header>

        {loading ? (
          <div className="bus-tracking-live-loading"><Spinner animation="border" /><span>Finding your bus…</span></div>
        ) : location ? (
          <div className="bus-tracking-map-stage">
            {embeddedMapUrl ? <iframe title="Live route from your location to the bus" src={embeddedMapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /> : <div className="bus-tracking-map-empty"><FaMapMarkerAlt /><span>Bus coordinates are unavailable</span></div>}

            <div className={`bus-tracking-live-pill ${connected ? 'connected' : ''}`}><span /> {connected ? 'LIVE' : 'OFFLINE'}</div>

            {coordinatesAvailable && <button type="button" className="bus-tracking-locate" onClick={showRouteToBus} disabled={routeLoading} aria-label="Refresh my location">{routeLoading ? <Spinner animation="border" size="sm" /> : <FaCrosshairs />}</button>}

            {error && <Alert variant="warning" className="bus-tracking-overlay-alert">{error}</Alert>}
            {routeError && <Alert variant="warning" className="bus-tracking-overlay-alert route-error">{routeError}</Alert>}

            <section className="bus-tracking-info-card">
              <div className="bus-tracking-vehicle-avatar">
                {location.vhlurl ? <img src={location.vhlurl} alt="Assigned bus" /> : <FaBus />}
              </div>
              <div className="bus-tracking-info-copy">
                <div><FaBus /><span>Bus No:</span><strong>{location.vhlno || 'Assigned vehicle'}</strong></div>
                {location.drvnm && <div><span className="bus-tracking-person">●</span><span>Driver:</span><strong>{location.drvnm}</strong></div>}
                <div><FaRoute /><span>Route:</span><strong>{location.frrt || 'Start'} → {location.tort || 'Destination'}</strong></div>
                <div className="bus-tracking-arrival"><FaClock /><strong>{connected ? 'Live location connected' : 'Waiting for live updates'}</strong></div>
              </div>
              {location.updt && <small className="bus-tracking-updated">Updated {new Date(location.updt).toLocaleString()}</small>}
            </section>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}

export default StudentBusTrackingPage;
