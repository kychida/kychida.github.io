if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa/js/service-worker.js')
  .then(function(reg) {
    console.log('登録に成功しました。');
  }).catch(function(error) {
    console.log('登録に失敗しました。' + error);
  });
}
