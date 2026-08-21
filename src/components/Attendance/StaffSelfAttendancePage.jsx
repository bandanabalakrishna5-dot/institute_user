import React, { useContext, useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCheck, FaClock, FaTimes, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  fetchStaffAttendance,
  fetchStaffMonthlyAttendance,
  updateStaffMonthlyAttendance,
} from '../../services/AttendanceServices/attendanceServices';
import Layout from '../common/Layout';

const attendanceOptions = [
  { value: 'PRESENT', label: 'Present', time: 'Mark present for today' },
  { value: 'ABSENT', label: 'Absent', time: 'Not present' },
];

const statusFromPeriods = (periods = '') => ({
  '1-1-1-1-0-0-0-0': 'PRESENT',
  '0-0-0-0-1-1-1-1': 'PRESENT',
  '1-1-1-1-1-1-1-1': 'PRESENT',
  '0-0-0-0-0-0-0-0': 'ABSENT',
}[periods] || '');

const today = new Date();
const currentMonthName = today.toLocaleString('en-US', { month: 'long' });
const currentMonthKey = currentMonthName.toLowerCase();
const currentYear = today.getFullYear();
const currentDay = today.getDate();
const daysInCurrentMonth = new Date(currentYear, today.getMonth() + 1, 0).getDate();
const firstDayOffset = new Date(currentYear, today.getMonth(), 1).getDay();
const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function StaffSelfAttendancePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [record, setRecord] = useState(null);
  const [monthDays, setMonthDays] = useState([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadAttendance = async () => {
    if (!user.stfid) {
      setAlert({ variant: 'danger', message: 'Staff ID is not available.' });
      setLoading(false);
      return;
    }
    setLoading(true);
    const baseParams = {
      typ: 'STAFF', utype: 'STAFF', stfid: user.stfid,
      instid: user.instid, brcid: user.brcid, acdmcyr: user.acdmcyr,
    };
    const [response, monthlyResponse] = await Promise.all([
      fetchStaffAttendance(baseParams),
      fetchStaffMonthlyAttendance({
        ...baseParams,
        utyp: 'staff',
        usrid: user.usrid,
        mnth: currentMonthKey,
      }),
    ]);
    setLoading(false);
    if (response?.status !== 'success') {
      setAlert({ variant: 'danger', message: response?.error?.message || 'Unable to load staff attendance.' });
      return;
    }
    const item = Array.isArray(response.payload) ? response.payload[0] : null;
    const monthlyItem = Array.isArray(monthlyResponse?.payload)
      ? monthlyResponse.payload.find((entry) => String(entry.stfid) === String(user.stfid))
      : null;
    setRecord(item || null);
    setMonthDays(String(monthlyItem?.mnthatnd || '').split('#'));
    const monthlyDays = String(monthlyItem?.mnthatnd || '').split('#');
    setStatus(monthlyDays[currentDay - 1] === '1' ? 'PRESENT' : monthlyDays[currentDay - 1] === '0' ? 'ABSENT' : statusFromPeriods(item?.prds));
    if (!item) setAlert({ variant: 'warning', message: 'Staff attendance record was not found.' });
  };

  useEffect(() => {
    loadAttendance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.stfid, user.instid, user.brcid, user.acdmcyr]);

  const saveAttendance = async () => {
    if (!record || !status) {
      setAlert({ variant: 'danger', message: 'Please select your attendance.' });
      return;
    }
    setSaving(true);
    setAlert(null);
    const updatedMonthDays = Array.from(
      { length: daysInCurrentMonth },
      (_, index) => monthDays[index] || '0',
    );
    updatedMonthDays[currentDay - 1] = status === 'ABSENT' ? '0' : '1';

    const response = await updateStaffMonthlyAttendance({
      updby: user.stfid,
      periods: [{
        atndncid: record.atndncid,
        stfid: user.stfid,
        fkinstid: record.fkinstid || user.instid,
        fkbrcid: record.fkbrcid || user.brcid,
        utyp: 'staff',
        acdmcyr: record.acdmcyr || user.acdmcyr,
        mnthatnd: updatedMonthDays.join('#'),
        yr: String(record.strdt || '').slice(0, 10),
        mnth: currentMonthKey,
      }],
    });
    setSaving(false);
    if (response?.status === 'success' && response.payload?.results?.some((item) => item.status !== false)) {
      setAlert({ variant: 'success', message: response.payload?.message || 'Staff attendance updated successfully.' });
      loadAttendance();
    } else {
      const resultMessage = response?.payload?.results?.find((item) => item.status === false)?.message;
      setAlert({ variant: 'danger', message: resultMessage || response?.error?.message || 'Unable to update staff attendance.' });
    }
  };

  return (
    <Layout>
      <div className="staff-self-attendance-page">
        <div className="staff-self-attendance-shell">
          <header className="staff-self-attendance-header">
            <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div><span>MY ATTENDANCE</span><h1>Mark Today’s Attendance</h1><p>Select the time period you attended today.</p></div>
          </header>

          {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

          {loading ? (
            <div className="staff-self-attendance-state"><Spinner animation="border" /><span>Loading attendance...</span></div>
          ) : record ? (
            <section className="staff-self-attendance-card">
              <div className="staff-self-attendance-person"><span><FaUserCheck /></span><div><small>STAFF MEMBER</small><strong>{record.stfnm || user.stfnm || `Staff ${user.stfid}`}</strong><p><FaClock /> Today</p></div></div>
              <div className="staff-self-attendance-options">
                {attendanceOptions.map((option) => {
                  const selected = status === option.value;
                  const absent = option.value === 'ABSENT';
                  return <button type="button" key={option.value} className={`staff-attendance-option ${selected ? 'selected' : ''} ${absent ? 'absent' : 'present'}`} onClick={() => setStatus(option.value)} aria-pressed={selected}><span>{absent ? <FaTimes /> : <FaCheck />}</span><div><strong>{option.label}</strong><small>{option.time}</small></div></button>;
                })}
              </div>
              <div className="staff-attendance-month">
                <div className="staff-attendance-month-head"><div><small>CURRENT MONTH</small><h2>{currentMonthName} {currentYear}</h2></div><span>Today · {currentDay}</span></div>
                <div className="staff-attendance-weekdays">{weekDays.map((day) => <span key={day}>{day}</span>)}</div>
                <div className="staff-attendance-month-grid">
                  {Array.from({ length: firstDayOffset }, (_, index) => <span className="staff-attendance-day-spacer" key={`spacer-${index}`} />)}
                  {Array.from({ length: daysInCurrentMonth }, (_, index) => {
                    const day = index + 1;
                    const dayStatus = monthDays[index];
                    const dayLabel = dayStatus === '1' ? 'Present' : dayStatus === '0' ? 'Absent' : 'No record';
                    return <span key={day} className={`staff-attendance-day ${day === currentDay ? 'today' : ''} ${dayStatus === '1' ? 'present' : dayStatus === '0' ? 'absent' : ''}`} title={`${currentMonthName} ${day}: ${dayLabel}`}><b>{day}</b>{dayStatus === '1' ? <FaCheck aria-label="Present" /> : dayStatus === '0' ? <FaTimes aria-label="Absent" /> : null}</span>;
                  })}
                </div>
                <div className="staff-attendance-month-legend"><span><i className="present" /> Present</span><span><i className="absent" /> Absent</span><span><i className="today" /> Today</span></div>
              </div>
              <button type="button" className="staff-self-attendance-save" onClick={saveAttendance} disabled={saving || !status}>{saving ? <><Spinner animation="border" size="sm" /> Saving...</> : 'Save My Attendance'}</button>
            </section>
          ) : (
            <div className="staff-self-attendance-state"><FaUserCheck /><span>No attendance record is configured for this staff member.</span></div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default StaffSelfAttendancePage;
