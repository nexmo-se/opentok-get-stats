var apiKey = "46501052";
var sessionId =
  "2_MX40NjUwMTA1Mn5-MTYwNzUxNzA0MzI0OX5mbzFOY044MTNIUE9nR25UMVluVzNyc21-fg";
var token =
  "T1==cGFydG5lcl9pZD00NjUwMTA1MiZzaWc9ZDIyMmQ0N2IyMmI4YWRjZDE0MDBmN2I3OTYyZDc4MmJhMTY5Zjc4MTpzZXNzaW9uX2lkPTJfTVg0ME5qVXdNVEExTW41LU1UWXdOelV4TnpBME16STBPWDVtYnpGT1kwNDRNVE5JVUU5blIyNVVNVmx1VnpOeWMyMS1mZyZjcmVhdGVfdGltZT0xNjA3NTE3MDU1Jm5vbmNlPTAuODc1NTQwNjk2NjQwMzA1OSZyb2xlPXB1Ymxpc2hlciZleHBpcmVfdGltZT0xNjEwMTA5MDU0JmluaXRpYWxfbGF5b3V0X2NsYXNzX2xpc3Q9";
var publisher;

import getStatsResult from "./getStats";

function handleError(error) {
  if (error) {
    console.error(error);
  }
}

function initializeSession() {
  var session = OT.initSession(apiKey, sessionId, {});

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
  if (!publisher) {
    getStatsResult(publisher);
  }
}

document.getElementById("get-stats").addEventListener("click", runStats);

if (apiKey && sessionId && token) {
  initializeSession();
} else {
  // Make an Ajax request to get the OpenTok API key, session ID, and token from the server
  console.log("Error - Credentials not valid");
}
