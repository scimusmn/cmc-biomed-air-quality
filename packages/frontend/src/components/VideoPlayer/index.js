/* eslint-disable jsx-a11y/media-has-caption */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function VideoPlayer({ currentSelection, dateStamp }) {
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    const progress = progressRef.current;
    videoRef.current.load();
    const updateProgress = () => {
      let value = (video.currentTime / video.duration) * 100;
      if (Number.isNaN(value)) {
        value = 0.1;
      }
      progress.value = parseFloat(value);
    };

    video.addEventListener('timeupdate', updateProgress);

    return () => video.removeEventListener('timeupdate', updateProgress);
  }, [currentSelection]);

  // Possible fix for "stuck" video looping issue
  useEffect(() => {
    const video = videoRef.current;
    const loopVideo = () => {
      video.currentTime = 0;
      video.play();
    };

    video.addEventListener('ended', loopVideo);

    return () => video.removeEventListener('ended', loopVideo);
  }, [currentSelection]);

  return (
    <div>
      <figure>
        <video key={currentSelection} autoPlay muted id="video" ref={videoRef}>
          <source src={`${currentSelection}?${dateStamp}`} type="video/mp4" />
        </video>
        <figcaption>
          <progress id="progress" max="100" value="0" ref={progressRef}>Progress</progress>
        </figcaption>
      </figure>
    </div>
  );
}

VideoPlayer.propTypes = {
  currentSelection: PropTypes.string.isRequired,
  dateStamp: PropTypes.string.isRequired,
};

export default VideoPlayer;
