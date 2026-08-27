import React, { useEffect, useState } from 'react';
import { Card, Spinner } from 'react-bootstrap';
import { FaCalendarAlt } from 'react-icons/fa';
import { fetchInstituteHolidays } from '../../services/HolidayServices/holidayServices';

const dateValue = (value = '') => {
  const [day, month, year] = String(value).split('-').map(Number);
  return day && month && year ? new Date(year, month - 1, day).getTime() : 0;
};

const holidayDateLabel = (holiday) => (
  holiday.todt && holiday.todt !== holiday.frmdt
    ? `${holiday.frmdt} – ${holiday.todt}`
    : holiday.frmdt
);

function UpcomingHolidays({ user }) {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadHolidays = async () => {
      if (!user.instid || !user.brcid || !user.acdmcyr) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetchInstituteHolidays({
          instid: user.instid,
          brcid: user.brcid,
          acdmcyr: user.acdmcyr,
          typ: String(user.typ || 'STUDENT').toUpperCase(),
        });
        if (!active) return;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const upcoming = response?.status === 'success' && Array.isArray(response.payload)
          ? response.payload
            .filter((holiday) => dateValue(holiday.todt || holiday.frmdt) >= startOfToday.getTime())
            .sort((left, right) => dateValue(left.frmdt) - dateValue(right.frmdt))
            .slice(0, 3)
          : [];
        setHolidays(upcoming);
      } catch (error) {
        if (active) setHolidays([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadHolidays();
    return () => { active = false; };
  }, [user.acdmcyr, user.brcid, user.instid, user.typ]);

  return (
    <>
      <div className="staff-section-heading upcoming-holidays-heading" id="upcoming-holidays">
        <div><span>SCHOOL CALENDAR</span><h6 className="feed-title">Upcoming Holidays</h6></div>
        {holidays.length > 0 && <small>{holidays.length} upcoming</small>}
      </div>
      <Card className="feed-card upcoming-holidays-card mb-4">
        <Card.Body>
          {loading ? (
            <div className="upcoming-holidays-empty"><Spinner animation="border" size="sm" /> Loading holidays...</div>
          ) : holidays.length ? (
            <div className="upcoming-holidays-list">
              {holidays.map((holiday, index) => (
                <div className="upcoming-holiday-row" key={holiday.insthldid || index}>
                  <span className="upcoming-holiday-icon"><FaCalendarAlt /></span>
                  <span className="upcoming-holiday-copy">
                    <strong>{holiday.desc || 'School Holiday'}</strong>
                    <small>{holidayDateLabel(holiday)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : <div className="upcoming-holidays-empty"><FaCalendarAlt /> No upcoming holidays</div>}
        </Card.Body>
      </Card>
    </>
  );
}

export default UpcomingHolidays;
