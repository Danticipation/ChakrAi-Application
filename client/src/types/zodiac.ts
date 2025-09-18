export interface ZodiacSign {
  id: string;
  name: string;
  symbol: string;
  emoji: string;
  element: string;
  dates: string;
  traits: string[];
  color: string;
}

export const zodiacSigns: ZodiacSign[] = [
  {
    id: 'aries',
    name: 'Aries',
    symbol: 'â™ˆ',
    emoji: 'ðŸ',
    element: 'Fire',
    dates: 'Mar 21 - Apr 19',
    traits: ['Bold', 'Energetic', 'Leader'],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'taurus',
    name: 'Taurus',
    symbol: 'â™‰',
    emoji: 'ðŸ‚',
    element: 'Earth',
    dates: 'Apr 20 - May 20',
    traits: ['Reliable', 'Patient', 'Practical'],
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    symbol: 'â™Š',
    emoji: 'ðŸ‘¯',
    element: 'Air',
    dates: 'May 21 - Jun 20',
    traits: ['Curious', 'Adaptable', 'Witty'],
    color: 'from-yellow-500 to-amber-500'
  },
  {
    id: 'cancer',
    name: 'Cancer',
    symbol: 'â™‹',
    emoji: 'ðŸ¦€',
    element: 'Water',
    dates: 'Jun 21 - Jul 22',
    traits: ['Nurturing', 'Intuitive', 'Protective'],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'leo',
    name: 'Leo',
    symbol: 'â™Œ',
    emoji: 'ðŸ¦',
    element: 'Fire',
    dates: 'Jul 23 - Aug 22',
    traits: ['Confident', 'Generous', 'Creative'],
    color: 'from-orange-500 to-yellow-500'
  },
  {
    id: 'virgo',
    name: 'Virgo',
    symbol: 'â™',
    emoji: 'ðŸ‘©',
    element: 'Earth',
    dates: 'Aug 23 - Sep 22',
    traits: ['Analytical', 'Helpful', 'Precise'],
    color: 'from-green-600 to-teal-500'
  },
  {
    id: 'libra',
    name: 'Libra',
    symbol: 'â™Ž',
    emoji: 'âš–ï¸',
    element: 'Air',
    dates: 'Sep 23 - Oct 22',
    traits: ['Balanced', 'Diplomatic', 'Charming'],
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'scorpio',
    name: 'Scorpio',
    symbol: 'â™',
    emoji: 'ðŸ¦‚',
    element: 'Water',
    dates: 'Oct 23 - Nov 21',
    traits: ['Intense', 'Passionate', 'Mysterious'],
    color: 'from-purple-600 to-indigo-600'
  },
  {
    id: 'sagittarius',
    name: 'Sagittarius',
    symbol: 'â™',
    emoji: 'ðŸ¹',
    element: 'Fire',
    dates: 'Nov 22 - Dec 21',
    traits: ['Adventurous', 'Optimistic', 'Free-spirited'],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'capricorn',
    name: 'Capricorn',
    symbol: 'â™‘',
    emoji: 'ðŸ',
    element: 'Earth',
    dates: 'Dec 22 - Jan 19',
    traits: ['Ambitious', 'Disciplined', 'Responsible'],
    color: 'from-gray-600 to-slate-600'
  },
  {
    id: 'aquarius',
    name: 'Aquarius',
    symbol: 'â™’',
    emoji: 'ðŸº',
    element: 'Air',
    dates: 'Jan 20 - Feb 18',
    traits: ['Independent', 'Innovative', 'Humanitarian'],
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'pisces',
    name: 'Pisces',
    symbol: 'â™“',
    emoji: 'ðŸŸ',
    element: 'Water',
    dates: 'Feb 19 - Mar 20',
    traits: ['Compassionate', 'Artistic', 'Intuitive'],
    color: 'from-teal-500 to-green-500'
  }
];
