import React from 'react';
import styles from './PlayerControls.module.css';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const PlayerControls = ({
  state,
  onPlayPause,
  onSeekStart,
  onSeekChange,
  onSeekEnd,
  onVolumeChange,
}) => {
  const handleSeek = (e) => {
    onSeekChange(e.target.value);
  };

  const handleVolume = (e) => {
    onVolumeChange(parseFloat(e.target.value));
  };

  const progressPercent = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
  const volumePercent = state.volume * 100;

  return (
    <div className={styles.controlsWrapper}>
      
      <div className={styles.topRow}>
        <button onClick={onPlayPause} className={styles.playButton}>
          {state.isPlaying ? (
            <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
              <path d='M2 2H5V12H2V2Z' fill='white' />
              <path d='M9 2H12V12H9V2Z' fill='white' />
            </svg>
          ) : (
            <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
              <path d='M3 2L11 7L3 12V2Z' fill='white' />
            </svg>
          )}
        </button>

        <input
          type='range'
          className={styles.seekBar}
          min='0'
          max={state.duration || 0}
          value={state.currentTime}
          step='0.1'
          onMouseDown={onSeekStart}
          onChange={handleSeek}
          onMouseUp={(e) => onSeekEnd(e.target.value)}
          onTouchStart={onSeekStart}
          onTouchMove={handleSeek}
          onTouchEnd={(e) => onSeekEnd(e.target.value)}
          style={{ '--progress-percent': `${progressPercent}%` }}
        />
      </div>

      <div className={styles.bottomRow}>
        <div className={styles.timeDisplay}>
          {formatTime(state.currentTime)} | {formatTime(state.duration)}
        </div>

        <div className={styles.volumeWrapper}>
          <div className={styles.volumeIcon}>
            <svg width='16' height='16' viewBox='0 0 16 16' fill='none'>
              <path
                d='M7.00016 3.33331L3.66683 6.66665H1.3335V9.33331H3.66683L7.00016 12.6666V3.33331Z'
                fill='white'
              />
              <path
                d='M8.6665 6V10C9.9165 9.71331 10.6665 8.46665 10.6665 7.99998C10.6665 7.53331 9.9165 6.28665 8.6665 6Z'
                fill='white'
              />
            </svg>
          </div>

          <input
            type='range'
            className={styles.volumeBar}
            min='0'
            max='1'
            step='0.01'
            value={state.volume}
            onChange={handleVolume}
            style={{ '--progress-percent': `${volumePercent}%` }}
          />
        </div>
      </div>

    </div>
  );
};

export default PlayerControls;