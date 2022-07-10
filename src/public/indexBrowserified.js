(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var SDKDebug = require("./SDKDebug.js");

const _constructorParams = function(shareId, containerId, options) {
  // Share Id.
  if (!shareId || typeof shareId != "string") {
    return false;
  }

  // Container
  if (!containerId || typeof containerId != "string") {
    return false;
  }

  return true;
}

const _eventNames = {
  LOAD: "load",
  ERROR: "error",
  START: "start",
  STOP: "stop",
  MAXIMIZE: "maximize",
  MINIMIZE: "minimize",
  QUALITY: "quality",
  RESTART_STREAM: "restartStream",
  ON_SDK_MESSAGE: "onSDKMessage",
  SEND_SDK_MESSAGE: "sendSDKMessage",
  SET_LOCATION: "setLocation",
  ON_USER_ACTIVE: "onUserActive",
  ON_USER_INACTIVE: "onUserInactive",
  ON_SESSION_STOPPED: "onSessionStopped",
  ON_STATS: "onStats",
  GET_SERVER_AVAILABILITY: "getServerAvailability",
  GET_SERVER_METADATA: "getServerMetadata",
  SET_THUMBNAIL_URL: "setThumbnailUrl",
  ON_APP_INSTALL_PROGRESS: "onAppInstallProgress",
  ON_APP_INSTALL_SUCCESS: "onAppInstallSuccess",
  ON_APP_INSTALL_FAIL: "onAppInstallFail",
  ON_APP_START: "onAppStart",
  ON_STREAM_START: "onStreamStart",
};

const _qualityValues = {
  AUTO: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  ULTRA: 4,
}

const _regions = {
  EUW: [52.1326, 5.2913],
  USW: [47.751076, -120.740135],
  USE: [37.926868, -78.024902],
  AUE: [-33.865143, 151.2099]
}

let _furioosServerUrl = "https://portal.furioos.com";

module.exports = class Player {
  static get qualityValues() { return _qualityValues };
  static get regions() { return _regions };

  constructor(sharedLinkID, containerId, options) {
    if (!_constructorParams(sharedLinkID, containerId, options)) {
      throw "Bad parameters";
    }

    if (sharedLinkID.indexOf("?") > 0) {
      // Remove URL parameters, should use the options for parameters.
      sharedLinkID = sharedLinkID.split("?")[0];
    }

    if (options.overridedURL) {
      _furioosServerUrl = options.overridedURL;
    } 

    sharedLinkID = _furioosServerUrl + "/embed/" + sharedLinkID;

    // If there are options, treat those who change the url.
    let debugAppMode = false;
    if (options) {
      let prefix = "?";
      if (options.whiteLabel) {
        sharedLinkID += prefix + "whiteLabel=true";
        prefix = "&";
      }

      if (options.hideToolbar) {
        sharedLinkID += prefix + "hideToolbar=true";
        prefix = "&";
      }

      if (options.hideTitle) {
        sharedLinkID += prefix + "hideTitle=true";
        prefix = "&";
      }

      if (options.hidePlayButton) {
        sharedLinkID += prefix + "hidePlayButton=true";
        prefix = "&";
      }

      if (options.debugAppMode) {
        // Local debug the SDK communication with your app.
        debugAppMode = true;

        const container = document.getElementById(containerId);
        container.innerText = "You are currently debugging locally your app. There is not stream here. Open console to see logs";

        const serverAddress = options.wsServerAddress ? options.wsServerAddress + ":8081" : "127.0.0.1:8081"
        this.sdkDebug = new SDKDebug(serverAddress);

        this.sdkDebug.onReady = () => {
          // Here you know when the WS connection with your application is ready.
          this.loaded = true;
          if (this._onLoadCallback) {
            this._onLoadCallback();
          }
        };
      
        this.sdkDebug.onSDKMessage((data) => {
          // Here you can manage the received data.
          if (this._onSDKMessageCallback) {
            this._onSDKMessageCallback(data);
          }
        });
      }
    }

    // Create the iframe into the given container.
    this.loaded = false;
    this.debugAppMode = debugAppMode;
    this.sharedLink = sharedLinkID;
    this.containerId = containerId;
    this.options = options;

    if (!debugAppMode) {
      this.embed = this._createIframe();
    } 
  }

  ///////////////////////
  /// PRIVATE METHODS ///
  ///////////////////////

  _createIframe() {
    const container = document.getElementById(this.containerId);

    if (!container) {
      throw "Cannot find the container";
    }

    // Create the iframe element.
    const iframe = document.createElement("iframe");
    iframe.setAttribute("src", this.sharedLink);
    iframe.setAttribute("id", "furioos-sdk-iframe");
    iframe.setAttribute("allow", "autoplay; fullscreen");
    
    iframe.style.width = "100%";
    iframe.style.height = "100%";

    container.appendChild(iframe);

    iframe.onload = this._onLoad.bind(this);

    return iframe;
  }

  _displayErrorMessage(message) {
    const container = document.getElementById(this.containerId);

    const div = document.createElement("div");
    div.innerText = message;

    container.innerHTML = "";
    container.appendChild(div);
  }

  _onLoad() {
    // Bind listener for the messages.
    window.addEventListener("message", (e) => {
      switch(e.data.type) {
        case _eventNames.LOAD:
          // When the player is loaded: Set the default setted location (if setted).
          if (this.location) {
            if (!this.embed.contentWindow) {
              // Wait the window is reachable.
              setTimeout(() => {
                this.embed.contentWindow.postMessage({ type: _eventNames.SET_LOCATION, value: this.location }, _furioosServerUrl);
              }, 100);
            }
            else {
              this.embed.contentWindow.postMessage({ type: _eventNames.SET_LOCATION, value: this.location }, _furioosServerUrl);
            }
          }
          
          this.loaded = true;

          if (this._onLoadCallback) {
            this._onLoadCallback();
          }
          return;
        case _eventNames.ON_SDK_MESSAGE:
          if (this._onSDKMessageCallback) {
            this._onSDKMessageCallback(e.data.value);
          }
          return;
        case _eventNames.ON_USER_ACTIVE:
          if (this._onUserActiveCallback) {
            this._onUserActiveCallback();
          }
          return;
        case _eventNames.ON_USER_INACTIVE:
          if (this._onUserInactiveCallback) {
            this._onUserInactiveCallback();
          }
          return;
        case _eventNames.ON_APP_INSTALL_PROGRESS:
          if (this._onAppInstallProgress) {
            this._onAppInstallProgress(e.data.value);
          }
          return;
        case _eventNames.ON_APP_INSTALL_SUCCESS:
          if (this._onAppInstallSuccess) {
            this._onAppInstallSuccess();
          }
          return;
        case _eventNames.ON_APP_INSTALL_FAIL:
          if (this._onAppInstallFail) {
            this._onAppInstallFail();
          }
          return;
        case _eventNames.ON_APP_START:
          if (this._onAppStart) {
            this._onAppStart();
          }
          return;
        case _eventNames.ON_STREAM_START:
          if (this._onStreamStart) {
            this._onStreamStart();
          }
          return;
        case _eventNames.ON_SESSION_STOPPED:
          if (this._onSessionStoppedCallback) {
            this._onSessionStoppedCallback();
          }
          return;
        case _eventNames.ON_STATS:
          if (this._onStatsCallback) {
            this._onStatsCallback(JSON.parse(e.data.value));
          }
          return;
        case _eventNames.GET_SERVER_AVAILABILITY:
          const response = e.data.value;

          if (response.error) {
            console.log("Error getting server availability", response.error);
            if (this._getServerAvailabilityErrorCallback) {
              this._getServerAvailabilityErrorCallback(response.error);
            }

            return;
          }

          if (!this._getServerAvailabilityCallback) {
            console.log("No success callback binded !");
            return;
          }
          
          this._getServerAvailabilityCallback(response.stats);
          return;
        case _eventNames.GET_SERVER_METADATA:
          const res = e.data.value;

          if (res.error) {
            console.log("Error getting server metadata", res.error);
            if (this._getServerMetadataErrorCallback) {
              this._getServerMetadataErrorCallback(res.error);
            }

            return;
          }

          if (!this._getServerMetadataCallback) {
            console.log("No success callback binded !");
            return;
          }
          
          this._getServerMetadataCallback(res.metadata);
          return;
        case _eventNames.ERROR:
          this._displayErrorMessage(e.data.value);
          return;
      }
    });
  }

  ////////////////////////
  /////// GETTERS ////////
  ////////////////////////

  get quality() {
    switch(this.quality) {
      case _qualityValues.AUTO:
        return "AUTO";

      case _qualityValues.LOW:
        return "LOW";

      case _qualityValues.MEDIUM:
          return "MEDIUM";

      case _qualityValues.HIGH:
          return "HIGH";

      case _qualityValues.ULTRA:
          return "ULTRA";
    }
  }

  ////////////////////////
  //// PUBLIC METHODS ////
  ////////////////////////
  // Binding onload callback.
  onLoad(onLoadCallback) {
    this._onLoadCallback = onLoadCallback;
  }

  setDefaultLocation(location) {
    this.location = location;

    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No setDefaultLocation in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ type: _eventNames.SET_LOCATION, value: this.location }, _furioosServerUrl);
  } 

  start(location) {
    if (!location) {
      location = this.location;
    }  

    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No start in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ type: _eventNames.START, value: location }, _furioosServerUrl);
  }

  stop() {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No stop in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ type: _eventNames.STOP }, _furioosServerUrl);
  }

  maximize() {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No maximize in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ type: _eventNames.MAXIMIZE }, _furioosServerUrl);
  }

  minimize() {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No minimize in debug mode")
      return; // Not loaded.
    }
    
    this.embed.contentWindow.postMessage({ type: _eventNames.MINIMIZE }, _furioosServerUrl);
  }

  setQuality(value) {
    // Test if the value is correct.
    if (value != _qualityValues.LOW 
      && value != _qualityValues.MEDIUM
      && value != _qualityValues.HIGH
      && value != _qualityValues.ULTRA) 
    {
      throw "Bad parameter: The quality should be one of the given value in Player.qualityValues";
    }

    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No setQuality in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ 
      type: _eventNames.QUALITY,
      value: value
    }, _furioosServerUrl);

    this.quality = value;
  }

  restartStream() {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No restartStream in debug mode")
      return; // Not loaded.
    }
    
    this.embed.contentWindow.postMessage({ type: _eventNames.RESTART_STREAM }, _furioosServerUrl);
  }

  // SDK
  onSDKMessage(onSDKMessageCallback) {
    this._onSDKMessageCallback = onSDKMessageCallback;
  }

  onUserActive(onUserActiveCallback) {
    this._onUserActiveCallback = onUserActiveCallback;
  }

  onUserInactive(onUserInactiveCallback) {
    this._onUserInactiveCallback = onUserInactiveCallback;
  }

  onAppInstallProgress(onAppInstallProgress) {
    this._onAppInstallProgress = onAppInstallProgress;
  }

  onAppInstallSuccess(onAppInstallSuccess) {
    this._onAppInstallSuccess = onAppInstallSuccess;
  }

  onAppInstallFail(onAppInstallFail) {
    this._onAppInstallFail = onAppInstallFail;
  }

  onAppStart(onAppStart) {
    this._onAppStart = onAppStart;
  }

  onStreamStart(onStreamStart) {
    this._onStreamStart = onStreamStart;
  }

  onSessionStopped(onSessionStoppedCallback) {
    this._onSessionStoppedCallback = onSessionStoppedCallback;
  }

  onStats(callback) {
    this._onStatsCallback = callback;
  }

  sendSDKMessage(data) {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (typeof data == "object") {
      data = JSON.stringify(data);
    }
    
    if (this.debugAppMode) {
      this.sdkDebug.sendSDKMessage(data);
      return;
    }

    this.embed.contentWindow.postMessage({ 
      type: _eventNames.SEND_SDK_MESSAGE,
      value: data,
    }, _furioosServerUrl);
  }

  setUserActive() {
    this.sendSDKMessage({ "userActive": true });
  }

  setThumbnailUrl(thumbnailUrl) {
    if (!this.loaded) {
      return; // Not loaded.
    } 

    if (this.debugAppMode) {
      console.log("No setThumbnailUrl in debug mode")
      return; // Not loaded.
    }

    this.embed.contentWindow.postMessage({ type: _eventNames.SET_THUMBNAIL_URL, value: thumbnailUrl }, _furioosServerUrl);
  } 

  getServerAvailability(getServerAvailabilityCallback, getServerAvailabilityErrorCallback) {
    if (!this.loaded) {
      return; // Not loaded.
    }

    if (this.debugAppMode) {
      console.log("No getServerAvailability in debug mode")
      return; // Not loaded.
    }

    this._getServerAvailabilityCallback = getServerAvailabilityCallback;
    this._getServerAvailabilityErrorCallback = getServerAvailabilityErrorCallback;

    // Call the get.
    this.embed.contentWindow.postMessage({ type: _eventNames.GET_SERVER_AVAILABILITY }, _furioosServerUrl);
    // The response will be treat in the listener below.
  }

  getServerMetadata(getServerMetadataCallback, getServerMetadataErrorCallback) {
    if (!this.loaded) {
      return; // Not loaded.
    }

    if (this.debugAppMode) {
      console.log("No getServerMetadata in debug mode")
      return; // Not loaded.
    }

    this._getServerMetadataCallback = getServerMetadataCallback;
    this._getServerMetadataErrorCallback = getServerMetadataErrorCallback;

    // Call the get.
    this.embed.contentWindow.postMessage({ type: _eventNames.GET_SERVER_METADATA }, _furioosServerUrl);
    // The response will be treat in the listener below.
  }
}

},{"./SDKDebug.js":2}],2:[function(require,module,exports){
module.exports = class SDKDebug {
  constructor(localServerAddress) {
    if (!localServerAddress) {
      throw "Bad parameters";
    }

    // Init WS connection.
    this.ws = new WebSocket("ws://" + localServerAddress);
    this.ws.binaryType = 'arraybuffer';
    this.ws.onerror = (event) => {this._wsOnError(event)};
    this.ws.onclose = (event) => {this._wsOnClose(event);}
    this.ws.onmessage = (event) => {this._wsOnMessage(event);}
    this.ws.onopen = () => {
      console.log("WS connected to: ", localServerAddress);
      if (this.onReady) {
        this.onReady()
      }
    };
  }

  ///////////////////////
  /// PRIVATE METHODS ///
  ///////////////////////
  _wsOnError(event) {
    console.error("WS Error", event);
  }

  _wsOnClose(event) {
    console.error("WS Close", event);
  }

  _wsOnMessage(event) {
    const msg = JSON.parse(event.data);
    if (msg.type == "furioos" && msg.task == "sdk") {
      this._onSDKMessageCallback(JSON.parse(msg.data));
    }
  }

  _wsOnSendError(event) {
    console.error("WS send error", event);
  }

  ////////////////////////
  //// PUBLIC METHODS ////
  ////////////////////////

  // Binding onload callback.
  // SDK
  onSDKMessage(onSDKMessageCallback) {
    this._onSDKMessageCallback = onSDKMessageCallback;
  }

  sendSDKMessage(data) {
    if (!this.ws || this.ws.readyState != WebSocket.OPEN) {
      console.log("Cannot send message, ws connection not open");
      return; // Not loaded.
    } 

    const parsedData = {
      type: "furioos",
      task: "sdk",
      data: data
    }

    this.ws.send(JSON.stringify(parsedData),this._wsOnSendError);
  }
}
},{}],3:[function(require,module,exports){
var Player = require("./classes/Player.js");

module.exports = {
  Player
}
},{"./classes/Player.js":1}],4:[function(require,module,exports){
console.log('START');

const SDK = require("furioos-sdk");
const Player = SDK.Player;
let isLoaded = false;
let isSocketConnected = false;


// Change this in order to point the Furioos player to a different build.
// The value comes from the Share -> SDK settings of a Furioos build.
const sdkLinkCode = 'XwnDTGrmeyGb7PGkD';
//XwnDTGrmeyGb7PGkD

// CONF
const player = new Player(sdkLinkCode, 'furioos-container', {
  whiteLabel: true,
  hideTitle: true,
  hidePlayButton: false
  // debugAppMode: true, // Uncomment for debugging with local Unity play mode and set the "FURIOOS_DEBUG" define in Unity player settings
  // overridedURL: 'http://localhost:8080'
});

const iframe = document.getElementById('furioos-sdk-iframe');
if (!player.debugAppMode) {
  iframe.style.position = "absolute";
  iframe.style.borderWidth = "0px";
  iframe.style.top = "0px";
  iframe.style.left = "0px";
  iframe.style.bottom = "0px";
  iframe.style.right = "0px";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.position = "absolute";
} else {
  console.log("RUNNING IN DEBUG MODE");
}

function isFullscreen() {
  return document.fullscreenElement != null;
}

function sendMaximizeMessage() {
  if (isSocketConnected) {
    console.log('Sent: "Maximize"', new Date());
    player.sendSDKMessage("Maximize");
  }
}

function sendMinimizeMessage() {
  if (isSocketConnected) {
    console.log('Sent: "Minimize"', new Date());
    player.sendSDKMessage("Minimize");
  }
}

function maximize() {
  if (document.fullscreenEnabled && !isFullscreen()) {
    console.log("maximize() called");

    const container = document.getElementById('furioos-container');
    container.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  }
}

function minimize() {
  if (document.fullscreenEnabled && isFullscreen()) {
    console.log("minimize() called");

    document.exitFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  }
}

document.getElementById('button-start').addEventListener("click", () => {
  console.log('button-start click');
  if (isLoaded) {
    console.log("starting");

    maximize();
  
    player.start();

    const loader = document.getElementById('loading-spinner');
    loader.style.visibility = 'visible';
    const startButton = document.getElementById('button-start');
    startButton.style.visibility = 'hidden';
  }
});

// Allows fullscreen to be properly escaped by browser controls such as ESC or browser-specific GUI
addEventListener('fullscreenchange', event => { 
  if (isFullscreen()) { // Changed to fullscreen
    const container = document.getElementById('furioos-container');
    var cover = document.getElementById('cover');
    container.appendChild(cover);
    // Call to ensure in-app UI is updated if browser controls are used to maximize
    sendMaximizeMessage();
  } else { // Changed to minimized
    const container = document.getElementById('vae-embed-container');
    var cover = document.getElementById('cover');
    container.appendChild(cover);
    // Call to ensure in-app UI is updated if browser controls are used to minimize
    sendMinimizeMessage();
  }
});

/////////////////////////////////////////////
// Player State Callbacks

player.onLoad(() => {
  console.info("Do something on load");
  isLoaded = true;

  const startButton = document.getElementById('button-start');
  startButton.style.visibility = 'visible';

  const loader = document.getElementById('loading-spinner');
  loader.style.visibility = 'hidden';

  maximize();
  
  player.start();
});

player.onStats((stats) => {
  //console.log("SDK client FIRED: Stats received", stats);
});

// Bind SDK messages
player.onSDKMessage(function(data) {
  console.log("SDK Message Received:", data);
  if (data == "VAE Started") {
    var cover = document.getElementById('cover');
    cover.style.visibility = 'hidden';
    const loader = document.getElementById('loading-spinner');
    loader.style.visibility = 'hidden';

    isSocketConnected = true;
    // If we start maximized then updated the in-app fullscreen button to reflect this
    if (isFullscreen()) {
      sendMaximizeMessage();
    }

  } else if (data == "Maximize") {
    maximize();
  } else if (data == "Minimize") {
    minimize();
  }
  else if (data == "ExtendSession") {
    gtag('event', 'extend_session');
  }
});

// Bind application install progress
player.onAppInstallProgress(function(value) {
  console.log("SDK client FIRED: App install progress", value);
});

// Bind application install success
player.onAppInstallSuccess(function() {
  console.log("SDK client FIRED: App install success");
});

// Bind application install fail
player.onAppInstallFail(function() {
  console.log("SDK client FIRED: App install fail");
});

// Bind application start
player.onAppStart(function() {
  console.log("SDK client FIRED: App start");
});

// Bind stream start
player.onStreamStart(function() {
  console.log("SDK client FIRED: Stream start");
});

// Bind user active
player.onUserActive(function() {
  console.log("SDK client FIRED: User Active");
});

// Bind user inactive
player.onUserInactive(function() {
  console.log("SDK client FIRED: User Inactive");
});

// Bind session stoppeds
player.onSessionStopped(function() {
  console.log("SDK client FIRED: Session Stopped");
});

/////////////////////////////////////////////
// Debug Buttons

// document.getElementById('button_setUserActive').addEventListener("click", () => {
//   console.log("Call setUserActive");
//   player.setUserActive();
// });

// document.getElementById('button_getServerAvailability').addEventListener("click", () => {
//   console.log("Call getServerAvailability");
//   player.getServerAvailability((data) => {
//     console.log("Response getServerAvailability", data);
//   }, (error) => {
//     console.log("ERROR getServerAvailability", error);
//   });
// });

// document.getElementById('button_callmaximize').addEventListener("click", () => {
//   console.log("Call maximize");
//   //player.maximize();
//   sendMaximizeMessage();
// });

// document.getElementById('button_minimize').addEventListener("click", () => {
//   console.log("Call minimize");
//   //player.minimize();
//   sendMinimizeMessage();
// });

// document.getElementById('button_setThumb').addEventListener("click", () => {
//   console.log("Call setThumb");
//   player.setThumbnailUrl("https://images.unsplash.com/photo-1599499462686-3ed0badee8c3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=3302&q=80");
// });

// document.getElementById('button_getServerMetadata').addEventListener("click", () => {
//   console.log("Call getServerMetadata");
//   player.getServerMetadata((data) => {
//     console.log("Response getServerMetadata", data);
//   }, (error) => {
//     console.log("ERROR getServerMetadata", error);
//   });
// });
},{"furioos-sdk":3}]},{},[4]);
