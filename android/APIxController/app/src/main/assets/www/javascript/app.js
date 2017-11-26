
function sayHello() {
    alert("sayHello function called");
}

function clickColorPicker() {
	document.getElementById("colorPicker").click();
}

function clickCamera() {
	document.getElementById("camera").click();
}
function updateColorPickerButton() {
	var color = document.getElementById("colorPicker").value;
	document.getElementById("colorButton").style.backgroundColor = color;
}
