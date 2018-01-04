// The url to connect to the backend for synchronization
const BACKEND_URL = 'ws://localhost:5000/';

var modes = {
	PAINT : 1,
	SCROLL : 2
};

// Returns the position of an element in the page
function computePosition(element) {
    if(typeof( element.offsetParent ) !== "undefined")
    {
        for(var posX = 0, posY = 0; element; element = element.offsetParent)
        {
            posX += element.offsetLeft;
            posY += element.offsetTop;
        }
        return [ posX, posY ];
    }
    else
    {
        return [ element.x, element.y ];
    }
}
// This is the main function, will be called when the browser loads the page
var main = function () {

	// This function connects to the backend via WebSockets for synchronization
	var establishConnection = function (url, session_id) {
		var connection = new WebSocket(BACKEND_URL + '?sessionID=' + session_id);
		connection.onopen = function (ev) { console.log("Connection open") };

		return connection;
	};
	// This function will make an AJAX call to the server to get the session id
	var getSessionId = function() {
		return 1;
	};

	var session_id = getSessionId();
	// var conn = establishConnection(BACKEND_URL, session_id);

	// Get the elements from the DOM
	var visor = document.getElementById('visor');
	var background_canvas = document.getElementById('background_canvas');
	var drawable_canvas = document.getElementById('drawable_canvas');
	var switch_button = document.getElementById('switch');

	// This settings here have to be done because canvas CSS width and height do not get propagated
    // to the actual context, it's two different values
    console.log(window.getComputedStyle(visor).width);
	visor.width = parseInt(window.getComputedStyle(visor).width);
	visor.height = parseInt(window.getComputedStyle(visor).height);
    background_canvas.width = parseInt(window.getComputedStyle(background_canvas).width);
    background_canvas.height = parseInt(window.getComputedStyle(background_canvas).height);
    drawable_canvas.width = parseInt(window.getComputedStyle(drawable_canvas).width);
    drawable_canvas.height = parseInt(window.getComputedStyle(drawable_canvas).height);


	var drawable_canvas_ctx = drawable_canvas.getContext('2d');
	var backgroud_canvas_ctx = background_canvas.getContext('2d');
	var visor_ctx = visor.getContext('2d');

	var mouse_active = false;
	// Mode in which to use the mouse e.g scroll or paint
	var mode = modes.PAINT;

    // Switch between modes
    switch_button.onclick = function (ev) {
        mode = modes.PAINT + modes.SCROLL - mode;
        console.log("mode is " + mode)};

	var mouseData = {};

    // Change this object through the web interface
    var visorState = {zoom : 1, offsetX: 0, offsetY: 0};

    // Here we specify the color, the thickness etc.
    var currentStyle = {color : "black", thickness : 2};


    // Transforms mouse coordinates into actual canvas coordinates using the current
    // visor state (e.g. zoom, offsets etc)
    function transformCoordinates(visorState, coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        // FIXME not sure if the formula is correct
        x = x / visorState.zoom;
        y = y / visorState.zoom;
        return [x + visorState.offsetX, y + visorState.offsetY];
    }

    function draw(context, points, style) {
        console.log("drawing points" + JSON.stringify(points));
        context.beginPath();
        context.moveTo(points.xFrom, points.yFrom);
        context.lineTo(points.xTo, points.yTo);

        context.strokeStyle = style.color;
        context.lineWidth = style.thickness;

        context.stroke();
        context.closePath();
    }

    var handleNewMouseCoords = function(event) {
        [mouseData.xTo, mouseData.yTo] = computeActualMousePosition(event);
        if (mode === modes.PAINT) {
            // Now we have in the mouseData object the data about mouse movement
            // Send drawings to the main canvas
            var transformedData = {};
            [transformedData.xFrom, transformedData.yFrom] = transformCoordinates(visorState,
                                                                [mouseData.xFrom, mouseData.yFrom]);
            [transformedData.xTo, transformedData.yTo] = transformCoordinates(visorState, [mouseData.xTo, mouseData.yTo]);

            // Now we have transformed data at hand
            // Very important : draw on the drawable canvas, not the visor
            draw(drawable_canvas_ctx, transformedData, currentStyle);

        //    TODO send data over the socket (style + transformedData)
        }
        else {
            var scrollX = mouseData.xTo - mouseData.xFrom;
            var scrollY = mouseData.yTo - mouseData.yFrom;

            // FIXME maybe we should adjust this
            visorState.offsetX += scrollX;
            visorState.offsetY += scrollY;

            // TODO handle scrolling
        }

        mouseData.xFrom = mouseData.xTo;
        mouseData.yFrom = mouseData.yTo;
	};

	visor.onmousedown = function(event) {
		// Handle mouse down
		mouse_active = true;
		[mouseData.xFrom, mouseData.yFrom] = computeActualMousePosition(event);
	};

	visor.onmousemove = function(event) {
	    if (mouse_active)
		    handleNewMouseCoords(event);
	};
	visor.onmouseup = function(event) {
        if (mouse_active)
		    handleNewMouseCoords(event);
		mouse_active = false;
	};


	visor.onmouseout = function(event) {
		// Disable the mouse event
		mouse_active = false;
	};

    function renderVisor() {
        // FIXME this function needs rewriting to take into account zoom when calling getImageData, as well as merge
        // FIXME background with the drawable canvas before getting the image data
        var image = drawable_canvas_ctx.getImageData(visorState.offsetX, visorState.offsetY, visor.width, visor.height);
        visor_ctx.putImageData(image, 0, 0)
    }

    // Render the visor at 30 fps
    setInterval(function() {renderVisor()}, 1000/30);



	// // Ignore this function as is it used just for testing
	// visor.onclick = function(event) {
	//     console.log(document.body.scrollLeft);
     //    console.log(document.documentElement.scrollLeft);
     //    console.log(document.body.scrollTop.toString());
     //    console.log(document.documentElement.scrollTop.toString());
	// 	alert("canvas clicked at " + (event.clientX +
     //        document.body.scrollLeft +
     //        document.documentElement.scrollLeft) +
     //        " " + (event.clientY +
     //        document.body.scrollTop + document.documentElement.scrollTop));
	// };

    function computeActualMousePosition(event) {
        // TODO Maybe we could make this static?
        var [canvasPositionX, canvasPositionY] = computePosition(visor);
        return [event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft -canvasPositionX,
            event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvasPositionY];
    }
};




