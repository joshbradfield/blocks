// Define the root div element
var rootEl = document.getElementById("root");

// Create an SVG.js monitored svg element
var svgDiv = document.createElement('div');
svgDiv.setAttribute('class', 'svgDiv');
rootEl.appendChild(svgDiv);
var svg = SVG(svgDiv);

var rect = svg.rect(100, 100).attr({ fill: '#f06' });

enableDragOnSVGElement(rect);

// Takes a mouse event and an svg element and returns the position of the mouse relative to the element
//   e type: mouse event object (uses screenX, screenY )
//   element type: svg element
function relativePoint(e, element) {
    var p = element.point(e.screenX, e.screenY);
    p.x -= element.x();
    p.y -= element.y();
    return p;
}

// Enables drag on a SVG element inside a SVG block
function enableDragOnSVGElement(element) {
    element.on('mousedown.drag', startDrag);
    element.on('touchstart.drag', startDrag);

    var grabPoint = 0;


    function startDrag(e) {

        // check for left button
        if ((e.type == 'click' || e.type == 'mousedown' || e.type == 'mousemove')
            && ((e.which || e.buttons) != 1)) {
            return;
        }

        // Prevent default behaviour
        e.preventDefault();
        e.stopPropagation();

        // Find the position of the mouse relative to the block
        grabPoint = relativePoint(e, element);

        // Bring the block to the forground
        element.front();

        // apply draggable css
        element.addClass('elementBeingDragged');

        // add drag and end events to window
        SVG.on(window, 'mousemove.drag', captureDrag);
        SVG.on(window, 'touchmove.drag', captureDrag);
        SVG.on(window, 'mouseup.drag', endDrag);
        SVG.on(window, 'touchend.drag', endDrag);

        element.fire('drag-started');
    }

    function captureDrag(e) {
        var newPoint = relativePoint(e, element);
        var delx = newPoint.x - grabPoint.x;
        var dely = newPoint.y - grabPoint.y;
        element.dmove(delx, dely);
        element.fire('drag-moved', { e, element, grabPoint, newPoint });
    }

    function endDrag(e) {
        captureDrag(e);

        // unbind events
        SVG.off(window, 'mousemove.drag')
        SVG.off(window, 'touchmove.drag')
        SVG.off(window, 'mouseup.drag')
        SVG.off(window, 'touchend.drag')

        element.removeClass('elementBeingDragged');
        element.fire('drag-finished', { e, element, grabPoint });
    }

    return element;
}
