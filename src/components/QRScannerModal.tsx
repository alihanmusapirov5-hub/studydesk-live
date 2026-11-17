import React, { useEffect, useRef, useState } from 'react';
import { Camera, QrCode, X, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { ClassId } from '../services/storageService';

interface QRScannerModalProps {
  isOpen: boolean;
  classId: ClassId;
  roomName: string;
  deskNumber: number;
  qrToken: string;
  studentJoinCode: string;
  onClose: () => void;
  onScanComplete: (
    customSubject: string,
    scannedToken: string
  ) => { error?: string };
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  classId,
  roomName,
  deskNumber,
  qrToken,
  studentJoinCode,
  onClose,
  onScanComplete,
}) => {
  const [customSubject, setCustomSubject] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      setManualCode(qrToken);
      setErrorMsg(null);
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, qrToken]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setErrorMsg(
        'Веб-камера не обнаружена. Нажмите кнопку «Считать общий QR-ключ доски» ниже.'
      );
    }
  };

  if (!isOpen) return null;

  const qrPayload =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?classCode=${studentJoinCode}&room=${classId}&desk=${deskNumber}&token=${qrToken}`
      : qrToken;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!customSubject.trim()) {
      setErrorMsg('Напишите, какой предмет или домашнее задание вы сейчас учите.');
      return;
    }
    const res = onScanComplete(
      customSubject.trim(),
      manualCode.trim() || qrToken
    );
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      stopCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">
                QR-ключ места • Парта №{deskNumber}
              </h3>
              <p className="text-[11px] text-slate-400">
                Класс {classId} ({roomName}) • Сканируйте общий QR на доске
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

        <form onSubmit={handleConfirmSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* Общий QR-код доски / Камера */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center">
            {cameraActive ? (
              <div className="w-full space-y-2">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-48 object-cover rounded-lg bg-black border border-slate-300"
                />
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-slate-600">
                    Наведите камеру на общий QR на доске
                  </span>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Показать QR-ключ
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <QRCodeSVG value={qrPayload} size={144} level="M" />
                </div>
                <div className="mt-2.5 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-bold">
                    Ключ доски: {qrToken}
                  </span>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Камера</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Ключ доски */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Общий QR-ключ с доски класса {classId}
            </label>
            <input
              type="text"
              required
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={qrToken}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Что ученик сам учит */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Что вы сейчас учите на Этюде (напишите сами)
            </label>
            <input
              type="text"
              required
              autoFocus
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Напр.: Алгебра №14.2, Физика подготовка к СОР..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Отсканировать ключ и занять Парту №{deskNumber}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
