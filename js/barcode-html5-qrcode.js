document.addEventListener('DOMContentLoaded', function () {
    // HTML5 QR Code Scanner のインスタンスを作成
    const html5QrCode = new Html5Qrcode("reader");
    let isScanning = false;
    let selectedDeviceId;
    // スキャン結果を保存するバッファ
    let scanBuffer = [];
    // 必要な連続一致回数
    const requiredMatches = 3;

    // カメラデバイスのリストを取得して選択肢に追加
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length) {
            // カメラ選択要素を作成
            const sourceSelectPanel = document.createElement('div');
            sourceSelectPanel.id = 'sourceSelectPanel';
            sourceSelectPanel.style.marginBottom = '20px';

            const sourceSelectLabel = document.createElement('label');
            sourceSelectLabel.htmlFor = 'sourceSelect';
            sourceSelectLabel.textContent = 'カメラを選択: ';

            const sourceSelect = document.createElement('select');
            sourceSelect.id = 'sourceSelect';
            sourceSelect.style.maxWidth = '400px';

            // カメラリストを追加
            devices.forEach(device => {
                const option = document.createElement('option');
                option.value = device.id;
                option.text = device.label || `カメラ ${devices.indexOf(device) + 1}`;
                sourceSelect.appendChild(option);
            });

            // 最初のカメラをデフォルトで選択
            selectedDeviceId = devices[0].id;

            // 選択変更イベント
            sourceSelect.addEventListener('change', function() {
                selectedDeviceId = sourceSelect.value;
                if (isScanning) {
                    stopScanning().then(() => {
                        startScanning();
                    });
                }
            });

            // DOMに追加
            sourceSelectPanel.appendChild(sourceSelectLabel);
            sourceSelectPanel.appendChild(sourceSelect);
            document.querySelector('#reader-container').insertBefore(sourceSelectPanel, document.querySelector('#reader'));
        }
    }).catch(err => {
        console.error('カメラデバイスの取得に失敗しました:', err);
    });

    // スキャン設定
    const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8
        ]
    };

    // スキャン成功時のコールバック
    const onScanSuccess = (decodedText, decodedResult) => {
        console.log(`コード検出: ${decodedText}`, decodedResult);

        // 結果を表示
        const resultElement = document.getElementById('result');

        // スキャン結果をバッファに追加
        scanBuffer.push(decodedText);

        // 最新のスキャン結果を表示（一時的な表示）
        resultElement.innerHTML = `
            <p><strong>スキャン中:</strong> ${decodedText}</p>
            <p><strong>フォーマット:</strong> ${decodedResult.result.format.formatName}</p>
            <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches}</p>
        `;

        // バッファ内のすべての値が同じかチェック
        const allSame = scanBuffer.every(code => code === scanBuffer[0]);

        // 必要な回数のスキャンが完了し、すべて同じ値の場合
        if (scanBuffer.length >= requiredMatches && allSame) {
            // 成功したらビープ音を鳴らす（オプション）
            const beep = new Audio("data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU" + Array(1e3).join("123"));
            beep.play();

            // 最終結果を表示
            resultElement.innerHTML = `
                <p><strong>スキャン結果:</strong> ${decodedText}</p>
                <p><strong>フォーマット:</strong> ${decodedResult.result.format.formatName}</p>
                <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (一致)</p>
            `;

            // スキャンを停止
            stopScanning().then(() => {
                resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
            }).catch((err) => {
                console.error(`スキャン停止エラー: ${err}`);
                resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
            });
        } else if (scanBuffer.length > 1 && !allSame) {
            // 一致しない結果があった場合、最新の結果だけを残してバッファをリセット
            scanBuffer = [decodedText];
            resultElement.innerHTML = `
                <p><strong>スキャン中:</strong> ${decodedText}</p>
                <p><strong>フォーマット:</strong> ${decodedResult.result.format.formatName}</p>
                <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (リセット)</p>
            `;
        }
    };

    // スキャンエラー時のコールバック
    const onScanFailure = (error) => {
        // エラーはコンソールに出力するだけで、UIには表示しない
        // console.warn(`スキャンエラー: ${error}`);
    };

    // スキャン開始関数
    function startScanning() {
        if (isScanning) return;

        const resultElement = document.getElementById('result');
        resultElement.innerHTML = '<p>スキャン中...</p>';

        // スキャンバッファをクリア
        scanBuffer = [];

        // カメラの使用を開始
        const cameraConfig = selectedDeviceId 
            ? { deviceId: { exact: selectedDeviceId } } // 選択されたカメラを使用
            : { facingMode: "environment" }; // 選択がなければリアカメラを使用

        html5QrCode.start(
            cameraConfig,
            config,
            onScanSuccess,
            onScanFailure
        ).then(() => {
            isScanning = true;
            console.log("スキャン開始");
        }).catch((err) => {
            console.error(`スキャン開始エラー: ${err}`);
            resultElement.innerHTML = `<p>エラー: ${err}</p>`;
        });
    }

    // スキャン停止関数
    function stopScanning() {
        if (!isScanning) return Promise.resolve();

        // スキャンバッファをクリア
        scanBuffer = [];

        return html5QrCode.stop().then(() => {
            isScanning = false;
            console.log("スキャン停止");
        }).catch((err) => {
            console.error(`スキャン停止エラー: ${err}`);
            return Promise.reject(err);
        });
    }

    // スキャンリセット関数
    function resetScanning() {
        // スキャンバッファをクリア
        scanBuffer = [];

        stopScanning().then(() => {
            document.getElementById('result').innerHTML = '<p>スキャン結果がここに表示されます</p>';
        }).catch((err) => {
            console.error(`リセットエラー: ${err}`);
            document.getElementById('result').innerHTML = '<p>スキャン結果がここに表示されます</p>';
        });
    }

    // イベントリスナーの設定
    document.getElementById('startButton').addEventListener('click', startScanning);
    document.getElementById('stopButton').addEventListener('click', stopScanning);
    document.getElementById('resetButton').addEventListener('click', resetScanning);

    // ページ離脱時にリソースを解放
    window.addEventListener('beforeunload', function() {
        if (isScanning) {
            // beforeunload では Promise を待つことができないため、
            // 同期的に stop を呼び出す
            try {
                html5QrCode.stop();
                isScanning = false;
            } catch (err) {
                console.error(`ページ離脱時のスキャン停止エラー: ${err}`);
            }
        }
    });
});
