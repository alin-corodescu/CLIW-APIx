 var canvas,ctx, flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0,
        dot_flag = false;

    var x = "black",
        y = 2;

    var width, height;
    var scale = 1.0;
    var scaleMultiplier = 0.5;

    function init() {
        canvas = document.getElementById('can');
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        width = canvas.clientWidth;
        height = canvas.clientHeight;
        ctx = canvas.getContext("2d");

        canvas.addEventListener('wheel', function(e){
            if( e.deltaY > 0){
                scale /= scaleMultiplier;
                width = width * scale;
                newImageHeight = height / width;
                zoom(scale);
            }
            if( e.deltaY < 0){
                scale *= scaleMultiplier;
                width = width / scale;
                newImageHeight = height / width;
                zoom(scale);
            }
        }, false);

        canvas.addEventListener("mousemove", function (e) {
            findxy('move', e)
        }, false);
        canvas.addEventListener("mousedown", function (e) {
            findxy('down', e)
        }, false);
        canvas.addEventListener("mouseup", function (e) {
            findxy('up', e)
        }, false);
        canvas.addEventListener("mouseout", function (e) {
            findxy('out', e)
        }, false);
    }
    
    function draw() {
        ctx.beginPath();
        ctx.moveTo(prevX, prevY);
        ctx.lineTo(currX, currY);
        ctx.strokeStyle = x;
        ctx.lineWidth = y;
        ctx.stroke();
        ctx.closePath();
    }

    function zoom(scale){
        var imageObject = new Image();
        imageObject.onload = function(){
            ctx.clearRect(0,0,canvas.width,canvas.height);
            canvas.width = width;
            canvas.height = height;
            ctx.scale(scale,scale);
            ctx.drawImage(imageObject, 0, 0, width, height);
        }
        imageObject.src=canvas.toDataURL();
    } 
    
    function findxy(res, e) {
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = e.clientX - canvas.offsetLeft;
            currY = e.clientY - canvas.offsetTop;
    
            flag = true;
            dot_flag = true;
            if (dot_flag) {
                ctx.beginPath();
                ctx.fillStyle = x;
                ctx.fillRect(currX, currY, 2, 2);
                ctx.closePath();
                dot_flag = false;
            }
        }
        if (res == 'up' || res == "out") {
            flag = false;
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.clientX - canvas.offsetLeft;
                currY = e.clientY - canvas.offsetTop;
                draw();
            }
        }
    }