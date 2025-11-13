import React, { useEffect, useRef } from 'react';
import CropperOverlay from '../CropperOverlay/CropperOverlay';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({
  videoRef,
  containerRef,
  src,
  state,
  dispatch,
  cropperDimensions,
  onCropperDrag,
  onCropperDragEnd,
  onContainerRectChange,
  isSeeking,
}) => {
  const animFrameRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.volume = state.volume;
  }, [state.volume]);

  useEffect(() => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = state.playbackRate;
  }, [state.playbackRate]);

  // Report container size back to parent
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        onContainerRectChange(entry.contentRect);
      }
    });
    observer.observe(containerRef.current);
    onContainerRectChange(containerRef.current.getBoundingClientRect());
    return () => observer.disconnect();
  }, [containerRef, onContainerRectChange]);

  // The rAF loop for smooth time updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateCurrentTime = () => {
      if (video.paused || video.ended || isSeeking) { 
        cancelAnimationFrame(animFrameRef.current);
        return;
      }
      dispatch({ type: 'SET_TIME', payload: video.currentTime });
      animFrameRef.current = requestAnimationFrame(updateCurrentTime);
    };

    if (state.isPlaying) {
      animFrameRef.current = requestAnimationFrame(updateCurrentTime);
    } else {
      cancelAnimationFrame(animFrameRef.current);
    }

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state.isPlaying, videoRef, dispatch, isSeeking]);

  const handleTimeUpdate = () => {
    if (videoRef.current && !state.isPlaying && !isSeeking) {
      dispatch({ type: 'SET_TIME', payload: videoRef.current.currentTime });
    }
  };

  const handleLoadedMetadata = () => {
    dispatch({ type: 'SET_DURATION', payload: videoRef.current.duration });
  };

  const handleVideoError = (e) => {
    console.error('Video Error:', e.target.error.message);
  };

  return (
    <div ref={containerRef} className={styles.videoPlayerContainer}>
      <video
        ref={videoRef}
        src={src}
        className={styles.videoElement}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => dispatch({ type: 'SET_PLAY_STATE', payload: true })}
        onPause={() => dispatch({ type: 'SET_PLAY_STATE', payload: false })}
        onEnded={() => dispatch({ type: 'SET_PLAY_STATE', payload: false })}
        onError={handleVideoError}
        playsInline
      />

      {state.isCropperVisible && containerRef.current && (
        <CropperOverlay
          dimensions={cropperDimensions}
          containerWidth={containerRef.current.clientWidth}
          onDrag={onCropperDrag}
          onDragEnd={onCropperDragEnd}
        />
      )}
    </div>
  );
};

export default VideoPlayer;