//utils/wellness.ts
export const fetchDailyAffirmation = async (setDailyAffirmation) => {
  try {
    const response = await fetch('/api/daily-affirmation');
    if (response.ok) {
      const data = await response.json();
      setDailyAffirmation(data.affirmation || 'Stay positive and focused today.');
    }
  } catch (error) {
    console.error('Failed to fetch daily affirmation:', error);
    setDailyAffirmation('Today is a new opportunity to grow and learn.');
  }
};

export const fetchHoroscope = async (setHoroscopeText, sign = 'aries') => {
  try {
    const response = await fetch('/api/horoscope', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sign })
    });

    if (response.ok) {
      const data = await response.json();
      setHoroscopeText(data.horoscope);
    } else {
      setHoroscopeText('Your stars are aligning for a day of growth and positive energy.');
    }
  } catch (error) {
    setHoroscopeText('Today brings opportunities for reflection and personal development.');
  }
};

export const fetchWeeklySummary = async (setWeeklySummary) => {
  try {
    const response = await fetch('/api/weekly-summary');
    if (response.ok) {
      const data = await response.json();
      setWeeklySummary(data.summary || 'Your therapeutic journey continues to evolve positively.');
    }
  } catch (error) {
    console.error('Failed to fetch weekly summary:', error);
    setWeeklySummary('Focus on your mental wellness and personal growth this week.');
  }
};
