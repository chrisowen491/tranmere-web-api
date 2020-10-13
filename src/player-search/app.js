const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const TABLE_NAME = "TranmereWebPlayerSeasonSummaryTable";

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var squadSearch = await dynamo.scan({TableName:"TranmereWebPlayerTable"}).promise();
    var playerHash = {};
    for(var i=0; i < squadSearch.Items.length; i++) {
        playerHash[squadSearch.Items[i].name] = squadSearch.Items[i];
    }

    var season = event.queryStringParameters ? event.queryStringParameters.season : null;
    var sort = event.queryStringParameters ? event.queryStringParameters.sort : null;
    var player = event.queryStringParameters ? event.queryStringParameters.player : null;

    var query = {};

    if(player) {
        query = {
            TableName:TABLE_NAME,
            IndexName: "ByPlayerIndex",
            KeyConditionExpression :  "Player = :player",
            ExpressionAttributeValues: {
                ":player" : player
            }
        };
    } else {
        if(!season)
            season = "TOTAL";

        query = {
            TableName:TABLE_NAME,
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : season
            }
        };
    }

    var result = await dynamo.query(query).promise();
    var results = result.Items;

    for(var x=0; x < results.length; x++ ) {
        results[x].bio = playerHash[results[x].Player];
    }

    if(sort == "Goals") {
        results.sort(function(a, b) {
          if (a.goals < b.goals) return 1
          if (a.goals > b.goals) return -1
          return 0
        });
    } else {
        results.sort(function(a, b) {
          if (a.Apps < b.Apps) return 1
          if (a.Apps > b.Apps) return -1
          return 0
        });
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({players: results.slice(0, 50)})
     };
};