import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Spinner } from 'react-bootstrap';
import {
  FaArrowLeft,
  FaBook,
  FaBus,
  FaCalendarCheck,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaGraduationCap,
  FaTshirt,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import {
  fetchStudentFeeSummary,
  fetchStudentPaymentDates,
} from '../../services/FeeServices/feeServices';
import Layout from '../common/Layout';

const feeTypes = [
  { key: 'institute', label: 'School Fee', icon: <FaGraduationCap />, color: 'blue' },
  { key: 'transport', label: 'Transport Fee', icon: <FaBus />, color: 'cyan' },
  { key: 'uniform', label: 'Uniform Fee', icon: <FaTshirt />, color: 'violet' },
  { key: 'book', label: 'Books Fee', icon: <FaBook />, color: 'orange' },
];

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

const amount = (value) => Number(value) || 0;

const formatDate = (value) => {
  if (!value) return 'Not specified';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

function StudentFeeDetails() {
  const { stateAuth } = useContext(AuthContext);
  const user = stateAuth?.user || {};
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [paymentsByType, setPaymentsByType] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayments, setExpandedPayments] = useState({});

  const togglePaymentDetails = (feeKey) => {
    setExpandedPayments((current) => ({
      ...current,
      [feeKey]: !current[feeKey],
    }));
  };

  const loadFeeSummary = useCallback(async () => {
    if (!user.stdid || !user.instid || !user.brcid || !user.clsid || !user.acdmcyr) {
      setError('Student fee information is not available for this account.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = {
        stdid: user.stdid,
        instid: user.instid,
        brcid: user.brcid,
        clsid: user.clsid,
        acdmcyr: user.acdmcyr,
      };
      const [response, paymentDatesResponse] = await Promise.all([
        fetchStudentFeeSummary(params),
        fetchStudentPaymentDates(params),
      ]);
      if (response?.status !== 'success' || !response?.payload) {
        throw new Error(response?.error?.message || 'Unable to load fee details.');
      }
      setSummary(response.payload);
      const paymentPayload = paymentDatesResponse?.status === 'success'
        ? paymentDatesResponse.payload || {}
        : {};
      setPaymentsByType(feeTypes.reduce((result, feeType) => {
        const records = Array.isArray(paymentPayload[feeType.key])
          ? paymentPayload[feeType.key]
          : paymentPayload[feeType.key] ? [paymentPayload[feeType.key]] : [];
        result[feeType.key] = records
          .filter((payment) => payment?.pddt)
          .sort((first, second) => {
            const installmentDifference = amount(first.noofinst) - amount(second.noofinst);
            return installmentDifference || new Date(first.pddt) - new Date(second.pddt);
          })
          .slice(0, 4);
        return result;
      }, {}));
    } catch (requestError) {
      setError(requestError?.message || 'Unable to load fee details.');
    } finally {
      setLoading(false);
    }
  }, [user.acdmcyr, user.brcid, user.clsid, user.instid, user.stdid]);

  useEffect(() => {
    loadFeeSummary();
  }, [loadFeeSummary]);

  const fees = useMemo(() => feeTypes.map((type) => {
    const details = summary?.[type.key] || {};
    return {
      ...type,
      total: amount(details.tlfee),
      paid: amount(details.pdfee),
      pending: amount(details.pndfee ?? details.pndingfee),
      dueDate: details.dudt,
    };
  }), [summary]);

  const totals = useMemo(() => fees.reduce((result, fee) => ({
    total: result.total + fee.total,
    paid: result.paid + fee.paid,
    pending: result.pending + fee.pending,
  }), { total: 0, paid: 0, pending: 0 }), [fees]);

  return (
    <Layout>
      <div className="fee-details-page">
        <div className="fee-details-shell">
          <header className="fee-details-header">
            <button type="button" className="hw-icon-btn" onClick={() => navigate('/dashboard')} aria-label="Go back">
              <FaArrowLeft />
            </button>
            <div>
              <span className="hw-kicker">Academic year {user.acdmcyr || ''}</span>
              <h1>Fee Details</h1>
              <p>{summary?.name || user.stdnm || 'Student'}</p>
            </div>
          </header>

          {error && (
            <Alert variant="danger" className="fee-details-alert">
              <span>{error}</span>
              <button type="button" onClick={loadFeeSummary}>Retry</button>
            </Alert>
          )}

          {loading && (
            <div className="fee-details-loading">
              <Spinner animation="border" size="sm" /> Loading fee details...
            </div>
          )}

          {!loading && !error && summary && (
            <>
              <section className="fee-overview-card">
                <div>
                  <span>Total pending</span>
                  <strong>{currency.format(totals.pending)}</strong>
                  <small>of {currency.format(totals.total)} total fee</small>
                </div>
                <div className={`fee-status-badge ${totals.pending === 0 ? 'paid' : 'pending'}`}>
                  {totals.pending === 0 ? <FaCheckCircle /> : <FaClock />}
                  {totals.pending === 0 ? 'Fully paid' : 'Payment pending'}
                </div>
                <div className="fee-progress" aria-label={`${totals.total ? Math.round((totals.paid / totals.total) * 100) : 0}% paid`}>
                  <span style={{ width: `${totals.total ? Math.min((totals.paid / totals.total) * 100, 100) : 0}%` }} />
                </div>
                <div className="fee-overview-meta">
                  <span><small>Paid</small><strong>{currency.format(totals.paid)}</strong></span>
                  <span><small>Total</small><strong>{currency.format(totals.total)}</strong></span>
                </div>
              </section>

              <div className="fee-details-list">
                {fees.map((fee) => (
                  <article className="fee-detail-card" key={fee.key}>
                    <div className={`fee-detail-icon ${fee.color}`}>{fee.icon}</div>
                    <div className="fee-detail-main">
                      <div className="fee-detail-title">
                        <div><h2>{fee.label}</h2><span>Due: {formatDate(fee.dueDate)}</span></div>
                        <strong>{currency.format(fee.pending)}</strong>
                      </div>
                      <div className="fee-detail-amounts">
                        <span><small>Total fee</small>{currency.format(fee.total)}</span>
                        <span><small>Paid</small>{currency.format(fee.paid)}</span>
                        <span className={fee.pending > 0 ? 'pending' : 'paid'}>
                          <small>Pending</small>{currency.format(fee.pending)}
                        </span>
                      </div>
                      {paymentsByType[fee.key]?.length > 0 && (
                        <div className="fee-payment-dates">
                          <button
                            type="button"
                            className="fee-payment-toggle"
                            aria-expanded={Boolean(expandedPayments[fee.key])}
                            onClick={() => togglePaymentDetails(fee.key)}
                          >
                            <span><FaCalendarCheck /> Payment details</span>
                            <FaChevronDown className={expandedPayments[fee.key] ? 'expanded' : ''} />
                          </button>
                          {expandedPayments[fee.key] && (
                            <div className="fee-payment-list">
                              {paymentsByType[fee.key].map((payment, index) => (
                                <span key={`${payment.noofinst || index}-${payment.pddt}`}>
                                  <small>{payment.noofinst ? `Installment ${payment.noofinst}` : `Payment ${index + 1}`}</small>
                                  <strong>{formatDate(payment.pddt)}</strong>
                                  <small>Paid: {currency.format(amount(payment.pdfee))}</small>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default StudentFeeDetails;
