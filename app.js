const WA="919392916489";
const defaultProducts=[];
let products=JSON.parse(localStorage.getItem("sujuProducts")||"null")||defaultProducts;
let cart=JSON.parse(localStorage.getItem("sujuCart")||"[]");
function save(){localStorage.setItem("sujuProducts",JSON.stringify(products));localStorage.setItem("sujuCart",JSON.stringify(cart))}
function renderProducts(){
 const q=(document.getElementById("search")?.value||"").toLowerCase();
 const el=document.getElementById("products"); if(!el)return;
 const list=products.filter(p=>(p.name+" "+(p.category||"")).toLowerCase().includes(q));
 el.innerHTML=list.map(p=>`<article class="card"><img src="${p.image||'assets/logo.jpg'}" alt=""><div class="card-body"><b>${esc(p.name)}</b><div class="price">₹${p.price}</div><div class="stock">${p.stock>0?`Stock: ${p.stock}`:"Out of stock"}</div><button class="add-btn" ${p.stock<=0?"disabled":""} onclick="addCart('${p.id}')">Add to Cart</button></div></article>`).join("");
 document.getElementById("empty").hidden=list.length>0;
}
function esc(s){return String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function addCart(id){const p=products.find(x=>x.id===id);if(!p)return;const x=cart.find(x=>x.id===id);if(x){if(x.qty<p.stock)x.qty++}else cart.push({id,qty:1});save();updateCount();openCart()}
function updateCount(){document.getElementById("cartCount").textContent=cart.reduce((a,x)=>a+x.qty,0)}
function openCart(){document.getElementById("cartModal").hidden=false;renderCart()}
function closeCart(){document.getElementById("cartModal").hidden=true}
function renderCart(){
 const el=document.getElementById("cartItems");let total=0;
 el.innerHTML=cart.map(x=>{const p=products.find(y=>y.id===x.id);if(!p)return"";total+=p.price*x.qty;return `<div class="cart-row"><img src="${p.image||'assets/logo.jpg'}"><div class="grow"><b>${esc(p.name)}</b><br>₹${p.price}</div><div class="qty"><button onclick="changeQty('${p.id}',-1)">−</button><b>${x.qty}</b><button onclick="changeQty('${p.id}',1)">+</button></div></div>`}).join("");
 document.getElementById("cartTotal").textContent=total.toFixed(0); updateCount();
}
function changeQty(id,d){const x=cart.find(x=>x.id===id),p=products.find(y=>y.id===id);if(!x)return;x.qty+=d;if(x.qty<=0)cart=cart.filter(y=>y.id!==id);if(p&&x.qty>p.stock)x.qty=p.stock;save();renderCart()}
function getLocation(){if(!navigator.geolocation){alert("ఈ ఫోన్ location support చేయడం లేదు.");return}navigator.geolocation.getCurrentPosition(pos=>{document.getElementById("custLocation").value=`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`},()=>alert("Location permission Allow చేయండి."))}
function sendOrder(){
 if(!cart.length)return alert("Cart ఖాళీగా ఉంది.");
 const name=document.getElementById("custName").value.trim(),phone=document.getElementById("custPhone").value.trim(),addr=document.getElementById("custAddress").value.trim(),loc=document.getElementById("custLocation").value,pay=document.getElementById("paymentMethod").value;
 if(!name||!phone||!addr)return alert("పేరు, ఫోన్ నంబర్, అడ్రస్ తప్పనిసరి.");
 let total=0,lines=cart.map(x=>{const p=products.find(y=>y.id===x.id);total+=p.price*x.qty;return `• ${p.name} × ${x.qty} = ₹${p.price*x.qty}`}).join("\n");
 const msg=`🛍️ *Suju Collections Order*\n\n${lines}\n\n*Total: ₹${total}*\nPayment: ${pay}\n\nCustomer: ${name}\nPhone: ${phone}\nAddress: ${addr}\nLocation: ${loc||"Not shared"}\n\nPlease confirm my order.`;
 window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`,"_blank");
}
renderProducts();updateCount();
