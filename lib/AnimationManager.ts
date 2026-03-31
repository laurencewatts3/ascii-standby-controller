/**
 * AnimationManager
 *
 * requestAnimationFrame-based animation loop with precise frame timing.
 * Based on the Ghostty/developedbyed approach — uses delta accumulation
 * so frame rate stays consistent regardless of monitor refresh rate.
 */
export class AnimationManager {
  private _animation: number | null = null;
  private callback: () => void;
  private lastFrame = -1;
  private frameTime: number;

  constructor(callback: () => void, fps = 24) {
    this.callback = callback;
    this.frameTime = 1000 / fps;
  }

  start() {
    if (this._animation != null) return;
    this._animation = requestAnimationFrame(this.update);
  }

  pause() {
    if (this._animation == null) return;
    this.lastFrame = -1;
    cancelAnimationFrame(this._animation);
    this._animation = null;
  }

  setFps(fps: number) {
    this.frameTime = 1000 / fps;
  }

  private update = (time: number) => {
    const { lastFrame } = this;
    let delta = time - lastFrame;

    if (this.lastFrame === -1) {
      this.lastFrame = time;
    } else {
      while (delta >= this.frameTime) {
        this.callback();
        delta -= this.frameTime;
        this.lastFrame += this.frameTime;
      }
    }

    this._animation = requestAnimationFrame(this.update);
  };
}
