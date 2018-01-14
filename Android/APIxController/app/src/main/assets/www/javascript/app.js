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
var THRESHOLD = 2;
var conn;
function connectToServer(id) {
    if (!conn) {
        var connectionString = BACKEND_URL + "?c=" + id;
    //    alert("id : " + id);
        conn = new WebSocket(connectionString);
        conn.onopen = function (ev) {
            switchButton();
            window.addEventListener('devicemotion', function(event) {
                // Don't be a sensitive b*tch
                if (toggle) {
                    if (event.acceleration.x < -THRESHOLD || event.acceleration.x > THRESHOLD ||
                        event.acceleration.y < -THRESHOLD || event.acceleration.y > THRESHOLD ||
                        event.acceleration.z < -THRESHOLD || event.acceleration.z > THRESHOLD) {
                        var update = {
                            android: 'true',
                            x: event.acceleration.x,
                            y: event.acceleration.y,
                            z: event.acceleration.z
                        };
                        conn.send(JSON.stringify(update));
                    }
                }
            })
        };
        conn.onclose = function (ev) {
            switchButton();
        }
    }
}



