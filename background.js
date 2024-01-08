chrome.contextMenus.create({
  id: "shortenpriv",
  title: "Generate private short URL",
  contexts: ["link"]
});

chrome.contextMenus.create({
  id: "shortenpub",
  title: "Generate public short URL",
  contexts: ["link"]
});

chrome.contextMenus.create({
  id: "customEndingPriv",
  title: "Generate private short URL with custom ending",
  contexts: ["link"]
});

chrome.contextMenus.create({
  id: "customEndingPub",
  title: "Generate public short URL with custom ending",
  contexts: ["link"]
});


var portFromCS;

var existsURL;

function connected(p) {
  portFromCS = p;
}

chrome.runtime.onConnect.addListener(connected);

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  switch (info.menuItemId) {
    case "shortenpriv":
      shortenURL(false, info.linkUrl);
      break;
    case "shortenpub":
      shortenURL(true, info.linkUrl);
      break;

    case "customEndingPriv":
      var customEnding = prompt("Custom ending:");
      lookupUrlEnding(customEnding);

      if(!existsURL) shortenURL(true, info.linkUrl, customEnding);
      break;


    case "customEndingPub":
      var customEnding = prompt("Custom ending:");
      lookupUrlEnding(customEnding);

      if(!existsURL) shortenURL(true, info.linkUrl, customEnding);
      break;
  }
});


function lookupUrlEnding(custom_ending) {
  function checkUrl(result) {
    url = result.polrurl+"/api/v2/action/lookup?key="+result.polrapikey.trim()+"&url_ending="+custom_ending;

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);

    xhr.onreadystatechange = function() {
      if (xhr.readyState == 4 && xhr.status == 200) {
          alert("URL previously defined: "+ xhr.responseText);
          existsURL = false;
      }
      else if(xhr.readyState == 4 && xhr.status == 404) {
        alert("podese lanzar...");
        existsURL = true;
      }
    }

    xhr.send();
  }

  chrome.storage.sync.get(["polrurl","polrapikey"], checkUrl);
}



function shortenURL(isPublic, orgURL, custom_ending) {
  function setCurrentSettings(result) {
    if ((!result.polrurl.startsWith("http://") && !result.polrurl.startsWith("https://")) || result.polrapikey == "") {
      var openingPage = chrome.runtime.openOptionsPage();
      return;
    }
    var oReq = new XMLHttpRequest();
    oReq.addEventListener("load", function() {
      var publictext = "private";
      var titleText = "- Short URL";
      var shortURL = this.responseText;
      var bodyText = "The "+publictext+" short URL for "+orgURL+"hast been copied to the clipboard\r\n("+shortURL+")";
      if (!shortURL.startsWith("http://") && !shortURL.startsWith("https://"))
      {
        titleText = "- Error";
        bodyText = "An error ocurred. The server responded: "+shortURL;
      }
      else {
        console.log(portFromCS);
        if(portFromCS) portFromCS.postMessage({shortURL: shortURL});
      }
      if (isPublic) publictext = "public";
      var opt = {
        type: "basic",
        title: "Polrchrome "+titleText,
        message: bodyText,
        iconUrl: chrome.extension.getURL("icons/icon-32.png")
      }
      chrome.notifications.create("polrchrome", opt, function(){});
    });
    oReq.addEventListener("error", function() {
      var opt = {
        type: "basic",
        title: "Polrchrome Error",
        message: "An error ocurred. The server responded: "+this.responseText,
        iconUrl: chrome.extension.getURL("icons/icon-32.png")
      }
      chrome.notifications.create("polrchrome", opt, function(){});
    });

    url = result.polrurl+"/api/v2/action/shorten?key="+result.polrapikey.trim()+"&url="+encodeURIComponent(orgURL);
    if(custom_ending) url+= "&custom_ending="+custom_ending;
    url += "&is_secret="+!isPublic;
    // console.log("url: " + url);

    oReq.open("GET", url);
    oReq.send();  
  }

  function onError(error) {
    console.log(`Error: ${error}`);
  }

  chrome.storage.sync.get(["polrurl","polrapikey"],setCurrentSettings);
}
