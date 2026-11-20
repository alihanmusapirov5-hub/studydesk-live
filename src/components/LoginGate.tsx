import React, { useEffect, useState } from 'react';
import { Lock, UserPlus } from 'lucide-react';
import { storageService, UserAccount } from '../services/storageService';

interface LoginGateProps {
  onAuthenticated: (user: UserAccount) => void;
  onOpenSecretPanel: () => void;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onAuthenticated,
  onOpenSecretPanel,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [accessCode, setAccessCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastInitial, setLastInitial] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
      firstName,
      lastInitial,
      password: regPassword,
    });
    if (res.error || !res.user) {
      setErrorMsg(res.error || 'Ошибка создания аккаунта');
      return;
    }
    onAuthenticated(res.user);
  };

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900 flex flex-col items-center justify-center p-4 relative">
      {/* Незаметная секретная зона в самом верхнем левом углу экрана */}
      <button
        type="button"
        onClick={onOpenSecretPanel}
        aria-label="System"
        className="fixed top-0 left-0 w-7 h-7 z-50 opacity-0 cursor-default"
      />

      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Нажатие на логотип в левом верхнем углу карточки также открывает секретную панель владельца */}
            <button
              type="button"
              onClick={onOpenSecretPanel}
              className="focus:outline-none cursor-default"
            >
              <img
                src="./favicon.svg"
                alt="StudyDesk Logo"
                className="w-10 h-10 rounded-xl shadow-sm"
              />
            </button>
            <div>
              <span className="text-base font-bold tracking-tight block">
                StudyDesk Live
              </span>
              <span className="text-[11px] text-slate-400">
                Школьная система контроля и Этюда (19:00–20:30)
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-xs font-mono">
            7А–11Б
          </span>
        </div>

        {/* Переключатель Вход / Регистрация */}
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
            <span>Регистрация</span>
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
                  placeholder="Введите логин"
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
                Войти
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Код класса
                </label>
                <input
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Введите код вашего класса"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-indigo-50/50 border border-indigo-300 text-sm text-slate-900 font-mono font-bold uppercase focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Имя
                  </label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ваше имя"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>

                <div className="col-span-4">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Фамилия (1 б.)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={1}
                    value={lastInitial}
                    onChange={(e) =>
                      setLastInitial(e.target.value.toUpperCase())
                    }
                    placeholder="Буква"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-center font-bold uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Логин
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="Придумайте логин"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Придумайте пароль"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer shadow-sm mt-2"
              >
                Создать аккаунт
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
