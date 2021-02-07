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
            random: Math.ceil(Math.random() * 100000)
        };

        view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
        view.title = "Player Profile " + decodeURIComponent(playerName);
        view.pageType = "AboutPage";
        view.description = "Player Profile for " + decodeURIComponent(playerName);
        view.url = "/page/player/"+decodeURIComponent(playerName);
    } else if(pageName === "tag") {
        var tagId = decodeURIComponent(classifier);
        var items = await client.getEntries({'fields.tag': tagId, 'content_type': 'blogPost', order: '-fields.datePosted'});
        var blogs = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});

        view = {
            items: items.items,
            pageType: "SearchResultsPage",
            title: "All blogs for " + tagId,
            description: "All blogs for " + tagId,
            view.random =  Math.ceil(Math.random() * 100000),
            view.blogs = blogs.items
        }

    } else if(pageName === "blog") {
        var blogId = decodeURIComponent(classifier);
        var content = await client.getEntry(blogId);
        var blogs = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});
        view = content.fields;
        view.image = utils.buildImagePath("photos/kop.jpg", 1920,1080)
        view.pageType = "AboutPage";
        view.description = "Blog Page | " + content.fields.title;
        view.blogContent = contentfulSDK.documentToHtmlString(content.fields.blog);
        view.random =  Math.ceil(Math.random() * 100000);
        view.blogs = blogs.items;
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
    } else if(pageName === "gallery") {
        var content = await client.getEntries({'content_type': 'blogPost', order: '-fields.datePosted'});
        var gallerySearch = await dynamo.query(
            {
                TableName: MEDIA_TABLE_NAME,
                KeyConditionExpression: "#category = :category",
                IndexName: "ByCategoryIndex",
                ExpressionAttributeNames:{
                    "#category": "category"
                },
                ExpressionAttributeValues: {
                    ":category": decodeURIComponent(classifier),
                }
            }).promise();

        var view = {
            title: "Tranmere Rovers " + decodeURIComponent(classifier),
            pageType:"WebPage",
            description: `decodeURIComponent(classifier) Featuring Tranmere Rovers`,
            blogs: content.items,
            random:  Math.ceil(Math.random() * 100000)
        };
        var media = [];

        for(var i=0; i < gallerySearch.Items.length; i++) {
           var item = gallerySearch.Items[i];

           if(gallerySearch.Items[i].cmsImage) {
                item.imagePath = gallerySearch.Items[i].cmsImage.fields.file.url;
                item.linkPath = gallerySearch.Items[i].cmsImage.fields.file.url;
           } else {
               var image = {
                 "bucket": "trfc-programmes",
                 "key": item.image,
                 "edits": {
                   "resize": {
                     "height": 400,
                     "fit": "contain"
                   }
                 }
               };
               var link = {
                    "bucket": "trfc-programmes",
                    "key": item.image,
                    "edits": {
                     "resize": {
                       "height": 1200,
                       "fit": "contain"
                     }
                   }
               };
               item.imagePath = "https://images.tranmere-web.com/" + Buffer.from(JSON.stringify(image)).toString('base64');
               item.linkPath = "https://images.tranmere-web.com/" + Buffer.from(JSON.stringify(link)).toString('base64');
           }
           media.push(item)
         }
         media.sort(function(a, b) {
           if (a.published < b.published) return -1
           if (a.published > b.published) return 1
           return 0
         });
        view.carousel = media;
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