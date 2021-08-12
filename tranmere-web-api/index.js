async function handleRequest(event) {
  const request = event.request
  const cacheUrl = new URL(request.url)

  const cacheKey = new Request(cacheUrl.toString(), request)
  const cache = caches.default

  // Get this request from this zone's cache
  let response = await cache.match(cacheKey)

  if (!response) {

      let url = new URL(event.request.url)

      if(url.pathname === "/" || url.pathname.startsWith("/page")) {
        url.host = "api.ci1.tranmere-web.com"
        if(url.pathname === "/") {
            url.pathname = "/page/home/home"
        }
      }

      if(url.pathname.startsWith("/player-search") || url.pathname.startsWith("/result-search") || url.pathname.startsWith("/builder")|| url.pathname.startsWith("/match") || url.pathname.startsWith("/contact-us")) {
        url.host = "api.ci1.tranmere-web.com"
      }

      if(url.pathname === "/media.html") {
        url.pathname = "/page/blog/7wtrOLaYqaK7Dhvodz1Gv0";
        url.host = "api.ci1.tranmere-web.com";
      }

      if(url.pathname === "/about.html") {
        url.pathname = "/page/blog/2oXtDQNbfluRQk5jWbyCu7";
        url.host = "api.ci1.tranmere-web.com";
      }


      if(url.pathname === "/super-stars.html") {
        url.pathname = "/page/blog/4EZzxJSam4dohEgD1sOmki";
        url.host = "api.ci1.tranmere-web.com";
      }

      if(url.pathname === "/stats.html") {
        url.pathname = "/page/blog/2VrsLTKALyi2vgAQMLDoIT";
        url.host = "api.ci1.tranmere-web.com";
      }

      if(url.pathname.startsWith("/graphql")) {
        url.host = "tgzafameebdujmbaw4tdkuaiku.appsync-api.eu-west-1.amazonaws.com";
      }

      let request = new Request(url, event.request)

      if(url.pathname.startsWith("/graphql")) {
        request.headers.set("x-api-key", "da2-uaiu6wz4gjeetknxcdq5bf7bo4")
      } else {
        request.headers.set("x-api-key", APIKEY)
      }

    // If not in cache, get it from origin
    response = await fetch(request)

    nav_response = await fetch(new Request('https://assets.ctfassets.net/pz711f8blqyy/547b8bDM4xu8mCXujlZJpm/594b7a14e4725933dbe773ede46d9b76/homenav.txt'))
    let nav_text = await nav_response.text();
    var amendedBody = await response.text()
    amendedBody = amendedBody.replace(/NAV_BAR_PLACEHOLDER/g, nav_text);

    // Must use Response constructor to inherit all of response's fields
    response = new Response(amendedBody, response)

    if(response.status != 500) {
      // Store the fetched response as cacheKey
      // Use waitUntil so computational expensive tasks don"t delay the response
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }
  return response
}

addEventListener("fetch", event => {
    return event.respondWith(handleRequest(event))
})