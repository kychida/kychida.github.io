document.addEventListener('DOMContentLoaded', function () {
    // バーコードリーダーの初期化
    let codeReader;
    let selectedDeviceId;
    // スキャン結果を保存するバッファ
    let scanBuffer = [];
    // 必要な連続一致回数
    const requiredMatches = 3;

    // 選択されたフォーマットを取得する関数
    function getSelectedFormats() {
        const formats = [];
        formats.push(ZXing.BarcodeFormat.EAN_13);
        formats.push(ZXing.BarcodeFormat.EAN_8);

        return formats;
    }

    // バーコードリーダーを初期化する関数
    function initBarcodeReader() {
        // 既存のリーダーがあればリセット
        if (codeReader) {
            codeReader.reset();
        }

        // 選択されたフォーマットを取得
        const formats = getSelectedFormats();

        // ヒントマップを作成
        const hints = new Map();
        if (formats) {
            hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
        }

        navigator.mediaDevices.getUserMedia({ video: true, audio: false })

        // 新しいリーダーを作成
        codeReader = new ZXing.BrowserMultiFormatReader(hints);
    }

    // 初期化
    initBarcodeReader();

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
                    alert(device.label + "[" + device.deviceId + "]");
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

            // フォーマット選択が変更されたときの処理
            document.querySelectorAll('input[name="format"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    // スキャン中の場合は一旦停止
                    if (document.getElementById('result').innerHTML.includes('スキャン中')) {
                        codeReader.reset();
                        document.getElementById('result').innerHTML = '<p>フォーマットが変更されました。「スキャン開始」ボタンを押して再開してください。</p>';
                    }
                });
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

        // 現在選択されているフォーマットで再初期化
        initBarcodeReader();

        codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) => {
            if (result) {
                console.log(result);

                // スキャン結果をバッファに追加
                scanBuffer.push(result.text);

                // 最新のスキャン結果を表示（一時的な表示）
                resultElement.innerHTML = `
                    <p><strong>スキャン中:</strong> ${result.text}</p>
                    <p><strong>フォーマット:</strong> ${result.format}</p>
                    <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches}</p>
                `;

                // バッファ内のすべての値が同じかチェック
                const allSame = scanBuffer.every(code => code === scanBuffer[0]);

                // 必要な回数のスキャンが完了し、すべて同じ値の場合
                if (scanBuffer.length >= requiredMatches && allSame) {

                    // 最終結果を表示
                    resultElement.innerHTML = `
                        <p><strong>スキャン結果:</strong> ${result.text}</p>
                        <p><strong>フォーマット:</strong> ${result.format}</p>
                        <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (一致)</p>
                    `;

                    // スキャンを停止
                    codeReader.reset();
                    resultElement.innerHTML += '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
                } else if (scanBuffer.length > 1 && !allSame) {
                    // 一致しない結果があった場合、最新の結果だけを残してバッファをリセット
                    scanBuffer = [result.text];
                    resultElement.innerHTML = `
                        <p><strong>スキャン中:</strong> ${result.text}</p>
                        <p><strong>フォーマット:</strong> ${result.format}</p>
                        <p><strong>読み取り回数:</strong> ${scanBuffer.length}/${requiredMatches} (リセット)</p>
                    `;
                }
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
        // スキャンバッファをクリア
        scanBuffer = [];
        document.getElementById('result').innerHTML = '<p>スキャンを停止しました。再開するには「スキャン開始」ボタンを押してください。</p>';
    }

    // スキャンリセット関数
    function resetScanning() {
        codeReader.reset();
        // スキャンバッファをクリア
        scanBuffer = [];
        // 現在選択されているフォーマットで再初期化
        initBarcodeReader();
        document.getElementById('result').innerHTML = '<p>スキャン結果がここに表示されます</p>';
    }

    // ページ離脱時にリソースを解放
    window.addEventListener('beforeunload', function() {
        codeReader.reset();
    });
});
