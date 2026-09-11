import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import {
  FaBus,
  FaMapMarkerAlt,
  FaPowerOff,
  FaRoute,
  FaSatelliteDish,
  FaShieldAlt,
} from 'react-icons/fa';
import { saveDriverGpsLocation } from '../../services/TransportServices/transportServices';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { getSessionToken, loadAuthSession } from '../../services/Authentication/authSession';
import { getIndiaGreeting } from './dashboardGreeting';

const ACTIVE_TRACKING_KEY = 'institute-driver-gps-active';
const PENDING_LOCATION_KEY = 'institute-driver-gps-pending';
const LOCATION_SEND_INTERVAL_MS = 8000;
const BackgroundLocation = registerPlugin('BackgroundLocation');

function TransportDashboard({ user }) {
  const gpsWatchRef = useRef(null);
  const gpsIntervalRef = useRef(null);
  const latestPositionRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const gpsActiveRef = useRef(false);
  const wakeLockRef = useRef(null);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  useEffect(() => () => {
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    wakeLockRef.current?.release().catch(() => {});
  }, []);

  const requestWakeLock = async () => {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
    } catch (_) {
      // Wake Lock is best-effort; GPS recovery still runs when the app resumes.
    }
  };

  const sendPosition = async (position, gpsStatus = 1) => {
    const { latitude, longitude, accuracy } = position.coords;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error('The device returned an invalid GPS position.');
    }
    const payload = {
      drvid: user.drvid,
      latitude,
      longitude,
      gpssts: gpsStatus,
      accuracy: Number.isFinite(accuracy) ? accuracy : undefined,
      capturedAt: new Date(position.timestamp || Date.now()).toISOString(),
    };
    // Keep only the newest unsent point so a temporary connection failure can
    // recover without replaying an old route or growing device storage.
    localStorage.setItem(PENDING_LOCATION_KEY, JSON.stringify(payload));
    const response = await saveDriverGpsLocation(payload);
    if (response?.status !== 'success') {
      throw new Error(response?.error?.message || 'Unable to update GPS location.');
    }
    localStorage.removeItem(PENDING_LOCATION_KEY);
    setCurrentPosition({
      latitude,
      longitude,
      gpssts: gpsStatus,
    });
  };

  const publishLatestPosition = async () => {
    const position = latestPositionRef.current;
    if (!gpsActiveRef.current || !position || requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    try {
      await sendPosition(position);
      if (gpsActiveRef.current) {
        setGpsEnabled(true);
        setGpsMessage({
          variant: 'success',
          text: `Live location sent every 8 seconds: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
        });
      }
    } catch (error) {
      setGpsMessage({ variant: 'danger', text: error.message });
    } finally {
      requestInFlightRef.current = false;
      setGpsBusy(false);
    }
  };

  const handlePosition = (position) => {
    if (!gpsActiveRef.current) return;
    latestPositionRef.current = position;
    setCurrentPosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
    setGpsBusy(false);
    setGpsMessage({ variant: 'success', text: 'GPS connected. Location is sent every 8 seconds.' });
    // Do not wait for the first interval tick before publishing the location.
    publishLatestPosition();
  };

  const handlePositionError = (error) => {
    requestInFlightRef.current = false;
    setGpsBusy(false);
    if (error.code === 1) {
      setGpsEnabled(false);
      gpsActiveRef.current = false;
      if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
      gpsWatchRef.current = null;
      if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
      gpsIntervalRef.current = null;
      setGpsMessage({ variant: 'danger', text: 'Location permission denied. Allow precise location and start tracking again.' });
      return;
    }

    // Timeout and temporary position-unavailable errors are recoverable. Keep
    // the watcher and publishing interval alive so GPS resumes automatically.
    setGpsEnabled(true);
    setGpsMessage({
      variant: 'warning',
      text: error.code === 3
        ? 'Waiting for a fresh GPS signal. Tracking will retry automatically.'
        : 'GPS signal is temporarily unavailable. Tracking is still running.',
    });
  };

  const reacquirePosition = () => {
    if (!gpsActiveRef.current || !navigator.geolocation) return;
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      handlePosition,
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
    );
  };

  useEffect(() => {
    const resumeTracking = () => {
      if (!gpsActiveRef.current || document.visibilityState === 'hidden') return;
      requestWakeLock();
      reacquirePosition();
    };
    document.addEventListener('visibilitychange', resumeTracking);
    window.addEventListener('pageshow', resumeTracking);
    window.addEventListener('online', resumeTracking);
    return () => {
      document.removeEventListener('visibilitychange', resumeTracking);
      window.removeEventListener('pageshow', resumeTracking);
      window.removeEventListener('online', resumeTracking);
    };
  });

  const turnGpsOn = async () => {
    if (!user.drvid) {
      setGpsMessage({ variant: 'danger', text: 'Driver ID is not assigned.' });
      return;
    }
    if (!navigator.geolocation) {
      setGpsMessage({ variant: 'danger', text: 'GPS is not supported on this device.' });
      return;
    }
    setGpsBusy(true);
    localStorage.setItem(ACTIVE_TRACKING_KEY, String(user.drvid));
    gpsActiveRef.current = true;
    setGpsEnabled(true);
    setGpsMessage(null);
    latestPositionRef.current = null;
    setCurrentPosition(null);
    if (Capacitor.isNativePlatform()) {
      try {
        await BackgroundLocation.requestPermissions();
        await BackgroundLocation.start({
          driverId: Number(user.drvid),
          apiUrl: `${process.env.REACT_APP_SCHOOL_BACKEND_URL}/transport-information/gps-location`,
          token: getSessionToken(loadAuthSession()),
          intervalMs: LOCATION_SEND_INTERVAL_MS,
        });
        setGpsBusy(false);
        setGpsMessage({ variant: 'success', text: 'Background GPS active. Location is saved every 8 seconds, including while the screen is locked.' });
        return;
      } catch (error) {
        gpsActiveRef.current = false;
        setGpsEnabled(false);
        setGpsBusy(false);
        localStorage.removeItem(ACTIVE_TRACKING_KEY);
        setGpsMessage({ variant: 'danger', text: error?.message || 'Unable to start background GPS.' });
        return;
      }
    }
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    gpsIntervalRef.current = setInterval(publishLatestPosition, LOCATION_SEND_INTERVAL_MS);
    requestWakeLock();
  };

  const turnGpsOff = async () => {
    const lastPosition = latestPositionRef.current;
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    gpsWatchRef.current = null;
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
    latestPositionRef.current = null;
    requestInFlightRef.current = false;
    gpsActiveRef.current = false;
    localStorage.removeItem(ACTIVE_TRACKING_KEY);
    wakeLockRef.current?.release().catch(() => {});
    wakeLockRef.current = null;
    setGpsEnabled(false);
    setGpsMessage({ variant: 'secondary', text: 'GPS tracking is off.' });
    if (Capacitor.isNativePlatform()) {
      await BackgroundLocation.stop().catch(() => {});
      return;
    }
    if (lastPosition) sendPosition(lastPosition, 0).catch(() => {});
  };

  useEffect(() => {
    if (!user.drvid || localStorage.getItem(ACTIVE_TRACKING_KEY) !== String(user.drvid)) return;
    // A page reload or reopened installed PWA should continue a session that
    // the driver explicitly started and never stopped.
    turnGpsOn();
    // This intentionally runs only when the logged-in driver changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.drvid]);

  return (
    <div className="dashboard-content transport-dashboard">
      <section className="transport-hero">
        <div>
          <span className="transport-eyebrow">DRIVER DASHBOARD</span>
          <h2>{getIndiaGreeting()}, {user.drvnm || 'Driver'}!</h2>
          <p>Your route is ready. Drive safe and stay connected.</p>
        </div>
        <div className={`transport-hero-status ${gpsEnabled ? 'live' : ''}`}>
          <span />{gpsEnabled ? 'LIVE' : 'OFFLINE'}
        </div>
      </section>

      <div className="transport-dashboard-body">
        <Card className="transport-vehicle-card">
          <Card.Body>
            <div className="transport-card-heading">
              <div className="transport-card-icon"><FaBus /></div>
              <div><span>ASSIGNED VEHICLE</span><h3>{user.velno || 'No vehicle assigned'}</h3></div>
              {user.veltyp && <span className="transport-type-badge">{user.veltyp}</span>}
            </div>
            <div className="transport-route-line">
              <div className="transport-route-point start"><FaMapMarkerAlt /><span><small>START</small><strong>{user.frrt || 'Route start'}</strong></span></div>
              <div className="transport-route-track"><span /><FaRoute /><span /></div>
              <div className="transport-route-point end"><FaMapMarkerAlt /><span><small>DESTINATION</small><strong>{user.tort || 'Route end'}</strong></span></div>
            </div>
          </Card.Body>
        </Card>

        <Card className={`transport-gps-card ${gpsEnabled ? 'is-live' : ''}`}>
          <Card.Body>
            <div className="transport-gps-heading">
              <div className="transport-gps-title"><span><FaSatelliteDish /></span><div><h3>Live GPS Tracking</h3><p>{gpsEnabled ? 'Your location is securely shared with students.' : 'Start sharing your current bus location.'}</p></div></div>
              <div className={`transport-signal ${gpsEnabled ? 'live' : ''}`}><i /><span>{gpsEnabled ? 'Connected' : 'Disconnected'}</span></div>
            </div>

            {currentPosition && <div className="transport-current-position"><FaMapMarkerAlt /><span><small>CURRENT POSITION</small><strong>{currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}</strong></span></div>}

            <div className="transport-gps-actions">
              <Button className="transport-gps-on" onClick={turnGpsOn} disabled={gpsEnabled || gpsBusy}>
                {gpsBusy ? <Spinner size="sm" animation="border" /> : <FaSatelliteDish />}<span>{gpsBusy ? 'Connecting…' : 'Start Tracking'}</span>
              </Button>
              <Button className="transport-gps-off" onClick={turnGpsOff} disabled={!gpsEnabled || gpsBusy}>
                <FaPowerOff /><span>Stop</span>
              </Button>
            </div>

            <div className="transport-privacy-note"><FaShieldAlt /><span>Location is shared only while GPS tracking is active.</span></div>
            {gpsMessage && <Alert className="transport-gps-alert" variant={gpsMessage.variant}>{gpsMessage.text}</Alert>}
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}

export default TransportDashboard;
