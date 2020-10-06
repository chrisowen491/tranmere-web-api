const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    cloud: {
        id: process.env.ES_CLUSTER,
      },
      auth: {
        username: process.env.ES_USER,
        password: process.env.ES_PASSWORD
      }
});
var utils = require('./libs/utils')(client);

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var season = event.queryStringParameters.season;
    var sort = event.queryStringParameters.sort;

    var result = await dynamo.scan({TableName:"TranmereWebPlayerTable"}).promise();
    var results = result.Items;

    var apps = await utils.getTopPlayerByAppearances(600, season);
    var starts = await utils.getTopPlayerByStarts(600, season);
    var subs = await utils.getTopPlayerBySubs(600, season);
    var goals = await utils.getTopPlayerByGoals(600, season);

    var players = [];

    for(var i=0; i < apps.length; i++) {
        var player = {Name: apps[i].Name, Apps: apps[i].Apps, Goals: 0, Starts: 0};

        for(var x=0; x < goals.length; x++ ) {
            if(goals[x].Name == player.Name) {
                player.Goals = goals[x].Goals;
                break;
            }
        }
        for(var y=0; y < starts.length; y++ ) {
            if(starts[y].Name == player.Name) {
                player.Starts = starts[y].Starts;
                break;
            }
        }
        for(var z=0; z < subs.length; z++ ) {
            if(subs[z].Name == player.Name) {
                player.Subs = subs[z].Subs;
                break;
            }
        }

        for(var y=0; y < results.length; y++) {
            if(results[y].Name == player.Name) {
                player.Bio = results[y];
                break;
            }
        }
        players.push(player);
    }

    if(sort == "Goals") {
        players.sort(function(a, b) {
          if (a.Goals < b.Goals) return 1
          if (a.Goals > b.Goals) return -1
          return 0
        });
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({players: players})
     };
};