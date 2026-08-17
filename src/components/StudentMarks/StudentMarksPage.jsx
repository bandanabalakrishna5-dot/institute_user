import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaClipboardCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import Layout from '../common/Layout';
import {
  fetchBranchClasses,
  fetchClassSections,
} from '../../services/HomeworkServices/homeworkServices';
import {
  createStudentMarks,
  fetchExamTimeTableMarks,
} from '../../services/StudentMarksServices/studentMarksServices';

function StudentMarksPage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [classId, setClassId] = useState(String(user.clsid || ''));
  const [sectionId, setSectionId] = useState(String(user.secid || ''));
  const [examId, setExamId] = useState('');
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const selectedExam = useMemo(
    () => exams.find((exam) => String(exam.fkexmtmble) === String(examId)),
    [exams, examId]
  );
  const students = useMemo(() => selectedExam?.students || [], [selectedExam]);
  const subjects = useMemo(() => {
    const names = new Set();
    students.forEach((student) =>
      (student.subj || []).forEach((subject) => {
        if (subject.sub) names.add(subject.sub);
      })
    );
    return Array.from(names);
  }, [students]);

  useEffect(() => {
    if (!user.brcid || !user.acdmcyr) return;
    fetchBranchClasses({ brcid: user.brcid, acdmcyr: user.acdmcyr })
      .then((response) => {
        if (response?.status === 'success') setClasses(response.payload || []);
      })
      .catch(() => setAlert({ variant: 'danger', message: 'Failed to load classes.' }));
  }, [user.brcid, user.acdmcyr]);

  useEffect(() => {
    if (!classId) { setSections([]); return; }
    fetchClassSections({ clsid: classId })
      .then((response) => {
        if (response?.status === 'success') setSections(response.payload || []);
      })
      .catch(() => setAlert({ variant: 'danger', message: 'Failed to load sections.' }));
  }, [classId]);

  useEffect(() => {
    if (!sectionId) { setExams([]); return; }
    setLoading(true);
    fetchExamTimeTableMarks({ secid: sectionId })
      .then((response) => {
        if (response?.status === 'success') setExams(response.payload || []);
        else setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to load exams.' });
      })
      .catch((error) => setAlert({ variant: 'danger', message: error?.message || 'Failed to load exams.' }))
      .finally(() => setLoading(false));
  }, [sectionId]);

  const handleClassChange = (value) => {
    setClassId(value);
    setSectionId('');
    setExamId('');
    setMarks({});
  };

  const handleSectionChange = (value) => {
    setSectionId(value);
    setExamId('');
    setMarks({});
  };

  const handleExamChange = (value) => {
    setExamId(value);
    setMarks({});
    setAlert(null);
  };

  const updateMark = (studentId, subject, value, maximumMarks) => {
    if (value !== '' && (Number(value) < 0 || Number(value) > Number(maximumMarks))) return;
    setMarks((current) => ({
      ...current,
      [studentId]: { ...current[studentId], [subject]: value },
    }));
  };

  const submitMarks = async () => {
    const hasMark = students.some((student) =>
      subjects.some((subject) => marks[student.stdid]?.[subject] !== undefined && marks[student.stdid]?.[subject] !== '')
    );
    if (!classId || !sectionId || !examId) {
      setAlert({ variant: 'danger', message: 'Select class, section, and exam.' });
      return;
    }
    if (!hasMark) {
      setAlert({ variant: 'danger', message: 'Enter at least one student mark.' });
      return;
    }

    const examwise = students.map((student) => ({
      fkstid: student.stdid,
      fkexmtmble: selectedExam.fkexmtmble,
      mrk: subjects.map((subject) => ({
        subjnm: subject,
        mrk: marks[student.stdid]?.[subject] ?? '',
      })),
    }));

    setSaving(true);
    setAlert(null);
    try {
      const response = await createStudentMarks({
        usrid: user.usrid,
        crtby: user.usrid,
        fkclsid: classId,
        secid: sectionId,
        fkbrcid: user.brcid,
        fkinstid: user.instid,
        acdmcyr: user.acdmcyr,
        examwise,
      });
      if (response?.status === 'success') {
        setAlert({ variant: 'success', message: response.payload?.message || 'Exam marks saved successfully.' });
        setMarks({});
      } else {
        setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to save exam marks.' });
      }
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Failed to save exam marks.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="marks-page">
        <div className="marks-shell">
          <header className="leave-header marks-header">
            <button className="hw-icon-btn" type="button" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div><span className="hw-kicker">Staff</span><h1>Enter Exam Marks</h1><p>Select an exam and record marks for each student.</p></div>
          </header>

          {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

          <section className="leave-form-card marks-form-card">
            <h2>Exam details</h2>
            <Form className="leave-form-grid">
              <Form.Group><Form.Label>Class *</Form.Label><Form.Select value={classId} onChange={(event) => handleClassChange(event.target.value)}><option value="">Select class</option>{classes.map((item) => <option key={item.clsid} value={item.clsid}>{item.clsnm}</option>)}</Form.Select></Form.Group>
              <Form.Group><Form.Label>Section *</Form.Label><Form.Select value={sectionId} disabled={!classId} onChange={(event) => handleSectionChange(event.target.value)}><option value="">Select section</option>{sections.map((item) => <option key={item.secid} value={item.secid}>{item.secnm}</option>)}</Form.Select></Form.Group>
              <Form.Group className="leave-form-full"><Form.Label>Exam *</Form.Label><Form.Select value={examId} disabled={!sectionId || loading} onChange={(event) => handleExamChange(event.target.value)}><option value="">{loading ? 'Loading exams...' : 'Select exam'}</option>{exams.map((exam) => <option key={exam.fkexmtmble} value={exam.fkexmtmble}>{exam.exmtyp}</option>)}</Form.Select></Form.Group>
            </Form>
          </section>

          {selectedExam && students.length > 0 && (
            <section className="marks-entry-card">
              <div className="marks-entry-title"><div><span className="hw-kicker">{students.length} students</span><h2>Subject marks</h2></div><FaClipboardCheck /></div>
              <div className="marks-table-wrap">
                <table className="marks-table">
                  <thead><tr><th>Student</th>{subjects.map((subject) => <th key={subject}>{subject}</th>)}</tr></thead>
                  <tbody>{students.map((student) => <tr key={student.stdid}><td><strong>{student.stdnm}</strong><small>Max {student.mxmmrks}</small></td>{subjects.map((subject) => <td key={`${student.stdid}-${subject}`}><Form.Control aria-label={`${student.stdnm} ${subject} marks`} type="number" inputMode="decimal" min="0" max={student.mxmmrks} placeholder={`0–${Number(student.mxmmrks)}`} value={marks[student.stdid]?.[subject] ?? ''} onChange={(event) => updateMark(student.stdid, subject, event.target.value, student.mxmmrks)} /></td>)}</tr>)}</tbody>
                </table>
              </div>
              <button type="button" className="hw-primary-btn marks-save-btn" disabled={saving} onClick={submitMarks}>{saving ? <><Spinner as="span" size="sm" animation="border" /> Saving...</> : 'Save Exam Marks'}</button>
            </section>
          )}

          {selectedExam && students.length === 0 && <div className="leave-empty">No students found for this exam.</div>}
        </div>
      </div>
    </Layout>
  );
}

export default StudentMarksPage;
