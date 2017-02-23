/*
    This experiment shows taking a "block" out of a "toolbox" and into a "workspace"
    you can then drag the new block inside the workspace.

    The main point is that the toolbox and the workspace are not really related.
    This means you can separate the toolbox from the workspace!

*/


// Define global elements
var rootEl = document.getElementById("root");
var toolboxEl = document.getElementById("toolbox");

// Create workspace SVG
var workspaceDiv = document.createElement('div');
workspaceDiv.setAttribute('class', 'svgDiv workspaceDiv');
var workspace = SVG(workspaceDiv);
rootEl.appendChild(workspaceDiv);

// Creates a block element
// maybe this should be controllable from css?
function createBlock(svg){
    return svg.rect(100, 25).addClass('standardBlock');
};

// Create a copy of the standard block, and add it to our toolbox div.
var blockDiv = document.createElement('div');
blockDiv.setAttribute('class', 'svgDiv blockDiv');
var standardBlock_toolbox = createBlock(SVG(blockDiv).size(100, 25));
toolboxEl.appendChild(blockDiv);

// Enable dragging of the standard block from the tool box
enableDragFromToolbox(standardBlock_toolbox, createBlock);

// Insert a new standard block when dragged in from the toolbox
// todo : if not in workspace area, DONT ADD.
standardBlock_toolbox.on('dragFromToolbox-finished', (ev) => {
    // extract variables passed to the event
    var e = ev.detail.e;
    var createBlock = ev.detail.createBlock;

    // create a new copy of the block in the workspace
    newBlock = createBlock(workspace);
    var newPoint = relativePoint(e, newBlock);

    // place the block under the mousepointer
    var delx = newPoint.x - grabPoint.x;
    var dely = newPoint.y - grabPoint.y;
    newBlock.dmove(delx, dely);

    // enable dragging on this new block so we can drag it around the workspace
    enableDragOnSVGElement(newBlock);

    

});



// Code in the background


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

// Enables an element out of a toolbox 
//    Creates a copy of the element which is dragged around the screen.
//    createNew is the function that must be called to create the svg element.
//          type: func(svgInstance)
function enableDragFromToolbox(element, createNew) {
    element.on('mousedown.drag', startDrag);
    element.on('touchstart.drag', startDrag);

    var newDiv, newSVG, newElement;

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
        newDiv.setAttribute('class', 'divDraggable elementBeingDragged');
        newSVG = SVG(newDiv).size(element.width(), element.height());
        newElement = createNew(newSVG);
        

        document.body.appendChild(newDiv);
        element.fire('dragFromToolbox-started', {});


        //add drag and end events to window
        SVG.on(window, 'mousemove.dragFromToolbox', captureDrag);
        SVG.on(window, 'touchmove.dragFromToolbox', captureDrag);
        SVG.on(window, 'mouseup.dragFromToolbox', endDrag);
        SVG.on(window, 'touchend.dragFromToolbox', endDrag);

        captureDrag(e);
    }

    function captureDrag(e) {
        var newPoint = relativePoint(e, newElement);
        var delx = newPoint.x - grabPoint.x;
        var dely = newPoint.y - grabPoint.y;

        var rect = newDiv.getBoundingClientRect();

        newDiv.setAttribute('style', 'top:' + (rect.top + dely) + 'px;' + 'left:' + (rect.left + delx) + 'px;');
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

    return element;
}

