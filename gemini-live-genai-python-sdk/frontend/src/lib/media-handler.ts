/**
 * MediaHandler: microphone capture, audio playback, camera/screen frames.
 * TypeScript port of the vanilla media-handler.js — same behavior.
 */

export type VideoKind = "camera" | "screen";

export class MediaHandler {
  audioContext: AudioContext | null = null;
  mediaStream: MediaStream | null = null;
  private audioWorkletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private muteGainNode: GainNode | null = null;
  videoStream: MediaStream | null = null;
  private videoInterval: ReturnType<typeof setInterval> | null = null;
  private nextStartTime = 0;
  private scheduledSources: AudioBufferSourceNode[] = [];
  isRecording = false;
  private videoCanvas = document.createElement("canvas");
  private canvasCtx = this.videoCanvas.getContext("2d")!;

  async initializeAudio() {
    if (!this.audioContext) {
      const ctx = new AudioContext();
      this.audioContext = ctx;
      await ctx.audioWorklet.addModule("/pcm-processor.js");
    }
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }

  async startAudio(onAudioData: (data: ArrayBuffer) => void) {
    await this.initializeAudio();
    const ctx = this.audioContext;
    if (!ctx) throw new Error("AudioContext unavailable");

    this.stopAudio(); // tear down any previous capture chain first

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    const source = ctx.createMediaStreamSource(this.mediaStream);
    const worklet = new AudioWorkletNode(ctx, "pcm-processor");
    this.audioWorkletNode = worklet;
    this.sourceNode = source;

    worklet.port.onmessage = (event: MessageEvent<Float32Array>) => {
      if (this.isRecording) {
        const downsampled = this.downsampleBuffer(
          event.data,
          ctx.sampleRate,
          16000,
        );
        const pcm16 = this.convertFloat32ToInt16(downsampled);
        onAudioData(pcm16);
      }
    };

    source.connect(worklet);
    // Mute local feedback
    const muteGain = ctx.createGain();
    muteGain.gain.value = 0;
    worklet.connect(muteGain);
    muteGain.connect(ctx.destination);
    this.muteGainNode = muteGain;

    this.isRecording = true;
  }

  stopAudio() {
    this.isRecording = false;
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.audioWorkletNode?.disconnect();
    this.audioWorkletNode = null;
    this.muteGainNode?.disconnect();
    this.muteGainNode = null;
  }

  async startVideo(videoElement: HTMLVideoElement, onFrame: (b64: string) => void) {
    if (!videoElement) throw new Error("video element unavailable");
    this.videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
    });
    videoElement.srcObject = this.videoStream;
    this.videoInterval = setInterval(() => {
      this.captureFrame(videoElement, onFrame);
    }, 1000); // 1 FPS
  }

  async startScreen(
    videoElement: HTMLVideoElement,
    onFrame: (b64: string) => void,
    onEnded: () => void,
  ) {
    if (!videoElement) throw new Error("video element unavailable");
    this.videoStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
    });
    videoElement.srcObject = this.videoStream;

    // User may stop sharing from the browser UI
    this.videoStream.getVideoTracks()[0].onended = () => {
      this.stopVideo(videoElement);
      onEnded();
    };

    this.videoInterval = setInterval(() => {
      this.captureFrame(videoElement, onFrame);
    }, 1000); // 1 FPS
  }

  stopVideo(videoElement: HTMLVideoElement | null) {
    this.videoStream?.getTracks().forEach((t) => t.stop());
    this.videoStream = null;
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    if (videoElement) videoElement.srcObject = null;
  }

  captureFrame(videoElement: HTMLVideoElement, onFrame: (b64: string) => void) {
    if (!this.videoStream) return;
    this.videoCanvas.width = 640;
    this.videoCanvas.height = 480;
    this.canvasCtx.drawImage(videoElement, 0, 0, 640, 480);
    const base64 = this.videoCanvas.toDataURL("image/jpeg", 0.7).split(",")[1];
    onFrame(base64);
  }

  playAudio(arrayBuffer: ArrayBuffer) {
    if (!this.audioContext) return;
    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const pcmData = new Int16Array(arrayBuffer);
    const float32Data = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      float32Data[i] = pcmData[i] / 32768.0;
    }

    const buffer = this.audioContext.createBuffer(1, float32Data.length, 24000);
    buffer.getChannelData(0).set(float32Data);

    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);

    const now = this.audioContext.currentTime;
    this.nextStartTime = Math.max(now, this.nextStartTime);
    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;

    this.scheduledSources.push(source);
    source.onended = () => {
      const idx = this.scheduledSources.indexOf(source);
      if (idx > -1) this.scheduledSources.splice(idx, 1);
    };
  }

  stopAudioPlayback() {
    this.scheduledSources.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
    this.scheduledSources = [];
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime;
    }
  }

  isSpeaking() {
    return this.scheduledSources.length > 0;
  }

  private downsampleBuffer(
    buffer: Float32Array,
    sampleRate: number,
    outSampleRate: number,
  ): Float32Array {
    if (outSampleRate === sampleRate) return buffer;
    const ratio = sampleRate / outSampleRate;
    const newLength = Math.round(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;
    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = accum / count;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }
    return result;
  }

  private convertFloat32ToInt16(buffer: Float32Array): ArrayBuffer {
    let l = buffer.length;
    const buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, Math.max(-1, buffer[l])) * 0x7fff;
    }
    return buf.buffer;
  }
}
