        var app = new Vue({
            el: '#app',
            data :{
                   vLoginid:"",
                   vPassword:"",
                   vInfoUrl:"",
                   vSearchUrl:"",
                   vNoText:"",
                   vJanCode:"",
                   vPName:"",
                   vMName:"",
                
               },
               computed: {
                   isInValidName() {
                        return this.loginid.length < 5
                   },
                   isInValidPhone() {
                       return this.phone.length < 8
                   },
               },
                mounted : function(){
                  console.log('mounted')
                  this.vLoginid = localStorage.getItem('vLoginid');
                  this.vPassword = localStorage.getItem('vPassword');
                  this.vInfoUrl = localStorage.getItem('vInfoUrl');
                  this.vSearchUrl = localStorage.getItem('vSearchUrl');
                  this.vNoText = localStorage.getItem('vNoText');
               },
               methods: {
                submitSetting() {
                   console.log("submit setting");
                   console.log(this.vNoText);
                   if (this.vLoginid === '') return;
                   if (this.vPassword === '') return;
                   localStorage.setItem('vLoginid', this.vLoginid);
                   localStorage.setItem('vPassword', this.vPassword);
                   if (this.vNoText != '') {
                     localStorage.setItem('vNoText', this.vNoText);
                   }
                   if (this.vInfoUrl != '') {
                     localStorage.setItem('vInfoUrl', this.vInfoUrl);
                   }
                   if (this.vSearchUrl != '') {
                     localStorage.setItem('vSearchUrl', this.vSearchUrl);
                   }
                   alert("設定しました");
                },
                clickInfoURL() {
                  var url = localStorage.getItem('vInfoUrl');
                  var lid = localStorage.getItem('vLoginid');
                  var pp = localStorage.getItem('vPassword');
                  var no = localStorage.getItem('vNoText');
                  var accessUrl = url + "?id=" +lid + "&t=" + pp + "&no=" + no;
                  window.location = accessUrl;
                },
                clickSearchURL() {
                  console.log("clickSearchURL");
                  var url = localStorage.getItem('vSearchUrl');
                  var lid = localStorage.getItem('vLoginid');
                  var pp = localStorage.getItem('vPassword');
                  var no = localStorage.getItem('vNoText');
                  var accessUrl = url + "?id=" +lid + "&t=" + pp + "&no=" + no + "&mname=" +"&pname=" ;
                  window.location = accessUrl;
                },
                searchJanCode() {
                  console.log("jan");
                  alert("現在作成中です");
                  return;
                },
              }
              
          });
