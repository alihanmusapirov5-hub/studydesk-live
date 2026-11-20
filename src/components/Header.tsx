import React from 'react';
import { LogOut, Clock } from 'lucide-react';
import {
  formatStudentShortName,
  UserAccount,
} from '../services/storageService';

interface HeaderProps {
  user: UserAccount;
  etudeActive?: boolean;
  onLogout: () => void;
  onOpenSecretPanel: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  etudeActive = true,
  onLogout,
  onOpenSecretPanel,
}) => {
  const roleBadge = () => {
    if (user.role === 'student') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold">
          Ученик • Класс {user.classId}
        </span>
      );
    }
    if (user.role === 'curator') {
      return (
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-semibold">
          Куратор • Класс {user.classId}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-200 border border-amber-400/30 text-xs font-semibold">
        Завуч (7А–11Б)
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md relative">
      {/* Скрытая точка в самом верхнем левом углу экрана для открытия Секретной Админ-Панели */}
      <button
        type="button"
        onClick={onOpenSecretPanel}
        aria-label="System"
        className="fixed top-0 left-0 w-5 h-5 z-50 opacity-0 cursor-default"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Нажатие на иконку логотипа в верхнем левом углу также открывает секретную панель владельца */}
          <button
            type="button"
            onClick={onOpenSecretPanel}
            className="focus:outline-none cursor-default"
          >
            <img
              src="./favicon.svg"
              alt="StudyDesk Logo"
              className="w-9 h-9 rounded-xl shadow-sm"
            />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-base tracking-tight">
                StudyDesk <span className="text-indigo-400">Live</span>
              </span>
              {etudeActive && (
                <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  <Clock className="w-3 h-3" />
                  Этюд 19:00–20:30
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-3">
            {roleBadge()}
            <div className="text-right">
              <div className="text-xs font-bold text-white leading-tight">
                {formatStudentShortName(user.fullName)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                @{user.username}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </header>
  );
};
