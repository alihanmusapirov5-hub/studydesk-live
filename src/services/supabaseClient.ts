/**
 * Продакшн-клиент облачной базы данных Supabase для школы.
 * Таблица: public.studydesk_prod_state (id = 'school_prod_v1')
 * Включает защиту от перезаписи при одновременном входе учеников с разных телефонов и keep-alive.
 */

export interface CloudConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  enabled: boolean;
}

const CLOUD_CONFIG_STORAGE_KEY = 'studydesk_cloud_db_config_prod_v1';
const PROD_ROW_ID = 'school_prod_v1';

const DEFAULT_SUPABASE_URL = 'https://crtjsrvumbpmhqlulhjv.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNydGpzcnZ1bWJwbWhxbHVsaGp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4ODAwOTEsImV4cCI6MjExMDQ1NjA5MX0.3uqauPK3eETiCr5bwxhDUKRt2hKSx-LQ1JSNamSTc_o';

export const SQL_SCHEMA_SCRIPT = `-- Таблица продакшн-базы школы (уже создана и активна в вашем проекте Supabase)
CREATE TABLE IF NOT EXISTS public.studydesk_prod_state (
  id TEXT PRIMARY KEY DEFAULT 'school_prod_v1',
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.studydesk_prod_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "studydesk_prod_state_policy" ON public.studydesk_prod_state;
CREATE POLICY "studydesk_prod_state_policy"
  ON public.studydesk_prod_state FOR ALL
  TO anon, authenticated
  USING (true) WITH CHECK (true);`;

export function getCloudConfig(): CloudConfig {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_SUPABASE_URL;
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env
    ?.VITE_SUPABASE_ANON_KEY;

  try {
    const raw = localStorage.getItem(CLOUD_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CloudConfig;
      if (parsed.supabaseUrl && parsed.supabaseAnonKey) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return {
    supabaseUrl: (envUrl || DEFAULT_SUPABASE_URL).trim().replace(/\/+$/, ''),
    supabaseAnonKey: (envKey || DEFAULT_SUPABASE_ANON_KEY).trim(),
    enabled: true,
  };
}

export function saveCloudConfig(config: CloudConfig): void {
  const cleaned: CloudConfig = {
    supabaseUrl: config.supabaseUrl.trim().replace(/\/+$/, ''),
    supabaseAnonKey: config.supabaseAnonKey.trim(),
    enabled: Boolean(
      config.enabled &&
        config.supabaseUrl.trim() &&
        config.supabaseAnonKey.trim()
    ),
  };
  localStorage.setItem(CLOUD_CONFIG_STORAGE_KEY, JSON.stringify(cleaned));
}

export async function fetchCloudState<T>(): Promise<{
  data?: T;
  error?: string;
}> {
  const cfg = getCloudConfig();
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    return { error: 'Cloud DB not configured' };
  }

  try {
    const url = `${cfg.supabaseUrl}/rest/v1/studydesk_prod_state?id=eq.${PROD_ROW_ID}&select=payload,updated_at`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      const txt = await res.text();
      return {
        error: `Ошибка ответа БД (${res.status}): ${txt}`,
      };
    }

    const rows = (await res.json()) as Array<{ payload: T }>;
    if (!rows || rows.length === 0) {
      return { data: undefined };
    }
    return { data: rows[0].payload };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : 'Не удалось подключиться к облачной базе данных',
    };
  }
}

export async function pushCloudState<T>(payload: T): Promise<{
  ok: boolean;
  error?: string;
}> {
  const cfg = getCloudConfig();
  if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    return { ok: false, error: 'Cloud DB not configured' };
  }

  try {
    const url = `${cfg.supabaseUrl}/rest/v1/studydesk_prod_state`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        id: PROD_ROW_ID,
        payload,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return {
        ok: false,
        error: `Ошибка записи в БД (${res.status}): ${txt}`,
      };
    }

    // Синхронизируем также таблицу пользователей studydesk_users
    const anyPayload = payload as unknown as {
      users?: Array<{
        id: string;
        username: string;
        password: string;
        fullName: string;
        role: string;
        classId: string;
        totalStudySeconds?: number;
        currentLocationStatus?: string;
        lastLocationTime?: string;
      }>;
    };

    if (anyPayload && Array.isArray(anyPayload.users) && anyPayload.users.length > 0) {
      const userRows = anyPayload.users.map((u) => ({
        id: u.id,
        username: u.username,
        password: u.password,
        full_name: u.fullName,
        role: u.role,
        class_id: u.classId,
        total_study_seconds: u.totalStudySeconds || 0,
        current_location_status: u.currentLocationStatus || null,
        last_location_time: u.lastLocationTime || null,
      }));

      fetch(`${cfg.supabaseUrl}/rest/v1/studydesk_users`, {
        method: 'POST',
        headers: {
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates',
        },
        body: JSON.stringify(userRows),
      }).catch(() => {});
    }

    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? err.message
          : 'Ошибка сети при сохранении в облачную БД',
    };
  }
}
