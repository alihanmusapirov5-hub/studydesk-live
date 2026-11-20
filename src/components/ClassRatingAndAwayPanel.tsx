import React, { useState } from 'react';
import {
  Trophy,
  MapPin,
  Send,
  Clock,
  Award,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react';
import {
  AppState,
  AWAY_LOCATIONS,
  ClassId,
  CLASS_IDS,
  DESKS_PER_CLASS,
  formatDuration,
  formatStudentShortName,
  getStudentTotalStudySeconds,
  storageService,
  UserAccount,
} from '../services/storageService';

interface ClassRatingAndAwayPanelProps {
  currentUser: UserAccount;
  classId: ClassId;
  state: AppState;
  now: number;
  showAllClassesInChat?: boolean;
}

export const ClassRatingAndAwayPanel: React.FC<ClassRatingAndAwayPanelProps> = ({
  currentUser,
  classId,
  state,
  now,
  showAllClassesInChat = false,
}) => {
  const [selectedLocation, setSelectedLocation] = useState(AWAY_LOCATIONS[0]);
  const [chatMessage, setChatMessage] = useState('');
  const [ratingTab, setRatingTab] = useState<'students' | 'classes'>('students');

  // ТОП-5 учеников
  const targetStudentsPool = showAllClassesInChat
    ? state.users.filter((u) => u.role === 'student')
    : state.users.filter((u) => u.role === 'student' && u.classId === classId);

  const top5Students = targetStudentsPool
    .map((u) => {
      const totalSecs = getStudentTotalStudySeconds(u, state, now);
      const isSeated = state.classrooms[u.classId]?.desks.some(
        (d) => d.occupant && d.occupant.studentId === u.id
      );
      return {
        ...u,
        shortName: formatStudentShortName(u.fullName),
        liveTotalSeconds: totalSecs,
        isSeated,
      };
    })
    .sort((a, b) => b.liveTotalSeconds - a.liveTotalSeconds)
    .slice(0, 5); // Строго ТОП-5 учеников!

  // ТОП-5 классов школы (7А–11Б)
  const top5Classes = CLASS_IDS.map((cid) => {
    const studentsOfClass = state.users.filter(
      (u) => u.role === 'student' && u.classId === cid
    );
    const totalClassSeconds = studentsOfClass.reduce(
      (acc, u) => acc + getStudentTotalStudySeconds(u, state, now),
      0
    );
    const seatedNow = state.classrooms[cid].desks.filter(
      (d) => d.occupant !== null
    ).length;
    return {
      classId: cid,
      totalSeconds: totalClassSeconds,
      studentsCount: studentsOfClass.length,
      seatedNow,
    };
  })
    .sort((a, b) => b.totalSeconds - a.totalSeconds)
    .slice(0, 5);

  const relevantMessages = showAllClassesInChat
    ? state.awayMessages
    : state.awayMessages.filter((m) => m.classId === classId);

  const handleSendStatus = (e: React.FormEvent) => {
    e.preventDefault();
    storageService.postAwayStatus({
      user: currentUser,
      locationLabel: selectedLocation,
      message: chatMessage,
    });
    setChatMessage('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Левая колонка: ТОП-5 учеников */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  ТОП-5 Рейтинг учёбы на Этюде
                </h3>
                <p className="text-[11px] text-slate-400">
                  Лучшие 5 учеников по времени самоподготовки (19:00–20:30)
                </p>
              </div>
            </div>

            <div className="flex bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setRatingTab('students')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  ratingTab === 'students'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ТОП-5 Учеников
              </button>
              <button
                type="button"
                onClick={() => setRatingTab('classes')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  ratingTab === 'classes'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ТОП-5 Классов
              </button>
            </div>
          </div>

          <div className="p-4 divide-y divide-slate-100">
            {ratingTab === 'students' ? (
              top5Students.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Пока нет зарегистрированных учеников для формирования ТОП-5.
                </div>
              ) : (
                top5Students.map((stu, idx) => {
                  const rank = idx + 1;
                  return (
                    <div
                      key={stu.id}
                      className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            rank === 1
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : rank === 2
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : rank === 3
                              ? 'bg-orange-100 text-orange-700 border border-orange-300'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          #{rank}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                            <span>{stu.shortName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                              {stu.classId}
                            </span>
                            {stu.isSeated && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />В классе
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {stu.currentLocationStatus || 'Вне парты'}
                          </div>
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="text-xs sm:text-sm font-bold text-indigo-700 flex items-center justify-end gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {formatDuration(stu.liveTotalSeconds)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {Math.round(stu.liveTotalSeconds / 60)} мин
                        </div>
                      </div>
                    </div>
                  );
                })
              )
            ) : (
              top5Classes.map((item, idx) => (
                <div
                  key={item.classId}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-700 border border-amber-300'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        Класс {item.classId}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        (За партами: {item.seatedNow}/{DESKS_PER_CLASS} •
                        Учеников: {item.studentsCount})
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-bold text-indigo-700">
                    {Math.round(item.totalSeconds / 60)} мин (
                    {formatDuration(item.totalSeconds)})
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Обязательный Этюд: ежедневно 19:00 – 20:30</span>
          </span>
          <span className="font-mono font-semibold text-slate-800">
            Норма: 90 мин
          </span>
        </div>
      </div>

      {/* Правая колонка: Чат-отметка «Где я нахожусь (если не в классе)» */}
      <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
        <div>
          <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Отметка локации: Где я нахожусь (если вне класса)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Если вы не в кабинете на Этюде (19:00–20:30), отметьтесь здесь
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300">
              {relevantMessages.length}
            </span>
          </div>

          <form
            onSubmit={handleSendStatus}
            className="p-4 bg-slate-50 border-b border-slate-200 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Где я сейчас
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-600"
                >
                  {AWAY_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-7">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Комментарий для куратора
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Напишите причину или кабинет..."
                    className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Отметиться</span>
                  </button>
                </div>
              </div>
            </div>
          </form>

          <div className="p-4 space-y-2.5 max-h-60 overflow-y-auto">
            {relevantMessages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-1.5">
                <MessageSquare className="w-5 h-5 text-slate-300" />
                <span>Пока никто не отмечался вне кабинета.</span>
              </div>
            ) : (
              relevantMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {formatStudentShortName(msg.userName)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {msg.classId}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        📍 {msg.locationLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{msg.message}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {msg.createdAt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
