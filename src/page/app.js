var Mustache = require("mustache");
var fs = require("fs");
var path = require('path');
var utils = require('./libs/utils')(path,fs,Mustache);
var pages = require('./pages.json');

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    var pageName = event.pathParameters.pageName;
    console.log(pages[pageName]);
    var page = utils.buildPage(pages[pageName], pages[pageName].template);
    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'text/html'},
     "statusCode": 200,
     "body": page
     };
};