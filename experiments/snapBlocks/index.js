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




class Box {
    constructor(x1, y1, x2, y2) {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
    }

    combine(b2) {
        return Box.combine(this, b2);
    }

    overlaps(b2) {
        return Box.overlaps(this, b2);
    }

    translate(x, y) {
        return new Box(
            this.x1 + x,
            this.y1 + y,
            this.x2 + x,
            this.y2 + y
        );
    }

    transformWithElement(e) {
        var a = e.point(this.x1, this.y1);
        var b = e.point(this.x2, this.y2);

        return new Box(a.x, a.y, b.x, b.y);
    }

}

Box.combine = function (b1, b2) {
    return new Box(
        Math.min(b1.x1, b2.x1),
        Math.min(b1.y1, b2.y1),
        Math.max(b1.x2, b2.x2),
        Math.max(b1.y2, b2.y2)
    );
}

Box.overlaps = function (a, b) {
    function lineOverlap(a, b) {
        function fix(a) { if (a.b > a.a) return {} }
        return !((a.b < b.a) || (a.a > b.b));
    }

    return lineOverlap({ a: a.x1, b: a.x2 }, { a: b.x1, b: b.x2 })
        && lineOverlap({ a: a.y1, b: a.y2 }, { a: b.y1, b: b.y2 });
}



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

    
    var offset = {x: e.clientX - grabPoint.x, y: e.clientY - grabPoint.y}

    // move the block in the workspace
    workspace.addBlock(block, offset);


});

var selected;

toolBox.block.element.on('dragFromToolbox-moved', (ev) => {
    // extract variables passed to the event
    var e = ev.detail.e;
    var block = ev.detail.newBlock;
    var grabPoint = ev.detail.grabPoint;

    var offset = {x: e.clientX - grabPoint.x, y: e.clientY - grabPoint.y}

    var r = workspace.findTouchingBlock(block, offset);



    if(r) {

        if(selected && (selected !== r.block)) {
            selected.highlightBottomConnector(false);
            selected.highlightTopConnector(false);
        }

        selected = r.block;
        if(r.position == 'top') {
            selected.highlightTopConnector(true);
            selected.highlightBottomConnector(false);
            block.highlightTopConnector(false);
            block.highlightBottomConnector(true);
        } else {
            selected.highlightBottomConnector(true);
            selected.highlightTopConnector(false);
            block.highlightTopConnector(true);
            block.highlightBottomConnector(false);
        }
    } else {
        if(selected)
        {
            selected.highlightBottomConnector(false);
            selected.highlightTopConnector(false);
            selected = null;
        }
        block.highlightTopConnector(false);
        block.highlightBottomConnector(false);
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
    this.spacingStandard = -5;


    function arrayToLinkedList(array) {
        var top = { array, length: array.length };
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

    this.findTouchingBlock = (block, offset) => {
        var match = null;
        var position;
        
        var box = block.connectorZone().translate(offset.x, offset.y);

        var boxTop = block.connectorZoneTop().translate(offset.x, offset.y); 
        var boxBottom = block.connectorZoneBottom().translate(offset.x, offset.y); 

        function matched(block, p) {
            // check which stack is on top.
            if (match) {
                if (match.top.group.position() > block.top.group.position())
                    return;
            }

            match = block;
            position = p;
        }

        this.blockTree.map((list) => {

            // Transform box to local coordinate system
            var b = box.transformWithElement(list.group);
            
            // Check if box overlaps with the possible hooks in the group
            if (!list.box.overlaps(b)) return;

            // Transform upper and lower boxes to the local coordinate system
            var bT = boxTop.transformWithElement(list.group);
            var bB = boxBottom.transformWithElement(list.group);

            // Move through linked list
            while (list.next) {
                list = list.next;


                // Bottom of local with top of new 
                if(list.connectorZoneBottom().overlaps(bT)){
                    matched(list, 'bottom');
                    break;
                } else if(list.connectorZoneTop().overlaps(bB)) {
                    matched(list, 'top');
                    break;
                }

            }

            return;
        });

        if(match)
            return { block: match, position: position };
        return null;

    }

    this.addBlock = (block, offset) => {
        // Add block to list

        var r = workspace.findTouchingBlock(block, offset);
        
        // Are we adding to an existing stack?
        if (r) {
            var t = r.block;
            // Existing Stack
            // If the insertion point is above the half way line of the block, insert above!
            if (r.position == 'top') t = t.previous;

            if(t.top === t) {
                t.y -= block.element.height() + this.spacingStandard;
            }

            // Insert the block in the linked list
            var n = t.next;
            t.next = block.copy();
            t.next.top = t.top;
            t.next.previous = t;
            t.next.next = n;
            if (n) n.previous = block;

        } else {
            // New Stack

            // Create a new top node.
            var g = { next: block.copy() };

            // Set stack position
            var p = this.svg.point(offset.x, offset.y);
            g.x = p.x;
            g.y = p.y;

            // Insert the new block into the stack linked list
            g.next.previous = g;
            g.next.top = g;
            g.top = g;

            // Add this stack to the block tree
            this.blockTree.push(g);
        }

        // Redraw all of the blocks so that the new block gets an svg element.
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
            group.move(list.x || 0, list.y || 0);

            console.log("  x" + list.x + " y" + list.y);
            console.log("  x" + group.x() + " y" + group.y());

            list.group = group;

            var box;

            while (list.next) {
                list = list.next;
                var e = list.draw(group).move(0, height);
                height += e.height() + this.spacingStandard;

                if (box) {
                    box = box.combine(list.connectorZone());
                }
                else {
                    box = (list.connectorZone());
                }
            }

            list.top.box = box;

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

        // Text
        var t = svg.text(this.text).move(10, 17);

        // Draw a rectangle bigger than the text
        svg.rect(t.length() > (100 - 20) ? t.length() + 20 : 100, 40).move(0, 8);

        // Make the svg the same size as the box;
        svg.size(svg.rbox().width, svg.rbox().height + 8);

        // draw clips
        this.tC = svg.rect(10, 8).move(10, 0).back().addClass('connectorTop');
        this.bC = svg.rect(14, 8).move(8, 40).addClass('connectorBottom');

        // move text to front
        t.front();

        return svg;
    }

    this.highlight = (enable) => {
        if (enable) {
            this.element.addClass('highlighted');
        }
        else {
            this.element.removeClass('highlighted');
        }
    }


    this.highlightTopConnector = (enable) => {
        if (enable) {
            this.tC.addClass('highlighted');
        }
        else {
            this.tC.removeClass('highlighted');
        }
    }

    this.highlightBottomConnector = (enable) => {
        if (enable) {
            this.bC.addClass('highlighted');
        }
        else {
            this.bC.removeClass('highlighted');
        }
    }


    this.connectorZone = () => {
        return this.connectorZoneTop().combine(this.connectorZoneBottom());
    }

    this.connectorZoneTop = () => {
        return new Box(
            this.element.x() - 10,
            this.element.y() - 10,
            this.element.x() + 70,
            this.element.y() + (this.element.height() / 2)
        );
    }

    this.connectorZoneBottom = () => {
        return new Box(
            this.element.x() - 10,
            this.element.y() + (this.element.height() / 2),
            this.element.x() + 70,
            this.element.y() + this.element.height() + 10
        );
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
            element.fire('dragFromToolbox-moved', { e, newBlock, grabPoint, newPoint });

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
            newDiv.setAttribute('height', element.height());
            newDiv.setAttribute('width', element.width());
            newSVG = SVG(newDiv);
            newBlock = block.copy();

            newElement = newBlock.draw(newSVG);

            // IMPORTANT set the new Element size to match the old one, for some reason it doesnt scale correctly...
            // todo: find out why this doesnt scale automatically...
            newElement.size(element.width(), element.height());

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



