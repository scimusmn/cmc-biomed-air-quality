import React from 'react';
import PropTypes from 'prop-types';
import Canvas from '@components/Canvas';
import * as d3 from 'd3-geo';

function Map(props) {
  const { mapShapes } = props;

  const graticule = d3.geoGraticule()
    .step([10, 10]);

  const draw = (ctx) => {
    const { roads, cities } = mapShapes;
    const [width, height] = [ctx.canvas.clientWidth, ctx.canvas.clientHeight];
    const size = 10000;
    const projection = d3.geoOrthographic()
      .rotate([84.5125, -39.1])
      .fitExtent([[0 - size, 20 - size], [width + size, height + size]], graticule());

    const path = d3.geoPath(projection, ctx);
    ctx.clearRect(0, 0, 10000, 10000);

    roads.forEach((road) => {
      // draw road
      ctx.lineWidth = 1 / road.properties.scalerank;
      const lineGray = Math.floor((128 * ctx.lineWidth));
      ctx.strokeStyle = `rgb(${lineGray}, ${lineGray}, ${lineGray})`;
      ctx.beginPath();
      path(road);
      ctx.stroke();
    });

    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    cities.forEach((city) => {
      // draw map label
      const { NAME_EN, SCALERANK } = city.properties;
      ctx.font = `${70 / (SCALERANK + 1)}px sans-serif`;
      const metrics = ctx.measureText(NAME_EN);
      const [x, y] = projection(city.geometry.coordinates);
      ctx.strokeText(NAME_EN, x - (metrics.width / 2), y);
      ctx.fillText(NAME_EN, x - (metrics.width / 2), y);
    });

    console.log('done drawing c:');
  };

  return (
    <Canvas width="1000px" height="1000px" draw={draw} />
  );
}

/* eslint-disable react/forbid-prop-types */
Map.propTypes = {
  mapShapes: PropTypes.shape({
    cities: PropTypes.array,
    roads: PropTypes.array,
  }).isRequired,
};

export default Map;
