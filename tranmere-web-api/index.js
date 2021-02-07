addEventListener("fetch", (event) => {
  let url = new URL(event.request.url)

  if(url.pathname === "/" || url.pathname.startsWith("/page") || url.pathname.startsWith("/player-search")|| url.pathname.startsWith("/result-search")) {
    url.host = "api.tranmere-web.com"
    if(url.pathname === "/") {
        url.pathname = "/page/home/home"
    }
  }

  if(url.pathname === "/media.html") {
    url.pathname = "/page/blog/7wtrOLaYqaK7Dhvodz1Gv0";
    url.host = "api.tranmere-web.com";
  }


  if(url.pathname === "/about.html") {
    url.pathname = "/page/blog/2oXtDQNbfluRQk5jWbyCu7";
    url.host = "api.tranmere-web.com";
  }


  if(url.pathname === "/super-stars.html") {
    url.pathname = "/page/blog/4EZzxJSam4dohEgD1sOmki";
    url.host = "api.tranmere-web.com";
  }

  if(url.pathname === "/stats.html") {
    url.pathname = "/page/blog/2VrsLTKALyi2vgAQMLDoIT";
    url.host = "api.tranmere-web.com";
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