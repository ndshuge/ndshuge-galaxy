(function (root) {
  'use strict';

  // A small invented sea. The rules describe motion, not biological life.
  const TAU = Math.PI * 2;
  const LIMITS = Object.freeze({ entities: 100, lights: 36, trails: 22, events: 8 });
  const MODES = ['tide', 'orbit', 'dream'];
  const NAMES = [
    '远灯', '迟来的信', '小小回声', '月背', '无名港', '一粒晚风',
    '余温', '漂流瓶', '浅眠', '星屑', '透明的雨', '旧梦',
    '缓慢的蓝', '低声', '空白页', '候鸟', '一寸海', '未寄出',
    '小岛', '夜航', '薄荷月亮', '微末', '遥远的近处', '软着陆',
    '雨停以后', '云的影子', '下一个春天', '失重', '潮间', '南窗',
    '萤火', '半颗星', '漫游者', '悬浮的吻', '夜的口袋', '轻轻地'
  ];
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

  function pointInDisk(x, y, radius) {
    const distance = Math.hypot(x, y);
    return distance > radius ? { x: x / distance * radius, y: y / distance * radius } : { x, y };
  }

  class GlassSea {
    constructor(seed = 4721) {
      this.reset(seed);
    }

    _random() {
      // Mulberry32, with explicit state so a bottled sea resumes exactly.
      this._rng = (this._rng + 0x6D2B79F5) >>> 0;
      let value = this._rng;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    }

    _entity(x, y, kind) {
      const angle = this._random() * TAU;
      const speed = .027 + this._random() * .024 + kind * .006;
      const id = this._nextId++;
      return {
        id, kind, x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        phase: this._random() * TAU,
        size: .008 + this._random() * .010,
        glow: .35 + this._random() * .5,
        age: 0,
        name: NAMES[(id - 1) % NAMES.length],
        trail: [{ x, y }]
      };
    }

    reset(seed = this.seed) {
      if (!finite(seed)) throw new Error('种子需要是一个有限数字。');
      this.seed = seed >>> 0;
      this._rng = this.seed;
      this._nextId = 1;
      this._trailClock = 0;
      this._bondClock = 0;
      this._lightCount = 0;
      this.time = 0;
      this.mode = 'tide';
      this.pointer = { x: 0, y: 0, active: false };
      this.entities = [];
      this.lights = [];
      this.bonds = [];
      this.events = [{ time: 0, text: '这一小片海，刚刚醒来。' }];
      for (let index = 0; index < 64; index++) {
        const angle = this._random() * TAU;
        const radius = Math.sqrt(this._random()) * .79;
        const kind = index % 3;
        this.entities.push(this._entity(Math.cos(angle) * radius, Math.sin(angle) * radius, kind));
      }
      this._refreshBonds();
      return this;
    }

    _event(text) {
      this.events.push({ time: this.time, text });
      if (this.events.length > LIMITS.events) this.events.shift();
    }

    setMode(mode) {
      if (!MODES.includes(mode)) throw new Error('未知潮汐。可选 tide、orbit 或 dream。');
      if (this.mode !== mode) {
        this.mode = mode;
        const messages = {
          tide: '潮水记起了回家的路。',
          orbit: '所有相遇，开始绕着一个温柔的中心。',
          dream: '海放慢了呼吸，梦开始漂浮。'
        };
        this._event(messages[mode]);
      }
      return this.mode;
    }

    setPointer(x, y, active = false) {
      if (!finite(x) || !finite(y)) {
        this.pointer.active = false;
        return;
      }
      const point = pointInDisk(x, y, .90);
      this.pointer = { x: point.x, y: point.y, active: Boolean(active) };
    }

    addLight(x, y) {
      if (!finite(x) || !finite(y)) throw new Error('光需要一个有限的位置。');
      const point = pointInDisk(x, y, .86);
      const light = { x: point.x, y: point.y, age: 0, life: 10 + this._random() * 8, power: .7 + this._random() * .3 };
      this.lights.push(light);
      if (this.lights.length > LIMITS.lights) this.lights.shift();
      this._lightCount++;
      if (this.entities.length < LIMITS.entities && (this._lightCount === 1 || this._random() < .54)) {
        this.entities.push(this._entity(point.x, point.y, Math.floor(this._random() * 3)));
      }
      if (this._lightCount === 1) this._event('你留下了一束光。它们似乎注意到了。');
      else if (this._lightCount % 5 === 0) this._event([
        '有些微光，已经找到彼此。',
        '没有谁需要抵达哪里。',
        '你不在的时候，海也会慢慢呼吸。',
        '一件无用的事，也可以被认真对待。'
      ][Math.floor(this._lightCount / 5 - 1) % 4]);
      return light;
    }

    pick(x, y, radius = .065) {
      if (!finite(x) || !finite(y) || !finite(radius) || radius < 0) return null;
      let nearest = null;
      let best = radius * radius;
      for (const entity of this.entities) {
        const distance = (entity.x - x) ** 2 + (entity.y - y) ** 2;
        if (distance < best) {
          best = distance;
          nearest = entity;
        }
      }
      return nearest;
    }

    _refreshBonds() {
      const bonds = [];
      for (let index = 0; index < this.entities.length; index++) {
        const entity = this.entities[index];
        let nearest = null;
        let best = .175 * .175;
        for (let otherIndex = index + 1; otherIndex < this.entities.length; otherIndex++) {
          const other = this.entities[otherIndex];
          if (entity.kind !== other.kind) continue;
          const distance = (other.x - entity.x) ** 2 + (other.y - entity.y) ** 2;
          if (distance < best) {
            best = distance;
            nearest = other;
          }
        }
        if (nearest) bonds.push({ a: entity.id, b: nearest.id, strength: 1 - Math.sqrt(best) / .175 });
      }
      this.bonds = bonds;
    }

    step(delta) {
      if (!finite(delta) || delta <= 0) return this;
      const dt = Math.min(delta, .05);
      this.time += dt;
      this._trailClock += dt;
      this._bondClock += dt;
      const recordTrail = this._trailClock >= .085;
      if (recordTrail) this._trailClock %= .085;
      for (const light of this.lights) light.age += dt;
      this.lights = this.lights.filter(light => light.age < light.life);

      // All local forces see the same previous frame, independent of draw order.
      const prior = this.entities.map(entity => ({ x: entity.x, y: entity.y, vx: entity.vx, vy: entity.vy, kind: entity.kind }));
      for (let index = 0; index < this.entities.length; index++) {
        const entity = this.entities[index];
        const current = prior[index];
        const radius = Math.hypot(current.x, current.y);
        let targetX;
        let targetY;
        let speed = [.048, .067, .043][entity.kind];
        if (this.mode === 'orbit') {
          const desiredRing = .30 + entity.kind * .18;
          const radial = (desiredRing - radius) * .6;
          const denominator = Math.max(.08, radius);
          targetX = -current.y / denominator + current.x / denominator * radial * 6;
          targetY = current.x / denominator + current.y / denominator * radial * 6;
          speed *= 1.18;
        } else {
          // Derivatives of a stream function make several connected currents.
          // The circular envelope makes flow tangent to the glass rather than
          // pushing every resident toward one rim. Avoid normalizing these
          // vectors: their varying speed keeps broad inner and outer currents.
          const dreaming = this.mode === 'dream';
          const frequency = dreaming ? 3.4 : 4.2;
          const drift = this.time * (dreaming ? .023 : .065);
          const waveX = current.x * frequency + drift + entity.kind * .34;
          const waveY = current.y * frequency - drift * .73;
          const envelope = Math.max(0, 1 - radius * radius / .81);
          const base = dreaming ? .13 : .18;
          const amplitude = dreaming ? .27 : .24;
          const stream = base + amplitude * Math.sin(waveX) * Math.cos(waveY);
          const derivativeX = amplitude * frequency * Math.cos(waveX) * Math.cos(waveY);
          const derivativeY = -amplitude * frequency * Math.sin(waveX) * Math.sin(waveY);
          targetX = envelope * derivativeY - 2 * current.y / .81 * stream;
          targetY = -envelope * derivativeX + 2 * current.x / .81 * stream;
          if (dreaming) speed *= .52;
        }
        const fieldLength = this.mode === 'orbit' ? Math.max(.1, Math.hypot(targetX, targetY)) : 1;
        targetX = targetX / fieldLength * speed;
        targetY = targetY / fieldLength * speed;

        let separateX = 0;
        let separateY = 0;
        let alignX = 0;
        let alignY = 0;
        let neighbors = 0;
        for (let otherIndex = 0; otherIndex < prior.length; otherIndex++) {
          if (otherIndex === index) continue;
          const other = prior[otherIndex];
          const dx = current.x - other.x;
          const dy = current.y - other.y;
          const square = dx * dx + dy * dy;
          if (square < .0036 && square > .0000001) {
            const distance = Math.sqrt(square);
            const repulsion = (1 - distance / .06) * .036;
            separateX += dx / distance * repulsion;
            separateY += dy / distance * repulsion;
          }
          if (square < .04 && other.kind === entity.kind) {
            alignX += other.vx;
            alignY += other.vy;
            neighbors++;
          }
        }
        if (neighbors) {
          targetX = targetX * .80 + alignX / neighbors * .20;
          targetY = targetY * .80 + alignY / neighbors * .20;
        }
        targetX += separateX;
        targetY += separateY;
        let illumination = 0;
        const attract = (x, y, power) => {
          const dx = x - current.x;
          const dy = y - current.y;
          const distance = Math.hypot(dx, dy);
          if (distance < .72 && distance > .012) {
            const pull = .068 * power * (1 - distance / .72);
            targetX += dx / distance * pull;
            targetY += dy / distance * pull;
            illumination += (1 - distance / .72) * power;
          }
        };
        for (const light of this.lights) attract(light.x, light.y, light.power * Math.sin(Math.PI * light.age / light.life));
        if (this.pointer.active) attract(this.pointer.x, this.pointer.y, 1.0);
        if (radius > .76) {
          const inward = (radius - .76) * .95;
          targetX -= current.x / radius * inward;
          targetY -= current.y / radius * inward;
        }
        const ease = Math.min(1, dt * 1.25);
        entity.vx += (targetX - entity.vx) * ease;
        entity.vy += (targetY - entity.vy) * ease;
        const actualSpeed = Math.hypot(entity.vx, entity.vy);
        if (actualSpeed > .15) {
          entity.vx *= .15 / actualSpeed;
          entity.vy *= .15 / actualSpeed;
        }
        entity.x += entity.vx * dt;
        entity.y += entity.vy * dt;
        const nextRadius = Math.hypot(entity.x, entity.y);
        if (nextRadius > .90) {
          entity.x = entity.x / nextRadius * .90;
          entity.y = entity.y / nextRadius * .90;
          const outward = (entity.vx * entity.x + entity.vy * entity.y) / .81;
          if (outward > 0) {
            entity.vx -= entity.x * outward * 1.6;
            entity.vy -= entity.y * outward * 1.6;
          }
        }
        entity.angle = Math.atan2(entity.vy, entity.vx);
        entity.phase = (entity.phase + dt * (.8 + entity.kind * .2)) % TAU;
        entity.age += dt;
        entity.glow = clamp(.42 + Math.sin(entity.phase) * .18 + illumination * .45, .15, 1);
        if (recordTrail) {
          entity.trail.push({ x: entity.x, y: entity.y });
          if (entity.trail.length > LIMITS.trails) entity.trail.shift();
        }
      }
      if (this._bondClock >= .25) {
        this._bondClock %= .25;
        this._refreshBonds();
      }
      return this;
    }

    snapshot() {
      return JSON.parse(JSON.stringify({
        format: 'glass-sea/1', seed: this.seed, rng: this._rng, nextId: this._nextId,
        trailClock: this._trailClock, bondClock: this._bondClock, lightCount: this._lightCount,
        time: this.time, mode: this.mode, pointer: this.pointer,
        entities: this.entities, lights: this.lights, bonds: this.bonds, events: this.events
      }));
    }

    restore(input) {
      const fail = detail => { throw new Error('这个漂流瓶无法打开：' + detail); };
      let data;
      try { data = JSON.parse(JSON.stringify(input)); }
      catch (_) { fail('数据无法读取。'); }
      if (!data || data.format !== 'glass-sea/1') fail('不是可识别的海。');
      if (!MODES.includes(data.mode)) fail('潮汐无效。');
      for (const field of ['seed', 'rng', 'nextId', 'lightCount']) {
        if (!Number.isSafeInteger(data[field]) || data[field] < 0 || data[field] > 4294967295) fail('种子或计数无效。');
      }
      if (data.nextId < 1) fail('生命编号无效。');
      for (const field of ['time', 'trailClock', 'bondClock']) {
        if (!finite(data[field]) || data[field] < 0) fail('时间无效。');
      }
      if (data.trailClock >= .085 || data.bondClock >= .25) fail('时间间隔无效。');
      const validatePoint = point => point && finite(point.x) && finite(point.y) && Math.hypot(point.x, point.y) <= .900001;
      if (!validatePoint(data.pointer) || typeof data.pointer.active !== 'boolean') fail('指针位置无效。');
      if (!Array.isArray(data.entities) || data.entities.length < 1 || data.entities.length > LIMITS.entities) fail('生命数量无效。');
      const ids = new Set();
      for (const entity of data.entities) {
        if (!validatePoint(entity) || !Number.isSafeInteger(entity.id) || entity.id < 1 || entity.id >= data.nextId || ids.has(entity.id)) fail('生命位置或编号无效。');
        ids.add(entity.id);
        if (![0, 1, 2].includes(entity.kind) || !finite(entity.age) || entity.age < 0 || typeof entity.name !== 'string' || entity.name.length > 40) fail('生命资料无效。');
        if (!finite(entity.vx) || !finite(entity.vy) || Math.hypot(entity.vx, entity.vy) > .150001) fail('游动速度无效。');
        if (!finite(entity.angle) || !finite(entity.phase) || entity.phase < 0 || entity.phase > TAU) fail('方向无效。');
        if (!finite(entity.size) || entity.size < .004 || entity.size > .04 || !finite(entity.glow) || entity.glow < 0 || entity.glow > 1) fail('微光无效。');
        if (!Array.isArray(entity.trail) || entity.trail.length < 1 || entity.trail.length > LIMITS.trails || !entity.trail.every(validatePoint)) fail('轨迹无效。');
      }
      if (!Array.isArray(data.lights) || data.lights.length > LIMITS.lights) fail('光的数量无效。');
      for (const light of data.lights) {
        if (!validatePoint(light) || !finite(light.age) || !finite(light.life) || light.life <= 0 || light.life > 60 || light.age < 0 || light.age >= light.life || !finite(light.power) || light.power < 0 || light.power > 1) fail('光的资料无效。');
      }
      if (!Array.isArray(data.bonds) || data.bonds.length > LIMITS.entities) fail('相遇的数量无效。');
      for (const bond of data.bonds) {
        if (!bond || !ids.has(bond.a) || !ids.has(bond.b) || bond.a === bond.b || !finite(bond.strength) || bond.strength < 0 || bond.strength > 1) fail('相遇资料无效。');
      }
      if (!Array.isArray(data.events) || data.events.length > LIMITS.events) fail('记事数量无效。');
      for (const event of data.events) {
        if (!event || !finite(event.time) || event.time < 0 || event.time > data.time || typeof event.text !== 'string' || event.text.length > 160) fail('记事无效。');
      }
      this.seed = data.seed;
      this._rng = data.rng;
      this._nextId = data.nextId;
      this._trailClock = data.trailClock;
      this._bondClock = data.bondClock;
      this._lightCount = data.lightCount;
      this.time = data.time;
      this.mode = data.mode;
      this.pointer = data.pointer;
      this.entities = data.entities;
      this.lights = data.lights;
      this.bonds = data.bonds;
      this.events = data.events;
      return this;
    }
  }

  GlassSea.LIMITS = LIMITS;
  if (typeof module !== 'undefined' && module.exports) module.exports = GlassSea;
  if (root) root.GlassSea = GlassSea;
})(typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : this);
