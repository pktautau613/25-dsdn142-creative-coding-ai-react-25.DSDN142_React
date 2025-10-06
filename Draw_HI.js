// ----=  HANDS  =----

function prepareInteraction() {

}

function drawInteraction(faces, hands) {
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

  // This is where you can make effects that use both left hand and right hand variables

  // this is needed because if these functions looked for a leftFingertip, but there was no leftHand, the program would crash.Vise versa for right handed variables. 

  if (LH && RH) {
    
    let indexTouch = areTheseTouching(L_indexFingerTipX, L_indexFingerTipY, R_indexFingerTipX, R_indexFingerTipY, 50)
    if (indexTouch) {

      stroke(146, 237, 0)
      strokeWeight(8)
      fill(146, 237, 0)
      ellipse(L_indexFingerTipX,L_indexFingerTipY, 40)
      line(L_indexPinkyTipX, L_indexPinkyTipY, R_indexPinkyTipX, R_indexPinkyTipY)
    }
  }


  // So what happens when there is only one hand on screen?
  // Depending on your design, you may want something to draw on a hand when they are solo. 



  //These effects are still called if 2 hands are present 
  //These if statments are needed because if there is no left hand data but we still tried to use that variable, the program would crash. 
  //These two if statements may look very similar. 
  //Here you can draw just the left hand

  if (LH) {
    stroke(0)
    strokeWeight(1)
    ellipse(L_indexFingerTipX, L_indexFingerTipY, 20);
    drawConnections(LH)
  }

  // Here you can draw just the right hand
  if (RH) {
    stroke(0)
    strokeWeight(1)
    ellipse(R_indexFingerTipX, R_indexFingerTipY, 20);
    drawConnections(RH)
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