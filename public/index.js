var request = require('request');
var cameras; // Array of all cameras which is refreshed everytime the map is initialized
var selectedCamera; // Selected camera object
var token;

//------------------------------------------------------------------------------
// Grab all camera data from data.gov.sg API
//------------------------------------------------------------------------------
async function grabCameraData() {
  var parsedData = "";

  let promise = new Promise((resolve, reject) => {
    request("https://api.data.gov.sg/v1/transport/traffic-images", function(error, response, body) {
    if (!error && response.statusCode == 200) {
      parsedData = JSON.parse(body);
      resolve(JSON.parse(body));
    }
    console.log(error);
    });
  });
  let result = await promise;
  cameras =  parsedData.items[0].cameras;
};


//------------------------------------------------------------------------------
// Initialize google maps with markers
//------------------------------------------------------------------------------
window.initMap = async function() {
	var map = new google.maps.Map(document.getElementById('map'), {
    	zoom: 11,
    	center: new google.maps.LatLng(1.351616, 103.808053),
    	mapTypeId: 'terrain'
 	}); 
 	
	// Refresh data from the API and grab cameras array
	let _camerasData = await grabCameraData();
 	
 	// Populate with camera markers
 	var marker;
 	
 	for( i = 0; i < cameras.length; i++) {
		marker = new google.maps.Marker({
			position: {lat:cameras[i].location.latitude, lng: cameras[i].location.longitude},
			map: map,
			title: cameras[i].camera_id
		});	
		// Listen for user selected camera and trigger update
		google.maps.event.addListener(marker, 'click', markerHandler);
	}
	
	// Update the result for selected camera
	function markerHandler() {
      changeContent(this.title)
	}
	
} 

// Update the results
function changeContent(camera_id) {
	var classificationResult;
	
	// Loop through cameras array to get selected camera
	for( i = 0; i < cameras.length; i++ ) {
		if(cameras[i].camera_id == camera_id) {
			selectedCamera = cameras[i];
			// Trigger Watson classification and save to classificationResult
			classificationResult = getToken().then(analyze);
		}
	}
	
	var contentChange = document.getElementById('result'); // Target the results div
	contentChange.innerHTML = objToStr(selectedCamera, classificationResult);
}

// Convert result to be displayed to string
function objToStr(camera, classificationResult) {
	return `
		<div id="snapshot">
			<img src="${camera.image}" alt="">
		</div>
		<div id="details">
			<h1>Camera ID: ${camera.camera_id}</h1>
			<p>Longitude: ${camera.location.longitude}</p>
			<p>Latitude: ${camera.location.latitude}</p>
			<p>Traffic Level: ${classificationResult}</p>
		</div>
	`
}

//------------------------------------------------------------------------------
// Use Watson Visual Recognition to classify images
//------------------------------------------------------------------------------
var VisualRecognitionV3 = require('watson-developer-cloud/visual-recognition/v3');
var fs = require('fs');

/**
 * @return {Promise<String>} returns a promise that resolves to a string token
 */
function getToken() {
  	return fetch('/api/token/visual_recognition').then(function(response) {
    	token = response.text();
  	});
}

function analyze(token) {
	
    var visualRecognition = new VisualRecognitionV3({
      url: 'https://gateway.watsonplatform.net/visual-recognition/api',
      version: '2018-03-19',
      iam_apikey: 'IQRru6KdJgFhyvOzNSVcihGAKIQEeOe6uo27aenGxI7P',
      token: token,
    });
    
    var url = selectedCamera.image;
    var classifier_ids = ["DefaultCustomModel_1298289964"];
    
    var params = {
      url: url,
      classifier_ids: classifier_ids
    };
    
    visualRecognition.classify(params, function(err, res) {
      if (err) {
        console.log(err);
      } else {
        var result = JSON.stringify(res, null, 2);
        return JSON.parse(result).images[0].classifiers[0].classes[0].class;
      }
    });
}

