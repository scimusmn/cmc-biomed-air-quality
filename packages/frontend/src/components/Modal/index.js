/* eslint-disable jsx-a11y/media-has-caption */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

function Modal({ handleClickOutside }) {
  const modalContentRef = useRef();

  useEffect(() => {
    const handleClickOutsideEvent = (event) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        // If we click anything except the action button, close the modal.
        if (event.target.className !== 'action-button') {
          handleClickOutside();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutsideEvent);

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideEvent);
    };
  }, []);

  return (
    <div className="modal-wrap">
      <div className="modal-content" ref={modalContentRef}>
        <h3>
          <span className="action-icon">!</span>
          Action Day Info
        </h3>
        <p>
          When the number of particles in the air is dangerous to breathe,
          regional or state agencies issue Air Quality Advisories.
        </p>
        <p>The Advisory may reflect high levels of:</p>
        <ul>
          <li>ground-level ozone</li>
          <li>particulate matter</li>
          <li>carbon monoxide</li>
          <li>sulfur dioxide</li>
          <li>nitrogen dioxide</li>
          <li>or a combination of these pollutants.</li>
        </ul>
        <p>
          During an Advisory, limit the time you spend outside.
          Avoid activities that add particles to the air, such as driving and mowing the lawn.
        </p>
      </div>
    </div>
  );
}

Modal.propTypes = {
  handleClickOutside: PropTypes.func.isRequired,
};

export default Modal;
