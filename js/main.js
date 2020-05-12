function StampInfo() {
  this.pageNumber;
  this.xCoord;
  this.yCoord;
}


var pagesCanvas = new Array();

const url = 'sample.pdf';

var thePdf = null;
var scale = 1;

pdfjsLib.getDocument(url).promise.then(function (pdf) {
  thePdf = pdf;
  viewer = document.getElementById('pdf-render');

  for (page = 1; page <= pdf.numPages; page++) {
    canvas = document.createElement("canvas");
    canvas.className = "pdfcanvas"
    canvas.id = 'pdfcanvas' + page;
    viewer.appendChild(canvas);
    renderPage(page, canvas);

  }
});

// Render the page
const renderPage = (num, canvas) => {

  // Get page
  thePdf.getPage(num).then(page => {
    // Set scale
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = {
      canvasContext: canvas.getContext('2d'),
      viewport
    };

    page.render(renderCtx).promise.then(function () {

      var bg = canvas.toDataURL("image/png");
      var fcanvas = new fabric.Canvas("pdfcanvas" + num, {
        selection: false
      });
      fcanvas.setBackgroundImage(bg, fcanvas.renderAll.bind(fcanvas));
      var rect = new fabric.Rect({
        left: 0,
        top: 0,
        width: 200,
        height: 100,
        fill: '#333333',
        opacity: 0.4,
        hasBorders: false,
        cornerSize: 0,
        lockRotation: true
      });
      fcanvas.add(rect);
      fcanvas.renderAll();
      pagesCanvas.push(fcanvas);

      fcanvas.on('object:moving', function (e) {
        var rectangle = e.target;
        rectangle.setCoords();
        // top-left  corner
        if (rectangle.getBoundingRect().top < 0 || rectangle.getBoundingRect().left < 0) {
          rectangle.top = Math.max(rectangle.top, rectangle.top - rectangle.getBoundingRect().top);
          rectangle.left = Math.max(rectangle.left, rectangle.left - rectangle.getBoundingRect().left);
        }

        // bot-right corner
        if (rectangle.getBoundingRect().top + rectangle.getBoundingRect().height > rectangle.canvas.height || rectangle.getBoundingRect().left + rectangle.getBoundingRect().width > rectangle.canvas.width) {
          rectangle.top = Math.min(rectangle.top, rectangle.canvas.height - rectangle.getBoundingRect().height + rectangle.top - rectangle.getBoundingRect().top);
          rectangle.left = Math.min(rectangle.left, rectangle.canvas.width - rectangle.getBoundingRect().width + rectangle.left - rectangle.getBoundingRect().left);
        }
        rectangle.hasBorders = true;
        changeSelectedObjectColorOpacity(rectangle, fcanvas);

        fcanvas.on('mouse:over', function (event) {
          changeSelectedObjectColorOpacity(event.target, fcanvas);
        });

        fcanvas.on('mouse:out', function (event) {
          revertObjectColorOpacity(event.target, fcanvas);
        });
      });
    });
  });
};

var selected_fill_color = '#334380';
var selected_object_opacity = 0.3;

function changeSelectedObjectColorOpacity(object, canvas) {
  if (object == null) {
    return;
  }

  object.set('fill', selected_fill_color);
  object.set('opacity', selected_object_opacity);
  canvas.renderAll();
}


function revertObjectColorOpacity(object, canvas) {
  if (object == null) {
    return;
  }
  object.set('fill', '#333333');
  object.set('opacity', 0.4);
  object.set('hasBorders', false);
  canvas.renderAll();
}

var submit = function (e) {
  var response = new Array();

  for (i = 0; i < pagesCanvas.length; i++) {
    var stampInfo = new StampInfo();
    stampInfo.pageNumber = i + 1;
    stampInfo.xCoord = pagesCanvas[i].getObjects()[0].left;
    stampInfo.yCoord = pagesCanvas[i].getObjects()[0].top;

    response.push(stampInfo);
  }

  console.log(response);
}
document.getElementById("done").addEventListener("click", submit);
