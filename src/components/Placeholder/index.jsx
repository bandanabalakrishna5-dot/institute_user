import React from 'react';
import Layout from '../common/Layout';
import { Container } from 'react-bootstrap';

export const ClassesPlaceholder = () => (
  <Layout>
    <Container className="p-4 text-center mt-5">
      <h2>Classes Module</h2>
      <p>This is a placeholder for the classes module.</p>
    </Container>
  </Layout>
);

export const AttendancePlaceholder = () => (
  <Layout>
    <Container className="p-4 text-center mt-5">
      <h2>Attendance Module</h2>
      <p>This is a placeholder for the attendance module.</p>
    </Container>
  </Layout>
);

export const StudentsPlaceholder = () => (
  <Layout>
    <Container className="p-4 text-center mt-5">
      <h2>Students Module</h2>
      <p>This is a placeholder for the students module.</p>
    </Container>
  </Layout>
);
