/* eslint-disable jsx-a11y/media-has-caption */
import React, { useState } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import VideoPlayer from '../VideoPlayer';
import LegendItem from '../LegendItem';
import Modal from '../Modal';

function Home() {
  // Array of video objects
  const videos = [
    { url: '/map-assets/one-day-loop.mp4', title: '24 hour loop' },
    { url: '/map-assets/ten-day-loop.mp4', title: '10 day loop' },
    { url: '/map-assets/one-year-loop.mp4', title: '1 year loop' },
  ];

  // State to hold the current video URL
  const [showMap, setShowMap] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(videos[1].url);
  const [startReset, setStartReset] = useState(false);

  // Function to reload the page when idle
  const onIdle = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  // Idle Timer Start
  const { start } = useIdleTimer({
    timeout: 1000 * 60 * 4, // 4 minutes
    onIdle: () => onIdle(),
    startManually: true,
  });

  // Function to start the reset timer after startReset gets set to true (click happened)
  const startResetTimer = () => {
    if (startReset === false) {
      setStartReset(true);
      start();
    }
  };

  // Function to change to the map img
  const changeToMap = () => {
    setShowMap(true);
    setShowVideoPlayer(false);
    setShowModal(false);
    startResetTimer();
  };

  // Function to change to a video
  const changeToVideo = (videoUrl) => {
    setShowMap(false);
    setShowModal(false);
    setShowVideoPlayer(true);
    setCurrentVideo(videoUrl);
    startResetTimer();
  };

  // Function to change to a modal
  const changeToModal = () => {
    setShowMap(false);
    setShowVideoPlayer(false);
    setShowModal(true);
    startResetTimer();
  };

  return (
    <div className="wrap">
      <div className={showModal === true ? 'header modal-active' : 'header'}>
        <h1>Interactive Map of Regional Air Quality</h1>
        <img className="status-icon" src="/map-assets/status-icon.png" alt="Status Icon" />
      </div>

      <div className="content-wrap">
        <div className="left-col">
          <div className={showModal === true ? 'toggles modal-active' : 'toggles'}>
            <button type="button" className={showMap === true ? 'active' : ''} onClick={changeToMap}>Current</button>

            {videos.map((video) => (
              <button
                key={video.url} // Use the video URL as the key
                type="button"
                onClick={() => changeToVideo(video.url)}
                className={currentVideo === video.url && showMap === false && showModal === false ? 'active' : ''}
              >
                {video.title}
              </button>
            ))}
          </div>

          <div className={showModal === true ? 'legend modal-active' : 'legend'}>
            <h3>Legend</h3>
            <LegendItem legendClass="good" legendTitle="Good" />
            <LegendItem legendClass="moderate" legendTitle="Moderate" />
            <LegendItem legendClass="unhealthy-sensitive" legendTitle="Unhealthy for Sensitive Groups" />
            <LegendItem legendClass="unhealthy" legendTitle="Unhealthy" />
            <LegendItem legendClass="very-unhealthy" legendTitle="Very Unhealthy" />
            <LegendItem legendClass="hazardous" legendTitle="Hazardous" />
          </div>

          <div className="modal-cta-wrap">
            <button type="button" className="action-button" onClick={() => changeToModal()}>
              <span className="action-info-icon">!</span>
              Action Day Info
            </button>
          </div>
        </div>

        <div className="right-col">
          {/* Map Image */}
          {showMap ? <img src="/map-assets/current.png" alt="Current Map" /> : null}

          {/* Video Player */}
          {showVideoPlayer ? <VideoPlayer currentSelection={currentVideo} /> : null}

          {/* Modal */}
          {showModal ? <Modal /> : null}
        </div>
      </div>
    </div>
  );
}

export default Home;
