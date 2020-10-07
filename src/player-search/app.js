const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "TranmereWebPlayerSeasonSummary";

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var season = event.queryStringParameters.season;
    var sort = event.queryStringParameters.sort;
    var player = event.queryStringParameters.player

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
     "body": JSON.stringify({players: results})
     };
};