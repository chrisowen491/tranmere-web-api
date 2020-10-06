const { v4: uuidv4 } = require('uuid');
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

exports.entityHandler = async function(event, context){

    var season = event.queryStringParameters.season;
    var competition = event.queryStringParameters.competition;
    var opposition = event.queryStringParameters.opposition;
    var date = event.queryStringParameters.date;
    var manager = event.queryStringParameters.manager;
    var venue = event.queryStringParameters.venue;
    var pens = event.queryStringParameters.pens;
    var sort = event.queryStringParameters.sort;

    var data = await getResults(season, competition, opposition, date, manager, venue, pens, sort);
    var results = [];
    for(var i=0; i < data.length; i++) {
        var match = data[i];
        if(match.venue == "Wembley Stadium") {
            match.location = "N";
        } else if(match.home == "Tranmere Rovers") {
            match.location = "H";
        } else {
            match.location = "A";
        }
        if(match.programme && match.programme != "#N/A") {

             var smallBody = {
                  "bucket": 'trfc-programmes',
                  "key": match.programme,
                  "edits": {
                    "resize": {
                      "width": 100,
                      "fit": "contain"
                    }
                  }
                };
                 var largeBody = {
                      "bucket": 'trfc-programmes',
                      "key": match.programme,
                    };
             match.programme = Buffer.from(JSON.stringify(smallBody)).toString('base64');
             match.largeProgramme = Buffer.from(JSON.stringify(largeBody)).toString('base64');
        } else {
            delete match.programme;
        }
        if(date) {
            match.goals = await getGoalsByDate(date, match.season);
            match.apps = await getAppsByDate(date, match.season);
        }
        results.push(match)
    }

     if(sort && (decodeURIComponent(sort) == "Top Attendance")) {
        results.sort(function(a, b) {
          if (a.attendance < b.attendance) return 1
          if (a.attendance > b.attendance) return -1
          return 0
        });
    } else {
        results.sort(function(a, b) {
          if (a.date < b.date) return -1
          if (a.date > b.date) return 1
          return 0
        });
    }


    if(date && results.length == 1)
        return sendResponse(200, results[0]);
    else
        return sendResponse(200, results);

}

async function getResults(season, competition, opposition, date, manager, venue, pens, sort) {

    var query = false;
    var params = {
         TableName : "TranmereWebGames"
    };

    if(season || competition || opposition || venue || pens || date || manager) {
        params.ExpressionAttributeValues = {};
    }

    if(season) {
        params.KeyConditionExpression =  "season = :season",
        params.ExpressionAttributeValues[":season"] = decodeURIComponent(season);
        query = true;
    } else if(opposition) {
        params.IndexName = "OppositionIndex";
        params.KeyConditionExpression =  "opposition = :opposition",
        params.ExpressionAttributeValues[":opposition"] = decodeURIComponent(opposition);
        query = true;
    } else if(competition) {
        params.IndexName = "CompetitionIndex";
        params.KeyConditionExpression =  "competition = :competition",
        params.ExpressionAttributeValues[":competition"] = decodeURIComponent(competition);
        query = true;
    } else if(venue) {
        params.IndexName = "VenueIndex";
        params.KeyConditionExpression =  "venue = :venue",
        params.ExpressionAttributeValues[":venue"] = decodeURIComponent(venue);
        query = true;
    } else if(sort && (decodeURIComponent(sort) == "Top Attendance")) {
        params.IndexName = "AttendanceIndex";
        params.ExpressionAttributeNames = {};
        params.ExpressionAttributeValues = {};
        params.KeyConditionExpression =  "#static = :static",
        params.ExpressionAttributeValues[":static"] = "static";
        params.ExpressionAttributeNames["#static"] = "static";
        params.ScanIndexForward = false;
        params.Limit = 20;
        query = true;
    }

    if(manager) {
        var dates = manager.split(',');
        if(query) {
            params.KeyConditionExpression =  params.KeyConditionExpression + " and #date BETWEEN :from and :to";
        } else {
            params.FilterExpression = "#date BETWEEN :from and :to";
        }
        params.ExpressionAttributeNames = {};
        params.ExpressionAttributeNames["#date"] = "date";
        params.ExpressionAttributeValues[":from"] = decodeURIComponent(dates[0]);
        params.ExpressionAttributeValues[":to"] = decodeURIComponent(dates[1]);
    }

    if(date) {
        if(query) {
            params.KeyConditionExpression =  params.KeyConditionExpression + " and #date = :date";
        } else {
            params.FilterExpression = params.FilterExpression ? " and #date = :date" : "#date = :date";
        }
        params.ExpressionAttributeNames = {};
        params.ExpressionAttributeNames["#date"] = "date";
        params.ExpressionAttributeValues[":date"] = decodeURIComponent(date);
    }

    if(season && opposition) {
        params.FilterExpression = params.FilterExpression ? " and opposition = :opposition" : "opposition = :opposition";
        params.ExpressionAttributeValues[":opposition"] = decodeURIComponent(opposition);
    }

    if(season && competition) {
        params.FilterExpression = params.FilterExpression ? " and competition = :competition" : "competition = :competition";
        params.ExpressionAttributeValues[":competition"] = decodeURIComponent(competition);
    }

    if(season && venue) {
        params.FilterExpression = params.FilterExpression ? " and venue = :venue" : "venue = :venue";
        params.ExpressionAttributeValues[":venue"] = decodeURIComponent(venue);
    }

    if(pens) {
        params.FilterExpression = params.FilterExpression ? " and pens <> :pens" : "pens <> :pens";
        params.ExpressionAttributeValues[":pens"] = "";
    }

    if(query) {
        var result = await dynamo.query(params).promise();
        return result.Items;
    } else {
        var result = await dynamo.scan(params).promise();
        return result.Items;
    }
};

async function getGoals(date, season) {

    var params = {
        TableName : "TranmereWebGoals",
        KeyConditionExpression :  "Season = :season and #Date = :date",
        IndexName : "SeasonIndex",
        ExpressionAttributeNames : {
            "#Date" : "Date"
        },
        ExpressionAttributeValues: {
            ":date" : decodeURIComponent(date),
            ":season" : decodeURIComponent(season)
        }
    }

    var result = await dynamo.query(params).promise();

    return result.Items;
};

async function getApps(date, season) {

    var params = {
        TableName : "TranmereWebApps",
        KeyConditionExpression :  "Season = :season and #Date = :date",
        IndexName : "SeasonIndex",
        ExpressionAttributeNames : {
            "#Date" : "Date"
        },
        ExpressionAttributeValues: {
            ":date" : decodeURIComponent(date),
            ":season" : decodeURIComponent(season)
        }
    }

    var result = await dynamo.query(params).promise();

    return result.Items;
};

function sendResponse(statusCode, message) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message),
		headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
	};
	return response;
}

async function getAppsByDate(date, season) {
      var query = {
        index: "apps",
        body: {
           "sort": ["Number"],
           "size": 20,
           "query": {
             "bool": {
                "must": [
                  {
                    "match": {
                     "Date" : date
                    }
                  }
                ]
              }
           }
        }
      };

     var results = await client.search(query);
     var apps = [];
     for(var i=0; i < results.body.hits.hits.length; i++) {
        var app = results.body.hits.hits[i]["_source"];
        apps.push(app)
     }
     return apps;
};

async function getGoalsByDate(date, season) {
       var query = {
         index: "goals",
         body: {
            "size": 20,
            "query": {
              "bool": {
                 "must": [
                   {
                     "match": {
                      "Date" : date
                     }
                   }
                 ]
               }
            }
         }
       };

      var results = await client.search(query);
      var goals = [];
      for(var i=0; i < results.body.hits.hits.length; i++) {
         var goal = results.body.hits.hits[i]["_source"];
         goals.push(goal)
      }
      return goals;
  }