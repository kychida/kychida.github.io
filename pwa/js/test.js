if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa/js/service-worker.js', { scope: '/pwa/js/' })
  .then(function(reg) {
    console.log('登録に成功しました。 Scope は ' + reg.scope);
  }).catch(function(error) {
    console.log('登録に失敗しました。' + error);
  });
}
 
$(function () {

	$('#scan-start').on('click', function() {
	  alert("クリックされました");
	  startScanner();
	});
	
	$('#scan-stop').on('click', function() {
	  alert("クリックされました");
	  
      Quagga.offProcessed(this.onProcessed)
      Quagga.offDetected(this.onDetected)
      Quagga.stop();
	});
    

});

const startScanner = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
	    // カメラ映像を表示するHTML要素の設定
            target: document.querySelector('#photo-area'),
	    // バックカメラの利用を設定. (フロントカメラは"user")
            constraints: {
                width: 640,
                height: 480,
                facingMode: "environment"
            },
        },
	 // 解析するワーカ数の設定
        numOfWorkers: navigator.hardwareConcurrency || 4,
        // バーコードの種類を設定
        decoder: {readers: ["i2of5_reader","ean_reader", "ean_8_reader"]},

    }, function (err) {
        if (err) {
            console.log(err);
            return
        }

        console.log("Initialization finished. Ready to start");
        Quagga.start();

        // Set flag to is running
        _scannerIsRunning = true;
    });

    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            if (result.boxes) {
                drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                result.boxes.filter(function (box) {
                    return box !== result.box;
                }).forEach(function (box) {
                    Quagga.ImageDebug.drawPath(box, {
                        x: 0,
                        y: 1
                    }, drawingCtx, {
                        color: "green",
                        lineWidth: 2
                    });
                });
            }

            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "#00F",
                    lineWidth: 2
                });
            }

            if (result.codeResult && result.codeResult.code) {
                Quagga.ImageDebug.drawPath(result.line, {
                    x: 'x',
                    y: 'y'
                }, drawingCtx, {
                    color: 'red',
                    lineWidth: 3
                });
            }
        }
    });

    //barcode read call back
    Quagga.onDetected(function (result) {
        console.log(result.codeResult.code);
    });
}
