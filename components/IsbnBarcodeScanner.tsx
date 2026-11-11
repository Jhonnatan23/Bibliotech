import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScanBarcodeIcon, XMarkIcon, CameraIcon, BoltIcon, ArrowUpTrayIcon } from './Icons';
import { readBarcodeFromImage } from '../services/geminiService';

interface IsbnBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (isbn: string) => void;
}

export const IsbnBarcodeScanner: React.FC<IsbnBarcodeScannerProps> = ({
  isOpen,
  onClose,
  onDetected
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Aponte para o código de barras no verso do livro');
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const scanIntervalRef = useRef<any>(null);

  // Play a gentle beep feedback on successful scan
  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    } catch {
      // AudioContext not allowed or disabled
    }
  }, []);

  const handleSuccessfulIsbn = useCallback((cleanIsbn: string) => {
    playBeep();
    setStatusMessage(`ISBN detectado: ${cleanIsbn}`);
    setTimeout(() => {
      onDetected(cleanIsbn);
      onClose();
    }, 400);
  }, [onDetected, onClose, playBeep]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    setStatusMessage('Inicializando câmera...');
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Check if torch is available
      const track = mediaStream.getVideoTracks()[0];
      const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : {};
      if (capabilities.torch) {
        setHasTorch(true);
      }

      setStatusMessage('Aponte para o código de barras ou número ISBN');
    } catch (err: any) {
      console.error('Camera error:', err);
      let msg = 'Não foi possível acessar a câmera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Permissão de acesso à câmera negada. Autorize nas configurações do navegador ou use o upload de imagem.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = 'Nenhuma câmera encontrada no dispositivo. Você pode enviar uma foto do código de barras.';
      }
      setCameraError(msg);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setTorchOn(false);
    setHasTorch(false);
  }, [stream]);

  // Toggle torch/flash
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !torchOn;
        await (track as any).applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn('Torch toggle failed:', e);
      }
    }
  };

  // Capture current frame as base64
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    if (video.videoWidth === 0 || video.videoHeight === 0) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // AI-powered visual reading of barcode
  const handleAiScan = async () => {
    const base64 = captureFrame();
    if (!base64) {
      setStatusMessage('Aguardando câmera focalizar...');
      return;
    }

    setIsProcessing(true);
    setStatusMessage('Decodificando código de barras com IA...');
    try {
      const result = await readBarcodeFromImage(base64);
      if (result.isbn && result.isbn.length >= 9) {
        handleSuccessfulIsbn(result.isbn);
      } else {
        setStatusMessage('Código não identificado com nitidez. Aproxime mais e tente novamente.');
      }
    } catch (err: any) {
      console.warn('AI barcode read error:', err);
      setStatusMessage('Não foi possível ler. Tente melhorar a iluminação ou digite o código.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Native BarcodeDetector loop if supported
  useEffect(() => {
    if (!isOpen || !stream || !videoRef.current) return;

    let isScanningNative = false;
    const hasBarcodeDetector = 'BarcodeDetector' in window;

    if (hasBarcodeDetector) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
        });

        scanIntervalRef.current = setInterval(async () => {
          if (isScanningNative || !videoRef.current || isProcessing) return;
          try {
            isScanningNative = true;
            const barcodes = await barcodeDetector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const detected = barcodes[0].rawValue;
              const clean = String(detected).replace(/[^0-9X]/gi, '');
              if (clean.length >= 9) {
                if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
                handleSuccessfulIsbn(clean);
                return;
              }
            }
          } catch {
            // Frame detection error, continue
          } finally {
            isScanningNative = false;
          }
        }, 300);
      } catch (err) {
        console.warn('BarcodeDetector initialization error:', err);
      }
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isOpen, stream, isProcessing, handleSuccessfulIsbn]);

  // File upload fallback
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage('Lendo arquivo enviado...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (!base64) {
        setIsProcessing(false);
        return;
      }

      // First check native BarcodeDetector on image
      if ('BarcodeDetector' in window) {
        try {
          const img = new Image();
          img.src = base64;
          await img.decode();
          const barcodeDetector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39']
          });
          const barcodes = await barcodeDetector.detect(img);
          if (barcodes && barcodes.length > 0) {
            const clean = String(barcodes[0].rawValue).replace(/[^0-9X]/gi, '');
            if (clean.length >= 9) {
              handleSuccessfulIsbn(clean);
              setIsProcessing(false);
              return;
            }
          }
        } catch {
          // Native detector failed on file, fallback to AI
        }
      }

      // Fallback to AI reader
      try {
        const result = await readBarcodeFromImage(base64);
        if (result.isbn && result.isbn.length >= 9) {
          handleSuccessfulIsbn(result.isbn);
        } else {
          setStatusMessage('Nenhum código de barras legível na foto.');
        }
      } catch {
        setStatusMessage('Erro ao processar imagem.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        id="isbn-scanner-modal"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/20 text-primary flex items-center justify-center">
              <ScanBarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Leitor de Código de Barras</h3>
              <p className="text-[10px] text-slate-400 font-medium">Reconhecimento EAN-13 & ISBN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Fechar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
          {cameraError ? (
            <div className="p-6 text-center max-w-sm">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <CameraIcon className="w-6 h-6" />
              </div>
              <p className="text-xs text-rose-300 font-bold mb-4">{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg"
              >
                Enviar foto do código
              </button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Graphic */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
                <div className="relative w-64 h-36 border-2 border-primary/60 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                  {/* Scanning Laser Line */}
                  <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_rgba(244,63,94,0.9)] animate-pulse top-1/2 -translate-y-1/2" />
                  
                  {/* Corner brackets */}
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-primary" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-primary" />
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-primary" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-primary" />
                </div>
              </div>

              {/* Torch Button if supported */}
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`absolute top-4 right-4 p-3 rounded-full backdrop-blur-md transition-all shadow-lg ${
                    torchOn 
                      ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30' 
                      : 'bg-slate-900/70 text-white hover:bg-slate-900'
                  }`}
                  title="Luz / Lanterna"
                >
                  <BoltIcon className="w-5 h-5" />
                </button>
              )}
            </>
          )}

          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Status bar */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-t border-slate-800 text-center">
          <p className="text-[11px] font-bold text-slate-300 flex items-center justify-center gap-2">
            {isProcessing && (
              <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            )}
            {statusMessage}
          </p>
        </div>

        {/* Controls */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
          {/* File Upload Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-slate-700 disabled:opacity-50"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>Foto da Galeria</span>
          </button>

          {!cameraError && (
            <button
              type="button"
              onClick={handleAiScan}
              disabled={isProcessing}
              className="flex-1 py-3 px-4 rounded-xl bg-primary hover:brightness-110 text-white text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:opacity-50"
            >
              <CameraIcon className="w-4 h-4" />
              <span>{isProcessing ? 'Lendo...' : 'Capturar com IA'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
