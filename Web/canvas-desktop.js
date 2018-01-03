// function zooming(){
//   var startScale = 1;
//   var scale = startScale;
//   var canvas = document.getElementById("can")
//   var ctx = canvas.getContext("2d");
//   var width = ctx.canvas.width;
//   var height = ctx.canvas.height;
//   var intervalId;

//   var imageData = ctx.getImageData(0, 0, width, height);
  

//   scale = scale + 0.5;
//   ctx.putImageData(imageData, 0, 0);

//   function zoomIn(){
//     intervalId = setInterval(function(){
//         scale = scale + 0.5;
//         drawContents();
//     }, 50);
//   };

//   function zoomOut() {
//   clearInterval(intervalId);
//     intervalId = setInterval(function(){
//         if (scale <= startScale){
//             clearInterval(intervalId);
//         }        
//         scale = scale - 0.01;
//         drawContents();
//     }, 50);
//   };

//   function drawContents(ctx){
//     var newWidth = width * scale;
//     var newHeight = height * scale;

//     ctx.save();
//     ctx.translate(-((newWidth-width)/2), -((newHeight-height)/2));
//     ctx.scale(scale, scale);
//     ctx.clearRect(0, 0, width, height);
//     ctx.drawImage(copiedCanvas, 0, 0);
//     ctx.restore();
//     }
// }

// var startScale = 1;
// var scale = startScale;
// var canvas = document.getElementById("can")
// var ctx = canvas.getContext("2d");
// var width = ctx.canvas.width;
// var height = ctx.canvas.height;
// var intervalId;

// var imageData = ctx.getImageData(0, 0, width, height);

// copiedCanvas.getContext("2d").putImageData(imageData, 0, 0);

// $("#test").mousedown(function(){
//     intervalId = setInterval(function(){
//         scale = scale + 0.01;
//         drawContents();
//     }, 50);
// });

// $("#test").mouseup(function(){
//     clearInterval(intervalId);
//     intervalId = setInterval(function(){
//         if (scale <= startScale){
//             clearInterval(intervalId);
//         }        
//         scale = scale - 0.01;
//         drawContents();
//     }, 50);
// });

// function drawContents(){
//     var newWidth = width * scale;
//     var newHeight = height * scale;
    
//     ctx.save();
//     ctx.translate(-((newWidth-width)/2), -((newHeight-height)/2));
//     ctx.scale(scale, scale);
//     ctx.clearRect(0, 0, width, height);
//     ctx.drawImage(copiedCanvas, 0, 0);
//     ctx.restore();
// }