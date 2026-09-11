import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaBookOpen, FaCheckCircle, FaGraduationCap, FaTimesCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { fetchStudentExamResults } from '../../services/StudentMarksServices/studentMarksServices';
import Layout from '../common/Layout';

const displayValue = (value, fallback = '—') => (
  value === null || value === undefined || value === '' ? fallback : value
);

const isPassed = (subject) => {
  const status = String(subject?.sts || '').toUpperCase();
  if (status) return status === 'PASS' || status === 'PASSED' || status === 'P';
  return Number(subject?.marks) >= Number(subject?.mnmrks || 0);
};

function StudentResultsPage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResults = useCallback(async () => {
    if (!user.instid || !user.brcid || !user.stdid) {
      setError('Student result information is not available for this account.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetchStudentExamResults({
        instid: user.instid,
        brcid: user.brcid,
        stdid: user.stdid,
        clsid: user.clsid,
        secid: user.secid,
        acdmcyr: user.acdmcyr,
        typ: 'STUDENT',
      });
      if (response?.status !== 'success') {
        throw new Error(response?.error?.message || 'Unable to load exam results.');
      }
      setResults(Array.isArray(response.payload) ? response.payload : []);
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load exam results.');
    } finally {
      setLoading(false);
    }
  }, [user.acdmcyr, user.brcid, user.clsid, user.instid, user.secid, user.stdid]);

  useEffect(() => { loadResults(); }, [loadResults]);

  const exams = results.flatMap((student) => (student.exams || []).map((exam) => ({
    ...exam,
    studentName: student.stdnm,
  })));

  return (
    <Layout>
      <main className="student-results-page">
        <div className="student-results-shell">
          <header className="student-results-header">
            <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div>
              <span>ACADEMIC YEAR {user.acdmcyr || ''}</span>
              <h1>Exam Results</h1>
              <p>{results[0]?.stdnm || user.stdnm || 'Student'}</p>
            </div>
            <span className="student-results-header-icon"><FaGraduationCap /></span>
          </header>

          {error && <Alert variant="danger" className="student-results-alert"><span>{error}</span><button type="button" onClick={loadResults}>Retry</button></Alert>}
          {loading && <div className="student-results-state"><Spinner animation="border" size="sm" /> Loading exam results...</div>}
          {!loading && !error && exams.length === 0 && <div className="student-results-empty"><FaBookOpen /><h2>No results published</h2><p>Your exam results will appear here after they are published.</p></div>}

          {!loading && !error && exams.map((exam, examIndex) => (
            <section className="student-exam-card" key={`${exam.extype || 'exam'}-${examIndex}`}>
              <div className="student-exam-title">
                <div><span>EXAM TYPE</span><h2>{displayValue(exam.extype, 'Exam')}</h2></div>
                <div className="student-exam-total"><small>Total marks</small><strong>{displayValue(exam.gndmrks, 0)} <em>/ {displayValue(exam.ttlmrks, 0)}</em></strong></div>
              </div>
              <div className="student-subject-list">
                {(exam.submrks || []).map((subject, subjectIndex) => {
                  const passed = isPassed(subject);
                  return (
                    <article className="student-subject-row" key={`${subject.subjectCode || subject.subject}-${subjectIndex}`}>
                      <span className="student-subject-icon"><FaBookOpen /></span>
                      <div className="student-subject-name"><strong>{displayValue(subject.subject, 'Subject')}</strong>{subject.subjectCode && subject.subjectCode !== subject.subject && <small>{subject.subjectCode}</small>}</div>
                      <div className="student-subject-mark"><strong>{displayValue(subject.marks, 0)}</strong><small>/ {displayValue(subject.mxmmrks, 0)}</small></div>
                      <span className={`student-subject-status ${passed ? 'pass' : 'fail'}`}>{passed ? <FaCheckCircle /> : <FaTimesCircle />}{passed ? 'Pass' : 'Fail'}</span>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </Layout>
  );
}

export default StudentResultsPage;