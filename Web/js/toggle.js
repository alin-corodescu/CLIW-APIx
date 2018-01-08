function toggle() {
    var x = document.getElementById("toggle");
    if (x.style.visibility === undefined) {
        x.style.visibility = "hidden";
}
	if( x.style.visibility == "hidden"){
		x.style.visibility = "visible";
}
    else {
        x.style.visibility = "hidden";
    }
}
function changeOpacityOfContainers(y) {
	var x = document.getElementsByClassName("container");
	var i;
    for (i = 0; i < x.length; i++) {
        x[i].style.opacity = "" + y;
    }
}
function displayLinks(flag) {
	var x = document.getElementsByClassName("container");
	var i;
    for (i = 0; i < x.length; i++) {
    	if (flag == true)
        	x[i].style.visibility = "visible";
        else x[i].style.visible ="hidden";
    }
}
function closeNavigation() {
	document.getElementById("sidenav").style.width = "0";
	changeOpacityOfContainers(1);
	displayLinks(false);
}

function openNavigation() {
	document.getElementById("sidenav").style.width = "20%";
	document.getElementById("sidenav").style.opacity = "1 !important";
	changeOpacityOfContainers(0.2);
	displayLinks(true);
}
function clickColorPicker() {
	document.getElementById("colorPicker").click();
	console.log("WHATASPP");
}