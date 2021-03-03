#!/usr/bin/env bash
sam package --output-template-file packaged.yaml --s3-bucket tranmere-web-api
aws cloudformation deploy --template-file packaged.yaml --stack-name Tranmere-Web-Api --capabilities CAPABILITY_IAM
