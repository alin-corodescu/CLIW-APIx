const BACKEND_URL = "ws://ec2-18-194-162-230.eu-central-1.compute.amazonaws.com:5000/";
const SITE_URL ="http://apix.eu-central-1.elasticbeanstalk.com/";

var modes = {
    PAINT: 1,
    SCROLL: 2
};
// This is the main function, will be called when the browser loads the page
var main = function () {
    //BEGIN: Initializing all the data required in order to proceed further along
    //----------------------------------------------------------------------------------------------
    var conn;
    var sessionId;

    // Get the elements from the DOM
    var visor = document.getElementById('visor_canvas');
    var background_canvas = document.getElementById('background_canvas');
    var drawable_canvas = document.getElementById('drawable_canvas');
    var switch_button = document.getElementById('switch');
    let color_picker = document.getElementById("color_picker");
    let upload_image = document.getElementById("upload_image");
    let line_weight = document.getElementById("line_weight");
    let shareable_link = document.getElementById('shareable_link');
    let modal_initial_settings = document.getElementById('modal_initial_settings');
    let image_background_object = new Image();
    var usesImage = false;

    // This settings here have to be done because canvas CSS width and height do not get propagated
    // to the actual context, it's two different values

    visor.width = parseInt(window.getComputedStyle(visor).width);
    visor.height = parseInt(window.getComputedStyle(visor).height);
    background_canvas.width = parseInt(window.getComputedStyle(background_canvas).width);
    background_canvas.height = parseInt(window.getComputedStyle(background_canvas).height);
    drawable_canvas.width = parseInt(window.getComputedStyle(drawable_canvas).width);
    drawable_canvas.height = parseInt(window.getComputedStyle(drawable_canvas).height);

    var drawable_canvas_ctx = drawable_canvas.getContext('2d');
    var background_canvas_ctx = background_canvas.getContext('2d');
    var visor_ctx = visor.getContext('2d');

    // Cached images of the background and drawable canvas
    var cached_background;
    var cached_drawable;

    // Variables saying if the cache needs to be updated with the next frame
    var background_cache_invalid = true;
    var drawable_cache_invalid = true;

    var mouse_active, mouse_data, mode, visor_state, current_style;
    let zoomPointX = null, zoomPointY = null, MAX_ZOOM = null, MIN_ZOOM = null;

    // This will trigger the connection to the Broker websocket as well
    // This is required to make the browser wait before connection to the websocket until it has the session id
    getSessionId();

    function setInitialSettings(mouse_active, mouseData, mode, visorState, MAX_ZOOM, MIN_ZOOM, currentStyle) {
        mouse_active = false;
        // Mode in which to use the mouse e.g scroll or paint
        mode = modes.PAINT;

        mouseData = {xTo: 0, xFrom: 0, yTo: 0, yFrom: 0};

        // Change this object through the web interface
        visorState = {zoom: 1, zoomStep: 0.1, offsetX: 0, offsetY: 0};

        // Set zoom limits
        MAX_ZOOM = visorState.zoom + 7 * visorState.zoomStep;
        MIN_ZOOM = visorState.zoom - 7 * visorState.zoomStep;

        // Here we specify the color, the thickness etc.
        currentStyle = {color: "black", thickness: 2};

        return [mouse_active, mouseData, mode, visorState, MAX_ZOOM, MIN_ZOOM, currentStyle];
    }

    [mouse_active, mouse_data, mode, visor_state, MAX_ZOOM, MIN_ZOOM, current_style] =
        setInitialSettings(mouse_active, mouse_data, mode, visor_state, MAX_ZOOM, MIN_ZOOM, current_style);


    //BEGIN: Communication with backend
    //----------------------------------------------------------------------------------------------


    function initAndConnect(clientId){
        document.getElementById("loader").style.display = "none";
        modal_initial_settings.style.display ="block";
        let submit_button = document.getElementById('submit_dimensions');
        submit_button.onclick = function() {
            let width = document.getElementById('custom_width').value;
            let height = document.getElementById('custom_height').value;
            setupCanvases(width,height);
            console.log(usesImage);
            if (usesImage)
                drawImageOnBackground();
            modal_initial_settings.style.display ="none";
            conn = establishConnection(BACKEND_URL, clientId, sessionId);
        }
    }
    function showPage() {
        document.getElementById("after-load").style.display = "block";
    }
    function displayNetworkError(){
        document.getElementById('modal_connection').style.display = "block";
        setTimeout(function(){
            document.getElementById('modal_connection').style.display = "none"; }, 3000);
    }

    // This function connects to the backend via WebSockets for synchronization
    function establishConnection(url, clientId, session_id) {
        let width = drawable_canvas.width;
        let height = drawable_canvas.height;
        var connection = new WebSocket(BACKEND_URL + '?clientId=' + clientId + '&sessionId=' + session_id + '&width=' + width + '&height=' + height);
        connection.onopen = function () {
            sendBackgroundToServer();
            showPage()
        };
        connection.onmessage = function (ev) {
            handleUpdate(ev.data);
        };
        connection.onclose = function () {
            displayNetworkError();
            showPage();
        };
        //used to display error message in case the server has not yet respond
        //We wait 3 seconds before deciding that the server did not respond
        setTimeout(function(){
            if(connection.readyState === 0) {
                connection.close();
                displayNetworkError();
                showPage();
            }
        }, 20000);
        return connection;
    }

    // This function will make an AJAX call to the server to get the session id
    function getSessionId() {
        let sessionRequest = new XMLHttpRequest();
        let clientId = -1;
        sessionId = -1;
        sessionRequest.onreadystatechange = function (ev) {
            if (this.readyState === 4) {
                if (this.status === 200) {
                    console.log("got session id: " + this.responseText);
                    var identityData = JSON.parse(this.responseText);
                    sessionId = identityData.sessionId;
                    clientId = identityData.clientId;
                    initAndConnect(clientId);
                    // conn = establishConnection(BACKEND_URL, clientId, sessionId)

                }
                else {
                    // Running locally or got an error
                    initAndConnect(clientId, sessionId);
                    // conn = establishConnection(BACKEND_URL, clientId, sessionId);
                }

            }
        };
        sessionRequest.open("GET", "/session", true);
        sessionRequest.send();
    }


    function handleUpdate(data) {
        var androidX = 100;
        var androidY = 100;
        var meterToPixel = 1000;
        let update = JSON.parse(data);

        function computeNewAndroidCoordinates(points, dx, dy) {
            points.xTo = points.xFrom + dx * meterToPixel;
            points.yTo = points.yFrom + dy * meterToPixel;
        }

        if (update.hasOwnProperty('drawable_canvas')) {
            // means we have an initial update
            let drawable_image = new Image();
            drawable_image.onload = function (ev) {
                drawable_canvas_ctx.drawImage(drawable_image, 0, 0);
                drawable_cache_invalid = true;
            };
            drawable_image.src = update.drawable_canvas;

            let background_image = new Image();
            background_image.onload = function (ev) {
                background_canvas_ctx.drawImage(background_image, 0, 0);
                background_cache_invalid = true;
            };
            background_image.src = update.background_canvas;
        }
        else {
            if (update.hasOwnProperty('android')) {
                if (update.hasOwnProperty('style')) {
                    // Update the style
                    current_style.color = update.color;
                    current_style.thickness = update.thickness;
                    return;
                }
                console.log("moving in meters:", JSON.stringify(update));
                var points = {xFrom: androidX, yFrom: androidY};
                computeNewAndroidCoordinates(points, update.dx, update.dy);
                // Clamp the coordinates to the visor
                if (points.xTo > visor.width)
                    points.xTo = visor.width;
                if (points.yTo > visor.height)
                    points.yTo = visor.height;

                androidX = points.xTo;
                androidY = points.yTo;

                // Transform the coordinates
                [points.xFrom, points.yFrom] = transformCoordinates(visor_state, [points.xFrom, points.yFrom]);
                [points.xTo, points.yTo] = transformCoordinates(visor_state, [points.xTo, points.yTo]);
                console.log("drawing between points: ", JSON.stringify(points));
                draw(drawable_canvas_ctx, points, current_style);

                let update = points;
                update['thickness'] = current_style.thickness;
                update['color'] = current_style.color;

                conn.send(JSON.stringify(update));

                drawable_cache_invalid = true;
            }
            else {
                var style = {color: update.color, thickness: update.thickness};
                draw(drawable_canvas_ctx, update, style);
                drawable_cache_invalid = true;
            }
        }
    }

    function sendBackgroundToServer(){
         let background_data =
        {   "target" : "background",
            "dataUrl" : background_canvas.toDataURL()
        };
        conn.send(JSON.stringify(background_data));
    }


    //BEGIN: Helper functions
    //----------------------------------------------------------------------------------------------

    // Transforms mouse coordinates into actual canvas coordinates using the current
    // visor state (e.g. zoom, offsets etc)
    function transformCoordinates(visorState, coordinates) {
        var x = coordinates[0];
        var y = coordinates[1];
        x = x / visorState.zoom;
        y = y / visorState.zoom;
        return [x + visorState.offsetX, y + visorState.offsetY];
    }

    // Returns the position of an element in the page
    function computePosition(element) {
        if (typeof(element.offsetParent) !== "undefined") {
            for (var posX = 0, posY = 0; element; element = element.offsetParent) {
                posX += element.offsetLeft;
                posY += element.offsetTop;
            }
            return [posX, posY];
        }
        else {
            return [element.x, element.y];
        }
    }

    function computeActualMousePosition(event) {
        // TODO Maybe we could make this static?
        var [canvasPositionX, canvasPositionY] = computePosition(visor);
        return [event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - canvasPositionX,
            event.clientY + document.body.scrollTop + document.documentElement.scrollTop - canvasPositionY];
    }

    // BEGIN: Handling mouse events
    //----------------------------------------------------------------------------------------------
    function draw(context, points, style) {

        context.beginPath();
        context.moveTo(points.xFrom, points.yFrom);
        context.lineTo(points.xTo, points.yTo);
        context.strokeStyle = style.color;
        context.lineWidth = style.thickness;
        context.stroke();
        context.closePath();
    }

    function drawBegun(event){
        mouse_active = true;
        [mouse_data.xFrom, mouse_data.yFrom] = computeActualMousePosition(event);
    }
    function drawProgress(event){
        if (mouse_active)
            handleNewMouseCoords(event);
    }
    function drawFinished(){
        mouse_active = false;
    }


    var handleNewMouseCoords = function (event) {
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

            let update = transformedData;
            update['thickness'] = current_style.thickness;
            update['color'] = current_style.color;

            conn.send(JSON.stringify(update));

            // Invalidate just the drawable cache
            drawable_cache_invalid = true;
        }
        else {
            var scrollX = mouse_data.xTo - mouse_data.xFrom;
            var scrollY = mouse_data.yTo - mouse_data.yFrom;

            visor_state.offsetX -= scrollX;
            visor_state.offsetY -= scrollY;

            //Invalidate both caches
            drawable_cache_invalid = true;
            background_cache_invalid = true;
        }

        mouse_data.xFrom = mouse_data.xTo;
        mouse_data.yFrom = mouse_data.yTo;
    };


    // Desktop version
    visor.addEventListener('mousedown',drawBegun);
    visor.addEventListener('mousemove',drawProgress);
    visor.addEventListener('mouseup',drawFinished);
    visor.addEventListener('mouseout',drawFinished);


    // Mobile version

    // prevent default behavior when on canvas
    visor.addEventListener('touchstart', function(e) {e.preventDefault()}, false);
    visor.addEventListener('touchmove', function(e) {e.preventDefault()}, false);
    visor.addEventListener('touchend', function(e) {e.preventDefault()}, false);

    //  interpretation of each touch events for DRAWING
    visor.addEventListener("touchstart", function (event) {
        let mouseEvent = new MouseEvent("mousedown", {
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY
        });
        visor.dispatchEvent(mouseEvent);
    }, false);

    visor.addEventListener("touchmove", function (event) {
        let mouseEvent = new MouseEvent("mousemove", {
            clientX: event.touches[0].clientX,
            clientY: event.touches[0].clientY
        });
        visor.dispatchEvent(mouseEvent);
    }, false);

    visor.addEventListener("touchend", function () {
        let mouseEvent = new MouseEvent("mouseup", {});
        visor.dispatchEvent(mouseEvent);
    }, false);



    // BEGIN: Handling zoom functionality
    //----------------------------------------------------------------------------------------------

    let evCache = [];
    let prevDiff = -1;

    function handleZoom(event) {
        if (mode !== modes.PAINT) {
            event.preventDefault();
            // code for pinch event handler on mobile
            let curDiff = 0;
            if (evCache.length === 2) curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
            if (event.deltaY < 0 || curDiff > 0) {
                [zoomPointX, zoomPointY] = computeActualMousePosition(event);
                let old_zoom = visor_state.zoom;
                visor_state.zoom += visor_state.zoomStep;
                if (visor_state.zoom > MAX_ZOOM) {
                    visor_state.zoom = MAX_ZOOM;
                }
                visor_state.offsetX -= zoomPointX / visor_state.zoom - zoomPointX / old_zoom;
                visor_state.offsetY -= zoomPointY / visor_state.zoom - zoomPointY / old_zoom;
            }
            if (event.deltaY > 0 || curDiff < 0) {
                [zoomPointX, zoomPointY] = computeActualMousePosition(event);

                let old_zoom = visor_state.zoom;
                visor_state.zoom -= visor_state.zoomStep;
                if (visor_state.zoom < MIN_ZOOM)
                    visor_state.zoom = MIN_ZOOM;
                visor_state.offsetX -= zoomPointX / visor_state.zoom - zoomPointX / old_zoom;
                visor_state.offsetY -= zoomPointY / visor_state.zoom - zoomPointY / old_zoom;
            }
            // Invalidate both caches
            drawable_cache_invalid = true;
            background_cache_invalid = true;
            if (evCache.length === 2) prevDiff = curDiff;
        }
    }

    visor.addEventListener('mousewheel', handleZoom);

    visor.addEventListener("touchstart", function (event) {
        if (event.touches.length === 2) {
            evCache.push(event);
        }
    }, false);

    visor.addEventListener("touchmove", function (event) {
        if (event.touches.length === 2) {
            for (let i = 0; i < evCache.length; i++) {
                if (event.pointerId === evCache[i].pointerId) {
                    evCache[i] = event;
                    break;
                }
            }
            handleZoom(event);
        }
    }, false);

    visor.addEventListener("touchend", function (event) {
        remove_event(event);
        if (evCache.length < 2) prevDiff = -1;
    }, false);

    function remove_event(ev) {
        // Remove this event from the target's cache
        for (let i = 0; i < evCache.length; i++) {
            if (evCache[i].pointerId === ev.pointerId) {
                evCache.splice(i, 1);
                break;
            }
        }
    }


    //BEGIN: Handling simple functions
    //----------------------------------------------------------------------------------------------

    switch_button.onclick = function (ev) {
        mode = modes.PAINT + modes.SCROLL - mode;
    };
    color_picker.onchange = function () {
        current_style.color = color_picker.value;
    };

    line_weight.onchange = function () {
        current_style.thickness = line_weight.value;
    };

    shareable_link.onclick = function(){
        if(sessionId !== -1) {
            document.getElementById('generated_shareable_link').innerText = SITE_URL + '?sessionId=' + sessionId;
            document.getElementById('modal_shareable_link').style.display = "block";
        }
        else {
            document.getElementById('modal_connection').style.display = "block";
        }

    };


    //BEGIN: Creating a transfer canvases in order not to mess up the data
    //----------------------------------------------------------------------------------------------

    let transfer_canvas = document.createElement('canvas');
    transfer_canvas.width = visor.width;
    transfer_canvas.height = visor.height;
    let transfer_canvas_ctx = transfer_canvas.getContext('2d');


    //BEGIN: Update canvases
    //----------------------------------------------------------------------------------------------

    window.addEventListener('resize', function() {
        visor.width = parseInt(window.getComputedStyle(visor).width);
        visor.height = parseInt(window.getComputedStyle(visor).height);
        renderVisor();
    }, true);
    function setupCanvases(width, height) {
        background_canvas.style.width = width + 'px';
        background_canvas.style.height = height + 'px';
        drawable_canvas.style.width = width + 'px';
        drawable_canvas.style.height = height + 'px';

        background_canvas.width = width;
        background_canvas.height = height;
        drawable_canvas.width = width;
        drawable_canvas.height = height;

        drawable_canvas_ctx = drawable_canvas.getContext('2d');
        background_canvas_ctx = background_canvas.getContext('2d');

        // TODO make this configurable
        background_canvas_ctx.fillStyle = 'white';
        background_canvas_ctx.fillRect(0,0, background_canvas.width, background_canvas.height);

        // Center the image
        // This is minus because of the invertion of offsets since we are talking
        visor_state.offsetX = -(visor.width - width) / 2;
        visor_state.offsetY = -(visor.height - height) / 2;

        background_cache_invalid = true;
    }

    function drawImageOnBackground(){
        background_canvas_ctx.clearRect(0,0, background_canvas.width, background_canvas.height);
        background_canvas_ctx.drawImage(image_background_object, 0, 0, image_background_object.width, image_background_object.height
            ,0,0,background_canvas.width, background_canvas.height);
        background_cache_invalid = true;
    }
    upload_image.onchange = function (event) {
        let image_file = event.target.files[0];
        let image_type = /image.*/;

        if (image_file.type.match(image_type)) {
            let reader = new FileReader();
            reader.onload = function (e) {
                let image_object = new Image();
                image_object.onload = function () {
                    image_background_object = image_object;
                    document.getElementById('custom_width').value = image_background_object.width;
                    document.getElementById('custom_height').value = image_background_object.height;
                    usesImage = true;
                };
                image_object.src = e.target.result;


            };
            reader.readAsDataURL(image_file);
        }
    };
    function renderVisor() {
        // We could make those very big (visor.widht / visor_state.MIN_ZOOM) from the start
        // so we don't have to adjust on the fly (maybe this is a performance issue)
        transfer_canvas.width = visor.width / visor_state.zoom;
        transfer_canvas.height = visor.height / visor_state.zoom;

        visor_ctx.save();
        visor_ctx.clearRect(0, 0, visor.width, visor.height);
        visor_ctx.scale(visor_state.zoom, visor_state.zoom);

        // Draw the off limit area
        // drawOffLimitArea();
        // Draw the background
        transfer_canvas_ctx.putImageData(cached_background, 0, 0);
        visor_ctx.drawImage(transfer_canvas, 0, 0);

        // Draw the drawable
        transfer_canvas_ctx.putImageData(cached_drawable, 0, 0);
        visor_ctx.drawImage(transfer_canvas, 0, 0);

        visor_ctx.restore();
    }

    // Updates the caches if necessary
    setInterval(function () {
        if (updateBackgroundCache()) {
            updateDrawableCache();
            renderVisor();
        }
        else {
            if (updateDrawableCache())
                renderVisor();
        }
    }, 1000 / 30);

    // Function which updates the background image cache if necessary
    // e.g : when anything in visor_state changes and when we draw on the background canvas
    function updateBackgroundCache() {
        if (background_cache_invalid) {
            cached_background = background_canvas_ctx.getImageData(visor_state.offsetX, visor_state.offsetY,
                visor.width / visor_state.zoom, visor.height / visor_state.zoom);
            // This flag will be reset to true when the visor_state changes or we draw on the background canvas
            background_cache_invalid = false;
            return true;
        }
        return false;
    }

    // Function to be called whenever we need to update the cahced part of the drawable canvas
    // e.g : when anything in visort_state changes, and when we draw on the drawableCanvas
    function updateDrawableCache() {
        if (drawable_cache_invalid) {
            cached_drawable = drawable_canvas_ctx.getImageData(visor_state.offsetX, visor_state.offsetY,
                visor.width / visor_state.zoom, visor.height / visor_state.zoom);

            // This flag will be reset when we update the drawable canvas
            drawable_cache_invalid = false;
            return true;
        }
        return false;
    }
};