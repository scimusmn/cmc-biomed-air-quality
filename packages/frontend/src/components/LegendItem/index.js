/* eslint-disable jsx-a11y/media-has-caption */
import React from 'react';
import PropTypes from 'prop-types';

function LegendItem(props) {
  const { legendClass, legendTitle } = props;
  return (
    <div className="legend-item">
      <span className={`circle ${legendClass}`} />
      <h5>{legendTitle}</h5>
    </div>
  );
}

LegendItem.propTypes = {
  legendClass: PropTypes.objectOf(PropTypes.any).isRequired,
  legendTitle: PropTypes.objectOf(PropTypes.any).isRequired,
};

export default LegendItem;
