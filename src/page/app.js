var Mustache = require("mustache");
var fs = require("fs");
var path = require('path');
var utils = require('./libs/utils')(path,fs,Mustache);
var pages = require('./pages.json');
var axios = require("axios");

exports.handler = async function (event, context) {
    var pageName = event.pathParameters.pageName;

    var player = await axios.get("https://api.tranmere-web.com/profile/John Aldridge");
    var view = player.data;
    view.image: utils.buildImagePath("photos/kop.jpg", 1920,1080)

    var page = utils.buildPage(pages[pageName], pages[pageName].template);
    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'text/html'},
     "statusCode": 200,
     "body": page
     };
};