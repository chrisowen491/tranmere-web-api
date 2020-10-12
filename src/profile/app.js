const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const SUMMARY_TABLE_NAME = "TranmereWebPlayerSeasonSummaryTable";
const LINKS_TABLE_NAME = "TranmereWebPlayerLinks";
const APPS_TABLE_NAME = "TranmereWebAppsTable";
const TRANSFERS_TABLE_NAME = "TranmereWebPlayerTransfers";
const PLAYER_TABLE_NAME = "TranmereWebPlayerTable";

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    const player = decodeURIComponent(event.pathParameters.player);

    var linksSearch = await dynamo.query(
        {
            TableName: LINKS_TABLE_NAME,
            KeyConditionExpression: "#name = :name",
            ExpressionAttributeNames:{
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":name": decodeURIComponent(player),
            }
        }).promise();

    var playerSearch = await dynamo.query(
        {
            TableName: PLAYER_TABLE_NAME,
            KeyConditionExpression: "#name = :name",
            ExpressionAttributeNames:{
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":name": decodeURIComponent(player),
            },
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
                ":name": decodeURIComponent(player),
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
                ":player": decodeURIComponent(player),
            }
        }).promise();

    var transfersSearch = await dynamo.query(
        {
            TableName: TRANSFERS_TABLE_NAME,
            KeyConditionExpression: "#name = :name",
            ExpressionAttributeNames:{
                "#name": "name"
            },
            ExpressionAttributeValues: {
                ":name": decodeURIComponent(player),
            }
        }).promise();

    var playerObj = {
        player: playerSearch.Items[0],
        links: linksSearch.Items,
        transfers: transfersSearch.Items,
        seasons: summarySearch.Items,
        debut: debutSearch.Items[0]
    }


    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify(playerObj)
     };
};