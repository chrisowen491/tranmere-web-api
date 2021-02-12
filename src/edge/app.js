const https = require('https');

exports.handler = async function (event, context) {

    //Get contents of response
    var response = event.Records[0].cf.response;
    var headers = response.headers;

    let dataString = '';
    const nav_bar = await new Promise((resolve, reject) => {
        const req = https.get("'https://assets.ctfassets.net/pz711f8blqyy/547b8bDM4xu8mCXujlZJpm/6744cd2b68566b4ac15c443033ab1423/homenav.txt", function(res) {
          res.on('data', chunk => {
            dataString += chunk;
          });
          res.on('end', () => {
            resolve(dataString);
          });
        });
    });

    response.body = response.body.replace(/NAV_BAR_PLACEHOLDER/g, nav_bar);

    //Set new headers
    headers['strict-transport-security'] = [{key: 'Strict-Transport-Security', value: 'max-age= 63072000; includeSubdomains; preload'}];
    //headers['content-security-policy'] = [{key: 'Content-Security-Policy', value: "default-src 'none'; img-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'"}];
    headers['x-content-type-options'] = [{key: 'X-Content-Type-Options', value: 'nosniff'}];
    headers['x-frame-options'] = [{key: 'X-Frame-Options', value: 'DENY'}];
    headers['x-xss-protection'] = [{key: 'X-XSS-Protection', value: '1; mode=block'}];
    headers['referrer-policy'] = [{key: 'Referrer-Policy', value: 'same-origin'}];

    //Return modified response
    return response;
};