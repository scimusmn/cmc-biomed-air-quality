/* eslint-disable jsx-a11y/media-has-caption */
import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

function VideoPlayer(props) {
  const { currentSelection } = props;
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
    <div>
      <figure>
        <video autoPlay muted loop id="video" ref={videoRef}>
          <source src={currentSelection} type="video/mp4" />
        </video>
        <figcaption>
          <progress id="progress" max="100" value="0" ref={progressRef}>Progress</progress>
        </figcaption>
      </figure>
    </div>
  );
}

VideoPlayer.propTypes = {
  currentSelection: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default VideoPlayer;
