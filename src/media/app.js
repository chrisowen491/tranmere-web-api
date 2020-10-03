const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'MediaTable';

exports.mediaHandler = function(event, context, callback){

    switch (event.httpMethod) {
		case 'GET':
			getMediaByCategory(event, callback);
			break;
		default:
			sendResponse(404, `Unsupported method "${event.httpMethod}"`, callback);
	}
};

function getMediaByCategory(event, callback) {
	const category = event.pathParameters.category;
	getMediaByCategoryFromDb(category).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "Please pass a valid category", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getMediaByCategoryFromDb(category)

    var params = {
        TableName : TABLE_NAME,
        KeyConditionExpression: "#category = :category",
        ExpressionAttributeNames:{
            "#category": "category"
        },
        ExpressionAttributeValues: {
            ":category": decodeURIComponent(category),
        }
    };


	return dynamo
		.query(params)
		.promise()
		.then((result) => {
			return result.Items;
		}, (error) => {
			return error;
		});
};

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify({message: message})
	};
	callback(null, response);
}