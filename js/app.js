

        var app = new Vue({
            el: '#app',
            data :{
                   vLoginid:"",
                   vPassword:"",
                   vBaseUrl:"",
                   vNoText:"",
                   vJanCode:"",
                   vPName:"",
                   vMName:"",
                   errors: [],
                
            },
            mounted : function(){
              console.log('mounted')
              this.vLoginid = localStorage.getItem('vLoginid');
              this.vNoText = localStorage.getItem('vNoText');
              this.vBaseUrl = localStorage.getItem('vBaseUrl');
            },
            methods: {
                submitAccountSetting:function(e) {
                   this.errors = [];
                   if (!this.vLoginid) {
                     this.errors.push('loginid required.');
                   } else {
                    console.log(this.vLoginid.length);
                     if (this.vLoginid.length > 32) {
                       this.errors.push('loginid is longer.');
                     }
                     if (!validLoginId(this.vLoginid)) {
                       this.errors.push('loginid is invalid char.');
                     }
                   }
                   if (!this.vPassword) {
                     this.errors.push('password required.');
                   } else {
                       if (this.vPassword.length > 32) {
                         this.errors.push('password is longer.');
                       }
                       if (!validPassword(this.vPassword)) {
                         this.errors.push('password is invalid char.');
                       }
                   }
                   e.preventDefault();
                   if (this.errors.length > 0) return;
                   localStorage.setItem('vLoginid', this.vLoginid);
                   localStorage.setItem('hashPassword', md5(this.vPassword));
                   alert("アカウント情報を設定しました");
                },
                submitSetting() {
                   console.log("submit url setting");
                   localStorage.setItem('vNoText', this.vNoText);
                   localStorage.setItem('vBaseUrl', this.vBaseUrl);
                   alert("設定しました");
                },
                clickInfoURL() {
                  var accessUrl = this.createUrl("sp/usefulInfo/top") ;
                  if (accessUrl === null) return;
                  window.location = accessUrl;
                },
                clickSearchURL() {
                  var accessUrl = this.createUrl("sp/goods/sname") ;
                  if (accessUrl === null) return;
                  accessUrl = accessUrl + "&pname=" + this.vPName;
                  accessUrl = accessUrl + "&mname=" + this.vMName;
                  window.location = accessUrl;
                },
                searchJanCode() {
                  var accessUrl = this.createUrl("sp/goods/sjan") ;
                  if (accessUrl === null) return;
                  accessUrl = accessUrl + "&jan=" + this.vJanCode;
                  window.location = accessUrl;
                },
                createUrl(substr) {
                  var url = localStorage.getItem('vBaseUrl');
                  var lid = localStorage.getItem('vLoginid');
                  var pp = localStorage.getItem('hashPassword');
                  var no = localStorage.getItem('vNoText');
                  var para ="?id=" +lid + "&t=" + pp + "&no=" + no;
                  console.log(url);
                  console.log(lid);
                  console.log(pp);
                  console.log(no);
                  if (!url || !lid || !pp || !no) {
                    alert("URL、ログイン情報を設定してください");
                    return null;
                  }
                  return url + substr + para;
                },
              }
              
          });

function validLoginId(str) {
  if (str === null || str === undefined) return null;
  const reg = /^[a-zA-Z0-9@_.~-]+$/;
  return reg.test(str);
}

function validPassword(str) {
  if (str === null || str === undefined) return null;
  const reg = /^[a-zA-Z0-9]+$/;
  return reg.test(str);
}