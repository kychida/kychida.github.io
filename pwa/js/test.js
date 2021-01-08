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
      startScanner();
    });

    $('#scan-stop').on('click', function() {
      Quagga.offProcessed(this.onProcessed)
      Quagga.offDetected(this.onDetected)
      Quagga.stop();
	});
     
    $('#scan-result').on('click', function() {
	    console.log("click");
	    $(this).text("result click...");
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

	function _getMedian(arr) {
  arr.sort((a, b) => a - b)
  const half = Math.floor(arr.length / 2)
  if (arr.length % 2 === 1)
    // Odd length
    return arr[half]
  return (arr[half - 1] + arr[half]) / 2.0
}
	
    let codes = []
    Quagga.onDetected(function (result) {
       // １つでもエラー率0.16以上があれば除外
       let is_err = false
       $.each(result.codeResult.decodedCodes, function (id, error) {
         if (error.error != undefined) {
           if (parseFloat(error.error) > 0.16) {
             is_err = true
           }
         }
       })
       if (is_err) return
	    console.log(result.codeResult.code)
       // エラー率のmedianが0.05以上なら除外
       const errors = result.codeResult.decodedCodes.filter((_) => _.error !== undefined).map((_) => _.error)
       const median = _getMedian(errors)
       if (median > 0.05) {
         return
       }

       // ３連続同じ数値だった場合のみ採用する
       codes.push(result.codeResult.code)
       if (codes.length < 3) return
       let is_same_all = false
       if (codes.every((v) => v === codes[0])) {
         is_same_all = true
       }
       if (!is_same_all) {
         codes.shift()
         return
       }

       alert(result.codeResult.code)
      // $('.scan_area').hide()
       Quagga.stop()
       Quagga.offProcessed(this.onProcessed)
       Quagga.offDetected(this.onDetected)
       //Quagga.offProcessed(_onProcessed)
       //Quagga.offDetected(_onDetected)
  
    });
    
    Quagga.onProcessed(function (result) {
        var drawingCtx = Quagga.canvas.ctx.overlay,
            drawingCanvas = Quagga.canvas.dom.overlay;

        if (result) {
            // 検出中の緑の枠線
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
            
            // 検出成功時の青の枠線
            if (result.box) {
                Quagga.ImageDebug.drawPath(result.box, {
                    x: 0,
                    y: 1
                }, drawingCtx, {
                    color: "blue",
                    lineWidth: 2
                });
            }
            
            // 検出に成功した瞬間の水平の赤い線
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
}
