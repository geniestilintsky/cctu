export const PLATFORM = {
  name: process.env.NEXT_PUBLIC_PLATFORM_NAME || 'CCTU StudyHub',
  shortName: 'StudyHub',
  university:
    process.env.NEXT_PUBLIC_UNIVERSITY_NAME || 'Cape Coast Technical University',
  universityShort: 'CCTU',
  motto: 'Nkyerekyere na Nyimdzee ma Nyansa',
  mottoTranslation: 'Teaching and skill bring wisdom',
  currency: process.env.NEXT_PUBLIC_CURRENCY || 'GHS',
  supportEmail: 'support@cctu.edu.gh',
} as const;

export const SEMESTER_PASS = {
  plan: 'Semester Pass',
  price: Number(process.env.SEMESTER_PASS_PRICE || 60),
  days: Number(process.env.SEMESTER_PASS_DAYS || 120),
} as const;

export const MAX_TAS_PER_LECTURER = 3;

/** Points awarded automatically when a Super Admin approves a student upload. */
export const UPLOAD_VERIFIED_POINTS = 10;

export const MATERIAL_TYPE_LABELS: Record<string, string> = {
  PAST_EXAM: 'Past Exam',
  QUIZ: 'Quiz',
  HANDOUT: 'Handout',
  TUTORIAL: 'Tutorial',
  BOOK: 'Book',
  THESIS: 'Thesis',
};

/** Appending "s" gives "Quizs" and "Thesiss"; plurals are spelled out. */
export const MATERIAL_TYPE_PLURALS: Record<string, string> = {
  PAST_EXAM: 'Past exams',
  QUIZ: 'Quizzes',
  HANDOUT: 'Handouts',
  TUTORIAL: 'Tutorials',
  BOOK: 'Books',
  THESIS: 'Theses',
};

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  LECTURER: 'Lecturer',
  TA: 'Teaching Assistant',
  STUDENT: 'Student',
};

export const LEVELS = [100, 200, 300, 400] as const;

export const ACADEMIC_YEARS = [
  '2025/2026',
  '2024/2025',
  '2023/2024',
  '2022/2023',
  '2021/2022',
  '2020/2021',
] as const;

export const SEMESTERS = ['First Semester', 'Second Semester'] as const;

/** Home route for each role after sign-in. */
export const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: '/admin/review-queue',
  LECTURER: '/lecturer/dashboard',
  TA: '/lecturer/dashboard',
  STUDENT: '/dashboard',
};
