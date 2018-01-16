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
    	if (flag === true)
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
function exportCanvasPNG () {
    document.getElementById('visor_canvas').toBlob(function(blob) {
        let textToSaveAsURL = window.URL.createObjectURL(blob);
        let fileNameToSaveAs = 'doodle.png';
        let downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
    },'image/png');
}

function exportCanvasJPEG () {
    document.getElementById('visor_canvas').toBlob(function(blob) {
        let textToSaveAsURL = window.URL.createObjectURL(blob);
        let fileNameToSaveAs = 'doodle.jpeg';
        let downloadLink = document.createElement("a");
        downloadLink.download = fileNameToSaveAs;
        downloadLink.innerHTML = "Download File";
        downloadLink.href = textToSaveAsURL;
        downloadLink.onclick = destroyClickedElement;
        downloadLink.style.display = "none";
        document.body.appendChild(downloadLink);
        downloadLink.click();
    },'image/jpeg', 0.95);
}

function destroyClickedElement(event)
{
    document.body.removeChild(event.target);
}

function showPopupText(element) {
    let popup = element.lastElementChild;
    popup.classList.add("show");
}
function hidePopupText(element) {
    let popup = element.lastElementChild;
    popup.classList.remove("show");
}
function toggleInputRange(element){
    let popup = element.lastElementChild;
    popup.classList.toggle("show");
}
