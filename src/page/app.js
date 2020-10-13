const AWSXRay = require('aws-xray-sdk');
const http = require('http');
const https = require('https');
AWSXRay.captureHTTPsGlobal(http);
AWSXRay.captureHTTPsGlobal(https);
var axios = require("axios");

AWSXRay.capturePromise(); // We should capture promies
const instance = axios.create({
  httpAgent: new http.Agent(),
  httpsAgent: new https.Agent(),
}); // Instrument axious instance

var Mustache = require("mustache");
var fs = require("fs");
var path = require('path');
var utils = require('./libs/utils')(path,fs,Mustache);
var pages = require('./pages.json');


exports.handler = async function (event, context) {
    var pageName = event.pathParameters.pageName;
    var playerName = event.pathParameters.player;
    var options = {headers: {"x-api-key": process.env.API_KEY}};
    var player = await instance.get("https://api.tranmere-web.com/profile/"+ playerName,options);
    var view = player.data;
    view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
    view.title = "Player Profile " + decodeURIComponent(playerName);
    view.pageType = "AboutPage";
    view.description = "Player Profile for " + decodeURIComponent(playerName);
    view.url = "/page/player/"+decodeURIComponent(playerName);

    var page = utils.buildPage(view, pages[pageName].template);
    return {
     "isBase64Encoded": false,
     "headers": {
        "Content-Type": "text/html",
        "Content-Security-Policy" : "upgrade-insecure-requests",
        "Strict-Transport-Security" : "max-age=1000",
        "X-Xss-Protection" : "1; mode=block",
        "X-Frame-Options" : "DENY",
        "X-Content-Type-Options" : "nosniff",
        "Referrer-Policy" : "strict-origin-when-cross-origin"
     },
     "statusCode": 200,
     "body": page
     };
};