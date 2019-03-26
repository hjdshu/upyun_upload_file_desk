function isChina(str){ 
  if(/.*[\u4e00-\u9fa5]+.*$/.test(str)){  
    return true; 
  } 
  return false; 
}

function isHaveUnescaped(str){ 
  if(/ /.test(str)){  
    return true; 
  }
  return false; 
}

function sameAsOne (item, list, key) {
  var as = false
  list.forEach((it) => {
    if (it[key] == item) {
      as = true
    }
  })
  return as
}

function copyString (str) {
  let oInput = document.createElement('input')
  oInput.value = str
  document.body.appendChild(oInput)
  oInput.select()
  document.execCommand("Copy")
  oInput.style.display = 'none'
  document.body.removeChild(oInput)
  alertN('复制成功')
}

function alertN (text, time) {
  var doc = document.createElement('div')
  doc.setAttribute('id', 'singeTipsPop')
  doc.setAttribute('style', "padding:0 20px; height:30px; line-height:30px; text-align:center; position: fixed; top:50%; left:50%; transform: translate3d(-50%, -50%, 0); font-size:13px; z-index:5; background:#222; color: #fff; border-radius:4px; display:inline-block")
  doc.innerHTML = text
  document.body.appendChild(doc)
  setTimeout(() => {
    doc.remove()
  }, time || 1500)
}

function createLoading () {
  var doc = document.createElement('div')
  doc.setAttribute('class', 'loadingTipsPop')
  doc.setAttribute('style', "padding:0 20px; height:30px; line-height:30px; text-align:center; position: fixed; top:50%; left:50%; transform: translate3d(-50%, -50%, 0); z-index:5; background:#222; color: #fff; border-radius:4px; display:inline-block")
  doc.innerHTML = 'loading...'
  document.body.appendChild(doc)
}

function hideLoading () {
  let docs = [].slice.call(document.querySelectorAll('.loadingTipsPop'))
  docs.forEach(function(item){
    item.remove()
  })
}

module.exports = {
  isChina,
  isHaveUnescaped,
  sameAsOne,
  alertN,
  copyString,
  createLoading,
  hideLoading
}
