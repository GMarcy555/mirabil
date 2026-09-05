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

const GOOGLE = {
  palau: "4.7",
  santpau: "4.7",
  sagrada: "4.7",
  ciutadella: "4.5",
  guell: "4.6",
  boqueria: "4.4",
  rambla: "4.2",
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
  { a: "santpau", b: "sagrada", win: "santpau" },
  { a: "palau", b: "boqueria", win: "palau" },
  { a: "santpau", b: "ciutadella", win: "santpau" },
  { a: "palau", b: "sagrada", win: "palau" },
  { a: "ciutadella", b: "rambla", win: "ciutadella" },
  { a: "sagrada", b: "guell", win: "sagrada" },
  { a: "sagrada", b: "rambla", win: "sagrada" },
  { a: "guell", b: "boqueria", win: "guell" },
];

const ELO_K = 32;
const ELO_START = 1500;
const PAIR_GAP = 3200;
const PAIR_VOTE = 1400;
const PAIR_START = 25450;

function expectedScore(ra, rb) {
  return 1 / (1 + Math.pow(10, (rb - ra) / 400));
}

function rankFromPairs(pairs) {
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
  return Object.keys(scores).sort(function (a, b) {
    return scores[b] - scores[a];
  });
}

const SCENES = ["hook", "city", "visited", "pairs", "rank", "close"];

const state = {
  lang: "en",
  timers: [],
};

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

function formatScore(score) {
  return state.lang === "hu" ? score.replace(".", ",") : score;
}

function applyCopy() {
  document.documentElement.lang = state.lang;
  document.querySelectorAll("[data-i18n]").forEach(function (el) {
    el.textContent = lookup(el.dataset.i18n);
  });
  document.getElementById("city-search").placeholder = copy().city.search;
  document.getElementById("place-search").placeholder = copy().visited.search;
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
  list.innerHTML = rankFromPairs(PAIRS).map(function (id, index) {
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
      '</span><span class="rank-google">' +
      labels.google +
      " " +
      formatScore(GOOGLE[id]) +
      "</span></span>" +
      tag +
      "</li>"
    );
  }).join("");
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
  document.querySelector(".ig-heart").classList.remove("is-liked");
  document.getElementById("tap").classList.remove("is-pulse");
}

function play() {
  stop();
  applyCopy();
  buildCities();
  buildPlaces();
  buildRank();
  resetVisuals();
  showScene("hook");
  setCaption("hook", true);

  after(1800, function () {
    document.querySelector(".ig-heart").classList.add("is-liked");
  });

  after(5250, function () {
    showScene("city");
    setCaption("city");
  });

  after(5850, function () {
    typeText(document.getElementById("city-search"), "Barcelona", 90, filterCities);
  });

  after(7550, function () {
    const row = cityRow("barcelona");
    tap(row);
    after(150, function () {
      row.classList.add("is-picked");
    });
  });

  after(10050, function () {
    showScene("visited");
    setCaption("visited");
  });

  after(10850, function () {
    typeText(document.getElementById("place-search"), "Park", 110, filterPlaces);
  });

  after(12750, function () {
    checkPlace("guell");
  });

  after(14250, function () {
    document.getElementById("place-search").value = "";
    filterPlaces("");
  });

  CHECK_AFTER_GUELL.forEach(function (id, index) {
    after(15450 + index * 1200, function () {
      checkPlace(id);
    });
  });

  after(23050, function () {
    const btn = document.getElementById("continue");
    btn.disabled = false;
    btn.classList.add("is-ready");
  });

  after(24050, function () {
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
