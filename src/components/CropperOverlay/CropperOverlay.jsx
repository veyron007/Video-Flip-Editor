import React, { useState } from 'react';
import styles from './CropperOverlay.module.css';

const CropperOverlay = ({
  dimensions,
  containerWidth,
  onDrag,
  onDragEnd,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  // Style for the cropper based on calculated dimensions
  const cropperStyle = {
    transform: `translateX(${dimensions.x}px)`,
    width: `${dimensions.width}px`,
    height: `${dimensions.height}px`,
    top: `${dimensions.y}px`,
  };

  const handleMouseDown = (e) => {
    // Prevent default text selection
    e.preventDefault();
    setIsDragging(true);

    // Store the initial offset of the mouse within the cropper
    const initialMouseX = e.clientX;
    const initialCropperX = dimensions.x;

    const handleMouseMove = (moveEvent) => {
      moveEvent.preventDefault();

     

      const deltaX = moveEvent.clientX - initialMouseX;
      let newPixelX = initialCropperX + deltaX;

      const cropperWidth = dimensions.width;
      const minX = 0;
      const maxX = containerWidth - cropperWidth;

      newPixelX = Math.max(minX, Math.min(newPixelX, maxX));

      const maxDragRange = containerWidth - cropperWidth;
      let newXPercentage = newPixelX / maxDragRange;

      if (maxDragRange <= 0) {
        newXPercentage = 0;
      }

      onDrag(newXPercentage);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd(); 
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`${styles.cropperOverlay} ${isDragging ? styles.isDragging : ''}`}
      style={cropperStyle}
      onMouseDown={handleMouseDown}
    >
      <div className={styles.gridLineV} style={{ left: '33.33%' }}></div>
      <div className={styles.gridLineV} style={{ left: '66.66%' }}></div>
      <div className={styles.gridLineH} style={{ top: '33.33%' }}></div>
      <div className={styles.gridLineH} style={{ top: '66.66%' }}></div>
    </div>
  );
};

export default CropperOverlay;