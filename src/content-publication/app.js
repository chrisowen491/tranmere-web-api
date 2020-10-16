const { v4: uuidv4 } = require('uuid');
const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');
const contentful = require("contentful");
let dynamo = new AWS.DynamoDB.DocumentClient();
AWSXRay.captureAWSClient(dynamo.service);
const TABLE_NAME = 'TranmereWebPlayerTable';
const client = contentful.createClient({
  space: process.env.CF_SPACE,
  accessToken: process.env.CF_KEY
});

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    if(event.body) {
        var body = JSON.parse(event.body)

        client
          .getEntry(body.sys.id)
          .then(entry => console.log(entry))
          .catch(err => console.log(err));
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({message: "ok"})
     };
};

function constructPlayer(obj) {
    var player = {
        name: obj.fields.name["en-US"],
        dateOfBirth: obj.fields.dateOfBirth["en-US"],
        id: uuidv4(),
        profile: JSON.stringify(obj.fields.biography["en-US"].content)
    };
    return player;
}

function insertPlayer(player){
	const params = {
		TableName: TABLE_NAME,
		Item: player
	};

	return dynamo
		.put(params)
		.promise()
		.then((result) => {
			return item;
		}, (error) => {
			return error;
		});
}

function updatePlayer(player){

	let vbl = "x";
	let adder = "y";
	let updateexp = 'set ';
	let itemKeys =  Object.keys(player);
	let expattvalues = {};

	for (let i = 0; i < itemKeys.length; i++) {
		vbl = vbl+adder;

		if((itemKeys.length-1)==i)
			updateexp += itemKeys[i] + ' = :'+ vbl;
		else
			updateexp += itemKeys[i] + ' = :'+ vbl + ", ";

		expattvalues[":"+vbl] = player[itemKeys[i]];
	}

	console.log("update expression and expressionAttributeValues");
	console.log(updateexp, expattvalues);

	const params = {
		TableName: TABLE_NAME,
		Key: {
			name: player.name
		},
		ConditionExpression: 'attribute_exists(playerId)',
		UpdateExpression: updateexp,
		ExpressionAttributeValues: expattvalues,
		ReturnValues: 'ALL_NEW'
	};

	return dynamo
		.update(params)
		.promise()
		.then(response => {
			return response.Attributes;
		}, (error) => {
			return error;
		});
}