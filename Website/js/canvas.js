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

function setInitialSettings(mouse_active, mouseData, mode, visorState,MAX_ZOOM, MIN_ZOOM, currentStyle){
    mouse_active = false;
    // Mode in which to use the mouse e.g scroll or paint
    mode = modes.PAINT;

    mouseData = {xTo: 0, xFrom: 0, yTo: 0 , yFrom: 0};

    // Change this object through the web interface
    visorState = {zoom : 1, zoomStep: 0.1, offsetX: 0, offsetY: 0};

    // Set zoom limits
    MAX_ZOOM = visorState.zoom + 5 * visorState.zoomStep;
    MIN_ZOOM = -visorState.zoom + 3 * visorState.zoomStep;

    // Here we specify the color, the thickness etc.
    currentStyle = {color : "black", thickness : 2};

    return [mouse_active, mouseData, mode, visorState, MAX_ZOOM, MIN_ZOOM, currentStyle];
}

// This is the main function, will be called when the browser loads the page
var main = function () {
    // Declare it here, initialize once we have the session id from the server
    var conn;
    var sessionId;

    // Get the elements from the DOM
    var visor = document.getElementById('visor');
    var background_canvas = document.getElementById('background_canvas');
    var drawable_canvas = document.getElementById('drawable_canvas');
    var switch_button = document.getElementById('switch');
    let color_picker = document.getElementById("color_picker");
    let upload_image = document.getElementById("upload_image");
    let line_weight = document.getElementById("line_weight");

    // This settings here have to be done because canvas CSS width and height do not get propagated
    // to the actual context, it's two different values
    visor.width = parseInt(window.getComputedStyle(visor).width);
    visor.height = parseInt(window.getComputedStyle(visor).height);
    background_canvas.width = parseInt(window.getComputedStyle(background_canvas).width);
    background_canvas.height = parseInt(window.getComputedStyle(background_canvas).height);
    drawable_canvas.width = parseInt(window.getComputedStyle(drawable_canvas).width);
    drawable_canvas.height = parseInt(window.getComputedStyle(drawable_canvas).height);

    var drawable_canvas_ctx = drawable_canvas.getContext('2d');
    var backgroud_canvas_ctx = background_canvas.getContext('2d');
    var visor_ctx = visor.getContext('2d');

    // Cached images of the background and drawable canvas
    var cached_background;
    var cached_drawable;

    var background_cache_invalid;
    var drawable_cache_invalid;

    var mouse_active, mouse_data, mode, visor_state, current_style;
    let scale_type = null, zoomPointX = null, zoomPointY = null, MAX_ZOOM = null, MIN_ZOOM = null;

    // This will trigger the connection to the Broker websocket as well
    // This is required to make the browser wait before connection to the websocket until it has the session id
    getSessionId();

    [mouse_active, mouse_data, mode, visor_state, MAX_ZOOM, MIN_ZOOM, current_style] =
        setInitialSettings(mouse_active,mouse_data,mode, visor_state, MAX_ZOOM, MIN_ZOOM, current_style);

    let showPage = function() {
        document.getElementById("loader").style.display = "none";
        document.getElementById("after-load").style.display = "block";
    };
	 // This function connects to the backend via WebSockets for synchronization
	function establishConnection(url, session_id) {
	    let width = drawable_canvas.width;
	    let height = drawable_canvas.height;
		var connection = new WebSocket(BACKEND_URL + '?sessionId=' + session_id + '&width=' + width +'&height=' + height);
		connection.onopen = function (ev) { showPage() };
		connection.onmessage = function (ev) {
            handleUpdate(ev.data);
        };
		connection.onclose = function (ev) {
		    alert("connection lost but I will show the page anyway for offline mode");
		    showPage();
		    console.log("connection lost");
		};

		return connection;
	}

	function setCanvasDimensions(width, height) {
        background_canvas.style.width = width+ 'px';
        background_canvas.style.height = height+ 'px';
        drawable_canvas.style.width = width+ 'px';
        drawable_canvas.style.height = height+ 'px';

        background_canvas.width = width;
        background_canvas.height = height;
        drawable_canvas.width = width;
        drawable_canvas.height = height;

        drawable_canvas_ctx = drawable_canvas.getContext('2d');
        backgroud_canvas_ctx = background_canvas.getContext('2d');
        visor_ctx = visor.getContext('2d');


}
	// This function will make an AJAX call to the server to get the session id
	function getSessionId() {
        let sessionRequest = new XMLHttpRequest();
        sessionRequest.onreadystatechange = function (ev) {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    console.log("got session id: " + this.responseText);
                    sessionId = this.responseText;
                }
                else {
                    // Running locally or got an error
                    sessionId = 1;
                }
                conn = establishConnection(BACKEND_URL, sessionId);

            }
        };
        sessionRequest.open("GET", "/session", true);
        sessionRequest.send();
	}

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

    line_weight.onchange = function(){
        current_style.thickness = line_weight.value;
    };

    //Creating a transfer canvas to place the zoomed image in it then redraw it on the visor canvas
    let transfer_canvas = document.createElement('canvas');
    transfer_canvas.width = visor.width;
    transfer_canvas.height = visor.height;
    let transfer_canvas_ctx = transfer_canvas.getContext('2d');

    upload_image.onchange = function(event) {
        transfer_canvas_ctx.clearRect(0, 0, transfer_canvas.width, transfer_canvas.height);
        if (transfer_canvas.toDataURL() !== drawable_canvas.toDataURL()) {
            alert("You can only upload an image background before drawing!");
        }
        else {
            let image_file = event.target.files[0];
            let image_type = /image.*/;

            if (image_file.type.match(image_type)) {
                let reader = new FileReader();
                reader.onload = function (e) {
                    let image_object = new Image();
                    image_object.onload = function () {
                        // FIXME need to use background canvas but it creates a "glitchy" effect
                        setCanvasDimensions(image_object.width, image_object.height);
                        drawable_canvas_ctx.drawImage(image_object, 0, 0, image_object.width, image_object.height);
                    };
                    image_object.src = e.target.result;
                };
                reader.readAsDataURL(image_file);
            }
        }

    };


    function updateVisorContent(context){

        let image = context.getImageData(visor_state.offsetX, visor_state.offsetY, visor.width / visor_state.zoom, visor.height/visor_state.zoom );
        let image2 = new Image(visor.width, visor.height);

        // We could make those very big (visor.widht / visor_state.MIN_ZOOM) from the start
        // so we don't have to adjust on the fly (maybe this is a performance issue)
        transfer_canvas.width = visor.width / visor_state.zoom;
        transfer_canvas.height = visor.height / visor_state.zoom;

        transfer_canvas_ctx.putImageData(image, 0, 0);
        image2.onload=function(){
            // No longer needed since we adjust the width and height of the transfer canvas
            //transfer_canvas_ctx.clearRect(0, 0, transfer_canvas.width, transfer_canvas.height);
            visor_ctx.save();
            visor_ctx.clearRect(0,0,visor.width,visor.height);
            visor_ctx.scale(visor_state.zoom,visor_state.zoom);
            visor_ctx.drawImage(image2,0,0);
            visor_ctx.restore();
        };
        image2.src = transfer_canvas.toDataURL();
    }
    function renderVisor() {
        // In case the user scrolled, we zoom in the area where his mouse points
        if(scale_type != null) {
            let old_zoom = visor_state.zoom;
            if( scale_type === zoom_type.IN)
                visor_state.zoom += visor_state.zoomStep;
            if( scale_type === zoom_type.OUT)
                visor_state.zoom -= visor_state.zoomStep;
            if(visor_state.zoom > MAX_ZOOM)
                visor_state.zoom = MAX_ZOOM;
            if(visor_state.zoom < MIN_ZOOM)
                visor_state.zoom = MIN_ZOOM;
            visor_state.offsetX -= zoomPointX/visor_state.zoom - zoomPointX/old_zoom;
            visor_state.offsetY -= zoomPointY/visor_state.zoom - zoomPointY/old_zoom;
            scale_type = null;
        }
        updateVisorContent(drawable_canvas_ctx);
    }

    // Render the visor at 30 fps
    setInterval(function() {renderVisor()}, 1000/30);


    function computeActualMousePosition(event) {
        // TODO Maybe we could make this static?
        var [canvasPositionX, canvasPositionY] = computePosition(visor);
        return [event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft -canvasPositionX,
            event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvasPositionY];
    }

    // Function to be called whenever we need to update the cached part of the background
    // e.g : when anything in visor_state changes and when we draw on the background canvas
    function updateBackgroundCache() {

    }

    // Function to be called whenever we need to update the cahced part of the drawable canvas
    // e.g : when anything in visort_state changes, and when we draw on the drawableCanvas
    function updateDrawableCache() {

    }
};