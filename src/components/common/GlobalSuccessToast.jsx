import React, { useEffect, useRef, useState } from 'react';
import { FaCheckCircle, FaTimes } from 'react-icons/fa';
import { API_SUCCESS_EVENT } from '../../services/commonUtills/helperAxios';

function GlobalSuccessToast() {
  const [message, setMessage] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    const showMessage = (event) => {
      window.clearTimeout(timerRef.current);
      setMessage(event.detail?.message || 'Saved successfully.');
      timerRef.current = window.setTimeout(() => setMessage(''), 3000);
    };
    window.addEventListener(API_SUCCESS_EVENT, showMessage);
    return () => {
      window.removeEventListener(API_SUCCESS_EVENT, showMessage);
      window.clearTimeout(timerRef.current);
    };
  }, []);

  if (!message) return null;
  return (
    <div className="global-success-toast" role="status" aria-live="polite">
      <FaCheckCircle />
      <span>{message}</span>
      <button type="button" onClick={() => setMessage('')} aria-label="Close success message">
        <FaTimes />
      </button>
    </div>
  );
}

export default GlobalSuccessToast;
