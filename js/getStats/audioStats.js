const TIME_WINDOW = 3; //3 seconds
const TIME_SPAN_AUDIO_TEST = 20;

import {
  CHECK_AUDIO_QUALITY_BANDWIDTH_TOO_LOW,
  CHECK_VIDEO_QUALITY_AUDIO_ONLY,
} from "./constants";

function AudioStats() {
  this.startTestTime = 0;
  this.prevAudioTimestamp = 0;
  this.prevAudioPacketsLost = 0;
  this.prevAudioPacketsRcvd = 0;
  this.prevAudioBytes = 0;
  this.audioPLRatio = 0;
  this.audioBw = 0;
  this.audioOnlyThreshold = 25e3;
  this.audioPLThreshold = 0.05;
  this.runInterval = null;
  this.runIntervalTimeout = 1000;
  this.testDone = false;
  this.result = null;

  function run(publisher) {
    return new Promise((resolve) => {
      this.runInterval = setInterval(()=>{
        if (!this.testDone) {
          if (this.startTestTime === 0) {
            this.startTestTime = Date.now() / 1000;
          }
          await this.checkAudioStats(publisher);
          const now = Date.now() / 1000;
          // After 20 seconds start the Audio Test
          if (now - this.startTestTime > TIME_SPAN_AUDIO_TEST) {
            this.result = this.checkAudioQuality();
            clearInterval(this.runInterval);
            resolve(this.result);
          }
        } else {
          clearInterval(this.runInterval);
          resolve(this.result);
        }
      }, this.runIntervalTimeout)  
    });
  }

  async function checkAudioStats(publisher) {
    let audioTimestamp = Date.now() / 1000;
    if (!publisher) {
      return;
    }
    return new Promise((resolve, reject) => {
      const stats = publisher.getStats((err, stats) => {
        if (err) {
          return reject(err);
        }
        console.log("Stats", stats);
        if (this.prevAudioTimestamp === 0) {
          this.prevAudioTimestamp = audioTimestamp;
          this.prevAudioBytes = stats.audioBytesReceived;
        }
        if (audioTimestamp - this.prevAudioTimestamp >= TIME_WINDOW) {
          //calculate audio packets lost ratio
          if (this.prevAudioPacketsRcvd !== 0) {
            const pl = stats.audioPacketsLost - this.prevAudioPacketsLost;
            let pr = stats.audioPacketsReceived - this.prevAudioPacketsRcvd;
            let pt = pl + pr;

            if (pt > 0) {
              this.audioPLRatio = pl / pt;
            }
          }

          this.prevAudioPacketsLost = stats.audioPacketsLost;
          this.prevAudioPacketsRcvd = stats.audioPacketsReceived;

          //calculate audio bandwidth
          this.audioBw =
            (8 * (stats.audioBytesReceived - this.prevAudioBytes)) /
            (audioTimestamp - this.prevAudioTimestamp);

          this.prevAudioTimestamp = audioTimestamp;
          this.prevAudioBytes = stats.audioBytesReceived;
          console.log("checkAudioStats", this.audioBw);
          resolve();
        }
      });
    });
  }

  function checkAudioQuality() {
    this.testDone = true;
    if (
      this.audioBw < this.audioOnlyThreshold ||
      this.audioPLRatio > this.audioPLThreshold
    ) {
      return {
        result: CHECK_AUDIO_QUALITY_BANDWIDTH_TOO_LOW,
      };
    } else {
      return {
        result: CHECK_VIDEO_QUALITY_AUDIO_ONLY,
      };
    }
  }

  return {
    result: this.result,
    init,
  };
}
