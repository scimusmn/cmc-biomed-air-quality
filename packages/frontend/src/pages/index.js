import React from 'react';
import Map from '@components/Map';

function loadGeo(url) {
  return fetch(url).then((response) => response.json());
}

const geoDataSources = [
  '/gis/roads.geojson',
  '/gis/places.geojson',
];

function IndexPage() {
  const [mapShapes, setMapShapes] = React.useState([]);

  React.useEffect(() => {
    Promise.all(geoDataSources.map((url) => loadGeo(url)))
      .then((data) => {
        const shapes = data.map((x) => x.features);
        console.log(shapes);
        setMapShapes(shapes.flat());
      });
  }, []);

  return (
    <Map mapShapes={mapShapes} />
  );
}

export default IndexPage;
