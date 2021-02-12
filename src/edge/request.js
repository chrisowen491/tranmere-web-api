exports.handler = (event, context, callback) => {
     const request = event.Records[0].cf.request;

     if (request.uri.startsWith("/page") || request.uri.startsWith("/player-search") || request.uri.startsWith("/result-search")) {
         if(!request.uri.startsWith("/player-search.html")) {
             /* Set custom origin fields*/
             request.origin = {
                 custom: {
                     domainName: 'api.tranmere-web.com',
                     port: 443,
                     protocol: 'https',
                     path: '',
                     sslProtocols: ['TLSv1', 'TLSv1.1'],
                     readTimeout: 20,
                     keepaliveTimeout: 20,
                     customHeaders: {
                     }
                 }
             };
             request.headers['x-api-key'] = [{ key: 'x-api-key', value: 'Ubz2w38CTS18anpiEApqf1pBWayHRcmLz5fKyyW4'}];
             request.headers['host'] = [{ key: 'host', value: 'api.tranmere-web.com'}];
         }
    }
    callback(null, request);
};