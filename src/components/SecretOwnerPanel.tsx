import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  RefreshCw,
  Lock,
  Database,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import {
  AppState,
  ClassId,
  CLASS_IDS,
  formatStudentShortName,
  getTodayDateKey,
  storageService,
  UserRole,
} from '../services/storageService';
import { CloudDatabaseModal } from './CloudDatabaseModal';

interface SecretOwnerPanelProps {
  isOpen: boolean;
  state: AppState;
  onClose: () => void;
  onResetAll: () => void;
}

const SECRET_UNLOCK_KEY = 'studydesk_owner_unlocked_v1';

export const SecretOwnerPanel: React.FC<SecretOwnerPanelProps> = ({
  isOpen,
  state,
  onClose,
  onResetAll,
}) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(SECRET_UNLOCK_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);

  // Форма создания любого аккаунта
  const [newClassId, setNewClassId] = useState<ClassId>('7A');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastInitial, setNewLastInitial] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pinInput.trim().toLowerCase();
    if (
      clean === 'admin' ||
      clean === '0000' ||
      clean === '1234' ||
      clean === '7777' ||
      clean === 'zavuch'
    ) {
      sessionStorage.setItem(SECRET_UNLOCK_KEY, 'true');
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleAdminCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = storageService.adminCreateUser({
      firstName: newFirstName,
      lastInitial: newLastInitial || 'А',
      username: newUsername,
      password: newPassword,
      role: newRole,
      classId: newClassId,
    });
    if (res.error) {
      setAdminMsg(`Ошибка: ${res.error}`);
      return;
    }
    setAdminMsg(
      `✓ Аккаунт (@${newUsername}) добавлен в класс ${newClassId}!`
    );
    setNewFirstName('');
    setNewLastInitial('');
    setNewUsername('');
    setNewPassword('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      {!unlocked ? (
        <div className="w-full max-w-sm bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Lock className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold">Секретная панель владельца</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Секретный мастер-пароль
              </label>
              <input
                type="password"
                autoFocus
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Введите мастер-код"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
              {pinError && (
                <span className="text-xs text-rose-400 mt-1 block">
                  Неверный мастер-код
                </span>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              Открыть секретную панель
            </button>
          </form>
        </div>
      ) : (
        <div className="w-full max-w-6xl bg-white text-slate-900 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
          {/* Шапка секретной панели */}
          <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-sm sm:text-base font-bold">
                  Секретная Админ-Панель Владельца (Логины, Пароли и Коды Классов)
                </h2>
                <p className="text-[11px] text-slate-400">
                  Ежедневная дата QR-ключей: {getTodayDateKey()} (обновляется автоматически каждые 24 часа)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCloudModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold border border-slate-700 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5" />
                <span>Настройки Supabase</span>
              </button>

              <button
                type="button"
                onClick={onResetAll}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/30 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Сброс БД</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Закрыть</span>
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {adminMsg && (
              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
                {adminMsg}
              </div>
            )}

            {/* Форма создания любого аккаунта */}
            <form
              onSubmit={handleAdminCreateUser}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5 items-end"
            >
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Класс
                </label>
                <select
                  value={newClassId}
                  onChange={(e) => setNewClassId(e.target.value as ClassId)}
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                >
                  {CLASS_IDS.map((cid) => (
                    <option key={cid} value={cid}>
                      Класс {cid}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Роль
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-900"
                >
                  <option value="student">Ученик</option>
                  <option value="curator">Куратор</option>
                  <option value="host">Завуч</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  required
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  placeholder="Имя"
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Фамилия (1 б.)
                </label>
                <input
                  type="text"
                  required
                  maxLength={1}
                  value={newLastInitial}
                  onChange={(e) =>
                    setNewLastInitial(e.target.value.toUpperCase())
                  }
                  placeholder="Буква"
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs text-center font-bold uppercase text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Логин
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Логин"
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Пароль
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Пароль"
                  className="w-full px-2.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-mono text-slate-900"
                />
              </div>

              <button
                type="submit"
                className="py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1 cursor-pointer h-[34px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Создать</span>
              </button>
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Таблица 1: Все коды классов и сегодняшние ежедневные QR-ключи */}
              <div className="lg:col-span-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Коды регистрации классов (7А–11Б) и сегодняшние QR-ключи
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                        <th className="py-2.5 px-3">Класс</th>
                        <th className="py-2.5 px-3">Код Учеников</th>
                        <th className="py-2.5 px-3">Код Куратора</th>
                        <th className="py-2.5 px-3">QR-ключ сегодня</th>
                        <th className="py-2.5 px-3 text-right">Чел.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {CLASS_IDS.map((cid) => {
                        const cfg = state.classAccess[cid];
                        const room = state.classrooms[cid];
                        const stuCount = state.users.filter(
                          (u) => u.role === 'student' && u.classId === cid
                        ).length;
                        return (
                          <tr key={cid} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-bold text-slate-900">
                              {cid}
                            </td>
                            <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                              {cfg.studentJoinCode}
                            </td>
                            <td className="py-2 px-3 font-mono text-emerald-700">
                              {cfg.curatorJoinCode}
                            </td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                              <div className="flex items-center gap-1.5">
                                <span>{room.qrToken}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    storageService.regenerateRoomQR(cid)
                                  }
                                  title="Сменить QR-ключ вручную"
                                  className="text-slate-400 hover:text-indigo-600 cursor-pointer"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              {stuCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Таблица 2: Все логины и пароли */}
              <div className="lg:col-span-6">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Все логины и пароли в базе ({state.users.length})
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                        <th className="py-2.5 px-3">Имя Ф.</th>
                        <th className="py-2.5 px-3">Роль / Класс</th>
                        <th className="py-2.5 px-3">Логин</th>
                        <th className="py-2.5 px-3">Пароль</th>
                        <th className="py-2.5 px-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-900">
                            {formatStudentShortName(u.fullName)}
                          </td>
                          <td className="py-2 px-3">
                            {u.role === 'host'
                              ? 'Завуч'
                              : `${u.classId} • ${
                                  u.role === 'curator' ? 'Куратор' : 'Ученик'
                                }`}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-indigo-900">
                            {u.username}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-emerald-700">
                            {u.password}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              type="button"
                              onClick={() =>
                                storageService.adminDeleteUser(u.id)
                              }
                              title="Удалить аккаунт"
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CloudDatabaseModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </div>
  );
};
