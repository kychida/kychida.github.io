$(function () {
    $(".scan-area").hide();

    $('#scan-start').on('click', function() {
      $("#scan-result").text("");
      startScanner();
    });

    $('#scan-stop').on('click', function() {
      Quagga.offProcessed(this.onProcessed)
      Quagga.offDetected(this.onDetected)
      Quagga.stop();
    });
});

   navigator.mediaDevices.enumerateDevices().then(function(devices) { // 成功時
     devices.forEach(function(device) {
       if (device.kind == 'videoinput') {
          console.log(device.deviceId);
          $(".scan-message").hide();
          $(".scan-area").show();
          $('#selectCamera').append($("<option>").val(device.deviceId).text(device.label));
       }
      });
    });


const startScanner = () => {
    Quagga.init({
        inputStream: {
            name: "Live",
            type: "LiveStream",
            target: document.querySelector('#photo-area'),
            constraints: {
                facingMode: "environment",
                deviceId: $('#selectCamera option:selected').val(),
            },
        },
        // 解析するワーカ数の設定
        numOfWorkers: navigator.hardwareConcurrency || 4,
        // バーコードの種類を設定
        decoder: {
          readers: ["code_128_reader","ean_reader", "ean_8_reader"],
          multiple: false,  //同時に複数のバーコードを解析しない
          },
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
    const success_num = 1;
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

       // success_num数連続同じ数値だった場合のみ採用する
       codes.push(result.codeResult.code)
       if (codes.length < success_num) return
       let is_same_all = false
       if (codes.every((v) => v === codes[0])) {
         is_same_all = true
       }
       if (!is_same_all) {
         codes.shift()
         return
       }

       //alert(result.codeResult.code)
      // $('.scan_area').hide()
      // $("#scan-result").text(result.codeResult.code);
       Quagga.offProcessed()
       Quagga.offDetected()
       Quagga.stop()
       window.location = "../search.html?sjan=123456"
       //Quagga.offProcessed(this.onProcessed)
       //Quagga.offDetected(this.onDetected)
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
