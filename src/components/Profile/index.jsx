import React, { useEffect, useState, useContext } from 'react';
import { Container, Card, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import { AuthContext } from '../../App';
import { fetchStudentProfileById } from '../../services/LoginServices/loginServices';

const StudentLabels = {
  stdnm: 'Student Name',
  cls: 'Class',
  clssec: 'Section',
  strid: 'Roll ID',
  dob: 'Date of Birth',
  bdgrp: 'Blood Group',
  ftrnm: 'Father Name',
  mtrnm: 'Mother Name',
};

function Profile() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (user.stdid) {
        const res = await fetchStudentProfileById({ stdid: user.stdid });
        if (res && res.status === 'success' && res.payload && res.payload.length > 0) {
          setProfile(res.payload[0]);
        } else {
          setErrorMsg(res?.error?.message || 'Student profile not found');
        }
      } else {
        setErrorMsg('Student details are not available for this account.');
      }
      setLoading(false);
    };
    load();
  }, [user.stdid]);

  return (
    <Layout>
      <Container className="user-profile-page py-4">
        <button
          type="button"
          className="user-profile-back"
          onClick={() => navigate('/dashboard')}
        >
          <FaArrowLeft /> <span>Dashboard</span>
        </button>

        <Card className="user-profile-card">
          <Card.Header className="user-profile-card-header">
            <div><span>ACCOUNT</span><h1>My Profile</h1></div>
            <span className="user-profile-role-badge"><FaGraduationCap /> Student</span>
          </Card.Header>
          <Card.Body className="user-profile-card-body">
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : errorMsg ? (
              <div className="text-center text-muted py-4">{errorMsg}</div>
            ) : (
              <>
                <div className="user-profile-hero">
                  {profile.pturl ? (
                    <img
                      src={profile.pturl}
                      alt="student"
                      className="user-profile-photo"
                    />
                  ) : (
                    <div className="user-profile-photo user-profile-initial">
                      {(profile.stdnm || 'U').charAt(0)}
                    </div>
                  )}
                  <div><span>STUDENT</span><h2>{profile.stdnm}</h2></div>
                </div>
                <div className="user-profile-details">
                  {Object.entries(StudentLabels).map(([k, label]) => (
                    <div className="user-profile-detail-row" key={k}>
                      <span>{label}</span>
                      <strong>{profile[k] != null && String(profile[k]).trim() ? String(profile[k]) : '—'}</strong>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
}

export default Profile;
