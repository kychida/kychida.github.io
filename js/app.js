        var app = new Vue({
            el: '#app',
            data :{
                   vLoginid:"",
                   vPassword:"",
                   vInfoUrl:"",
                   vSearchUrl:"",
                   vBaseUrl:"",
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
                  this.vBaseUrl = localStorage.getItem('vBaseUrl');
               },
               methods: {
                submitSetting() {
                   console.log("submit setting");
                   if (this.vLoginid === '') return;
                   if (this.vPassword === '') return;
                   localStorage.setItem('vLoginid', this.vLoginid);
                   localStorage.setItem('vPassword', this.vPassword);
                   if (this.vNoText != '') {
                     localStorage.setItem('vNoText', this.vNoText);
                   }
                   if (this.vBaseUrl != '') {
                     localStorage.setItem('vBaseUrl', this.vBaseUrl);
                   }
                   if (this.vInfoUrl != '') {
                     localStorage.setItem('vInfoUrl', this.vInfoUrl);
                   }
                   if (this.vSearchUrl != '') {
                     localStorage.setItem('vSearchUrl', this.vSearchUrl);
                   }
                   if (this.vPassword != '') {
                      localStorage.setItem('hashPassword', md5(this.vPassword));
                   }
                   alert("設定しました");
                },
                clickInfoURL() {
                  var accessUrl = this.createUrl("sp/usefulInfo/top") ;
                  window.location = accessUrl;
                },
                clickSearchURL() {
                  var accessUrl = this.createUrl("sp/goods/sname") ;
                  accessUrl = accessUrl + "&pname=" + this.vPName;
                  accessUrl = accessUrl + "&mname=" + this.vMName;
                  window.location = accessUrl;
                },
                searchJanCode() {
                  var accessUrl = this.createUrl("sp/goods/sjan") ;
                  accessUrl = accessUrl + "&jan=" + this.vJanCode;
                  window.location = accessUrl;
                },
                createUrl(substr) {
                  var url = localStorage.getItem('vBaseUrl');
                  var lid = localStorage.getItem('vLoginid');
                  var pp = localStorage.getItem('hashPassword');
                  var no = localStorage.getItem('vNoText');
                  var para ="?id=" +lid + "&t=" + pp + "&no=" + no;
                  return url + substr + para;
                },
              }
              
          });
