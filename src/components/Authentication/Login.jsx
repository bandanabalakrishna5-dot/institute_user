import React, { useState, useEffect, useContext } from 'react';
import { Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { loginUserValidate } from './operation';
import { FaEye, FaEyeSlash, FaLock, FaUserAlt } from 'react-icons/fa';
import { emailValidation } from '../../services/commonUtills/FormValidations';
import { AuthContext } from '../../App';

const initialState = {
  emlid: '',
  pswrd: '',
};

function Login() {
  const { dispatchAuth } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [alertShow, setAlertShow] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVarient, setAlertVarient] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // password or otp
  const navigate = useNavigate();

  useEffect(() => {
    dispatchAuth({ type: 'LOGOUT' });
  }, [dispatchAuth]);

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

  return (
    <>
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
            width: 150px;
            height: 150px;
            border-radius: 50%;
            background: radial-gradient(#fbfaff, #b0d2ff);
            border: 4px solid #d6eaff;
            box-shadow: inset 0 0 0 6px #f8fbff, 0 0 12px rgba(45, 115, 231, 0.15);
            background-image: radial-gradient(circle at center, #1e56d7 0%, #6ad6f6 55%, #effaff 100%);
            position: relative;
          }
          .login-logo-core:before {
            content: '';
            position: absolute;
            inset: -10px;
            border-radius: 50%;
            border: 2px dashed #c4d8ff;
          }
          .login-logo-core:after {
            content: '✳';
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 88px;
            height: 88px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2a60e6, #49bde6);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 36px;
            font-weight: 900;
            box-shadow: inset 0 0 0 4px #fcfdff;
            opacity: 0.95;
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
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .login-input-group {
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
            .login-right-panel-new {
              padding: 1rem;
            }
            .login-auth-shell {
              padding: 36px 24px;
              min-height: auto;
            }
            .login-logo-core {
              width: 118px;
              height: 118px;
            }
          }
        `}</style>

        <div className="login-page-skyline" />

        <div className="login-right-panel-new">
          <div className="login-auth-shell">
            <div className="login-logo">
              <div className="login-logo-core" aria-hidden="true" />
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
                    type={loginMethod === 'otp' ? 'text' : (showPassword ? 'password' : 'text')}
                    placeholder={loginMethod === 'otp' ? 'Enter OTP' : 'Password'}
                    value={password}
                    onChange={handleChange}
                    onKeyDown={loginEnter}
                  />
                  {loginMethod === 'password' && (
                    <div className="login-password-toggle" onClick={showHidePassword}>
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <span 
                    style={{ fontSize: 12, color: '#2a6eca', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => setLoginMethod(loginMethod === 'password' ? 'otp' : 'password')}
                  >
                    {loginMethod === 'password' ? 'Login with OTP' : 'Login with Password'}
                  </span>
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
                <span className="login-forgot">Forgot Password?</span>
              </div>

              <button className="login-btn-primary" onClick={handleSubmit} disabled={isLoading}>
                <span>{isLoading ? 'Logging In...' : 'Login'}</span>
                <span className="login-action-arrow">→</span>
              </button>

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
