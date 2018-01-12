
function clickColorPicker() {
	document.getElementById("colorPicker").click();
}

function clickCamera() {
	document.getElementById("camera").click();
}

function switchButton() {
    var button = document.getElementById("switchButton");
    if (button.innerText == "On") {
        button.innerText = "Off"
        button.style.backgroundColor = "red";
    }
    else  {
        button.innerText = "On"
        button.style.backgroundColor = "green";
    }
}
function updateColorPickerButton() {
	var color = document.getElementById("colorPicker").value;
	var x = document.getElementsByClassName("recolorable");
    var i;
    for (i = 0; i < x.length; i++) {
        x[i].style.color = color;
        if (x[i].id == "colorButton")
        	x[i].style.backgroundColor = color;
    }
}

var BACKEND_URL = "ws://ec2-18-194-162-230.eu-central-1.compute.amazonaws.com:5000/";
var conn;
function connectToServer(id) {
    if (!conn) {
        var connectionString = BACKEND_URL + "?clientId=" + id;
    //    alert("id : " + id);
        conn = new WebSocket(connectionString);
        conn.onopen = function (ev) {
            switchButton();
            window.addEventListener('devicemotion', function(event) {
                var update = {android : 'true', x : event.acceleration.x, y : event.acceleration.y, z : event.acceleration.y};
                conn.sendMessage(JSON.stringify(update));
            })
        }
        conn.onclose = function (ev) {
            switchButton();
        }
    }
}



