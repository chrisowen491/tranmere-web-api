const { v4: uuidv4 } = require('uuid');
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
const contentful = require("contentful");
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const TABLE_NAME = 'TranmereWebMediaSyncTable';
const client = contentful.createClient({
  space: process.env.CF_SPACE,
  accessToken: process.env.CF_KEY
});

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    if(event.body) {
        var body = JSON.parse(event.body)

        var content = await client.getEntry(body.sys.id);
        var item = content.fields;
        item.id = body.sys.id;
        await insertItem(item);
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({message: "ok"})
     };
};

function insertItem(item){
	const params = {
		TableName: TABLE_NAME,
		Item: item
	};

	return await dynamo.put(params).promise();
}

function updatePlayer(item){

	let vbl = "x";
	let adder = "y";
	let updateexp = 'set ';
	let itemKeys =  Object.keys(item);
	let expattvalues = {};

	for (let i = 0; i < itemKeys.length; i++) {
		vbl = vbl+adder;

		if((itemKeys.length-1)==i)
			updateexp += itemKeys[i] + ' = :'+ vbl;
		else
			updateexp += itemKeys[i] + ' = :'+ vbl + ", ";

		expattvalues[":"+vbl] = item[itemKeys[i]];
	}

	console.log("update expression and expressionAttributeValues");
	console.log(updateexp, expattvalues);

	const params = {
		TableName: TABLE_NAME,
		Key: {
			id: item.id
		},
		ConditionExpression: 'attribute_exists(id)',
		UpdateExpression: updateexp,
		ExpressionAttributeValues: expattvalues,
		ReturnValues: 'ALL_NEW'
	};

	return dynamo.update(params).promise();
}