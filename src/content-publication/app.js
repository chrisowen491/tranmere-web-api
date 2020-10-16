exports.handler = async function (event, context) {
    console.log('Received event:', event);

    return {
     "isBase64Encoded": false,
     "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
     "statusCode": 200,
     "body": JSON.stringify({message: "ok"})
     };
};