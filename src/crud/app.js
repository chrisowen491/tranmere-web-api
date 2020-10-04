const databaseManager = require('./databaseManager');
const { v4: uuidv4 } = require('uuid');

exports.playerHandler = function(event, context, callback){

    console.log(event, context);

    switch (event.httpMethod) {
		//case 'DELETE':
		//	deleteItem(event, callback);
		//	break;
		//case 'GET':
		//	getItem(event, callback);
		//	break;
		case 'GET':
			getPlayerByName(event, callback);
			break;
		case 'POST':
			saveItem(event, callback);
			break;
		//case 'PUT':
		//	updateItem(event, callback);
		//	break;
		default:
			sendResponse(404, `Unsupported method "${event.httpMethod}"`, callback);
	}
};

function saveItem(event, callback) {
	const item = JSON.parse(event.body);

	item.id = uuidv4();

	databaseManager.saveItem(item).then(response => {
		console.log(response);
		sendResponse(200, item.id, callback);
	}, (reject) =>{
		sendResponse(400, reject, callback);
	});
}

function getPlayerByName(event, callback) {
	const name = event.pathParameters.name;
	databaseManager.getItemByName(name).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "Please pass a valid name", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}


function getItem(event, callback) {
	const itemId = event.pathParameters.playerId;

	databaseManager.getItem(itemId).then(response => {
		if(response)
			sendResponse(200, response, callback);
		else
		sendResponse(404, "Please pass a valid playerId", callback);

	},(reject) =>{
		sendResponse(400, reject, callback);
	});
}

function deleteItem(event, callback) {
	const itemId = event.pathParameters.playerId;

	databaseManager.deleteItem(itemId).then(response => {
		sendResponse(200, 'DELETE ITEM', callback);
	}, (reject) => {
		sendResponse(400, reject, callback);
	});
}

function updateItem(event, callback) {
	const itemId = event.pathParameters.playerId;

	const body = JSON.parse(event.body);

	databaseManager.updateItem(itemId, body).then(response => {
		console.log(response);
		sendResponse(200, response, callback);
	}, (reject) => {
		sendResponse(400, reject, callback);
	});
}

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify({message: message})
	};
	callback(null, response);
}