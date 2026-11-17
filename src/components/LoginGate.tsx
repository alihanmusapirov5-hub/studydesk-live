import React, { useEffect, useState } from 'react';
import { QrCode, Lock, UserPlus, Database } from 'lucide-react';
import { storageService, UserAccount } from '../services/storageService';
import { CloudDatabaseModal } from './CloudDatabaseModal';

interface LoginGateProps {
  onAuthenticated: (user: UserAccount) => void;
  onResetDemo: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({ onAuthenticated }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [cloudModalOpen, setCloudModalOpen] = useState(false);

  // Поля входа
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Поля регистрации (по многоразовому коду класса от Завуча)
  const [accessCode, setAccessCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Если ученик отсканировал QR-код на доске, автоматически подставляем код класса при регистрации
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('classCode') || params.get('token');
    if (codeParam) {
      setAccessCode(codeParam);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = storageService.login(loginUsername, loginPassword);
    if (res.error || !res.user) {
      setErrorMsg(res.error || 'Ошибка входа');
      return;
    }
    onAuthenticated(res.user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = storageService.registerWithClassCode({
      username: regUsername,
      accessCode,
      fullName,
      password: regPassword,
    });
    if (res.error || !res.user) {
      setErrorMsg(res.error || 'Ошибка создания аккаунта');
      return;
    }
    onAuthenticated(res.user);
  };

  const quickFill = (u: string, p: string) => {
    setActiveTab('login');
    setLoginUsername(u);
    setLoginPassword(p);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight block">
                StudyDesk Live
              </span>
              <span className="text-[11px] text-slate-400">
                Школьная система контроля и Этюда (19:00–20:30)
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCloudModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Облачная БД</span>
          </button>
        </div>

        {/* Переключатель Вход / Создать аккаунт */}
        <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Вход</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg(null);
            }}
            className={`py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'register'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Создать аккаунт</span>
          </button>
        </div>

        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {activeTab === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Логин
                </label>
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="Введите ваш логин"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Введите пароль"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm"
              >
                Войти в систему
              </button>

              {/* Быстрое заполнение для проверки */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Быстрый вход (нажмите для автозаполнения):
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => quickFill('student11a', '1234')}
                    className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200 font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Ученик 11А
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFill('curator11a', '1234')}
                    className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Куратор 11А
                  </button>
                  <button
                    type="button"
                    onClick={() => quickFill('zavuch', 'admin')}
                    className="py-2 px-2 rounded-lg bg-slate-100 hover:bg-amber-50 hover:text-amber-700 border border-slate-200 font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    Завуч (Админ)
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Код класса от Завуча (или ключ с доски)
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Напр.: 7A-1001, 10B-1071, 11A-1081"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50/50 border border-indigo-300 text-sm text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-indigo-600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  По коду класса могут регистрироваться все ученики этого класса.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Ваше Имя и Фамилия
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Например: Сериков Диас"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Придумайте ваш личный Логин
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Например: dias11a или ваше_имя"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Придумайте Пароль
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Минимум 4 символа"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm mt-2"
              >
                Зарегистрироваться в класс
              </button>
            </form>
          )}
        </div>
      </div>

      <CloudDatabaseModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </div>
  );
};
