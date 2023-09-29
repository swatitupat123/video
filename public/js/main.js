import h from './helpers.js';
  
const video = document.getElementById("video");
const savedDetections =[];
let genderAPI;
 
 
 
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/models'),
  faceapi.nets.ageGenderNet.loadFromUri('/models')
]).then(getAndSetUserStream);
 
 
 
;
const user=sessionStorage.getItem( 'username' );
var myStream = '';
function getAndSetUserStream() {
  h.getUserFullMedia().then( ( stream ) => {
      //save my stream
      myStream = stream;
 
      h.setLocalStream( stream );
  } ).catch( ( e ) => {
      console.error( `stream error: ${ e }` );
  } );
  loadVideo(username);
}
 
function loadVideo(username){
 
video.addEventListener("playing", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
 
  const displaySize = { width: 300, height: 200};
  faceapi.matchDimensions(canvas, displaySize);
 
  setInterval(async () => {
    const detections = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender();
 
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
 
    if (resizedDetections && Object.keys(resizedDetections).length > 0) {
      const gender = resizedDetections.gender;
      const expressions = resizedDetections.expressions;
      const maxValue = Math.max(...Object.values(expressions));
      const emotion = Object.keys(expressions).filter(
        (item) => expressions[item] === maxValue
      );
      genderAPI=gender;
      const leftEye = resizedDetections.landmarks.getLeftEye()[0];
      const rightEye = resizedDetections.landmarks.getRightEye()[0];
      let gazeDirection = "";
            if (leftEye && rightEye) {
              const horizontalOffset = (rightEye.x - leftEye.x) / video.width;
              if (horizontalOffset > 0.2) {
                gazeDirection = "Looking camera";
              } else if (horizontalOffset < 0.2) {
                gazeDirection = "Away from Camera";
              }
 
            }
 
      var date = new Date();
     
      savedDetections.push({
        gaze: gazeDirection,
        emotion: emotion[0],
        timestamp: date.getTime()
      });
      calculatePercentages();
      console.log("savedDetections - ",savedDetections)
    }

  }, 2000)
});
}
 
document.addEventListener("DOMContentLoaded", function() {
  const leaveButton = document.getElementById("leave-room");
  leaveButton.addEventListener("click", handlebuttonclick);
});

function handlebuttonclick()
{
  calculatePercentages();
  saveDetectionsToFile();
}
 
function calculatePercentages() {
  Object.keys(savedDetections).map(() => {
 
    const personDetections = savedDetections;
    let lookingCameraCount = 0;
    let lookingAwayCount = 0;
    personDetections.map((e) => {
      if (e.gaze === "Looking camera") {
        lookingCameraCount++;
      } else if (e.gaze === "Away from Camera") {
        lookingAwayCount++;
      }
    });
    const totalDetections = lookingCameraCount + lookingAwayCount;
    const Attentative = (lookingCameraCount / totalDetections) * 100;
    const Non_Attentative = (lookingAwayCount / totalDetections) * 100;
    savedDetections.Attentative = Attentative.toFixed(2);
    savedDetections.Non_Attentative = Non_Attentative.toFixed(2);
  });
 
}
 
function saveDetectionsToFile() {
  const jsonData = JSON.stringify(savedDetections, null, 2);
  const room = h.getQString( location.href, 'room' );
  const username = sessionStorage.getItem('username');
  const data = {
  roomName:room,
  username:username,
  genderData:genderAPI,
  Attentative:savedDetections.Attentative,
  Non_Attentative:savedDetections.Non_Attentative,
  facialData: jsonData
};
 
fetch('/api/saveData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((result) => {
    console.log(result); // Handle the server's response
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}