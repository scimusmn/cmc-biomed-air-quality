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
            <h3>Legend</h3>

            <div className="legend-item">
              <span className="circle good" />
              <h5>Good</h5>
            </div>
            <div className="legend-item">
              <span className="circle moderate" />
              <h5>Moderate</h5>
            </div>
            <div className="legend-item">
              <span className="circle unhealthy-sensitive" />
              <h5>Unhealthy for Sensitive Groups</h5>
            </div>
            <div className="legend-item">
              <span className="circle unhealthy" />
              <h5>Unhealthy</h5>
            </div>
            <div className="legend-item">
              <span className="circle very-unhealthy" />
              <h5>Very Unhealthy</h5>
            </div>
            <div className="legend-item">
              <span className="circle hazardous" />
              <h5>Hazardous</h5>
            </div>

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
