import React, { useContext } from 'react';
import { Container } from 'react-bootstrap';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import Layout from '../common/Layout';
import UpcomingHolidays from '../Dashboard/UpcomingHolidays';

function HolidaysPage() {
  const { stateAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const user = stateAuth?.user || {};

  return (
    <Layout>
      <Container className="holidays-page py-4">
        <button type="button" className="user-profile-back" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft /> <span>Dashboard</span>
        </button>
        <UpcomingHolidays user={user} />
      </Container>
    </Layout>
  );
}

export default HolidaysPage;
