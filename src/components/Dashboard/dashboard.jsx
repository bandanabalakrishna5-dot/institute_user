import React, { useContext } from 'react';
import { Container } from 'react-bootstrap';
import Layout from '../common/Layout';
import { AuthContext } from '../../App';
import StudentDashboard from './StudentDashboard';
import StaffDashboard from './StaffDashboard';
import TransportDashboard from './TransportDashboard';

function DashBoard() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const typ = (user.typ || '').toUpperCase();

  return (
    <Layout>
      <Container fluid className="px-3 py-4">
        {typ === 'STUDENT' ? (
          <StudentDashboard user={user} />
        ) : typ === 'STAFF' ? (
          <StaffDashboard user={user} />
        ) : typ === 'TRANSPORT' ? (
          <TransportDashboard user={user} />
        ) : (
          <div className="text-center mt-5">
            <h4>Welcome to the Portal</h4>
            <p>Role not recognized or not authorized.</p>
          </div>
        )}
      </Container>
    </Layout>
  );
}

export default DashBoard;
