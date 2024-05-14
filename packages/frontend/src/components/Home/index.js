import React from 'react';

function Home() {
  return (
    <div className="wrap">
      <div className="header">
        <h1>Interactive Map of Regional Air Quality</h1>
      </div>

      <div className="content-wrap">
        <div className="left-col">

          <div className="toggles">
            Toggles
          </div>

          <div className="legend">
            Legend
          </div>

        </div>

        <div className="right-col">
          right col
        </div>
      </div>
    </div>
  );
}

export default Home;
