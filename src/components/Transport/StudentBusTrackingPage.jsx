import React, { useContext, useEffect, useRef, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBell, FaBus, FaClock, FaCrosshairs, FaMapMarkerAlt, FaSchool, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  createBusTrackingSocket,
  fetchStudentBusLocation,
} from '../../services/TransportServices/transportServices';
import './StudentBusTrackingPage.css';

function StudentBusTrackingPage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const studentId = user.stdid;
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
  const formatCoordinate = (value) => {
    const coordinate = Number(value);
    return Number.isFinite(coordinate) ? coordinate.toFixed(5) : '--';
  };
  const schoolLatitude = Number(user.latitude);
  const schoolLongitude = Number(user.longitude);
  const schoolLocation = String(user.latitude ?? '').trim() !== ''
    && String(user.longitude ?? '').trim() !== ''
    && Number.isFinite(schoolLatitude)
    && schoolLatitude >= -90
    && schoolLatitude <= 90
    && Number.isFinite(schoolLongitude)
    && schoolLongitude >= -180
    && schoolLongitude <= 180
    ? { lat: schoolLatitude, lng: schoolLongitude }
    : null;
  const arrivalText = location?.eta != null
    ? `Arriving in ${location.eta} minute${Number(location.eta) === 1 ? '' : 's'}`
    : connected ? 'Bus is on the way' : 'Waiting for live updates';
  const embeddedMapUrl = mapSnapshot?.bus
    ? mapSnapshot.student
      ? schoolLocation
        ? `https://maps.google.com/maps?saddr=${encodeURIComponent(mapSnapshot.student.lat)},${encodeURIComponent(mapSnapshot.student.lng)}&daddr=${encodeURIComponent(mapSnapshot.bus.lat)},${encodeURIComponent(mapSnapshot.bus.lng)}+to:${encodeURIComponent(schoolLocation.lat)},${encodeURIComponent(schoolLocation.lng)}&dirflg=d&t=m&z=15&output=embed`
        : `https://maps.google.com/maps?saddr=${encodeURIComponent(mapSnapshot.student.lat)},${encodeURIComponent(mapSnapshot.student.lng)}&daddr=${encodeURIComponent(mapSnapshot.bus.lat)},${encodeURIComponent(mapSnapshot.bus.lng)}&dirflg=d&t=m&z=15&output=embed`
      : `https://maps.google.com/maps?q=${encodeURIComponent(mapSnapshot.bus.lat)},${encodeURIComponent(mapSnapshot.bus.lng)}&t=m&z=15&output=embed`
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
    <div className="bus-tracking-standalone">
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
            {embeddedMapUrl ? <iframe title="Live route connecting the student, bus, and school" src={embeddedMapUrl} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /> : <div className="bus-tracking-map-empty"><FaMapMarkerAlt /><span>Bus coordinates are unavailable</span></div>}

            <div className={`bus-tracking-live-pill ${connected ? 'connected' : ''}`}><span /> {connected ? 'LIVE' : 'OFFLINE'}</div>

            <div className="bus-tracking-location-status" aria-label="Student, bus, and school locations">
              <div className={`bus-tracking-location-item ${studentLocation ? '' : 'is-waiting'}`}>
                <span className="bus-tracking-blue-marker"><FaUser /></span>
                <span><small>MY PRESENT LOCATION</small><strong>{studentLocation ? `${formatCoordinate(studentLocation.lat)}, ${formatCoordinate(studentLocation.lng)}` : 'Fetching current location…'}</strong></span>
              </div>
              <span aria-hidden="true" style={{ width: 3, height: 13, margin: '-7px 0 -7px 16px', borderRadius: 999, background: '#0867df' }} />
              <div className="bus-tracking-location-item">
                <span className="bus-tracking-blue-marker"><FaBus /></span>
                <span><small>BUS LOCATION</small><strong>{formatCoordinate(location.lat)}, {formatCoordinate(location.lng)}</strong></span>
              </div>
              <span aria-hidden="true" style={{ width: 3, height: 13, margin: '-7px 0 -7px 16px', borderRadius: 999, background: '#0867df' }} />
              <div className={`bus-tracking-location-item ${schoolLocation ? '' : 'is-unavailable'}`}>
                <span className="bus-tracking-blue-marker"><FaSchool /></span>
                <span><small>SCHOOL LOCATION</small><strong>{schoolLocation ? `${formatCoordinate(schoolLocation.lat)}, ${formatCoordinate(schoolLocation.lng)}` : 'Not available in login response'}</strong></span>
              </div>
            </div>

            {coordinatesAvailable && <button type="button" className="bus-tracking-locate" onClick={showRouteToBus} disabled={routeLoading} aria-label="Refresh my location">{routeLoading ? <Spinner animation="border" size="sm" /> : <FaCrosshairs />}</button>}

            {error && <Alert variant="warning" className="bus-tracking-overlay-alert">{error}</Alert>}
            {routeError && <Alert variant="warning" className="bus-tracking-overlay-alert route-error">{routeError}</Alert>}

            <section className="bus-tracking-info-card">
              <div className="bus-tracking-vehicle-avatar">
                {location.vhlurl ? <img src={location.vhlurl} alt="Assigned bus" /> : <FaBus />}
              </div>
              <div className="bus-tracking-info-copy">
                <div><FaBus /><strong>Bus No: <span>{location.vhlno || 'Assigned vehicle'}</span></strong></div>
                <div><FaUser /><strong>Driver: <span>{location.drvnm || 'Assigned driver'}</span></strong></div>
                <div className="bus-tracking-arrival"><FaClock /><strong>{arrivalText}</strong></div>
              </div>
              {location.updt && <small className="bus-tracking-updated">Updated {new Date(location.updt).toLocaleString()}</small>}
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default StudentBusTrackingPage;
