(function(){
  "use strict";

  // Google Place photos for each itinerary stop.
  // NOTE: this key ships in public page source — it MUST be restricted in the Google
  // Cloud console (HTTP referrer = supmaine.mikeside.com) and quota-capped, and needs
  // both "Maps JavaScript API" and "Places API" enabled on the project.
  var KEY = "AIzaSyC5ENEyq3BFgVUkpsR8iJFjcJiOy5M7W6o";

  var CACHE_KEY = "maine-place-photos-v1";
  var cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch(e){ cache = {}; }
  function saveCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e){} }

  // Pull the place query out of a stop's Google Maps "search?query=" link.
  function queryFor(stop){
    var a = stop.querySelector('a[href*="google.com/maps/search"]');
    if (!a) return null;
    var m = a.getAttribute("href").match(/[?&]query=([^&#]+)/);
    if (!m) return null;
    return decodeURIComponent(m[1].replace(/\+/g, " "));
  }

  function contentDiv(stop){
    return stop.children.length > 1 ? stop.children[stop.children.length - 1] : stop;
  }

  function inject(stop, url, query){
    if (stop.querySelector("img")) return;           // never double-up
    var img = document.createElement("img");
    img.className = "stop-thumb lightboxable";
    img.loading = "lazy";
    img.alt = query;
    img.setAttribute("data-cap", query);
    img.onerror = function(){
      if (cache[query]) { delete cache[query]; saveCache(); }  // drop stale cached URL
      img.remove();
    };
    img.src = url;
    var c = contentDiv(stop);
    c.insertBefore(img, c.firstChild);
  }

  var svc = null;

  function fetchPhoto(stop, query){
    if (stop.querySelector("img")) return;
    if (cache[query]) { inject(stop, cache[query], query); return; }   // cached → no API call
    try {
      svc.findPlaceFromQuery({ query: query, fields: ["photos"] }, function(res, status){
        if (status !== google.maps.places.PlacesServiceStatus.OK) return;
        if (!res || !res[0] || !res[0].photos || !res[0].photos.length) return;
        var url = res[0].photos[0].getUrl({ maxWidth: 480 });
        cache[query] = url; saveCache();
        inject(stop, url, query);
      });
    } catch(e){ if (window.console) console.warn("[photos]", e); }
  }

  function run(){
    if (!window.google || !google.maps || !google.maps.places) return;
    if (!svc) svc = new google.maps.places.PlacesService(document.createElement("div"));
    document.querySelectorAll(".day .stop").forEach(function(stop){
      if (stop.querySelector("img")) return;         // skip stops that already have a photo
      var q = queryFor(stop);
      if (q) fetchPhoto(stop, q);
    });
  }

  var googleReady = false, domReady = false;
  function tryRun(){ if (googleReady && domReady) run(); }

  window.__mainePhotosMapsReady = function(){ googleReady = true; tryRun(); };

  function loadMaps(){
    if (document.getElementById("gmaps-js")) {
      if (window.google && google.maps && google.maps.places){ googleReady = true; tryRun(); }
      return;
    }
    var s = document.createElement("script");
    s.id = "gmaps-js";
    s.async = true;
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + KEY +
            "&libraries=places&loading=async&callback=__mainePhotosMapsReady";
    s.onerror = function(){ if (window.console) console.warn("[photos] Google Maps JS failed to load"); };
    document.head.appendChild(s);
  }

  function waitDom(){
    if (document.querySelector(".day .stop")) { domReady = true; tryRun(); return; }
    var route = document.getElementById("route");
    if (!route) return;
    var mo = new MutationObserver(function(){
      if (document.querySelector(".day .stop")) { mo.disconnect(); domReady = true; tryRun(); }
    });
    mo.observe(route, { childList: true });
  }

  loadMaps();
  if (document.readyState !== "loading") waitDom();
  else document.addEventListener("DOMContentLoaded", waitDom);

})();
