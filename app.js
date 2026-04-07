(function () {
  "use strict";

  /**
   * Optional: map catalog SKUs to local files (e.g. images/velo-w-001.jpg).
   * SKUs are generated in products-data.js (velo-w-###, velo-m-###, velo-a-###).
   */
  var LOCAL_IMAGES = {
    // "velo-w-001": "images/velo-w-001.jpg",
  };

  var STORAGE_KEY = "velomora-cart-v1";

  /** Used if remote catalog image fails to load */
  var IMG_FALLBACK = "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600";

  function formatMoney(cents) {
    return "$" + (cents / 100).toFixed(2);
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(lines) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }

  function getImageForSku(sku, fallbackUrl) {
    if (LOCAL_IMAGES[sku]) return LOCAL_IMAGES[sku];
    return fallbackUrl;
  }

  function applyLocalImages() {
    document.querySelectorAll(".product[data-sku]").forEach(function (card) {
      var sku = card.getAttribute("data-sku");
      if (!sku || !LOCAL_IMAGES[sku]) return;
      var img = card.querySelector(".img-wrap img");
      if (img) img.src = LOCAL_IMAGES[sku];
    });
  }

  var cartRoot = document.getElementById("cart-root");
  var cartLinesEl = document.getElementById("cart-lines");
  var cartCountEl = document.getElementById("header-cart-count");
  var cartSubtotalEl = document.getElementById("cart-subtotal-amount");
  var cartOpenBtn = document.getElementById("header-cart-btn");
  var cartCloseBtn = document.getElementById("cart-close");
  var cartBackdrop = cartRoot && cartRoot.querySelector(".cart-backdrop");
  var cartCheckoutBtn = document.getElementById("cart-checkout-btn");

  var checkoutRoot = document.getElementById("checkout-root");
  var checkoutForm = document.getElementById("checkout-form");
  var checkoutCancel = document.getElementById("checkout-cancel");
  var toastEl = document.getElementById("toast");

  function linesSubtotal(lines) {
    return lines.reduce(function (sum, line) {
      return sum + line.priceCents * line.qty;
    }, 0);
  }

  function lineCount(lines) {
    return lines.reduce(function (n, line) {
      return n + line.qty;
    }, 0);
  }

  function updateHeaderCount(lines) {
    if (!cartCountEl) return;
    var n = lineCount(lines);
    if (n > 0) {
      cartCountEl.textContent = String(n);
      cartCountEl.hidden = false;
    } else {
      cartCountEl.textContent = "";
      cartCountEl.hidden = true;
    }
  }

  function renderCart() {
    var lines = loadCart();
    updateHeaderCount(lines);

    if (!cartLinesEl || !cartSubtotalEl) return;

    if (lines.length === 0) {
      cartLinesEl.innerHTML =
        '<p class="cart-empty">Your cart is empty. Browse the <a href="shop.html">shop</a> to get started.</p>';
      cartSubtotalEl.textContent = formatMoney(0);
      if (cartCheckoutBtn) cartCheckoutBtn.disabled = true;
      return;
    }

    if (cartCheckoutBtn) cartCheckoutBtn.disabled = false;

    cartLinesEl.innerHTML = lines
      .map(function (line, index) {
        var img = escapeAttr(line.image);
        var name = escapeHtml(line.name);
        return (
          '<div class="cart-line" data-index="' +
          index +
          '">' +
          '<img class="cart-line-thumb" src="' +
          img +
          '" alt="" width="72" height="96" loading="lazy" />' +
          '<div class="cart-line-body">' +
          "<h3>" +
          name +
          "</h3>" +
          '<p class="cart-line-meta">' +
          formatMoney(line.priceCents) +
          " each</p>" +
          '<div class="cart-qty">' +
          '<button type="button" data-action="dec" aria-label="Decrease quantity">−</button>' +
          "<span>" +
          line.qty +
          "</span>" +
          '<button type="button" data-action="inc" aria-label="Increase quantity">+</button>' +
          "</div>" +
          '<button type="button" class="cart-line-remove" data-action="remove">Remove</button>' +
          "</div>" +
          '<div class="cart-line-meta" style="text-align:right;font-weight:600;color:var(--ink)">' +
          formatMoney(line.priceCents * line.qty) +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    cartSubtotalEl.textContent = formatMoney(linesSubtotal(lines));

    cartLinesEl.querySelectorAll(".cart-line").forEach(function (row) {
      var idx = parseInt(row.getAttribute("data-index"), 10);
      row.addEventListener("click", function (e) {
        var t = e.target;
        if (!(t instanceof HTMLElement)) return;
        var action = t.getAttribute("data-action");
        if (!action) return;
        e.preventDefault();
        var next = loadCart();
        var line = next[idx];
        if (!line) return;
        if (action === "inc") line.qty += 1;
        if (action === "dec") line.qty = Math.max(1, line.qty - 1);
        if (action === "remove") next.splice(idx, 1);
        saveCart(next);
        renderCart();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function renderProductCatalog() {
    var cat = window.VELOMORA_CATALOG;
    if (!cat) return;

    function fillGrid(gridId, items) {
      var el = document.getElementById(gridId);
      if (!el || !items || !items.length) return;
      el.innerHTML = items
        .map(function (p, idx) {
          var badge =
            idx === 0
              ? '<span class="product-badge" aria-hidden="true">Popular</span>'
              : "";
          var pdp = "product.html?sku=" + encodeURIComponent(p.sku);
          return (
            '<article class="product" data-sku="' +
            escapeAttr(p.sku) +
            '"><a class="product-card__media" href="' +
            escapeAttr(pdp) +
            '"><div class="img-wrap">' +
            badge +
            '<img src="' +
            escapeAttr(p.image) +
            '" alt="' +
            escapeAttr(p.alt) +
            '" width="600" height="800" loading="lazy" decoding="async" onerror="this.onerror=null;this.src=\'' +
            IMG_FALLBACK +
            '\'"/></div></a><div class="product-info"><a class="product-card__title" href="' +
            escapeAttr(pdp) +
            '"><h4>' +
            escapeHtml(p.name) +
            '</h4></a><p class="price">' +
            formatMoney(p.priceCents) +
            '</p><p class="product-meta"><span>Free 30-day returns</span> · <a href="index.html#size-guide">Size guide</a></p><button type="button" class="btn-add-cart" data-sku="' +
            escapeAttr(p.sku) +
            '" data-name="' +
            escapeAttr(p.name) +
            '" data-price-cents="' +
            p.priceCents +
            '">Add to cart</button></div></article>'
          );
        })
        .join("");
    }

    fillGrid("product-grid-featured", cat.featured);
    fillGrid("product-grid-mens", cat.mens);
    fillGrid("product-grid-accessories", cat.accessories);
  }

  function openCart() {
    if (!cartRoot) return;
    cartRoot.classList.add("is-open");
    cartRoot.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    renderCart();
  }

  function closeCart() {
    if (!cartRoot) return;
    cartRoot.classList.remove("is-open");
    cartRoot.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 3200);
  }

  function addToCart(sku, name, priceCents, imageUrl) {
    var lines = loadCart();
    imageUrl = getImageForSku(sku, imageUrl);
    var existing = lines.find(function (l) {
      return l.sku === sku;
    });
    if (existing) existing.qty += 1;
    else
      lines.push({
        sku: sku,
        name: name,
        priceCents: priceCents,
        image: imageUrl,
        qty: 1,
      });
    saveCart(lines);
    renderCart();
    showToast("Added to cart — " + name);
  }

  function openCheckout() {
    if (!checkoutRoot) return;
    checkoutRoot.classList.add("is-open");
    checkoutRoot.setAttribute("aria-hidden", "false");
  }

  function closeCheckout() {
    if (!checkoutRoot) return;
    checkoutRoot.classList.remove("is-open");
    checkoutRoot.setAttribute("aria-hidden", "true");
  }

  function initProductDetailPage() {
    var mount = document.getElementById("product-detail-mount");
    if (!mount) return;
    var skuParam = new URLSearchParams(location.search).get("sku");
    var p =
      skuParam && window.getVelomoraProductBySku
        ? window.getVelomoraProductBySku(skuParam)
        : null;
    if (!p) {
      document.title = "Item not found — Velomora Shop";
      mount.innerHTML =
        '<div class="product-missing wrap"><p>We couldn’t find that item.</p><p><a href="shop.html" class="btn-primary">Back to shop</a></p></div>';
      return;
    }
    document.title = p.name + " — Velomora Shop";
    var imgSrc = getImageForSku(p.sku, p.image);
    mount.innerHTML =
      '<div class="product-detail wrap">' +
      '<nav class="shop-breadcrumb" aria-label="Breadcrumb"><a href="index.html">Home</a><span class="shop-breadcrumb__sep">/</span><a href="shop.html">Shop</a><span class="shop-breadcrumb__sep">/</span><span aria-current="page">' +
      escapeHtml(p.name) +
      "</span></nav>" +
      '<div class="product-detail__grid">' +
      '<div class="product-detail__media"><img src="' +
      escapeAttr(imgSrc) +
      '" alt="' +
      escapeAttr(p.alt) +
      '" width="720" height="960" loading="eager" decoding="async" onerror="this.onerror=null;this.src=\'' +
      IMG_FALLBACK +
      '\'"/></div>' +
      '<div class="product-detail__buy">' +
      "<h1>" +
      escapeHtml(p.name) +
      "</h1>" +
      '<p class="product-detail__price">' +
      formatMoney(p.priceCents) +
      "</p>" +
      '<p class="product-detail__note">Model is 5′9″ / 175 cm and wears size S. See our <a href="index.html#size-guide">size guide</a>.</p>' +
      '<ul class="product-detail__bullets"><li>Free 30-day returns</li><li>Ships within 1–2 business days</li></ul>' +
      '<button type="button" class="btn-add-cart btn-add-cart--wide" data-sku="' +
      escapeAttr(p.sku) +
      '" data-name="' +
      escapeAttr(p.name) +
      '" data-price-cents="' +
      p.priceCents +
      '">Add to cart</button>' +
      '<p class="product-detail__sku">Style #<span>' +
      escapeHtml(p.sku) +
      "</span></p>" +
      "</div></div></div>";
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderProductCatalog();
    applyLocalImages();
    initProductDetailPage();
    renderCart();

    document.body.addEventListener("click", function (e) {
      var btn = e.target.closest(".btn-add-cart");
      if (!btn) return;
      var sku = btn.getAttribute("data-sku");
      var name = btn.getAttribute("data-name");
      var price = parseInt(btn.getAttribute("data-price-cents"), 10);
      if (!sku || !name || !price) return;
      var card = btn.closest(".product");
      var imgEl = card && card.querySelector(".img-wrap img");
      if (!imgEl) {
        var detail = btn.closest(".product-detail");
        if (detail) imgEl = detail.querySelector(".product-detail__media img");
      }
      var src = imgEl ? imgEl.src : "";
      addToCart(sku, name, price, src);

      btn.classList.add("added-flash");
      setTimeout(function () {
        btn.classList.remove("added-flash");
      }, 450);
    });

    if (cartOpenBtn) cartOpenBtn.addEventListener("click", openCart);
    if (cartCloseBtn) cartCloseBtn.addEventListener("click", closeCart);
    if (cartBackdrop) cartBackdrop.addEventListener("click", closeCart);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        closeCheckout();
        closeCart();
      }
    });

    if (cartCheckoutBtn) {
      cartCheckoutBtn.addEventListener("click", function () {
        var lines = loadCart();
        if (lines.length === 0) return;
        openCheckout();
      });
    }

    if (checkoutCancel) {
      checkoutCancel.addEventListener("click", function () {
        closeCheckout();
      });
    }

    if (checkoutRoot) {
      checkoutRoot.addEventListener("click", function (e) {
        if (e.target === checkoutRoot) closeCheckout();
      });
    }

    if (checkoutForm) {
      checkoutForm.addEventListener("submit", function (e) {
        e.preventDefault();
        var email = document.getElementById("checkout-email");
        var address = document.getElementById("checkout-address");
        if (!email || !address) return;
        if (!email.value.trim() || !address.value.trim()) {
          showToast("Please fill in email and shipping address.");
          return;
        }
        var lines = loadCart();
        if (lines.length === 0) {
          closeCheckout();
          return;
        }
        saveCart([]);
        renderCart();
        closeCheckout();
        closeCart();
        checkoutForm.reset();
        var id = "VM-" + Date.now().toString(36).toUpperCase();
        showToast("Order " + id + " confirmed. Check your email for details.");
      });
    }

    var shopBtn = document.getElementById("header-shop-btn");
    if (shopBtn) {
      shopBtn.addEventListener("click", function () {
        var path = location.pathname || "";
        if (path.indexOf("shop.html") !== -1) {
          var topEl = document.getElementById("shop-top");
          if (topEl) topEl.scrollIntoView({ behavior: "smooth" });
        } else {
          window.location.href = "shop.html";
        }
      });
    }
  });
})();
