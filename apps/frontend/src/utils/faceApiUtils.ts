/**
 * faceApiUtils.ts
 * Utility để load và sử dụng face-api.js trong trình duyệt.
 * - Load model 1 lần, cache trạng thái
 * - detectFaceDescriptor: nhận video/image/canvas → trả về Float32Array(128)
 */
import * as faceapi from 'face-api.js';

const MODELS_URL = '/models';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

/**
 * Load tất cả các model cần thiết. Gọi 1 lần, các lần sau dùng cache.
 */
export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) return modelsLoading;

  modelsLoading = (async () => {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODELS_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]);
    modelsLoaded = true;
  })();

  return modelsLoading;
}

/**
 * Phát hiện khuôn mặt và trả về descriptor 128-float.
 * @param source HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | File | string (URL)
 * @returns Float32Array(128) hoặc null nếu không phát hiện mặt
 */
export async function detectFaceDescriptor(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement | File
): Promise<Float32Array | null> {
  await loadFaceModels();

  let input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement;

  if (source instanceof File) {
    // Tạo HTMLImageElement từ File
    input = await fileToImage(source);
  } else {
    input = source;
  }

  const detection = await faceapi
    .detectSingleFace(input, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) return null;

  return detection.descriptor;
}

/**
 * Detect khuôn mặt và trả về cả detection box để vẽ overlay.
 */
export async function detectFaceWithBox(
  source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<faceapi.WithFaceDescriptor<faceapi.WithFaceLandmarks<{ detection: faceapi.FaceDetection }>> | null> {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(source, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.45 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return detection ?? null;
}

/**
 * Chuyển File thành HTMLImageElement để face-api có thể xử lý.
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image file'));
    };
    img.src = url;
  });
}

/**
 * Kiểm tra xem model đã được load chưa.
 */
export function areFaceModelsLoaded(): boolean {
  return modelsLoaded;
}

/**
 * Tính Euclidean distance giữa 2 descriptor (giống backend).
 * < 0.6: cùng người; >= 0.6: khác người
 */
export function euclideanDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
