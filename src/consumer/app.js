const AWSXRay = require('aws-xray-sdk');
const AWS = require('aws-sdk');

exports.handler = function(event, context, callback){
    console.log(event.Records);
    console.log(event.Records[0]);
    console.log(event.Records[0].kinesis.data);
    return "hello"
};