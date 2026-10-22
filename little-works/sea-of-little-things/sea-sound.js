(function (root) {
  'use strict';

  const MODES = {
    tide: { root: 146.8324, cutoff: 940, level: 0.42 },
    orbit: { root: 130.8128, cutoff: 1220, level: 0.38 },
    dream: { root: 164.8138, cutoff: 710, level: 0.35 }
  };
  const PENTATONIC = [0, 2, 4, 7, 9, 12, 14, 16, 19];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  class SeaSound {
    constructor() {
      this.enabled = false;
      this.mode = 'tide';
      this.context = null;
      this._master = null;
      this._filter = null;
      this._voices = [];
      this._notes = new Set();
      this._lastTouch = -Infinity;
      this._suspendTimer = null;
      this._operation = 0;
      this._disposed = false;
      this._visibility = this._onVisibility.bind(this);
      if (root.document) root.document.addEventListener('visibilitychange', this._visibility);
    }

    _build() {
      if (this.context) return true;
      const AudioContextClass = root.AudioContext || root.webkitAudioContext;
      if (!AudioContextClass || this._disposed) return false;
      const context = new AudioContextClass();
      this.context = context;
      this._master = context.createGain();
      this._master.gain.value = 0;
      this._master.connect(context.destination);
      this._filter = context.createBiquadFilter();
      this._filter.type = 'lowpass';
      this._filter.frequency.value = MODES[this.mode].cutoff;
      this._filter.Q.value = 0.45;
      this._filter.connect(this._master);
      const intervals = [0, 7, 14, 19];
      const levels = [0.038, 0.024, 0.014, 0.009];
      intervals.forEach((interval, index) => {
        const oscillator = context.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.value = MODES[this.mode].root * Math.pow(2, interval / 12);
        oscillator.detune.value = [-3, 2, -1, 3][index];
        const gain = context.createGain();
        gain.gain.value = levels[index];
        const swell = context.createOscillator();
        const swellDepth = context.createGain();
        swell.type = 'sine';
        swell.frequency.value = 0.027 + index * 0.011;
        swellDepth.gain.value = levels[index] * 0.28;
        swell.connect(swellDepth);
        swellDepth.connect(gain.gain);
        oscillator.connect(gain);
        let panner = null;
        if (typeof context.createStereoPanner === 'function') {
          panner = context.createStereoPanner();
          panner.pan.value = [-0.45, 0.4, -0.22, 0.26][index];
          gain.connect(panner);
          panner.connect(this._filter);
        } else gain.connect(this._filter);
        oscillator.start();
        swell.start();
        this._voices.push({ oscillator, gain, swell, swellDepth, panner, interval });
      });
      return true;
    }

    _level(value, seconds) {
      if (!this.context || !this._master || this.context.state === 'closed') return;
      const now = this.context.currentTime;
      const parameter = this._master.gain;
      if (typeof parameter.cancelAndHoldAtTime === 'function') parameter.cancelAndHoldAtTime(now);
      else {
        parameter.cancelScheduledValues(now);
        parameter.setValueAtTime(parameter.value, now);
      }
      parameter.linearRampToValueAtTime(value, now + seconds);
    }

    async toggle() {
      if (this._disposed) return false;
      this.enabled = !this.enabled;
      const operation = ++this._operation;
      if (this._suspendTimer !== null) {
        root.clearTimeout(this._suspendTimer);
        this._suspendTimer = null;
      }
      if (!this.enabled) {
        this._level(0, 0.45);
        this._suspendTimer = root.setTimeout(() => {
          this._suspendTimer = null;
          if (!this.enabled && this.context && this.context.state !== 'closed') {
            this.context.suspend().catch(() => {});
          }
        }, 520);
        return false;
      }
      try {
        if (!this._build()) {
          this.enabled = false;
          return false;
        }
        if (root.document && root.document.hidden) {
          await this.context.suspend();
          return this.enabled;
        }
        await this.context.resume();
        if (operation !== this._operation || this._disposed) return this.enabled;
        if (root.document && root.document.hidden) {
          await this.context.suspend();
          return this.enabled;
        }
        if (this.context.state !== 'running') {
          this.enabled = false;
          return false;
        }
        this._level(MODES[this.mode].level, 1.4);
        return true;
      } catch (_) {
        if (operation === this._operation) this.enabled = false;
        return this.enabled;
      }
    }

    setMode(mode) {
      if (!Object.prototype.hasOwnProperty.call(MODES, mode)) return;
      this.mode = mode;
      if (!this.context || this.context.state === 'closed') return;
      const now = this.context.currentTime;
      const settings = MODES[mode];
      this._voices.forEach((voice) => {
        voice.oscillator.frequency.cancelScheduledValues(now);
        voice.oscillator.frequency.setTargetAtTime(settings.root * Math.pow(2, voice.interval / 12), now, 0.85);
      });
      this._filter.frequency.setTargetAtTime(settings.cutoff, now, 1.1);
      if (this.enabled && !(root.document && root.document.hidden)) this._level(settings.level, 1.8);
    }

    touch(x, y, kind) {
      if (!this.enabled || !this.context || this.context.state !== 'running' || this._disposed) return;
      if (root.document && root.document.hidden) return;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const context = this.context;
      const now = context.currentTime;
      if (now - this._lastTouch < 0.1) return;
      this._lastTouch = now;
      if (this._notes.size >= 8) return;
      kind = Number.isFinite(kind) ? Math.floor(kind) : 0;
      const pitchIndex = clamp(Math.floor((1 - clamp(y, -1, 1)) * 3.3) + (Math.abs(kind || 0) % 3), 0, PENTATONIC.length - 1);
      const frequency = MODES[this.mode].root * 2 * Math.pow(2, PENTATONIC[pitchIndex] / 12);
      const oscillator = context.createOscillator();
      const overtone = context.createOscillator();
      const gain = context.createGain();
      const overtoneGain = context.createGain();
      const panner = typeof context.createStereoPanner === 'function' ? context.createStereoPanner() : null;
      oscillator.type = overtone.type = 'sine';
      oscillator.frequency.value = frequency;
      overtone.frequency.value = frequency * 2;
      overtone.detune.value = 2.5;
      overtoneGain.gain.value = 0.12;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.105, now + 0.026);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
      oscillator.connect(gain);
      overtone.connect(overtoneGain);
      overtoneGain.connect(gain);
      if (panner) {
        panner.pan.value = clamp(x, -1, 1) * 0.65;
        gain.connect(panner);
        panner.connect(this._master);
      } else gain.connect(this._master);
      const note = { oscillator, overtone, gain, overtoneGain, panner };
      this._notes.add(note);
      oscillator.onended = () => {
        this._notes.delete(note);
        [oscillator, overtone, gain, overtoneGain, panner].forEach((node) => {
          if (node) try { node.disconnect(); } catch (_) {}
        });
      };
      oscillator.start(now);
      overtone.start(now);
      oscillator.stop(now + 2.2);
      overtone.stop(now + 2.2);
    }

    _onVisibility() {
      const context = this.context;
      if (!context || context.state === 'closed' || this._disposed) return;
      if (root.document.hidden) {
        context.suspend().catch(() => {});
      } else if (this.enabled) {
        context.resume().then(() => {
          if (!this.enabled || this._disposed || root.document.hidden) return;
          this._level(MODES[this.mode].level, 0.8);
        }).catch(() => {});
      }
    }

    dispose() {
      if (this._disposed) return;
      this._disposed = true;
      this.enabled = false;
      ++this._operation;
      if (root.document) root.document.removeEventListener('visibilitychange', this._visibility);
      if (this._suspendTimer !== null) root.clearTimeout(this._suspendTimer);
      this._suspendTimer = null;
      this._voices.forEach((voice) => {
        try { voice.oscillator.stop(); } catch (_) {}
        try { voice.swell.stop(); } catch (_) {}
        [voice.oscillator, voice.swell, voice.gain, voice.swellDepth, voice.panner].forEach((node) => {
          if (node) try { node.disconnect(); } catch (_) {}
        });
      });
      this._voices.length = 0;
      this._notes.forEach((note) => {
        try { note.oscillator.stop(); } catch (_) {}
        try { note.overtone.stop(); } catch (_) {}
      });
      this._notes.clear();
      if (this.context && this.context.state !== 'closed') this.context.close().catch(() => {});
    }
  }

  root.SeaSound = SeaSound;
  root.SeaPoems = [
    '一粒光落下，海水让出一个位置。',
    '水母没有目的地，触须却记得来路。',
    '潮水绕过你，继续做它的圆。',
    '有两颗星，刚刚交换了影子。',
    '一条很小的鱼，穿过了自己的昨天。',
    '你没有说话，海面也留了一个座位。',
    '漂走的光，停在另一只透明的手里。',
    '再等一会儿，那团雾就有了名字。',
    '远处的星群，像没收好的针线。',
    '海底没有钟，只有慢慢变暗的光。',
    '你移开手以后，潮汐还轻轻晃着。',
    '今天的月亮，只够照亮一小片水。',
    '它们偶尔相逢，然后各自发亮。',
    '这片海很浅，装得下一整个傍晚。',
    '一只浮游生物，正在练习独处。',
    '玻璃的另一边，也有人看着星光。'
  ];
})(typeof window !== 'undefined' ? window : globalThis);
