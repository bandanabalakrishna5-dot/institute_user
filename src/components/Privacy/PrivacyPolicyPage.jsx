import React from 'react';
import { FaArrowLeft, FaShieldAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function PrivacyPolicyPage() {
  const navigate = useNavigate();
  return (
    <main className="privacy-policy-page">
      <article className="privacy-policy-card">
        <header>
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back"><FaArrowLeft /></button>
          <span><FaShieldAlt /></span>
          <div><small>PRIVACY</small><h1>Privacy Policy</h1></div>
        </header>
        <p className="privacy-policy-updated">Last updated: 10 September 2026</p>

        <h2>Information we process</h2>
        <p>The app processes account and school information supplied by the institute, including names, contact details, attendance, homework, timetable, marks, fees, leave requests, notifications and uploaded study materials.</p>

        <h2>Location information</h2>
        <p>Precise device location is requested only for live bus tracking. A driver’s location is shared with students assigned to that transport while the driver has activated tracking. A student’s location is used on the device to calculate and display the route and distance to the bus.</p>

        <h2>How information is used</h2>
        <p>Information is used to authenticate users, provide institute services, maintain academic and attendance records, deliver notifications, and operate live transport tracking. It is not used for advertising or sold to third parties.</p>

        <h2>Sharing and security</h2>
        <p>Information may be processed by infrastructure providers needed to operate the service. Network communication uses encryption in transit. Access is limited according to the user’s institute role.</p>

        <h2>Retention and deletion</h2>
        <p>Records are retained according to the institute’s administrative and legal requirements. Users or guardians may contact their institute administrator to request access, correction or deletion where applicable.</p>

        <h2>Children and families</h2>
        <p>This is a school-managed service. Student accounts and information are administered by the institute and, where applicable, used under the direction of a parent, guardian or authorized school representative.</p>

        <h2>Contact</h2>
        <p>For privacy questions or account-data requests, contact the institute administration shown in your account or school communications.</p>
      </article>
    </main>
  );
}

export default PrivacyPolicyPage;
