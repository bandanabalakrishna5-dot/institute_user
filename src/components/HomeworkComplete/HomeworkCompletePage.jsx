import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBookOpen, FaCalendarAlt, FaCheck, FaSearch, FaTimes, FaUserCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  fetchBranchClasses,
  fetchClassSections,
  fetchHomeWorkUploads,
} from '../../services/HomeworkServices/homeworkServices';
import {
  createHomeworkCompletion,
  fetchHomeworkCompletions,
  fetchStudentsForHomework,
} from '../../services/HomeworkCompleteServices/homeworkCompleteServices';
import Layout from '../common/Layout';
import SectionSelect from '../common/SectionSelect';
import CustomSelect from '../common/CustomSelect';

function HomeworkCompletePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [students, setStudents] = useState([]);
  const [homeworkList, setHomeworkList] = useState([]);
  const [homework, setHomework] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searched, setSearched] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    if (!user.brcid || !user.acdmcyr) return;
    fetchBranchClasses({ brcid: user.brcid, acdmcyr: user.acdmcyr }).then((response) => {
      if (response?.status === 'success') setClasses(response.payload || []);
    });
  }, [user.acdmcyr, user.brcid]);

  useEffect(() => {
    setSections([]);
    setSectionId('');
    setStudents([]);
    setHomeworkList([]);
    setHomework(null);
    setSearched(false);
    if (!classId) return;
    fetchClassSections({ clsid: classId }).then((response) => {
      if (response?.status === 'success') setSections(response.payload || []);
    });
  }, [classId]);

  const selectedClass = useMemo(
    () => classes.find((item) => String(item.clsid) === String(classId)),
    [classes, classId],
  );
  const selectedSection = useMemo(
    () => sections.find((item) => String(item.secid) === String(sectionId)),
    [sections, sectionId],
  );

  const formatHomeworkDate = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 'Date unavailable' : date.toLocaleDateString('en-GB');
  };

  const selectHomework = async (selectedHomework) => {
    setHomework(selectedHomework);
    setStatuses({});
    setStatusLoading(true);
    try {
      const completionResponse = await fetchHomeworkCompletions({
        fkhwid: selectedHomework.hmwkudid,
        fkclsid: classId,
        fksecid: sectionId,
        fksubid: selectedHomework.fksubid,
        sbnm: selectedHomework.sbnm,
        acdmcyr: user.acdmcyr,
      });
      const nextStatuses = {};
      (completionResponse?.payload || []).forEach((item) => {
        nextStatuses[String(item.stdid)] = item;
      });
      setStatuses(nextStatuses);
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Unable to load homework statuses.' });
    } finally {
      setStatusLoading(false);
    }
  };

  const searchStudents = async () => {
    if (!classId || !sectionId) {
      setAlert({ variant: 'danger', message: 'Select class and section.' });
      return;
    }
    setLoading(true);
    setSearched(true);
    setAlert(null);
    setStudents([]);
    setHomeworkList([]);
    setHomework(null);
    try {
      const [studentResponse, homeworkResponse] = await Promise.all([
        fetchStudentsForHomework({
          secid: sectionId,
          acdmcyr: user.acdmcyr,
        }),
        fetchHomeWorkUploads({
          typ: 'STAFF', instid: user.instid, brcid: user.brcid,
          stfid: user.stfid, acdmcyr: user.acdmcyr,
        }),
      ]);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const sevenDayStart = new Date(today);
      sevenDayStart.setDate(sevenDayStart.getDate() - 6);
      sevenDayStart.setHours(0, 0, 0, 0);
      const matchingHomework = (homeworkResponse?.payload || [])
        .filter((item) => String(item.fkclsid) === String(classId) && String(item.fksecid) === String(sectionId))
        .filter((item) => {
          const date = new Date(item.crtdt);
          return !Number.isNaN(date.getTime()) && date >= sevenDayStart && date <= today;
        })
        .sort((left, right) => new Date(right.crtdt).getTime() - new Date(left.crtdt).getTime() || Number(right.hmwkudid) - Number(left.hmwkudid));
      if (!matchingHomework.length) {
        setAlert({ variant: 'warning', message: 'No homework found in the last 7 days for the selected class and section.' });
        return;
      }
      const studentRows = studentResponse?.status === 'success' ? studentResponse.payload || [] : [];
      const studentList = Array.from(
        new Map(studentRows.map((student) => [String(student.sid ?? student.stdid), student])).values(),
      );
      setStudents(studentList);
      setHomeworkList(matchingHomework);
      await selectHomework(matchingHomework[0]);
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Unable to load homework verification.' });
    } finally {
      setLoading(false);
    }
  };

  const selectStatus = (student, nextStatus) => {
    const studentId = student.sid ?? student.stdid;
    const current = statuses[String(studentId)];
    setStatuses((previous) => ({
      ...previous,
      [String(studentId)]: { ...current, stdid: studentId, hwstatus: nextStatus },
    }));
  };

  const submitStatuses = async () => {
    if (!homework || !students.length) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const response = await createHomeworkCompletion({
        fkhwid: homework.hmwkudid,
        fkclsid: classId,
        fksecid: sectionId,
        fksubid: homework.fksubid,
        sbnm: homework.sbnm,
        acdmcyr: user.acdmcyr,
        complete: students.map((student) => {
          const studentId = student.sid ?? student.stdid;
          return {
            stdid: studentId,
            hwstatus: Number(statuses[String(studentId)]?.hwstatus ?? 0),
          };
        }),
      });
      if (response?.status !== 'success') throw new Error(response?.error?.message || 'Unable to save statuses.');
      const saved = { ...statuses };
      (response.payload?.results || []).forEach((item) => {
        saved[String(item.stdid)] = { ...saved[String(item.stdid)], ...item };
      });
      setStatuses(saved);
      setAlert({ variant: 'success', message: response.payload?.message || 'Homework statuses saved successfully.' });
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Unable to save homework statuses.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="homework-verify-page">
        <div className="homework-verify-shell">
          <header className="homework-verify-header">
            <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div><span className="hw-kicker">STAFF</span><h1>Verify Homework</h1><p>Check completion status for each student.</p></div>
          </header>

          {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

          <section className="homework-verify-filter">
            <div className="homework-verify-filter-grid">
              <Form.Group><Form.Label>Class *</Form.Label><CustomSelect options={classes.map((item) => ({ value: item.clsid, label: item.clsnm }))} value={classId} onChange={setClassId} placeholder="Select class" ariaLabel="Class" /></Form.Group>
              <Form.Group><Form.Label>Section *</Form.Label><SectionSelect sections={sections} value={sectionId} disabled={!classId} onChange={(value) => { setSectionId(value); setStudents([]); setHomeworkList([]); setHomework(null); setStatuses({}); setSearched(false); }} /></Form.Group>
            </div>
            <button type="button" className="homework-verify-search" onClick={searchStudents} disabled={loading}><FaSearch /> {loading ? 'Searching...' : 'Search'}</button>
          </section>

          {loading && <div className="homework-verify-state"><Spinner animation="border" size="sm" /> Loading students...</div>}
          {!loading && homework && <>
            <section className="homework-date-selector"><div className="homework-date-selector-title"><div><span className="hw-kicker">LAST 7 DAYS</span><h2>Select Homework</h2></div><small>{homeworkList.length} {homeworkList.length === 1 ? 'homework' : 'homeworks'}</small></div><div className="homework-date-options">{homeworkList.map((item) => <button type="button" className={String(item.hmwkudid) === String(homework.hmwkudid) ? 'selected' : ''} onClick={() => selectHomework(item)} key={item.hmwkudid}><FaCalendarAlt /><span><strong>{formatHomeworkDate(item.crtdt)}</strong><small>{item.sbnm || 'Homework'}</small></span></button>)}</div></section>
            <section className="homework-verify-assignment"><span><FaBookOpen /></span><div><small>{selectedClass?.clsnm || homework.clsnm} · {selectedSection?.secnm || homework.senm}</small><strong>{homework.sbnm || 'Homework'}</strong><p>{homework.desc || 'No description provided.'}</p></div></section>
            {statusLoading ? <div className="homework-verify-state"><Spinner animation="border" size="sm" /> Loading saved statuses...</div> : <section className="homework-verify-list">
              <div className="homework-verify-list-title"><div><span className="hw-kicker">STUDENTS</span><h2>Completion Status</h2></div><small>{students.length} students</small></div>
              {students.map((student) => {
                const studentId = student.sid ?? student.stdid;
                const status = Number(statuses[String(studentId)]?.hwstatus ?? 0);
                const complete = status === 1;
                const statusLabel = status === 1 ? 'Homework complete' : status === 2 ? 'Homework not complete' : 'Absent';
                return <article className="homework-verify-student" key={studentId}><span className={`homework-verify-avatar ${complete ? 'complete' : status === 2 ? 'not-complete' : 'absent'}`}>{complete ? <FaUserCheck /> : <FaTimes />}</span><div className="homework-verify-student-copy"><strong>{student.stdnm || `Student ${studentId}`}</strong><small>{student.strid ? `Roll no. ${student.strid} · ${statusLabel}` : statusLabel}</small></div><div className="homework-status-actions" aria-label={`${student.stdnm || 'Student'} homework status`}><button type="button" className={`absent ${status === 0 ? 'selected' : ''}`} onClick={() => selectStatus(student, 0)} aria-pressed={status === 0}>Absent</button><button type="button" className={`complete ${status === 1 ? 'selected' : ''}`} onClick={() => selectStatus(student, 1)} aria-pressed={status === 1}><FaCheck /> Complete</button><button type="button" className={`not-complete ${status === 2 ? 'selected' : ''}`} onClick={() => selectStatus(student, 2)} aria-pressed={status === 2}><FaTimes /> Not Complete</button></div></article>;
              })}
              {!students.length && <div className="homework-verify-state">No students found for this class and section.</div>}
              {students.length > 0 && <button type="button" className="homework-verify-submit" onClick={submitStatuses} disabled={submitting}>{submitting ? <><Spinner animation="border" size="sm" /> Saving...</> : <><FaCheck /> Submit Homework Status</>}</button>}
            </section>}
          </>}
          {!loading && searched && !homework && !alert && <div className="homework-verify-state">No homework or students found.</div>}
        </div>
      </div>
    </Layout>
  );
}

export default HomeworkCompletePage;
