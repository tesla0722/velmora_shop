/**
 * Product catalog: COUNT items × 3 sections.
 * Product photos use verified Unsplash URLs (editorial quality, stable CDN).
 * Change COUNT to adjust grid size. Override images with LOCAL_IMAGES in app.js.
 */
(function () {
  "use strict";

  var COUNT = 8;

  /** Eight distinct women’s / womenswear editorial images (HTTP 200 verified). */
  var WOMEN_PHOTOS = [
    "1490481651871-ab68de25d43d",
    "1515886657613-9f3515b0c78f",
    "1469334031218-e382a71b716b",
    "1509631179647-0177331693ae",
    "1539533018447-63fcce2678e3",
    "1591047139829-d91aecb6caea",
    "1541099649105-f69ad21f3246",
    "1595777457583-95e059d581b8",
  ];

  /** Eight distinct menswear / men’s fashion images. */
  var MEN_PHOTOS = [
    "1617137968427-85924c800a22",
    "1560250097-0b93528c311a",
    "1602810318383-e386cc2a3ccf",
    "1549298916-b41d501d3772",
    "1601925260368-ae2f83cf8b7f",
    "1507003211169-0a1dd7228f2d",
    "1506794778202-cad84cf45f1d",
    "1472099645785-5658abf4ff4e",
  ];

  /** Bags, shoes, jewelry, accessories. */
  var ACCESSORY_PHOTOS = [
    "1590874103328-eac38a683ce7",
    "1543163521-1bf539c55dd2",
    "1572635196237-14b3f281503f",
    "1553062407-98eeb64c6a62",
    "1551028719-00167b16eac5",
    "1434389677669-e08b4cac3105",
    "1529139574466-a303027c1d8b",
    "1591047139829-d91aecb6caea",
  ];

  function unsplashUrl(suffix) {
    return (
      "https://images.unsplash.com/photo-" +
      suffix +
      "?auto=format&w=600&h=800&fit=crop&q=82"
    );
  }

  function imageFor(section, index) {
    var arr =
      section === "w" ? WOMEN_PHOTOS : section === "m" ? MEN_PHOTOS : ACCESSORY_PHOTOS;
    return unsplashUrl(arr[index % arr.length]);
  }

  function zpad(n, w) {
    var s = String(n);
    while (s.length < w) s = "0" + s;
    return s;
  }

  function titleCasePhrase(s) {
    return s.replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  function rowIndex(i, rowCount) {
    if (COUNT < 1) return 0;
    return Math.min(Math.floor((i * rowCount) / COUNT), rowCount - 1);
  }

  function buildWomen(i) {
    var cols = [
      "Meridian",
      "Aurora",
      "Linea",
      "Solstice",
      "Cadence",
      "Marlow",
      "River",
      "Vesper",
    ];
    var rows = [
      "wool wrap coat",
      "tailored midi dress",
      "pleated wide trouser",
      "silk blouse",
    ];
    var raw = cols[i % 8] + " " + rows[rowIndex(i, rows.length)];
    return {
      sku: "velo-w-" + zpad(i + 1, 3),
      name: titleCasePhrase(raw),
      priceCents: (68 + ((i * 11 + 3) % 312)) * 100,
      image: imageFor("w", i),
      alt: "Women’s fashion — " + raw,
    };
  }

  function buildMen(i) {
    var cols = [
      "Atlas",
      "Pilot",
      "Vertex",
      "Drift",
      "Hudson",
      "Rowan",
      "Felix",
      "Sterling",
    ];
    var rows = [
      "Oxford shirt",
      "stretch chino",
      "leather sneaker",
      "merino crew",
    ];
    var raw = cols[i % 8] + " " + rows[rowIndex(i, rows.length)];
    return {
      sku: "velo-m-" + zpad(i + 1, 3),
      name: titleCasePhrase(raw),
      priceCents: (54 + ((i * 13 + 7) % 268)) * 100,
      image: imageFor("m", i),
      alt: "Men’s fashion — " + raw,
    };
  }

  function buildAccessory(i) {
    var cols = [
      "Veil",
      "Lune",
      "Stella",
      "Orion",
      "Prism",
      "Vale",
      "Fable",
      "Marin",
    ];
    var rows = [
      "leather tote",
      "chain necklace",
      "mule heel",
      "silk scarf",
    ];
    var raw = cols[i % 8] + " " + rows[rowIndex(i, rows.length)];
    return {
      sku: "velo-a-" + zpad(i + 1, 3),
      name: titleCasePhrase(raw),
      priceCents: (42 + ((i * 9 + 5) % 228)) * 100,
      image: imageFor("a", i),
      alt: "Fashion accessory — " + raw,
    };
  }

  function series(builder) {
    var out = [];
    for (var j = 0; j < COUNT; j++) out.push(builder(j));
    return out;
  }

  window.VELOMORA_CATALOG = {
    featured: series(buildWomen),
    mens: series(buildMen),
    accessories: series(buildAccessory),
  };

  /** Lookup for product detail page (product.html?sku=…). */
  window.getVelomoraProductBySku = function (sku) {
    var c = window.VELOMORA_CATALOG;
    if (!c || !sku) return null;
    var lists = [c.featured, c.mens, c.accessories];
    for (var li = 0; li < lists.length; li++) {
      var list = lists[li];
      for (var j = 0; j < list.length; j++) {
        if (list[j].sku === sku) return list[j];
      }
    }
    return null;
  };
})();
