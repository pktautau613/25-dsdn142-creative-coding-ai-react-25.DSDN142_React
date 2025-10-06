// ----=  HANDS  =----
function prepareInteraction() {
  //bgImage = loadImage('/images/background.png');
}

function drawInteraction(faces, hands) {

  // hands part
  // USING THE GESTURE DETECTORS (check their values in the debug menu)
  // detectHandGesture(hand) returns "Pinch", "Peace", "Thumbs Up", "Pointing", "Open Palm", or "Fist"

  // for loop to capture if there is more than one hand on the screen. This applies the same process to all hands.
  for (let i = 0; i < hands.length; i++) {
    let hand = hands[i];
    if (showKeypoints) {
      drawPoints(hand)
      drawConnections(hand)
    }
    let thumbTip = hand.thumb_tip;

    let indTip = hand.index_finger_tip;

    let indPip = hand.index_finger_pip;

    let thumbDip = hand.thumb_ip;
    
    let thumbMcp = hand.thumb_mcp;
    let indMcp = hand.index_finger_mcp;
    let middleMcp = hand.middle_finger_mcp;
    let pinkMcp = hand.pinky_finger_mcp;
    
    let wrist = hand.wrist;

    //==============================================
    
      //face variables

      // let eyeRight = face.rightEye;
      
      
      if (hand.handedness === "Left"){
        fill(255);
        stroke(100,255,40);
        //  line(face.leftEye.x, face.leftEye.y, palmX, palmY);
       //  line(face.rightEye.x, face.rightEye.y, palmX, palmY);
        
        ellipse(indTip.x, indTip.y, 40);
       }
    

      if (hand.handedness === "Right"){
        fill(255);
        stroke(220,20,100);
        // line(face.leftEye.x, face.leftEye.y, palmX, palmY);
        //  line(face.rightEye.x, face.rightEye.y, palmX, palmY);
     
      //  ellipse(palmX, palmY, 200);
     }
      strokeWeight(5);
 
     noStroke();
  }
 
   }




  



  //------------------------------------------------------------
  //facePart
  // for loop to capture if there is more than one face on the screen. This applies the same process to all faces. 
  //------------------------------------------------------
  // You can make addtional elements here, but keep the face drawing inside the for loop. }


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

function pinchCircle(hand) { // adapted from https://editor.p5js.org/ml5/sketches/DNbSiIYKB
  // Find the index finger tip and thumb tip
  let finger = hand.index_finger_tip;
  //let finger = hand.pinky_finger_tip;
  let thumb = hand.thumb_tip;

  // Draw circles at finger positions
  let centerX = (finger.x + thumb.x) / 2;
  let centerY = (finger.y + thumb.y) / 2;
  // Calculate the pinch "distance" between finger and thumb
  let pinch = dist(finger.x, finger.y, thumb.x, thumb.y);

  // This circle's size is controlled by a "pinch" gesture
  fill(0, 255, 0, 200);
  stroke(0);
  strokeWeight(2);
  circle(centerX, centerY, pinch);

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