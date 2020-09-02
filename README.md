# Tranmere Web.com

This site is a demo site using Tarnmere Rovers data to demonstrate all sorts of website functionality. 
It is not meant as a commercial entity, and is purely for fun. 

## tranmere-web
Source code for Tranmere-Web.com. The site is a static site designed to be deployed onto Amazon S3.
There are a number of NPM scripts which build a local Elastic Search index, and then use this to generate a set of HTML files. 

### Prerequisites

 * Scripts are designed for Linux/Mac
 * Node, NPM
 * Elastic search running locally on port 9200 

### Building

 * npm install
 * ./data/cleanindex.sh
 * npm run build-web
 * gulp 

### Deploying

 * aws s3 sync ./tranmere-web/output/site s3://www.tranmere-web.com
 * aws s3 sync ./images s3://trfc-programmes
  
## tranmere-web-api

The API is a set of AWS Lambdas. 

###  
 * ./deploy-api.sh  
 
 http://127.0.0.1:3001/scraper/2011/141
 
 https://editor.method.ac/#move_back
 
 http://www.historicalkits.co.uk/Tranmere_Rovers/Tranmere_Rovers.htm
 
 