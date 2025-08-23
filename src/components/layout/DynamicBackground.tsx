
"use client";

import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

const DynamicBackground = () => {
  const { resolvedTheme } = useTheme();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  const backgroundSrc = '/icons/v4.mp4';
  
  return (
    <>
      <div id="background-video-overlay" />
      <video
        key={backgroundSrc}
        id="background-video"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={backgroundSrc} type="video/mp4" />
      </video>
    </>
  );
};

export default DynamicBackground;
