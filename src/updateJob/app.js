const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "TranmereWebPlayerSeasonSummary";

exports.handler = async function (event, context) {
   console.log('Received event:', event);

    var playerTotalsHash = {};

    for(var i = 1984; i <2021; i++) {
        var playerHash = {};
        var appsQuery = {
            TableName:"TranmereWebApps",
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : i
            }
        };
        var goalsQuery = {
            TableName:"TranmereWebGoals",
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : i
            }
        };
        var apps = await dynamo.query(appsQuery).promise().Items;
        var goals= await dynamo.query(goalsQuery).promise().Items;

        for(var a=0; a < apps.length; g++) {
            var app = apps[a];
            if(!playerHash[app.Name]) {
               playerHash[app.Name] = buildNewPlayer(i,app.Name);
            }
            playerHash[app.Name].starts++;
            playerHash[app.Name].apps++;

            if(app.YellowCard)
                playerHash[app.Name].yellow++;
            if(app.RedCard)
                playerHash[app.Name].red++;

             if(app.SubbedBy) {
                if(!playerHash[app.SubbedBy]) {
                   playerHash[app.SubbedBy] = buildNewPlayer(i,app.SubbedBy);
                }
                playerHash[app.SubbedBy].subs++;
                playerHash[app.SubbedBy].apps++;

                if(app.SubYellow)
                    playerHash[app.SubbedBy].yellow++;
                if(app.SubRed)
                    playerHash[app.SubbedBy].red++;
             }
        }
        for(var g=0; g < goals.length; g++) {
            var goal = goals[g];
            if(!playerHash[goal.Name]) {
               playerHash[goal.Name] = buildNewPlayer(i,goal.Name);
            }
            playerHash[goal.Name].goals++;
            if(goal.GoalType == "Header") {
                playerHash[goal.Name].headers++;
            } else if(goal.GoalType == "FreeKick") {
                playerHash[goal.Name].freekicks++;
            } else if(goal.GoalType == "Penalty") {
                playerHash[goal.Name].penalties++;
            }
            if(goal.Assist) {
                if(!playerHash[goal.Assist]) {
                    playerHash[goal.Assist] = buildNewPlayer(i,goal.Assist);
                }
                playerHash[goal.Assist].assists++;
            }
        }

        await dynamo.delete({Key: {season: i}, TableName: TABLE_NAME}).promise();

        Object.keys(playerHash).forEach(function(key,index) {
            await dynamo.put({Item: playerHash[key], TableName: TABLE_NAME}).promise();
            if(!playerTotalsHash[key]) {
               playerTotalsHash[key] = buildNewPlayer("TOTAL",key);
            }
            playerTotalsHash[key].apps = playerTotalsHash[key].apps + playerHash[key].apps;
            playerTotalsHash[key].starts = playerTotalsHash[key].starts + playerHash[key].starts;
            playerTotalsHash[key].subs = playerTotalsHash[key].subs + playerHash[key].subs;
            playerTotalsHash[key].goals = playerTotalsHash[key].goals + playerHash[key].goals;
            playerTotalsHash[key].assists = playerTotalsHash[key].assists + playerHash[key].assists;
            playerTotalsHash[key].headers = playerTotalsHash[key].headers + playerHash[key].headers;
            playerTotalsHash[key].freekicks = playerTotalsHash[key].freekicks + playerHash[key].freekicks;
            playerTotalsHash[key].penalties = playerTotalsHash[key].penalties + playerHash[key].penalties;
            playerTotalsHash[key].yellow = playerTotalsHash[key].yellow + playerHash[key].yellow;
            playerTotalsHash[key].red = playerTotalsHash[key].red + playerHash[key].red;
        });
    }
    await dynamo.delete({Key: {season: "TOTAL"}, TableName: TABLE_NAME}).promise();
    Object.keys(playerTotalsHash).forEach(function(key,index) {
        await dynamo.put({Item: playerTotalsHash[key], TableName: TABLE_NAME}).promise();
    });

};

function buildNewPlayer(season, name) {
    return {
        season: season,
        name: name,
        apps: 0,
        starts: 0,
        subs: 0,
        goals: 0,
        assists: 0,
        headers: 0,
        freekicks: 0,
        penalties: 0,
        yellow: 0,
        red: 0
    }
}