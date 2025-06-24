document.addEventListener('DOMContentLoaded', function () {
    let activeStream = null;
    let selectedDeviceId = null;
    let quaggaInitialized = false;
    // スキャン結果を保存するバッファ
    let scanBuffer = [];
    // 必要な連続一致回数
    const requiredMatches = 3;

    // カメラデバイスのリストを取得して選択肢に追加
    // カメラへのアクセス許可を要求
    navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
            // ストリームを停止
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());

            // デバイス一覧を取得
            return navigator.mediaDevices.enumerateDevices();
        })
        .then((devices) => {
            const videoInputDevices = devices.filter(device => device.kind === 'videoinput');
            const sourceSelect = document.getElementById('sourceSelect');

            if (videoInputDevices.length === 0) {
                sourceSelect.innerHTML = '<option value="">カメラが見つかりません</option>';
            } else {
                sourceSelect.innerHTML = '';
                videoInputDevices.forEach((device) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `カメラ ${videoInputDevices.indexOf(device) + 1}`;
                    sourceSelect.appendChild(option);
                });

                // 最初のカメラをデフォルトで選択
                selectedDeviceId = videoInputDevices[0].deviceId;
                sourceSelect.value = selectedDeviceId;
            }

            // カメラ選択が変更されたときの処理
            sourceSelect.addEventListener('change', function() {
                selectedDeviceId = sourceSelect.value;
                if (quaggaInitialized) {
                    Quagga.stop();
                    quaggaInitialized = false;
                    if (activeStream) {
                        const tracks = activeStream.getTracks();
                        tracks.forEach(track => track.stop());
                        activeStream = null;
                    }
                }
            });

            // スキャン開始ボタンのイベントリスナー
            document.getElementById('startButton').addEventListener('click', function() {
                startScanning();
            });

            // スキャン停止ボタンのイベントリスナー
            document.getElementById('stopButton').addEventListener('click', function() {
                stopScanning();
            });

            // リセットボタンのイベントリスナー
            document.getElementById('resetButton').addEventListener('click', function() {
                resetScanning();
            });
        })
        .catch((err) => {
            console.error(err);
            document.getElementById('result').innerHTML = `<p>エラー: ${err}</p>`;
        });

    // スキャン開始関数
    function startScanning() {
        const resultElement = document.getElementById('result');
        resultElement.innerHTML = '<p>スキャン中...</p>';

        // スキャンバッファをクリア
        scanBuffer = [];

        if (quaggaInitialized) {
            Quagga.start();
            return;
        }

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'),
                constraints: {
                    width: 640,
                    height: 480,
                    facingMode: "environment",
                    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined
                },
                area: { // 読み取りエリアを定義（オプション）
                    top: "0%",    // 上端からの位置
                    right: "0%",  // 右端からの位置
                    left: "0%",   // 左端からの位置
                    bottom: "0%"  // 下端からの位置
                }
            },
            decoder: {
                readers: [
                    "ean_reader",
                    "ean_8_reader"
                ],
                debug: {
                    showCanvas: true,
                    showPatches: false,
                    showFoundPatches: false,
                    showSkeleton: false,
                    showLabels: true,
                    showPatchLabels: false,
                    showRemainingPatchLabels: false,
                    boxFromPatches: {
                        showTransformed: true,
                        showTransformedBox: true,
                        showBB: true
                    }
                },
                locator: {
                    patchSize: "medium",
                    halfSample: true
                },
                locate: true,
                frequency: 10
            }
        }, function(err) {
            if (err) {
                console.error(err);
                resultElement.innerHTML = `<p>エラー: ${err}</p>`;
                return;
            }

            // カメラストリームを保存
            try {
                // Quagga2では直接MediaStreamを取得する方法が変更されている
                const videoEl = document.querySelector('#interactive video');
                if (videoEl && videoEl.srcObject) {
                    activeStream = videoEl.srcObject;
                }
            } catch (e) {
                console.error("カメラトラックの取得に失敗しました:", e);
            }

            console.log("Quagga2の初期化が完了しました。スキャンを開始します...");
            quaggaInitialized = true;
            Quagga.start();

            // スキャンバッファをクリア
            scanBuffer = [];

            // バーコードが検出されたときのイベントリスナー
            Quagga.onDetected(function(result) {
                if (result && result.codeResult) {
                    console.log("バーコードを検出しました:", result.codeResult.code);

                    // スキャン結果をバッファに追加
                    scanBuffer.push(result.codeResult.code);

                    // 最新のスキャン結果を表示（一時的な表示）
                    resultElement.innerHTML = `
                        <p><strong>スキャン中:</strong> ${result.codeResult.code}</p>
                        <p><strong>フォーマット:</strong> ${result.codeResult.format}</p>
                        <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches}</p>
                    `;

                    // バッファ内のすべての値が同じかチェック
                    const allSame = scanBuffer.every(code => code === scanBuffer[0]);

                    // 必要な回数のスキャンが完了し、すべて同じ値の場合
                    if (scanBuffer.length >= requiredMatches && allSame) {

                        // 最終結果を表示
                        resultElement.innerHTML = `
                            <p><strong>スキャン結果:</strong> ${result.codeResult.code}</p>
                            <p><strong>フォーマット:</strong> ${result.codeResult.format}</p>
                            <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (一致)</p>
                        `;

                        // スキャンを停止
                        Quagga.stop();
                        quaggaInitialized = false;
                        resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
                    } else if (scanBuffer.length > 1 && !allSame) {
                        // 一致しない結果があった場合、最新の結果だけを残してバッファをリセット
                        scanBuffer = [result.codeResult.code];
                        resultElement.innerHTML = `
                            <p><strong>スキャン中:</strong> ${result.codeResult.code}</p>
                            <p><strong>フォーマット:</strong> ${result.codeResult.format}</p>
                            <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (リセット)</p>
                        `;
                    }
                }
            });

            // 処理結果を表示するイベントリスナー（デバッグ用、オプション）
            Quagga.onProcessed(function(result) {
                const drawingCtx = Quagga.canvas.ctx.overlay;
                const drawingCanvas = Quagga.canvas.dom.overlay;

                if (result) {
                    // 検出されたバーコードの位置に枠を描画
                    if (result.boxes) {
                        drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                        result.boxes.filter(function(box) {
                            return box !== result.box;
                        }).forEach(function(box) {
                            Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: "green", lineWidth: 2 });
                        });
                    }

                    // 認識されたバーコードを赤枠で強調表示
                    if (result.box) {
                        Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: "#00F", lineWidth: 2 });
                    }

                    // 認識されたバーコードのラインを緑で表示
                    if (result.codeResult && result.codeResult.code) {
                        Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 });
                    }
                }
            });
        });
    }

    // スキャン停止関数
    function stopScanning() {
        if (quaggaInitialized) {
            Quagga.stop();
            quaggaInitialized = false;

            // カメラストリームも停止する
            if (activeStream) {
                const tracks = activeStream.getTracks();
                tracks.forEach(track => track.stop());
                activeStream = null;
            }

            // スキャンバッファをクリア
            scanBuffer = [];

            const resultElement = document.getElementById('result');
            // 既存の結果を保持しつつ、停止メッセージを追加
            if (resultElement.innerHTML.indexOf('スキャン中...') !== -1) {
                // スキャン中で結果がまだない場合
                resultElement.innerHTML = '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
            } else if (resultElement.innerHTML.indexOf('スキャンを停止しました') === -1) {
                // 結果があり、かつ停止メッセージがまだ表示されていない場合
                resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
            }
        }
    }

    // スキャンリセット関数
    function resetScanning() {
        if (quaggaInitialized) {
            Quagga.stop();
            quaggaInitialized = false;
        }

        if (activeStream) {
            const tracks = activeStream.getTracks();
            tracks.forEach(track => track.stop());
            activeStream = null;
        }

        // スキャンバッファをクリア
        scanBuffer = [];
        document.getElementById('result').innerHTML = '<p>スキャン結果がここに表示されます</p>';
    }

    // ページ離脱時にリソースを解放
    window.addEventListener('beforeunload', function() {
        if (quaggaInitialized) {
            Quagga.stop();
            quaggaInitialized = false;
        }

        if (activeStream) {
            const tracks = activeStream.getTracks();
            tracks.forEach(track => track.stop());
            activeStream = null;
        }
    });
});
