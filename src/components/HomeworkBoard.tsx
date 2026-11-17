import React, { useState } from 'react';
import { Pin, Plus, Trash2, X, BookOpen, Calendar } from 'lucide-react';
import {
  ClassId,
  HomeworkItem,
  storageService,
} from '../services/storageService';

interface HomeworkBoardProps {
  classId: ClassId;
  homework: HomeworkItem[];
  canAlwaysEdit: boolean;
  allowLeaderToggle?: boolean;
  authorName: string;
}

export const HomeworkBoard: React.FC<HomeworkBoardProps> = ({
  classId,
  homework,
  canAlwaysEdit,
  allowLeaderToggle = false,
  authorName,
}) => {
  const [isLeaderMode, setIsLeaderMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('Сегодня, 20:30 (Этюд)');
  const [pinned, setPinned] = useState(true);

  const canEdit = canAlwaysEdit || isLeaderMode;

  const sortedHomework = [...homework].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return 0;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;
    storageService.addHomework({
      classId,
      subject,
      description,
      deadline,
      pinned,
      authorName,
    });
    setSubject('');
    setDescription('');
    setShowAddForm(false);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Шапка доски */}
      <div className="px-5 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <div>
            <h2 className="text-sm font-bold tracking-tight">
              Доска домашних заданий на Этюд (19:00–20:30) • Класс {classId}
            </h2>
            <p className="text-[11px] text-slate-400">
              Задания для обязательной вечерней самоподготовки
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {allowLeaderToggle && !canAlwaysEdit && (
            <button
              type="button"
              onClick={() => {
                setIsLeaderMode(!isLeaderMode);
                if (isLeaderMode) setShowAddForm(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isLeaderMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              Режим старосты: {isLeaderMode ? 'ВКЛ' : 'ВЫКЛ'}
            </button>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              {showAddForm ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>Закрыть</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить задание</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Форма добавления */}
      {canEdit && showAddForm && (
        <form
          onSubmit={handleAddSubmit}
          className="p-4 bg-slate-50 border-b border-slate-200 space-y-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Предмет
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Например: Алгебра, Физика, IELTS"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                Срок выполнения
              </label>
              <input
                type="text"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                placeholder="Сегодня, 20:30 (Этюд)"
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Что нужно сделать
            </label>
            <textarea
              rows={2}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Укажите страницы, номера упражнений или тему..."
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600"
              />
              <span>Закрепить как важное на Этюд</span>
            </label>

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Опубликовать на доску
            </button>
          </div>
        </form>
      )}

      {/* Список заданий */}
      <div className="divide-y divide-slate-100">
        {sortedHomework.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Заданий на Этюд для класса {classId} пока не добавлено.
          </div>
        ) : (
          sortedHomework.map((item) => (
            <div
              key={item.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                item.pinned ? 'bg-indigo-50/30' : 'bg-white'
              }`}
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {item.pinned && (
                    <span className="px-2 py-0.5 rounded bg-indigo-600 text-white text-[10px] font-bold uppercase">
                      Важно на Этюд
                    </span>
                  )}
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    {item.subject}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-500">
                    <Calendar className="w-3 h-3 text-indigo-500" />
                    До: {item.deadline}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-800">
                  {item.description}
                </p>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      storageService.togglePinHomework(classId, item.id)
                    }
                    title="Закрепить / Открепить"
                    className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                      item.pinned
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      storageService.deleteHomework(classId, item.id)
                    }
                    title="Удалить"
                    className="p-1.5 rounded-lg bg-white hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
