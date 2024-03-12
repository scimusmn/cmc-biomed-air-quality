import React from 'react';
import Map from '@components/Map';

function IndexPage() {
  const [mapShapes, setMapShapes] = React.useState([]);

  React.useEffect(() => {
    fetch('/gis/ne_10m_roads_north_america.geojson')
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
        setMapShapes(json.features);
      });
  }, []);

  return (
    <Map mapShapes={mapShapes} />
  );
}

export default IndexPage;
