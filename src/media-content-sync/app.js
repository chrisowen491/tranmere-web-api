const { v4: uuidv4 } = require('uuid');
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
const contentful = require("contentful");
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const client = contentful.createClient({
  space: process.env.CF_SPACE,
  accessToken: process.env.CF_KEY
});

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    console.log(event.pathParameters.type);

    if(event.body) {
        var body = JSON.parse(event.body)

        if(body.sys.type === "Entry") {
            var content = await client.getEntry(body.sys.id, );
            var item = content.fields;
            item.id = body.sys.id;
            await insertUpdateItem(item, event.pathParameters.type);
        } else if(body.sys.type === "DeletedEntry"){
            await deleteItem(body.sys.id, event.pathParameters.type);
        }
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({message: "ok"})
     };
};

async function insertUpdateItem(item, type){
	const params = {
		TableName: type,
		Item: item
	};

	return await dynamo.put(params).promise();
}

async function deleteItem(id, type){
	console.log(id);
	const params = {
		TableName: type,
		Key:{
            "id": id
        },
	};

	return await dynamo.delete(params).promise();
}