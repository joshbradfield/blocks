// Define the root div element
var rootEl = document.getElementById("root");

// Create an SVG.js monitored svg element
var svgDiv = document.createElement('div');
svgDiv.setAttribute('class', 'svgDiv');
rootEl.appendChild(svgDiv);
var svg = SVG(svgDiv);



var rect = svg.rect(100, 100).attr({ fill: '#f06' });


addDragListener = (element) => {
    element.on('mousedown.drag', startDrag);
    element.on('touchdown.drag', startDrag);

    var grabPoint = 0;

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

        element.fire('drag-finished', { e, element, grabPoint });
    }

    function relativePoint(e) {
        var p = element.point(e.screenX, e.screenY);
        p.x -= element.x();
        p.y -= element.y();
        return p;
    }

    function startDrag(e) {

        // check for left button
        if ((e.type == 'click' || e.type == 'mousedown' || e.type == 'mousemove')
            && ((e.which || e.buttons) != 1)) {
            return;
        }

        // Prevent default behaviour
        e.preventDefault();
        e.stopPropagation();

        grabPoint = relativePoint(e, element);

        // add drag and end events to window
        SVG.on(window, 'mousemove.drag', captureDrag);
        SVG.on(window, 'touchmove.drag', captureDrag);
        SVG.on(window, 'mouseup.drag', endDrag);
        SVG.on(window, 'touchend.drag', endDrag);

        element.fire('drag-started');
    }

}


addDragListener(rect);





