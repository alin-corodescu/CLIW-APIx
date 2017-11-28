
function sayHello() {
    alert("sayHello function called");
}

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
