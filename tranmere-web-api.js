addEventListener("fetch", (event) => {
  let url = new URL(event.request.url)
  url.host = "api.tranmere-web.com"

  let request = new Request(url, event.request)
  event.respondWith(
    fetch(request, {
      cf: {
        cacheEverything: true,
        cacheTtlByStatus: {
          "200-299": 86400,
          404: 1,
          "500-599": 0
        }
      },
    })
  )
})