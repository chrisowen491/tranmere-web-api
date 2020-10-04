const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'TranmereWebMediaTable';

exports.entityHandler = function(event, context, callback){

    switch (event.httpMethod) {
		case 'GET':
			getResults(event, callback);
			break;
		default:
			sendResponse(404, `Unsupported method "${event.httpMethod}"`, callback);
	}
};

function getResults(event, callback) {
    var season = event.queryStringParameters.season;
    var competition = event.queryStringParameters.competition;
    var opposition = event.queryStringParameters.opposition;
    var date = event.queryStringParameters.date;
    var manager = event.queryStringParameters.manager;
    var venue = event.queryStringParameters.venue;
    var pens = event.queryStringParameters.pens;
    var sort = event.queryStringParameters.sort;

	getResultsFromDb(season, competition, opposition, date, manager, venue, pens, sort).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "No entities found", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getResultsFromDb(season, competition, opposition, date, manager, venue, pens, sort) {

    if(season) {
        var params = {
            TableName : "TranmereWebMatches",
            KeyConditionExpression: "season = :season",
            ExpressionAttributeNames:{
                "#season": "season"
            },
            ExpressionAttributeValues: {
                ":season": decodeURIComponent(season),
            }
        };

        if(competition) {
            params.FilterExpression = params.FilterExpression ? "#competition = :competition" : " and #competition = :competition";
            params.ExpressionAttributeNames["#competition"] = "competition";
            params.ExpressionAttributeNames[":competition"] = decodeURIComponent(competition);
        }

        if(opposition) {
            params.FilterExpression = params.FilterExpression ? "#opposition = :opposition" : " and #opposition = :opposition";
            params.ExpressionAttributeNames["#opposition"] = "opposition";
            params.ExpressionAttributeNames[":opposition"] = decodeURIComponent(opposition);
        }

        return dynamo
            .query(params)
            .promise()
            .then((result) => {
                return result.Items;
            }, (error) => {
                return error;
            });
    } else {
        const params = {
            TableName : "TranmereWebMatches"
        };

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