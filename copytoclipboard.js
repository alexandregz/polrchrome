var bgscript = chrome.runtime.connect();

bgscript.onMessage.addListener(function(m) {
  var copyFrom = document.createElement("textarea");
  copyFrom.textContent = m.shortURL;

  alert("Url xerada: "+ m.shortURL);

  var body = document.getElementsByTagName('body')[0];
  body.appendChild(copyFrom);
  copyFrom.select();
  document.execCommand('copy');
  body.removeChild(copyFrom);
});
