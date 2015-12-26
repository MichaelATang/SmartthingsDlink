// Gmail Stuff

var fs = require('fs');
var moment = require('moment');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';


// Smartthings stuff
var unirest = require('unirest');
var util = require('util');
var events = require('events');
//var minimist = require('minimist');
var SmartThings = require("./lib/smartthingslib").SmartThings;

// Load settings from file
var settings = require('./config/settings.json');

// Load client secrets from a local file.
fs.readFile('./config/client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error loading client secret file: ' + err);
    return;
  }
  // Authorize a client with the loaded credentials, then call the
  // Gmail API.
  authorize(JSON.parse(content), listLabels);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listLabels(auth) {
  var gmail = google.gmail('v1');

// Check for unread emails from dlink
  var emails = gmail.users.messages.list({
       auth: auth,
       userId: 'me',
       includeSpamTrash: false,
       maxResults: settings.gmailMaxResults,
       q: settings.gmailQuery
       
  }, function handleEmails(err, response){

      if (err) {
         console.log('The API returned an error: ' + err);
         return;
      }else if (response.resultSizeEstimate == 0) {
         console.log('No Unread emails found.');

          // write date and time of detection
           // used for timer to turn off light
           fs.readFile(settings.outputFile, 'utf8', function(err,data) {
              
              if(err) {
                  return console.log(err);
              }
               
              // Use moment to calcualte how many minutes since list write
              //var minutesDiff = moment().subtract(data, 'minute');
              var startTime = moment(data, 'hh:mm:ss a');
              //console.log(startTime);
              var endTime = moment(moment(), 'hh:mm:ss a');

              var minutesDiff = endTime.diff(startTime, 'minutes');

              if( minutesDiff >= settings.waitMinutes){
                  // Turn off switch
                  turnOnSwitch("{switch:0}");
              }

              console.log("The file was read! " + minutesDiff);
          });      

         return;
      } else {

           // Get time and date info from the moment package
           var now = moment().format('hh:mm:ss a');

           // write date and time of detection
           // used for timer to turn off light
           fs.writeFile(settings.outputFile, now , function(err) {
              if(err) {
                  return console.log(err);
              }

              console.log("The file was saved!");
  
           });
           //console.log(response);
           //If we have unread emails from DLINK then Mark the email as read
           // and turn on the switch
           for (var i = 0; i < response.resultSizeEstimate; i++) {                      

                  var emailmod = gmail.users.messages.modify({
                      auth: auth,
                      userId: 'me',
                      id: response.messages[i].id,
                      resource:{
                        removeLabelIds: ['UNREAD']
                      }                      
                  }, function(err, response){
                   if(err){
                      console.log('The API returned an error: ' + err);
                      return;
                   }

               })
                 
           }

           turnOnSwitch("{switch:1}");
              
      }
      
  });   

}


function turnOnSwitch(command){
    var sm = new SmartThings();
    sm.on("endpoint", function () {
        sm.request_devices('switch');
    });

    sm.on("devices", function (device_type, devices) {
       var di;
       var device;
       // Device ID
       // get device from id or label
        var ds = [];
        for (di in devices) {
            device = devices[di];
            if ((device.id === settings.deviceId) || (device.label === settings.deviceId)) {
                ds.push(device);
            }
        }
        devices = ds;
     
         // pass command to device
       
         var request = {};
          for (di in devices) {
              device = devices[di];
             sm.device_request(device, command);
                
          } 
    });

    sm.load_settings();
    sm.request_endpoint();

}


