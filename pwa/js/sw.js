if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/pwa/js/service-worker.js', { scope: '/pwa/js/' })
  .then(function(reg) {
    console.log('登録に成功しました。 Scope は ' + reg.scope);
  }).catch(function(error) {
    console.log('登録に失敗しました。' + error);
  });
}
