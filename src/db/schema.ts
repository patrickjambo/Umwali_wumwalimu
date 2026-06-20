import { pgTable, text, integer, boolean, timestamp, uuid, pgEnum, decimal, jsonb, primaryKey } from 'drizzle-orm/pg-core';

export const questionCategoryEnum = pgEnum('question_category', [
  'text',       // Category A — no numbers
  'numeric',    // Category B — contains numbers/measurements
  'ibyapa',     // Category C — road sign questions
]);

export const users = pgTable('users', {
  id:            uuid('id').defaultRandom().primaryKey(),
  name:          text('name').notNull(),
  email:         text('email').unique().notNull(),
  passwordHash:  text('password_hash'),
  role:          text('role').default('student'), // student | admin | instructor
  isActive:      boolean('is_active').default(true),           // admin can de/activate
  accessExpiresAt: timestamp('access_expires_at'),             // trial / subscription end
  nationalId:    text('national_id').unique(),
  phone:         text('phone'),
  avatarUrl:     text('avatar_url'),
  createdAt:     timestamp('created_at').defaultNow(),
  updatedAt:     timestamp('updated_at').defaultNow(),
});

// Simple key/value app settings (e.g. default free-trial days, admin-editable).
export const appSettings = pgTable('app_settings', {
  key:   text('key').primaryKey(),
  value: text('value').notNull(),
});

export const courses = pgTable('courses', {
  id:          uuid('id').defaultRandom().primaryKey(),
  slug:        text('slug').unique().notNull(),
  title:       text('title').notNull(),
  titleEn:     text('title_en'),
  description: text('description'),
  category:    questionCategoryEnum('category').notNull(),
  order:       integer('order').notNull(),
  isPublished: boolean('is_published').default(false),
  createdAt:   timestamp('created_at').defaultNow(),
});

export const modules = pgTable('modules', {
  id:          uuid('id').defaultRandom().primaryKey(),
  courseId:    uuid('course_id').references(() => courses.id).notNull(),
  title:       text('title').notNull(),
  titleEn:     text('title_en'),
  content:     text('content'),           // Markdown lesson content
  videoUrl:    text('video_url'),         // Optional video
  order:       integer('order').notNull(),
  passingScore: integer('passing_score').default(70),
});

export const questions = pgTable('questions', {
  id:            uuid('id').defaultRandom().primaryKey(),
  number:        integer('number').notNull().unique(), // 1–433
  category:      questionCategoryEnum('category').notNull(),
  text:          text('text').notNull(),             // Kinyarwanda question
  textEn:        text('text_en'),                    // English translation
  options:       jsonb('options').notNull(),          // [{key,text,isCorrect}]
  correctKey:    text('correct_key').notNull(),       // 'a' | 'b' | 'c' | 'd'
  explanation:   text('explanation'),                 // AI-generated hint
  signImageUrl:  text('sign_image_url'),              // For ibyapa questions
  signSvg:       text('sign_svg'),                    // Inline SVG for signs
  moduleId:      uuid('module_id').references(() => modules.id),
  createdAt:     timestamp('created_at').defaultNow(),
});

export const enrollments = pgTable('enrollments', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id).notNull(),
  courseId:    uuid('course_id').references(() => courses.id).notNull(),
  enrolledAt:  timestamp('enrolled_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  progress:    integer('progress').default(0), // 0–100%
});

export const quizAttempts = pgTable('quiz_attempts', {
  id:          uuid('id').defaultRandom().primaryKey(),
  userId:      uuid('user_id').references(() => users.id).notNull(),
  moduleId:    uuid('module_id').references(() => modules.id), // null for mixed mock exams
  kind:        text('kind').default('module'), // 'module' | 'exam'
  score:       decimal('score', { precision: 5, scale: 2 }).notNull(),
  passed:      boolean('passed').notNull(),
  answers:     jsonb('answers').notNull(), // [{questionId, selectedKey, correct}]
  timeTaken:   integer('time_taken'),      // seconds
  attemptedAt: timestamp('attempted_at').defaultNow(),
});

export const certificates = pgTable('certificates', {
  id:           uuid('id').defaultRandom().primaryKey(),
  userId:       uuid('user_id').references(() => users.id).notNull(),
  courseId:     uuid('course_id').references(() => courses.id).notNull(),
  verifyCode:   text('verify_code').unique().notNull(), // QR code payload
  pdfUrl:       text('pdf_url'),
  issuedAt:     timestamp('issued_at').defaultNow(),
});

// Required by NextAuth DrizzleAdapter
export const accounts = pgTable('accounts', {
  userId:            uuid('userId').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token:     text('refresh_token'),
  access_token:      text('access_token'),
  expires_at:        integer('expires_at'),
  token_type:        text('token_type'),
  scope:             text('scope'),
  id_token:          text('id_token'),
  session_state:     text('session_state'),
}, (t) => ([primaryKey({ columns: [t.provider, t.providerAccountId] })]));

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { mode: 'date' }).notNull(),
}, (t) => ([primaryKey({ columns: [t.identifier, t.token] })]));
