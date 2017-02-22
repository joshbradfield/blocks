// Define the root div element
var rootEl = document.getElementById("root");

// Create an SVG.js monitored svg element
var svgDiv = document.createElement('div');
svgDiv.setAttribute('class', 'svgDiv');
rootEl.appendChild(svgDiv);
var svg = SVG(svgDiv);



var rect = svg.rect(100, 100).attr({ fill: '#f06' });

addDragListener(rect);


function addDragListener(element) {
    element.on('mousedown.drag', function(event) {startDrag(event, this)});
    element.on('touchdown.drag', function(event) {startDrag(event, this)});
}



function captureDrag(e, element, grabPoint) {
    var newPoint = relativePoint(e,element);
    var delx = newPoint.x - grabPoint.x;
    var dely = newPoint.y - grabPoint.y;
    element.dmove(delx, dely);
    element.fire('drag-moved', {e, element, grabPoint, newPoint});
}

function endDrag(e, element, grabPoint){
    captureDrag(e,element,grabPoint);

    // unbind events
    SVG.off(window, 'mousemove.drag')
    SVG.off(window, 'touchmove.drag')
    SVG.off(window, 'mouseup.drag')
    SVG.off(window, 'touchend.drag')
    
    element.fire('drag-finished',{e, element, grabPoint});
}

function relativePoint(e, element){
     var p = element.point(e.screenX, e.screenY) ;
    p.x -= element.x();
    p.y -= element.y();  
    return p; 
}

function startDrag(e, element, grabPoint) {
    console.log(e.type);
    // check for left button
    if(     (e.type == 'click'|| e.type == 'mousedown' || e.type == 'mousemove')
        &&  ((e.which || e.buttons) != 1)) {
        return;
    }

    // Prevent default behaviour
    e.preventDefault();
    e.stopPropagation();

    var grabPoint = relativePoint(e,element);

    console.log(grabPoint);

    // add drag and end events to window
    SVG.on(window, 'mousemove.drag', function(e){ captureDrag(e, element, grabPoint) });
    SVG.on(window, 'touchmove.drag', function(e){ captureDrag(e, element, grabPoint) });
    SVG.on(window, 'mouseup.drag', function(e){ endDrag(e, element, grabPoint) });
    SVG.on(window, 'touchend.drag', function(e){ endDrag(e, element, grabPoint) });

    element.fire('drag-started');
}