-- ============================================================================
-- StudyDesk Live — Схема облачной базы данных PostgreSQL (Supabase)
-- Скопируйте и выполните этот скрипт в разделе SQL Editor вашего проекта Supabase
-- ============================================================================

-- 1. Единая таблица синхронизации состояния школы в реальном времени
CREATE TABLE IF NOT EXISTS public.studydesk_state (
  id TEXT PRIMARY KEY DEFAULT 'school_main',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Таблица пользователей (Ученики, Кураторы, Завуч)
CREATE TABLE IF NOT EXISTS public.studydesk_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'curator', 'host')),
  class_id TEXT NOT NULL,
  total_study_seconds INTEGER NOT NULL DEFAULT 0,
  current_location_status TEXT,
  last_location_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Таблица кодов доступа классов (7А–11Б) и QR-ключей на доске
CREATE TABLE IF NOT EXISTS public.studydesk_class_access (
  class_id TEXT PRIMARY KEY,
  room_name TEXT NOT NULL,
  curator_name TEXT NOT NULL,
  student_join_code TEXT NOT NULL,
  curator_join_code TEXT NOT NULL,
  board_qr_key TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Таблица посадки за партами (12 парт в каждом классе)
CREATE TABLE IF NOT EXISTS public.studydesk_desks (
  id TEXT PRIMARY KEY, -- например: '11A-desk-1'
  class_id TEXT NOT NULL,
  desk_number INTEGER NOT NULL,
  student_id TEXT,
  student_name TEXT,
  subject TEXT,
  status TEXT CHECK (status IN ('pending', 'verified')),
  arrived_at TEXT,
  accumulated_seconds INTEGER DEFAULT 0,
  timer_running BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Таблица домашних заданий на Этюд (19:00–20:30)
CREATE TABLE IF NOT EXISTS public.studydesk_homework (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  deadline TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  author_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- 6. Таблица чат-отметок «Где я нахожусь (если вне класса)»
CREATE TABLE IF NOT EXISTS public.studydesk_away_messages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  class_id TEXT NOT NULL,
  location_label TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL,
  timestamp BIGINT NOT NULL
);

-- Отключаем RLS для быстрого публичного доступа школьного приложения (либо настраиваем политики)
ALTER TABLE public.studydesk_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studydesk_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studydesk_class_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studydesk_desks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studydesk_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studydesk_away_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read/write on studydesk_state" ON public.studydesk_state;
CREATE POLICY "Allow public read/write on studydesk_state"
  ON public.studydesk_state FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on studydesk_users" ON public.studydesk_users;
CREATE POLICY "Allow public read/write on studydesk_users"
  ON public.studydesk_users FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on studydesk_class_access" ON public.studydesk_class_access;
CREATE POLICY "Allow public read/write on studydesk_class_access"
  ON public.studydesk_class_access FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on studydesk_desks" ON public.studydesk_desks;
CREATE POLICY "Allow public read/write on studydesk_desks"
  ON public.studydesk_desks FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on studydesk_homework" ON public.studydesk_homework;
CREATE POLICY "Allow public read/write on studydesk_homework"
  ON public.studydesk_homework FOR ALL
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public read/write on studydesk_away_messages" ON public.studydesk_away_messages;
CREATE POLICY "Allow public read/write on studydesk_away_messages"
  ON public.studydesk_away_messages FOR ALL
  USING (true) WITH CHECK (true);
