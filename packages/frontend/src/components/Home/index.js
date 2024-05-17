/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState } from 'react';
import VideoPlayer from '../VideoPlayer';
import LegendItem from '../LegendItem';

function Home() {
  // State to hold the current video URL
  const [currentVideo, setCurrentVideo] = useState('/map-assets/one-day-loop.mp4');

  // Array of video objects
  const videos = [
    { url: '/map-assets/one-day-loop.mp4', title: '24 hour loop' },
    { url: '/map-assets/ten-day-loop.mp4', title: '10 day loop' },
    { url: '/map-assets/one-year-loop.mp4', title: '1 year loop' },
  ];

  // Function to change the video
  const changeVideo = (videoUrl) => {
    setCurrentVideo(videoUrl);
  };

  return (
    <div className="wrap">
      <div className="header">
        <h1>Interactive Map of Regional Air Quality</h1>
      </div>

      <div className="content-wrap">
        <div className="left-col">
          <div className="toggles">
            {videos.map((video) => (
              <button
                key={video.url} // Use the video URL as the key
                type="button"
                onClick={() => changeVideo(video.url)}
                className={currentVideo === video.url ? 'active' : ''}
              >
                {video.title}
              </button>
            ))}
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
          {/* VideoPlayer */}
          <VideoPlayer currentSelection={currentVideo} />
        </div>
      </div>
    </div>
  );
}

export default Home;
