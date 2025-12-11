CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS programs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS courses (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  credits REAL NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS course_offerings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL REFERENCES courses(code),
  term_id TEXT NOT NULL,
  UNIQUE (course_code, term_id)
);

CREATE TABLE IF NOT EXISTS prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL REFERENCES courses(code),
  prereq_code TEXT NOT NULL REFERENCES courses(code)
);

CREATE TABLE IF NOT EXISTS program_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id TEXT NOT NULL REFERENCES programs(id),
  course_code TEXT NOT NULL REFERENCES courses(code),
  requirement_type TEXT NOT NULL DEFAULT 'REQUIRED'
);

CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL REFERENCES courses(code),
  term_id TEXT NOT NULL,
  section_code TEXT NOT NULL,
  kind TEXT NOT NULL,
  day_of_week TEXT NOT NULL,
  start_time_minutes INT NOT NULL,
  end_time_minutes INT NOT NULL,
  location TEXT
);
