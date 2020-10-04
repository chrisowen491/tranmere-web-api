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
	const index = event.queryStringParameters.index;

	getEntitiesByCategoryFromDb(category, attribute, entity,index).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "No entities found", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getEntitiesByCategoryFromDb(category, attribute, entity, index) {

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

        var params = {
            TableName : entity,
            KeyConditionExpression: "#category = :category",
            ExpressionAttributeNames:{
                "#category": decodeURIComponent(category)
            },
            ExpressionAttributeValues: {
                ":category": decodeURIComponent(attribute),
            }
        };

        if(index)
            params.IndexName =  index,

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
		body: JSON.stringify({message: message}),
		headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
	};
	callback(null, response);
}