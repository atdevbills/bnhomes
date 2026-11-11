import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ⬇️ FILL THESE IN
const SUPABASE_URL  = 'https://jqxtkcnqjjaqmswfhnpj.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeHRrY25xamphcW1zd2ZobnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDYyNjAsImV4cCI6MjEwOTk4MjI2MH0.x1ImXmn1NujpArIkDL0A018O_-mmnsVkP-mxqQ0a_BM';

// ⬇️ CLIENT CONTACT INFO
const CONFIG = { name: "BN Homes", whatsapp: "233534424243", phone: "+233 53 442 4243", email: "" };
const AGENT  = { name: "BN Homes", role: "Property consultants, Accra", bio: "We are dedicated to helping individuals and families find their perfect homes. We make buying, selling, and renting properties simple, smooth, and stress-free. Your dream home is our priority." };

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icon = (n) => `<svg class="i${n==='wa'?' fill':''}"><use href="#i-${n}"/></svg>`;
const telHref = "tel:" + CONFIG.phone.replace(/[^+\d]/g, "");
const waLink = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t || "Hello, I would like to ask about a property.")}`;
const waText = (p) => `Hello, I’m interested in ${p.title} (${p.location}), ref ${p.ref || ''}, listed at ${p.price}${p.per ? " " + p.per : ""}. Is it still available?`;
const fmt = (d) => new Date(d).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"});
const FILTERS = [["All","All"],["For Sale","For sale"],["For Rent","For rent"],["House","Houses"],["Apartment","Apartments"],["Land","Land"],["Commercial","Commercial"]];

let properties = [];
let active = "All", opener = null, sheetOpen = false;

/* static contact links */
document.querySelectorAll("[data-wa]").forEach(a => { a.href = waLink(); a.target = "_blank"; a.rel = "noopener noreferrer"; });
document.querySelectorAll("[data-tel]").forEach(a => { a.href = telHref; });
document.querySelectorAll("[data-mail]").forEach(a => { if (CONFIG.email) { a.href = "mailto:"+CONFIG.email; a.textContent = CONFIG.email; } else a.remove(); });
$("phoneText").textContent = CONFIG.phone;
$("year").textContent = new Date().getFullYear();
$("agentName").textContent = AGENT.name;
$("agentRole").textContent = AGENT.role;
$("agentBio").textContent = AGENT.bio;

/* chips */
$("chips").innerHTML = FILTERS.map(([v,l]) => `<button class="chip" data-f="${v}" aria-pressed="${v===active}">${l}</button>`).join("");
$("chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip"); if (!b) return;
  active = b.dataset.f;
  document.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c.dataset.f===active)));
  apply();
});
$("q").addEventListener("input", apply);
$("searchForm").addEventListener("submit", (e) => { e.preventDefault(); $("q").blur(); $("properties").scrollIntoView({behavior:"smooth"}); });

function apply() {
  const q = $("q").value.trim().toLowerCase();
  render(properties.filter(p =>
    (!q || `${p.title} ${p.location} ${p.type}`.toLowerCase().includes(q)) &&
    (active === "All" || p.purpose === active || p.type === active)
  ));
}

function render(list) {
  $("found").textContent = list.length ? `${list.length} ${list.length===1?"property":"properties"}` : "";
  if (!list.length) { $("grid").innerHTML = `<div class="none">No properties match your search. Try another area, or clear a filter.</div>`; return; }
  $("grid").innerHTML = list.map(p => {
    const img = p.images?.[0] || '';
    return `
    <article class="card" data-open="${p.id}" tabindex="0" role="button" aria-label="View details: ${esc(p.title)}">
      <div class="shot">
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async">` : `<div style="display:grid;place-items:center;height:100%;color:#8a93a5;font-size:.8rem">No photo</div>`}
        <span class="tag ${p.purpose==='For Rent'?'rent':''}">${p.purpose==='For Rent'?'Rent':'Sale'}</span>
      </div>
      <div class="body">
        <div class="top">
          <div class="price">${esc(p.price)}${p.per?` <small>/ month</small>`:''}</div>
          <a class="wa-mini" href="${waLink(waText(p))}" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp about ${esc(p.title)}">${icon('wa')}</a>
        </div>
        <h3>${esc(p.title)}</h3>
        <div class="loc">${icon('pin')}${esc(p.location)}</div>
        <div class="meta">
          ${p.beds?`<span>${icon('bed')}${p.beds}</span>`:''}
          ${p.baths?`<span>${icon('bath')}${p.baths}</span>`:''}
          <span>${icon('area')}${esc(p.area || '—')}</span>
        </div>
      </div>
    </article>`;
  }).join('');
}

$("grid").addEventListener("click", (e) => {
  if (e.target.closest(".wa-mini")) return;
  const c = e.target.closest("[data-open]");
  if (c) openSheet(properties.find(p => p.id === Number(c.dataset.open)), c);
});
$("grid").addEventListener("keydown", (e) => {
  if ((e.key==='Enter'||e.key===' ') && e.target.matches("[data-open]")) {
    e.preventDefault();
    openSheet(properties.find(p => p.id === Number(e.target.dataset.open)), e.target);
  }
});

function openSheet(p, from) {
  if (!p) return;
  opener = from || null;
  $("detail").innerHTML = `
    <div class="gal">
      <div class="rail" id="rail">${(p.images||[]).map((s,i)=>`<img src="${esc(s)}" alt="${esc(p.title)}, photo ${i+1}" ${i?'loading="lazy"':''}>`).join('')}</div>
      ${(p.images||[]).length>1?`<span class="num" id="num">1 / ${p.images.length}</span>`:''}
    </div>
    <div class="d">
      <span class="stat ${p.purpose==='For Rent'?'rent':''}">${esc(p.purpose)}</span>
      <h2 id="dTitle">${esc(p.title)}</h2>
      <div class="loc">${icon('pin')}${esc(p.location)}</div>
      <div class="price">${esc(p.price)}${p.per?` <small>${esc(p.per)}</small>`:''}</div>
      <div class="refline">Ref ${esc(p.ref||'—')}. Updated ${fmt(p.updated_at || p.created_at || new Date())}.</div>
      <p class="desc">${esc(p.description||'')}</p>
      <div class="facts">
        <div><small>Type</small><b>${esc(p.type)}</b></div>
        <div><small>Size</small><b>${esc(p.area||'—')}</b></div>
        <div><small>Bedrooms</small><b>${p.beds || 'None'}</b></div>
        <div><small>Bathrooms</small><b>${p.baths || 'None'}</b></div>
      </div>
      <div class="acts">
        <a class="btn wa" href="${waLink(waText(p))}" target="_blank" rel="noopener noreferrer">${icon('wa')}WhatsApp</a>
        <a class="btn line" href="${telHref}">${icon('phone')}Call</a>
      </div>
      <div class="acts2">
        <button class="btn line block" type="button" id="shareBtn">${icon('share')}Share this property</button>
      </div>
      <form class="view" id="viewForm">
        <h3>Request a viewing</h3>
        <input name="n" required placeholder="Your name" aria-label="Your name" autocomplete="name">
        <input name="p" required type="tel" placeholder="Phone number" aria-label="Phone number" autocomplete="tel">
        <input name="t" placeholder="Best day and time (optional)" aria-label="Best day and time">
        <button class="btn wa block" type="submit">${icon('wa')}Send request on WhatsApp</button>
      </form>
    </div>`;
  const sheet = $("sheet");
  sheet.classList.add("show"); document.body.classList.add("lock");
  sheet.querySelector(".panel").scrollTop = 0;
  if (!sheetOpen) { history.pushState({sheet:1}, ""); sheetOpen = true; }
  const rail = $("rail"), num = $("num");
  if (num) rail.addEventListener("scroll", () => { num.textContent = `${Math.round(rail.scrollLeft/rail.clientWidth)+1} / ${p.images.length}`; }, {passive:true});
  $("shareBtn").addEventListener("click", () => share(p));
  $("viewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = k => e.target.elements[k].value.trim();
    const msg = `Hello ${CONFIG.name}, I would like to book a viewing.\nProperty: ${p.title} (${p.location}), ref ${p.ref||''}\nName: ${v('n')}\nPhone: ${v('p')}\nBest time: ${v('t')||'Any time'}`;
    window.open(waLink(msg), "_blank", "noopener");
    hideSheet(); toast("Opening WhatsApp. Tap send to finish your request.");
  });
  $("close").focus();
}

function share(p) {
  const text = `${p.title}, ${p.location}, ${p.price}${p.per?" "+p.per:""}`, url = location.href.split("#")[0];
  if (navigator.share) navigator.share({title:p.title, text, url}).catch(()=>{});
  else window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + url), "_blank", "noopener");
}
function hideSheet() {
  if (sheetOpen && history.state && history.state.sheet) { history.back(); return; }
  reallyHide();
}
function reallyHide() {
  sheetOpen = false; $("sheet").classList.remove("show"); document.body.classList.remove("lock");
  if (opener && document.contains(opener)) opener.focus(); opener = null;
}
window.addEventListener("popstate", () => { if ($("sheet").classList.contains("show")) reallyHide(); });
$("close").addEventListener("click", hideSheet);
$("sheet").addEventListener("click", (e) => { if (e.target === $("sheet")) hideSheet(); });
document.addEventListener("keydown", (e) => { if (e.key==="Escape" && $("sheet").classList.contains("show")) hideSheet(); });

/* mobile menu */
const setMenu = (o) => { $("drawer").classList.toggle("open", o); $("menuBtn").setAttribute("aria-expanded", String(o)); };
$("menuBtn").addEventListener("click", () => setMenu(!$("drawer").classList.contains("open")));
document.querySelectorAll("#drawer a").forEach(a => a.addEventListener("click", () => setMenu(false)));

function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"), 3200); }

/* Scroll Reveal Animation Observer */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");
      observer.unobserve(entry.target); // Stop observing once it's visible
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

/* load from Supabase */
async function load() {
  const { data, error } = await supabase
    .from("properties")
    .select("*")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("updated_at", { ascending: false });
  if (error) {
    $("grid").innerHTML = `<div class="none">Could not load properties. Please try again later.</div>`;
    console.error(error);
    return;
  }
  properties = data || [];
  apply();
}
load();