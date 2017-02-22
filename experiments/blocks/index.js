

createBlock = (svg) => {
    return svg.rect(100, 25).attr({ fill: '#f06' });
};

addDragListener = (element) => {
    element.on('mousedown.drag', startDrag);
    element.on('touchdown.drag', startDrag);

    var grabPoint = 0;

    function captureDrag(e) {
        var newPoint = relativePoint(e);
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

    return element;
}

addToolBoxDragListener = (element, createNew) => {
    element.on('mousedown.drag', startDrag);
    element.on('touchdown.drag', startDrag);

    var newDiv, newSVG, newElement;

    function captureDrag(e) {
        var newPoint = relativePoint(e, newElement);
        var delx = newPoint.x - grabPoint.x;
        var dely = newPoint.y - grabPoint.y;

        var rect = newDiv.getBoundingClientRect();

        newDiv.setAttribute('style', 'top:' + (rect.top+dely) + 'px;' + 'left:' + (rect.left+delx) + 'px;');
        element.fire('dragFromToolbox-moved', { e, element, grabPoint, newPoint });


    }

    function endDrag(e) {
        captureDrag(e);

        // unbind events
        SVG.off(window, 'mousemove.dragFromToolbox')
        SVG.off(window, 'touchmove.dragFromToolbox')
        SVG.off(window, 'mouseup.dragFromToolbox')
        SVG.off(window, 'touchend.dragFromToolbox')


        document.body.removeChild(newDiv);

        element.fire('dragFromToolbox-finished', { e, createBlock, grabPoint });
    }

    function relativePoint(e, newElement) {
        var p = newElement.point(e.screenX, e.screenY);
        p.x -= newElement.x();
        p.y -= newElement.y();
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

        // Create new Div with SVG and recreate the block.
        newDiv = document.createElement('div');
        newDiv.setAttribute('class','divDraggable');
        document.body.appendChild(newDiv);
        newSVG = SVG(newDiv).size(element.width(), element.height());

        element.fire('dragFromToolbox-started');

        newElement = createNew(newSVG);

        element = newElement;
                
        // add drag and end events to window
        SVG.on(window, 'mousemove.dragFromToolbox', captureDrag);
        SVG.on(window, 'touchmove.dragFromToolbox', captureDrag);
        SVG.on(window, 'mouseup.dragFromToolbox', endDrag);
        SVG.on(window, 'touchend.dragFromToolbox', endDrag);

        captureDrag(e);
    }

    return element;
}


// Define global elements
var rootEl = document.getElementById("root");
var toolboxEl = document.getElementById("toolbox");

// Create workspace SVG
var workspaceDiv = document.createElement('div');
workspaceDiv.setAttribute('class', 'svgDiv workspaceDiv');
rootEl.appendChild(workspaceDiv);
var workspace = SVG(workspaceDiv);

var rect = createBlock(workspace);

// Create Block toolbox SVG
var blockDiv = document.createElement('div');
blockDiv.setAttribute('class', 'svgDiv blockDiv');
toolboxEl.appendChild(blockDiv);
var block = SVG(blockDiv).size(100,25);
var rectToolbox = createBlock(block);


addDragListener(rect);


addToolBoxDragListener(rectToolbox, createBlock);