const AWS = require('aws-sdk');
const AWSXRay = require('aws-xray-sdk');
const http = require('http');
const https = require('https');
AWSXRay.captureHTTPsGlobal(http);
AWSXRay.captureHTTPsGlobal(https);


let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);

var Mustache = require("mustache");
var fs = require("fs");
var path = require('path');
var utils = require('./libs/utils')(path,fs,Mustache);
const contentful = require("contentful");
var pages = require('./pages.json');
var contentfulSDK = require('@contentful/rich-text-html-renderer');
const SUMMARY_TABLE_NAME = "TranmereWebPlayerSeasonSummaryTable";
const APPS_TABLE_NAME = "TranmereWebAppsTable";
const PLAYER_TABLE_NAME = "TranmereWebPlayerTable";
const client = contentful.createClient({
  space: process.env.CF_SPACE,
  accessToken: process.env.CF_KEY
});

exports.handler = async function (event, context) {
    var pageName = event.pathParameters.pageName;
    var classifier = event.pathParameters.classifier;
    var view = ""

    if(pageName === "player") {
        var playerName = classifier;
        var playerSearch = await dynamo.query(
            {
                TableName: PLAYER_TABLE_NAME,
                KeyConditionExpression: "#name = :name",
                ExpressionAttributeNames:{
                    "#name": "name"
                },
                ExpressionAttributeValues: {
                    ":name": decodeURIComponent(playerName),
                },
                IndexName: "ByNameIndex",
                Limit : 1
            }).promise();

        var debutSearch = await dynamo.query(
            {
                TableName: APPS_TABLE_NAME,
                KeyConditionExpression: "#name = :name",
                IndexName: "ByPlayerIndex",
                ExpressionAttributeNames:{
                    "#name": "Name"
                },
                ExpressionAttributeValues: {
                    ":name": decodeURIComponent(playerName),
                },
                Limit : 1
            }).promise();

        var summarySearch = await dynamo.query(
            {
                TableName: SUMMARY_TABLE_NAME,
                KeyConditionExpression: "#player = :player",
                IndexName: "ByPlayerIndex",
                ExpressionAttributeNames:{
                    "#player": "Player"
                },
                ExpressionAttributeValues: {
                    ":player": decodeURIComponent(playerName),
                }
            }).promise();

        view = {
            name: decodeURIComponent(playerName),
            debut: debutSearch.Items[0],
            seasons: summarySearch.Items,
            player: playerSearch.Items.length == 1 ? playerSearch.Items[0] : null
        };

        view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
        view.title = "Player Profile " + decodeURIComponent(playerName);
        view.pageType = "AboutPage";
        view.description = "Player Profile for " + decodeURIComponent(playerName);
        view.url = "/page/player/"+decodeURIComponent(playerName);
    } else if(pageName === "blog") {
        var blogId = classifier;
        console.log(blogId);
        var content = await client.getEntry(blogId);
        var view = content.fields;
        view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
        view.pageType = "AboutPage";
        view.description = "Blog Page | " + content.fields.title;
        view.blogContent = contentfulSDK.documentToHtmlString(content.fields.blog);
    }

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