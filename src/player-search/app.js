const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var season = event.queryStringParameters.season;
    var sort = event.queryStringParameters.sort;
    var player = event.queryStringParameters.player

    var query = {};

    if(player) {
        query = {
            TableName:"TranmereWebPlayerTable",
            IndexName: "ByPlayerIndex"
            KeyConditionExpression :  "player = :player",
            ExpressionAttributeValues: {,
                ":player" : player
            }
        };
    } else {
        if(!season)
            season = "TOTAL";

        query = {
            TableName:"TranmereWebPlayerTable",
            KeyConditionExpression :  "season = :season",
            ExpressionAttributeValues: {,
                ":season" : season
            }
        };
    }

    var result = await dynamo.query(query).promise();
    var results = result.Items;

    if(sort == "Goals") {
        players.sort(function(a, b) {
          if (a.goals < b.goals) return 1
          if (a.goals > b.goals) return -1
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