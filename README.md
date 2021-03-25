# opentok-get-stats

Sample code for using [getStats](https://tokbox.com/developer/sdks/js/reference/Publisher.html#getStats) from the Publisher object.

## Parameters

To estimate the bandwidth and packet loss, the test has to run for at least 10-15 seconds, so that the Peer Connection between the device and the media server can stabilised.

On the top of pubStats.js file, there are the following parameters:

| Parameter   |      Description      | 
|----------|:-------------------------------:|
| RUN\_INTERVAL\_TIMEOUT |  The intervals (in milli seconds) on how often to execute the code  | 
| TEST\_TIME\_SPAN |   Running time of the test (in seconds)  | 
| AUDIO\_BW\_THRESHOLD|  Threshold for audio bandwidth  | 
| AUDIO\_PL |  Audio Packet Loss   | 
| VIDEO\_BW\_THRESHOLD | Threshold for video bandwidth    | 
| VIDEO\_PL | Video Packet Loss     | 

Bandwidth and packet loss are taken from [Opentok Bandwidth Rules](https://support.tokbox.com/hc/en-us/articles/360029732311-What-is-the-minimum-bandwidth-requirement-to-use-OpenTok-).


## Code

The get stats code is contained in the `js/pubStats` file. 
The main function is the run function which runs the code to computed bandwith and packet loss values.

Example: 

```
// From your main file: 

function checkNetwork(){
setInterval(() => {
    const aStats = pubStats();
    aStats.run(publisher).then((result) => {
      document.getElementById("network-status").innerHTML = result.message;
    });
  }, 5000);
}


```

The run function computes every X ms the bandwidth and PL values for the audio and video MediaStreams. For example, if you set RUN\_INTERVAL\_TIMEOUT to 500, it will compute the values every 0.5s. To have a consistent result, the test needs to run for an interval of time defined by the TEST\_TIME\_SPAN value. 

Example: `RUN\_INTERVAL\_TIMEOUT=500, TEST\_TIME\_SPAN=3`

The function will compute the values every 500ms for 3 seconds and then return the result.


## Result

The result object is composed by: 

| Parameter   |      Description      | 
|----------|:-------------------------------:|
| video.supported |  Boolean to indicate if the video is supported  | 
| video.videoBw |   Video Bandwidth   | 
| videoPLRatio|  Threshold for audio bandwidth  | 
| audio.supported |  Boolean to indicate if the audio is supported  | 
| audio.audioBw| Threshold for video bandwidth    | 
| audio.audioPLRatio| Video Packet Loss     | 



## Run the project

Set the credentials on the `app.js` file (apikey, sessionId, token). Then, open the `index.html` page and click the `Run Stats` button.

## Heroku Deployment

We use simple PHP server to serve static website, and deploying to Heroku is pretty straightforward

1. Create application on Heroku
2. Link Heroku to your local repo. The command might start with `heroku git:remote -a <your_app_name>`
3. `git push heroku master` or any Heroku push command