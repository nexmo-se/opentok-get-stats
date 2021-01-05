var apiKey = "";
var sessionId = "";
var token = "";
var publisher;

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId, {});
  publisher = OT.initPublisher("publisher");

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

  session.on("sessionDisconnected", function sessionDisconnected(event) {
    console.log("You were disconnected from the session.", event.reason);
  });

  // Connect to the session
  session.connect(token, async function callback(error) {
    if (error) {
      handleError(error);
    } else {
      // If the connection is successful, publish the publisher to the session
      console.log("Connected", publisher);
      session.publish(publisher, handleError);
    }
  });
} // todo complete with get-stats // See the config.js file.

function runStats() {
  if (publisher) {
    setInterval(() => {
      console.log("pubStats - run");
      const aStats = pubStats();
      aStats.run(publisher).then((result) => {
        console.log("GetStats Test done: ", result);
        document.getElementById("network-status").innerHTML = result.message;
      });
    }, 5000);
  }
}

document.getElementById("get-stats").addEventListener("click", runStats);

if (apiKey && sessionId && token) {
  initializeSession();
} else {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  console.log("Error - Credentials not valid");
}
