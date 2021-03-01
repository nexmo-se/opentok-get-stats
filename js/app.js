var apiKey = "";
var sessionId = "";
var token = "";
var publisher;
let runInternal = null;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId, {});
  publisher = OT.initPublisher("publisher", { resolution: "1280x720" });

  session.on("streamCreated", function streamCreated(event) {
    var subscriberOptions = {
      insertMode: "append",
      width: "100%",
      height: "100%",
    };
    session.subscribe(
      event.stream,
      "subscriber",
      subscriberOptions,
      handleError
    );
  });

  function updateSessionStatus(status) {
    document.getElementById("session-connection").innerHTML = status;
  }

  session.on("sessionReconnecting", function sessionDisconnected(event) {
    updateSessionStatus("reconnecting");
  });

  session.on("sessionReconnected", function sessionDisconnected(event) {
    updateSessionStatus("connected");
  });

  session.on("sessionDisconnected", function sessionDisconnected(event) {
    updateSessionStatus("disconnected");
  });

  // Connect to the session
  session.connect(token, async function callback(error) {
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      console.log("Connected", publisher);
      updateSessionStatus("connected");
      session.publish(publisher, handleError);
    }
  });
} // todo complete with get-stats // See the config.js file.

function updateStats({ audio, video }) {
  if (audio) {
    document.getElementById("audio-network-status").innerHTML = audio.supported;
    document.getElementById("audio-estimated-bandwidth").innerHTML = Math.round(
      audio.audioBw
    );
    document.getElementById("audio-estimated-pl").innerHTML =
      audio.audioPLRatio;
  }
  if (video) {
    document.getElementById("video-network-status").innerHTML = video.supported;
    document.getElementById("video-estimated-bandwidth").innerHTML = Math.round(
      video.videoBw
    );
    document.getElementById("video-estimated-pl").innerHTML =
      video.videoPLRatio;
  }
}

function runStats() {
  if (publisher) {
    runInternal = setInterval(() => {
      console.log("pubStats - run");
      const aStats = pubStats();
      aStats.run(publisher).then((result) => {
        console.log("GetStats Test done: ", result);
        updateStats({ audio: result.audio, video: result.video });
      });
    }, 2500);
  }
}

function stopStats() {
  clearInterval(runInternal);
}

document.getElementById("get-stats-start").addEventListener("click", runStats);
document.getElementById("get-stats-stop").addEventListener("click", stopStats);

if (apiKey && sessionId && token) {
  initializeSession();
} else {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  console.log("Error - Credentials not valid");
}
