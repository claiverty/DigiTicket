import { useEffect, useRef, useState } from 'react';

export function TicketQrCode({ value }: { value: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;

    setError(false);
    const canvas = canvasRef.current;
    let active = true;

    void import('qrcode')
      .then(({ default: QRCode }) =>
        QRCode.toCanvas(canvas, value, {
          width: 256,
          margin: 2,
          color: { dark: '#020617', light: '#ffffff' },
          errorCorrectionLevel: 'M',
        }),
      )
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
    };
  }, [value]);

  if (error) {
    return <p className="rounded-xl bg-rose-400/10 p-4 text-sm text-rose-200">Não foi possível gerar o QR Code.</p>;
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="QR Code assinado do ingresso"
      className="h-auto w-full max-w-64 rounded-xl"
    />
  );
}
