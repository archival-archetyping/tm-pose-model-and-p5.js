// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/pose

// the link to your model provided by Teachable Machine export panel
// Note: renamed from URL (see https://github.com/processing/p5.js/issues/4532)
const tmURL = 'https://teachablemachine.withgoogle.com/models/Cx9idIIQH/';
let model, webcam, ctx, labelContainer, maxPredictions;

const probabilityThreshold = 0.7;
let topClassLabel = '';

function setup() {
  init();
  createCanvas(200, 200);
}

function draw() {
  background(0);
  fill(255);
  textSize(32);
  textAlign(CENTER, CENTER);
  text(topClassLabel, width / 2, height / 2);
}

async function init() {
  const modelURL = tmURL + 'model.json';
  const metadataURL = tmURL + 'metadata.json';

  // load the model and metadata
  // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
  // Note: the pose library adds a tmPose object to your window (window.tmPose)
  model = await tmPose.load(modelURL, metadataURL);
  modelReady = true;
  maxPredictions = model.getTotalClasses();

  // Convenience function to setup a webcam
  const size = 200;
  const flip = true; // whether to flip the webcam
  webcam = new tmPose.Webcam(size, size, flip); // width, height, flip
  await webcam.setup(); // request access to the webcam
  await webcam.play();
  window.requestAnimationFrame(tmPoseLoop);

  // append/get elements to the DOM
  const canvas = document.getElementById('canvas');
  canvas.width = size;
  canvas.height = size;
  ctx = canvas.getContext('2d');
  labelContainer = document.getElementById('label-container');
  for (let i = 0; i < maxPredictions; i++) {
    // and class labels
    labelContainer.appendChild(document.createElement('div'));
  }
}

// Note: renamed from loop, since loop is reserved in p5.js
async function tmPoseLoop(timestamp) {
  webcam.update(); // update the webcam frame
  await predict();
  window.requestAnimationFrame(tmPoseLoop);
}

async function predict() {
  // Prediction #1: run input through posenet
  // estimatePose can take in an image, video or canvas html element
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  // Prediction 2: run input through teachable machine classification model
  // const prediction = await model.predict(posenetOutput);
  const prediction = await model.predictTopK(posenetOutput, maxPredictions);

  if (prediction[0].probability >= probabilityThreshold) {
    topClassLabel = prediction[0].className;
    // Put your cool stuff here
  }

  for (let i = 0; i < maxPredictions; i++) {
    const classPrediction =
      prediction[i].className + ': ' + prediction[i].probability.toFixed(2);
    labelContainer.childNodes[i].innerHTML = classPrediction;
  }

  // finally draw the poses
  drawPose(pose);
}

function drawPose(pose) {
  if (webcam.canvas) {
    ctx.drawImage(webcam.canvas, 0, 0);
    // draw the keypoints and skeleton
    if (pose) {
      const minPartConfidence = 0.5;
      tmPose.drawKeypoints(pose.keypoints, minPartConfidence, ctx);
      tmPose.drawSkeleton(pose.keypoints, minPartConfidence, ctx);
    }
  }
}
