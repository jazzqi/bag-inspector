export function openDataURI(title, datauri) {
    var win = window.open()
    win.document.open()
    win.onload = function () {
      win.document.title = title
    }
    win.document.write('<iframe title="' + title + '" src="' + datauri + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>')
    win.document.close()
  }
  