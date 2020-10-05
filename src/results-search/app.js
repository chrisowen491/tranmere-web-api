const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

exports.entityHandler = function(event, context, callback){

    var season = event.queryStringParameters.season;
    var competition = event.queryStringParameters.competition;
    var opposition = event.queryStringParameters.opposition;
    var date = event.queryStringParameters.date;
    var manager = event.queryStringParameters.manager;
    var venue = event.queryStringParameters.venue;
    var pens = event.queryStringParameters.pens;
    var sort = event.queryStringParameters.sort;

	getResults(season, competition, opposition, date, manager, venue, pens, sort).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "No entities found", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getResults(season, competition, opposition, date, manager, venue, pens, sort) {

    var params = {
         TableName : "TranmereWebGames"
    };

    if(season || competition || opposition || venue || pens) {
        params.ExpressionAttributeValues = {};
    }

    if(season) {
        params.KeyConditionExpression =  "season = :season",
        params.ExpressionAttributeValues[":season"] = decodeURIComponent(season);
    }

    if(sort && decodeURIComponent(sort) == "Top Attendance") {
        params.IndexName = "AttendanceIndex";
        params.ScanIndexForward = false;
    }

    if(competition) {
        params.FilterExpression = params.FilterExpression ? " and competition = :competition" : "competition = :competition";
        params.ExpressionAttributeValues[":competition"] = decodeURIComponent(competition);
    }

    if(manager) {
        var dates = manager.split(',');
        params.FilterExpression = params.FilterExpression ? " and date > :from and date < :to" : "date > :from and date < :to";
        params.ExpressionAttributeValues[":from"] = decodeURIComponent(dates[0]);
        params.ExpressionAttributeValues[":to"] = decodeURIComponent(dates[1]);
    }

    if(date) {
        params.FilterExpression = params.FilterExpression ? " and date = :date" : "date = :date";
        params.ExpressionAttributeValues[":date"] = decodeURIComponent(date);
    }

    if(opposition) {
        params.FilterExpression = params.FilterExpression ? " and opposition = :opposition" : "opposition = :opposition";
        params.ExpressionAttributeValues[":opposition"] = decodeURIComponent(opposition);
    }

    if(venue) {
        params.FilterExpression = params.FilterExpression ? " and venue = :venue" : "venue = :venue";
        params.ExpressionAttributeValues[":venue"] = decodeURIComponent(venue);
    }

    if(pens) {
        params.FilterExpression = params.FilterExpression ? " and pens <> :pens" : "pens <> :pens";
        params.ExpressionAttributeValues[":pens"] = "";
    }

    if(season) {
        return dynamo
            .query(params)
            .promise()
            .then((result) => {
                return result.Items;
            }, (error) => {
                return error;
            });
    } else {
        return dynamo
            .scan(params)
            .promise()
            .then((result) => {
                return result.Items;
            }, (error) => {
                return error;
            });
    }
};

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify({message: message}),
		headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
	};
	callback(null, response);
}