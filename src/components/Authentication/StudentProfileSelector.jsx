import React, { useContext } from 'react';
import { FaGraduationCap, FaUserCircle } from 'react-icons/fa';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';

function StudentProfileSelector() {
  const { stateAuth, dispatchAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const profiles = stateAuth?.studentProfiles || [];

  if (!stateAuth?.isAuthenticated) return <Navigate to="/" replace />;
  if (profiles.length < 2) return <Navigate to="/dashboard" replace />;

  const selectProfile = (student) => {
    dispatchAuth({ type: 'SELECT_STUDENT', payload: { user: student } });
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="student-selector-page">
      <section className="student-selector-card">
        <div className="student-selector-heading">
          <span><FaGraduationCap /></span>
          <div><h1>Choose Student Profile</h1><p>Select a student to continue.</p></div>
        </div>
        <div className="student-profile-list">
          {profiles.map((student) => (
            <button type="button" className="student-profile-option" key={student.stdid} onClick={() => selectProfile(student)}>
              <span className="student-profile-avatar">{student.pturl ? <img src={student.pturl} alt="" /> : <FaUserCircle />}</span>
              <span className="student-profile-copy"><strong>{student.stdnm}</strong><small>{[student.clsnm, student.secnm].filter(Boolean).join(' • ')}</small><small>{student.stdrolid}</small></span>
              <span className="student-profile-open">Continue</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export default StudentProfileSelector;
