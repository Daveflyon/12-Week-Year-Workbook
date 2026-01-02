// Quotes from The 12 Week Year by Brian P. Moran and Michael Lennington

export const BOOK_QUOTES = [
  {
    id: "quote_1",
    text: "A year is no longer 12 months, it is now 12 weeks. There are no longer four quarters in a year; there is only one.",
    context: "core_philosophy",
    chapter: "Introduction",
  },
  {
    id: "quote_2",
    text: "The challenge isn't knowing what to do; it's doing it.",
    context: "execution",
    chapter: "Chapter 1",
  },
  {
    id: "quote_3",
    text: "Greatness is achieved not in grand gestures, but in everyday actions.",
    context: "daily_execution",
    chapter: "Chapter 3",
  },
  {
    id: "quote_4",
    text: "The goal is consistency, not perfection.",
    context: "mindset",
    chapter: "Chapter 5",
  },
  {
    id: "quote_5",
    text: "Embrace 'productive tension,' the discomfort between what you're doing and what you know you should be doing, as fuel for action.",
    context: "motivation",
    chapter: "Chapter 4",
  },
  {
    id: "quote_6",
    text: "Treat your Strategic Blocks as non-negotiable appointments with yourself.",
    context: "time_management",
    chapter: "Chapter 8",
  },
  {
    id: "quote_7",
    text: "You don't need a 100% score to be successful. The goal is consistent effort (85%), not flawless execution (100%).",
    context: "scoring",
    chapter: "Chapter 6",
  },
  {
    id: "quote_8",
    text: "True accountability is about ownership, which begins with self-awareness of your thoughts, actions, and results.",
    context: "accountability",
    chapter: "Chapter 2",
  },
  {
    id: "quote_9",
    text: "Commitment is the resolve to keep promises made to oneself and others, especially when the initial excitement fades.",
    context: "commitment",
    chapter: "Chapter 2",
  },
  {
    id: "quote_10",
    text: "The 12 Week Year is demanding. Without a strong 'Why' (Vision), the discipline required will eventually fade.",
    context: "vision",
    chapter: "Chapter 3",
  },
  {
    id: "quote_11",
    text: "Ask yourself: 'If I only achieved this one thing, would this 12-week year be a success?'",
    context: "goal_setting",
    chapter: "Chapter 4",
  },
  {
    id: "quote_12",
    text: "The Execution Score is the average completion percentage of all your Lead Indicators.",
    context: "measurement",
    chapter: "Chapter 6",
  },
  {
    id: "quote_13",
    text: "The Breakout Block is time spent away from the primary execution activities. It is essential for maintaining energy, preventing burnout, and fostering long-term professional growth.",
    context: "breakout_blocks",
    chapter: "Chapter 8",
  },
  {
    id: "quote_14",
    text: "Use the 13th week (the '13th month') for reflection and planning the next 12-week cycle.",
    context: "review",
    chapter: "Chapter 10",
  },
  {
    id: "quote_15",
    text: "The goal is to intentionally structure the day to protect time for high-leverage activities and batch low-leverage tasks.",
    context: "time_management",
    chapter: "Chapter 8",
  },
];

export const FLASHCARDS = [
  {
    id: "fc_1",
    front: "What is the 85% Rule?",
    back: "The goal is to achieve an execution score of 85% or higher on your Lead Indicators. Research suggests that consistently hitting 85% execution almost guarantees the achievement of your 12-week goals.",
    category: "measurement",
  },
  {
    id: "fc_2",
    front: "What are the 3 Core Principles?",
    back: "1. Accountability - Taking full ownership of actions and results\n2. Commitment - Keeping promises to yourself and others\n3. Greatness in the Moment - Making the right choice in the present",
    category: "principles",
  },
  {
    id: "fc_3",
    front: "What are the 5 Disciplines?",
    back: "1. Vision - A clear picture of the future\n2. Planning - A concise 12-week plan\n3. Process Control - Tools to stay on track\n4. Measurement - Tracking lead and lag indicators\n5. Time Use - Intentional allocation of time",
    category: "disciplines",
  },
  {
    id: "fc_4",
    front: "What is a Strategic Block?",
    back: "A minimum 3-hour block of uninterrupted time dedicated to deep work on your most critical tasks that directly contribute to your 12-Week Goals.",
    category: "time_management",
  },
  {
    id: "fc_5",
    front: "What is a Buffer Block?",
    back: "A scheduled period (30-60 minutes) to handle low-leverage administrative tasks like emails, phone calls, and communication. By batching these tasks, you protect your Strategic Blocks.",
    category: "time_management",
  },
  {
    id: "fc_6",
    front: "What is a Breakout Block?",
    back: "Time (1-3 hours) spent away from primary execution activities for recharging, professional development, or personal growth. Essential for preventing burnout.",
    category: "time_management",
  },
  {
    id: "fc_7",
    front: "Lead vs. Lag Indicators",
    back: "Lead Indicators are the actions you control (e.g., sales calls made). Lag Indicators are the results (e.g., revenue generated). Focus on executing Lead Indicators; Lag Indicators will follow.",
    category: "measurement",
  },
  {
    id: "fc_8",
    front: "What is a WAM?",
    back: "Weekly Accountability Meeting - A 15-20 minute meeting to review the previous week's score, share successes and challenges, and commit to the upcoming week's tactics.",
    category: "accountability",
  },
  {
    id: "fc_9",
    front: "How many goals should you set?",
    back: "Limit yourself to 1-3 primary goals per 12-week cycle. More than 3 goals leads to diluted focus and reduced execution quality.",
    category: "planning",
  },
  {
    id: "fc_10",
    front: "What is 'Greatness in the Moment'?",
    back: "The practice of making the right choice and taking critical action in the present, even when you don't 'feel' like it. Greatness is achieved through everyday actions, not grand gestures.",
    category: "principles",
  },
  {
    id: "fc_11",
    front: "What is the 'All or Nothing' Fallacy?",
    back: "The mistaken belief that if you miss a tactic, the week is 'ruined.' Instead, acknowledge the miss, score it as zero, and move immediately to the next tactic. Aim for 85%, not 100%.",
    category: "mindset",
  },
  {
    id: "fc_12",
    front: "What is the Monday Morning Test?",
    back: "A test for your tactics: If you look at your plan on Monday morning, do you know exactly what action to take without further thought? If not, your tactic is too vague.",
    category: "planning",
  },
];

export const WEEK_THEMES = [
  { week: 1, theme: "Foundation and Momentum", quote: BOOK_QUOTES[3] },
  { week: 2, theme: "Process Control", quote: BOOK_QUOTES[4] },
  { week: 3, theme: "Deep Work Discipline", quote: BOOK_QUOTES[5] },
  { week: 4, theme: "The 85% Rule", quote: BOOK_QUOTES[6] },
  { week: 5, theme: "Recharge and Growth", quote: BOOK_QUOTES[12] },
  { week: 6, theme: "Mid-Cycle Review", quote: BOOK_QUOTES[11] },
  { week: 7, theme: "Post-Review Momentum", quote: BOOK_QUOTES[7] },
  { week: 8, theme: "Avoiding Pitfalls", quote: BOOK_QUOTES[10] },
  { week: 9, theme: "Sustained Effort", quote: BOOK_QUOTES[8] },
  { week: 10, theme: "Final Push", quote: BOOK_QUOTES[9] },
  { week: 11, theme: "Finalizing Tactics", quote: BOOK_QUOTES[11] },
  { week: 12, theme: "Execution Completion", quote: BOOK_QUOTES[14] },
  { week: 13, theme: "Review and Planning", quote: BOOK_QUOTES[13] },
];

export function getRandomQuote(context?: string): typeof BOOK_QUOTES[0] {
  const filtered = context 
    ? BOOK_QUOTES.filter(q => q.context === context)
    : BOOK_QUOTES;
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getQuoteForWeek(weekNumber: number): typeof BOOK_QUOTES[0] {
  const weekTheme = WEEK_THEMES.find(w => w.week === weekNumber);
  return weekTheme?.quote ?? BOOK_QUOTES[0];
}

export function getRandomFlashcard(excludeIds?: string[]): typeof FLASHCARDS[0] {
  const filtered = excludeIds 
    ? FLASHCARDS.filter(f => !excludeIds.includes(f.id))
    : FLASHCARDS;
  if (filtered.length === 0) return FLASHCARDS[0];
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export function getFlashcardsByCategory(category: string): typeof FLASHCARDS {
  return FLASHCARDS.filter(f => f.category === category);
}
