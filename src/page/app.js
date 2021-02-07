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
const MEDIA_TABLE_NAME = "TranmereWebMediaSyncTable";
const client = contentful.createClient({
  space: process.env.CF_SPACE,
  accessToken: process.env.CF_KEY
});

exports.handler = async function (event, context) {
    var pageName = event.pathParameters.pageName;
    var classifier = event.pathParameters.classifier;
    var view = {}

    if(pageName === "home") {
        var content = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});
        view = {
            title: "Home",
            pageType:"WebPage",
            description: "Tranmere-Web.com is a website full of data, statistics and information about Tranmere Rovers FC",
            blogs: content.items,
            random: Math.ceil(Math.random() * 100000)
        };
    } else if(pageName === "player") {
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
            player: playerSearch.Items.length == 1 ? playerSearch.Items[0] : null,
            random: Math.ceil(Math.random() * 100000),
            url: `/page/${pageName}/${classifier}`
        };

        view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
        view.title = "Player Profile " + decodeURIComponent(playerName);
        view.pageType = "AboutPage";
        view.description = "Player Profile for " + decodeURIComponent(playerName);
    } else if(pageName === "tag") {
        var tagId = decodeURIComponent(classifier);
        var items = await client.getEntries({'fields.tags': tagId, 'content_type': 'blogPost', order: '-fields.datePosted'});
        var blogs = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});

        view = {
            items: items.items,
            pageType: "SearchResultsPage",
            title: "All blogs for " + tagId,
            description: "All blogs for " + tagId,
            random: Math.ceil(Math.random() * 100000),
            blogs: blogs.items,
            url: `/page/${pageName}/${classifier}`,
        }

    } else if(pageName === "blog") {
        var blogId = decodeURIComponent(classifier);
        var content = await client.getEntry(blogId);
        var blogs = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});
        let options = {
          renderNode: {
            'embedded-asset-block': (node) =>
              `<img src="${node.data.target.fields.file.url}?h=400"/>`
          }
        }
        view = content.fields;
        view.pageType = "AboutPage";
        view.description = "Blog Page | " + content.fields.title;
        view.blogContent = contentfulSDK.documentToHtmlString(content.fields.blog, options);
        view.random =  Math.ceil(Math.random() * 100000);
        view.blogs = blogs.items;
        view.url =  `/page/${pageName}/${classifier}`;
        if(view.gallery) {
             view.carousel = [];
             for(var i=0; i < view.gallery.length; i++) {

                var image = {
                    imagePath: view.gallery[i].fields.file.url,
                    linkPath: view.gallery[i].fields.file.url,
                    name: view.gallery[i].fields.title,
                    description: view.gallery[i].fields.description
                }

                view.carousel.push(image);
            }
            pageName = "gallery";
            delete view.gallery;
        }

        if(view.blocks) {
            var blockContent = "";
            for(var b=0; b < view.blocks.length; b++) {
                blockContent = blockContent + "\n" + utils.renderFragment(view.blocks[b].fields, view.blocks[b].sys.contentType.sys.id);
            }
            view.blockHTML = blockContent;
        }

        if(view.cardBlocks) {
            var blockContent = "";
            for(var b=0; b<view.cardBlocks.length; b++) {
                blockContent = blockContent + "\n" + utils.renderFragment(view.cardBlocks[b].fields, view.cardBlocks[b].sys.contentType.sys.id);
            }
            view.cardBlocksHTML = blockContent;
        }
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
        "Referrer-Policy" : "strict-origin-when-cross-origin",
        "Cache-Control": "public"
     },
     "statusCode": 200,
     "body": page
     };
};