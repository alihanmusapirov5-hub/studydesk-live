import React, { useState } from 'react';
import {
  Maximize2,
  Check,
  X,
  RefreshCw,
  QrCode,
  CheckCircle2,
  ShieldAlert,
  Clock,
  Users,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
import { ClassRatingAndAwayPanel } from './ClassRatingAndAwayPanel';

interface CuratorDashboardProps {
  user: UserAccount;
  state: AppState;
  now: number;
}

export const CuratorDashboard: React.FC<CuratorDashboardProps> = ({
  user,
  state,
  now,
}) => {
  const assignedClassId = user.classId;
  const classroom = state.classrooms[assignedClassId];
  const classAccess = state.classAccess[assignedClassId];

  const [fullscreenQR, setFullscreenQR] = useState(false);

  const seatedOccupants: DeskOccupant[] = classroom.desks
    .filter((d) => d.occupant !== null)
    .map((d) => d.occupant!);

  const pendingOccupants = seatedOccupants.filter((o) => o.status === 'pending');
  const verifiedOccupants = seatedOccupants.filter(
    (o) => o.status === 'verified'
  );

  const sortedOccupants = [...seatedOccupants].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'pending' ? -1 : 1;
    return a.deskNumber - b.deskNumber;
  });

  const allClassStudents = state.users.filter(
    (u) => u.role === 'student' && u.classId === assignedClassId
  );

  // Реальная ссылка внутри QR-кода для сканирования камерой телефона ученика
  const boardQrUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?classCode=${classAccess.studentJoinCode}&room=${assignedClassId}&token=${classroom.qrToken}`
      : classroom.qrToken;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Шапка куратора */}
      <div className="rounded-xl bg-slate-900 text-white p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Куратор • Только класс {assignedClassId}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Этюд 19:00–20:30
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold mt-1.5">
            Класс {assignedClassId} ({classroom.roomName}) • Куратор:{' '}
            {formatStudentShortName(user.fullName)}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
            Код рег. класса:{' '}
            <strong className="text-indigo-300">
              {classAccess.studentJoinCode}
            </strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700">
            За партами:{' '}
            <strong>
              {seatedOccupants.length}/{DESKS_PER_CLASS}
            </strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold">
            Подтверждено: {verifiedOccupants.length}
          </div>
        </div>
      </div>

      {/* Верхний блок: Реальный QR-код на доску + Подтверждение присутствия */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 1. Реальный QR-код на доске */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-indigo-600" />
                Реальный QR-ключ на доске
              </span>
              <button
                type="button"
                onClick={() => storageService.regenerateRoomQR(assignedClassId)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Сменить ключ</span>
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Ученики не видят этот ключ на своих экранах — они должны{' '}
              <strong>отсканировать этот QR-код камерой с вашей доски</strong> перед посадкой.
            </p>

            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <QRCodeSVG value={boardQrUrl} size={168} level="M" />
              </div>

              <div className="mt-3 w-full space-y-1.5 text-center">
                <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-mono">
                  Ключ места:{' '}
                  <strong className="text-indigo-900">
                    {classroom.qrToken}
                  </strong>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono">
                  Код рег. класса:{' '}
                  <strong className="text-slate-900">
                    {classAccess.studentJoinCode}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFullscreenQR(true)}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Вывести QR на доску (Во весь экран)</span>
          </button>
        </div>

        {/* 2. Панель подтверждения присутствия */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Подтверждение присутствия • Класс {assignedClassId} (
                  {DESKS_PER_CLASS} парты)
                </h2>
                <p className="text-xs text-slate-500">
                  Проверьте, что ученик сидит за партой, и нажмите «Подтвердить».
                </p>
              </div>

              {pendingOccupants.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    storageService.confirmAllInClass(assignedClassId)
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  Подтвердить всех ({pendingOccupants.length})
                </button>
              )}
            </div>

            <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
              {sortedOccupants.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                  В кабинете {assignedClassId} сейчас никто не сидит за партами.
                </div>
              ) : (
                sortedOccupants.map((occ) => {
                  const isPending = occ.status === 'pending';
                  const elapsed = getLiveElapsedSeconds(occ, now);

                  return (
                    <div
                      key={`${occ.studentId}-${occ.deskNumber}`}
                      className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                        isPending
                          ? 'bg-amber-50/50 border-amber-300'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center ${
                            isPending
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          №{occ.deskNumber}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {formatStudentShortName(occ.studentName)}
                            </span>
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                <ShieldAlert className="w-3 h-3" />
                                Ожидает подтверждения
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3" />
                                Подтверждён
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">
                            Вход: <strong>{occ.arrivedAt}</strong> • Учит:{' '}
                            <strong className="text-indigo-700">
                              {occ.subject}
                            </strong>{' '}
                            • Таймер:{' '}
                            <strong className="font-mono">
                              {formatDuration(elapsed)}
                            </strong>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-auto">
                        {isPending && (
                          <button
                            type="button"
                            onClick={() =>
                              storageService.confirmStudentPresence(
                                assignedClassId,
                                occ.deskNumber
                              )
                            }
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Подтвердить ✓</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            storageService.rejectStudentPresence(
                              assignedClassId,
                              occ.deskNumber
                            )
                          }
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-200 text-xs font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Снять</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Контроль явки всех учеников класса на Этюд (19:00 - 20:30) */}
          <div className="mt-4 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Список учеников класса {assignedClassId} на Этюд (19:00–20:30)
              </span>
              <span className="text-xs text-slate-500">
                Зарегистрировано: {allClassStudents.length} чел.
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {allClassStudents.map((stu) => {
                const seatedDesk = classroom.desks.find(
                  (d) => d.occupant && d.occupant.studentId === stu.id
                );
                return (
                  <div
                    key={stu.id}
                    className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 ${
                      seatedDesk
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : stu.currentLocationStatus
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-bold">
                      {formatStudentShortName(stu.fullName)}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {seatedDesk
                        ? `✓ Парта №${seatedDesk.deskNumber}`
                        : stu.currentLocationStatus
                        ? `📍 ${stu.currentLocationStatus}`
                        : '❌ Не отметился'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Доска домашних заданий на Этюд */}
      <HomeworkBoard
        classId={assignedClassId}
        homework={classroom.homework}
        canAlwaysEdit={true}
        allowLeaderToggle={false}
        authorName={user.fullName}
      />

      {/* ТОП-5 Рейтинг и Чат «Где я нахожусь (если вне класса)» */}
      <ClassRatingAndAwayPanel
        currentUser={user}
        classId={assignedClassId}
        state={state}
        now={now}
      />

      {/* Полноэкранный режим QR на доске для класса */}
      {fullscreenQR && (
        <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6">
          <button
            type="button"
            onClick={() => setFullscreenQR(false)}
            className="absolute top-6 right-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider border border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Закрыть режим доски</span>
          </button>

          <div className="text-center max-w-xl space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold uppercase tracking-widest">
              <Clock className="w-4 h-4" />
              Обязательный Этюд 19:00 – 20:30 • Класс {assignedClassId}
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Реальный QR-ключ для посадки за парту
            </h2>
            <p className="text-slate-400 text-sm">
              Наведите камеру телефона на этот QR-код или введите ключ с экрана
            </p>

            <div className="p-6 bg-white rounded-3xl shadow-2xl inline-block">
              <QRCodeSVG value={boardQrUrl} size={310} level="M" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md mx-auto pt-2">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] uppercase text-slate-400 font-semibold">
                  Ключ для посадки за парту
                </div>
                <div className="text-xl font-mono font-extrabold text-indigo-400 mt-0.5">
                  {classroom.qrToken}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-[11px] uppercase text-slate-400 font-semibold">
                  Код регистрации в {assignedClassId}
                </div>
                <div className="text-xl font-mono font-extrabold text-emerald-400 mt-0.5">
                  {classAccess.studentJoinCode}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
