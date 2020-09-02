#!/usr/bin/env bash
EMAIL=xxxx
sam package --output-template-file packaged.yaml --s3-bucket tranmere-web-api
aws cloudformation deploy --template-file packaged.yaml --parameter-overrides Email=${EMAIL} --stack-name Tranmere-Web-Api --capabilities CAPABILITY_IAM
