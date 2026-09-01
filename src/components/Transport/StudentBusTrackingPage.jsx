import React, { useContext, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBell, FaBus, FaClock, FaCrosshairs, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  createBusTrackingSocket,
  fetchStudentBusLocation,
} from '../../services/TransportServices/transportServices';
import './StudentBusTrackingPage.css';

const liveMapIcon = (symbol, label) => L.divIcon({
  className: 'live-map-marker-wrap',
  html: `<span class="live-map-marker" role="img" aria-label="${label}">${symbol}</span>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -19],
});

const distanceInKm = (from, to) => {
  if (!from || !to) return null;
  const radians = (degrees) => (Number(degrees) * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.lat)) * Math.cos(radians(to.lat))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

function LiveTrackingMap({ busLocation, studentLocation, schoolLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routeRef = useRef(null);
  const routeRequestRef = useRef(null);
  const fittedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, { zoomControl: false }).setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);
    routeRef.current = L.polyline([], { color: '#0867df', weight: 5, opacity: .9 }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
      routeRef.current = null;
      routeRequestRef.current?.abort();
      routeRequestRef.current = null;
      fittedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const locations = [
      { key: 'student', value: studentLocation, symbol: '●', label: 'My present location' },
      { key: 'bus', value: busLocation, symbol: '🚌', label: 'Live bus location' },
      { key: 'school', value: schoolLocation, symbol: '🏫', label: 'School location' },
    ].filter(({ value }) => Number.isFinite(Number(value?.lat)) && Number.isFinite(Number(value?.lng)));

    locations.forEach(({ key, value, symbol, label }) => {
      const latLng = [Number(value.lat), Number(value.lng)];
      if (!markersRef.current[key]) {
        markersRef.current[key] = L.marker(latLng, {
          icon: liveMapIcon(symbol, label),
          zIndexOffset: key === 'bus' ? 1000 : 0,
        }).bindPopup(label).addTo(map);
      } else {
        markersRef.current[key].setLatLng(latLng);
      }
    });

    const markerPoints = locations.map(({ value }) => [Number(value.lat), Number(value.lng)]);
    if (markerPoints.length && !fittedRef.current) {
      const bounds = L.latLngBounds(markerPoints);
      markerPoints.length === 1
        ? map.setView(markerPoints[0], 16)
        : map.fitBounds(bounds, { padding: [45, 45], maxZoom: 16 });
      fittedRef.current = true;
    } else if (busLocation && !map.getBounds().pad(-.12).contains([Number(busLocation.lat), Number(busLocation.lng)])) {
      map.panTo([Number(busLocation.lat), Number(busLocation.lng)], { animate: true });
    }
  }, [busLocation, studentLocation, schoolLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const locations = [studentLocation, busLocation, schoolLocation]
      .filter((value) => Number.isFinite(Number(value?.lat)) && Number.isFinite(Number(value?.lng)));

    routeRequestRef.current?.abort();
    routeRef.current?.setLatLngs([]);
    if (locations.length < 2) return undefined;

    const controller = new AbortController();
    routeRequestRef.current = controller;
    const coordinates = locations
      .map(({ lat, lng }) => `${Number(lng)},${Number(lat)}`)
      .join(';');

    const loadRoadRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error(`Routing request failed (${response.status})`);
        const data = await response.json();
        const roadCoordinates = data?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(roadCoordinates) || roadCoordinates.length < 2) {
          throw new Error('No road route was found');
        }

        const roadPoints = roadCoordinates.map(([lng, lat]) => [lat, lng]);
        routeRef.current?.setLatLngs(roadPoints);
        if (!fittedRef.current) {
          map.fitBounds(L.latLngBounds(roadPoints), { padding: [45, 45], maxZoom: 16 });
          fittedRef.current = true;
        }
      } catch (routeError) {
        if (routeError.name !== 'AbortError') {
          // Keep markers visible instead of drawing a misleading straight line.
          routeRef.current?.setLatLngs([]);
        }
      }
    };

    loadRoadRoute();
    return () => controller.abort();
  }, [busLocation, studentLocation, schoolLocation]);

  return <div ref={containerRef} className="bus-tracking-leaflet-map" aria-label="Live student, bus, and school map" />;
}

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

    let requestInFlight = false;
    let initialRequest = true;
    const refreshBusLocation = async () => {
      if (!active || requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetchStudentBusLocation(studentId);
        if (!active) return;
        const latestLocation = response?.payload?.[0];
        if (response?.status !== 'success' || !latestLocation) {
          throw new Error('No bus assignment or saved location is available for this student.');
        }
        trackedTransportId = latestLocation.trspinfid;
        setLocation(latestLocation);
        setError('');
        subscribeToBus();
      } catch (requestError) {
        if (active) setError(requestError?.message || 'Unable to fetch the bus location.');
      } finally {
        requestInFlight = false;
        if (active && initialRequest) {
          initialRequest = false;
          setLoading(false);
        }
      }
    };

    socket.connect();
    refreshBusLocation();
    const busRefreshInterval = window.setInterval(refreshBusLocation, 5000);

    return () => {
      active = false;
      window.clearInterval(busRefreshInterval);
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
    }, 5000);
    return () => window.clearInterval(mapRefreshInterval);
  }, []);

  const coordinatesAvailable = location?.lat != null && location?.lng != null;
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
  const busDistance = distanceInKm(
    studentLocation,
    coordinatesAvailable ? { lat: Number(location.lat), lng: Number(location.lng) } : null,
  );
  const distanceText = busDistance == null
    ? 'Calculating…'
    : busDistance < 1 ? `${Math.round(busDistance * 1000)} m` : `${busDistance.toFixed(1)} km`;
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
            {mapSnapshot?.bus ? <LiveTrackingMap busLocation={mapSnapshot.bus} studentLocation={mapSnapshot.student} schoolLocation={schoolLocation} /> : <div className="bus-tracking-map-empty"><FaMapMarkerAlt /><span>Bus coordinates are unavailable</span></div>}

            <div className={`bus-tracking-live-pill ${connected ? 'connected' : ''}`}><span /> {connected ? 'LIVE' : 'OFFLINE'}</div>

            {coordinatesAvailable && <button type="button" className="bus-tracking-locate" onClick={showRouteToBus} disabled={routeLoading} aria-label="Refresh my location">{routeLoading ? <Spinner animation="border" size="sm" /> : <FaCrosshairs />}</button>}

            {error && <Alert variant="warning" className="bus-tracking-overlay-alert">{error}</Alert>}
            {routeError && <Alert variant="warning" className="bus-tracking-overlay-alert route-error">{routeError}</Alert>}

            <section className="bus-tracking-info-card">
              <div className="bus-tracking-info-copy">
                <div><FaBus /><strong>Van No: <span>{location.vhlno || 'Assigned vehicle'}</span></strong></div>
                <div><FaUser /><strong>Name: <span>{location.drvnm || 'Assigned driver'}</span></strong></div>
                <div><FaMapMarkerAlt /><strong>Distance: <span>{distanceText}</span></strong></div>
                <div className="bus-tracking-arrival"><FaClock /><strong>Time: <span>{arrivalText}</span></strong></div>
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
