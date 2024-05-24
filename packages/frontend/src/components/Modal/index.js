/* eslint-disable jsx-a11y/media-has-caption */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

function Modal({ setShowModal, setShowVideoPlayer }) {
  const modalContentRef = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        setShowModal(false);
        setShowVideoPlayer(true);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
          Lorem ipsum dolor sit amet, consectetuer adipiscing elit,
          ed diam nonummy nibh euismod tincidunt ut laoreet dolore
          magna aliquam erat volutpat. Ut wisi enim ad minim veniam,
          quis nostrud exerci tation ullamcorper suscipit lobortis nisl
          ut aliquip ex ea commodo consequat. Duis autem vel eum iriure
          dolor in hendrerit in vulputate velit esse molestie consequat,
          vel illum dolore eu feugiat nulla facilisis at vero eros et
          accumsan et iusto odio dignissim qui blandit praesent luptatum
          zzril delenit augue duis dolore te feugait nulla facilisi.
        </p>
      </div>
    </div>
  );
}

Modal.propTypes = {
  setShowModal: PropTypes.bool.isRequired,
  setShowVideoPlayer: PropTypes.bool.isRequired,
};
export default Modal;
