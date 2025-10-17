let myImage;
let barrierImg; // image for the simple animated barrier
let points = 0;
let collided = false;

// Simple barrier animation state (like your Xmove example)
var Xmove = 0;
const BARRIER = {
  y: 100,
  w: 45,
  h: 45,
  dx: 1, 
  minX: 0,
  maxX: 600 
};

// Config
const CONFIG = {
  ball: { r: 20, restitution: 0.78, friction: 0.892 },
  fingerRadius: 24,
  indexTouchThreshold: 90,
  imageSize: 50
};

// Utility: normalize dt to ~60fps and clamp extremes
function normalizedDt() {
  return constrain(deltaTime / 16.666, 0.5, 2.0);
}

// Hands helpers
function splitHands(hands) {
  const LH = hands?.find(h => h.handedness === "Left") || null;
  const RH = hands?.find(h => h.handedness === "Right") || null;
  const LT = LH ? { x: LH.index_finger_tip.x, y: LH.index_finger_tip.y } : null;
  const RT = RH ? { x: RH.index_finger_tip.x, y: RH.index_finger_tip.y } : null;
  return { LH, RH, LT, RT };
}

// Tracks previous fingertip positions and returns velocities
class FingerTracker {
  constructor() {
    this.prev = { L: null, R: null };
  }
  velocities(L, R, dt) {
    return {
      L: this.#vel("L", L, dt),
      R: this.#vel("R", R, dt)
    };
  }
  #vel(which, tip, dt) {
    const p = this.prev[which];
    if (!tip || !p || dt === 0) return { vx: 0, vy: 0 };
    return { vx: (tip.x - p.x) / dt, vy: (tip.y - p.y) / dt };
  }
  update(L, R) {
    this.prev.L = L ? { x: L.x, y: L.y } : null;
    this.prev.R = R ? { x: R.x, y: R.y } : null;
  }
}

class Ball {
  constructor({ r, restitution, friction }) {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.r = r;
    this.restitution = restitution;
    this.friction = friction;
    this.initialized = false;
  }

  initCenter() {
    this.x = width / 2;
    this.y = height / 2;
    this.vx = 0; this.vy = 0;
    this.initialized = true;
  }

  update(dt) {
    // Optional gravity:
    // this.vy += 0.2 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }

  applyFriction() {
    this.vx *= this.friction;
    this.vy *= this.friction;
  }

  draw() {
    noStroke();
    fill(255, 165, 0);
    ellipse(this.x, this.y, this.r * 2, this.r * 2);
  }

  resolveBounds() {
    if (this.x < this.r) { this.x = this.r; this.vx = -this.vx * this.restitution; }
    else if (this.x > width - this.r) { this.x = width - this.r; this.vx = -this.vx * this.restitution; }
    if (this.y < this.r) { this.y = this.r; this.vy = -this.vy * this.restitution; }
    else if (this.y > height - this.r) { this.y = height - this.r; this.vy = -this.vy * this.restitution; }
  }

  // Collide ball with a fingertip (circle vs circle)
  collideFinger(fx, fy, fvx, fvy, fingerRadius) {
    const dx = this.x - fx;
    const dy = this.y - fy;
    const minDist = this.r + fingerRadius;
    const distSq = dx * dx + dy * dy;
    if (distSq > minDist * minDist) return;

    const dist = max(1, sqrt(distSq));
    const nx = dx / dist;
    const ny = dy / dist;
    const penetration = minDist - dist;

    // Positional correction
    this.x += nx * penetration;
    this.y += ny * penetration;

    // Velocity response (relative along normal)
    const relVx = this.vx - fvx;
    const relVy = this.vy - fvy;
    const vn = relVx * nx + relVy * ny;

    if (vn < 0) {
      const j = -(1 + this.restitution) * vn; // infinite mass finger
      this.vx += nx * j;
      this.vy += ny * j;
    } else {
      // Carry a little finger motion for responsiveness
      this.vx += fvx * 0.08;
      this.vy += fvy * 0.08;
    }
  }

  // Collide ball (circle) with an axis-aligned moving rectangle rect:{x,y,w,h,vx,vy,visible}
  collideRect(rect) {
    const closestX = constrain(this.x, rect.x, rect.x + rect.w);
    const closestY = constrain(this.y, rect.y, rect.y + rect.h);
    let dx = this.x - closestX;
    let dy = this.y - closestY;
    let distSq = dx * dx + dy * dy;

    // Center inside rect case: push out along shallowest axis
    if (dx === 0 && dy === 0) {
      const dLeft = this.x - rect.x;
      const dRight = (rect.x + rect.w) - this.x;
      const dTop = this.y - rect.y;
      const dBottom = (rect.y + rect.h) - this.y;
      const minH = min(dLeft, dRight);
      const minV = min(dTop, dBottom);
      let nx = 0, ny = 0, penetration = 0;

      if (minH < minV) {
        if (dLeft < dRight) { nx = -1; penetration = dLeft + this.r; }
        else { nx = 1; penetration = dRight + this.r; }
      } else {
        if (dTop < dBottom) { ny = -1; penetration = dTop + this.r; }
        else { ny = 1; penetration = dBottom + this.r; }
      }

      this.x += nx * penetration;
      this.y += ny * penetration;

      const relVx = this.vx - rect.vx;
      const relVy = this.vy - rect.vy;
      const vn = relVx * nx + relVy * ny;
      if (vn < 0) {
        const j = -(1 + this.restitution) * vn;
        this.vx += nx * j;
        this.vy += ny * j;
      }
      return;
    }

    // Normal circle-rect collision
    if (distSq <= this.r * this.r) {
      const dist = max(1, sqrt(distSq));
      const nx = dx / dist;
      const ny = dy / dist;
      const penetration = this.r - dist;

      this.x += nx * penetration;
      this.y += ny * penetration;

      const relVx = this.vx - rect.vx;
      const relVy = this.vy - rect.vy;
      const vn = relVx * nx + relVy * ny;
      if (vn < 0) {
        const j = -(1 + this.restitution) * vn;
        this.vx += nx * j;
        this.vy += ny * j;
      }
    }
  }
}

class MovingRect {
  constructor(w = CONFIG.imageSize, h = CONFIG.imageSize) {
    this.x = 0; this.y = 0;
    this.w = w; this.h = h;
    this.vx = 0; this.vy = 0;
    this.prevX = null; this.prevY = null;
    this.visible = false;
  }

  hide() {
    this.visible = false;
    this.vx = 0; this.vy = 0;
    this.prevX = null; this.prevY = null;
  }

  // Update rect position/velocity from two index fingertips if they are close enough
  updateFromIndexTouches(LT, RT, dt, threshold = CONFIG.indexTouchThreshold) {
    if (!LT || !RT) { this.hide(); return false; }

    if (dist(LT.x, LT.y, RT.x, RT.y) >= threshold) { this.hide(); return false; }

    const cx = (LT.x + RT.x) / 2;
    const cy = (LT.y + RT.y) / 2;
    const newX = cx - this.w / 2;
    const newY = cy - this.h / 2;

    if (this.prevX !== null && this.prevY !== null && dt !== 0) {
      this.vx = (newX - this.prevX) / dt;
      this.vy = (newY - this.prevY) / dt;
    } else {
      this.vx = 0; this.vy = 0;
    }

    this.x = newX; this.y = newY;
    this.visible = true;
    this.prevX = this.x; this.prevY = this.y;
    return true;
  }

  drawImage(img) {
    if (!this.visible) return;
    image(img, this.x, this.y, this.w, this.h);
  }
}

// Instances
let ball = new Ball(CONFIG.ball);
let imageRect = new MovingRect();
let fingerTracker = new FingerTracker();

// Lifecycle
function prepareInteraction() {
  // Load both images
  myImage = loadImage('danny-devito.jpg');
  barrierImg = loadImage('barrier.png'); // place barrier.png next to this script or adjust path

  if (typeof width !== "undefined" && typeof height !== "undefined" && width > 0 && height > 0) {
    ball.initCenter();
  }
}

function drawInteraction(faces, hands) {
  imageMode(CORNER);

  if (!ball.initialized) ball.initCenter();

  const { LH, RH, LT, RT } = splitHands(hands);

  // dt and physics
  const dt = normalizedDt();
  ball.update(dt);

  // Fingertip collisions (with velocity-based knock strength)
  const vels = fingerTracker.velocities(LT, RT, dt);
  if (LT) ball.collideFinger(LT.x, LT.y, vels.L.vx, vels.L.vy, CONFIG.fingerRadius);
  if (RT) ball.collideFinger(RT.x, RT.y, vels.R.vx, vels.R.vy, CONFIG.fingerRadius);

  // Update moving image when index fingers are close
  const indexTouch = imageRect.updateFromIndexTouches(LT, RT, dt, CONFIG.indexTouchThreshold);

  // Optional: collide with the moving image
  if (imageRect.visible) ball.collideRect(imageRect);

  // World bounds and damping
  ball.resolveBounds();
  ball.applyFriction();

  // --- Simple Xmove-based barrier animation (no physics) ---
  if (barrierImg) {
    image(barrierImg, Xmove, BARRIER.y, BARRIER.w, BARRIER.h);
  }
  Xmove = Xmove + BARRIER.dx;
  if (Xmove > BARRIER.maxX) {
    Xmove = BARRIER.minX;
  }
  // ---------------------------------------------------------

  // Draw ball
  ball.draw();

  // Draw two-hand visuals + image
  if (LH && RH && indexTouch) {
    stroke(146, 237, 0);
    strokeWeight(8);
    fill(146, 237, 0);
    ellipse(LT.x, LT.y, 1);
    ellipse(RT.x, RT.y, 1);
    imageRect.drawImage(myImage);
  }

  // Optional solo-hand fingertip dots
  if (LT) { stroke(0); strokeWeight(1); ellipse(LT.x, LT.y, 2); }
  if (RT) { stroke(0); strokeWeight(1); ellipse(RT.x, RT.y, 2); }

  // Update fingertip history
  fingerTracker.update(LT, RT);



  
  // --- Collision detection ---
if (checkCollision(ball.x, ball.y, 50, Xmove, BARRIER.y, BARRIER.w, BARRIER.h)) {
  if (!collided) {
    points++;
    collided = true;
  }
} else {
  collided = false;
}

// --- Display points ---
fill(0);
textSize(24);
text("Points: " + points, 20, 30);

push()
function checkCollision(cx, cy, diameter, rx, ry, rw, rh) {
  let closestX = constrain(cx, rx, rx + rw);
  let closestY = constrain(cy, ry, ry + rh);
  let distance = dist(cx, cy, closestX, closestY);
  return distance < diameter / 2;
}
pop()
}