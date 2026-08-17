import React, { useEffect, useState, useContext } from 'react';
import { Container, Card, Table, Badge, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Layout from '../common/Layout';
import { AuthContext } from '../../App';
import { fetchStaffProfileById } from '../../services/LoginServices/loginServices';

const StaffLabels = {
  stfid: 'Staff ID',
  stfnm: 'Staff Name',
  stfrolid: 'Roll ID',
  dob: 'Date of Birth',
  bldgrp: 'Blood Group',
  ctno: 'Mobile',
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
      <Container className="py-4">
        <button
          className="btn btn-sm btn-light mb-3"
          onClick={() => navigate('/dashboard')}
        >
          ← Back to Dashboard
        </button>

        <Card className="shadow-sm">
          <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Staff Profile</h5>
            <Badge bg="light" text="dark">Staff</Badge>
          </Card.Header>
          <Card.Body>
            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : errorMsg ? (
              <div className="text-center text-muted py-4">{errorMsg}</div>
            ) : (
              <>
                <div className="text-center mb-3">
                  {profile.pturl ? (
                    <img
                      src={profile.pturl}
                      alt="staff"
                      className="rounded-circle"
                      style={{ width: '140px', height: '140px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle d-inline-flex align-items-center justify-content-center"
                      style={{
                        width: '140px',
                        height: '140px',
                        backgroundColor: '#eff6ff',
                        color: '#2f54eb',
                        fontSize: '3rem',
                      }}
                    >
                      {(profile.stfnm || 'U').charAt(0)}
                    </div>
                  )}
                  <h5 className="mt-3 font-weight-bold">{profile.stfnm}</h5>
                </div>
                <Table striped hover responsive size="sm">
                  <tbody>
                    {Object.entries(StaffLabels).map(([k, label]) => (
                      <tr key={k}>
                        <td style={{ width: '40%', fontWeight: 600 }}>{label}</td>
                        <td>
                          {k === 'dob' && profile[k] 
                            ? new Date(profile[k]).toLocaleDateString()
                            : profile[k] != null ? String(profile[k]) : '—'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </>
            )}
          </Card.Body>
        </Card>
      </Container>
    </Layout>
  );
}

export default StaffProfile;