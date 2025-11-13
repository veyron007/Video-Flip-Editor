import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './DynamicPreview.module.css';

const DynamicPreview = ({
  videoRef,
  cropperDimensions,
  isPlaying,
  isPreviewActive,
}) => {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const cropperRef = useRef(cropperDimensions);
  const containerRef = useRef(null);
  const [canvasDisplaySize, setCanvasDisplaySize] = useState({ width: 300, height: 300 / (16 / 9) });


  // Keep the ref updated with the latest dimensions
  useEffect(() => {
    cropperRef.current = cropperDimensions;
  }, [cropperDimensions]);

  // Use useCallback to make drawFrame stable
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const cropper = cropperRef.current;

    if (
      !canvas || !video || !cropper ||
      !video.videoWidth || !video.videoHeight ||
      video.videoWidth === 0 || video.videoHeight === 0 ||
      cropper.width <= 0 || cropper.height <= 0
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    const { videoWidth, videoHeight } = video;
    const { clientWidth, clientHeight } = video;

    if (clientWidth === 0 || clientHeight === 0) return;



    const widthRatio = videoWidth / clientWidth;
    const heightRatio = videoHeight / clientHeight;

    const sx = cropper.x * widthRatio;
    const sy = cropper.y * heightRatio;
    const sWidth = cropper.width * widthRatio;
    const sHeight = cropper.height * heightRatio;

    if (sWidth <= 0 || sHeight <= 0) return;


    const dWidth = canvasDisplaySize.width;
    const dHeight = canvasDisplaySize.height;

    if (dWidth <= 0 || dHeight <= 0) return;

    ctx.clearRect(0, 0, dWidth, dHeight);

    ctx.drawImage(
      video,
      sx, sy,
      sWidth, sHeight,
      0, 0,
      dWidth, dHeight
    );
  }, [videoRef, canvasDisplaySize.width, canvasDisplaySize.height]); // depends on display size and videoRef

  // This effect manages the "play" loop and "pause" frame
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const loop = () => {
      if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) {
        cancelAnimationFrame(animFrameRef.current);
        return;
      }
      drawFrame();
      animFrameRef.current = requestAnimationFrame(loop); // Request next
    };

    if (isPlaying) {
      // If playing, start the loop
      animFrameRef.current = requestAnimationFrame(loop);
    } else {
      // If paused, stop the loop
      cancelAnimationFrame(animFrameRef.current);


      if (isPreviewActive) {
        setTimeout(drawFrame, 50);
      }
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, isPreviewActive, videoRef, drawFrame]);

  const aspectRatio = (cropperDimensions.width > 0 && cropperDimensions.height > 0)
    ? cropperDimensions.width / cropperDimensions.height
    : 16 / 9;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const cw = el.clientWidth;
      const ch = el.clientHeight || Infinity;
      let desiredWidth = cw;
      let desiredHeight = desiredWidth / aspectRatio;

      if (desiredHeight > ch) {
        desiredHeight = ch;
        desiredWidth = desiredHeight * aspectRatio;
      }

      setCanvasDisplaySize({
        width: Math.max(1, Math.round(desiredWidth)),
        height: Math.max(1, Math.round(desiredHeight)),
      });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio]);



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = canvasDisplaySize.width;
    const cssH = canvasDisplaySize.height;

    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';

    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }, [canvasDisplaySize.width, canvasDisplaySize.height]);

  return (
    <div ref={containerRef} className={styles.previewContainer}>
      {!isPreviewActive && (
        <div className={styles.previewNotAvailable}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.2 3.41C4.38 2.22 2 3.65 2 5.81V18.19C2 20.35 4.38 21.78 6.2 20.59L17.7 13.4C19.52 12.21 19.52 9.79 17.7 8.6L6.2 3.41Z" fill="white" /></svg>
          <p className={styles.previewText}>Preview not available</p>
          <p className={styles.previewSubText}>Please click on "Start Cropper" and then play video</p>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className={styles.canvasElement}
        style={{
          visibility: isPreviewActive ? 'visible' : 'hidden',
          width: canvasDisplaySize.width + 'px',
          height: canvasDisplaySize.height + 'px',
        }}
      />
    </div>
  );
};

export default DynamicPreview;