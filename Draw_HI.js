let myImage;

// Simple ball physics state
let ball = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  r: 35,
  restitution: 0.78, // bounciness on walls/fingers
  friction: 0.892,   // slows the ball over time
  initialized: false
};

// Fingertip radius used for collision
const fingerRadius = 24;

// Store previous fingertip positions to estimate finger velocity (how hard you hit)
const prevTips = {
  L: null, // { x, y }
  R: null  // { x, y }
};

// Track the on-screen image as a moving rectangle for collision with the ball
const imageRect = {
  x: 0,
  y: 0,
  w: 50,
  h: 50,
  vx: 0,
  vy: 0,
  prevX: null,
  prevY: null,
  visible: false
};

// ----=  HANDS  =----
function prepareInteraction() {
  myImage = loadImage('danny-devito.jpg');

  // If canvas exists now, place the ball in the center; otherwise we'll lazy-init in drawInteraction
  if (typeof width !== "undefined" && typeof height !== "undefined" && width > 0 && height > 0) {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.initialized = true;
  }
}

function drawInteraction(faces, hands) {
  imageMode(CORNER);

  // Ensure ball initialized (covers cases where width/height aren't ready at prepareInteraction)
  if (!ball.initialized) {
    ball.x = width / 2;
    ball.y = height / 2;
    ball.vx = 0;
    ball.vy = 0;
    ball.initialized = true;
  }

  // this is a sketch that only really works if there are no more than 2 hands. It may be buggy with 3, so change the setting. 
  // this looks in the hands array, and sorts the hands into two variables
  let LH = hands.find(hand => hand.handedness === "Left");
  let RH = hands.find(hand => hand.handedness === "Right");

  // because we are going to need these variables for the rest of the sketch, we need to initialise them outside of any if statements
  let L_indexFingerTipX, L_indexFingerTipY, L_indexPinkyTipX, L_indexPinkyTipY;
  let R_indexFingerTipX, R_indexFingerTipY, R_indexPinkyTipX, R_indexPinkyTipY;

  // set up left hand variables, if there is a left hand. 
  if (LH) {
    L_indexFingerTipX = LH.index_finger_tip.x;
    L_indexFingerTipY = LH.index_finger_tip.y;
    L_indexPinkyTipX = LH.pinky_finger_tip.x;
    L_indexPinkyTipY = LH.pinky_finger_tip.y;
  }

  // set up right hand variables, if there is a right hand. 
  if (RH) {
    R_indexFingerTipX = RH.index_finger_tip.x;
    R_indexFingerTipY = RH.index_finger_tip.y;
    R_indexPinkyTipX = RH.pinky_finger_tip.x;
    R_indexPinkyTipY = RH.pinky_finger_tip.y;
  }

  // Physics update for the ball (basic)
  const dt = constrain(deltaTime / 16.666, 0.5, 2.0); // normalize to ~60fps steps, clamp extremes
  // Optional gravity; comment out to disable
  // ball.vy += 0.2 * dt;

  // Integrate
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  // Collide with fingertips (use previous frame positions to estimate finger velocity => knock strength)
  if (LH) {
    const lVx = prevTips.L ? (L_indexFingerTipX - prevTips.L.x) / dt : 0;
    const lVy = prevTips.L ? (L_indexFingerTipY - prevTips.L.y) / dt : 0;
    collideFingerWithBall(L_indexFingerTipX, L_indexFingerTipY, lVx, lVy);
  }
  if (RH) {
    const rVx = prevTips.R ? (R_indexFingerTipX - prevTips.R.x) / dt : 0;
    const rVy = prevTips.R ? (R_indexFingerTipY - prevTips.R.y) / dt : 0;
    collideFingerWithBall(R_indexFingerTipX, R_indexFingerTipY, rVx, rVy);
  }

  // Update the image rect (position/velocity) if the two index fingers are close enough
  let indexTouch = false;
  if (LH && RH) {
    indexTouch = areTheseTouching(L_indexFingerTipX, L_indexFingerTipY, R_indexFingerTipX, R_indexFingerTipY, 90);
    if (indexTouch) {
      const cx = (L_indexFingerTipX + R_indexFingerTipX) / 2;
      const cy = (L_indexFingerTipY + R_indexFingerTipY) / 2;
      imageRect.w = 50;
      imageRect.h = 50;
      const newX = cx - imageRect.w / 2;
      const newY = cy - imageRect.h / 2;

      // compute rect velocity from last frame
      if (imageRect.prevX !== null && imageRect.prevY !== null) {
        imageRect.vx = (newX - imageRect.prevX) / dt;
        imageRect.vy = (newY - imageRect.prevY) / dt;
      } else {
        imageRect.vx = 0;
        imageRect.vy = 0;
      }

      imageRect.x = newX;
      imageRect.y = newY;
      imageRect.visible = true;

      imageRect.prevX = imageRect.x;
      imageRect.prevY = imageRect.y;
    } else {
      // Not touching, hide/reset rect velocity history
      imageRect.visible = false;
      imageRect.vx = 0;
      imageRect.vy = 0;
      imageRect.prevX = null;
      imageRect.prevY = null;
    }
  } else {
    imageRect.visible = false;
    imageRect.vx = 0;
    imageRect.vy = 0;
    imageRect.prevX = null;
    imageRect.prevY = null;
  }

  // Collide the ball with the image rectangle (if visible)
  if (imageRect.visible) {
    collideBallWithRect(imageRect);
  }

  // Edge collisions
  resolveBallWorldBounds();

  // Friction/damping
  ball.vx *= ball.friction;
  ball.vy *= ball.friction;

  // Draw the ball you can knock around
  noStroke();
  fill(255, 165, 0);
  ellipse(ball.x, ball.y, ball.r * 2, ball.r * 2);

  // This is where you can make effects that use both left hand and right hand variables
  // this is needed because if these functions looked for a leftFingertip, but there was no leftHand, the program would crash.Vise versa for right handed variables. 
  if (LH && RH) {
    if (indexTouch) {
      stroke(146, 237, 0)
      strokeWeight(8)
      fill(146, 237, 0)
      ellipse(L_indexFingerTipX, L_indexFingerTipY, 1)
      ellipse(R_indexFingerTipX, R_indexFingerTipY, 1)
      // Draw the image centered between fingertips (same as before)
      image(myImage, imageRect.x, imageRect.y, imageRect.w, imageRect.h)
    }
  }

  // Solo-hand visuals
  if (LH) {
    stroke(0)
    strokeWeight(1)
    ellipse(L_indexFingerTipX, L_indexFingerTipY, 2);
    // drawConnections(LH)
  }
  if (RH) {
    stroke(0)
    strokeWeight(1)
    ellipse(R_indexFingerTipX, R_indexFingerTipY, 2);
    // drawConnections(RH)
  }

  // Update previous fingertip positions for next frame's velocity estimate
  prevTips.L = LH ? { x: L_indexFingerTipX, y: L_indexFingerTipY } : null;
  prevTips.R = RH ? { x: R_indexFingerTipX, y: R_indexFingerTipY } : null;
}

function collideFingerWithBall(fx, fy, fvx, fvy) {
  const dx = ball.x - fx;
  const dy = ball.y - fy;
  const minDist = ball.r + fingerRadius;
  const distSq = dx * dx + dy * dy;

  if (distSq <= minDist * minDist) {
    const dist = max(1, sqrt(distSq));
    const nx = dx / dist;
    const ny = dy / dist;
    const penetration = (ball.r + fingerRadius) - dist;

    // Push ball out of the fingertip to resolve overlap
    ball.x += nx * penetration;
    ball.y += ny * penetration;

    // Relative velocity along the collision normal
    const relVx = ball.vx - fvx;
    const relVy = ball.vy - fvy;
    const vn = relVx * nx + relVy * ny;

    // Only apply impulse if moving towards the finger
    if (vn < 0) {
      const j = -(1 + ball.restitution) * vn; // impulse magnitude assuming finger is heavy/infinite mass
      ball.vx += nx * j;
      ball.vy += ny * j;
    } else {
      // If separating, still carry a bit of finger motion
      ball.vx += fvx * 0.08;
      ball.vy += fvy * 0.08;
    }
  }
}

function resolveBallWorldBounds() {
  // Left/right
  if (ball.x < ball.r) {
    ball.x = ball.r;
    ball.vx = -ball.vx * ball.restitution;
  } else if (ball.x > width - ball.r) {
    ball.x = width - ball.r;
    ball.vx = -ball.vx * ball.restitution;
  }
  // Top/bottom
  if (ball.y < ball.r) {
    ball.y = ball.r;
    ball.vy = -ball.vy * ball.restitution;
  } else if (ball.y > height - ball.r) {
    ball.y = height - ball.r;
    ball.vy = -ball.vy * ball.restitution;
  }
}

function areTheseTouching(x1, y1, x2, y2, threshhold) {
  let d = dist(x1, y1, x2, y2)
  if (d < threshhold) {
    return true;
  } else {
    return false;
  }
}

function drawConnections(hand) {
  // Draw the skeletal connections
  push()
  for (let j = 0; j < connections.length; j++) {
    let pointAIndex = connections[j][0];
    let pointBIndex = connections[j][1];
    let pointA = hand.keypoints[pointAIndex];
    let pointB = hand.keypoints[pointBIndex];
    stroke(255, 0, 0);
    strokeWeight(2);
    line(pointA.x, pointA.y, pointB.x, pointB.y);
  }
  pop()
}

// This function draw's a dot on all the keypoints. It can be passed a whole face, or part of one. 
function drawPoints(feature) {
  push()
  for (let i = 0; i < feature.keypoints.length; i++) {
    let element = feature.keypoints[i];
    noStroke();
    fill(0, 255, 0);
    circle(element.x, element.y, 5);
  }
  pop()
}

/**
 * Collide the moving ball (circle) with an axis-aligned rectangle (imageRect).
 * Includes position correction (to resolve overlap) and velocity response with restitution,
 * and accounts for the rectangle's velocity (so a moving image knocks the ball).
 */
function collideBallWithRect(rect) {
  // Find closest point on rect to circle center
  const closestX = constrain(ball.x, rect.x, rect.x + rect.w);
  const closestY = constrain(ball.y, rect.y, rect.y + rect.h);
  let dx = ball.x - closestX;
  let dy = ball.y - closestY;
  let distSq = dx * dx + dy * dy;

  // If the circle center is inside the rectangle, dx=dy=0; handle separately
  if (dx === 0 && dy === 0) {
    // Determine the shallowest exit direction
    const dLeft = ball.x - rect.x;
    const dRight = (rect.x + rect.w) - ball.x;
    const dTop = ball.y - rect.y;
    const dBottom = (rect.y + rect.h) - ball.y;

    const minH = min(dLeft, dRight);
    const minV = min(dTop, dBottom);
    let nx = 0, ny = 0, penetration = 0;

    if (minH < minV) {
      // Move horizontally
      if (dLeft < dRight) {
        // Push left
        nx = -1; ny = 0;
        penetration = dLeft + ball.r;
      } else {
        // Push right
        nx = 1; ny = 0;
        penetration = dRight + ball.r;
      }
    } else {
      // Move vertically
      if (dTop < dBottom) {
        // Push up
        nx = 0; ny = -1;
        penetration = dTop + ball.r;
      } else {
        // Push down
        nx = 0; ny = 1;
        penetration = dBottom + ball.r;
      }
    }

    // Correct position
    ball.x += nx * penetration;
    ball.y += ny * penetration;

    // Velocity response with rect motion
    const relVx = ball.vx - rect.vx;
    const relVy = ball.vy - rect.vy;
    const vn = relVx * nx + relVy * ny;
    if (vn < 0) {
      const j = -(1 + ball.restitution) * vn;
      ball.vx += nx * j;
      ball.vy += ny * j;
    }

    return;
  }

  // Normal circle-rect collision when outside or touching
  if (distSq <= ball.r * ball.r) {
    const dist = max(1, sqrt(distSq));
    const nx = dx / dist;
    const ny = dy / dist;
    const penetration = ball.r - dist;

    // Push the ball out along the normal
    ball.x += nx * penetration;
    ball.y += ny * penetration;

    // Relative velocity along normal (account for rect movement)
    const relVx = ball.vx - rect.vx;
    const relVy = ball.vy - rect.vy;
    const vn = relVx * nx + relVy * ny;

    // Only bounce if approaching
    if (vn < 0) {
      const j = -(1 + ball.restitution) * vn;
      ball.vx += nx * j;
      ball.vy += ny * j;
    }
  }
}