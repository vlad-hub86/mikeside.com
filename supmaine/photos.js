(function(){
  "use strict";

  // Google Place photos for the itinerary: a photo strip under each stop, plus a
  // banner fallback for any day whose curated image is missing or fails to load.
  // Uses the NEW Places API (google.maps.places.Place) — the legacy PlacesService
  // is blocked for projects created after March 2025.
  // NOTE: this key ships in public page source — it MUST be restricted in the Google
  // Cloud console (HTTP referrer = supmaine.mikeside.com) and quota-capped, and its
  // API-restriction list MUST include "Maps JavaScript API" and "Places API (New)".
  var KEY = "AIzaSyAUT6tkXPxU5SPvf61maQUgWyAYcVraTaM";

  var CACHE_KEY = "maine-place-photos-v3";
  var STOP_SHOTS = 3;                 // max photos injected per stop
  var cache = {};
  try { cache = JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; } catch(e){ cache = {}; }
  function saveCache(){ try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch(e){} }

  // Banner query per day — used only when a day has no working photo banner.
  var HERO = {
    d1:"Boothbay Harbor Maine",
    d2:"Camden Maine harbor",
    d3:"Acadia National Park Maine",
    d4:"Portland Head Light Cape Elizabeth Maine",
    d5:"Portland Maine waterfront",
    d5b:"Two Lights State Park Cape Elizabeth Maine",
    d6:"Old Port Portland Maine",
    d7:"Portland Head Light Maine"
  };

  // styles for the per-stop photo strip + injected banner
  var st = document.createElement("style");
  st.textContent =
    ".stop-shots{display:flex;gap:6px;margin-top:9px}" +
    ".stop-shot{flex:1 1 0;min-width:0;height:84px;object-fit:cover;border-radius:8px;border:1px solid var(--line);display:block;cursor:zoom-in;background:var(--paper)}" +
    ".day-photo img.gphoto{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}";
  document.head.appendChild(st);

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
  function asList(v){ return Array.isArray(v) ? v : (v ? [v] : []); }

  // ---------- new Places API text search → photo URLs ----------
  function searchPhotos(query, want, maxWidth){
    return google.maps.places.Place.searchByText({
      textQuery: query,
      fields: ["photos"],
      maxResultCount: 1
    }).then(function(res){
      var places = res && res.places;
      if (!places || !places.length) return null;
      var photos = places[0].photos || [];
      if (!photos.length) return null;
      return photos.slice(0, want).map(function(p){ return p.getURI({ maxWidth: maxWidth }); });
    }).catch(function(e){ if (window.console) console.warn("[photos]", query, e && e.message); return null; });
  }

  // ---------- per-stop photo strip ----------
  function injectShots(stop, urls, query){
    if (stop.querySelector("img") || stop.querySelector(".stop-shots")) return;
    urls = asList(urls); if (!urls.length) return;
    var wrap = document.createElement("div");
    wrap.className = "stop-shots";
    urls.forEach(function(u){
      var img = document.createElement("img");
      img.className = "stop-shot lightboxable";
      img.loading = "lazy"; img.alt = query; img.setAttribute("data-cap", query);
      img.onerror = function(){
        img.remove();
        if (!wrap.querySelector("img")) { wrap.remove(); if (cache[query]){ delete cache[query]; saveCache(); } }
      };
      img.src = u;
      wrap.appendChild(img);
    });
    contentDiv(stop).appendChild(wrap);
  }

  function fetchPhoto(stop, query){
    if (stop.querySelector("img") || stop.querySelector(".stop-shots")) return;
    if (cache[query]) { injectShots(stop, cache[query], query); return; }
    searchPhotos(query, STOP_SHOTS, 400).then(function(urls){
      if (!urls) return;
      cache[query] = urls; saveCache();
      injectShots(stop, urls, query);
    });
  }

  // ---------- per-day banner (Google fallback / fill the gap) ----------
  function cleanupEmpty(dp){
    if (dp && dp.getAttribute("data-created") === "1" && !dp.querySelector("img.gphoto")) dp.remove();
  }
  function bannerImg(dp, url, query){
    if (dp.querySelector("img.gphoto")) return;
    var img = document.createElement("img");
    img.className = "fill gphoto lightboxable";
    img.loading = "lazy"; img.alt = query; img.setAttribute("data-cap", query);
    img.onerror = function(){
      img.remove();
      if (cache["hero::" + query]){ delete cache["hero::" + query]; saveCache(); }
      cleanupEmpty(dp);
    };
    img.src = url;
    dp.appendChild(img);
  }
  function fetchBanner(dp, query){
    if (dp.querySelector("img.gphoto")) return;
    var ck = "hero::" + query;
    if (cache[ck]) { bannerImg(dp, cache[ck], query); return; }
    searchPhotos(query, 1, 900).then(function(urls){
      if (!urls) { cleanupEmpty(dp); return; }
      cache[ck] = urls[0]; saveCache();
      bannerImg(dp, urls[0], query);
    });
  }
  function ensureBanner(sec){
    var query = HERO[sec.id]; if (!query) return;
    var body = sec.querySelector(".card-body"); if (!body) return;
    var dp = sec.querySelector(".day-photo");
    if (!dp){
      dp = document.createElement("div");
      dp.className = "day-photo";
      dp.setAttribute("data-created", "1");
      var intro = body.querySelector(".day-intro");
      if (intro) body.insertBefore(dp, intro); else body.insertBefore(dp, body.firstChild);
      fetchBanner(dp, query);
      return;
    }
    if (dp.querySelector("img.gphoto")) return;
    var wm = dp.querySelector("img");
    if (!wm) { fetchBanner(dp, query); return; }                       // curated image already gone
    if (wm.complete && wm.naturalWidth === 0) { fetchBanner(dp, query); return; }  // already broken
    if (!wm.complete) { wm.addEventListener("error", function(){ fetchBanner(dp, query); }); }
  }

  function run(){
    if (!window.google || !google.maps || !google.maps.places || !google.maps.places.Place) return;
    document.querySelectorAll(".day").forEach(function(sec){ ensureBanner(sec); });
    document.querySelectorAll(".day .stop").forEach(function(stop){
      if (stop.querySelector("img") || stop.querySelector(".stop-shots")) return;
      var q = queryFor(stop);
      if (q) fetchPhoto(stop, q);
    });
  }

  var googleReady = false, domReady = false;
  function tryRun(){ if (googleReady && domReady) run(); }

  window.__mainePhotosMapsReady = function(){ googleReady = true; tryRun(); };

  function loadMaps(){
    if (document.getElementById("gmaps-js")) {
      if (window.google && google.maps && google.maps.places && google.maps.places.Place){ googleReady = true; tryRun(); }
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
