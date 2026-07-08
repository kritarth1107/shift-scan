"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
];

const READER_ID = "barcode-reader";

export function useBarcodeScanner(onScan: (code: string) => void) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onScanRef = useRef(onScan);
  const [isActive, setIsActive] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner) {
      setIsActive(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      await scanner.clear();
    } catch {
      /* ignore cleanup errors */
    }

    setIsActive(false);
    setIsStarting(false);
  }, []);

  const start = useCallback(async () => {
    if (isStarting || isActive) return;

    const element = document.getElementById(READER_ID);
    if (!element) {
      setError("Scanner view is not ready. Try again.");
      return;
    }

    setIsStarting(true);
    setError(null);

    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(READER_ID, {
          formatsToSupport: FORMATS,
          verbose: false,
        });
      }

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const scanner = scannerRef.current;
      const config = {
        fps: 12,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.min(viewfinderWidth * 0.88, 320);
          const height = Math.min(viewfinderHeight * 0.38, 140);
          return { width: Math.floor(width), height: Math.floor(height) };
        },
        aspectRatio: 1.777778,
        disableFlip: false,
      };

      let cameraId: string | { facingMode: string } = { facingMode: "environment" };

      try {
        const cameras = await Html5Qrcode.getCameras();
        const backCamera = cameras.find(
          (cam) =>
            /back|rear|environment/i.test(cam.label) ||
            cam.label.toLowerCase().includes("camera2")
        );
        if (backCamera) cameraId = backCamera.id;
        else if (cameras.length > 0) cameraId = cameras[cameras.length - 1].id;
      } catch {
        /* fall back to facingMode */
      }

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          onScanRef.current(decodedText);
        },
        () => {}
      );

      setIsActive(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not access the camera.";
      setError(
        message.includes("NotAllowed")
          ? "Camera permission denied. Allow camera access in your browser settings."
          : message.includes("NotFound")
            ? "No camera found on this device."
            : "Could not start the camera. Tap retry."
      );
      setIsActive(false);
    } finally {
      setIsStarting(false);
    }
  }, [isActive, isStarting]);

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  return {
    readerId: READER_ID,
    isActive,
    isStarting,
    error,
    start,
    stop,
  };
}
