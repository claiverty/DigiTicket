import type { IScannerControls } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  disabled?: boolean;
  onScan: (value: string) => void;
}

export function QrScanner({ disabled = false, onScan }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const detectedRef = useRef(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stop = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setActive(false);
  };

  useEffect(
    () => () => {
      controlsRef.current?.stop();
      controlsRef.current = null;
    },
    [],
  );

  const start = async () => {
    if (!videoRef.current || active || disabled) return;

    setError(null);
    setActive(true);
    detectedRef.current = false;

    try {
      const { BrowserQRCodeReader } = await import('@zxing/browser');
      const reader = new BrowserQRCodeReader();
      controlsRef.current = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result || detectedRef.current) return;

          detectedRef.current = true;
          stop();
          onScan(result.getText());
        },
      );
    } catch {
      stop();
      setError(
        'Não foi possível acessar a câmera. Verifique a permissão ou use o código manual.',
      );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="overflow-hidden rounded-xl bg-black">
        <video
          ref={videoRef}
          className={`aspect-video w-full object-cover ${active ? 'block' : 'hidden'}`}
          muted
          playsInline
        />
        {!active && (
          <div className="flex aspect-video items-center justify-center px-6 text-center text-sm text-slate-500">
            A câmera permanece desligada até você iniciar a leitura.
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={active ? stop : start}
        className="mt-4 w-full rounded-xl border border-blue-200 px-4 py-3 font-bold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {active ? 'Parar câmera' : 'Ler QR Code com a câmera'}
      </button>

      {error && (
        <p role="alert" className="mt-3 text-sm text-amber-700">
          {error}
        </p>
      )}
    </div>
  );
}
