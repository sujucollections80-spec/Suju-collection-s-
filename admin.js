const PASSWORD = "suju1234";
const COLLECTION = "Products";

let db = null;

function loadFirebase(){
  return new Promise((resolve, reject) => {
    if(window.firebase && window.firebase.firestore){
      db = firebase.firestore();
      resolve();
      return;
    }

    const app = document.createElement("script");
    app.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js";

    app.onload = () => {
      const fs = document.createElement("script");
      fs.src = "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js";

      fs.onload = () => {
        firebase.initializeApp({
          apiKey: "AIzaSyBZnk_XV4BwWHHbMoxANQuDsxRbkJP1Ehs",
          authDomain: "suju-collection-s.firebaseapp.com",
          projectId: "suju-collection-s",
          storageBucket: "suju-collection-s.firebasestorage.app",
          messagingSenderId: "2779373511",
          appId: "1:2779373511:web:9d484186d9e8ea398cc3e2"
        });

        db = firebase.firestore();
        resolve();
      };

      fs.onerror = reject;
      document.head.appendChild(fs);
    };

    app.onerror = reject;
    document.head.appendChild(app);
  });
}

async function loginAdmin(){
  const password = document.getElementById("adminPassword").value;

  if(password !== PASSWORD){
    alert("Password తప్పు");
    return;
  }

  document.getElementById("loginBox").hidden = true;
  document.getElementById("adminPanel").hidden = false;

  try{
    await loadFirebase();
    await renderAdminProducts();
  }catch(e){
    console.error(e);
    alert("Firebase connection problem");
  }
}

function logoutAdmin(){
  document.getElementById("adminPanel").hidden = true;
  document.getElementById("loginBox").hidden = false;
  document.getElementById("adminPassword").value = "";
}

function makeId(){
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function compressImage(file){
  return new Promise((resolve,reject)=>{
    if(!file){
      resolve("");
      return;
    }

    const reader = new FileReader();

    reader.onload = e => {
      const img = new Image();

      img.onload = () => {
        const max = 700;
        let w = img.width;
        let h = img.height;

        if(w > h && w > max){
          h = Math.round(h * max / w);
          w = max;
        }else if(h > max){
          w = Math.round(w * max / h);
          h = max;
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img,0,0,w,h);

        resolve(canvas.toDataURL("image/jpeg",0.75));
      };

      img.onerror = reject;
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function saveProduct(){

  try{
    if(!db) await loadFirebase();

    const name = document.getElementById("pName").value.trim();
    const price = Number(document.getElementById("pPrice").value);
    const stock = Number(document.getElementById("pStock").value);
    const category = document.getElementById("pCategory").value.trim();
    const description = document.getElementById("pDesc").value.trim();

    const input = document.getElementById("pImage");
    const file = input.files && input.files[0];

    if(!name || !Number.isFinite(price) || !Number.isFinite(stock)){
      alert("Product name, price, stock తప్పనిసరి");
      return;
    }

    let image = "";

    if(file){
      image = await compressImage(file);
    }

    const product = {
      name,
      price,
      stock,
      category,
      description,
      image,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    const editId = document.getElementById("editId").value;

    if(editId){
      await db.collection(COLLECTION).doc(editId).set(product,{merge:true});
      alert("Product updated");
    }else{
      product.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTION).add(product);
      alert("Product added");
    }

    clearForm();
    await renderAdminProducts();

  }catch(e){
    console.error(e);
    alert("Product save కాలేదు: " + e.message);
  }
}

function clearForm(){
  document.getElementById("editId").value = "";
  document.getElementById("pName").value = "";
  document.getElementById("pPrice").value = "";
  document.getElementById("pStock").value = "";
  document.getElementById("pCategory").value = "";
  document.getElementById("pDesc").value = "";
  document.getElementById("pImage").value = "";
}

async function deleteProduct(id){

  if(!confirm("Product delete చేయాలా?")) return;

  try{
    if(!db) await loadFirebase();

    await db.collection(COLLECTION).doc(id).delete();

    await renderAdminProducts();

    alert("Product deleted");
  }catch(e){
    console.error(e);
    alert("Delete కాలేదు");
  }
}

async function editProduct(id){

  try{
    if(!db) await loadFirebase();

    const doc = await db.collection(COLLECTION).doc(id).get();

    if(!doc.exists) return;

    const p = doc.data();

    document.getElementById("editId").value = id;
    document.getElementById("pName").value = p.name || "";
    document.getElementById("pPrice").value = p.price || "";
    document.getElementById("pStock").value = p.stock || "";
    document.getElementById("pCategory").value = p.category || "";
    document.getElementById("pDesc").value = p.description || "";

    window.scrollTo({top:0,behavior:"smooth"});

  }catch(e){
    console.error(e);
    alert("Product open కాలేదు");
  }
}

async function renderAdminProducts(){

  const box = document.getElementById("adminProducts");

  if(!box) return;

  try{
    if(!db) await loadFirebase();

    const snap = await db.collection(COLLECTION).orderBy("createdAt","desc").get();

    if(snap.empty){
      box.innerHTML = "<p>No products added.</p>";
      return;
    }

    box.innerHTML = snap.docs.map(doc => {

      const p = doc.data();

      return `
        <div style="padding:12px;border-bottom:1px solid #ddd">
          ${p.image ? `<img src="${p.image}" style="width:80px;height:80px;object-fit:cover;border-radius:8px"><br>` : ""}
          <b>${escapeHtml(p.name || "")}</b><br>
          ₹${p.price || 0} | Stock: ${p.stock || 0}<br>
          ${escapeHtml(p.category || "")}<br>
          <button onclick="editProduct('${doc.id}')">Edit</button>
          <button onclick="deleteProduct('${doc.id}')">Delete</button>
        </div>
      `;

    }).join("");

  }catch(e){
    console.error(e);
    box.innerHTML = "<p>Products load కాలేదు.</p>";
  }
}

function escapeHtml(value){
  return String(value || "").replace(/[&<>"']/g,m=>({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  }[m]));
}

document.addEventListener("DOMContentLoaded",()=>{
  const panel = document.getElementById("adminPanel");
  if(panel) panel.hidden = true;
});
