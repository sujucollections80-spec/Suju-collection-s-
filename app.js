const WA = "919392916489";
const COLLECTION = "Products";

let products = [];
let cart = JSON.parse(localStorage.getItem("sujuCart") || "[]");
let db = null;

const firebaseConfig = {
  apiKey: "AIzaSyBZnk_XV4BvWHHbMoxANQuDsxRbkJP1Ehs",
  authDomain: "suju-collection-s.firebaseapp.com",
  projectId: "suju-collection-s",
  storageBucket: "suju-collection-s.firebasestorage.app",
  messagingSenderId: "2779373511",
  appId: "1:2779373511:web:9d484186d9e8ea398cc3e2",
  measurementId: "G-Y6BDXQZ9YT"
};

function loadFirebase() {
  return new Promise((resolve, reject) => {
    if (window.firebase) {
      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      resolve();
      return;
    }

    const appScript = document.createElement("script");
    appScript.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";

    appScript.onload = () => {
      const fsScript = document.createElement("script");
      fsScript.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";

      fsScript.onload = () => {
        try {
          firebase.initializeApp(firebaseConfig);
          db = firebase.firestore();
          resolve();
        } catch (e) {
          reject(e);
        }
      };

      fsScript.onerror = reject;
      document.head.appendChild(fsScript);
    };

    appScript.onerror = reject;
    document.head.appendChild(appScript);
  });
}

function saveCart() {
  localStorage.setItem("sujuCart", JSON.stringify(cart));
}

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

async function loadProducts() {
  try {
    if (!db) await loadFirebase();

    const snap = await db
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .get();

    products = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    renderProducts();
    updateCount();

  } catch (e) {
    console.error("Products load error:", e);
    products = [];
    renderProducts();
    alert("Products load కాలేదు. Firebase connection check చేయండి.");
  }
}

function renderProducts() {
  const q = (document.getElementById("search")?.value || "").toLowerCase();
  const el = document.getElementById("products");

  if (!el) return;

  const list = products.filter(p =>
    (String(p.name || "") + " " + String(p.category || ""))
      .toLowerCase()
      .includes(q)
  );

  el.innerHTML = list.map(p => `
    <article class="card">
      <img src="${p.image || p.image_url || "assets/logo.jpg"}" alt="">
      <div class="card-body">
        <b>${esc(p.name)}</b>
        <div class="price">₹${Number(p.price || 0)}</div>
        <div class="stock">
          ${Number(p.stock || 0) > 0
            ? `Stock: ${Number(p.stock)}`
            : "Out of stock"}
        </div>

        <button
          class="add-btn"
          ${Number(p.stock || 0) <= 0 ? "disabled" : ""}
          onclick="addCart('${String(p.id).replace(/'/g, "\\'")}')">
          Add to Cart
        </button>
      </div>
    </article>
  `).join("");

  const empty = document.getElementById("empty");
  if (empty) empty.hidden = list.length > 0;
}

function addCart(id) {
  const p = products.find(x => String(x.id) === String(id));

  if (!p) return;

  const stock = Number(p.stock || 0);

  if (stock <= 0) {
    alert("ఈ product stockలో లేదు.");
    return;
  }

  const x = cart.find(x => String(x.id) === String(id));

  if (x) {
    if (x.qty < stock) {
      x.qty++;
    } else {
      alert("Stock limit reached.");
      return;
    }
  } else {
    cart.push({
      id: p.id,
      qty: 1
    });
  }

  saveCart();
  updateCount();
  openCart();
}

function updateCount() {
  const el = document.getElementById("cartCount");

  if (el) {
    el.textContent = cart.reduce(
      (a, x) => a + Number(x.qty || 0),
      0
    );
  }
}

function openCart() {
  const modal = document.getElementById("cartModal");
  if (modal) modal.hidden = false;

  renderCart();
}

function closeCart() {
  const modal = document.getElementById("cartModal");
  if (modal) modal.hidden = true;
}

function renderCart() {
  const el = document.getElementById("cartItems");

  if (!el) return;

  let total = 0;

  el.innerHTML = cart.map(x => {
    const p = products.find(y => String(y.id) === String(x.id));

    if (!p) return "";

    const price = Number(p.price || 0);
    const qty = Number(x.qty || 0);

    total += price * qty;

    return `
      <div class="cart-row">
        <img src="${p.image || p.image_url || "assets/logo.jpg"}">

        <div class="grow">
          <b>${esc(p.name)}</b><br>
          ₹${price}
        </div>

        <div class="qty">
          <button onclick="changeQty('${String(p.id).replace(/'/g, "\\'")}',-1)">−</button>
          <b>${qty}</b>
          <button onclick="changeQty('${String(p.id).replace(/'/g, "\\'")}',1)">+</button>
        </div>
      </div>
    `;
  }).join("");

  const totalEl = document.getElementById("cartTotal");

  if (totalEl) {
    totalEl.textContent = total.toFixed(0);
  }

  updateCount();
}

function changeQty(id, d) {
  const x = cart.find(x => String(x.id) === String(id));
  const p = products.find(y => String(y.id) === String(id));

  if (!x || !p) return;

  x.qty += d;

  if (x.qty <= 0) {
    cart = cart.filter(y => String(y.id) !== String(id));
  }

  const stock = Number(p.stock || 0);

  if (x.qty > stock) {
    x.qty = stock;
  }

  saveCart();
  renderCart();
}

function getLocation() {
  if (!navigator.geolocation) {
    alert("ఈ ఫోన్ location support చేయడం లేదు.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => {
      const locationInput = document.getElementById("custLocation");

      if (locationInput) {
        locationInput.value =
          `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
      }
    },
    () => {
      alert("Location permission Allow చేయండి.");
    }
  );
}
function sendOrder() {
  if (!cart.length) {
    alert("Cart ఖాళీగా ఉంది.");
    return;
  }

  const name = document.getElementById("custName")?.value.trim() || "";
  const phone = document.getElementById("custPhone")?.value.trim() || "";
  const addr = document.getElementById("custAddress")?.value.trim() || "";
  const loc = document.getElementById("custLocation")?.value || "";
  const pay = document.getElementById("paymentMethod")?.value || "COD";

  let total = 0;

  const lines = cart.map(x => {
    const p = products.find(y => String(y.id) === String(x.id));
    if (!p) return "";

    const price = Number(p.price || 0);
    const qty = Number(x.qty || 0);
    const image = p.image || p.image_url || "";

    total += price * qty;

    return `${p.name} × ${qty} = ₹${price * qty}\nPhoto: ${image}`;
  }).filter(Boolean).join("\n\n");

  const msg = `🛍️ *Suju Collections Order*

${lines}

*Total: ₹${total}*
Payment: ${pay}

Customer: ${name}
Phone: ${phone}
Address: ${addr}
Location: ${loc || "Not shared"}

Please confirm my order.`;
  

  window.open(
    `https://wa.me/${WA}?text=${encodeURIComponent(msg)}`,
    "_blank"
  );
}


  try {
    await loadProducts();
  } catch (e) {
    console.error(e);
  }
}

document.addEventListener("DOMContentLoaded", startShop);
