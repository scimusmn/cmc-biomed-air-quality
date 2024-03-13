import React from 'react';
import Map from '@components/Map';

function loadGeo(name, url) {
  return fetch(url)
    .then((response) => response.json())
    .then((data) => [name, data]);
}

const geoDataSources = [
  ['roads', '/gis/roads.geojson'],
  ['cities', '/gis/places.geojson'],
];

function IndexPage() {
  const [mapShapes, setMapShapes] = React.useState(
    geoDataSources.reduce((acc, [name, _]) => {
      acc[name] = [];
      return acc;
    }, {}),
  );

  React.useEffect(() => {
    Promise.all(geoDataSources.map(([name, url]) => loadGeo(name, url)))
      .then((allShapes) => {
        const newShapes = {};
        allShapes.forEach(([name, data]) => {
          newShapes[name] = data.features;
          console.log(name, data.features, newShapes);
        });
        setMapShapes({ ...newShapes });
      });
  }, []);

  return (
    <Map mapShapes={mapShapes} />
  );
}

export default IndexPage;
