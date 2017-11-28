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