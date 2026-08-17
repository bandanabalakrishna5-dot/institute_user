import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Spinner } from 'react-bootstrap';
import { FaBus } from 'react-icons/fa';
import { saveDriverGpsLocation } from '../../services/TransportServices/transportServices';

function TransportDashboard({ user }) {
  const gpsIntervalRef = useRef(null);
  const requestInFlightRef = useRef(false);
  const gpsActiveRef = useRef(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [gpsMessage, setGpsMessage] = useState(null);
  useEffect(() => () => {
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
  };

  const captureAndSendLocation = () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sendPosition(position);
          if (gpsActiveRef.current) {
            setGpsEnabled(true);
            setGpsMessage({ variant: 'success', text: 'GPS location updated.' });
          }
        } catch (error) {
          setGpsMessage({ variant: 'danger', text: error.message });
        } finally {
          requestInFlightRef.current = false;
          setGpsBusy(false);
        }
      },
      (error) => {
        requestInFlightRef.current = false;
        setGpsBusy(false);
        setGpsEnabled(false);
        gpsActiveRef.current = false;
        if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
        gpsIntervalRef.current = null;
        setGpsMessage({ variant: 'danger', text: error.message || 'Location permission denied.' });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
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
    captureAndSendLocation();
    gpsIntervalRef.current = setInterval(captureAndSendLocation, 5000);
  };

  const turnGpsOff = () => {
    if (gpsIntervalRef.current !== null) clearInterval(gpsIntervalRef.current);
    gpsIntervalRef.current = null;
    gpsActiveRef.current = false;
    setGpsEnabled(false);
    setGpsMessage({ variant: 'secondary', text: 'GPS tracking is off.' });
  };

  return (
    <div className="dashboard-content">
      <div className="welcome-banner">
        <h2>Good Morning, {user.drvnm || 'Driver'}!</h2>
        <p>Here is your transport assignment for today.</p>
      </div>

      <div className="feed-section">
        <h6 className="feed-title">Today's Transport</h6>
        <Card className="feed-card mb-4">
          <Card.Body>
            <div className="d-flex align-items-center gap-3">
              <span className="dashboard-explore-icon cyan"><FaBus /></span>
              <div>
                <strong>{user.velno || 'No vehicle assigned'}</strong>
                <div className="text-muted small">
                  {user.frrt || 'Route start'} → {user.tort || 'Route end'}
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        <Card className="feed-card mb-4">
          <Card.Body>
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              <div>
                <strong>GPS Tracking</strong>
                <div className="text-muted small">
                  {gpsEnabled ? 'Your live location is being shared.' : 'GPS tracking is currently off.'}
                </div>
              </div>
              <div className="d-flex gap-2">
                <Button variant="success" onClick={turnGpsOn} disabled={gpsEnabled || gpsBusy}>
                  {gpsBusy ? <Spinner size="sm" animation="border" /> : 'GPS On'}
                </Button>
                <Button variant="outline-danger" onClick={turnGpsOff} disabled={!gpsEnabled || gpsBusy}>
                  GPS Off
                </Button>
              </div>
            </div>
            {gpsMessage && <Alert className="mt-3 mb-0 py-2" variant={gpsMessage.variant}>{gpsMessage.text}</Alert>}
          </Card.Body>
        </Card>

      </div>
    </div>
  );
}

export default TransportDashboard;
