import React, { useState, useContext } from 'react';
import { Alert, Modal, Button, Form } from 'react-bootstrap';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginUserValidate, forgotPasswordUser } from './operation';
import { FaEye, FaEyeSlash, FaLock, FaUserAlt, FaStar, FaGraduationCap, FaBookOpen } from 'react-icons/fa';
import { BsShield } from 'react-icons/bs';
import { emailValidation } from '../../services/commonUtills/FormValidations';
import { AuthContext } from '../../App';
import InstallAppButton from '../common/InstallAppButton';

const initialState = {
  emlid: '',
  pswrd: '',
};

function Login() {
  const { stateAuth, dispatchAuth } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertShow, setAlertShow] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVarient, setAlertVarient] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Forgot Password Modal State
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [cpEmail, setCpEmail] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    if (id === 'email') {
      const normalizedEmail = value.toLowerCase();
      setEmail(normalizedEmail);
      setEmailError('');
    } else if (id === 'pswrd') {
      setPassword(value);
      setPasswordError('');
    }
  };

  const validateData = () => {
    let is_valid = true;
    if (!email) {
      setEmailError('Please Enter Email or Mobile');
      is_valid = false;
    } else if (!emailValidation(email) && !/^[0-9]{10}$/.test(email)) {
      setEmailError('Please Enter Valid Email or 10-digit Mobile');
      is_valid = false;
    }
    if (!password) {
      setPasswordError('Please Enter Password');
      is_valid = false;
    }
    return is_valid;
  };

  const handleSubmit = () => {
    if (validateData()) {
      setIsLoading(true);
      loginAuthentication();
    }
  };

  const loginAuthentication = async () => {
    const obj = { ...initialState, emlid: email, pswrd: password };
    const res = await loginUserValidate(obj);

    if (res && res.status === 'success') {
      setAlertShow(true);
      setAlertMessage('Logged In Successfully');
      setAlertVarient('success');
      hideMessage();
      const sessions = Array.isArray(res.payload) ? res.payload : [res.payload];
      const validSessions = sessions.filter(Boolean);
      const userData = validSessions[0];
      dispatchAuth({
        type: 'LOGIN',
        payload: {
          user: userData,
          // All returned student profiles share the same server-issued token.
          token: userData.token,
          studentProfiles:
            validSessions.length > 1 && validSessions.every((item) => String(item.typ || '').toUpperCase() === 'STUDENT')
              ? validSessions
              : [],
        },
      });
      navigate(validSessions.length > 1 ? '/select-student' : '/dashboard');
    } else {
      setAlertShow(true);
      setAlertMessage(
        res?.error?.message || 'Please Enter Valid Details'
      );
      setAlertVarient('danger');
      hideMessage();
      setIsLoading(false);
    }
  };

  const hideMessage = () => {
    setTimeout(() => {
      setAlertShow(false);
      setAlertMessage('');
      setAlertVarient('');
    }, 5000);
  };

  const showHidePassword = () => setShowPassword(!showPassword);

  const loginEnter = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!cpEmail) {
      setAlertShow(true);
      setAlertMessage('Please enter your email or mobile number');
      setAlertVarient('danger');
      hideMessage();
      return;
    }
    setCpLoading(true);
    const obj = { emlid: cpEmail, mobile: cpEmail };
    const res = await forgotPasswordUser(obj);
    
    setCpLoading(false);
    if (res && res.status === 'success') {
      setAlertShow(true);
      setAlertMessage(res?.payload?.msg || 'Recovery instructions sent successfully');
      setAlertVarient('success');
      hideMessage();
      setShowChangePwd(false);
      setCpEmail('');
    } else {
      setAlertShow(true);
      setAlertMessage(res?.error?.message || 'Unable to send recovery instructions');
      setAlertVarient('danger');
      hideMessage();
    }
  };

  if (stateAuth?.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <Modal
        show={showChangePwd}
        onHide={() => setShowChangePwd(false)}
        centered
        className="login-change-password-modal"
        contentClassName="login-change-password-content"
      >
        <Modal.Header closeButton className="login-change-password-header">
          <div>
            <Modal.Title>Forgot Password?</Modal.Title>
            <p>Enter your registered email or mobile number to recover your account.</p>
          </div>
        </Modal.Header>
        <Modal.Body className="login-change-password-body">
          <Form onSubmit={handleForgotPassword}>
            <Form.Group className="login-change-password-field">
              <Form.Label>Email or Mobile</Form.Label>
              <Form.Control
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="Enter email or mobile"
                value={cpEmail}
                onChange={(e) => setCpEmail(e.target.value)}
              />
            </Form.Group>
            <Button type="submit" className="login-change-password-submit" disabled={cpLoading}>
              {cpLoading ? 'Sending...' : 'Send Recovery Instructions'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      <Alert
        className="notification"
        variant={alertVarient}
        show={alertShow}
        onClose={() => setAlertShow(false)}
        dismissible
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 9999,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {alertMessage}
      </Alert>

      <div className="login-container-new">
        <style>{`
          .login-container-new {
            position: relative;
            display: flex;
            min-height: 100vh;
            width: 100%;
            background: linear-gradient(180deg, #eef4f9 0%, #f8fafc 100%);
            font-family: 'Inter', sans-serif;
            overflow: hidden;
          }
          .login-change-password-content {
            overflow: hidden;
            border: 0;
            border-radius: 22px;
            box-shadow: 0 24px 70px rgba(15, 23, 42, 0.28);
          }
          .login-change-password-header {
            align-items: flex-start;
            padding: 24px 24px 20px;
            border-bottom: 1px solid #e8eef7;
            background: linear-gradient(135deg, #f2f7ff 0%, #ffffff 72%);
          }
          .login-change-password-header .modal-title {
            color: #17224b;
            font-size: 24px;
            font-weight: 850;
            letter-spacing: -0.025em;
          }
          .login-change-password-header p {
            margin: 6px 30px 0 0;
            color: #64748b;
            font-size: 13px;
            line-height: 1.45;
          }
          .login-change-password-header .btn-close {
            margin: 0;
            padding: 8px;
            border-radius: 50%;
            background-size: 12px;
          }
          .login-change-password-body { padding: 22px 24px 24px; }
          .login-change-password-field { margin-bottom: 18px; }
          .login-change-password-field .form-label {
            margin-bottom: 7px;
            color: #334155;
            font-size: 13px;
            font-weight: 700;
          }
          .login-change-password-field .form-control {
            min-height: 50px;
            padding: 12px 14px;
            border: 1px solid #d6dfec;
            border-radius: 12px;
            background: #f8fbff;
            color: #172033;
            font-size: 16px;
            box-shadow: none;
          }
          .login-change-password-field .form-control:focus {
            border-color: #4672ee;
            background: #ffffff;
            box-shadow: 0 0 0 4px rgba(47, 84, 235, 0.12);
          }
          .login-change-password-field .form-text {
            display: block;
            margin-top: 6px;
            color: #8492a6;
            font-size: 11px;
          }
          .login-change-password-submit {
            width: 100%;
            min-height: 52px;
            margin-top: 2px;
            border: 0;
            border-radius: 12px;
            background: linear-gradient(135deg, #315bea 0%, #34248b 100%);
            font-size: 15px;
            font-weight: 800;
            box-shadow: 0 10px 22px rgba(49, 88, 216, 0.22);
          }
          .login-change-password-submit:hover,
          .login-change-password-submit:focus {
            background: linear-gradient(135deg, #264bd0 0%, #2b1e7b 100%);
          }
          .login-change-password-submit:disabled { opacity: 0.72; }
          .login-container-new:before,
          .login-container-new:after {
            content: '';
            position: absolute;
            width: 40%;
            height: 160px;
            left: -15%;
            border-top: 5px solid #1f62b8;
            border-radius: 50% 50% 0 0;
            transform: rotate(-14deg);
            opacity: 0.95;
          }
          .login-container-new:before {
            top: -34px;
            background: linear-gradient(135deg, #1a2f84 0%, #1c4dba 100%);
          }
          .login-container-new:after {
            content: '';
            width: 40%;
            height: 160px;
            left: auto;
            right: -16%;
            top: -34px;
            transform: rotate(28deg);
            background: linear-gradient(135deg, #102c7e 0%, #244fca 100%);
          }
          .login-page-skyline {
            pointer-events: none;
            position: absolute;
            bottom: -38px;
            left: 0;
            right: 0;
            height: 210px;
            background-image: linear-gradient(180deg, transparent 0%, rgba(120, 169, 255, 0.075) 100%), repeating-linear-gradient(90deg, transparent 0 24px, rgba(30, 64, 175, 0.12) 24px 25px), linear-gradient(180deg, transparent 0%, #e2edf4 80%, #cadbe7 100%);
            clip-path: polygon(0 28%, 0 100%, 100% 100%, 100% 18%, 88% 18%, 88% 100%, 76% 100%, 76% 22%, 64% 22%, 64% 100%, 52% 100%, 52% 30%, 42% 30%, 42% 100%, 30% 100%, 30% 20%, 18% 20%, 18% 100%, 0 100%);
            opacity: 0.88;
          }
          .login-page-skyline:before {
            content: '';
            position: absolute;
            inset: -6px;
            border-top: 1px solid rgba(30, 64, 175, 0.7);
            border-bottom: 1px solid rgba(30, 64, 175, 0.7);
          }
          .login-left-panel-new {
            display: none;
          }
          .login-right-panel-new {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            position: relative;
            z-index: 2;
          }
          .login-auth-shell {
            width: min(100%, 820px);
            max-width: 100%;
            min-width: 0;
            min-height: 620px;
            background: rgba(255,255,255,0.92);
            border-radius: 18px;
            border: 1px solid rgba(255,255,255,0.8);
            box-shadow: 0 20px 55px rgba(63, 91, 151, 0.16);
            padding: 78px 96px 44px;
            position: relative;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .login-auth-shell:before {
            content: '';
            position: absolute;
            top: -8%;
            left: 12%;
            right: 12%;
            height: 76px;
            border-top: 2px solid #b3c9ff;
            border-radius: 50%;
            background: transparent;
          }
          .login-auth-shell:after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 34px;
            background: linear-gradient(180deg, rgba(224, 239, 255, 0.36), rgba(255,255,255,0));
            border-bottom-left-radius: 18px;
            border-bottom-right-radius: 18px;
            opacity: 0.85;
          }
          .login-logo {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 20px;
          }
          .login-logo-core {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: radial-gradient(#295ce8, #183dc2);
            border: 3px solid rgba(255, 255, 255, 0.4);
            box-shadow: 0 0 0 6px #f8fafc, 0 8px 24px rgba(24, 61, 194, 0.25);
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
          }
          .login-logo-core:before {
            content: '';
            position: absolute;
            inset: -8px;
            border-radius: 50%;
            border: 1px dashed rgba(41, 92, 232, 0.3);
          }
          
          .crest-container {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 10px;
          }
          .crest-stars {
            display: flex;
            gap: 4px;
            margin-bottom: 2px;
            align-items: flex-end;
          }
          .crest-stars .center-star {
            margin-bottom: 4px;
          }
          .crest-shield-wrap {
            position: relative;
            width: 60px;
            height: 70px;
          }
          .crest-shield-bg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }
          .crest-icons {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
            z-index: 2;
            margin-top: -2px; /* slight adjustment upwards for optical center */
          }
          .crest-wreath-left, .crest-wreath-right {
            position: absolute;
            top: 40%;
            width: 16px;
            height: 44px;
            border: 1px dashed rgba(255, 255, 255, 0.6);
            border-radius: 50%;
          }
          .crest-wreath-left {
            left: -18px;
            border-right: none;
            border-top: none;
            transform: rotate(20deg);
          }
          .crest-wreath-right {
            right: -18px;
            border-left: none;
            border-top: none;
            transform: rotate(-20deg);
          }
          .login-welcome {
            text-align: center;
            margin-bottom: 34px;
          }
          .login-welcome h1 {
            margin: 0 0 8px;
            font-size: clamp(34px, 3.4vw, 48px);
            line-height: 1;
            color: #17224b;
            font-weight: 900;
            letter-spacing: -0.04em;
          }
          .login-welcome p {
            margin: 0;
            font-size: 24px;
            color: #526a88;
            line-height: 1.35;
          }
          .login-form-wrap {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .login-input-group {
            width: 100%;
            min-width: 0;
            max-width: 100%;
            display: flex;
            align-items: stretch;
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            overflow: hidden;
            background-color: #fff;
            transition: all 0.2s ease-in-out;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          .login-input-group:focus-within {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
          }
          .login-input-group .login-input-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 46px;
            background-color: #eef7ff;
            color: #2f54eb;
            border-right: 1px solid #d6e9f7;
          }
          .login-input-group input {
            flex: 1;
            border: none;
            outline: none;
            padding: 0.82rem 1rem;
            font-size: 0.925rem;
            color: #0f172a;
            background-color: transparent;
          }
          .login-input-group .login-password-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0 1rem;
            border: 0;
            background: transparent;
            cursor: pointer;
            color: #94a3b8;
          }
          .login-input-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            color: #536878;
            margin-bottom: 12px;
          }
          .login-remember {
            display: inline-flex;
            align-items: center;
            gap: 8px;
          }
          .login-remember input {
            accent-color: #2f54eb;
          }
          .login-forgot {
            color: #2a6eca;
            font-weight: 700;
          }
          .login-btn-primary {
            background: linear-gradient(135deg, #1d357f 0%, #34248b 100%);
            color: #fff;
            border: none;
            border-radius: 12px;
            font-weight: 800;
            padding: 0.86rem 1.5rem;
            width: 100%;
            transition: all 0.2s ease-in-out;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(47, 84, 235, 0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
          }
          .login-btn-primary:hover {
            background: linear-gradient(135deg, #13255a 0%, #261f7a 100%);
          }
          .login-btn-primary:disabled {
            background-color: #adc6ff;
            cursor: not-allowed;
          }
          .login-action-arrow {
            font-size: 26px;
            line-height: 1;
          }
          .login-divider {
            display: flex;
            align-items: center;
            gap: 12px;
            margin: 24px 0 12px;
            color: #526a88;
            font-weight: 700;
          }
          .login-divider:before,
          .login-divider:after {
            content: '';
            flex: 1;
            height: 1px;
            background: #bfd3ee;
          }
          .login-admin-btn {
            width: 100%;
            border-radius: 12px;
            border: 1px solid #2b64c3;
            background: transparent;
            color: #233d66;
            padding: 12px 20px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
          }
          .login-admin-btn .admin-icon {
            margin-right: 8px;
          }
          .login-footer-band {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            margin-top: 54px;
            color: #486976;
            font-size: 13px;
            font-weight: 700;
          }
          .login-footer-band .shield {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2a59a1 0%, #7acef9 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 17px;
          }
          @media (max-width: 768px) {
            .login-change-password-modal { padding-left: 0 !important; }
            .login-change-password-modal .modal-dialog {
              align-items: flex-end;
              min-height: 100%;
              margin: 0;
            }
            .login-change-password-content {
              border-radius: 24px 24px 0 0;
              padding-bottom: env(safe-area-inset-bottom);
            }
            .login-change-password-header { padding: 22px 20px 18px; }
            .login-change-password-header .modal-title { font-size: 22px; }
            .login-change-password-body { padding: 20px; }
            .login-container-new {
              min-height: 100vh;
              min-height: 100dvh;
              overflow-x: hidden;
              overflow-y: auto;
            }
            .login-container-new:before,
            .login-container-new:after {
              width: 72%;
              height: 96px;
              top: -42px;
              opacity: 0.9;
            }
            .login-container-new:before {
              left: -36%;
              transform: rotate(-12deg);
            }
            .login-container-new:after {
              right: -38%;
              transform: rotate(25deg);
            }
            .login-page-skyline {
              position: fixed;
              bottom: -72px;
              height: 170px;
              opacity: 0.5;
            }
            .login-right-panel-new {
              justify-content: center;
              min-height: 100vh;
              min-height: 100dvh;
              padding: max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom));
            }
            .login-auth-shell {
              width: 100%;
              max-width: 440px;
              min-height: auto;
              margin: 0;
              padding: 32px 24px 26px;
              border-radius: 20px;
              box-shadow: 0 14px 40px rgba(63, 91, 151, 0.14);
            }
            .login-auth-shell:before {
              top: -22px;
              left: 16%;
              right: 16%;
              height: 48px;
            }
            .login-logo {
              margin-bottom: 18px;
            }
            .login-logo-core {
              width: 104px;
              height: 104px;
            }
            .crest-container { transform: scale(0.82); }
            .login-welcome { margin-bottom: 28px; }
            .login-welcome h1 {
              font-size: clamp(30px, 10vw, 40px);
              line-height: 1.05;
            }
            .login-welcome p { font-size: clamp(16px, 4.8vw, 20px); }
            .login-form-wrap { gap: 14px; }
            .login-input-group .login-input-icon {
              width: 44px;
              flex: 0 0 44px;
            }
            .login-input-group input {
              min-width: 0;
              padding: 0.78rem 0.85rem;
              font-size: 16px;
            }
            .login-password-toggle { flex: 0 0 44px; }
            .login-input-row {
              gap: 16px;
              margin-bottom: 8px;
              font-size: 12px;
            }
            .login-forgot {
              text-align: right;
              white-space: nowrap;
            }
            .login-btn-primary {
              min-height: 50px;
              padding: 0.75rem 1.25rem;
            }
            .login-footer-band {
              margin-top: 34px;
              gap: 8px;
              font-size: 11px;
              text-align: center;
              line-height: 1.35;
              position: relative;
              z-index: 1;
            }
            .login-footer-band .shield {
              width: 34px;
              height: 34px;
              flex: 0 0 34px;
            }
          }
          @media (max-width: 390px) {
            .login-right-panel-new { padding-inline: 12px; }
            .login-auth-shell { padding: 28px 18px 22px; }
            .login-logo-core { width: 92px; height: 92px; }
            .login-welcome { margin-bottom: 22px; }
            .login-welcome h1 { font-size: 30px; }
            .login-welcome p { font-size: 16px; }
            .login-input-row { align-items: flex-start; }
            .login-footer-band { margin-top: 26px; }
          }
          @media (max-width: 768px) and (min-height: 760px) {
            .login-auth-shell {
              padding-block: 38px 32px;
            }
            .login-logo-core {
              width: 112px;
              height: 112px;
            }
            .login-footer-band { margin-top: 38px; }
          }
          @media (max-width: 350px) {
            .login-input-row {
              flex-direction: column;
              gap: 10px;
            }
            .login-forgot { align-self: flex-end; }
          }
          @media (max-height: 700px) and (max-width: 768px) {
            .login-right-panel-new { padding-block: 12px; }
            .login-auth-shell {
              margin: 0;
              padding-top: 22px;
              padding-bottom: 18px;
            }
            .login-logo { margin-bottom: 12px; }
            .login-logo-core { width: 82px; height: 82px; }
            .crest-container { transform: scale(0.68); }
            .login-welcome { margin-bottom: 18px; }
            .login-footer-band { margin-top: 20px; }
          }
        `}</style>

        <div className="login-page-skyline" />

        <div className="login-right-panel-new">
          <div className="login-auth-shell">
            <div className="login-logo">
              <div className="login-logo-core">
                <div className="crest-container">
                  <div className="crest-stars">
                    <FaStar size={12} color="#fff" />
                    <FaStar size={16} color="#fff" className="center-star" />
                    <FaStar size={12} color="#fff" />
                  </div>
                  <div className="crest-shield-wrap">
                    <BsShield className="crest-shield-bg" color="#fff" size="100%" />
                    <div className="crest-icons">
                      <FaGraduationCap size={26} color="#fff" />
                      <FaBookOpen size={14} color="#fff" />
                    </div>
                  </div>
                  <div className="crest-wreath-left"></div>
                  <div className="crest-wreath-right"></div>
                </div>
              </div>
            </div>

            <div className="login-welcome">
              <h1>Welcome Back!</h1>
              <p>Login to access your account</p>
            </div>

            <div className="login-form-wrap">
              <div>
                <div className={`login-input-group ${emailError ? 'error' : ''}`} style={emailError ? { borderColor: '#ef4444' } : {}}>
                  <div className="login-input-icon">
                    <FaUserAlt size={14} />
                  </div>
                  <input
                    id="email"
                    type="text"
                    placeholder="Mobile Number / Username"
                    value={email}
                    onChange={handleChange}
                    onKeyDown={loginEnter}
                  />
                </div>
                {emailError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', textAlign: 'left', fontWeight: 500 }}>
                    {emailError}
                  </div>
                )}
              </div>

              <div>
                <div className={`login-input-group ${passwordError ? 'error' : ''}`} style={passwordError ? { borderColor: '#ef4444' } : {}}>
                  <div className="login-input-icon">
                    <FaLock size={14} />
                  </div>
                  <input
                    id="pswrd"
                    type={showPassword ? 'password' : 'text'}
                    placeholder="Password"
                    value={password}
                    onChange={handleChange}
                    onKeyDown={loginEnter}
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={showHidePassword}
                    aria-label={showPassword ? 'Show password' : 'Hide password'}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {passwordError && (
                  <div style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '0.35rem', textAlign: 'left', fontWeight: 500 }}>
                    {passwordError}
                  </div>
                )}
              </div>

              <div className="login-input-row">
                <label className="login-remember">
                  <input type="checkbox" />
                  Remember me
                </label>
              </div>

              <button className="login-btn-primary" onClick={handleSubmit} disabled={isLoading}>
                <span>{isLoading ? 'Logging In...' : 'Login'}</span>
                <span className="login-action-arrow">→</span>
              </button>

              <InstallAppButton />

              {/* <div className="login-divider"><span>OR</span></div> */}

              {/* <button className="login-admin-btn">
                <span className="admin-icon"><FaUniversity size={14} /></span>
                Login as Admin
              </button> */}
            </div>

            <div className="login-footer-band">
              <span className="shield">♢</span>
              <span>Secure | Reliable | Smart School Management</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
