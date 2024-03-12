import PropTypes from 'prop-types';
import React, { useRef, useEffect } from 'react';

function Canvas(props) {
  const {
    draw, width, height, ...rest
  } = props;
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    draw(context, rest);
  }, [props]);

  return (
    <canvas
      width={width}
      height={height}
      ref={canvasRef}
    />
  );
}

Canvas.propTypes = {
  draw: PropTypes.func.isRequired,
  width: PropTypes.string,
  height: PropTypes.string,
};

Canvas.defaultProps = {
  width: '100%',
  height: '100%',
};

export default Canvas;
