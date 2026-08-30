const INDIA_TIME_ZONE = 'Asia/Kolkata';

export const getIndiaGreeting = (date = new Date()) => {
  const hourPart = new Intl.DateTimeFormat('en-IN', {
    timeZone: INDIA_TIME_ZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date).find(({ type }) => type === 'hour');
  const hour = Number(hourPart?.value);

  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};
