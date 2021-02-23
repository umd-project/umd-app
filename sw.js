var TIMEOUT = 400;
var CACHE = "umd-0.5";

var precacheList = [
  "/assets/images/logo-300x300.png",
  "/assets/images/bullet.png",
  "/assets/images/nav-bg.gif"
];

var cacheNetworkList = [
  "/assets/fonts/Lato-Bold.woff",
  "/assets/fonts/Lato-Bold.woff2",
  "/assets/fonts/Lato-Italic.woff",
  "/assets/fonts/Lato-Italic.woff2",
  "/assets/fonts/Lato-Light.woff",
  "/assets/fonts/Lato-Light.woff2",
  "/assets/fonts/Lato-Regular.woff",
  "/assets/fonts/Lato-Regular.woff2",
  "/assets/css/style.css",
  "/assets/css/app.css",
  "/assets/css/quill.snow.css",
  "/",
  "/index.html"
];

var networkCacheList = [
];


self.addEventListener("install", function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(precacheList);
    })
      .then(_ => {
        return self.clients.matchAll({
          includeUncontrolled: true,
          type: "window",
        })
          .then((clients) => {
            if (clients && clients.length) {
              // Send a response - the clients
              // array is ordered by last focused
              clients[0].postMessage({ "verno": CACHE });
              return;
            }
            else {
              return;
            }
          });
      })
  );
});


// get from network only
function networkOnly(event) {
  event.respondWith(fetch(event.request));
};

// get from precache
function preCacheOnly(event) {
  event.respondWith(caches.match(event.request));
}

// get from cache and update from network
function cacheNetwork(event) {
  const url = new URL(event.request.url);
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        var fetchPromise = fetch(event.request).then(function (networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        })
        return response || fetchPromise;
      })
    })
  );
};

// get from network and update cache
function networkCache(event) {
  event.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(event.request).then(function (response) {
        var fetchPromise = fetch(event.request).then(function (networkResponse) {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        }).catch(function () {
          return response;
        })
        return fetchPromise || response;
      })
    })
  );
};

self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  var path = url.pathname;
  if (precacheList.indexOf(path) != -1) {
    //console.log("precached", path);
    self.preCacheOnly(event);
  }
  else if (cacheNetworkList.indexOf(path) != -1) {
    //console.log("cached", path);
    self.cacheNetwork(event);
  }
  else if (networkCacheList.indexOf(path) != -1) {
    //console.log("networkcached", path);
    self.networkCache(event);
  }
  else {
    //console.log("network", path);
    self.networkOnly(event);
  }
});


self.addEventListener("push", function (event) {
  console.log("Push Received.", event.data.text());
  var content = event.data.text();
  const promiseChain = self.registration.showNotification(content);
  event.waitUntil(promiseChain);
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(cacheNames.map(function (cache) {
        if (cache != CACHE) { // check for current cache and delete all others
          console.log("deleting:", cache);
          return caches.delete(cache);
        }
      }));
    })
  );
  //return self.clients.claim(); not recommended by a few like Jeff Posnick
});

// can be called to unregister all existing registrations (not tried)
function unRegister() {
  navigator.serviceWorker.getRegistrations().then(function (registrations) {
    for (let registration of registrations) {
      registration.unregister()
    }
  });
}
