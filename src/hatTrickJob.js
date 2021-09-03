const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "TranmereWebHatTricks";

exports.handler = async function (event, context) {
   console.log('Received event:', event);

    var playerTotalsHash = {};

    for(var i = 1977; i <2022; i++) {
        var dateMap = {};
        
        // Get All Goals
        var goalsQuery = {
            TableName:"TranmereWebGoalsTable",
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : i.toString()
            }
        };

        var goalsResult = await dynamo.query(goalsQuery).promise();

        var goals = goalsResult.Items ? goalsResult.Items : [];

        for(var g=0; g < goals.length; g++) {
            var goal = goals[g];

            if(!dateMap[goal.Date]) {
                dateMap[goal.Date] = [goal];
            } else {
                dateMap[goal.Date].push(goal);
            }
        }

        for (var key in dateMap) {
            if (Object.prototype.hasOwnProperty.call(dateMap, key)) {
                if(dateMap[key].length >= 3) {
                    var playerMap = {};
                    for(var g=0; g < dateMap[key].length; g++) {
                        var goal = dateMap[key][g];
                        if(!playerMap[goal.Scorer]) {
                            playerMap[goal.Scorer] = [goal];
                        } else {
                            playerMap[goal.Scorer].push(goal);
                        }
                    }

                    for (var player in playerMap) {
                        if (Object.prototype.hasOwnProperty.call(playerMap, player)) {
                            if(playerMap[player].length >= 3) {
                                console.log(`Hat Trick Found For ${playerMap[player][0].Scorer} against ${playerMap[player][0].Opposition} on ${playerMap[player][0].Date}`);
                            }
                        }
                    }
                }
            } 
        }
    }

};