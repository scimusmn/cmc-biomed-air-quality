/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import VideoPlayer from '../VideoPlayer';
import LegendItem from '../LegendItem';

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
            <LegendItem legendClass="good" legendTitle="Good" />
            <LegendItem legendClass="moderate" legendTitle="Moderate" />
            <LegendItem legendClass="unhealthy-sensitive" legendTitle="Unhealthy for Sensitive Groups" />
            <LegendItem legendClass="unhealthy" legendTitle="Unhealthy" />
            <LegendItem legendClass="very-unhealthy" legendTitle="Very Unhealthy" />
            <LegendItem legendClass="hazardous" legendTitle="Hazardous" />
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
