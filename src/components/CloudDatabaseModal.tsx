import React, { useState } from 'react';
import {
  Database,
  Check,
  Copy,
  X,
  Cloud,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import {
  getCloudConfig,
  saveCloudConfig,
  SQL_SCHEMA_SCRIPT,
  pushCloudState,
} from '../services/supabaseClient';
import { storageService } from '../services/storageService';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudDatabaseModal: React.FC<CloudDatabaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const initialCfg = getCloudConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(initialCfg.supabaseUrl);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(
    initialCfg.supabaseAnonKey
  );
  const [enabled, setEnabled] = useState(initialCfg.enabled);
  const [copiedSql, setCopiedSql] = useState(false);
  const [testing, setTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (!enabled) {
      saveCloudConfig({ supabaseUrl, supabaseAnonKey, enabled: false });
      setStatusMsg({
        type: 'ok',
        text: 'Переключено в локальный режим (LocalStorage).',
      });
      return;
    }

    if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
      setStatusMsg({
        type: 'err',
        text: 'Укажите Project URL и API Key (anon public) из настроек вашего проекта Supabase.',
      });
      return;
    }

    setTesting(true);
    saveCloudConfig({
      supabaseUrl: supabaseUrl.trim(),
      supabaseAnonKey: supabaseAnonKey.trim(),
      enabled: true,
    });

    const syncRes = await storageService.syncFromCloud(true);
    setTesting(false);

    if (!syncRes.ok) {
      setStatusMsg({
        type: 'err',
        text:
          syncRes.error ||
          'Не удалось подключиться к таблице studydesk_state. Выполните SQL-скрипт ниже в Supabase SQL Editor.',
      });
      return;
    }

    setStatusMsg({
      type: 'ok',
      text: '✓ Облачная база данных Supabase успешно подключена! Теперь все данные синхронизируются через облако между любыми устройствами.',
    });
  };

  const handleForceUploadLocalToCloud = async () => {
    setTesting(true);
    setStatusMsg(null);
    const res = await pushCloudState(storageService.getState());
    setTesting(false);
    if (res.ok) {
      setStatusMsg({
        type: 'ok',
        text: '✓ Текущая база классов, кодов и учеников успешно выгружена в облако Supabase!',
      });
    } else {
      setStatusMsg({
        type: 'err',
        text: res.error || 'Ошибка выгрузки данных в облако',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Шапка */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold">
                Облачная база данных PostgreSQL (Supabase Cloud)
              </h3>
              <p className="text-[11px] text-slate-400">
                Хранение данных в облаке, чтобы сайт работал на GitHub и всех телефонах без вашего ноутбука
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {statusMsg && (
            <div
              className={`p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2.5 ${
                statusMsg.type === 'ok'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {statusMsg.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Шаг 1: SQL скрипт */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Шаг 1. Создайте бесплатный проект на supabase.com и выполните SQL-скрипт
              </span>
              <button
                type="button"
                onClick={handleCopySql}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer"
              >
                {copiedSql ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Скопировано!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Скопировать SQL</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono overflow-x-auto leading-relaxed">
              {SQL_SCHEMA_SCRIPT}
            </pre>
            <p className="text-[11px] text-slate-500">
              Полная схема со всеми 6 таблицами также сохранена в файле{' '}
              <code className="font-mono text-slate-800">
                supabase/schema.sql
              </code>{' '}
              для вашего репозитория GitHub.
            </p>
          </div>

          {/* Шаг 2: Форма подключения */}
          <form onSubmit={handleSaveAndConnect} className="space-y-4">
            <label className="inline-flex items-center gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600"
              />
              <span>Включить синхронизацию с облачной БД Supabase</span>
            </label>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Supabase Anon Public Key (API Key)
                </label>
                <input
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs sm:text-sm font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                type="button"
                disabled={testing || !enabled}
                onClick={handleForceUploadLocalToCloud}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-indigo-600" />
                <span>Выгрузить текущие классы в облако</span>
              </button>

              <button
                type="submit"
                disabled={testing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider shadow-sm cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>
                  {testing ? 'Проверка связи...' : 'Сохранить и подключить БД'}
                </span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
