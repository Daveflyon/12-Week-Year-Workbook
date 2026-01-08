// Pre-built cycle templates for common 12-week objectives

export interface TemplateGoal {
  title: string;
  description: string;
  tactics: TemplateTactic[];
}

export interface TemplateTactic {
  title: string;
  weeklyTarget: number;
  unit: string;
}

export interface CycleTemplate {
  id: string;
  name: string;
  description: string;
  category: 'fitness' | 'business' | 'learning' | 'personal';
  icon: string;
  goals: TemplateGoal[];
}

export const CYCLE_TEMPLATES: CycleTemplate[] = [
  {
    id: 'fitness-transformation',
    name: 'Fitness Transformation',
    description: 'Build a consistent exercise routine and improve your physical health over 12 weeks.',
    category: 'fitness',
    icon: '💪',
    goals: [
      {
        title: 'Achieve Consistent Exercise Routine',
        description: 'Exercise regularly to build strength and endurance',
        tactics: [
          { title: 'Complete strength training sessions', weeklyTarget: 3, unit: 'sessions' },
          { title: 'Complete cardio sessions (30+ minutes)', weeklyTarget: 3, unit: 'sessions' },
          { title: 'Track daily steps (8,000+ target)', weeklyTarget: 5, unit: 'days' },
          { title: 'Complete stretching/mobility routine', weeklyTarget: 5, unit: 'days' },
        ],
      },
      {
        title: 'Improve Nutrition Habits',
        description: 'Develop healthier eating patterns and meal planning',
        tactics: [
          { title: 'Prepare healthy meals at home', weeklyTarget: 5, unit: 'meals' },
          { title: 'Drink 8+ glasses of water daily', weeklyTarget: 7, unit: 'days' },
          { title: 'Eat 5+ servings of vegetables', weeklyTarget: 5, unit: 'days' },
          { title: 'Track food intake in journal', weeklyTarget: 5, unit: 'days' },
        ],
      },
    ],
  },
  {
    id: 'business-growth',
    name: 'Business Growth',
    description: 'Accelerate your business or career with focused sales, marketing, and networking activities.',
    category: 'business',
    icon: '📈',
    goals: [
      {
        title: 'Increase Revenue/Sales',
        description: 'Generate more leads and close more deals',
        tactics: [
          { title: 'Make prospecting calls/emails', weeklyTarget: 20, unit: 'contacts' },
          { title: 'Follow up with warm leads', weeklyTarget: 10, unit: 'follow-ups' },
          { title: 'Conduct sales meetings/demos', weeklyTarget: 5, unit: 'meetings' },
          { title: 'Send proposals/quotes', weeklyTarget: 3, unit: 'proposals' },
        ],
      },
      {
        title: 'Build Professional Network',
        description: 'Expand your network and industry presence',
        tactics: [
          { title: 'Connect with new professionals on LinkedIn', weeklyTarget: 10, unit: 'connections' },
          { title: 'Attend networking events/webinars', weeklyTarget: 1, unit: 'events' },
          { title: 'Have coffee chats/calls with contacts', weeklyTarget: 2, unit: 'conversations' },
          { title: 'Share valuable content on social media', weeklyTarget: 3, unit: 'posts' },
        ],
      },
      {
        title: 'Improve Marketing Presence',
        description: 'Increase visibility and brand awareness',
        tactics: [
          { title: 'Create content (blog posts, videos, etc.)', weeklyTarget: 2, unit: 'pieces' },
          { title: 'Engage with audience comments/messages', weeklyTarget: 5, unit: 'days' },
          { title: 'Review and optimise marketing metrics', weeklyTarget: 1, unit: 'reviews' },
        ],
      },
    ],
  },
  {
    id: 'skill-mastery',
    name: 'Skill Mastery',
    description: 'Master a new skill or deepen expertise through deliberate practice and structured learning.',
    category: 'learning',
    icon: '📚',
    goals: [
      {
        title: 'Complete Structured Learning',
        description: 'Follow a curriculum or course to build foundational knowledge',
        tactics: [
          { title: 'Complete course lessons/modules', weeklyTarget: 5, unit: 'lessons' },
          { title: 'Take notes and review material', weeklyTarget: 5, unit: 'sessions' },
          { title: 'Complete practice exercises/quizzes', weeklyTarget: 3, unit: 'exercises' },
          { title: 'Read related books/articles', weeklyTarget: 2, unit: 'hours' },
        ],
      },
      {
        title: 'Apply Knowledge Through Practice',
        description: 'Reinforce learning through hands-on application',
        tactics: [
          { title: 'Work on personal projects', weeklyTarget: 4, unit: 'hours' },
          { title: 'Complete coding challenges/exercises', weeklyTarget: 5, unit: 'challenges' },
          { title: 'Build portfolio pieces', weeklyTarget: 1, unit: 'pieces' },
          { title: 'Teach or explain concepts to others', weeklyTarget: 1, unit: 'sessions' },
        ],
      },
    ],
  },
  {
    id: 'productivity-system',
    name: 'Productivity System',
    description: 'Build sustainable productivity habits and systems for better time management.',
    category: 'personal',
    icon: '⚡',
    goals: [
      {
        title: 'Establish Morning Routine',
        description: 'Start each day with intention and energy',
        tactics: [
          { title: 'Wake up at consistent time', weeklyTarget: 6, unit: 'days' },
          { title: 'Complete morning exercise/movement', weeklyTarget: 5, unit: 'days' },
          { title: 'Practice meditation/mindfulness', weeklyTarget: 5, unit: 'sessions' },
          { title: 'Review daily priorities before work', weeklyTarget: 5, unit: 'days' },
        ],
      },
      {
        title: 'Improve Focus and Deep Work',
        description: 'Increase capacity for concentrated, high-value work',
        tactics: [
          { title: 'Complete deep work blocks (90+ minutes)', weeklyTarget: 5, unit: 'blocks' },
          { title: 'Use time-blocking for daily schedule', weeklyTarget: 5, unit: 'days' },
          { title: 'Limit social media to designated times', weeklyTarget: 5, unit: 'days' },
          { title: 'Complete weekly review and planning', weeklyTarget: 1, unit: 'reviews' },
        ],
      },
    ],
  },
  {
    id: 'writing-project',
    name: 'Writing Project',
    description: 'Complete a book, blog series, or major writing project through consistent daily writing.',
    category: 'personal',
    icon: '✍️',
    goals: [
      {
        title: 'Maintain Consistent Writing Practice',
        description: 'Build a daily writing habit to make steady progress',
        tactics: [
          { title: 'Write for 30+ minutes', weeklyTarget: 6, unit: 'days' },
          { title: 'Complete word count target (500+ words)', weeklyTarget: 5, unit: 'days' },
          { title: 'Review and edit previous work', weeklyTarget: 2, unit: 'sessions' },
          { title: 'Research and gather material', weeklyTarget: 2, unit: 'hours' },
        ],
      },
      {
        title: 'Complete Project Milestones',
        description: 'Hit key milestones to ensure project completion',
        tactics: [
          { title: 'Complete chapter/section drafts', weeklyTarget: 1, unit: 'sections' },
          { title: 'Get feedback from beta readers', weeklyTarget: 1, unit: 'feedback sessions' },
          { title: 'Outline upcoming sections', weeklyTarget: 1, unit: 'outlines' },
        ],
      },
    ],
  },
  {
    id: 'financial-freedom',
    name: 'Financial Freedom',
    description: 'Take control of your finances through budgeting, saving, and smart money management.',
    category: 'personal',
    icon: '💰',
    goals: [
      {
        title: 'Build Strong Financial Habits',
        description: 'Develop consistent money management practices',
        tactics: [
          { title: 'Track all expenses', weeklyTarget: 7, unit: 'days' },
          { title: 'Review budget and spending', weeklyTarget: 1, unit: 'reviews' },
          { title: 'Transfer to savings account', weeklyTarget: 1, unit: 'transfers' },
          { title: 'Review and cancel unused subscriptions', weeklyTarget: 1, unit: 'reviews' },
        ],
      },
      {
        title: 'Increase Financial Knowledge',
        description: 'Learn about investing, taxes, and wealth building',
        tactics: [
          { title: 'Read financial books/articles', weeklyTarget: 2, unit: 'hours' },
          { title: 'Listen to finance podcasts', weeklyTarget: 2, unit: 'episodes' },
          { title: 'Research investment options', weeklyTarget: 1, unit: 'sessions' },
          { title: 'Review net worth and progress', weeklyTarget: 1, unit: 'reviews' },
        ],
      },
    ],
  },
];

export function getTemplateById(id: string): CycleTemplate | undefined {
  return CYCLE_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: CycleTemplate['category']): CycleTemplate[] {
  return CYCLE_TEMPLATES.filter(t => t.category === category);
}
