addEventListener("fetch", (event) => {
  let url = new URL(event.request.url)

  if(url.pathname === "/" || url.pathname.startsWith("/page") || url.pathname.startsWith("/player-search")|| url.pathname.startsWith("/result-search")) {
    url.host = "api.tranmere-web.com"
    if(url.pathname === "/") {
        url.pathname = "/page/home/home"
    }
  }


  let request = new Request(url, event.request)
  request.headers.set("x-api-key", APIKEY)
  event.respondWith(
    fetch(request, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": 172800,
          404: 1,
          "500-599": 0
        }
      },
    })
  )
})