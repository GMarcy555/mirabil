const PLACE_IDS = [
  "sagrada",
  "guell",
  "rambla",
  "boqueria",
  "palau",
  "santpau",
  "ciutadella",
  "batllo",
  "bunkers",
  "campnou",
];

const PHOTOS = {
  sagrada: "images/sagrada.webp",
  guell: "images/guell.jpg",
  rambla: "images/rambla.jpg",
  boqueria: "images/boqueria.webp",
  palau: "images/palau.jpg",
  santpau: "images/santpau.jpg",
  ciutadella: "images/ciutadella.jpg",
  batllo: "images/batllo.jpg",
  bunkers: "images/bunkers.jpg",
  campnou: "images/campnou.jpg",
};

function shotHtml(id) {
  return (
    '<span class="shot" data-place="' +
    id +
    '"><img src="' +
    PHOTOS[id] +
    '" alt=""></span>'
  );
}

const COORDS = {
  sagrada: [41.4036, 2.1744],
  guell: [41.4145, 2.1527],
  rambla: [41.3813, 2.1734],
  boqueria: [41.3817, 2.1715],
  palau: [41.3874, 2.1752],
  santpau: [41.4136, 2.1744],
  ciutadella: [41.388, 2.187],
  batllo: [41.3917, 2.1649],
  bunkers: [41.4193, 2.1556],
  campnou: [41.3809, 2.1228],
};

const LABEL_SIDE = {
  boqueria: "left",
  rambla: "right",
  batllo: "left",
  palau: "right",
  santpau: "left",
  sagrada: "right",
  guell: "left",
  bunkers: "right",
  campnou: "right",
  ciutadella: "left",
};

const CHECK_AFTER_GUELL = [
  "sagrada",
  "rambla",
  "boqueria",
  "palau",
  "santpau",
  "ciutadella",
];

const PAIRS = [
  { a: "palau", b: "guell", win: "palau" },
  { a: "sagrada", b: "santpau", win: "santpau" },
  { a: "palau", b: "boqueria", win: "palau" },
  { a: "ciutadella", b: "santpau", win: "santpau" },
  { a: "palau", b: "sagrada", win: "palau" },
  { a: "rambla", b: "ciutadella", win: "ciutadella" },
  { a: "sagrada", b: "guell", win: "sagrada" },
  { a: "rambla", b: "sagrada", win: "sagrada" },
  { a: "guell", b: "boqueria", win: "guell" },
];

const ELO_K = 32;
const ELO_START = 1500;
const PAIR_GAP = 2400;
const PAIR_VOTE = 1050;
const PAIR_START = 20400;

function expectedScore(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function scoresFromPairs(pairs) {
  const scores = {};
  pairs.forEach(function (pair) {
    if (scores[pair.a] === undefined) scores[pair.a] = ELO_START;
    if (scores[pair.b] === undefined) scores[pair.b] = ELO_START;
  });
  pairs.forEach(function (pair) {
    const winner = pair.win;
    const loser = winner === pair.a ? pair.b : pair.a;
    const ea = expectedScore(scores[winner], scores[loser]);
    scores[winner] += ELO_K * (1 - ea);
    scores[loser] += ELO_K * (0 - (1 - ea));
  });
  return scores;
}

function eloToHundred(elo) {
  return Math.max(0, Math.min(100, Math.round(70 + (elo - 1500) / 2)));
}

const ELO_SCORES = scoresFromPairs(PAIRS);

function displayScore(id) {
  const elo = ELO_SCORES[id] === undefined ? ELO_START : ELO_SCORES[id];
  return eloToHundred(elo);
}

function rankedIds() {
  return Object.keys(ELO_SCORES).sort(function (a, b) {
    return ELO_SCORES[b] - ELO_SCORES[a];
  });
}

const SCENES = ["hook", "city", "visited", "pairs", "rank", "close"];

const state = {
  lang: "en",
  timers: [],
};

const mapState = {
  map: null,
  markers: {},
};

function poiIcon(id, visible) {
  const side = LABEL_SIDE[id];
  const cls =
    "poi" +
    (side ? " poi--" + side : "") +
    (visible ? " is-in" : "");
  return L.divIcon({
    className: "poi-icon",
    html:
      '<div class="' +
      cls +
      '" data-place="' +
      id +
      '"><span class="poi-pin">' +
      displayScore(id) +
      '</span><span class="poi-name">' +
      copy().places[id].name +
      "</span></div>",
    iconSize: [26, 28],
    iconAnchor: [13, 28],
  });
}

function updateMapMarkers(visible) {
  if (!mapState.map) return;
  PLACE_IDS.forEach(function (id) {
    const marker = mapState.markers[id];
    if (marker) marker.setIcon(poiIcon(id, visible));
  });
}

function ensureMap() {
  if (typeof L === "undefined") return;
  if (mapState.map) {
    updateMapMarkers(false);
    mapState.map.invalidateSize();
    return;
  }
  const map = L.map("hook-map", {
    zoomControl: false,
    attributionControl: true,
    dragging: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false,
  });
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri",
      maxZoom: 16,
    }
  ).addTo(map);
  const bounds = L.latLngBounds(
    PLACE_IDS.map(function (id) {
      return COORDS[id];
    })
  );
  map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
  PLACE_IDS.forEach(function (id) {
    const marker = L.marker(COORDS[id], {
      icon: poiIcon(id, false),
      interactive: false,
      keyboard: false,
    });
    marker.addTo(map);
    mapState.markers[id] = marker;
  });
  mapState.map = map;
  requestAnimationFrame(function () {
    map.invalidateSize();
  });
}

function revealMapPins() {
  PLACE_IDS.forEach(function (id, index) {
    after(180 + index * 160, function () {
      const el = document.querySelector('.poi[data-place="' + id + '"]');
      if (el) el.classList.add("is-in");
    });
  });
}

function copy() {
  return I18N[state.lang];
}

function after(ms, fn) {
  const id = setTimeout(fn, ms);
  state.timers.push(id);
}

function stop() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
}

function lookup(path) {
  return path.split(".").reduce(function (obj, key) {
    return obj[key];
  }, copy());
}

function applyCopy() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = lookup(el.dataset.i18n);
  });
  const quoteKey = "land." + copy().land.quoteKey;
  document.querySelectorAll(".copy [data-i18n]").forEach(function (el) {
    el.classList.toggle("copy-quote", el.dataset.i18n === quoteKey);
  });
  document.getElementById("city-search").placeholder = copy().city.search;
  document.getElementById("place-search").placeholder = copy().visited.search;
  document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
    el.placeholder = lookup(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll(".lang-btn").forEach(function (btn) {
    btn.classList.toggle("is-on", btn.dataset.lang === state.lang);
  });
}

function buildCities() {
  const list = document.getElementById("city-list");
  list.innerHTML = copy()
    .city.cities.map(function (city) {
      return (
        '<li><button type="button" class="city-row" data-city="' +
        city.id +
        '"><span class="city-copy"><span class="city-name">' +
        city.name +
        '</span><span class="city-meta">' +
        city.meta +
        "</span></span></button></li>"
      );
    })
    .join("");
}

function buildPlaces() {
  const list = document.getElementById("place-list");
  const places = copy().places;
  list.innerHTML = PLACE_IDS.map(function (id) {
    return (
      '<li><button type="button" class="place-row" data-place="' +
      id +
      '">' +
      shotHtml(id) +
      '<span class="place-copy"><span class="place-name">' +
      places[id].name +
      '</span><span class="place-kind">' +
      places[id].kind +
      '</span></span><span class="check"></span></button></li>'
    );
  }).join("");
}

function buildRank() {
  const list = document.getElementById("rank-list");
  const places = copy().places;
  const labels = copy().rank;
  list.innerHTML = rankedIds()
    .map(function (id, index) {
      var tag = "";
      if (id === "palau") {
        tag = '<span class="tag tag-worth">' + labels.worth + "</span>";
      }
      if (id === "guell") {
        tag = '<span class="tag tag-hyped">' + labels.hyped + "</span>";
      }
      return (
        '<li class="rank-row"><span class="rank-n">' +
        (index + 1) +
        "</span>" +
        shotHtml(id) +
        '<span><span class="rank-name">' +
        places[id].name +
        '</span><span class="rank-score">' +
        displayScore(id) +
        "</span></span>" +
        tag +
        "</li>"
      );
    })
    .join("");
}

function fillCard(el, id) {
  const place = copy().places[id];
  el.dataset.place = id;
  el.classList.remove("is-win", "is-lose");
  el.innerHTML =
    shotHtml(id) +
    '<span class="card-copy"><span class="card-name">' +
    place.name +
    '</span><span class="card-where">' +
    copy().pairs.where +
    '</span><span class="card-kind">' +
    place.kind +
    '</span></span><span class="heart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg></span>';
}

function votePair(index) {
  const pair = PAIRS[index];
  const cardA = document.getElementById("card-a");
  const cardB = document.getElementById("card-b");
  const winner = pair.win === pair.a ? cardA : cardB;
  const loser = winner === cardA ? cardB : cardA;
  tap(winner.querySelector(".heart"));
  after(160, function () {
    winner.classList.add("is-win");
    loser.classList.add("is-lose");
  });
}

function showPair(index) {
  const pair = PAIRS[index];
  document.getElementById("pair-progress").textContent = copy().pairs.progress(
    index + 1,
    PAIRS.length
  );
  fillCard(document.getElementById("card-a"), pair.a);
  fillCard(document.getElementById("card-b"), pair.b);
}

function showScene(name) {
  document.querySelectorAll(".scene").forEach(function (scene) {
    scene.classList.toggle("is-on", scene.dataset.scene === name);
  });
  const index = SCENES.indexOf(name);
  document.querySelectorAll(".dots li").forEach(function (dot, i) {
    dot.classList.toggle("is-on", i === index);
  });
  if (name === "hook" && mapState.map) {
    requestAnimationFrame(function () {
      mapState.map.invalidateSize();
    });
  }
}

function setCaption(key, instant) {
  const el = document.getElementById("caption");
  const text = copy().captions[key];
  if (instant) {
    el.classList.remove("is-dim");
    el.textContent = text;
    return;
  }
  el.classList.add("is-dim");
  after(220, function () {
    el.textContent = text;
    el.classList.remove("is-dim");
  });
}

function tap(el) {
  const phone = document.getElementById("phone");
  const phoneBox = phone.getBoundingClientRect();
  const elBox = el.getBoundingClientRect();
  const scaleX = phoneBox.width / phone.offsetWidth;
  const scaleY = phoneBox.height / phone.offsetHeight;
  const dot = document.getElementById("tap");
  dot.style.left =
    (elBox.left + elBox.width / 2 - phoneBox.left) / scaleX + "px";
  dot.style.top =
    (elBox.top + elBox.height / 2 - phoneBox.top) / scaleY + "px";
  dot.classList.remove("is-pulse");
  void dot.offsetWidth;
  dot.classList.add("is-pulse");
}

function typeText(input, text, stepMs, onTick) {
  var i = 0;
  input.value = "";
  function step() {
    i += 1;
    input.value = text.slice(0, i);
    if (onTick) onTick(input.value);
    if (i < text.length) after(stepMs, step);
  }
  after(stepMs, step);
}

function filterCities(query) {
  const q = query.toLowerCase();
  document.querySelectorAll(".city-row").forEach(function (row) {
    const name = row.querySelector(".city-name").textContent.toLowerCase();
    row.classList.toggle("is-off", q.length > 0 && name.indexOf(q) === -1);
  });
}

function filterPlaces(query) {
  const q = query.toLowerCase();
  document.querySelectorAll(".place-row").forEach(function (row) {
    const name = row.querySelector(".place-name").textContent.toLowerCase();
    row.classList.toggle("is-off", q.length > 0 && name.indexOf(q) === -1);
  });
}

function placeRow(id) {
  return document.querySelector('.place-row[data-place="' + id + '"]');
}

function cityRow(id) {
  return document.querySelector('.city-row[data-city="' + id + '"]');
}

function checkPlace(id) {
  const row = placeRow(id);
  tap(row);
  after(160, function () {
    row.classList.add("is-checked");
  });
}

function resetVisuals() {
  document.getElementById("city-search").value = "";
  document.getElementById("place-search").value = "";
  document.getElementById("continue").disabled = true;
  document.getElementById("continue").classList.remove("is-ready");
  document.getElementById("tap").classList.remove("is-pulse");
  updateMapMarkers(false);
}

function play() {
  stop();
  applyCopy();
  buildCities();
  buildPlaces();
  buildRank();
  ensureMap();
  resetVisuals();
  showScene("hook");
  setCaption("hook", true);
  after(80, function () {
    if (mapState.map) mapState.map.invalidateSize();
  });
  revealMapPins();

  after(5250, function () {
    showScene("city");
    setCaption("city");
  });

  after(5700, function () {
    typeText(document.getElementById("city-search"), "Barcelona", 68, filterCities);
  });

  after(6975, function () {
    const row = cityRow("barcelona");
    tap(row);
    after(150, function () {
      row.classList.add("is-picked");
    });
  });

  after(8850, function () {
    showScene("visited");
    setCaption("visited");
  });

  after(9450, function () {
    typeText(document.getElementById("place-search"), "Park", 82, filterPlaces);
  });

  after(10875, function () {
    checkPlace("guell");
  });

  after(12000, function () {
    document.getElementById("place-search").value = "";
    filterPlaces("");
  });

  CHECK_AFTER_GUELL.forEach(function (id, index) {
    after(12900 + index * 900, function () {
      checkPlace(id);
    });
  });

  after(18600, function () {
    const btn = document.getElementById("continue");
    btn.disabled = false;
    btn.classList.add("is-ready");
  });

  after(19350, function () {
    tap(document.getElementById("continue"));
  });

  PAIRS.forEach(function (pair, index) {
    const start = PAIR_START + index * PAIR_GAP;
    after(start, function () {
      if (index === 0) {
        showScene("pairs");
        setCaption("pairs");
      }
      showPair(index);
    });
    after(start + PAIR_VOTE, function () {
      votePair(index);
    });
  });

  after(PAIR_START + PAIRS.length * PAIR_GAP, function () {
    showScene("rank");
    setCaption("rank");
    document.querySelectorAll(".rank-row").forEach(function (row, index) {
      row.style.transitionDelay = index * 0.12 + "s";
      row.classList.add("is-in");
    });
  });

  after(PAIR_START + PAIRS.length * PAIR_GAP + 9200, function () {
    showScene("close");
    setCaption("close");
  });
}

function setLang(lang) {
  state.lang = lang;
  play();
}

const params = new URLSearchParams(window.location.search);
if (params.get("lang") === "hu") {
  state.lang = "hu";
}

document.querySelectorAll(".lang-btn").forEach(function (btn) {
  btn.addEventListener("click", function () {
    setLang(btn.dataset.lang);
  });
});

document.getElementById("replay").addEventListener("click", function () {
  play();
});

play();
