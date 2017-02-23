/*
    This experiment shows taking a "block" out of a "toolbox" and into a "workspace"
    you can then drag the new block inside the workspace.

    The main point is that the toolbox and the workspace are not really related.
    This means you can separate the toolbox from the workspace!
*/

// Define global elements
var rootEl = document.getElementById("root");
var toolboxEl = document.getElementById("toolbox");
var workspaceEl = document.getElementById("workspace");

var blocks = [];
var dragging = false;
var blockUnderMouse;

// List of test blocks


// Create a workspace
var workspace = new Workspace(workspaceEl, [[new StandardBlock, new StandardBlock, new StandardBlock], [new StandardBlock, new StandardBlock]]);

// Create a copy of the standard block, and add it to our toolbox div.
var toolBox = new Toolbox(toolboxEl, new StandardBlock);

toolBox.block.element.on('dragFromToolbox-finished', (ev) => {

    // extract variables passed to the event
    var e = ev.detail.e;
    var block = ev.detail.newBlock;
    var grabPoint = ev.detail.grabPoint;

    // move the block in the workspace
    workspace.addBlock(block, {x: e.screenX, y: e.screenY}, grabPoint);

    console.log(blocks);

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


function Workspace(parentElement, blocks) {
    this.svg = SVG(parentElement);
    this.blockTree = blocks ? blocks.map((a) => arrayToLinkedList(a)) : [];
    this.spacingStandard = 2;


    function arrayToLinkedList (array) {
        var top = {top : true, array, length : array.length};
        var previous = top;
        array.map((element) => {
            previous.next = element;
            element.previous = previous;
            previous = element;
        });

        return top;
    }

    this.addBlock = (block, screenPoint) => {
        // Add block to list
        


        this.redraw();
    }

    this.copyBlock = (block) => {
        
    }

     this.redraw = () => {
        this.clearBlocks();
        var height = 0;
        this.blockTree.map((list) => {
            var group = this.svg.group();
            group.x = list.x || 0;
            group.y = list.y || 0;
            list.group = group;
            while(list.next){
                list = list.next;
                var e = list.draw(group).move(0,height);
                height += e.height() + this.spacingStandard;
            }
        });
    }

    this.clearBlocks = () => {
        this.svg.clear();
    }

    this.redraw();
};

function StandardBlock() {
    this.classname = 'standardBlock';

    this.draw = (svg) => {
        this.element = svg.rect(100, 25).addClass(this.classname);
        return this.element;
    }

    this.copy = () => {
        return new StandardBlock();
    }
}


function Toolbox(div, block) {
    this.svg = SVG(div);
    this.block = block;
    this.block.draw(this.svg);

    enableDragFromToolbox(this.block);

    // Enables an element out of a toolbox 
    //    Creates a copy of the element which is dragged around the screen.
    //    createNew is the function that must be called to create the svg element.
    //          type: func(svgInstance)
    function enableDragFromToolbox(block) {
        var element = block.element;

        var newDiv, newSVG, newElement, newBlock;

        var captureDrag = (e) => {
            var newPoint = relativePoint(e, newElement);
            var delx = newPoint.x - grabPoint.x;
            var dely = newPoint.y - grabPoint.y;

            var rect = newDiv.getBoundingClientRect();

            newDiv.setAttribute('style', 'top:' + (rect.top + dely) + 'px;' + 'left:' + (rect.left + delx) + 'px;');
            element.fire('dragFromToolbox-moved', { e, element, grabPoint, newPoint });

        }

        var startDrag = (e) => {

            // check for left button
            if ((e.type == 'click' || e.type == 'mousedown' || e.type == 'mousemove')
                && ((e.which || e.buttons) != 1)) {
                return;
            }

            // Prevent default behaviour
            e.preventDefault();
            e.stopPropagation();

            grabPoint = relativePoint(e, block.element);

            // Create new Div with SVG and recreate the block.
            newDiv = document.createElement('div');
            newDiv.setAttribute('class', 'divDraggable elementBeingDragged');
            newSVG = SVG(newDiv).size(element.width(), element.height());
            newBlock = block.copy();
            newElement = newBlock.draw(newSVG);

            document.body.appendChild(newDiv);
            element.fire('dragFromToolbox-started', {});


            //add drag and end events to window
            SVG.on(window, 'mousemove.dragFromToolbox', captureDrag);
            SVG.on(window, 'touchmove.dragFromToolbox', captureDrag);
            SVG.on(window, 'mouseup.dragFromToolbox', endDrag);
            SVG.on(window, 'touchend.dragFromToolbox', endDrag);

            captureDrag(e);
        }

        var endDrag = (e) => {
            captureDrag(e);

            // unbind events
            SVG.off(window, 'mousemove.dragFromToolbox')
            SVG.off(window, 'touchmove.dragFromToolbox')
            SVG.off(window, 'mouseup.dragFromToolbox')
            SVG.off(window, 'touchend.dragFromToolbox')


            document.body.removeChild(newDiv);

            element.fire('dragFromToolbox-finished', { e, newBlock, grabPoint });
        }

        
        element.on('mousedown.drag', startDrag);
        element.on('touchstart.drag', startDrag);

        return block;
    }
}



