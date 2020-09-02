var fs = require("fs");

exports.handler = async function (event, context) {
    console.log('Received event:', event);
    var bodyName = event.pathParameters.body;
    var kitName = event.pathParameters.kit;
    var hairName = event.pathParameters.hair;
    var featureName = event.pathParameters.features;
    var start = '<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">';
    var background = '<g stroke="null"><title>background</title><rect fill="#b2b2b2" id="canvas_background" height="514" width="514" y="-1" x="-1"/></g>'
    var end = "</svg>"

    var body = fs.readFileSync('./assets/body/'+bodyName+'.svg', {encoding: 'utf8'}).replace(start,"").replace(end,"");
    var hair = fs.readFileSync('./assets/hair/'+hairName+'.svg', {encoding: 'utf8'}).replace(start,"").replace(end,"");;
    var features = fs.readFileSync('./assets/features/'+featureName+'.svg', {encoding: 'utf8'}).replace(start,"").replace(end,"");;

    var kit = fs.readFileSync('./assets/kits/home/'+kitName+'.svg', {encoding: 'utf8'}).replace(start,"").replace(end,"");;
    var collar = fs.readFileSync('./assets/kits/home/collars/'+kitName+'.svg', {encoding: 'utf8'}).replace(start,"").replace(end,"");;

    var svg = start + background + kit + body + hair + features + collar + end;

    return {
     "headers": { 'Content-Type': 'image/svg+xml'},
     "statusCode": 200,
     "body": svg
     };
};