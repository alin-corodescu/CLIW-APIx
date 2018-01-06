// The url to connect to the backend for synchronization
const BACKEND_URL = 'ws://localhost:5000/';

var modes = {
	PAINT : 1,
	SCROLL : 2
};

var zoom_type = {
    IN: 1,
    OUT: 2
};

var scale = 1.0, scaleStep = 0.25, scale_type = null, zoomPointX = null, zoomPointY = null;

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
    // console.log(window.getComputedStyle(visor).width);
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
        // console.log("mode is " + mode)
        };

	var mouseData = {xTo: 0, xFrom: 0, yTo: 0 , yFrom: 0};

    // Change this object through the web interface
    var visorState = {zoom : 1, zoomStep: 0.1, offsetX: 0, offsetY: 0};

    // Here we specify the color, the thickness etc.
    var currentStyle = {color : "black", thickness : 2};

    // Transforms mouse coordinates into actual canvas coordinates using the current
    // visor state (e.g. zoom, offsets etc)
    function transformCoordinates(visorState, coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        x = x / visorState.zoom;
        y = y / visorState.zoom;
        return [x + visorState.offsetX, y + visorState.offsetY];
    }

    function draw(context, points, style) {
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
            visorState.offsetX -= scrollX;
            visorState.offsetY -= scrollY;

            // TODO handle scrolling
        }

        mouseData.xFrom = mouseData.xTo;
        mouseData.yFrom = mouseData.yTo;
	};

	visor.onmousedown = function(event) {
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
		mouse_active = false;
	};

    visor.onmousewheel = function(event) {
        if (mode !== modes.PAINT) {
            event.preventDefault();
            if (event.deltaY < 0) {
                [zoomPointX, zoomPointY] = computeActualMousePosition(event);
                scale_type = zoom_type.IN;
            }
            if (event.deltaY > 0) {
                [zoomPointX, zoomPointY] = computeActualMousePosition(event);
                scale_type = zoom_type.OUT;
            }
        }
    };

    var dummy_canvas = document.createElement('canvas');
    dummy_canvas.style.border = "2px solid black";
    dummy_canvas.width = visor.width;
    dummy_canvas.height = visor.height;
    var dummy_canvas_ctx = dummy_canvas.getContext('2d');

    function renderVisor() {
        let image, image2 = new Image(visor.width, visor.height);
        // In case the user scrolled, we zoom in the area where his mouse points
        if(scale_type != null) {
            let old_zoom = visorState.zoom;
            if( scale_type === zoom_type.IN)
                visorState.zoom += visorState.zoomStep;
            if( scale_type === zoom_type.OUT)
                visorState.zoom -= visorState.zoomStep;
            visorState.offsetX -= zoomPointX/visorState.zoom - zoomPointX/old_zoom;
            visorState.offsetY -= zoomPointY/visorState.zoom - zoomPointY/old_zoom;
            scale_type = null;
        }

        // Saving the image from the drawable canvas : getImageData -> dummy_canvas -> toDataURL -> drawImage
        image = drawable_canvas_ctx.getImageData(visorState.offsetX, visorState.offsetY, visor.width / visorState.zoom, visor.height/visorState.zoom );
        dummy_canvas_ctx.putImageData(image, 0, 0);

        image2.onload=function(){
            dummy_canvas_ctx.clearRect(0, 0, dummy_canvas.width, dummy_canvas.height);
            visor_ctx.save();
            visor_ctx.clearRect(0,0,visor.width,visor.height);
            visor_ctx.scale(visorState.zoom,visorState.zoom);
            visor_ctx.drawImage(image2,0,0);
            visor_ctx.restore();
        };
        image2.src = dummy_canvas.toDataURL();

    }

    // Render the visor at 30 fps
    setInterval(function() {renderVisor()}, 1000/30);


    function computeActualMousePosition(event) {
        // TODO Maybe we could make this static?
        var [canvasPositionX, canvasPositionY] = computePosition(visor);
        return [event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft -canvasPositionX,
            event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvasPositionY];
    }
};




