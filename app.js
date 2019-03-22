/*eslint-env node*/

//------------------------------------------------------------------------------
// Traffic Level Classifier
//------------------------------------------------------------------------------

var express = require('express'); // eslint-disable-line node/no-missing-require
var cfenv = require('cfenv');
var app = express();
var expressBrowserify = require('express-browserify'); // eslint-disable-line node/no-missing-require
var watson = require('watson-developer-cloud');

// Automatically watch for changes on express-browserify
var isDev = app.get('env') === 'development';
app.get(
  'public/bundle.js',
  expressBrowserify('public/index.js', {
    watch: isDev,
    debug: isDev
  })
);

app.use(express.static(__dirname + '/public'));

// For local development, specify the username and password or set env properties
var ltAuthService = new watson.AuthorizationV1({
  iam_apikey: process.env.VISUAL_RECOGNITION_API_KEY || <iam_apikey>, // Use personal key
});

app.get('/api/token/visual_recognition', function(req, res) {
  ltAuthService.getToken(function(err, token) {
    if (err) {
      console.log('Error retrieving token: ', err);
      return res.status(500).send('Error retrieving token');
    }
    res.send(token);
  });
});

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

// Start the app
app.listen(appEnv.port, '0.0.0.0', function() {
  console.log("Server is starting on " + appEnv.url);
});
