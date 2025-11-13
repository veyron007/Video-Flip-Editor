import React from 'react';
import styles from './SettingsPanel.module.css';

const PLAYBACK_RATES = [0.5, 1, 1.5, 2];

const Select = ({ label, value, options, onChange, id }) => {
  const selectRef = React.useRef(null);

  const handleWrapperClick = () => {
    if (selectRef.current) {
      selectRef.current.focus();
      selectRef.current.click();
    }
  };

  return (
    <div className={styles.selectWrapper} onClick={handleWrapperClick}>
      <label htmlFor={id} className={styles.selectLabel}>{label}</label>
      <select
        ref={selectRef}
        id={id}
        className={styles.select}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option
            key={typeof option === 'object' ? option.value : option}
            value={typeof option === 'object' ? option.value : option}
          >
            {typeof option === 'object' ? option.label : option}
          </option>
        ))}
      </select>
    </div>
  );
};

const SettingsPanel = ({
  state,
  aspectRatios,
  onAspectRatioChange,
  onPlaybackRateChange,
}) => {
  return (
    <div className={styles.panelWrapper}>
      <Select
        id="playback-speed"
        label='Playback speed'
        value={state.playbackRate}
        options={PLAYBACK_RATES.map((rate) => ({
          label: `${rate}x`,
          value: rate,
        }))}
        onChange={onPlaybackRateChange}
      />
      <Select
        id="aspect-ratio"
        label='Cropper Aspect Ratio'
        value={state.aspectRatioKey}
        options={aspectRatios}
        onChange={onAspectRatioChange}
      />
    </div>
  );
};

export default SettingsPanel;