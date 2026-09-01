import React, { useContext, useState } from 'react';
import { Alert, Button, Card, Container, Form, InputGroup } from 'react-bootstrap';
import { FaArrowLeft, FaEye, FaEyeSlash, FaKey, FaLock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { changePassword } from '../../services/LoginServices/loginServices';
import Layout from '../common/Layout';

const initialForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

function ChangePasswordPage() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};
  const [form, setForm] = useState(initialForm);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const updateField = ({ target: { name, value } }) => {
    setForm((old) => ({ ...old, [name]: value }));
    setMessage(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      setMessage({ type: 'danger', text: 'Please complete all password fields.' }); return;
    }
    if (form.newPassword.length < 8) {
      setMessage({ type: 'danger', text: 'New password must be at least 8 characters.' }); return;
    }
    if (form.currentPassword === form.newPassword) {
      setMessage({ type: 'danger', text: 'New password must be different from the current password.' }); return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'danger', text: 'New password and confirmation do not match.' }); return;
    }
    const identifier = user.emlid || user.mobno || user.mobile || user.mblno;
    if (!identifier) {
      setMessage({ type: 'danger', text: 'Account email or mobile number is unavailable. Please contact the administrator.' }); return;
    }
    setSaving(true);
    const response = await changePassword({
      emlid: identifier, mobile: identifier,
      oldpswrd: form.currentPassword, newpswrd: form.newPassword,
    });
    setSaving(false);
    if (response?.status === 'success') {
      setForm(initialForm);
      setMessage({ type: 'success', text: 'Password changed successfully.' });
    } else {
      setMessage({ type: 'danger', text: response?.error?.message || response?.errors?.[0]?.errorMessage || 'Unable to change password. Please try again.' });
    }
  };

  const passwordField = (name, label, key, autoComplete) => (
    <Form.Group className="change-password-field">
      <Form.Label>{label}</Form.Label>
      <InputGroup>
        <InputGroup.Text><FaLock /></InputGroup.Text>
        <Form.Control name={name} type={visible[key] ? 'text' : 'password'} value={form[name]} onChange={updateField} autoComplete={autoComplete} placeholder={`Enter ${label.toLowerCase()}`} />
        <Button type="button" variant="outline-secondary" aria-label={`${visible[key] ? 'Hide' : 'Show'} ${label.toLowerCase()}`} onClick={() => setVisible((old) => ({ ...old, [key]: !old[key] }))}>
          {visible[key] ? <FaEyeSlash /> : <FaEye />}
        </Button>
      </InputGroup>
    </Form.Group>
  );

  return (
    <Layout>
      <Container className="change-password-page py-4">
        <button type="button" className="user-profile-back" onClick={() => navigate('/dashboard')}><FaArrowLeft /> <span>Dashboard</span></button>
        <Card className="change-password-card">
          <Card.Header><div className="change-password-icon"><FaKey /></div><div><span>ACCOUNT SECURITY</span><h1>Change Password</h1><p>Use a strong password you do not use elsewhere.</p></div></Card.Header>
          <Card.Body>
            {message && <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>{message.text}</Alert>}
            <Form onSubmit={submit} noValidate>
              {passwordField('currentPassword', 'Current Password', 'current', 'current-password')}
              {passwordField('newPassword', 'New Password', 'next', 'new-password')}
              <Form.Text className="password-help">Use at least 8 characters.</Form.Text>
              {passwordField('confirmPassword', 'Confirm New Password', 'confirm', 'new-password')}
              <Button type="submit" className="change-password-submit" disabled={saving}><FaKey /> {saving ? 'Updating...' : 'Update Password'}</Button>
            </Form>
          </Card.Body>
        </Card>
        <style>{`
          .change-password-page{max-width:720px}.change-password-card{border:0;border-radius:18px;overflow:hidden;box-shadow:0 12px 36px rgba(15,23,42,.09)}
          .change-password-card .card-header{display:flex;gap:16px;align-items:center;padding:24px;border:0;background:linear-gradient(135deg,#eff6ff,#fff)}.change-password-icon{width:52px;height:52px;display:flex;align-items:center;justify-content:center;flex:none;border-radius:15px;color:#fff;background:linear-gradient(135deg,#315bea,#7c3aed);font-size:20px}
          .change-password-card .card-header span{color:#64748b;font-size:11px;font-weight:800;letter-spacing:.08em}.change-password-card .card-header h1{margin:2px 0;color:#172033;font-size:25px;font-weight:850}.change-password-card .card-header p{margin:0;color:#64748b;font-size:13px}.change-password-card .card-body{padding:28px 24px 30px}
          .change-password-field{margin-bottom:20px}.change-password-field .form-label{color:#334155;font-size:13px;font-weight:750}.change-password-field .input-group-text,.change-password-field .form-control,.change-password-field .btn{min-height:48px;border-color:#d6dfec;background:#f8fbff}.change-password-field .input-group-text,.change-password-field .btn{color:#64748b}.change-password-field .form-control:focus{border-color:#4672ee;box-shadow:none;background:#fff}.password-help{display:block;margin:-14px 0 18px 44px;color:#64748b}.change-password-submit{width:100%;min-height:50px;display:flex;gap:9px;align-items:center;justify-content:center;border:0;border-radius:11px;background:linear-gradient(135deg,#315bea,#34248b);font-weight:800}@media(max-width:576px){.change-password-card .card-header{align-items:flex-start;padding:20px}.change-password-card .card-body{padding:22px 18px 24px}}
        `}</style>
      </Container>
    </Layout>
  );
}

export default ChangePasswordPage;
