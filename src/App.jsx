import React, { useState } from 'react';
import VideoEditor from './components/VideoEditor/VideoEditor';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';

function App() {
 const [openModal, setOpenModal] =  useState(true);

  return (
    <ErrorBoundary>
     {openModal ? <VideoEditor setOpenModal = {setOpenModal} /> : null }
    </ErrorBoundary>
  );
}

export default App;``