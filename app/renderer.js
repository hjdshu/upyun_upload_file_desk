// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var UPYUN = require('upyun');
var fs = require('fs')
var uuid = require('node-uuid')
var mime = require('mime');
var path = require('path');
var async = require('async');
var Vue = require('./vue')

const {ipcRenderer} = require('electron')
const {isChina, isHaveUnescaped, sameAsOne, alertN, copyString, createLoading, hideLoading} = require('./utils')

// 选择的目标文件夹
var selectFilesPath = window.localStorage.selectFilesPath || ''
if (selectFilesPath) {
  document.getElementById('selected-file').innerHTML = `你已选择: ${selectFilesPath}`
}

ipcRenderer.on('selected-directory', (event, path) => {
  if (isChina(path[0])) {
    alertN('路径不能为中文')
  } else {
    selectFilesPath = path[0]
    window.localStorage.selectFilesPath = selectFilesPath
    document.getElementById('selected-file').innerHTML = `你已选择: ${path}`
  }
})


new Vue({
  el: '#main',
  data () {
    return  {
      up_s_n: '',
      up_o_n: '',
      up_o_p: '',
      logined: false,
      path: '123',
      upyunObj: null,
      listResult: [],
      overwriteVersion: '', //覆盖上传版本号
      resultType: 0 // 默认显示结果类型
    }
  },
  mounted () {
    this.login()
  },
  methods: {
    saveNamePass () {
      if (!this.up_s_n || !this.up_o_n || !this.up_o_p) {
        alert('请完整输入再保存')
        return
      }
      window.localStorage.upyun_service_name = this.up_s_n
      window.localStorage.upyun_operator_name = this.up_o_n
      window.localStorage.upyun_operator_password = this.up_o_p
      this.login()
    },
    login () {
      // 获取缓存的账户密码
      var loginUpy = {}
      if (window.localStorage.upyun_service_name) {
        loginUpy = {
          service_name: window.localStorage.upyun_service_name,
          operator_name: window.localStorage.upyun_operator_name,
          operator_password: window.localStorage.upyun_operator_password
        }
        this.upyunObj = new UPYUN(
          loginUpy.service_name,
          loginUpy.operator_name,
          loginUpy.operator_password
        )
        this.logined = true
      } else {
        this.logined = false
      }
    },
    openFiles () {
      ipcRenderer.send('open-file-dialog')
    },
    copyItem (item) {
      copyString(item)
    },
    startUpload (overwrite) {
      // overwrite 覆盖上传, 文件名称自定义
      let __ = this;
      if (!selectFilesPath) {
        alertN('请先选择目录')
        return
      }
    
      var fileInfos = [];
      var fileDir = selectFilesPath
      var fileArray = fs.readdirSync(fileDir);

      // 如果之前是覆盖上传，现在要变成直接上传的话，清楚数据
      if (__.resultType == 2) {
        __.listResult = []
      }
    
      for (var i = 0; i < fileArray.length; i++) {
        let filePath = fileArray[i];
        let fileFullPath = path.join(fileDir, filePath);
        let fileInfo = path.basename(filePath);
    
        if (isChina(fileFullPath)) {
          alertN('文件名不能包含中文')
          return
        }
    
        if (isHaveUnescaped(fileFullPath)) {
          alertN('文件名不能包含空格')
          return
        }
    
        if (fileFullPath.indexOf('.jpg') >= 0 || fileFullPath.indexOf('.png') >= 0 || fileFullPath.indexOf('.gif') >= 0 || fileFullPath.indexOf('.js') >= 0 || fileFullPath.indexOf('.css') >= 0) {
          if ((!sameAsOne(fileInfo, __.listResult, 'name') && !overwrite) || overwrite) {
            fileInfos.push({
              id: i + 1,
              url: fileFullPath,
              name: fileInfo,
              level: fileInfo
            })
          }
        }
      }
      if(!fileInfos.length){
        alertN('你所选目录内没有新的图片要上传')
        return
      }
      if (overwrite && !this.overwriteVersion) {
        alertN('请先填写覆盖上传版本号')
        return
      }
      createLoading()
      async.mapLimit(fileInfos,
        2,
        function(fileInfo, callback) {
          let filename = '/electron/' + uuid() + '/' + fileInfo.name;
          let now = new Date().getFullYear() + '' + new Date().getMonth() + 1 + '' + new Date().getDate()
          if (overwrite) {
            filename = '/electron/overwrite/' + __.overwriteVersion + '/' + now + '/' + fileInfo.name;
          }
          __.upyunObj.uploadFile(filename,
            fileInfo.url,
            mime.getType(fileInfo.url),
            true, function(err, result) {
              if (err) {
                console.log(err)
                callback(err);
              } else {
                if (result.statusCode !== 200) {
                  console.log(result)
                  callback('上传失败，请检查账户密码是否正确')
                  __.logined = false
                  return
                }
                fileInfo.url = "https://webapp.codoon.com" + filename;
                callback(null, fileInfo);
              }
            })
        },
        function(err, results) {
          hideLoading()
          if (err) {
            alertN(JSON.stringify(err))
            return
          }
          if (overwrite) {
            __.listResult = results
            __.resultType = 2
          } else {
            __.listResult = __.listResult.concat(results)
            __.resultType = 1
          }
      });
    },
    isImg (fileFullPath) {
      if ( fileFullPath.indexOf('.jpg') >= 0 || fileFullPath.indexOf('.png') >= 0 || fileFullPath.indexOf('.gif') >= 0 ){
        return true
      } else {
        return false
      }
    },
    clearResult () {
      this.listResult = []
      this.resultType = 0
    },
    getImgBase (img_url, is_copy) {
      createLoading()
      var img = new Image();
      img.src = img_url;
      img.onload = function (){
        hideLoading()
        if (is_copy) {
          copyString("width: " +  img.width / 2 + "px; \n" + "height: " + img.height / 2 + "px;")
        } else {
          alertN('width:'+img.width+'，height:'+img.height + '；' + img.width / 2 + '，' + img.height / 2, 3000);
        }
      };
    }
  }
})

