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
        var content = await client.getEntry(body.sys.id);
        var player = constructPlayer(content);
        if(body.sys.revision == 1) {
            player.id = uuidv4();
            await insertPlayer(player);
        } else {
            await updatePlayer(player);
        }
    }

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({message: "ok"})
     };
};

function constructPlayer(obj) {
    var player = obj.fields;
    player.profile = JSON.stringify(player.biography.content);
    delete player.biography;
    if(player.pic && player.pic.fields && player.pic.fields.file && player.pic.fields.file.url)
        player.pic = player.pic.fields.file.url;
    delete player.links;
    return player;
}

async function insertPlayer(player){
	const params = {
		TableName: TABLE_NAME,
		Item: player
	};

	return await dynamo.put(params).promise();
}

async function updatePlayer(player){

	var name = player.name;
	delete player.name;
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
			name: name
		},
		UpdateExpression: updateexp,
		ExpressionAttributeValues: expattvalues,
		ReturnValues: 'ALL_NEW'
	};

	return await dynamo.update(params).promise();
}