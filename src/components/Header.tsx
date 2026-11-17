import React, { useState } from 'react';
import { LogOut, RotateCcw, QrCode, Clock, Database } from 'lucide-react';
import { storageService, UserAccount } from '../services/storageService';
import { CloudDatabaseModal } from './CloudDatabaseModal';

interface HeaderProps {
  user: UserAccount;
  etudeActive?: boolean;
  onLogout: () => void;
  onResetDemo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  etudeActive = true,
  onLogout,
  onResetDemo,
}) => {
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const cloudStatus = storageService.getCloudStatus();

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
        Завуч / Админ Хост (7А–11Б)
      </span>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900 text-white border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src="./favicon.svg"
              alt="StudyDesk Logo"
              className="w-9 h-9 rounded-xl shadow-sm"
            />
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
            {/* Кнопка настройки облачной БД Supabase */}
            <button
              type="button"
              onClick={() => setCloudModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                cloudStatus.status === 'connected'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                  : cloudStatus.status === 'error'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {cloudStatus.status === 'connected'
                  ? 'Облако БД: ВКЛ'
                  : cloudStatus.status === 'error'
                  ? 'Ошибка БД'
                  : 'Подключить БД'}
              </span>
            </button>

            <div className="hidden md:flex items-center gap-3">
              {roleBadge()}
              <div className="text-right">
                <div className="text-xs font-bold text-white leading-tight">
                  {user.fullName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  @{user.username}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onResetDemo}
              title="Сбросить данные к исходным"
              className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Сброс</span>
            </button>

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

      <CloudDatabaseModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
      />
    </>
  );
};
