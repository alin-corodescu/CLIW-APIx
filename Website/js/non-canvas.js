var current_line_thick = 2, line_thick_step = 0.2, MAX_THICK = 10, MIN_THICK = 0.2;
// Functions relating side navigation
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

//functions for aside options
function clickColorPicker() {
	document.getElementById("color_picker").click();
}
function clickUploadImage() {
    document.getElementById("upload_image").click();
}
function thickerLineWeight(){
    let line_thick = document.getElementById("line_weight");
    let event = new Event('change');
    current_line_thick = current_line_thick + line_thick_step;
    if(current_line_thick > MAX_THICK)
        current_line_thick = MAX_THICK;
    line_thick.value = current_line_thick.toString();
    line_thick.dispatchEvent(event);
}
function thinnerLineWeight(){
    let line_thick = document.getElementById("line_weight");
    let event = new Event('change');
    current_line_thick = current_line_thick - line_thick_step;
     if(current_line_thick < MIN_THICK)
        current_line_thick = MIN_THICK;
    line_thick.value = current_line_thick.toString();
    line_thick.dispatchEvent(event);
}

