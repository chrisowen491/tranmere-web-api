const { Client } = require('@elastic/elasticsearch')
const client = new Client({
    cloud: {
        id: process.env.ES_CLUSTER,
      },
      auth: {
        username: process.env.ES_USER,
        password: process.env.ES_PASSWORD
      }
});
var utils = require('./libs/utils')(client);

exports.handler = async function (event, context) {
    console.log('Received event:', event);

    var results = await utils.findAllPlayers(200);

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify(results)
     };
};