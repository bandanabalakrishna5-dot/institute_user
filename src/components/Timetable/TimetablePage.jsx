import React, { useContext, useEffect, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBookOpen, FaCalendarDay, FaChalkboardTeacher, FaClock } from 'react-icons/fa';
import { AuthContext } from '../../App';
import Layout from '../common/Layout';
import { fetchStaffDailyTimetable, fetchStaffPeriodTopicDetails, formatPeriodLabel, uniqueTimetablePeriods, updateSubSyllabusStatus } from '../../services/TimetableServices/timetableServices';

const getParams = (user) => ({
  stfid: user.stfid,
  instid: user.instid,
  brcid: user.brcid,
  acdmcyr: user.acdmcyr,
});

const displayDate = (value) => {
  if (!value || typeof value === 'number' || /^\d+$/.test(String(value).trim())) return 'Not scheduled';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const normalizedTopicStatus = (status) => (
  ['complete', 'completed'].includes(String(status || '').trim().toLowerCase())
    ? 'Complete'
    : 'Pending'
);

function TimetablePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [periods, setPeriods] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [topicDetails, setTopicDetails] = useState([]);
  const [periodTopics, setPeriodTopics] = useState({});
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingStatusId, setSavingStatusId] = useState(null);

  const loadTimetable = async () => {
    if (!user.stfid || !user.instid || !user.brcid || !user.acdmcyr) {
      setError('Staff timetable information is incomplete.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const response = await fetchStaffDailyTimetable(getParams(user));
    setLoading(false);
    if (response?.status === 'success') {
      const timetablePeriods = uniqueTimetablePeriods(response.payload || []);
      setPeriods(timetablePeriods);
      const topicResponses = await Promise.all(timetablePeriods.map(async (period) => {
        if (!period.clsprid) return [period.clsprid, []];
        const topicResponse = await fetchStaffPeriodTopicDetails({
          ...getParams(user),
          clsprid: period.clsprid,
        });
        return [period.clsprid, topicResponse?.status === 'success' ? topicResponse.payload || [] : []];
      }));
      setPeriodTopics(Object.fromEntries(topicResponses));
    } else setError(response?.error?.message || 'Unable to load today’s timetable.');
  };

  useEffect(() => { loadTimetable(); }, [user.stfid, user.instid, user.brcid, user.acdmcyr]);

  const openPeriod = async (period) => {
    setSelectedPeriod(period);
    setTopicDetails([]);
    setDetailLoading(true);
    const response = await fetchStaffPeriodTopicDetails({ ...getParams(user), clsprid: period.clsprid });
    setDetailLoading(false);
    if (response?.status === 'success') setTopicDetails(response.payload || []);
  };

  const changeTopicStatus = async (detail, status) => {
    if (!detail.subsydetlid || savingStatusId) return;
    setSavingStatusId(detail.subsydetlid);
    setError('');
    const response = await updateSubSyllabusStatus({
      subsydetlid: detail.subsydetlid,
      status,
      usrid: user.usrid,
    });
    setSavingStatusId(null);
    if (response?.status === 'success') {
      setTopicDetails((current) => current.map((item) => (
        item.subsydetlid === detail.subsydetlid ? { ...item, status } : item
      )));
      setPeriodTopics((current) => ({
        ...current,
        [selectedPeriod?.clsprid]: (current[selectedPeriod?.clsprid] || []).map((item) => (
          item.subsydetlid === detail.subsydetlid ? { ...item, status } : item
        )),
      }));
    } else {
      setError(response?.error?.message || response?.errors?.[0]?.errorMessage || 'Unable to update topic status.');
    }
  };

  return (
    <Layout>
      <div className="tt-page">
        <header className="tt-header">
          <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
          <div><span className="hw-kicker">Daily schedule</span><h1>Today’s Timetable</h1><p>Your classes, subjects, and planned topics for today.</p></div>
        </header>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? <div className="tt-empty"><Spinner animation="border" /><p>Loading today’s classes...</p></div> : periods.length === 0 ? <div className="tt-empty"><FaCalendarDay /><h2>No classes today</h2><p>Your timetable is clear for today.</p></div> : (
          <div className="tt-period-list">
            {periods.map((period, index) => {
              const periodTopic = (periodTopics[period.clsprid] || [])[0];
              const topicStatus = normalizedTopicStatus(periodTopic?.status);
              return (
                <button type="button" className={`tt-period-card ${selectedPeriod?.clsprid === period.clsprid ? 'active' : ''}`} key={period.clsprid || index} onClick={() => openPeriod(period)}>
                  <span className="tt-period-number">{period.prd ?? index + 1}</span>
                  <span className="tt-period-main">
                    <strong>{period.subnm || period.subcd || 'Subject'}</strong>
                    <small><FaChalkboardTeacher /> {period.clsnm || 'Class'}{period.secnm ? ` · ${period.secnm}` : ''}</small>
                    {periodTopic && <span className="tt-period-topic"><FaBookOpen /> {periodTopic.topic || 'Topic not added'}</span>}
                    {periodTopic && <small className="tt-period-topic-date"><FaCalendarDay /> {displayDate(periodTopic.frmdt)} — {displayDate(periodTopic.todt)}</small>}
                  </span>
                  <span className="tt-period-side">
                    <span className="tt-period-time"><FaClock /> {formatPeriodLabel(period, index)}</span>
                    {periodTopic && <span className={`tt-period-status ${topicStatus.toLowerCase()}`}>{topicStatus}</span>}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {selectedPeriod && <section className="tt-topic-panel">
          <div className="tt-topic-head"><div><span className="hw-kicker">Lesson details</span><h2>{selectedPeriod.subnm || 'Period topic'}</h2></div><span className="hw-status-badge">{formatPeriodLabel(selectedPeriod)}</span></div>
          {detailLoading ? <div className="tt-topic-loading"><Spinner animation="border" size="sm" /> Loading topic...</div> : topicDetails.length ? topicDetails.map((detail, index) => {
            const currentStatus = normalizedTopicStatus(detail.status);
            const isSaving = savingStatusId === detail.subsydetlid;
            return <article className="tt-topic-card" key={detail.subsydetlid || `${detail.clsprid}-${index}`}><span className={`tt-topic-tag ${detail.tag === 'RED' ? 'urgent' : ''}`}>{detail.tag === 'RED' ? 'Due soon' : 'On track'}</span><h3><FaBookOpen /> {detail.topic || 'Topic not added'}</h3><p>{detail.clsnm}{detail.secnm ? ` · ${detail.secnm}` : ''} · {detail.subnm}</p><div className="tt-topic-footer"><small>{displayDate(detail.frmdt)} — {displayDate(detail.todt)}</small>{detail.subsydetlid && <div className="tt-status-control"><span className="tt-status-label">Status</span><div className="tt-status-toggle" role="group" aria-label="Topic status">{['Pending', 'Complete'].map((status) => <button type="button" key={status} className={currentStatus === status ? `active ${status.toLowerCase()}` : ''} onClick={() => changeTopicStatus(detail, status)} disabled={isSaving || currentStatus === status} aria-pressed={currentStatus === status}>{status}</button>)}</div>{isSaving && <Spinner animation="border" size="sm" />}</div>}</div></article>;
          }) : <div className="tt-no-topic">No current topic details added for this period.</div>}
        </section>}
      </div>
    </Layout>
  );
}

export default TimetablePage;
