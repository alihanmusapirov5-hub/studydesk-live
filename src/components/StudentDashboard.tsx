import React, { useEffect, useState } from 'react';
import {
  QrCode,
  Play,
  Pause,
  LogOut,
  Check,
  Clock,
  CheckCircle2,
  ShieldAlert,
  KeyRound,
} from 'lucide-react';
import {
  AppState,
  DESKS_PER_CLASS,
  DeskOccupant,
  formatDuration,
  formatStudentShortName,
  getLiveElapsedSeconds,
  storageService,
  UserAccount,
} from '../services/storageService';
import { HomeworkBoard } from './HomeworkBoard';
import { QRScannerModal } from './QRScannerModal';
import { ClassRatingAndAwayPanel } from './ClassRatingAndAwayPanel';

interface StudentDashboardProps {
  user: UserAccount;
  state: AppState;
  now: number;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  user,
  state,
  now,
}) => {
  const classId = user.classId;
  const currentClassroom = state.classrooms[classId];
  const classAccess = state.classAccess[classId];

  const [scannerTargetDesk, setScannerTargetDesk] = useState<number | null>(
    null
  );
  const [customTopicDraft, setCustomTopicDraft] = useState('');

  const activeSeat: DeskOccupant | null = (() => {
    for (const d of currentClassroom.desks) {
      if (d.occupant && d.occupant.studentId === user.id) {
        return d.occupant;
      }
    }
    return null;
  })();

  useEffect(() => {
    if (activeSeat) {
      setCustomTopicDraft(activeSeat.subject);
    }
  }, [activeSeat?.subject]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const deskParam = params.get('desk');
    if (deskParam && !activeSeat) {
      const dNum = parseInt(deskParam, 10);
      if (dNum >= 1 && dNum <= DESKS_PER_CLASS) {
        setScannerTargetDesk(dNum);
      }
    }
  }, []);

  const handleEmptyDeskClick = (deskNumber: number) => {
    setScannerTargetDesk(deskNumber);
  };

  const handleQRScanComplete = (
    customSubject: string,
    scannedToken: string
  ): { error?: string } => {
    if (scannerTargetDesk === null) return { error: 'Парта не выбрана' };
    const res = storageService.occupyDeskAfterQR({
      user,
      classId,
      deskNumber: scannerTargetDesk,
      subject: customSubject,
      scannedToken,
    });
    if (!res.error) {
      setScannerTargetDesk(null);
    }
    return res;
  };

  const handleTopicSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSeat || !customTopicDraft.trim()) return;
    storageService.changeStudentSubject(user.id, customTopicDraft.trim());
  };

  const occupiedCount = currentClassroom.desks.filter(
    (d) => d.occupant !== null
  ).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Баннер обязательного Этюда 19:00 - 20:30 (без показа секретного QR-ключа ученику!) */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-4 sm:p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-bold">
                Ежедневный Этюд (19:00 – 20:30) • Обязательная самоподготовка
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Обязательно
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Отсканируйте реальный QR-код на доске куратора, чтобы занять свою парту, либо отметьтесь в чате ниже, если вы вне кабинета.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-lg bg-slate-800/90 border border-slate-700">
            <span className="text-slate-400">Парт занято: </span>
            <strong className="text-white">
              {occupiedCount} / {DESKS_PER_CLASS}
            </strong>
          </div>
        </div>
      </div>

      {/* Панель текущего места ученика */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        {activeSeat ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-mono font-bold text-sm flex flex-col items-center justify-center shadow-sm">
                  <span className="text-[9px] uppercase opacity-80">Парта</span>
                  <span>№{activeSeat.deskNumber}</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-bold text-slate-900">
                      {formatStudentShortName(activeSeat.studentName)}
                    </span>
                    {activeSeat.status === 'verified' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Присутствие подтверждено куратором
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Ожидает подтверждения куратора
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Класс {classId} ({currentClassroom.roomName}) • Время посадки:{' '}
                    <strong className="font-mono">{activeSeat.arrivedAt}</strong>
                  </div>
                </div>
              </div>

              {/* Таймер и управление */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="px-4 py-2 rounded-xl bg-slate-900 text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono font-bold text-base">
                    {formatDuration(getLiveElapsedSeconds(activeSeat, now))}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => storageService.toggleStudentTimer(user.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  {activeSeat.timerRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      <span>Пауза</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Продолжить</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => storageService.leaveDesk(user.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Освободить место</span>
                </button>
              </div>
            </div>

            <form
              onSubmit={handleTopicSave}
              className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
            >
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 shrink-0">
                Что я сейчас учу:
              </label>
              <input
                type="text"
                value={customTopicDraft}
                onChange={(e) => setCustomTopicDraft(e.target.value)}
                placeholder="Напишите предмет и задание, которое выполняете..."
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Сохранить тему</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-slate-900">
                  Вы ещё не заняли парту на Этюд в классе {classId}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Выберите любую из {DESKS_PER_CLASS} парт ниже и отсканируйте реальный QR-код на доске куратора.
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const firstEmpty = currentClassroom.desks.find(
                  (d) => d.occupant === null
                );
                if (firstEmpty) {
                  handleEmptyDeskClick(firstEmpty.deskNumber);
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>Сканировать QR на доске и сесть</span>
            </button>
          </div>
        )}
      </div>

      {/* Схема кабинета (24 парты: 4 ряда по 6 парт) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Схема кабинета {classId} ({currentClassroom.roomName}) •{' '}
              {DESKS_PER_CLASS} парты
            </h2>
            <p className="text-xs text-slate-500">
              Куратор класса: <strong>{currentClassroom.curatorName}</strong> •
              Нажмите на свободную парту для посадки по QR
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-white" />
              Свободно
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              Ожидает куратора
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Подтверждено
            </span>
          </div>
        </div>

        <div className="w-full py-2 rounded-lg bg-slate-900 text-white text-center text-xs font-mono uppercase tracking-widest">
          Интерактивная доска и экран куратора (Сканируйте QR-код с доски)
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {currentClassroom.desks.map((desk) => {
            const occ = desk.occupant;
            const isMe = occ?.studentId === user.id;

            if (!occ) {
              return (
                <button
                  key={desk.deskNumber}
                  type="button"
                  onClick={() => handleEmptyDeskClick(desk.deskNumber)}
                  className="h-28 p-3 rounded-xl bg-slate-50/70 hover:bg-indigo-50/50 border border-dashed border-slate-300 hover:border-indigo-500 transition-all flex flex-col justify-between text-left cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-[11px] font-mono font-bold text-slate-700 group-hover:text-indigo-700">
                      №{desk.deskNumber}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Ряд {desk.row}
                    </span>
                  </div>

                  <div className="my-auto text-center">
                    <span className="text-[11px] text-slate-500 group-hover:text-indigo-700 font-semibold">
                      Свободно
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-indigo-600 font-bold opacity-0 group-hover:opacity-100 text-right">
                    QR-вход →
                  </div>
                </button>
              );
            }

            const elapsed = getLiveElapsedSeconds(occ, now);
            const isVerified = occ.status === 'verified';

            return (
              <div
                key={desk.deskNumber}
                className={`h-28 p-3 rounded-xl border-2 flex flex-col justify-between shadow-sm ${
                  isMe
                    ? 'bg-indigo-50/40 border-indigo-600'
                    : isVerified
                    ? 'bg-white border-emerald-500/60'
                    : 'bg-amber-50/30 border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-mono font-bold">
                    №{desk.deskNumber} {isMe ? '• ВЫ' : ''}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      isVerified
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {isVerified ? '✓' : '⏳'}
                  </span>
                </div>

                <div className="my-auto">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {formatStudentShortName(occ.studentName)}
                  </div>
                  <div className="text-[11px] text-indigo-700 truncate font-medium">
                    {occ.subject}
                  </div>
                </div>

                <div className="pt-1 border-t border-slate-200/80 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-slate-400">{occ.arrivedAt}</span>
                  <span className="font-bold text-slate-900">
                    {formatDuration(elapsed)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Доска заданий */}
      <HomeworkBoard
        classId={classId}
        homework={currentClassroom.homework}
        canAlwaysEdit={false}
        allowLeaderToggle={true}
        authorName={user.fullName}
      />

      {/* ТОП-5 Рейтинг класса и Чат «Где я нахожусь (если вне класса)» */}
      <ClassRatingAndAwayPanel
        currentUser={user}
        classId={classId}
        state={state}
        now={now}
      />

      <QRScannerModal
        isOpen={scannerTargetDesk !== null}
        classId={classId}
        roomName={currentClassroom.roomName}
        deskNumber={scannerTargetDesk || 1}
        qrToken={currentClassroom.qrToken}
        studentJoinCode={classAccess.studentJoinCode}
        onClose={() => setScannerTargetDesk(null)}
        onScanComplete={handleQRScanComplete}
      />
    </div>
  );
};
