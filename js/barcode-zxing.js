document.addEventListener('DOMContentLoaded', function () {
    const codeReader = new ZXing.BrowserMultiFormatReader();
    let selectedDeviceId;

    // カメラデバイスのリストを取得して選択肢に追加
    codeReader.listVideoInputDevices()
        .then((videoInputDevices) => {
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

        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
            if (result) {
                console.log(result);
                resultElement.innerHTML = `
                    <p><strong>スキャン結果:</strong> ${result.text}</p>
                    <p><strong>フォーマット:</strong> ${result.format}</p>
                `;

                // 成功したらビープ音を鳴らす（オプション）
                const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + Array(1e3).join("123"));
                beep.play();

                // 1回読み取ったら停止する
                codeReader.reset();
                resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
            }

            if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error(err);
                resultElement.innerHTML = `<p>エラー: ${err}</p>`;
            }
        });
    }

    // スキャン停止関数
    function stopScanning() {
        codeReader.reset();
        document.getElementById('result').innerHTML = '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
    }

    // スキャンリセット関数
    function resetScanning() {
        codeReader.reset();
        document.getElementById('result').innerHTML = '<p>スキャン結果がここに表示されます</p>';
    }

    // ページ離脱時にリソースを解放
    window.addEventListener('beforeunload', function() {
        codeReader.reset();
    });
});
