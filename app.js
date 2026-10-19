const $ = (s) => document.querySelector(s);
const state = { products: [], category: "Semua", cart: new Map() };
const fmtUSD = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "Harga API";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
};
function toast(msg) { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2600); }
function safe(s="") { return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
function listItems(payload) {
  const root = payload?.data ?? payload;
  return Array.isArray(root?.items) ? root.items : Array.isArray(root) ? root : [];
}
function renderCategories() {
  const cats = ["Semua", ...new Set(state.products.map(p=>p.category).filter(Boolean))];
  $("#categories").innerHTML = cats.map(c=>`<button class="category ${state.category===c?"active":""}" data-cat="${safe(c)}">${safe(c)}</button>`).join("");
  $("#categories").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>{state.category=b.dataset.cat;renderCategories();renderProducts();}));
}
function productImage(p) {
  if (!p.imageUrl) return "";
  try { return new URL(p.imageUrl, "https://dripclientofficial.dev").href; } catch { return ""; }
}
function renderProducts() {
  const q=$("#search").value.trim().toLowerCase();
  const items=state.products.filter(p=>(state.category==="Semua"||p.category===state.category) &&
    [p.name,p.product,p.category,p.label,p.description,p.apiCode].some(v=>String(v||"").toLowerCase().includes(q)));
  $("#productCount").textContent=state.products.length;
  $("#status").textContent=state.products.length ? `${items.length} produk ditampilkan · harga dari API provider` : "Belum ada produk yang dapat ditampilkan.";
  $("#products").innerHTML=items.map((p,i)=>{
    const available=p.inStock!==false && !p.is_maintenance && Number(p.stock??1)>0;
    const img=productImage(p);
    const price=fmtUSD(p.priceUsd ?? (Number(p.price)/100000000));
    return `<article class="product-card">
      <div class="product-visual">${img?`<img src="${safe(img)}" alt="${safe(p.product||p.name)}" loading="lazy" onerror="this.remove()">`:""}<span class="product-placeholder">${safe((p.product||p.name||"IK").split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase())}</span><span class="pill">${safe(p.category||"DIGITAL")}</span><span class="stock-pill ${available?"":"out"}">${available?"● Tersedia":"● Habis / maintenance"}</span></div>
      <div class="product-info"><div class="product-meta">${safe(p.label||p.version||"DIGITAL SKU")}</div><h3>${safe(p.name||p.product||"Produk digital")}</h3><p>${safe(p.description||"Produk digital dari katalog provider.")}</p><div class="product-bottom"><div class="price">${price}<small> / item</small></div><button class="buy-button add" data-index="${state.products.indexOf(p)}" ${available?"":"disabled"}>${available?"Tambah +":"Tidak tersedia"}</button></div></div>
    </article>`;
  }).join("");
  $("#products").querySelectorAll(".add").forEach(b=>b.addEventListener("click",()=>addToCart(state.products[Number(b.dataset.index)])));
  if(!items.length) $("#products").innerHTML='<div class="empty" style="grid-column:1/-1">Tidak ada produk cocok. Coba kata kunci atau kategori lain.</div>';
}
function addToCart(p) {
  if(!p?.apiCode) return toast("SKU produk tidak tersedia.");
  const current=state.cart.get(p.apiCode);
  if(current) current.quantity=Math.min(50,current.quantity+1);
  else state.cart.set(p.apiCode,{product:p,quantity:1});
  renderCart();toast("Produk ditambahkan ke keranjang.");
}
function renderCart() {
  const rows=[...state.cart.values()];
  $("#cartCount").textContent=rows.reduce((n,r)=>n+r.quantity,0);
  $("#cartItems").innerHTML=rows.length?rows.map(({product:p,quantity})=>`<div class="cart-row"><div class="cart-title"><b>${safe(p.name||p.product)}</b><small>${fmtUSD(p.priceUsd??Number(p.price)/100000000)} × ${quantity}</small><small>SKU: ${safe(p.apiCode)}</small></div><button class="remove" data-remove="${safe(p.apiCode)}">Hapus</button></div>`).join(""):'<div class="empty" style="margin-top:18px">Keranjang masih kosong.</div>';
  $("#cartItems").querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{state.cart.delete(b.dataset.remove);renderCart();}));
}
function openCart(){$("#cartPanel").classList.remove("hidden");$("#overlay").classList.remove("hidden");}
function closeCart(){$("#cartPanel").classList.add("hidden");$("#overlay").classList.add("hidden");}
async function loadProducts() {
  $("#status").textContent="Mengambil produk terbaru dari API…";$("#refresh").disabled=true;
  try {
    const r=await fetch("/api/products");const payload=await r.json();
    if(!r.ok) throw new Error(payload?.error?.message||"API katalog gagal.");
    state.products=listItems(payload);
    renderCategories();renderProducts();
    if(!state.products.length) $("#status").textContent="API merespons tetapi belum mengirim daftar produk.";
  } catch(e) { $("#status").textContent=e.message;$("#products").innerHTML='<div class="empty" style="grid-column:1/-1">Katalog belum dapat dimuat. Pastikan koneksi internet dan API provider aktif, lalu tekan Refresh.</div>'; }
  finally { $("#refresh").disabled=false; }
}
async function checkout() {
  const rows=[...state.cart.values()];
  if(!rows.length)return toast("Keranjang masih kosong.");
  if(rows.length>1)return toast("Checkout satu SKU setiap kali; pilih satu produk dahulu.");
  const {product,quantity}=rows[0];
  if(!confirm(`Beli ${quantity} × ${product.name||product.product}?\n\nProvider akan memotong wallet API kamu. Pastikan saldo cukup.`))return;
  const btn=$("#checkout");btn.disabled=true;btn.textContent="Memproses…";
  try{
    const r=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sku:product.apiCode,quantity})});
    const payload=await r.json();
    if(!r.ok)throw new Error(payload?.error?.message||"Pembelian gagal.");
    const order=payload?.data??payload;
    const keys=Array.isArray(order.keys)?order.keys:[];
    $("#cartItems").innerHTML=`<div class="order-result"><b>Pesanan berhasil dibuat</b><br>ID: ${safe(order.id||"-")}<br>Status: ${safe(order.status||"DIPROSES")}<br>Total provider: ${safe(order.totalUsd?fmtUSD(order.totalUsd):fmtUSD(Number(order.total)/100000000))}<br><br>${keys.length?`<b>Kode produk:</b><br>${keys.map(k=>`<div class="key-code">${safe(k)}</div>`).join("")}`:"Kode belum disertakan. Simpan ID pesanan untuk pemeriksaan."}</div>`;
    state.cart.clear();renderCart();toast("Pesanan berhasil diproses."); 
  }catch(e){toast(e.message);alert(e.message);}
  finally{btn.disabled=false;btn.innerHTML='Beli sekarang <span>↗</span>';}
}
$("#search").addEventListener("input",renderProducts);$("#refresh").addEventListener("click",loadProducts);
$("#cartOpen").addEventListener("click",openCart);$("#cartClose").addEventListener("click",closeCart);$("#overlay").addEventListener("click",closeCart);
$("#checkout").addEventListener("click",checkout);$("#year").textContent=new Date().getFullYear();
renderCart();loadProducts();
