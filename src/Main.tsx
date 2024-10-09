import React, { useEffect, useRef } from "react";
import * as selfieSegmentation from "@mediapipe/selfie_segmentation";

export default function Main() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const segmenterRef = useRef<any>(null);
  const segmenterInitializedRef = useRef(false);

  useEffect(() => {
    const getWebcamStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user", // This specifies the front-facing camera
          },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing webcam:", error);
      }
    };

    getWebcamStream();

    if (canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d");
    }
  }, []);

  useEffect(() => {
    const loadSegmenter = async () => {
      const segmenter = new selfieSegmentation.SelfieSegmentation({
        locateFile: (path: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${path}`,
      });

      // Initialize the segmenter and set options
      await segmenter.initialize().then(() => {
        segmenterInitializedRef.current = true;
      });
      segmenter.setOptions({
        modelSelection: 0, // Use the landscape model (0 for general)
        selfieMode: false,
      });

      segmenterRef.current = segmenter;

      // Attach the onResults callback
      segmenter.onResults((results) => {
        if (canvasRef.current && ctxRef.current && videoRef.current) {
          ctxRef.current?.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          ctxRef.current.drawImage(
            results.segmentationMask,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          ctxRef.current.globalCompositeOperation = "source-in";
          ctxRef.current.drawImage(
            videoRef.current,
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );

          ctxRef.current.globalCompositeOperation = "destination-over";
          ctxRef.current.fillStyle = "green";
          ctxRef.current.fillRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      });

      const intervalId = setInterval(processFrame, 100);
      return () => clearInterval(intervalId);
    };

    loadSegmenter();
  }, []);

  const processFrame = async () => {
    const videoWidth = videoRef.current?.videoWidth;
    const videoHeight = videoRef.current?.videoHeight;

    if (
      !videoRef.current ||
      !canvasRef.current ||
      !segmenterRef.current ||
      !segmenterInitializedRef.current ||
      !videoWidth ||
      !videoHeight
    ) {
      return;
    }

    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    ctxRef.current?.drawImage(videoRef.current, 0, 0, videoWidth, videoHeight);
    const imageData = ctxRef.current?.getImageData(
      0,
      0,
      videoWidth,
      videoHeight
    );

    // Use the segmenter to segment the image
    await segmenterRef.current.send({ image: imageData });
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas
        ref={canvasRef}
        style={{
          aspectRatio: 16 / 9,
          maxHeight: "80vh",
          border: "2px solid black",
          transform: "scale(-1, 1)",
        }}
      />
    </div>
  );
}
