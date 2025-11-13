import React, { useState, useReducer, useRef, useMemo, useEffect } from 'react';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import DynamicPreview from '../DynamicPreview/DynamicPreview';
import PlayerControls from '../PlayerControls/PlayerControls';
import SettingsPanel from '../SettingsPanel/SettingsPanel';
import ErrorBoundary from '../ErrorBoundary/ErrorBoundary';
import SessionPreview from '../SessionPreview/SessionPreview';
import styles from './VideoEditor.module.css';

const ASPECT_RATIOS = {
  '9:18': 9 / 18,
  '9:16': 9 / 16,
  '4:3': 4 / 3,
  '3:4': 3 / 4,
  '1:1': 1 / 1,
  '4:5': 4 / 5,
};
const ASPECT_RATIO_KEYS = Object.keys(ASPECT_RATIOS);

const initialState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.5,
  playbackRate: 1,
  isCropperVisible: false,
  isPreviewActive: false,
  cropperX: 0,
  aspectRatioKey: '9:16',
};

const videoUrl = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

function editorReducer(state, action) {
  switch (action.type) {
    case 'SET_PLAY_STATE':
      return { ...state, isPlaying: action.payload };
    case 'SET_TIME':
      return { ...state, currentTime: action.payload };
    case 'SET_DURATION':
      return { ...state, duration: action.payload };
    case 'SET_VOLUME':
      return { ...state, volume: action.payload };
    case 'SET_PLAYBACK_RATE':
      return { ...state, playbackRate: action.payload };
    case 'TOGGLE_CROPPER': {
     
      const newVisible = !state.isCropperVisible;
      return {
        ...state,
        isCropperVisible: newVisible,
        isPreviewActive: newVisible ? state.isPlaying : false,
        cropperX: 0,
      };
    }
    case 'SET_CROPPER_X':
      return { ...state, cropperX: action.payload };
    case 'SET_ASPECT_RATIO':
      return { ...state, aspectRatioKey: action.payload, cropperX: 0 };
    case 'SET_PREVIEW_ACTIVE':
      return { ...state, isPreviewActive: action.payload };
    case 'RESET':
      return { ...initialState, isPreviewActive: false };
    default:
      throw new Error('Unhandled action type in editorReducer');
  }
}

const VideoEditor = ({ setOpenModal }) => {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [sessionLog, setSessionLog] = useState([]);
  const [mode, setMode] = useState('edit');
  const [containerRect, setContainerRect] = useState(null);

  const [isSeeking, setIsSeeking] = useState(false);

  const [isSessionGenerated, setIsSessionGenerated] = useState(false);

  const videoRef = useRef(null);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    if (!state.isCropperVisible) {
      setSessionLog([]);
      setIsSessionGenerated(false);
    }
  }, [state.isCropperVisible]);

  const cropperDimensions = useMemo(() => {
    if (!containerRect) {
      return { width: 0, height: 0, x: 0, y: 0 };
    }
    const containerHeight = containerRect.height;
    const containerWidth = containerRect.width;
    const aspectRatio = ASPECT_RATIOS[state.aspectRatioKey];
    const cropperHeight = containerHeight;
    const cropperWidth = cropperHeight * aspectRatio;
    const y = 0;
    const maxX = containerWidth - cropperWidth;
    const boundedX = state.cropperX * (containerWidth - cropperWidth);
    const x = Math.max(0, Math.min(boundedX, maxX));
    return { width: cropperWidth, height: cropperHeight, x: x, y: y };
  }, [state.aspectRatioKey, state.cropperX, containerRect]);

  const recordDataPoint = (type) => {
    if (!containerRect || cropperDimensions.width === 0) {
      return;
    }
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const percent_x = containerWidth > 0 ? cropperDimensions.x / containerWidth : 0;
    const percent_y = containerHeight > 0 ? cropperDimensions.y / containerHeight : 0;
    const percent_width = containerWidth > 0 ? cropperDimensions.width / containerWidth : 0;
    const percent_height = containerHeight > 0 ? cropperDimensions.height / containerHeight : 0;

    const currentCoords = [percent_x, percent_y, percent_width, percent_height];
    const newVolume = state.volume;
    const newPlaybackRate = state.playbackRate;

    const lastEvent = sessionLog[sessionLog.length - 1];
    if (lastEvent) {
      const coordsAreEqual = JSON.stringify(currentCoords) === JSON.stringify(lastEvent.coordinates);
      const volumeIsEqual = newVolume === lastEvent.volume;
      const rateIsEqual = newPlaybackRate === lastEvent.playbackRate;

      if ((type === 'cropperMove') && coordsAreEqual && volumeIsEqual && rateIsEqual) {
        return;
      }
    }

    const dataPoint = {
      timeStamp: videoRef.current.currentTime,
      coordinates: currentCoords,
      volume: newVolume,
      playbackRate: newPlaybackRate,
      eventType: type,
    };
    setSessionLog((prevLog) => [...prevLog, dataPoint]);
  };

  useEffect(() => {
    if (state.isCropperVisible && sessionLog.length === 0) {
      const dataPoint = {
        timeStamp: 0.0,
        coordinates: [0, 0, 1, 1], // Log full 16:9 frame
        volume: state.volume,
        playbackRate: state.playbackRate,
        eventType: 'sessionStart',
      };
      setSessionLog([dataPoint]);
    }
  }, [state.isCropperVisible, state.volume, state.playbackRate, sessionLog.length]);

  const handleGenerateJSON = () => {
    if (!containerRect) return;

    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const percent_x = containerWidth > 0 ? cropperDimensions.x / containerWidth : 0;
    const percent_y = containerHeight > 0 ? cropperDimensions.y / containerHeight : 0;
    const percent_width = containerWidth > 0 ? cropperDimensions.width / containerWidth : 0;
    const percent_height = containerHeight > 0 ? cropperDimensions.height / containerHeight : 0;

    const finalDataPoint = {
      timeStamp: videoRef.current.currentTime,
      coordinates: [percent_x, percent_y, percent_width, percent_height],
      volume: state.volume,
      playbackRate: state.playbackRate,
      eventType: 'sessionEnd',
    };
    const finalSessionLog = [...sessionLog, finalDataPoint];
    const json = JSON.stringify(finalSessionLog, null, 2);
    setSessionLog(finalSessionLog);

    setIsSessionGenerated(true);

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'session.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePlayPause = () => {
    if (state.isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      if (state.isCropperVisible && !state.isPreviewActive) {
        dispatch({ type: 'SET_PREVIEW_ACTIVE', payload: true });
      }
    }
  };

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (time) => {
    const newTime = parseFloat(time);
    dispatch({ type: 'SET_TIME', payload: newTime });
  };

  const handleSeekEnd = (time) => {
    const newTime = parseFloat(time);
    videoRef.current.currentTime = newTime;
    setIsSeeking(false);
    recordDataPoint('seek');

    if (state.isCropperVisible && !state.isPreviewActive) {
      dispatch({ type: 'SET_PREVIEW_ACTIVE', payload: true });
    }
  };

  const handleVolumeChange = (volume) => {
    dispatch({ type: 'SET_VOLUME', payload: volume });
    recordDataPoint('volumeChange');
  };

  const handlePlaybackRateChange = (rate) => {
    const newRate = parseFloat(rate);
    dispatch({ type: 'SET_PLAYBACK_RATE', payload: newRate });
    recordDataPoint('playbackRateChange');
  };

  const handleAspectRatioChange = (ratioKey) => {
    dispatch({ type: 'SET_ASPECT_RATIO', payload: ratioKey });
    recordDataPoint('aspectRatioChange');
  };

  const handleCropperDrag = (newXPercentage) => {
    dispatch({ type: 'SET_CROPPER_X', payload: newXPercentage });
  };

  const handleCropperDragEnd = () => {
    recordDataPoint('cropperMove');
  };

  const renderEditor = () => (
    <>
      <div className={styles.mainContent}>
        <div className={styles.leftPanel}>
          <ErrorBoundary>
            <div className={styles.playerContent}>
              <VideoPlayer
                videoRef={videoRef}
                containerRef={videoContainerRef}
                src = {videoUrl}
                state={state}
                dispatch={dispatch}
                cropperDimensions={cropperDimensions}
                onCropperDrag={handleCropperDrag}
                onCropperDragEnd={handleCropperDragEnd}
                onContainerRectChange={setContainerRect}
                isSeeking={isSeeking}
              />

              <PlayerControls
                state={state}
                onPlayPause={handlePlayPause}
                onSeekStart={handleSeekStart}
                onSeekChange={handleSeekChange}
                onSeekEnd={handleSeekEnd}
                onVolumeChange={handleVolumeChange}
              />
              <SettingsPanel
                state={state}
                aspectRatios={ASPECT_RATIO_KEYS}
                onAspectRatioChange={handleAspectRatioChange}
                onPlaybackRateChange={handlePlaybackRateChange}
              />
            </div>
          </ErrorBoundary>
        </div>
        <div className={styles.rightPanel}>
          <p className={styles.previewTitle}>Preview</p>
          <ErrorBoundary>
            <DynamicPreview
              videoRef={videoRef}
              cropperDimensions={cropperDimensions}
              isPlaying={state.isPlaying}
              isPreviewActive={state.isPreviewActive}
            />
          </ErrorBoundary>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerLeft}>
          <button
            className={
              state.isCropperVisible
                ? styles.ctaButtonSecondary
                : styles.ctaButton
            }
            onClick={() => dispatch({ type: 'TOGGLE_CROPPER' })}
            disabled={state.isCropperVisible}
          >
            Start Cropper
          </button>
          <button
            className={
              state.isCropperVisible
                ? styles.ctaButton
                : styles.ctaButtonSecondary
            }
            onClick={() => dispatch({ type: 'TOGGLE_CROPPER' })}
            disabled={!state.isCropperVisible}
          >
            Remove Cropper
          </button>
          <button
            className={
              state.isCropperVisible && sessionLog.length > 1
                ? styles.ctaButton
                : styles.ctaButtonSecondary
            }
            onClick={handleGenerateJSON}
            disabled={!state.isCropperVisible || sessionLog.length <= 1}
          >
            Generate Preview
          </button>
        </div>
        <button
          className={styles.cancelButton}
          onClick={() => {
            setOpenModal(false)
            dispatch({ type: 'RESET' });
            setSessionLog([]);
            setIsSessionGenerated(false);
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );

  const renderPreview = () => {
    if (sessionLog.length === 0) {
      return (
        <div className={styles.previewError}>
          <p>No session data recorded.</p>
          <p>Please use the editor to create a session first.</p>
        </div>
      );
    }
    return <SessionPreview sessionLog={sessionLog} videoSrc={videoUrl} />;
  };

  return (
    <div className={styles.editorWrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Cropper</h2>
        <div className={styles.modeToggle}>
          <button
            className={`${styles.toggleButton} ${mode === 'preview' ? styles.active : ''
              }`}
            onClick={() => setMode('preview')}
            disabled={!isSessionGenerated}
          >
            Preview Session
          </button>
          <button
            className={`${styles.toggleButton} ${mode === 'edit' ? styles.active : ''
              }`}
            onClick={() => setMode('edit')}
          >
            Generate Session
          </button>
        </div>
        <div></div>
      </div>
      {mode === 'edit' ? renderEditor() : renderPreview()}
    </div>
  );
};

export default VideoEditor;