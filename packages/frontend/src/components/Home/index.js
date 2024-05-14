/* eslint-disable jsx-a11y/media-has-caption */
import React, { useEffect, useRef } from 'react';

function Home() {
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const progress = progressRef.current;

    const updateProgress = () => {
      const value = Math.round((video.currentTime / video.duration) * 100);
      progress.value = value;
    };

    video.addEventListener('timeupdate', updateProgress);

    return () => video.removeEventListener('timeupdate', updateProgress);
  }, []);

  return (
    <div className="wrap">
      <div className="header">
        <h1>Interactive Map of Regional Air Quality</h1>
      </div>

      <div className="content-wrap">
        <div className="left-col">
          <div className="toggles">
            Toggles
          </div>

          <div className="legend">
            Legend
          </div>
        </div>

        <div className="right-col">

          <figure>
            <video autoPlay muted loop id="video" ref={videoRef}>
              <source src="/map-assets/one-day-loop.mp4" type="video/mp4" />
            </video>
            <figcaption>
              <progress id="progress" max="100" value="0" ref={progressRef}>Progress</progress>
            </figcaption>
          </figure>

        </div>
      </div>
    </div>
  );
}

export default Home;
