import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  QrCode,
  X,
  KeyRound,
  CheckCircle2,
  CameraOff,
} from 'lucide-react';
import { ClassId, storageService } from '../services/storageService';

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
  onClose,
  onScanComplete,
}) => {
  const [customSubject, setCustomSubject] = useState('');
  const [enteredKey, setEnteredKey] = useState('');
  const [qrScannedViaCameraOrUrl, setQrScannedViaCameraOrUrl] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      // Проверяем, отсканировал ли ученик реальный QR-код с доски через камеру телефона (в URL ?token=...)
      const urlScanned = storageService.getScannedTokenFromUrl();
      if (
        urlScanned &&
        (urlScanned === qrToken.toUpperCase() ||
          urlScanned.includes(qrToken.toUpperCase()))
      ) {
        setEnteredKey(qrToken);
        setQrScannedViaCameraOrUrl(true);
      } else {
        setEnteredKey('');
        setQrScannedViaCameraOrUrl(false);
      }
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isOpen, qrToken]);

  const stopCamera = () => {
    if (detectorIntervalRef.current) {
      window.clearInterval(detectorIntervalRef.current);
      detectorIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const handleDecodedQRText = (rawValue: string) => {
    try {
      // Если в QR зашита ссылка ?token=KEY-11A-888
      if (rawValue.includes('token=')) {
        const urlObj = new URL(rawValue);
        const tok = urlObj.searchParams.get('token');
        if (tok) {
          setEnteredKey(tok.toUpperCase());
          setQrScannedViaCameraOrUrl(true);
          stopCamera();
          return;
        }
      }
    } catch {
      // Если просто текст токена
    }
    setEnteredKey(rawValue.trim().toUpperCase());
    setQrScannedViaCameraOrUrl(true);
    stopCamera();
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

      // Реальное распознавание QR-кода через встроенный в браузер BarcodeDetector API
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector?: new (opts: { formats: string[] }) => {
            detect: (
              video: HTMLVideoElement
            ) => Promise<Array<{ rawValue: string }>>;
          };
        }
      ).BarcodeDetector;

      if (BarcodeDetectorCtor) {
        const detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
        detectorIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const codes = await detector.detect(videoRef.current);
              if (codes && codes.length > 0 && codes[0].rawValue) {
                handleDecodedQRText(codes[0].rawValue);
              }
            } catch {
              // ignore frame errors
            }
          }
        }, 350);
      }
    } catch {
      setErrorMsg(
        'Доступ к камере не предоставлен. Отсканируйте QR-код на доске куратора стандартной камерой телефона или введите ключ с доски вручную.'
      );
    }
  };

  if (!isOpen) return null;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!enteredKey.trim()) {
      setErrorMsg(
        'Отсканируйте реальный QR-код на доске куратора камерой или введите ключ, отображаемый на доске.'
      );
      return;
    }

    if (!customSubject.trim()) {
      setErrorMsg('Напишите предмет и задание, которое вы сейчас выполняете.');
      return;
    }

    const res = onScanComplete(customSubject.trim(), enteredKey.trim());
    if (res.error) {
      setErrorMsg(res.error);
    } else {
      stopCamera();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        {/* Шапка */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-sm font-bold">
                Посадка за Парту №{deskNumber} • Класс {classId}
              </h3>
              <p className="text-[11px] text-slate-400">
                {roomName} • Требуется реальный QR-код с доски куратора
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {qrScannedViaCameraOrUrl ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <div className="text-xs font-bold">
                  Реальный QR-код с доски успешно считан!
                </div>
                <div className="text-[11px] text-emerald-700 mt-0.5">
                  Осталось указать, какой предмет вы учите, и занять парту №
                  {deskNumber}.
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col items-center justify-center space-y-3">
              {cameraActive ? (
                <div className="w-full space-y-2.5">
                  <div className="relative rounded-xl overflow-hidden bg-black border-2 border-indigo-500">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-52 object-cover"
                    />
                    <div className="absolute inset-6 border-2 border-dashed border-indigo-400/80 rounded-xl pointer-events-none" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-600">
                      Наведите камеру на QR-код на доске куратора
                    </span>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                    >
                      <CameraOff className="w-3.5 h-3.5" />
                      <span>Выключить</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold text-slate-800">
                      Отсканируйте QR-код на доске в кабинете {classId}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Наведите камеру телефона на экран куратора или нажмите кнопку сканера ниже
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Открыть камеру и сканировать QR</span>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Ввод ключа с доски вручную (пустое поле — без автоподстановки секретного кода!) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Ключ с доски куратора (если без камеры)
            </label>
            <input
              type="text"
              required
              value={enteredKey}
              onChange={(e) => setEnteredKey(e.target.value.toUpperCase())}
              placeholder="Введите ключ, показанный на доске в классе"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold uppercase text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Что ученик сам учит */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
              Что вы сейчас учите (предмет и задание)
            </label>
            <input
              type="text"
              required
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Напишите предмет и тему"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs sm:text-sm text-slate-900 focus:outline-none focus:border-indigo-600"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <QrCode className="w-4 h-4" />
            <span>Подтвердить и занять Парту №{deskNumber}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
