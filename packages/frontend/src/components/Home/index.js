/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import VideoPlayer from '../VideoPlayer';

function Home() {
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
          <VideoPlayer currentSelection="/map-assets/one-day-loop.mp4" />
        </div>
      </div>
    </div>
  );
}

export default Home;
