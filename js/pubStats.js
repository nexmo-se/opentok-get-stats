const RUN_INTERVAL_TIMEOUT = 500; // Run test every X ms
const TEST_TIME_SPAN = 5;
const AUDIO_BW_THRESHOLD = 25e3;
const AUDIO_PL = 0.05;
const VIDEO_BW_THRESHOLD = 150e3;
const VIDEO_PL = 0.03;
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
  this.audioOnlyThreshold = AUDIO_BW_THRESHOLD; // 25000bps acceptable audio
  this.audioPLThreshold = AUDIO_PL;
  this.prevVideoPacketsLost = 0;
  this.prevVideoPacketsSent = 0;
  this.prevVideoBytes = 0;
  this.videoPLRatio = 0;
  this.videoBw = 0;
  this.videoThreshold = VIDEO_BW_THRESHOLD;
  this.videoPLThreshold = VIDEO_PL;
  this.runInterval = null;
  this.runIntervalTimeout = RUN_INTERVAL_TIMEOUT;
  this.testDone = false;
  this.result = {};

  /**
   * This functions run the getStats method for TEST_TIME_SPAN duration.
   * It returns a promise with the result object
   * @param {*} publisher from Opentok Library
   */
  const run = (publisher) => {
    return new Promise((resolve) => {
      this.runInterval = setInterval(async () => {
        if (!this.testDone) {
          if (this.startTestTime === 0) {
            this.startTestTime = Date.now() / 1000;
          }
          await checkStats(publisher);
          const now = Date.now() / 1000;
          if (now - this.startTestTime > TEST_TIME_SPAN) {
            checkQuality();
            clearInterval(this.runInterval);
            this.testDone = false;
            console.log("Run Result", this.result);
            resolve(this.result);
          }
        } else {
          clearInterval(this.runInterval);
          this.testDone = false;
          resolve(this.result);
        }
      }, this.runIntervalTimeout);
    });
  };

  /**
   * The checkStats calls the getStas on the Publisher object to compute bandwidth and packet loss for audio and video.
   * The bandwidth is computed by dividing bits (bytes*8) sent by the elapsed time (nowTimeStamp - prevTimestamp).
   * The PL Ratio is computed by dividing Packet Loss by Total Packets.
   * @param {*} publisher
   */
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
        resolve();
      });
    });
  };

  const checkQuality = () => {
    this.testDone = true;
    this.result = {
      audio: {
        supported: true,
        audioBw: this.audioBw,
        audioPLRatio: this.audioPLRatio,
      },
      video: {
        supported: true,
        videoBw: this.videoBw,
        videoPLRatio: this.videoPLRatio,
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
