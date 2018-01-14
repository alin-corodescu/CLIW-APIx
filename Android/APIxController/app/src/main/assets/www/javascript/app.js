var toggle = true;

function clickColorPicker() {
	document.getElementById("colorPicker").click();
}

function clickCamera() {
	document.getElementById("camera").click();
}

function switchButton() {
    var button = document.getElementById("switchButton");
    if (button.innerText === "On") {
        toggle = false;
        button.innerText = "Off";
        button.style.backgroundColor = "red";
    }
    else  {
        toggle = true;
        button.innerText = "On";
        button.style.backgroundColor = "green";
    }
}

function updateThickness(value) {
    var color = document.getElementById("colorPicker").value;
    var update = {color: color, thickness: value};
    update.android = 'true';
    update.style = 'true';

    conn.send(JSON.stringify(update));
}
function updateColorPickerButton() {
	var color = document.getElementById("colorPicker").value;
	var x = document.getElementsByClassName("recolorable");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].style.color = color;
        if (x[i].id === "colorButton")
        	x[i].style.backgroundColor = color;
    }

    var thickness = document.getElementById("thicknessSlider").value;
    var update = {color: color, thickness: thickness};
    update.android = 'true';
    update.style = 'true';

    conn.send(JSON.stringify(update));
}

var BACKEND_URL = "ws://ec2-18-194-162-230.eu-central-1.compute.amazonaws.com:5000/";
// value below which the velocity is considered to be 0
var VELOCITY_NOISE_THRESHOLD = 0;
var DISTANCE_NOISE_THRESHOLD = 0.01;
var ACCELERATION_NOISE_THRESHOLD = 1;
var t0;
var vx0 = 0, vy0 = 0;
var ax0 = 0, ay0 = 0;
var dx = 0, dy = 0;
var conn;
var lastUpdateTime = 0;
function connectToServer(id) {
    if (!conn) {
        var connectionString = BACKEND_URL + "?c=" + id;
    //    alert("id : " + id);
        conn = new WebSocket(connectionString);
        conn.onopen = function (ev) {
            switchButton();
            window.addEventListener('devicemotion', function(event) {
                if (toggle) {
                    if (t0 == undefined) t0 = new Date().getTime();
                    var now = new Date().getTime();
//                    alert("t0:" + t0);
//                    alert("now:" + now);

                    var deltaT = (now - t0) / 1000;
                    if (deltaT > 100) {
                        deltaT = 100;
                      }
//                    alert("delta T " + deltaT);

                    // Acceleration on x we consider
                    var xAccel = 0;
                    if (event.acceleration.x > ACCELERATION_NOISE_THRESHOLD || event.acceleration.x < -ACCELERATION_NOISE_THRESHOLD) {
                        xAccel = event.acceleration.x;
                    }
                    else {
                        vx0 *= 0.9;
                    }
                    var axPrime = (xAccel + ax0) / 2;
//                    alert("acceleration" + event.acceleration.x);
//                    alert("prev accel" + ax0);
//                    alert("accel on x:" + axPrime);
                    var vx1 = vx0 + axPrime * deltaT;
//                    alert("vx1 " + vx1)
                    var vxPrime = (vx1 + vx0) / 2;
//                    alert("vxPrime " + vxPrime);
                    // Modify the distance on the x axis
                    if (vxPrime < -VELOCITY_NOISE_THRESHOLD || vxPrime > VELOCITY_NOISE_THRESHOLD)
                        dx += vxPrime * deltaT;
//                    alert(dx);


                    var yAccel = 0;
                    if (event.acceleration.z > ACCELERATION_NOISE_THRESHOLD || event.acceleration.z < -ACCELERATION_NOISE_THRESHOLD) {
                        yAccel = event.acceleration.z;
                    }
                    else {
                        vy0 *= 0.9;
                    }
                    // Acceleration on y we consider
                    var ayPrime = (yAccel + ay0) / 2;

                    var vy1 = vy0 + ayPrime * deltaT;

                    var vyPrime = (vy1 + vy0) / 2;
                    // Modify the distance on the x axis
                    if (vyPrime < -VELOCITY_NOISE_THRESHOLD || vyPrime > VELOCITY_NOISE_THRESHOLD)
                        dy += vyPrime * deltaT;

                    t0 = now;
                    ax0 = xAccel;
                    ay0 = yAccel;
                    vx0 = vx1;
                    vy0 = vy1;

                    // Send updates once every 0.05s
                    if (now - lastUpdateTime > 50) {
                        //    Send update on the server
                         if (dx < -DISTANCE_NOISE_THRESHOLD || dx > DISTANCE_NOISE_THRESHOLD ||
                             dy < -DISTANCE_NOISE_THRESHOLD || dy > DISTANCE_NOISE_THRESHOLD) {
                            lastUpdateTime = now;
                            var update = {
                                android: 'true',
                                dx: dx,
                                dy: dy
                            };
//                            t0 = undefined;
                            dy = dx = 0;
                            conn.send(JSON.stringify(update));
                         }
                    }
                }
                else {
                    t0 = undefined;
                    ax0 = ay0 = vx0 = vy0 = dy = dx = 0;
                }
            })
        };
        conn.onclose = function (ev) {
            switchButton();
        }
    }
}



