const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
let dynamo = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'TranmereWebMediaTable';

exports.entityHandler = function(event, context, callback){

    switch (event.httpMethod) {
		case 'GET':
			getEntityByAttribute(event, callback);
			break;
		default:
			sendResponse(404, `Unsupported method "${event.httpMethod}"`, callback);
	}
};

function getEntityByAttribute(event, callback) {
	const category = event.pathParameters.category;
	const attribute = event.pathParameters.attribute;
	const entity = event.pathParameters.entity;

	getEntitiesByCategoryFromDb(category, attribute, entity).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "No entities found", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getEntitiesByCategoryFromDb(category, attribute, entity) {

    if(category == "ALL" && attribute == "ALL") {
        const params = {
            TableName : entity
        };


        return dynamo
            .scan(params)
            .promise()
            .then((result) => {
                return result.Items;
            }, (error) => {
                return error;
            });
    } else {
        const params = {
            TableName : entity,
            KeyConditionExpression: "#category = :category",
            ExpressionAttributeNames:{
                "#category": decodeURIComponent(category)
            },
            ExpressionAttributeValues: {
                ":category": decodeURIComponent(attribute),
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
    }
};

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify({message: message})
	};
	callback(null, response);
}