import React from 'react';
import PropTypes from 'prop-types';
import Canvas from '@components/Canvas';
import * as d3 from 'd3-geo';

// function reverseWindingOrder(shape) {
//   if (shape === undefined) { return shape; }
//
//   console.log('shape', shape.geometry.coordinates);
//   console.log(shape.geometry.type);
//   if (shape.geometry.type === 'MultiPolygon') {
//     const result = {
//       ...shape,
//       geometry: {
//         ...shape.geometry,
//         coordinates: shape.geometry.coordinates.map((x) => x.map((y) => y.toReversed())),
//       },
//     };
//     console.log(result.geometry.coordinates);
//     return result;
//   }
//   return shape;
// }

function Map(props) {
  const { mapShapes } = props;

  const graticule = d3.geoGraticule()
    .step([10, 10]);

  const draw = (ctx) => {
    const size = 10000;
    const projection = d3.geoOrthographic()
      .rotate([84.5125, -39.1])
      .fitExtent([[0 - size, 20 - size], [1000 + size, 1000 + size]], graticule());

    const path = d3.geoPath(projection, ctx);
    ctx.clearRect(0, 0, 10000, 10000);
    ctx.fillStyle = '#000000';

    // mapShapes.map((shape) => reverseWindingOrder(shape)).forEach((shape) => {
    mapShapes.forEach((shape) => {
      ctx.lineWidth = 1 / shape.properties.scalerank;
      ctx.fillStyle = `rgb(${256 * Math.random()}, ${256 * Math.random()}, ${256 * Math.random()})`;
      ctx.beginPath();
      path(shape);
      ctx.stroke();
    });

    ctx.strokeStyle = '#000000';
    ctx.beginPath();
    path(graticule());
    ctx.stroke();

    console.log('done drawing c:');
  };

  return (
    <Canvas width="1000px" height="1000px" draw={draw} />
  );
}

Map.propTypes = {
  /* eslint-disable-next-line react/forbid-prop-types */
  mapShapes: PropTypes.array.isRequired,
};

export default Map;
