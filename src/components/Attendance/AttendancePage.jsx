import React, { useContext, useEffect, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCalendarCheck, FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import Layout from '../common/Layout';
import SectionSelect from '../common/SectionSelect';
import CustomSelect from '../common/CustomSelect';
import {
  fetchStudentAttendance,
  updateStudentAttendance,
} from '../../services/AttendanceServices/attendanceServices';
import {
  fetchBranchClasses,
  fetchClassSections,
} from '../../services/HomeworkServices/homeworkServices';

const attendanceOptions = [
  { value: 'FIRSTHALF', label: 'First half' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'FULLDAY', label: 'Full day' },
];

const statusFromPeriods = (periods = '') => {
  if (periods === '1-1-1-1-0-0-0-0') return 'FIRSTHALF';
  if (periods === '0-0-0-0-0-0-0-0') return 'ABSENT';
  if (periods === '1-1-1-1-1-1-1-1') return 'FULLDAY';
  return '';
};

function AttendancePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadAttendance = async () => {
    if (!classId || !sectionId) {
      setAlert({ variant: 'danger', message: 'Please select class and section.' });
      return;
    }
    setLoading(true);
    setAlert(null);
    const response = await fetchStudentAttendance({
      typ: 'STUDENT',
      instid: user.instid,
      brcid: user.brcid,
      acdmcyr: user.acdmcyr,
      cls: classId,
      sec: sectionId,
      utype: 'STUDENT',
    });
    setLoading(false);
    setHasSearched(true);

    if (response?.status !== 'success') {
      setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to fetch attendance.' });
      return;
    }

    const rows = Array.isArray(response.payload) ? response.payload : [];
    setStudents(rows);
    setStatuses(Object.fromEntries(rows.map((row) => [row.stdid, statusFromPeriods(row.prds)])));
  };

  useEffect(() => {
    if (!user.brcid || !user.acdmcyr) return;
    fetchBranchClasses({ brcid: user.brcid, acdmcyr: user.acdmcyr }).then((response) => {
      if (response?.status === 'success') setClasses(response.payload || []);
    });
  }, [user.brcid, user.acdmcyr]);

  const handleClassChange = async (event) => {
    const value = event.target.value;
    setClassId(value);
    setSectionId('');
    setSections([]);
    setStudents([]);
    setStatuses({});
    setHasSearched(false);
    setAlert(null);
    if (!value) return;
    const response = await fetchClassSections({ clsid: value });
    if (response?.status === 'success') setSections(response.payload || []);
  };

  const handleSectionChange = (event) => {
    setSectionId(event.target.value);
    setStudents([]);
    setStatuses({});
    setHasSearched(false);
    setAlert(null);
  };

  const saveAttendance = async () => {
    if (!students.length) return;
    if (students.some((student) => !statuses[student.stdid])) {
      setAlert({ variant: 'danger', message: 'Please select attendance for every student.' });
      return;
    }
    setSaving(true);
    setAlert(null);

    const response = await updateStudentAttendance({
      updby: user.usrid,
      periods: students.map((student) => ({
        atndncid: student.atndncid,
        stdid: student.stdid,
        fkinstid: student.fkinstid,
        fkbrcid: student.fkbrcid,
        cls: student.cls,
        sec: student.sec,
        acdmcyr: student.acdmcyr || user.acdmcyr,
        prds: student.prds || '1-1-1-1-1-1-1-1',
        dys: statuses[student.stdid],
        typ: 'STUDENT',
        strdt: student.strdt,
        utyp: 'student',
      })),
    });
    setSaving(false);

    if (response?.status === 'success') {
      const updateResults = Array.isArray(response.payload)
        ? response.payload
        : [];
      const failed = updateResults.filter((item) => item?.status === false);
      setAlert({
        variant: failed.length ? 'warning' : 'success',
        message: failed.length
          ? failed.map((item) => `${item.stdid}: ${item.message}`).join(', ')
          : response.payload?.message || 'Attendance updated successfully.',
      });
      if (!failed.length) loadAttendance();
    } else {
      setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to update attendance.' });
    }
  };

  return (
    <Layout>
      <div className="attendance-page">
        <div className="attendance-shell">
          <header className="attendance-header">
            <button className="hw-icon-btn" type="button" onClick={() => navigate('/dashboard')} aria-label="Go back">
              <FaArrowLeft />
            </button>
            <div>
              <span className="hw-kicker">Today</span>
              <h1>Student Attendance</h1>
              <p>Mark attendance for students assigned to you.</p>
            </div>
          </header>

          {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

          <section className="attendance-filter-card">
            <Form.Group>
              <Form.Label>Class</Form.Label>
              <CustomSelect options={classes.map((item) => ({ value: item.clsid, label: item.clsnm }))} value={classId} onChange={(value) => handleClassChange({ target: { value } })} placeholder="Select class" ariaLabel="Class" />
            </Form.Group>
            <Form.Group>
              <Form.Label>Section</Form.Label>
              <SectionSelect sections={sections} value={sectionId} onChange={(value) => handleSectionChange({ target: { value } })} disabled={!classId} />
            </Form.Group>
            <button className="attendance-check" type="button" onClick={loadAttendance} disabled={loading || !classId || !sectionId}>
              {loading ? <Spinner as="span" animation="border" size="sm" /> : <FaSearch />} Check
            </button>
          </section>

          {loading ? (
            <div className="attendance-empty"><Spinner animation="border" /><span>Loading attendance...</span></div>
          ) : !hasSearched ? (
            <div className="attendance-empty"><FaCalendarCheck /><span>Select class and section, then tap Check.</span></div>
          ) : students.length === 0 ? (
            <div className="attendance-empty"><FaCalendarCheck /><span>No students found for attendance today.</span></div>
          ) : (
            <div className="attendance-list">
              {students.map((student) => (
                <article className="attendance-card" key={student.atndncid || student.stdid}>
                  <div className="attendance-student-copy">
                    <strong>{student.stdnm || `Student ${student.stdid}`}</strong>
                    <span>{[student.clsnm, student.secnm].filter(Boolean).join(' • ')}</span>
                  </div>
                  <CustomSelect className="attendance-status-select" options={attendanceOptions} value={statuses[student.stdid] || ''} onChange={(value) => setStatuses((current) => ({ ...current, [student.stdid]: value }))} placeholder="Select attendance" allowEmpty={false} ariaLabel={`Attendance for ${student.stdnm}`} />
                </article>
              ))}
            </div>
          )}

          {students.length > 0 && (
            <button className="attendance-save" type="button" onClick={saveAttendance} disabled={saving}>
              {saving ? <><Spinner as="span" animation="border" size="sm" /> Saving...</> : 'Save Attendance'}
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AttendancePage;
