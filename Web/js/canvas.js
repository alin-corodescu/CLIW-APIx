// Variables required throughout the file

// The url to connect to the backend for synchronization
const BACKEND_URL = 'ws://localhost:5001/';

var modes = {
	PAINT : 1,
	SCROLL : 2
};

var zoom_type = {
    IN: 1,
    OUT: 2
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

function setInitialSettings(mouse_active, mouseData, mode, visorState, currentStyle){
    mouse_active = false;
    // Mode in which to use the mouse e.g scroll or paint
    mode = modes.PAINT;

    mouseData = {xTo: 0, xFrom: 0, yTo: 0 , yFrom: 0};

    // Change this object through the web interface
    visorState = {zoom : 1, zoomStep: 0.1, offsetX: 0, offsetY: 0};

    // Here we specify the color, the thickness etc.
    currentStyle = {color : "black", thickness : 2};

    return [mouse_active, mouseData, mode, visorState, currentStyle];
}

// This is the main function, will be called when the browser loads the page
var main = function () {
    let showPage = function() {
        document.getElementById("loader").style.display = "none";
        document.getElementById("after-load").style.display = "block";
    };
    setTimeout(showPage, 3000);
	 // This function connects to the backend via WebSockets for synchronization
	var establishConnection = function (url, session_id) {
		var connection = new WebSocket(BACKEND_URL + '?sessionID=' + session_id + '&width=600&height=600');
		connection.onopen = function (ev) { console.log("Connection open") };
		connection.onmessage = function (ev) {
            handleUpdate(ev.data);
        };
		connection.onclose = function (ev) { alert("connection lost"); };

		return connection;
	};
	// This function will make an AJAX call to the server to get the session id
	var getSessionId = function() {
		return 1;
	};

	var session_id = getSessionId();
	var conn = establishConnection(BACKEND_URL, session_id);

	// Get the elements from the DOM
	var visor = document.getElementById('visor');
	var background_canvas = document.getElementById('background_canvas');
	var drawable_canvas = document.getElementById('drawable_canvas');
	var switch_button = document.getElementById('switch');
    let color_picker = document.getElementById("colorPicker");
    let lineWeight = document.getElementById("lineWeight");

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

	var mouse_active, mouse_data, mode, visor_state, current_style;
    let scale_type = null, zoomPointX = null, zoomPointY = null;

    [mouse_active, mouse_data, mode, visor_state, current_style] = setInitialSettings();

    function handleUpdate(data) {
        let update = JSON.parse(data);
        if (update.hasOwnProperty('drawable_canvas')) {
        //    means we have an initial update
            let drawable_image = new Image();
            drawable_image.onload = function (ev) {
                drawable_canvas_ctx.drawImage(drawable_image,0,0);
            };
            drawable_image.src = update.drawable_canvas;

            let background_image = new Image();
            background_image.onload = function (ev) {
                backgroud_canvas_ctx.drawImage(background_image,0,0);
            };
            background_image.src = update.background_canvas;
        }
    else {
    //    means we have to update
        var style = {color : update.color, thickness: update.thickness};
        draw(drawable_canvas_ctx, update, style);
        }
    }

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
        [mouse_data.xTo, mouse_data.yTo] = computeActualMousePosition(event);
        if (mode === modes.PAINT) {
            // Now we have in the mouseData object the data about mouse movement
            // Send drawings to the main canvas
            var transformedData = {};
            [transformedData.xFrom, transformedData.yFrom] = transformCoordinates(visor_state,
                [mouse_data.xFrom, mouse_data.yFrom]);
            [transformedData.xTo, transformedData.yTo] = transformCoordinates(visor_state, [mouse_data.xTo, mouse_data.yTo]);

            // Now we have transformed data at hand
            // Very important : draw on the drawable canvas, not the visor
            draw(drawable_canvas_ctx, transformedData, current_style);

            //    TODO send data over the socket (style + transformedData)
            let update = transformedData;
            update['thickness'] = current_style.thickness;
            update['color'] = current_style.color;

            conn.send(JSON.stringify(update));
        }
        else {
            var scrollX = mouse_data.xTo - mouse_data.xFrom;
            var scrollY = mouse_data.yTo - mouse_data.yFrom;

            // FIXME maybe we should adjust this
            visor_state.offsetX -= scrollX;
            visor_state.offsetY -= scrollY;

            // TODO handle scrolling
        }

        mouse_data.xFrom = mouse_data.xTo;
        mouse_data.yFrom = mouse_data.yTo;
	};

    //Adding event handlers

    // Switch between modes
    switch_button.onclick = function (ev) {
        mode = modes.PAINT + modes.SCROLL - mode;
    };

    visor.onmousedown = function(event) {
		mouse_active = true;
		[mouse_data.xFrom, mouse_data.yFrom] = computeActualMousePosition(event);
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

    color_picker.onchange = function(){
        current_style.color = color_picker.value;
    };

    //Creating a transfer canvas to palce the zoomed image in it then redraw it on the visor canvas
    let transfer_canvas = document.createElement('canvas');
    transfer_canvas.width = visor.width;
    transfer_canvas.height = visor.height;
    let transfer_canvas_ctx = transfer_canvas.getContext('2d');


    function renderVisor() {
        let image, image2 = new Image(visor.width, visor.height);
        // In case the user scrolled, we zoom in the area where his mouse points
        if(scale_type != null) {
            let old_zoom = visor_state.zoom;
            if( scale_type === zoom_type.IN)
                visor_state.zoom += visor_state.zoomStep;
            if( scale_type === zoom_type.OUT)
                visor_state.zoom -= visor_state.zoomStep;
            visor_state.offsetX -= zoomPointX/visor_state.zoom - zoomPointX/old_zoom;
            visor_state.offsetY -= zoomPointY/visor_state.zoom - zoomPointY/old_zoom;
            scale_type = null;
        }

        // Saving the image from the drawable canvas : getImageData -> dummy_canvas -> toDataURL -> drawImage
        image = drawable_canvas_ctx.getImageData(visor_state.offsetX, visor_state.offsetY, visor.width / visor_state.zoom, visor.height/visor_state.zoom );
        transfer_canvas_ctx.putImageData(image, 0, 0);

        image2.onload=function(){
            transfer_canvas_ctx.clearRect(0, 0, transfer_canvas.width, transfer_canvas.height);
            visor_ctx.save();
            visor_ctx.clearRect(0,0,visor.width,visor.height);
            visor_ctx.scale(visor_state.zoom,visor_state.zoom);
            visor_ctx.drawImage(image2,0,0);
            visor_ctx.restore();
        };
        image2.src = transfer_canvas.toDataURL();

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