// Define the root div element
var rootEl = document.getElementById("root");

// Create an SVG.js monitored svg element
var svgDiv = document.createElement('div');
svgDiv.setAttribute('class', 'svgDiv');
rootEl.appendChild(svgDiv);
var svg = SVG(svgDiv);

//Set Size
svg.size(300,300);

var rect = svg.rect(100, 100).attr({ fill: '#f06' })

