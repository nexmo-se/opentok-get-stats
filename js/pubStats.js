const TIME_WINDOW = 1; // Run test every X time
const TIME_SPAN_AUDIO_TEST = 10;
const CHECK_VIDEO_QUALITY_AUDIO_ONLY = "AUDIO_ONLY";
const CHECK_AUDIO_QUALITY_BANDWIDTH_TOO_LOW = "BANDWIDTH_TOO_LOW";
const AUDIO_VIDEO_SUPPORTED = "AUDIO_VIDEO_SUPPORTED";

// Based on: https://support.tokbox.com/hc/en-us/articles/360029732311-What-is-the-minimum-bandwidth-requirement-to-use-OpenTok-

// I should build the stats for Audio and Video at the same time

function pubStats() {
  this.startTestTime = 0;
  this.prevTimestamp = 0;
  this.prevAudioPacketsLost = 0;
  this.prevAudioPacketsSent = 0;
  this.prevAudioBytes = 0;
  this.audioPLRatio = 0;
  this.audioBw = 0;
  this.audioOnlyThreshold = 25e3; // 25000bps acceptable audio
  this.audioPLThreshold = 0.05;
  this.prevVideoPacketsLost = 0;
  this.prevVideoPacketsSent = 0;
  this.prevVideoBytes = 0;
  this.videoPLRatio = 0;
  this.videoBw = 0;
  this.videoThreshold = 150e3;
  this.videoPLThreshold = 0.03;
  this.runInterval = null;
  this.runIntervalTimeout = 1000;
  this.testDone = false;
  this.result = {};

  const run = (publisher) => {
    return new Promise((resolve) => {
      this.runInterval = setInterval(async () => {
        if (!this.testDone) {
          if (this.startTestTime === 0) {
            this.startTestTime = Date.now() / 1000;
          }
          await checkStats(publisher);
          const now = Date.now() / 1000;
          if (now - this.startTestTime > TIME_SPAN_AUDIO_TEST) {
            checkQuality();
            clearInterval(this.runInterval);
            console.log("Run Result", this.result);
            resolve(this.result);
          }
        } else {
          clearInterval(this.runInterval);
          resolve(this.result);
        }
      }, this.runIntervalTimeout);
    });
  };

  const checkStats = async (publisher) => {
    let nowTimestamp = Date.now() / 1000;
    if (!publisher) {
      return;
    }
    return new Promise((resolve, reject) => {
      publisher.getStats((err, statsArray) => {
        if (err) {
          clearInterval(this.runInterval);
          return reject(err);
        }
        const audioStats = statsArray[0].stats.audio;
        const videoStats = statsArray[0].stats.video;
        if (this.prevTimestamp === 0) {
          this.prevTimestamp = nowTimestamp;
          this.prevAudioBytes = audioStats.bytesSent;
          this.prevVideoBytes = videoStats.bytesSent;
        }
        if (nowTimestamp - this.prevTimestamp >= TIME_WINDOW) {
          //calculate audio packets lost ratio
          if (this.prevAudioPacketsSent !== 0) {
            const audiopl = audioStats.packetsLost - this.prevAudioPacketsLost;
            let audiops = audioStats.packetsSent - this.prevAudioPacketsSent;
            let audiopt = audiopl + audiops;

            if (audiopt > 0) {
              this.audioPLRatio = audiopl / audiopt;
            }
          }
          if (this.prevVideoPacketsSent !== 0) {
            const videopl = videoStats.packetsLost - this.prevVideoPacketsLost;
            let videops = videoStats.packetsSent - this.prevVideoPacketsSent;
            let videopt = videopl + videops;

            if (videopt > 0) {
              this.videoPLRatio = videopl / videopt;
            }
          }

          this.prevAudioPacketsLost = audioStats.packetsLost;
          this.prevAudioPacketsSent = audioStats.packetsSent;
          this.prevVideoPacketsLost = videoStats.packetsLost;
          this.prevVideoPacketsSent = videoStats.packetsSent;

          //calculate audio bandwidth
          this.audioBw =
            (8 * (audioStats.bytesSent - this.prevAudioBytes)) /
            (nowTimestamp - this.prevTimestamp);

          //calculate video bandwidth
          this.videoBw =
            (8 * (videoStats.bytesSent - this.prevVideoBytes)) /
            (nowTimestamp - this.prevTimestamp);

          this.prevTimestamp = nowTimestamp;
          this.prevAudioBytes = audioStats.packetsSent;
          this.prevVideoBytes = videoStats.packetsSent;
          console.log("checkStats - Audio", this.audioBw);
          console.log("checkStats - Video", this.videoBw);
          resolve();
        }
      });
    });
  };

  const checkQuality = () => {
    console.log("audioBw", this.audioBw);
    console.log("audioPLRatio", this.audioPLRatio);
    console.log("videoBw", this.videoBw);
    console.log("videoPLRatio", this.videoPLRatio);
    this.testDone = true;
    this.result = {
      audio: {
        supported: true,
      },
      video: {
        supported: true,
      },
      message: AUDIO_VIDEO_SUPPORTED,
    };
    if (
      this.videoBw < this.videoThreshold ||
      this.videoPLRatio > this.videoPLThreshold
    ) {
      this.result.video.supported = false;
      this.result.message = CHECK_VIDEO_QUALITY_AUDIO_ONLY;
    }
    if (
      this.audioBw < this.audioOnlyThreshold ||
      this.audioPLRatio > this.audioPLThreshold
    ) {
      this.result.audio.supported = false;
      this.result.message = CHECK_AUDIO_QUALITY_BANDWIDTH_TOO_LOW;
    }
  };

  return {
    result: this.result,
    run,
  };
}
