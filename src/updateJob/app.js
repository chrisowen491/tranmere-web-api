const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = "TranmereWebPlayerSeasonSummaryTable";

exports.handler = async function (event, context) {
   console.log('Received event:', event);

    var playerTotalsHash = {};

    for(var i = 1984; i <2021; i++) {
        var playerHash = {};
        var appsQuery = {
            TableName:"TranmereWebAppsTable",
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : i.toString()
            }
        };
        var goalsQuery = {
            TableName:"TranmereWebGoalsTable",
            KeyConditionExpression :  "Season = :season",
            ExpressionAttributeValues: {
                ":season" : i.toString()
            }
        };

        var appsResult = await dynamo.query(appsQuery).promise();

        var goalsResult = await dynamo.query(goalsQuery).promise();

        var apps = appsResult.Items ? appsResult.Items : [];
        var goals = goalsResult.Items ? goalsResult.Items : [];

        console.log("Found " + apps.length + " for season " + i);
        console.log("Found " + goals.length + " for season " + i);
        for(var a=0; a < apps.length; a++) {
            var app = apps[a];
            if(!playerHash[app.Name]) {
               playerHash[app.Name] = buildNewPlayer(i,app.Name);
            }
            playerHash[app.Name].starts++;
            playerHash[app.Name].Apps++;

            if(app.YellowCard)
                playerHash[app.Name].yellow++;
            if(app.RedCard)
                playerHash[app.Name].red++;

             if(app.SubbedBy) {
                if(!playerHash[app.SubbedBy]) {
                   playerHash[app.SubbedBy] = buildNewPlayer(i,app.SubbedBy);
                }
                playerHash[app.SubbedBy].subs++;
                playerHash[app.SubbedBy].Apps++;

                if(app.SubYellow)
                    playerHash[app.SubbedBy].yellow++;
                if(app.SubRed)
                    playerHash[app.SubbedBy].red++;
             }
        }
        for(var g=0; g < goals.length; g++) {
            var goal = goals[g];
            if(!playerHash[goal.Scorer]) {
               playerHash[goal.Scorer] = buildNewPlayer(i,goal.Scorer);
            }
            playerHash[goal.Scorer].goals++;
            if(goal.GoalType == "Header") {
                playerHash[goal.Scorer].headers++;
            } else if(goal.GoalType == "FreeKick") {
                playerHash[goal.Scorer].freekicks++;
            } else if(goal.GoalType == "Penalty") {
                playerHash[goal.Scorer].penalties++;
            }
            if(goal.Assist) {
                if(!playerHash[goal.Assist]) {
                    playerHash[goal.Assist] = buildNewPlayer(i,goal.Assist);
                }
                playerHash[goal.Assist].assists++;
            }
        }

        for (var key in playerHash) {
            if (Object.prototype.hasOwnProperty.call(playerHash, key)) {
                if(key != "")
                    await dynamo.put({Item: playerHash[key], TableName: TABLE_NAME}).promise();

                console.log("Updated DB for " + key + " during season "  + i);
                if(!playerTotalsHash[key]) {
                   playerTotalsHash[key] = buildNewPlayer("TOTAL",key);
                }
                playerTotalsHash[key].Apps = playerTotalsHash[key].Apps + playerHash[key].Apps;
                playerTotalsHash[key].starts = playerTotalsHash[key].starts + playerHash[key].starts;
                playerTotalsHash[key].subs = playerTotalsHash[key].subs + playerHash[key].subs;
                playerTotalsHash[key].goals = playerTotalsHash[key].goals + playerHash[key].goals;
                playerTotalsHash[key].assists = playerTotalsHash[key].assists + playerHash[key].assists;
                playerTotalsHash[key].headers = playerTotalsHash[key].headers + playerHash[key].headers;
                playerTotalsHash[key].freekicks = playerTotalsHash[key].freekicks + playerHash[key].freekicks;
                playerTotalsHash[key].penalties = playerTotalsHash[key].penalties + playerHash[key].penalties;
                playerTotalsHash[key].yellow = playerTotalsHash[key].yellow + playerHash[key].yellow;
                playerTotalsHash[key].red = playerTotalsHash[key].red + playerHash[key].red;
            }
        }
    }

    for (var key in playerTotalsHash) {
        if (Object.prototype.hasOwnProperty.call(playerTotalsHash, key)) {
            if(key != "")
                await dynamo.put({Item: playerTotalsHash[key], TableName: TABLE_NAME}).promise();
        }
    }

};

function buildNewPlayer(season, name) {
    const SECONDS_IN_AN_HOUR = 60 * 60;
    const secondsSinceEpoch = Math.round(Date.now() / 1000);
    const expirationTime = secondsSinceEpoch + 24 * SECONDS_IN_AN_HOUR;

    return {
        Season: season.toString(),
        Player: name,
        TimeToLive: expirationTime,
        Apps: 0,
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