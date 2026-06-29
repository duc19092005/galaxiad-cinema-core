/**
 * FaceScanModal.tsx
 * Modal quét khuôn mặt qua webcam sử dụng face-api.js.
 * Hỗ trợ 2 chế độ:
 *   - 'register': Đăng ký khuôn mặt nhân viên (TheaterManager)
 *   - 'clockin': Xác thực điểm danh tại quầy POS (Cashier)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as faceapi from 'face-api.js';
import { Camera, CheckCircle, Loader2, ScanFace, X, AlertTriangle, RefreshCw } from 'lucide-react';
import { loadFaceModels } from '../utils/faceApiUtils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface FaceScanModalProps {
  mode: 'register' | 'clockin';
  staffName?: string;
  onDescriptor: (vector: number[]) => void;
  onClose: () => void;
}

type ScanStatus =
  | 'loading_models'
  | 'requesting_camera'
  | 'camera_error'
  | 'scanning'
  | 'face_found'
  | 'no_face'
  | 'captured';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const SCAN_INTERVAL_MS = 150; // ms mỗi lần detect

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────
const FaceScanModal: React.FC<FaceScanModalProps> = ({ mode, staffName, onDescriptor, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastDescriptorRef = useRef<Float32Array | null>(null);

  const [status, setStatus] = useState<ScanStatus>('loading_models');
  const [confidence, setConfidence] = useState<number | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [captured, setCaptured] = useState(false);
  const [capturedDescriptor, setCapturedDescriptor] = useState<Float32Array | null>(null);

  // ── Cleanup on unmount ───────────────────────
  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── Model load + camera start ─────────────────
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setStatus('loading_models');
      try {
        await loadFaceModels();
      } catch {
        if (!cancelled) setCameraError('Không thể tải AI model nhận diện khuôn mặt.');
        return;
      }

      if (cancelled) return;
      setStatus('requesting_camera');

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus('scanning');
        startDetectionLoop();
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setCameraError('Trình duyệt chưa cấp quyền camera. Hãy cho phép truy cập camera và thử lại.');
          } else if (msg.includes('NotFoundError')) {
            setCameraError('Không tìm thấy camera trên thiết bị này.');
          } else {
            setCameraError(`Lỗi camera: ${msg}`);
          }
          setStatus('camera_error');
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Detection loop ────────────────────────────
  const startDetectionLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.paused || video.ended || !video.videoWidth || !video.videoHeight) return;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 }))
          .withFaceLandmarks()
          .withFaceDescriptor();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Sync canvas size to video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detection) {
          lastDescriptorRef.current = detection.descriptor;
          setConfidence(detection.detection.score);
          setStatus('face_found');

          // Draw bounding box
          const box = detection.detection.box;
          const score = detection.detection.score;

          // Box glow effect
          ctx.shadowColor = '#a78bfa';
          ctx.shadowBlur = 16;
          ctx.strokeStyle = score > 0.85 ? '#22c55e' : '#a78bfa';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.rect(box.x, box.y, box.width, box.height);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Corner marks
          const cs = 20; // corner size
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 3;
          const corners = [
            [box.x, box.y, box.x + cs, box.y, box.x, box.y + cs],
            [box.x + box.width, box.y, box.x + box.width - cs, box.y, box.x + box.width, box.y + cs],
            [box.x, box.y + box.height, box.x + cs, box.y + box.height, box.x, box.y + box.height - cs],
            [box.x + box.width, box.y + box.height, box.x + box.width - cs, box.y + box.height, box.x + box.width, box.y + box.height - cs],
          ];
          for (const [x1, y1, x2, y2, x3, y3] of corners) {
            ctx.beginPath();
            ctx.moveTo(x2, y2);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x3, y3);
            ctx.stroke();
          }

          // Score label
          ctx.fillStyle = score > 0.85 ? '#22c55e' : '#a78bfa';
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.fillText(`${(score * 100).toFixed(1)}%`, box.x + 6, box.y - 8);

          // Draw landmarks
          const landmarks = detection.landmarks.positions;
          ctx.fillStyle = 'rgba(167,139,250,0.7)';
          for (const pt of landmarks) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
            ctx.fill();
          }
        } else {
          lastDescriptorRef.current = null;
          setConfidence(null);
          setStatus('no_face');
        }
      } catch (err) {
        console.error("Face detection loop error:", err);
      }
    }, SCAN_INTERVAL_MS);
  }, []);

  // ── Capture ───────────────────────────────────
  const handleCapture = useCallback(() => {
    const descriptor = lastDescriptorRef.current;
    if (!descriptor) return;
    stopCamera();
    setCapturedDescriptor(descriptor);
    setCaptured(true);
    setStatus('captured');
  }, [stopCamera]);

  // ── Confirm → pass descriptor up ─────────────
  const handleConfirm = useCallback(() => {
    if (!capturedDescriptor) return;
    onDescriptor(Array.from(capturedDescriptor));
  }, [capturedDescriptor, onDescriptor]);

  // ── Retry ─────────────────────────────────────
  const handleRetry = useCallback(() => {
    setCaptured(false);
    setCapturedDescriptor(null);
    setConfidence(null);
    setStatus('requesting_camera');

    navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
    }).then((stream) => {
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().then(() => {
          setStatus('scanning');
          startDetectionLoop();
        });
      }
    }).catch((err) => {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(msg);
      setStatus('camera_error');
    });
  }, [startDetectionLoop]);

  // ── UI Helpers ────────────────────────────────
  const isLoading = status === 'loading_models' || status === 'requesting_camera';
  const hasFace = status === 'face_found';
  const title = mode === 'register'
    ? `Đăng ký khuôn mặt${staffName ? ` — ${staffName}` : ''}`
    : `Xác thực khuôn mặt${staffName ? ` — ${staffName}` : ''}`;

  const statusText = {
    loading_models: 'Đang tải AI model...',
    requesting_camera: 'Đang khởi động camera...',
    camera_error: 'Lỗi camera',
    scanning: 'Đang tìm khuôn mặt...',
    face_found: confidence
      ? `Phát hiện khuôn mặt — Độ tin cậy: ${(confidence * 100).toFixed(1)}%`
      : 'Phát hiện khuôn mặt',
    no_face: 'Không phát hiện khuôn mặt — Hãy nhìn thẳng vào camera',
    captured: 'Đã chụp! Xác nhận để tiếp tục.',
  }[status];

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{ zIndex: 1000 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 600, width: '95vw', padding: 0, overflow: 'hidden' }}
      >
        {/* ─── Header ─── */}
        <div className="modal-header" style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScanFace size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>
                Nhìn thẳng, đủ ánh sáng, cách camera 30–60cm
              </p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={16} /></button>
        </div>

        {/* ─── Camera area ─── */}
        <div style={{ position: 'relative', background: '#0a0a0a', minHeight: 340 }}>
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              display: 'block',
              opacity: captured ? 0.35 : 1,
              transition: 'opacity 0.3s',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Canvas overlay for face box */}
          <canvas
            ref={canvasRef}
            style={{
              position: 'absolute',
              top: 0, left: 0,
              width: '100%', height: '100%',
              pointerEvents: 'none',
              transform: 'scaleX(-1)',
            }}
          />

          {/* Loading overlay */}
          {isLoading && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'rgba(0,0,0,0.7)',
            }}>
              <Loader2 size={36} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
              <p style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 600 }}>
                {status === 'loading_models' ? 'Đang tải AI model nhận diện khuôn mặt...' : 'Đang khởi động camera...'}
              </p>
              {status === 'loading_models' && (
                <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: 12 }}>
                  Lần đầu tiên có thể mất 5–10 giây
                </p>
              )}
            </div>
          )}

          {/* Camera error overlay */}
          {status === 'camera_error' && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 14,
              background: 'rgba(0,0,0,0.85)',
              padding: 24,
            }}>
              <AlertTriangle size={40} style={{ color: 'var(--warning)' }} />
              <p style={{ color: '#fff', margin: 0, fontSize: 14, fontWeight: 700, textAlign: 'center' }}>
                Không thể truy cập camera
              </p>
              <p style={{ color: 'rgba(255,255,255,0.55)', margin: 0, fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
                {cameraError || 'Hãy kiểm tra quyền camera trong cài đặt trình duyệt.'}
              </p>
            </div>
          )}

          {/* Captured overlay */}
          {captured && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 12,
              background: 'rgba(0,0,0,0.5)',
            }}>
              <CheckCircle size={52} style={{ color: '#22c55e' }} />
              <p style={{ color: '#fff', margin: 0, fontSize: 15, fontWeight: 700 }}>
                Đã lưu khuôn mặt
              </p>
            </div>
          )}

          {/* Scan guide frame (visible when scanning) */}
          {(status === 'scanning' || status === 'no_face') && (
            <div style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 200, height: 240,
              border: '2px dashed rgba(167,139,250,0.3)',
              borderRadius: 100,
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* ─── Status bar ─── */}
        <div style={{
          padding: '10px 20px',
          background: hasFace
            ? 'rgba(34,197,94,0.08)'
            : status === 'no_face'
              ? 'rgba(245,158,11,0.08)'
              : 'rgba(255,255,255,0.02)',
          borderTop: '1px solid var(--border-color)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {isLoading
            ? <Loader2 size={14} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            : hasFace
              ? <CheckCircle size={14} style={{ color: '#22c55e', flexShrink: 0 }} />
              : status === 'no_face'
                ? <Camera size={14} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                : <ScanFace size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          }
          <span style={{ fontSize: 12, color: hasFace ? '#22c55e' : 'var(--text-secondary)' }}>
            {statusText}
          </span>
        </div>

        {/* ─── Footer buttons ─── */}
        <div className="modal-footer" style={{ padding: '14px 20px' }}>
          {captured ? (
            <>
              <button className="btn btn-secondary" onClick={handleRetry}>
                <RefreshCw size={15} />
                Quét lại
              </button>
              <button className="btn btn-primary" onClick={handleConfirm}>
                <CheckCircle size={15} />
                {mode === 'register' ? 'Lưu khuôn mặt' : 'Xác nhận điểm danh'}
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={onClose}>
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCapture}
                disabled={!hasFace || isLoading}
                style={{ minWidth: 140 }}
              >
                <Camera size={15} />
                {hasFace ? 'Chụp & Xác nhận' : 'Đang chờ mặt...'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScanModal;
