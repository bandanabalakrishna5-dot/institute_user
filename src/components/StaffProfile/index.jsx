import React, { useEffect, useState, useContext } from 'react';
import { Container, Card, Spinner } from 'react-bootstrap';
import { FaArrowLeft, FaChalkboardTeacher } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import { AuthContext } from '../../App';
import { fetchStaffProfileById } from '../../services/LoginServices/loginServices';

const StaffLabels = {
  stfnm: 'Staff Name',
  stfrolid: 'Roll ID',
  dob: 'Date of Birth',
  bldgrp: 'Blood Group',
};

function StaffProfile() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      if (user.stfid) {
        const res = await fetchStaffProfileById({ stfid: user.stfid });
        if (res && res.status === 'success' && res.payload && res.payload.length > 0) {
          setProfile(res.payload[0]);
        } else {
          setErrorMsg(res?.error?.message || 'Staff profile not found');
        }
      } else {
        setErrorMsg('Staff details are not available for this account.');
      }
      setLoading(false);
    };
    load();
  }, [user.stfid]);

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
            <div><span>ACCOUNT</span><h1>Staff Profile</h1></div>
            <span className="user-profile-role-badge"><FaChalkboardTeacher /> Staff</span>
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
                      alt="staff"
                      className="user-profile-photo"
                    />
                  ) : (
                    <div className="user-profile-photo user-profile-initial">
                      {(profile.stfnm || 'U').charAt(0)}
                    </div>
                  )}
                  <div><span>STAFF MEMBER</span><h2>{profile.stfnm}</h2></div>
                </div>
                <div className="user-profile-details">
                  {Object.entries(StaffLabels).map(([k, label]) => (
                    <div className="user-profile-detail-row" key={k}>
                      <span>{label}</span>
                      <strong>
                        {k === 'dob' && profile[k]
                          ? new Date(profile[k]).toLocaleDateString()
                          : profile[k] != null && String(profile[k]).trim() ? String(profile[k]) : '—'}
                      </strong>
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

export default StaffProfile;
