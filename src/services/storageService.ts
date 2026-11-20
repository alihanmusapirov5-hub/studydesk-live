import {
  CloudUserRow,
  deleteCloudUserById,
  fetchCloudState,
  getCloudConfig,
  pushCloudState,
} from './supabaseClient';

export type UserRole = 'student' | 'curator' | 'host';

export type ClassId =
  | '7A'
  | '7B'
  | '8A'
  | '8B'
  | '9A'
  | '9B'
  | '10A'
  | '10B'
  | '11A'
  | '11B';

export const CLASS_IDS: ClassId[] = [
  '7A',
  '7B',
  '8A',
  '8B',
  '9A',
  '9B',
  '10A',
  '10B',
  '11A',
  '11B',
];

export const DESKS_PER_CLASS = 24;

export type VerificationStatus = 'pending' | 'verified';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  fullName: string;
  role: UserRole;
  classId: ClassId;
  totalStudySeconds: number;
  currentLocationStatus?: string;
  lastLocationTime?: string;
}

export interface ClassAccessConfig {
  classId: ClassId;
  studentJoinCode: string;
  curatorJoinCode: string;
  boardQrKey: string;
  qrRevision?: number;
}

export interface AwayCheckinMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  classId: ClassId;
  locationLabel: string;
  message: string;
  createdAt: string;
  timestamp: number;
}

export interface DeskOccupant {
  studentId: string;
  studentUsername: string;
  studentName: string;
  classId: ClassId;
  deskNumber: number;
  subject: string;
  status: VerificationStatus;
  arrivedAt: string;
  arrivedTimestamp: number;
  accumulatedSeconds: number;
  lastTimerStart: number | null;
  timerRunning: boolean;
}

export interface Desk {
  deskNumber: number;
  row: number;
  col: number;
  occupant: DeskOccupant | null;
}

export interface HomeworkItem {
  id: string;
  classId: ClassId;
  subject: string;
  description: string;
  deadline: string;
  pinned: boolean;
  createdAt: string;
  authorName: string;
}

export interface StudyLogEntry {
  id: string;
  studentId: string;
  studentName: string;
  classId: ClassId;
  deskNumber: number;
  arrivedAt: string;
  subject: string;
  status: VerificationStatus | 'completed' | 'rejected';
  totalSeconds: number;
  active: boolean;
}

export interface ClassroomData {
  classId: ClassId;
  roomName: string;
  curatorName: string;
  qrToken: string;
  desks: Desk[];
  homework: HomeworkItem[];
}

export interface AppState {
  version: number;
  lastQrDate: string;
  etudeModeActive: boolean;
  users: UserAccount[];
  classAccess: Record<ClassId, ClassAccessConfig>;
  classrooms: Record<ClassId, ClassroomData>;
  awayMessages: AwayCheckinMessage[];
  studyLogs: StudyLogEntry[];
  lastUpdated: number;
}

const STORAGE_KEY = 'studydesk_school_prod_v6';
const SESSION_USER_KEY = 'studydesk_school_session_v6';
const PERSISTENT_USER_KEY = 'studydesk_school_remembered_user_v6';
const URL_SCANNED_TOKEN_KEY = 'studydesk_scanned_qr_token_v6';

// Исключаем только 2 старых демо-аккаунта, а всех реальных зарегистрированных учеников и кураторов сохраняем навсегда
const LEGACY_DEMO_IDS = new Set(['usr-student-11a', 'usr-curator-11a']);

export const AWAY_LOCATIONS = [
  'В библиотеке',
  'У учителя / Консультация',
  'Медпункт',
  'В общежитии',
  'На олимпиаде / мероприятии',
  'Столовая',
  'Опаздываю на 5–10 мин',
];

export function getTodayDateKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function computeDailyQrToken(
  classId: ClassId,
  dateKey = getTodayDateKey(),
  revision = 0
): string {
  const seedStr = `STUDYDESK-${classId}-${dateKey}-REV-${revision}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const fourDigits = 1000 + (Math.abs(hash) % 9000);
  return `KEY-${classId}-${fourDigits}`;
}

export function formatStudentShortName(
  firstNameInput: string,
  lastInitialInput?: string
): string {
  const cleanFirst = firstNameInput.trim();
  if (!cleanFirst) return 'Ученик';

  if (lastInitialInput && lastInitialInput.trim()) {
    const initial = lastInitialInput.trim().charAt(0).toUpperCase();
    const firstWord = cleanFirst.split(/\s+/)[0];
    const capFirst = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    return `${capFirst} ${initial}.`;
  }

  const parts = cleanFirst.split(/\s+/).filter(Boolean);
  const firstWord = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  if (parts.length >= 2) {
    const secondInitial = parts[1].replace(/\./g, '').charAt(0).toUpperCase();
    if (secondInitial) {
      return `${firstWord} ${secondInitial}.`;
    }
  }
  return firstWord;
}

function createEmptyDesks(count = DESKS_PER_CLASS): Desk[] {
  const desks: Desk[] = [];
  for (let i = 0; i < count; i++) {
    desks.push({
      deskNumber: i + 1,
      row: Math.floor(i / 6) + 1,
      col: (i % 6) + 1,
      occupant: null,
    });
  }
  return desks;
}

export const ROOM_NUMBERS: Record<ClassId, string> = {
  '7A': 'Кабинет 101',
  '7B': 'Кабинет 102',
  '8A': 'Кабинет 201',
  '8B': 'Кабинет 202',
  '9A': 'Кабинет 205',
  '9B': 'Кабинет 206',
  '10A': 'Кабинет 301',
  '10B': 'Кабинет 302',
  '11A': 'Кабинет 304',
  '11B': 'Кабинет 305',
};

export const DEFAULT_STUDENT_CLASS_CODES: Record<ClassId, string> = {
  '7A': '7A-1001',
  '7B': '7B-1011',
  '8A': '8A-1021',
  '8B': '8B-1031',
  '9A': '9A-1041',
  '9B': '9B-1051',
  '10A': '10A-1061',
  '10B': '10B-1071',
  '11A': '11A-1081',
  '11B': '11B-1091',
};

export const DEFAULT_CURATOR_CLASS_CODES: Record<ClassId, string> = {
  '7A': '7A-9001',
  '7B': '7B-9011',
  '8A': '8A-9021',
  '8B': '8B-9031',
  '9A': '9A-9041',
  '9B': '9B-9051',
  '10A': '10A-9061',
  '10B': '10B-9071',
  '11A': '11A-9081',
  '11B': '11B-9091',
};

function getInitialState(): AppState {
  const todayKey = getTodayDateKey();

  const users: UserAccount[] = [
    {
      id: 'usr-host',
      username: 'zavuch',
      password: 'admin',
      fullName: 'Завуч Ш.',
      role: 'host',
      classId: '11A',
      totalStudySeconds: 0,
    },
  ];

  const classAccess = {} as Record<ClassId, ClassAccessConfig>;
  const classrooms = {} as Record<ClassId, ClassroomData>;

  CLASS_IDS.forEach((cid) => {
    const dailyToken = computeDailyQrToken(cid, todayKey, 0);
    classAccess[cid] = {
      classId: cid,
      studentJoinCode: DEFAULT_STUDENT_CLASS_CODES[cid],
      curatorJoinCode: DEFAULT_CURATOR_CLASS_CODES[cid],
      boardQrKey: dailyToken,
      qrRevision: 0,
    };

    classrooms[cid] = {
      classId: cid,
      roomName: ROOM_NUMBERS[cid],
      curatorName: 'Не назначен',
      qrToken: dailyToken,
      desks: createEmptyDesks(DESKS_PER_CLASS),
      homework: [],
    };
  });

  return {
    version: 6,
    lastQrDate: todayKey,
    etudeModeActive: true,
    users,
    classAccess,
    classrooms,
    awayMessages: [],
    studyLogs: [],
    // ВАЖНО: lastUpdated = 0 у пустого шаблона, чтобы новый телефон или вкладка ВСЕГДА загружали базу из облака Supabase, а не перезаписывали её!
    lastUpdated: 0,
  };
}

export function getLiveElapsedSeconds(
  occupant: DeskOccupant,
  now = Date.now()
): number {
  if (!occupant.timerRunning || !occupant.lastTimerStart) {
    return occupant.accumulatedSeconds;
  }
  const delta = Math.max(0, Math.floor((now - occupant.lastTimerStart) / 1000));
  return occupant.accumulatedSeconds + delta;
}

export function getStudentTotalStudySeconds(
  user: UserAccount,
  state: AppState,
  now = Date.now()
): number {
  let activeSecs = 0;
  CLASS_IDS.forEach((cid) => {
    state.classrooms[cid].desks.forEach((d) => {
      if (d.occupant && d.occupant.studentId === user.id) {
        activeSecs += getLiveElapsedSeconds(d.occupant, now);
      }
    });
  });
  return (user.totalStudySeconds || 0) + activeSecs;
}

export function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, '0');
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `${pad(mins)}:${pad(secs)}`;
}

class StorageService {
  private listeners: Set<(state: AppState) => void> = new Set();
  private cloudSyncStatus: 'local' | 'connected' | 'error' = 'local';
  private lastCloudError: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        sessionStorage.setItem(
          URL_SCANNED_TOKEN_KEY,
          urlToken.trim().toUpperCase()
        );
      }

      window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === STORAGE_KEY && event.newValue) {
          try {
            const parsed = JSON.parse(event.newValue) as AppState;
            this.notifyListeners(parsed);
          } catch (err) {
            console.error('Storage sync error:', err);
          }
        }
      });

      this.syncFromCloud();
      setInterval(() => {
        this.syncFromCloud();
      }, 2000);
    }
  }

  public getScannedTokenFromUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get('token');
    if (fromUrl) {
      sessionStorage.setItem(
        URL_SCANNED_TOKEN_KEY,
        fromUrl.trim().toUpperCase()
      );
      return fromUrl.trim().toUpperCase();
    }
    return sessionStorage.getItem(URL_SCANNED_TOKEN_KEY);
  }

  public getCloudStatus(): {
    status: 'local' | 'connected' | 'error';
    error: string | null;
  } {
    const cfg = getCloudConfig();
    if (!cfg.enabled) {
      return { status: 'local', error: null };
    }
    return { status: this.cloudSyncStatus, error: this.lastCloudError };
  }

  /**
   * Объединяет пользователей из постоянной таблицы Supabase studydesk_users с состоянием приложения,
   * чтобы ни один зарегистрированный аккаунт никогда не исчезал.
   */
  private mergeUsersIntoState(
    state: AppState,
    cloudUsers: CloudUserRow[] = []
  ): AppState {
    const byUsername = new Map<string, UserAccount>();

    // Сначала берем пользователей из текущего состояния (кроме старых демо)
    state.users.forEach((u) => {
      if (!LEGACY_DEMO_IDS.has(u.id)) {
        byUsername.set(u.username.toLowerCase(), {
          ...u,
          fullName: formatStudentShortName(u.fullName),
        });
      }
    });

    // Затем добавляем всех пользователей из таблицы studydesk_users в Supabase
    cloudUsers.forEach((row) => {
      if (LEGACY_DEMO_IDS.has(row.id)) return;
      const key = row.username.toLowerCase();
      const existing = byUsername.get(key);
      const validClass = (
        CLASS_IDS.includes(row.class_id as ClassId) ? row.class_id : '11A'
      ) as ClassId;

      if (!existing) {
        byUsername.set(key, {
          id: row.id,
          username: row.username,
          password: row.password,
          fullName: formatStudentShortName(row.full_name),
          role: row.role,
          classId: validClass,
          totalStudySeconds: row.total_study_seconds || 0,
          currentLocationStatus: row.current_location_status || undefined,
          lastLocationTime: row.last_location_time || undefined,
        });
      } else {
        existing.totalStudySeconds = Math.max(
          existing.totalStudySeconds || 0,
          row.total_study_seconds || 0
        );
      }
    });

    // Гарантируем наличие аккаунта Завуча
    if (!byUsername.has('zavuch')) {
      byUsername.set('zavuch', {
        id: 'usr-host',
        username: 'zavuch',
        password: 'admin',
        fullName: 'Завуч Ш.',
        role: 'host',
        classId: '11A',
        totalStudySeconds: 0,
      });
    }

    state.users = Array.from(byUsername.values());

    // Проставляем имена кураторов в их классы
    state.users.forEach((u) => {
      if (u.role === 'curator' && state.classrooms[u.classId]) {
        state.classrooms[u.classId].curatorName = formatStudentShortName(
          u.fullName
        );
      }
    });

    return state;
  }

  private normalizeAndRotateDailyQR(state: AppState): AppState {
    const todayKey = getTodayDateKey();
    const dateChanged = state.lastQrDate !== todayKey;

    if (dateChanged) {
      state.lastQrDate = todayKey;
    }

    if (!state.classAccess) {
      state.classAccess = getInitialState().classAccess;
    }

    CLASS_IDS.forEach((cid) => {
      const room = state.classrooms[cid];
      const access = state.classAccess[cid];
      if (room && access) {
        if (dateChanged || !room.qrToken) {
          const rev = dateChanged ? 0 : access.qrRevision || 0;
          access.qrRevision = rev;
          const newDailyToken = computeDailyQrToken(cid, todayKey, rev);
          room.qrToken = newDailyToken;
          access.boardQrKey = newDailyToken;
        }
        if (room.desks.length < DESKS_PER_CLASS) {
          for (let i = room.desks.length; i < DESKS_PER_CLASS; i++) {
            room.desks.push({
              deskNumber: i + 1,
              row: Math.floor(i / 6) + 1,
              col: (i % 6) + 1,
              occupant: null,
            });
          }
        }
        room.desks.forEach((d, idx) => {
          d.row = Math.floor(idx / 6) + 1;
          d.col = (idx % 6) + 1;
        });
      }
    });

    return state;
  }

  public async syncFromCloud(forcePush = false): Promise<{
    ok: boolean;
    error?: string;
  }> {
    const cfg = getCloudConfig();
    if (!cfg.enabled || !cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      this.cloudSyncStatus = 'local';
      this.lastCloudError = null;
      return { ok: false, error: 'Облачная БД отключена' };
    }

    const res = await fetchCloudState<AppState>();
    if (res.error) {
      this.cloudSyncStatus = 'error';
      this.lastCloudError = res.error;
      this.notifyListeners(this.getState());
      return { ok: false, error: res.error };
    }

    this.cloudSyncStatus = 'connected';
    this.lastCloudError = null;

    const local = this.getState();
    const cloudUsers = res.users || [];

    if (!res.data) {
      // В studydesk_prod_state еще пусто — объединяем с пользователями из studydesk_users и сохраняем
      const mergedInitial = this.normalizeAndRotateDailyQR(
        this.mergeUsersIntoState(local, cloudUsers)
      );
      mergedInitial.lastUpdated = Date.now();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedInitial));
      await pushCloudState(mergedInitial);
      this.notifyListeners(mergedInitial);
      return { ok: true };
    }

    const remoteBase = this.normalizeAndRotateDailyQR(
      this.mergeUsersIntoState(res.data, cloudUsers)
    );

    // Если в локальной памяти есть только что зарегистрированный пользователь — тоже сохраняем его
    local.users.forEach((lu) => {
      if (
        !LEGACY_DEMO_IDS.has(lu.id) &&
        !remoteBase.users.some(
          (ru) => ru.username.toLowerCase() === lu.username.toLowerCase()
        )
      ) {
        remoteBase.users.push(lu);
      }
    });

    if (
      forcePush ||
      !local.lastUpdated ||
      (remoteBase.lastUpdated || 0) >= local.lastUpdated ||
      remoteBase.users.length > local.users.length
    ) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteBase));
      this.notifyListeners(remoteBase);
    }

    return { ok: true };
  }

  public getState(): AppState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // НЕ вызываем saveState() при пустом localStorage, чтобы не перезаписать облачную БД!
        const initial = getInitialState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      const parsed = JSON.parse(raw) as AppState;
      if (!parsed.classrooms || !parsed.classrooms['11A']) {
        const initial = getInitialState();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return this.normalizeAndRotateDailyQR(
        this.mergeUsersIntoState(parsed, [])
      );
    } catch {
      return getInitialState();
    }
  }

  public saveState(state: AppState, notify = true): void {
    state.lastUpdated = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    if (notify) {
      this.notifyListeners(state);
    }

    const cfg = getCloudConfig();
    if (cfg.enabled && cfg.supabaseUrl && cfg.supabaseAnonKey) {
      pushCloudState(state).then((res) => {
        if (res.ok) {
          this.cloudSyncStatus = 'connected';
          this.lastCloudError = null;
        } else {
          this.cloudSyncStatus = 'error';
          this.lastCloudError = res.error || null;
        }
      });
    }
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(state: AppState): void {
    this.listeners.forEach((fn) => fn(state));
  }

  public resetToInitialState(): AppState {
    const fresh = getInitialState();
    this.saveState(fresh, true);
    return fresh;
  }

  /**
   * Память входа: сохраняет сессию и в sessionStorage (для разных вкладок), и в localStorage (чтобы не выбрасывало после перезагрузки или закрытия браузера).
   */
  public getCurrentUser(): UserAccount | null {
    try {
      const raw =
        sessionStorage.getItem(SESSION_USER_KEY) ||
        localStorage.getItem(PERSISTENT_USER_KEY);
      if (!raw) return null;
      const savedUser = JSON.parse(raw) as UserAccount;
      const state = this.getState();
      return (
        state.users.find(
          (u) => u.username.toLowerCase() === savedUser.username.toLowerCase()
        ) || savedUser
      );
    } catch {
      return null;
    }
  }

  private rememberLoggedInUser(user: UserAccount): void {
    const serialized = JSON.stringify(user);
    sessionStorage.setItem(SESSION_USER_KEY, serialized);
    localStorage.setItem(PERSISTENT_USER_KEY, serialized);
  }

  public login(
    username: string,
    password: string
  ): { user?: UserAccount; error?: string } {
    const state = this.getState();
    const cleanUser = username.trim().toLowerCase();
    const matched = state.users.find(
      (u) => u.username.toLowerCase() === cleanUser && u.password === password
    );
    if (!matched) {
      return { error: 'Неверный логин или пароль.' };
    }
    this.rememberLoggedInUser(matched);
    return { user: matched };
  }

  public registerWithClassCode(params: {
    username: string;
    accessCode: string;
    firstName: string;
    lastInitial: string;
    password: string;
  }): { user?: UserAccount; error?: string } {
    const state = this.getState();
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanCode = params.accessCode.trim().toUpperCase();

    if (
      !cleanUsername ||
      !cleanCode ||
      !params.firstName.trim() ||
      !params.lastInitial.trim() ||
      !params.password
    ) {
      return { error: 'Пожалуйста, заполните все поля.' };
    }

    if (state.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return {
        error: `Логин "${cleanUsername}" уже занят. Выберите другой логин.`,
      };
    }

    let matchedClass: ClassId | null = null;
    let matchedRole: 'student' | 'curator' = 'student';

    for (const cid of CLASS_IDS) {
      const cfg = state.classAccess[cid];
      const roomQr = state.classrooms[cid].qrToken.toUpperCase();
      if (
        cfg.studentJoinCode.toUpperCase() === cleanCode ||
        roomQr === cleanCode
      ) {
        matchedClass = cid;
        matchedRole = 'student';
        break;
      }
      if (cfg.curatorJoinCode.toUpperCase() === cleanCode) {
        matchedClass = cid;
        matchedRole = 'curator';
        break;
      }
    }

    if (!matchedClass) {
      return {
        error:
          'Код класса не найден. Уточните код у вашего куратора или завуча.',
      };
    }

    if (matchedRole === 'curator') {
      const existingCurator = state.users.find(
        (u) => u.role === 'curator' && u.classId === matchedClass
      );
      if (existingCurator) {
        return {
          error: `У класса ${matchedClass} уже зарегистрирован куратор (${existingCurator.fullName}).`,
        };
      }
    }

    const formattedName = formatStudentShortName(
      params.firstName,
      params.lastInitial
    );

    const newUser: UserAccount = {
      id: `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      password: params.password,
      fullName: formattedName,
      role: matchedRole,
      classId: matchedClass,
      totalStudySeconds: 0,
    };

    if (matchedRole === 'curator') {
      state.classrooms[matchedClass].curatorName = newUser.fullName;
    }

    state.users.push(newUser);
    this.saveState(state);
    this.rememberLoggedInUser(newUser);
    return { user: newUser };
  }

  public adminCreateUser(params: {
    firstName: string;
    lastInitial: string;
    username: string;
    password: string;
    role: UserRole;
    classId: ClassId;
  }): { error?: string } {
    const state = this.getState();
    const cleanUsername = params.username.trim().toLowerCase();
    if (!cleanUsername || !params.password.trim() || !params.firstName.trim()) {
      return { error: 'Заполните Имя, логин и пароль.' };
    }
    if (state.users.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return { error: 'Пользователь с таким логином уже существует.' };
    }

    const formattedName = formatStudentShortName(
      params.firstName,
      params.lastInitial
    );

    const newUser: UserAccount = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: params.password.trim(),
      fullName: formattedName,
      role: params.role,
      classId: params.classId,
      totalStudySeconds: 0,
    };

    if (params.role === 'curator') {
      state.classrooms[params.classId].curatorName = newUser.fullName;
    }

    state.users.push(newUser);
    this.saveState(state);
    return {};
  }

  public adminDeleteUser(userId: string): void {
    const state = this.getState();
    state.users = state.users.filter((u) => u.id !== userId);
    CLASS_IDS.forEach((cid) => {
      state.classrooms[cid].desks.forEach((d) => {
        if (d.occupant && d.occupant.studentId === userId) {
          d.occupant = null;
        }
      });
    });
    deleteCloudUserById(userId);
    this.saveState(state);
  }

  public toggleEtudeMode(): void {
    const state = this.getState();
    state.etudeModeActive = !state.etudeModeActive;
    this.saveState(state);
  }

  public regenerateRoomQR(classId: ClassId): void {
    const state = this.getState();
    const room = state.classrooms[classId];
    const access = state.classAccess[classId];
    if (!room || !access) return;
    const nextRev = (access.qrRevision || 0) + 1;
    access.qrRevision = nextRev;
    const newKey = computeDailyQrToken(classId, getTodayDateKey(), nextRev);
    room.qrToken = newKey;
    access.boardQrKey = newKey;
    this.saveState(state);
  }

  public logout(): void {
    sessionStorage.removeItem(SESSION_USER_KEY);
    localStorage.removeItem(PERSISTENT_USER_KEY);
  }

  public postAwayStatus(params: {
    user: UserAccount;
    locationLabel: string;
    message: string;
  }): void {
    const state = this.getState();
    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const targetUser = state.users.find((u) => u.id === params.user.id);
    if (targetUser) {
      targetUser.currentLocationStatus = params.locationLabel;
      targetUser.lastLocationTime = timeStr;
    }

    state.awayMessages.unshift({
      id: `msg-${now}`,
      userId: params.user.id,
      userName: formatStudentShortName(params.user.fullName),
      userRole: params.user.role,
      classId: params.user.classId,
      locationLabel: params.locationLabel,
      message: params.message.trim() || `Отметился: ${params.locationLabel}`,
      createdAt: timeStr,
      timestamp: now,
    });

    this.saveState(state);
  }

  public occupyDeskAfterQR(params: {
    user: UserAccount;
    classId: ClassId;
    deskNumber: number;
    subject: string;
    scannedToken: string;
  }): { error?: string } {
    const state = this.getState();
    const room = state.classrooms[params.classId];
    if (!room) return { error: 'Кабинет не найден.' };

    const cleanToken = params.scannedToken.trim().toUpperCase();
    const expectedToken = room.qrToken.toUpperCase();
    const shortDigits = expectedToken.split('-').pop() || expectedToken;

    if (
      !cleanToken ||
      (cleanToken !== expectedToken &&
        cleanToken !== shortDigits &&
        !cleanToken.includes(expectedToken))
    ) {
      return {
        error:
          'Неверный QR-ключ! Отсканируйте реальный сегодняшний QR-код на доске куратора камерой или введите актуальный ключ с доски.',
      };
    }

    sessionStorage.setItem(URL_SCANNED_TOKEN_KEY, expectedToken);

    CLASS_IDS.forEach((cid) => {
      state.classrooms[cid].desks.forEach((d) => {
        if (d.occupant && d.occupant.studentId === params.user.id) {
          const elapsed = getLiveElapsedSeconds(d.occupant, Date.now());
          const u = state.users.find((usr) => usr.id === params.user.id);
          if (u) {
            u.totalStudySeconds = (u.totalStudySeconds || 0) + elapsed;
          }
          d.occupant = null;
        }
      });
    });

    const targetDesk = room.desks.find(
      (d) => d.deskNumber === params.deskNumber
    );
    if (!targetDesk) return { error: 'Парта не найдена.' };
    if (targetDesk.occupant) {
      return {
        error: `Парта №${params.deskNumber} уже занята (${targetDesk.occupant.studentName}).`,
      };
    }

    const now = Date.now();
    const timeStr = new Date(now).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const cleanSubject = params.subject.trim() || 'Самоподготовка (Этюд)';
    const shortName = formatStudentShortName(params.user.fullName);

    const occupant: DeskOccupant = {
      studentId: params.user.id,
      studentUsername: params.user.username,
      studentName: shortName,
      classId: params.classId,
      deskNumber: params.deskNumber,
      subject: cleanSubject,
      status: 'pending',
      arrivedAt: timeStr,
      arrivedTimestamp: now,
      accumulatedSeconds: 0,
      lastTimerStart: now,
      timerRunning: true,
    };

    targetDesk.occupant = occupant;

    const usr = state.users.find((u) => u.id === params.user.id);
    if (usr) {
      usr.currentLocationStatus = `В классе ${params.classId} (Парта №${params.deskNumber})`;
      usr.lastLocationTime = timeStr;
    }

    const existingLogIdx = state.studyLogs.findIndex(
      (l) => l.studentId === params.user.id && l.active
    );
    const newLog: StudyLogEntry = {
      id: `log-${params.user.id}-${now}`,
      studentId: params.user.id,
      studentName: shortName,
      classId: params.classId,
      deskNumber: params.deskNumber,
      arrivedAt: timeStr,
      subject: cleanSubject,
      status: 'pending',
      totalSeconds: 0,
      active: true,
    };
    if (existingLogIdx >= 0) {
      state.studyLogs[existingLogIdx] = newLog;
    } else {
      state.studyLogs.unshift(newLog);
    }

    this.saveState(state);
    return {};
  }

  public toggleStudentTimer(studentId: string): void {
    const state = this.getState();
    const now = Date.now();
    CLASS_IDS.forEach((cid) => {
      state.classrooms[cid].desks.forEach((d) => {
        if (d.occupant && d.occupant.studentId === studentId) {
          if (d.occupant.timerRunning) {
            d.occupant.accumulatedSeconds = getLiveElapsedSeconds(
              d.occupant,
              now
            );
            d.occupant.lastTimerStart = null;
            d.occupant.timerRunning = false;
          } else {
            d.occupant.lastTimerStart = now;
            d.occupant.timerRunning = true;
          }
          const log = state.studyLogs.find(
            (l) => l.studentId === studentId && l.active
          );
          if (log) {
            log.totalSeconds = d.occupant.accumulatedSeconds;
          }
        }
      });
    });
    this.saveState(state);
  }

  public changeStudentSubject(studentId: string, newSubject: string): void {
    const state = this.getState();
    const clean = newSubject.trim() || 'Самоподготовка';
    CLASS_IDS.forEach((cid) => {
      state.classrooms[cid].desks.forEach((d) => {
        if (d.occupant && d.occupant.studentId === studentId) {
          d.occupant.subject = clean;
          const log = state.studyLogs.find(
            (l) => l.studentId === studentId && l.active
          );
          if (log) {
            log.subject = clean;
          }
        }
      });
    });
    this.saveState(state);
  }

  public leaveDesk(studentId: string): void {
    const state = this.getState();
    const now = Date.now();
    CLASS_IDS.forEach((cid) => {
      state.classrooms[cid].desks.forEach((d) => {
        if (d.occupant && d.occupant.studentId === studentId) {
          const finalSecs = getLiveElapsedSeconds(d.occupant, now);
          const usr = state.users.find((u) => u.id === studentId);
          if (usr) {
            usr.totalStudySeconds = (usr.totalStudySeconds || 0) + finalSecs;
            usr.currentLocationStatus = 'Завершил занятие';
          }
          const log = state.studyLogs.find(
            (l) => l.studentId === studentId && l.active
          );
          if (log) {
            log.totalSeconds = finalSecs;
            log.active = false;
            log.status = 'completed';
          }
          d.occupant = null;
        }
      });
    });
    this.saveState(state);
  }

  public confirmStudentPresence(classId: ClassId, deskNumber: number): void {
    const state = this.getState();
    const desk = state.classrooms[classId]?.desks.find(
      (d) => d.deskNumber === deskNumber
    );
    if (desk && desk.occupant) {
      desk.occupant.status = 'verified';
      const log = state.studyLogs.find(
        (l) => l.studentId === desk.occupant!.studentId && l.active
      );
      if (log) {
        log.status = 'verified';
      }
      this.saveState(state);
    }
  }

  public confirmAllInClass(classId: ClassId): void {
    const state = this.getState();
    const room = state.classrooms[classId];
    if (!room) return;
    room.desks.forEach((desk) => {
      if (desk.occupant && desk.occupant.status === 'pending') {
        desk.occupant.status = 'verified';
        const log = state.studyLogs.find(
          (l) => l.studentId === desk.occupant!.studentId && l.active
        );
        if (log) {
          log.status = 'verified';
        }
      }
    });
    this.saveState(state);
  }

  public rejectStudentPresence(classId: ClassId, deskNumber: number): void {
    const state = this.getState();
    const desk = state.classrooms[classId]?.desks.find(
      (d) => d.deskNumber === deskNumber
    );
    if (desk && desk.occupant) {
      const studentId = desk.occupant.studentId;
      const finalSecs = getLiveElapsedSeconds(desk.occupant, Date.now());
      const log = state.studyLogs.find(
        (l) => l.studentId === studentId && l.active
      );
      if (log) {
        log.totalSeconds = finalSecs;
        log.active = false;
        log.status = 'rejected';
      }
      desk.occupant = null;
      this.saveState(state);
    }
  }

  public addHomework(params: {
    classId: ClassId;
    subject: string;
    description: string;
    deadline: string;
    pinned?: boolean;
    authorName: string;
  }): void {
    const state = this.getState();
    const room = state.classrooms[params.classId];
    if (!room) return;
    const nowStr = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    room.homework.unshift({
      id: `hw-${Date.now()}`,
      classId: params.classId,
      subject: params.subject.trim() || 'Этюд / Домашнее задание',
      description: params.description.trim(),
      deadline: params.deadline.trim() || 'Сегодня, 20:30',
      pinned: Boolean(params.pinned),
      createdAt: nowStr,
      authorName: formatStudentShortName(params.authorName),
    });
    this.saveState(state);
  }

  public togglePinHomework(classId: ClassId, homeworkId: string): void {
    const state = this.getState();
    const room = state.classrooms[classId];
    if (!room) return;
    const item = room.homework.find((h) => h.id === homeworkId);
    if (item) {
      item.pinned = !item.pinned;
      this.saveState(state);
    }
  }

  public deleteHomework(classId: ClassId, homeworkId: string): void {
    const state = this.getState();
    const room = state.classrooms[classId];
    if (!room) return;
    room.homework = room.homework.filter((h) => h.id !== homeworkId);
    this.saveState(state);
  }
}

export const storageService = new StorageService();
