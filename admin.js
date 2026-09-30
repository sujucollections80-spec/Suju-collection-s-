const PRODUCTS_KEY="sujuProducts";
const PASSWORD_KEY="sujuAdminPassword";
const DEFAULT_PASSWORD="suju1234";

function getProducts(){
  try{
    const x=localStorage.getItem(PRODUCTS_KEY);
    const p=x?JSON.parse(x):[];
    return Array.isArray(p)?p:[];
  }catch(e){return[];}
}

function saveProducts(p){
  localStorage.setItem(PRODUCTS_KEY,JSON.stringify(p));
}

function loginAdmin(){
  const password=document.getElementById("adminPassword").value;
  const saved=localStorage.getItem(PASSWORD_KEY)||DEFAULT_PASSWORD;

  if(password!==saved){
    alert("Password తప్పు.");
    return;
  }

  document.getElementById("loginBox").hidden=true;
  document.getElementById("adminPanel").hidden=false;
  renderAdminProducts();
}

function logoutAdmin(){
  document.getElementById("adminPanel").hidden=true;
  document.getElementById("loginBox").hidden=false;
}

function makeId(){
  return Date.now().toString(36)+Math.random().toString(36).slice(2,7);
}

function saveProduct(){
  const name=document.getElementById("pName").value.trim();
  const price=Number(document.getElementById("pPrice").value);
  const stock=Number(document.getElementById("pStock").value);
  const category=document.getElementById("pCategory").value.trim();
  const description=document.getElementById("pDesc").value.trim();
  const input=document.getElementById("pImage");
  const editId=document.getElementById("editId").value;

  if(!name||!Number.isFinite(price)||!Number.isFinite(stock)){
    alert("Product name, price, stock పెట్టండి.");
    return;
  }

  const products=getProducts();
  const old=products.find(p=>String(p.id)===String(editId));

  const finish=(image)=>{
    const product={
      id:editId||makeId(),
      name,
      price,
      stock,
      category,
      description,
      image:image||(old?old.image||"":"")
    };

    const i=products.findIndex(p=>String(p.id)===String(editId));

    if(i>=0) products[i]=product;
    else products.push(product);

    saveProducts(products);
    clearForm();
    renderAdminProducts();
    alert(editId?"Product updated.":"Product added.");
  };

  if(input.files&&input.files[0]){
    const reader=new FileReader();
    reader.onload=()=>finish(reader.result);
    reader.readAsDataURL(input.files[0]);
  }else{
    finish("");
  }
}

function clearForm(){
  document.getElementById("editId").value="";
  document.getElementById("pName").value="";
  document.getElementById("pPrice").value="";
  document.getElementById("pStock").value="";
  document.getElementById("pCategory").value="";
  document.getElementById("pDesc").value="";
  document.getElementById("pImage").value="";
}

function deleteProduct(id){
  if(!confirm("ఈ product delete చేయాలా?"))return;
  saveProducts(getProducts().filter(p=>String(p.id)!==String(id)));
  renderAdminProducts();
}

function editProduct(id){
  const p=getProducts().find(x=>String(x.id)===String(id));
  if(!p)return;

  document.getElementById("editId").value=p.id;
  document.getElementById("pName").value=p.name||"";
  document.getElementById("pPrice").value=p.price||"";
  document.getElementById("pStock").value=p.stock||"";
  document.getElementById("pCategory").value=p.category||"";
  document.getElementById("pDesc").value=p.description||"";
}

function renderAdminProducts(){
  const box=document.getElementById("adminProducts");
  if(!box)return;

  const products=getProducts();

  if(!products.length){
    box.innerHTML="<p>ఇంకా products add చేయలేదు.</p>";
    return;
  }

  box.innerHTML=products.map(p=>`
    <div style="padding:12px;border-bottom:1px solid #ddd">
      <b>${p.name}</b><br>
      ₹${p.price} | Stock: ${p.stock}<br>
      <button onclick="editProduct('${p.id}')">Edit</button>
      <button onclick="deleteProduct('${p.id}')">Delete</button>
    </div>
  `).join("");
}

document.addEventListener("DOMContentLoaded",()=>{
  const panel=document.getElementById("adminPanel");
  if(panel)panel.hidden=true;
});
