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
  handleClickOutside: PropTypes.func.isRequired,
};

export default Modal;
