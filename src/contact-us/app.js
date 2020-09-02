var AWS = require('aws-sdk');
var ses = new AWS.SES();

var RECEIVER = process.env.EMAIL_ADDRESS;
var SENDER = 'admin@tranmere-web.com';

var response = {
 "isBase64Encoded": false,
 "headers": { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',"Access-Control-Allow-Methods": "OPTIONS,POST,GET"},
 "statusCode": 200,
 "body": "{\"result\": \"Success.\"}"
 };

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    if(event.body)
        var results = await sendEmail(JSON.parse(event.body));
    return response;
};

async function sendEmail (event, done) {
    var params = {
        Destination: {
            ToAddresses: [
                RECEIVER
            ]
        },
        Message: {
            Body: {
                Text: {
                    Data: 'name: ' + event.name + '\nemail: ' + event.email + '\ndesc: ' + event.desc,
                    Charset: 'UTF-8'
                }
            },
            Subject: {
                Data: 'Website Referral Form: ' + event.name,
                Charset: 'UTF-8'
            }
        },
        Source: SENDER
    };
    return new Promise((resolve, reject) => {
      ses.sendEmail(params, function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
}