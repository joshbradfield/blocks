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
var workspace = new Workspace(workspaceEl, [[new StandardBlock(), new StandardBlock("2"), new StandardBlock("3")]]);


// Create a copy of the standard block, and add it to our toolbox div.
var toolBox = new Toolbox(toolboxEl, new StandardBlock("toolBox"));

toolBox.block.element.on('dragFromToolbox-finished', (ev) => {

    // extract variables passed to the event
    var e = ev.detail.e;
    var block = ev.detail.newBlock;
    var grabPoint = ev.detail.grabPoint;

    // move the block in the workspace
    workspace.addBlock(block, {x: e.clientX, y: e.clientY}, grabPoint);


});

toolBox.block.element.on('dragFromToolbox-moved', (ev) => {
    var e = ev.detail.e;

    var b = workspace.findTouchingBlock(e.clientX, e.clientY);

    if(b) {
        b.element.addClass('highlighted');

        setTimeout(() => {
            b.element.removeClass('highlighted');
        }, 1000);
    }


});



// Code in the background


// Takes a mouse event and an svg element and returns the position of the mouse relative to the element
//   e type: mouse event object (uses clientX, clientY )
//   element type: svg element
function relativePoint(e, element) {
    return element.point(e.clientX, e.clientY);
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
        var top = {array, length : array.length};
        var previous = top;
        top.top = top;
        array.map((element) => {
            element.top = top;
            previous.next = element;
            element.previous = previous;
            previous = element;
        });

        return top;
    }

    this.findTouchingBlock = (x,y) => {
        var match = null;

        function matched(block) {
            // check which stack is on top.
            if(match) {
                if(match.top.group.position() > block.top.group.position())
                    return;
            }

            match = block;
        }

        //like map but with escape? 
        this.blockTree.map((list) => {
            var p = list.group.point(x,y);

            //If not inside group, skip
            if(!list.group.inside(p.x, p.y)) {
                return;
            }

            while(list.next) {
                list = list.next;
                // if touching :
                p = list.element.point(x,y);
                if(list.element.inside(p.x, p.y)) {
                    // touching
                    matched(list);
                    break;
                } else if(p.y < 0) {
                    // In the middle
                    if(p.x <= list.element.x()) matched(list);
                    break;
                }
            }
        });
        return match;
    }

    this.addBlock = (block, screenPoint, grabPoint) => {
        // Add block to list
        
        var t = this.findTouchingBlock(screenPoint.x, screenPoint.y);
        console.log(t);
        if(t) {

            // Determine if we add above or below.
            var p = t.element.point(screenPoint.x, screenPoint.y);
            if(p.y < t.element.height()/2) t = t.previous;
            var n = t.next;
            t.next = block.copy();
            t.next.top = t.top;
            t.next.previous = t;
            t.next.next = n;
            if(n) n.previous = block;
        } else {
            var g = {next: block.copy()};
            g.next.previous = g;
            g.next.top = g;
            g.top = g;

            var p = this.svg.point(screenPoint.x, screenPoint.y);
            console.log(p);
            console.log(grabPoint);

            g.x = p.x - grabPoint.x;
            g.y = p.y - grabPoint.y;

            console.log(g);

            this.blockTree.push(g);
        }

        this.redraw();
    }

    this.copyBlock = (block) => {
        
    }

     this.redraw = () => {
        this.clearBlocks();
        this.blockTree.map((list) => {
            var height = 0;
            var group = this.svg.nested();
            console.log("Drawing Group");
            group.move(list.x || 0,list.y || 0);
            
            console.log("  x" + list.x + " y" + list.y);
            console.log("  x" + group.x() + " y" + group.y());

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


function StandardBlock(text) {
    this.classname = 'standardBlock';
    this.text = text || "Standard Block";

    this.draw = (svg) => {
        svg = svg.nested();
        this.element = svg; 

        svg.addClass(this.classname);
        var t = svg.text(this.text).move(4, 3);
        svg.rect(t.length() > (100-8)? t.length() + 8 : 100, 25).back();

        svg.size(svg.rbox().width,svg.rbox().height);

        return svg;
    }

    this.copy = () => {
        return new StandardBlock(this.text);
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



