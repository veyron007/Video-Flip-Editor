import React, { useRef, useState, useEffect, useCallback } from 'react';
import styles from './SessionPreview.module.css';
import PlayerControls from '../PlayerControls/PlayerControls';

const findCurrentEntry = (sessionLog, time) => {
  const entry = sessionLog.findLast((e) => e.timeStamp <= time);
  return entry || sessionLog[0];
};

const SessionPreview = ({ sessionLog, videoSrc }) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeEntry, setActiveEntry] = useState(() =>
    findCurrentEntry(sessionLog, 0)
  );

  const [isSeeking, setIsSeeking] = useState(false);

  const drawFrame = useCallback((ctx, video, entry) => {
    const [percent_x, percent_y, percent_width, percent_height] =
      entry.coordinates;

    const sx = percent_x * video.videoWidth;
    const sy = percent_y * video.videoHeight;
    const sWidth = percent_width * video.videoWidth;
    const sHeight = percent_height * video.videoHeight;

    if (!sWidth || sWidth <= 0 || !sHeight || sHeight <= 0) {
      return;
    }

    const canvas = ctx.canvas;
    
    const aspectRatio = sWidth / sHeight;
    const currentCanvasAR = canvas.width / canvas.height;
    
    if (Math.abs(currentCanvasAR - aspectRatio) > 0.001) {
        canvas.height = canvas.width / aspectRatio;
        canvas.style.aspectRatio = `${aspectRatio}`;
    }
    
    const canvasRatio = canvas.width / canvas.height;
    const cropRatio = sWidth / sHeight;
    let dWidth, dHeight, dx, dy;

    if (cropRatio > canvasRatio) {
      dWidth = canvas.width;
      dHeight = dWidth / cropRatio;
      dx = 0;
      dy = (canvas.height - dHeight) / 2;
    } else {
      dHeight = canvas.height;
      dWidth = dHeight * cropRatio;
      dy = 0;
      dx = (canvas.width - dWidth) / 2;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      video,
      sx, sy, sWidth, sHeight,
      dx, dy, dWidth, dHeight
    );
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext('2d');
    
    canvas.width = 500;

    const loop = () => {
      if (!videoRef.current || videoRef.current.paused || isSeeking) {
        cancelAnimationFrame(animFrameRef.current);
        return;
      }
      
      const time = videoRef.current.currentTime;
      const entry = findCurrentEntry(sessionLog, time);
      drawFrame(ctx, video, entry);
      setCurrentTime(time);
      
      animFrameRef.current = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      loop();
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, drawFrame, sessionLog, isSeeking]); 

  useEffect(() => {
    if (!isPlaying) {
      setTimeout(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (video && canvas) {
          drawFrame(canvas.getContext('2d'), video, activeEntry);
        }
      }, 50);
    }
  }, [activeEntry, isPlaying, drawFrame]);

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setTimeout(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if(video && canvas) {
           drawFrame(canvas.getContext('2d'), video, activeEntry);
        }
    }, 100);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current || isPlaying || isSeeking) return; 
    
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    const newEntry = findCurrentEntry(sessionLog, time);
    if (newEntry.timeStamp !== activeEntry.timeStamp) {
      setActiveEntry(newEntry);
      videoRef.current.playbackRate = newEntry.playbackRate;
      videoRef.current.volume = newEntry.volume;
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };
  
  const handleSeekChange = (time) => {
    const newTime = parseFloat(time);
    setCurrentTime(newTime);
  };
  
  const handleSeekEnd = (time) => {
    const newTime = parseFloat(time);
    videoRef.current.currentTime = newTime;
    setIsSeeking(false);
    setActiveEntry(findCurrentEntry(sessionLog, newTime));
  };
  
  const handleVolumeChange = (vol) => {
    videoRef.current.volume = vol;
  };

  return (
    <div className={styles.previewWrapper}>
      <video
        ref={videoRef}
        src={videoSrc}
        className={styles.hiddenVideo}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setActiveEntry(sessionLog[sessionLog.length - 1]);
        }}
      />
      
      <div className={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          className={styles.canvasElement}
        />
      </div>

      <PlayerControls
        state={{ isPlaying, currentTime, duration, volume: videoRef.current?.volume || 0.5 }}
        onPlayPause={handlePlayPause}
        onSeekStart={handleSeekStart}
        onSeekChange={handleSeekChange}
        onSeekEnd={handleSeekEnd}
        onVolumeChange={handleVolumeChange}
      />
    </div>
  );
};

export default SessionPreview;