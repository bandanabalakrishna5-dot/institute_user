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
import { getIndiaGreeting } from './dashboardGreeting';

function TransportDashboard({ user }) {
  const gpsWatchRef = useRef(null);
  const gpsIntervalRef = useRef(null);
  const latestPositionRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const gpsActiveRef = useRef(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  useEffect(() => () => {
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
  }, []);

  const sendPosition = async (position) => {
    const payload = {
      drvid: user.drvid,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const response = await saveDriverGpsLocation(payload);
    if (response?.status !== 'success') {
      throw new Error(response?.error?.message || 'Unable to update GPS location.');
    }
    setCurrentPosition({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
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
          text: `Live location sent every 3 seconds: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
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
    setGpsMessage({ variant: 'success', text: 'GPS connected. Location is sent every 3 seconds.' });
  };

  const handlePositionError = (error) => {
    requestInFlightRef.current = false;
    setGpsBusy(false);
    setGpsEnabled(false);
    gpsActiveRef.current = false;
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    gpsWatchRef.current = null;
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
    setGpsMessage({ variant: 'danger', text: error.message || 'Location permission denied.' });
  };

  const turnGpsOn = () => {
    if (!user.drvid) {
      setGpsMessage({ variant: 'danger', text: 'Driver ID is not assigned.' });
      return;
    }
    if (!navigator.geolocation) {
      setGpsMessage({ variant: 'danger', text: 'GPS is not supported on this device.' });
      return;
    }
    setGpsBusy(true);
    gpsActiveRef.current = true;
    setGpsEnabled(true);
    setGpsMessage(null);
    latestPositionRef.current = null;
    setCurrentPosition(null);
    gpsWatchRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handlePositionError,
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    gpsIntervalRef.current = setInterval(publishLatestPosition, 3000);
  };

  const turnGpsOff = () => {
    if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
    gpsWatchRef.current = null;
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
    latestPositionRef.current = null;
    requestInFlightRef.current = false;
    gpsActiveRef.current = false;
    setGpsEnabled(false);
    setGpsMessage({ variant: 'secondary', text: 'GPS tracking is off.' });
  };

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
