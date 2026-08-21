import React, { useContext, useEffect, useState } from 'react';
import { Alert, Form, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaCalendarAlt, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  createStudentLeave,
  fetchLeaveTypes,
  fetchStudentLeaves,
} from '../../services/LeaveServices/staffLeaveServices';
import Layout from '../common/Layout';
import CustomSelect from '../common/CustomSelect';

const initialForm = { leaveTypeId: '', fromDate: '', toDate: '', description: '' };
const defaultStudentLeaveTypes = [
  { lvtypid: 'Personal Leave', nm: 'Personal Leave' },
  { lvtypid: 'Sick Leave', nm: 'Sick Leave' },
];

function StudentLeavePage() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState(defaultStudentLeaveTypes);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState(null);

  const loadLeaves = async () => {
    setLoading(true);
    setAlert(null);
    try {
      const response = await fetchStudentLeaves({
        typ: 'STUDENT',
        type: 'student',
        usrid: user.usrid,
        instid: user.instid,
        brcid: user.brcid,
        clsid: user.clsid,
        stdid: user.stdid,
        acdmcyr: user.acdmcyr,
      });
      if (response?.status === 'success') {
        setLeaves(response.payload || []);
      } else {
        setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to fetch student leave requests.' });
      }
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Failed to fetch student leave requests.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    fetchLeaveTypes().then((response) => {
      if (response?.status === 'success' && response.payload?.length) {
        setLeaveTypes(response.payload);
      }
    }).catch(() => setLeaveTypes(defaultStudentLeaveTypes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.usrid, user.instid, user.brcid, user.clsid, user.stdid, user.acdmcyr]);

  const updateForm = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submitLeave = async () => {
    if (!form.leaveTypeId || !form.fromDate || !form.toDate || !form.description.trim()) {
      setAlert({ variant: 'danger', message: 'Please fill all required fields.' });
      return;
    }
    if (form.toDate < form.fromDate) {
      setAlert({ variant: 'danger', message: 'To date cannot be before from date.' });
      return;
    }

    setSaving(true);
    setAlert(null);
    try {
      const response = await createStudentLeave({
        fklevtyp: form.leaveTypeId,
        apprstfid: '',
        frmdate: form.fromDate,
        todate: form.toDate,
        desc: form.description.trim(),
        stat: '0',
        fkstdid: user.stdid,
        fkclsid: user.clsid,
        fkbrcid: user.brcid,
        fksctnid: user.secid,
        fkinstid: user.instid,
        fkstfid: '',
        typ: 'student',
        usrid: user.usrid,
        acdmcyr: user.acdmcyr,
      });
      if (response?.status === 'success') {
        setAlert({ variant: 'success', message: response.payload?.message || 'Student leave request submitted.' });
        setForm(initialForm);
        setShowForm(false);
        loadLeaves();
      } else {
        setAlert({ variant: 'danger', message: response?.error?.message || 'Failed to submit student leave.' });
      }
    } catch (error) {
      setAlert({ variant: 'danger', message: error?.message || 'Failed to submit student leave.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="leave-page">
        <div className="leave-shell">
          <header className="leave-header">
            <button className="hw-icon-btn" type="button" onClick={() => navigate('/dashboard')} aria-label="Go back"><FaArrowLeft /></button>
            <div><span className="hw-kicker">Student</span><h1>Leave Management</h1><p>Request leave and view its approval status.</p></div>
          </header>

          {alert && <Alert variant={alert.variant}>{alert.message}</Alert>}

          {showForm && (
            <section className="leave-form-card">
              <h2>New Leave Request</h2>
              <Form className="leave-form-grid">
                <Form.Group><Form.Label>Leave type *</Form.Label><CustomSelect options={leaveTypes.map((item) => ({ value: item.lvtypid, label: item.nm }))} value={form.leaveTypeId} onChange={(value) => updateForm('leaveTypeId', value)} placeholder="Select leave type" ariaLabel="Leave type" /></Form.Group>
                <Form.Group><Form.Label>From date *</Form.Label><Form.Control type="date" value={form.fromDate} onChange={(event) => updateForm('fromDate', event.target.value)} /></Form.Group>
                <Form.Group><Form.Label>To date *</Form.Label><Form.Control type="date" min={form.fromDate} value={form.toDate} onChange={(event) => updateForm('toDate', event.target.value)} /></Form.Group>
                <Form.Group className="leave-form-full"><Form.Label>Reason *</Form.Label><Form.Control as="textarea" rows={3} value={form.description} onChange={(event) => updateForm('description', event.target.value)} placeholder="Describe the reason for leave" /></Form.Group>
              </Form>
              <div className="leave-form-actions"><button type="button" className="hw-secondary-btn" onClick={() => { setShowForm(false); setForm(initialForm); }}>Cancel</button><button type="button" className="hw-primary-btn" onClick={submitLeave} disabled={saving}>{saving ? <><Spinner as="span" size="sm" animation="border" /> Submitting...</> : 'Submit Request'}</button></div>
            </section>
          )}

          {loading ? (
            <div className="leave-empty"><Spinner animation="border" /><span>Loading leave requests...</span></div>
          ) : leaves.length === 0 ? (
            <div className="leave-empty"><FaCalendarAlt /><span>No student leave requests found.</span></div>
          ) : (
            <div className="leave-list">{leaves.map((leave) => (
              <article className="leave-card" key={leave.lvmngmtid}>
                <div><strong>{leave.desc || 'Student leave'}</strong><span>{leave.frmdate} — {leave.todate}</span></div>
                <span className={`leave-status ${String(leave.stat || '').toLowerCase()}`}>{leave.stat || 'Pending'}</span>
              </article>
            ))}</div>
          )}

          {!showForm && <button className="hw-fab" type="button" onClick={() => setShowForm(true)} aria-label="Request student leave"><FaPlus /></button>}
        </div>
      </div>
    </Layout>
  );
}

export default StudentLeavePage;
