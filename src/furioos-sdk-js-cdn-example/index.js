
const { Player, FS_SDK_EVENTS_NAME, FS_QUALITY_VALUES } = window.furioos;

//const SHARED_LINK = 'XwnDTGrmeyGb7PGkD'; // localhost:8080
//const SHARED_LINK = 'H7qGiqN6xgSaiQECt'; // 192.168...
const SHARED_LINK = '8YchpkybGg4u4pukR'; // thankful-bay

// CONF
const player = new Player(SHARED_LINK, 'furioos_container', {
  whiteLabel: true,
  hideTitle: true,
  hideToolbar: false,
  hidePlayButton: false,
  debugAppMode: false,
});

document.getElementById('button_setUserActive').addEventListener("click", () => {
  console.log("Call setUserActive");
  player.setUserActive();
});

document.getElementById('button_maximize').addEventListener("click", () => {
  console.log("Call maximize");
  //player.maximize();

  if (document.fullscreenEnabled && !isFullscreen()) {
    console.log("maximize() called");

    const container = document.getElementById('furioos-container');
    container.requestFullscreen().catch(err => {
      alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
    });
  }
});

function isFullscreen() {
  return false;
  //return document.fullscreenElement != null;
}

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

document.getElementById('button_minimize').addEventListener("click", () => {
  console.log("Call minimize");
  player.minimize();
});

let value = 1;
document.getElementById('button_sendSDKMessage').addEventListener("click", () => {
  console.log("SDK Example: Call sendSDKMessage", new Date());
  player.sendSDKMessage({
    uniqueName: "Test",
    value: ++value
  });
});

document.getElementById('button_getServerAvailability').addEventListener("click", () => {
  console.log("Call getServerAvailability");
  player.getServerAvailability((data) => {
    console.log("Response getServerAvailability", data);
  }, (error) => {
    console.log("ERROR getServerAvailability", error);
  });
});

document.getElementById('button_start').addEventListener("click", () => {
  console.log("Call start");
  player.start()
});

document.getElementById('button_stop').addEventListener("click", () => {
  console.log("Call stop");
  player.stop()
});

document.getElementById('button_restartStream').addEventListener("click", () => {
  console.log("Call restart stream");
  player.restartStream()
});

document.getElementById('button_setThumb').addEventListener("click", () => {
  console.log("Call setThumb");
  player.setThumbnailUrl("https://images.unsplash.com/photo-1599499462686-3ed0badee8c3?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=3302&q=80");
});

document.getElementById('button_getServerMetadata').addEventListener("click", () => {
  console.log("Call getServerMetadata");
  player.getServerMetadata((data) => {
    console.log("Response getServerMetadata", data);
  }, (error) => {
    console.log("ERROR getServerMetadata", error);
  });
});

document.getElementById('button_quality_auto').addEventListener("click", () => {
  player.setQuality(FS_QUALITY_VALUES.AUTO);
});
document.getElementById('button_quality_low').addEventListener("click", () => {
  player.setQuality(FS_QUALITY_VALUES.LOW);
});
document.getElementById('button_quality_medium').addEventListener("click", () => {
  player.setQuality(FS_QUALITY_VALUES.MEDIUM);
});
document.getElementById('button_quality_high').addEventListener("click", () => {
  player.setQuality(FS_QUALITY_VALUES.HIGH);
});

var slider = document.getElementById('volume_range');
slider.oninput = function() {
  console.log('volume', this.value/100);
  player.setVolume(this.value/100);
}

// EVENTS
player.on(FS_SDK_EVENTS_NAME.LOAD, () => {
  console.info("Do something on load");
});

player.on(FS_SDK_EVENTS_NAME.ON_STATS, (stats) => {
  //console.log("SDK client FIRED: Stats received", stats);
});

// Bind SDK messages
player.on(FS_SDK_EVENTS_NAME.ON_SDK_MESSAGE, function (data) {
  console.log("SDK Message Received:", data);
});

// Bind application install progress
player.on(FS_SDK_EVENTS_NAME.ON_APP_INSTALL_PROGRESS, function (value) {
  console.log("SDK client FIRED: App install progress", value);
});

// Bind application install success
player.on(FS_SDK_EVENTS_NAME.ON_APP_INSTALL_SUCCESS, function () {
  console.log("SDK client FIRED: App install success");
});

// Bind application install fail
player.on(FS_SDK_EVENTS_NAME.ON_APP_INSTALL_FAIL, function () {
  console.log("SDK client FIRED: App install fail");
});

// Bind application start
player.on(FS_SDK_EVENTS_NAME.ON_APP_START, function () {
  console.log("SDK client FIRED: App start");
});

// Bind stream start
player.on(FS_SDK_EVENTS_NAME.ON_STREAM_START, function () {
  console.log("SDK client FIRED: Stream start");
});

// Bind user active
player.on(FS_SDK_EVENTS_NAME.ON_USER_ACTIVE, function () {
  console.log("SDK client FIRED: User Active");
});

// Bind user inactive
player.on(FS_SDK_EVENTS_NAME.ON_USER_INACTIVE, function () {
  console.log("SDK client FIRED: User Inactive");
});

// Bind session stoppeds
player.on(FS_SDK_EVENTS_NAME.ON_SESSION_STOPPED, function () {
  console.log("SDK client FIRED: Session Stopped");
});

player.on(FS_SDK_EVENTS_NAME.ON_CRASH_APP, (data) => {
  console.warn("SDK client FIRED: crash app", data);
});

player.on(FS_SDK_EVENTS_NAME.ON_RESUME_SESSION, (data) => {
  console.warn("SDK client FIRED: session can be resumed", data);
});
