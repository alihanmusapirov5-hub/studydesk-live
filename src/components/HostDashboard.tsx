import React, { useState } from 'react';
import {
  Search,
  Check,
  X,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  KeyRound,
  GraduationCap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  AppState,
  ClassId,
  CLASS_IDS,
  DESKS_PER_CLASS,
  DeskOccupant,
  formatDuration,
  formatStudentShortName,
  getLiveElapsedSeconds,
  getTodayDateKey,
  storageService,
  UserAccount,
} from '../services/storageService';
import { HomeworkBoard } from './HomeworkBoard';
import { ClassRatingAndAwayPanel } from './ClassRatingAndAwayPanel';

interface HostDashboardProps {
  user: UserAccount;
  state: AppState;
  now: number;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({
  user,
  state,
  now,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectedClassId, setInspectedClassId] = useState<ClassId>('11A');

  // Overall: Сколько всего учеников зарегистрировано в школе
  const allSchoolStudents = state.users.filter((u) => u.role === 'student');
  const totalRegisteredStudentsInSchool = allSchoolStudents.length;

  // Все ученики за партами по школе (7А–11Б)
  const allOccupants: DeskOccupant[] = [];
  CLASS_IDS.forEach((cid) => {
    state.classrooms[cid].desks.forEach((d) => {
      if (d.occupant) {
        allOccupants.push(d.occupant);
      }
    });
  });

  const totalDesksInSchool = CLASS_IDS.length * DESKS_PER_CLASS; // 240 парт
  const totalPresent = allOccupants.length;
  const verifiedCount = allOccupants.filter(
    (o) => o.status === 'verified'
  ).length;
  const unverifiedCount = allOccupants.filter(
    (o) => o.status === 'pending'
  ).length;
  const totalHomeworkSeconds = allOccupants.reduce(
    (acc, o) => acc + getLiveElapsedSeconds(o, now),
    0
  );

  const trimmedSearch = searchQuery.trim().toLowerCase();
  const filteredStudents = trimmedSearch
    ? allSchoolStudents.filter(
        (u) =>
          u.fullName.toLowerCase().includes(trimmedSearch) ||
          u.classId.toLowerCase().includes(trimmedSearch) ||
          (u.currentLocationStatus || '').toLowerCase().includes(trimmedSearch)
      )
    : [];

  const inspectedRoom = state.classrooms[inspectedClassId];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Верхняя панель Завуча */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold">
                Панель Завуча • Мониторинг школы и Этюда (19:00 – 20:30)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                ЗАВУЧ
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Все классы 7А–11Б • Ежедневный QR ({getTodayDateKey()}) • ТОП-5 учеников школы
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => storageService.toggleEtudeMode()}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
            state.etudeModeActive
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-800 text-slate-300 border-slate-700'
          }`}
        >
          Режим Этюда (19:00–20:30): {state.etudeModeActive ? 'АКТИВЕН' : 'ВЫКЛ'}
        </button>
      </div>

      {/* 1. Overall метрики школы (включая общее количество учеников в школе) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Всего учеников в школе
            </div>
            <div className="text-2xl font-mono font-bold text-indigo-700 mt-1">
              {totalRegisteredStudentsInSchool}
              <span className="text-xs font-normal text-slate-400"> чел.</span>
            </div>
          </div>
          <GraduationCap className="w-7 h-7 text-indigo-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Сейчас за партами
            </div>
            <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
              {totalPresent}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {totalDesksInSchool}
              </span>
            </div>
          </div>
          <Users className="w-7 h-7 text-indigo-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Подтверждено
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-600 mt-1">
              {verifiedCount}
            </div>
          </div>
          <CheckCircle2 className="w-7 h-7 text-emerald-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Ожидают проверки
            </div>
            <div className="text-2xl font-mono font-bold text-amber-600 mt-1">
              {unverifiedCount}
            </div>
          </div>
          <Clock className="w-7 h-7 text-amber-500" />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between col-span-2 lg:col-span-1">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Время на Этюде
            </div>
            <div className="text-2xl font-mono font-bold text-indigo-600 mt-1">
              {Math.round(totalHomeworkSeconds / 60)} мин
            </div>
          </div>
          <KeyRound className="w-7 h-7 text-indigo-500" />
        </div>
      </div>

      {/* 2. ТОП-5 учеников школы и Чат отметок «Где я нахожусь (если вне класса)» */}
      <ClassRatingAndAwayPanel
        currentUser={user}
        classId={inspectedClassId}
        state={state}
        now={now}
        showAllClassesInChat={true}
      />

      {/* 3. Панель всех классов (7А–11Б) и их учеников */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Панель всех классов (7А–11Б) и списки их учеников
            </h2>
            <p className="text-xs text-slate-500">
              Нажмите на любой класс, чтобы открыть его схему из {DESKS_PER_CLASS} парт ниже
            </p>
          </div>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти любого ученика школы..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Результаты глобального поиска ученика */}
        {trimmedSearch && (
          <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 space-y-2">
            <div className="text-xs font-bold text-indigo-900">
              Результаты поиска по запросу «{searchQuery}» ({filteredStudents.length}):
            </div>
            {filteredStudents.length === 0 ? (
              <div className="text-xs text-slate-500">Ученики не найдены.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredStudents.map((stu) => {
                  const desk = state.classrooms[stu.classId]?.desks.find(
                    (d) => d.occupant && d.occupant.studentId === stu.id
                  );
                  return (
                    <div
                      key={stu.id}
                      onClick={() => setInspectedClassId(stu.classId)}
                      className="p-2.5 rounded-lg bg-white border border-slate-200 flex items-center justify-between cursor-pointer hover:border-indigo-500"
                    >
                      <div>
                        <span className="text-xs font-bold text-slate-900">
                          {formatStudentShortName(stu.fullName)}
                        </span>
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-mono font-bold">
                          {stu.classId}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {desk
                            ? `✓ Парта №${desk.deskNumber} (${desk.occupant?.subject})`
                            : stu.currentLocationStatus || 'Не за партой'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Карточки всех 10 классов (7А–11Б) со списками их учеников */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {CLASS_IDS.map((cid) => {
            const room = state.classrooms[cid];
            const studentsInClass = allSchoolStudents.filter(
              (u) => u.classId === cid
            );
            const seatedDesks = room.desks.filter((d) => d.occupant !== null);
            const pendingCount = seatedDesks.filter(
              (d) => d.occupant?.status === 'pending'
            ).length;
            const isSelected = inspectedClassId === cid;

            return (
              <div
                key={cid}
                onClick={() => setInspectedClassId(cid)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/40 border-indigo-600 shadow-md'
                    : 'bg-white border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-extrabold text-slate-900">
                      Класс {cid}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                      Учеников: {studentsInClass.length}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {room.roomName} • Куратор:{' '}
                    {formatStudentShortName(room.curatorName)}
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-600">
                      За партами:{' '}
                      <strong className="text-slate-900">
                        {seatedDesks.length}/{DESKS_PER_CLASS}
                      </strong>
                    </span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                        ⏳ {pendingCount}
                      </span>
                    )}
                  </div>

                  {/* Список учеников этого класса */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1 max-h-36 overflow-y-auto">
                    {studentsInClass.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">
                        Нет зарегистрированных учеников
                      </div>
                    ) : (
                      studentsInClass.map((stu) => {
                        const desk = room.desks.find(
                          (d) => d.occupant && d.occupant.studentId === stu.id
                        );
                        return (
                          <div
                            key={stu.id}
                            className="flex items-center justify-between text-[11px] py-0.5"
                          >
                            <span className="font-semibold text-slate-800 truncate">
                              {formatStudentShortName(stu.fullName)}
                            </span>
                            <span
                              className={`text-[10px] font-mono shrink-0 ml-1 ${
                                desk
                                  ? 'text-emerald-700 font-bold'
                                  : stu.currentLocationStatus
                                  ? 'text-amber-700'
                                  : 'text-slate-400'
                              }`}
                            >
                              {desk
                                ? `№${desk.deskNumber}`
                                : stu.currentLocationStatus
                                ? '📍Вне'
                                : '—'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] font-bold text-indigo-600">
                  {isSelected ? '✓ Выбран для осмотра' : 'Открыть парты →'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Инспекция выбранного кабинета (24 парты) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
              Схема кабинета ({DESKS_PER_CLASS} парты)
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Класс {inspectedClassId} ({inspectedRoom.roomName}) • Куратор:{' '}
              {formatStudentShortName(inspectedRoom.curatorName)}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-mono text-indigo-900">
              Ежедневный QR ({getTodayDateKey()}):{' '}
              <strong>{inspectedRoom.qrToken}</strong>
            </div>
            <div className="p-1 bg-white rounded-lg border border-slate-200">
              <QRCodeSVG value={inspectedRoom.qrToken} size={40} level="M" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {inspectedRoom.desks.map((desk) => {
            const occ = desk.occupant;
            if (!occ) {
              return (
                <div
                  key={desk.deskNumber}
                  className="h-24 p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 flex flex-col justify-between text-slate-400"
                >
                  <div className="text-xs font-mono font-bold">
                    Парта №{desk.deskNumber}
                  </div>
                  <div className="text-[11px]">Свободно</div>
                </div>
              );
            }

            const elapsed = getLiveElapsedSeconds(occ, now);
            const isVerified = occ.status === 'verified';

            return (
              <div
                key={desk.deskNumber}
                className="h-24 p-3 rounded-xl bg-white border-2 border-indigo-600 flex flex-col justify-between shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-slate-900">
                    №{desk.deskNumber}
                  </span>
                  <div className="flex items-center gap-1">
                    {!isVerified && (
                      <button
                        type="button"
                        onClick={() =>
                          storageService.confirmStudentPresence(
                            inspectedClassId,
                            desk.deskNumber
                          )
                        }
                        className="px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold cursor-pointer"
                      >
                        <Check className="w-2.5 h-2.5 inline" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        storageService.rejectStudentPresence(
                          inspectedClassId,
                          desk.deskNumber
                        )
                      }
                      className="p-0.5 rounded border border-slate-200 hover:border-rose-300 text-rose-600 cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {formatStudentShortName(occ.studentName)}
                  </div>
                  <div className="text-[10px] text-indigo-700 truncate">
                    {occ.subject}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{isVerified ? '✓' : '⏳'}</span>
                  <span className="font-bold text-slate-900">
                    {formatDuration(elapsed)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <HomeworkBoard
          classId={inspectedClassId}
          homework={inspectedRoom.homework}
          canAlwaysEdit={true}
          allowLeaderToggle={false}
          authorName={user.fullName}
        />
      </div>
    </div>
  );
};
