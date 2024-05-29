import { Line } from '@ant-design/plots';
import React from 'react';
import ReactDOM from 'react-dom';

export const DemoLine = () => {
  const data = [
    { year: '1991', value: 3 },
    { year: '1992', value: 4 },
    { year: '1993', value: 3.5 },
    { year: '1994', value: 5 },
    { year: '1995', value: 4.9 },
    { year: '1996', value: 6 },
    { year: '1997', value: 7 },
    { year: '1998', value: 9 },
    { year: '1999', value: 13 },
  ];
  const config = {
    data,
    xField: 'year',
    yField: 'value',
    point: {
      shape: 'square',
      size: 4,
    },
    tooltip: {
      showMarkers: false,
    },
    style: {
      lineWidth: 2,
    },
  };

  return <Line {...config} />;
};

// Rendering to the DOM (this is optional and can be removed if you just want to export the component)
// ReactDOM.render(<DemoLine />, document.getElementById('container'));

// Export the component

