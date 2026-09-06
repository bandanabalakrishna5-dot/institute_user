import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCalendarAlt, FaCheck, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { fetchStudentYearlyAttendance } from '../../services/AttendanceServices/attendanceServices';
import Layout from '../common/Layout';

const MONTHS = {
  Jan: { name: 'January', number: 0 },
  Feb: { name: 'February', number: 1 },
  Mar: { name: 'March', number: 2 },
  Apr: { name: 'April', number: 3 },
  May: { name: 'May', number: 4 },
  Jun: { name: 'June', number: 5 },
  Jul: { name: 'July', number: 6 },
  Aug: { name: 'August', number: 7 },
  Sep: { name: 'September', number: 8 },
  Oct: { name: 'October', number: 9 },
  Nov: { name: 'November', number: 10 },
  Dec: { name: 'December', number: 11 },
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getAttendanceState = (status) => {
  const periods = String(status ?? '').split('-').filter((value) => value === '0' || value === '1');

  if (periods.length <= 1) {
    return status === '1'
      ? { className: 'present', label: 'Present' }
      : { className: 'absent', label: 'Absent' };
  }

  if (periods.every((period) => period === '1')) {
    return { className: 'present', label: 'Present' };
  }
  if (periods.every((period) => period === '0')) {
    return { className: 'absent', label: 'Absent' };
  }

  const midpoint = Math.floor(periods.length / 2);
  const firstHalfPresent = periods.slice(0, midpoint).every((period) => period === '1');
  const secondHalfPresent = periods.slice(midpoint).every((period) => period === '1');

  if (firstHalfPresent && !secondHalfPresent) {
    return { className: 'first-half-present', label: 'First half present, second half absent' };
  }
  if (!firstHalfPresent && secondHalfPresent) {
    return { className: 'second-half-present', label: 'First half absent, second half present' };
  }

  return { className: 'partial', label: 'Partially present' };
};

const getMonthDetails = (monthRecord, academicYear) => {
  const key = Object.keys(MONTHS).find((month) => Object.prototype.hasOwnProperty.call(monthRecord, month));
  if (!key) return null;

  const [startYearValue, endYearValue] = String(academicYear || '').match(/\d{4}/g) || [];
  const startYear = Number(startYearValue) || new Date().getFullYear();
  const endYear = Number(endYearValue) || startYear + 1;
  const month = MONTHS[key];
  const year = month.number >= 5 ? startYear : endYear;
  const statuses = String(monthRecord[key] || '').split('#').filter((value) => value !== '');

  return {
    key,
    name: month.name,
    year,
    statuses,
    firstWeekday: new Date(year, month.number, 1).getDay(),
  };
};

function StudentAttendancePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const monthPickerRef = useRef(null);
  const [attendance, setAttendance] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetchStudentYearlyAttendance({
        typ: 'STUDENT',
        instid: user.instid,
        brcid: user.brcid,
        acdmcyr: user.acdmcyr,
        stdid: user.stdid,
        usrid: user.usrid,
      });

      if (response?.status !== 'success') {
        throw new Error(response?.error?.message || 'Failed to fetch attendance.');
      }

      setAttendance(response.payload);
    } catch (requestError) {
      setError(requestError?.message || 'Failed to fetch attendance.');
    } finally {
      setLoading(false);
    }
  }, [user.instid, user.brcid, user.acdmcyr, user.stdid, user.usrid]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const availableMonths = useMemo(() => {
    const records = Array.isArray(attendance) ? attendance[0]?.year : attendance?.year;
    const today = new Date();

    return (Array.isArray(records) ? records : [])
      .map((record) => getMonthDetails(record, user.acdmcyr))
      .filter(Boolean)
      .filter((month) => new Date(month.year, MONTHS[month.key].number, 1) <= today);
  }, [attendance, user.acdmcyr]);

  useEffect(() => {
    if (!availableMonths.length) {
      setSelectedMonth('');
      return;
    }

    const today = new Date();
    const current = availableMonths.find(
      (month) => month.year === today.getFullYear() && MONTHS[month.key].number === today.getMonth()
    );
    setSelectedMonth((current || availableMonths[availableMonths.length - 1]).key);
  }, [availableMonths]);

  const displayedMonth = availableMonths.find((month) => month.key === selectedMonth);

  return (
    <Layout>
      <div className="attendance-page">
        <div className="attendance-shell">
          <header className="attendance-header student-attendance-header">
            <button className="hw-icon-btn" type="button" onClick={() => navigate('/dashboard')} aria-label="Go back">
              <FaArrowLeft />
            </button>
            <div>
              <span className="hw-kicker">Academic year {user.acdmcyr || ''}</span>
              <h1>My Attendance</h1>
              <p>Yearly attendance</p>
            </div>
          </header>

          {error && <Alert variant="danger">{error}</Alert>}
          {loading && <div className="hw-loading"><Spinner animation="border" size="sm" /> Loading attendance...</div>}
          {!loading && !error && attendance && (
            <div className="student-attendance-calendars">
              <div className="attendance-calendar-toolbar">
                <details className="attendance-month-picker" ref={monthPickerRef}>
                  <summary aria-label="Select attendance month">
                    <span className="attendance-month-picker-icon"><FaCalendarAlt /></span>
                    <span><small>Viewing month</small><strong>{displayedMonth ? `${displayedMonth.name} ${displayedMonth.year}` : 'Select month'}</strong></span>
                    <FaChevronDown className="attendance-month-picker-chevron" />
                  </summary>
                  <div className="attendance-month-picker-menu">
                    {availableMonths.map((month) => (
                      <button
                        type="button"
                        className={selectedMonth === month.key ? 'active' : ''}
                        onClick={() => {
                          setSelectedMonth(month.key);
                          monthPickerRef.current?.removeAttribute('open');
                        }}
                        key={`${month.key}-${month.year}`}
                      >
                        <span>{month.name} {month.year}</span>
                        {selectedMonth === month.key && <FaCheck />}
                      </button>
                    ))}
                  </div>
                </details>
                <div className="attendance-calendar-legend" aria-label="Attendance legend">
                  <span><i className="present" /> Present</span>
                  <span><i className="absent" /> Absent</span>
                  <span><i className="half-day" /> Half day</span>
                </div>
              </div>

              {displayedMonth && (
                  <section className="attendance-calendar-card" key={`${displayedMonth.key}-${displayedMonth.year}`}>
                    <h2>{displayedMonth.name} {displayedMonth.year}</h2>
                    <div className="attendance-calendar-grid attendance-calendar-weekdays">
                      {WEEKDAYS.map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className="attendance-calendar-grid">
                      {Array.from({ length: displayedMonth.firstWeekday }, (_, index) => <span key={`empty-${index}`} />)}
                      {displayedMonth.statuses.map((status, index) => {
                        const date = new Date(displayedMonth.year, MONTHS[displayedMonth.key].number, index + 1);
                        const upcoming = date > new Date();
                        const attendanceState = getAttendanceState(status);
                        const state = upcoming ? 'upcoming' : attendanceState.className;
                        const stateLabel = upcoming ? 'Upcoming' : attendanceState.label;
                        return (
                          <span
                            className={`attendance-calendar-day ${state}`}
                            key={`${displayedMonth.key}-${index + 1}`}
                            title={`${displayedMonth.name} ${index + 1}: ${stateLabel}`}
                            aria-label={`${displayedMonth.name} ${index + 1}: ${stateLabel}`}
                          >
                            {index + 1}
                          </span>
                        );
                      })}
                    </div>
                  </section>
              )}
            </div>
          )}
          {!loading && !error && !attendance && <div className="hw-empty">No attendance records found.</div>}
        </div>
      </div>
    </Layout>
  );
}

export default StudentAttendancePage;
