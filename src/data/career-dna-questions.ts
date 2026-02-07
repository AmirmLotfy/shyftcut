/** Career DNA quiz questions and options. */

export const CAREER_FIELDS = [
  'Software Engineer',
  'Data Scientist',
  'Product Manager',
  'UX Designer',
  'DevOps Engineer',
  'Cloud Architect',
  'Machine Learning Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Cybersecurity Analyst',
  'Business Analyst',
  'Project Manager',
  'Marketing Manager',
  'Sales Manager',
  'HR Manager',
  'Student',
  'Other',
] as const;
/** Career field display labels (value -> { en, ar }) for i18n */
export const CAREER_FIELD_LABELS: Record<string, { en: string; ar: string }> = {
  'Software Engineer': { en: 'Software Engineer', ar: 'مهندس برمجيات' },
  'Data Scientist': { en: 'Data Scientist', ar: 'عالم بيانات' },
  'Product Manager': { en: 'Product Manager', ar: 'مدير منتج' },
  'UX Designer': { en: 'UX Designer', ar: 'مصمم تجربة مستخدم (UX)' },
  'DevOps Engineer': { en: 'DevOps Engineer', ar: 'مهندس DevOps' },
  'Cloud Architect': { en: 'Cloud Architect', ar: 'مهندس سحابة (Cloud)' },
  'Machine Learning Engineer': { en: 'Machine Learning Engineer', ar: 'مهندس تعلم آلي' },
  'Frontend Developer': { en: 'Frontend Developer', ar: 'مطور واجهات أمامية' },
  'Backend Developer': { en: 'Backend Developer', ar: 'مطور واجهات خلفية' },
  'Full Stack Developer': { en: 'Full Stack Developer', ar: 'مطور ويب شامل (Full Stack)' },
  'Cybersecurity Analyst': { en: 'Cybersecurity Analyst', ar: 'محلل أمن سيبراني' },
  'Business Analyst': { en: 'Business Analyst', ar: 'محلل أعمال' },
  'Project Manager': { en: 'Project Manager', ar: 'مدير مشاريع' },
  'Marketing Manager': { en: 'Marketing Manager', ar: 'مدير تسويق' },
  'Sales Manager': { en: 'Sales Manager', ar: 'مدير مبيعات' },
  'HR Manager': { en: 'HR Manager', ar: 'مدير موارد بشرية' },
  'Student': { en: 'Student', ar: 'طالب/طالبة' },
  'Other': { en: 'Other', ar: 'أخرى' }
};

/** Get career field label in the given language */
export function getCareerFieldLabel(field: string | undefined, lang: 'en' | 'ar'): string {
  if (!field) return '';
  const labels = CAREER_FIELD_LABELS[field];
  return labels ? labels[lang] : field;
}


export interface QuizQuestion {
  id: string;
  questionKey: string;
  type: 'single' | 'slider' | 'dropdown';
  options?: { value: string; labelKey: string; emoji?: string }[];
  min?: number;
  max?: number;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    questionKey: 'careerDna.q1',
    type: 'single',
    options: [
      { value: 'analyze', labelKey: 'careerDna.q1.analyze' },
      { value: 'brainstorm', labelKey: 'careerDna.q1.brainstorm' },
      { value: 'process', labelKey: 'careerDna.q1.process' },
      { value: 'collaborate', labelKey: 'careerDna.q1.collaborate' },
    ],
  },
  {
    id: 'q2',
    questionKey: 'careerDna.q2',
    type: 'single',
    options: [
      { value: 'excited', labelKey: 'careerDna.q2.excited' },
      { value: 'stressed', labelKey: 'careerDna.q2.stressed' },
      { value: 'motivated', labelKey: 'careerDna.q2.motivated' },
      { value: 'anxious', labelKey: 'careerDna.q2.anxious' },
    ],
  },
  {
    id: 'q3',
    questionKey: 'careerDna.q3',
    type: 'single',
    options: [
      { value: 'fast', labelKey: 'careerDna.q3.fast' },
      { value: 'structured', labelKey: 'careerDna.q3.structured' },
      { value: 'creative', labelKey: 'careerDna.q3.creative' },
      { value: 'independent', labelKey: 'careerDna.q3.independent' },
    ],
  },
  {
    id: 'q4',
    questionKey: 'careerDna.q4',
    type: 'single',
    options: [
      { value: 'lead', labelKey: 'careerDna.q4.lead' },
      { value: 'support', labelKey: 'careerDna.q4.support' },
      { value: 'create', labelKey: 'careerDna.q4.create' },
      { value: 'analyze', labelKey: 'careerDna.q4.analyze' },
    ],
  },
  {
    id: 'q5',
    questionKey: 'careerDna.q5',
    type: 'dropdown',
  },
  {
    id: 'q6',
    questionKey: 'careerDna.q6',
    type: 'slider',
    min: 1,
    max: 10,
  },
  {
    id: 'q7',
    questionKey: 'careerDna.q7',
    type: 'single',
    options: [
      { value: 'yes', labelKey: 'careerDna.q7.yes' },
      { value: 'no', labelKey: 'careerDna.q7.no' },
      { value: 'unsure', labelKey: 'careerDna.q7.unsure' },
    ],
  },
  {
    id: 'q8',
    questionKey: 'careerDna.q8',
    type: 'single',
    options: [
      { value: 'wasting_time', labelKey: 'careerDna.q8.wasting_time' },
      { value: 'wrong_career', labelKey: 'careerDna.q8.wrong_career' },
      { value: 'competition', labelKey: 'careerDna.q8.competition' },
      { value: 'falling_behind', labelKey: 'careerDna.q8.falling_behind' },
    ],
  },
];
