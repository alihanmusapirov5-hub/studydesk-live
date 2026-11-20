import React, { useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  KeyRound,
  FolderKey,
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
  storageService,
  UserAccount,
  UserRole,
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

  // Отдельное окно для всех логинов, паролей и кодов классов
  const [accountsWindowOpen, setAccountsWindowOpen] = useState(false);

  // Создание аккаунта в отдельном окне Завуча
  const [newClassId, setNewClassId] = useState<ClassId>('7A');
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastInitial, setNewLastInitial] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const handleAdminCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminMsg(null);
    const res = storageService.adminCreateUser({
      firstName: newFirstName,
      lastInitial: newLastInitial,
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
      `✓ Аккаунт (@${newUsername}) успешно добавлен в класс ${newClassId}!`
    );
    setNewFirstName('');
    setNewLastInitial('');
    setNewUsername('');
    setNewPassword('');
  };

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
    ? allOccupants.filter(
        (o) =>
          o.studentName.toLowerCase().includes(trimmedSearch) ||
          o.classId.toLowerCase().includes(trimmedSearch) ||
          o.subject.toLowerCase().includes(trimmedSearch)
      )
    : allOccupants;

  const inspectedRoom = state.classrooms[inspectedClassId];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Верхняя панель Завуча с кнопкой открытия отдельного окна логинов и паролей */}
      <div className="rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold">
                Панель Завуча • Контроль школы и Этюда (19:00 – 20:30)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-slate-950">
                ADMIN HOST
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Классы 7А–11Б ({DESKS_PER_CLASS} парты в каждом классе) • ТОП-5 учеников • Мониторинг в реальном времени
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAccountsWindowOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors cursor-pointer"
          >
            <FolderKey className="w-4 h-4" />
            <span>Логины, пароли и коды классов ({state.users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => storageService.toggleEtudeMode()}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              state.etudeModeActive
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            Этюд: {state.etudeModeActive ? 'ВКЛ' : 'ВЫКЛ'}
          </button>
        </div>
      </div>

      {/* 1. Компактные метрики по школе */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
              Подтверждено кураторами
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
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

      {/* 3. Поиск ученика и переключение классов (7А–11Б) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-sm font-bold text-slate-900">
            Глобальный поиск ученика за партой (7А–11Б)
          </h2>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени, классу или предмету..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="py-4 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            Сейчас за партами никого нет.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-56 overflow-y-auto">
            {filteredStudents.map((occ) => (
              <div
                key={`${occ.classId}-${occ.deskNumber}`}
                onClick={() => setInspectedClassId(occ.classId)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50/60 flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {formatStudentShortName(occ.studentName)} ({occ.classId} •
                    Парта №{occ.deskNumber})
                  </div>
                  <div className="text-[11px] text-indigo-700 mt-0.5">
                    📚 {occ.subject} •{' '}
                    {formatDuration(getLiveElapsedSeconds(occ, now))}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    occ.status === 'verified'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {occ.status === 'verified' ? 'Подтверждён' : 'Ожидание'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Кнопки всех 10 классов */}
        <div className="pt-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Выберите класс для просмотра ({DESKS_PER_CLASS} парты в каждом):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2">
            {CLASS_IDS.map((cid) => {
              const room = state.classrooms[cid];
              const seated = room.desks.filter(
                (d) => d.occupant !== null
              ).length;
              const isSelected = inspectedClassId === cid;
              return (
                <button
                  key={cid}
                  type="button"
                  onClick={() => setInspectedClassId(cid)}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="text-sm font-bold">{cid}</div>
                  <div
                    className={`text-[11px] font-mono mt-0.5 ${
                      isSelected ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {seated}/{DESKS_PER_CLASS}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Просмотр выбранного кабинета (24 парты) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600">
              Инспекция кабинета ({DESKS_PER_CLASS} парты)
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Класс {inspectedClassId} ({inspectedRoom.roomName}) • Куратор:{' '}
              {formatStudentShortName(inspectedRoom.curatorName)}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-mono">
              Код рег. учеников:{' '}
              <strong>
                {state.classAccess[inspectedClassId].studentJoinCode}
              </strong>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs font-mono text-indigo-900">
              QR-ключ доски: <strong>{inspectedRoom.qrToken}</strong>
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

      {/* ОТДЕЛЬНОЕ ОКНО: Все логины, пароли и коды классов */}
      {accountsWindowOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            {/* Шапка окна */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FolderKey className="w-5 h-5 text-indigo-400" />
                <div>
                  <h2 className="text-sm sm:text-base font-bold">
                    База логинов, паролей и кодов регистрации классов (7А–11Б)
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Отдельное окно управления всеми аккаунтами учеников, кураторов и кодами доступа
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAccountsWindowOpen(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Закрыть окно</span>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {adminMsg && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold">
                  {adminMsg}
                </div>
              )}

              {/* Форма прямого создания любого аккаунта Завучем */}
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
                  <span>Добавить</span>
                </button>
              </form>

              {/* Две таблицы в отдельном окне: 1) Коды классов; 2) Логины и пароли всех аккаунтов */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Коды регистрации классов (7А–11Б) и QR-ключи
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                          <th className="py-2.5 px-3">Класс</th>
                          <th className="py-2.5 px-3">Код Учеников</th>
                          <th className="py-2.5 px-3">Код Куратора</th>
                          <th className="py-2.5 px-3">QR-ключ доски</th>
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
                              <td className="py-2 px-3 font-mono font-semibold text-slate-700">
                                <div className="flex items-center gap-1.5">
                                  <span>{room.qrToken}</span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      storageService.regenerateRoomQR(cid)
                                    }
                                    title="Сменить QR-ключ"
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

                <div className="lg:col-span-6">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Логины и пароли всех пользователей ({state.users.length})
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
                            <td className="py-2 px-3 font-mono text-slate-600">
                              {u.password}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {u.id !== user.id && (
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
                              )}
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
        </div>
      )}
    </div>
  );
};
