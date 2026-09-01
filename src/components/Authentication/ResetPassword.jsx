import React, { useState } from 'react';
import { Alert, Button, Container, Form } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';
import { resetPassword } from '../../services/LoginServices/loginServices';

const ResetPassword = () => {
  const token = new URLSearchParams(useLocation().search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8 || password !== confirmPassword) {
      setMessage('Passwords must match and contain at least 8 characters.');
      return;
    }
    setLoading(true);
    const response = await resetPassword({ token, newpswrd: password });
    setLoading(false);
    const ok = response?.status === 'success';
    setSuccess(ok);
    setMessage(ok ? response.payload?.msg : (response?.error?.message || 'Reset link is invalid or expired.'));
  };

  return (
    <Container style={{ maxWidth: 480, paddingTop: 80 }}>
      <h2>Reset Password</h2>
      {message && <Alert variant={success ? 'success' : 'danger'}>{message}</Alert>}
      {!success && (
        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>New password</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Confirm password</Form.Label>
            <Form.Control type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Form.Group>
          <Button type="submit" disabled={loading || !token}>{loading ? 'Resetting...' : 'Reset Password'}</Button>
        </Form>
      )}
      <div className="mt-3"><Link to="/">Return to login</Link></div>
    </Container>
  );
};

export default ResetPassword;
