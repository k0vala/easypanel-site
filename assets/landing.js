/* EasyPanel — Interactive Landing Script (easypanel.tr) */
(function(){
  "use strict";

  const $ = id => document.getElementById(id);
  const root = document.documentElement;

  /* ── Theme Toggle ── */
  const savedTheme = (() => { try { return localStorage.getItem("ep_site_theme"); } catch(e){ return null; } })();
  function applyTheme(mode, silent){
    const resolved = mode || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light");
    root.setAttribute("data-theme", resolved);
    const btn = $("themeBtn");
    if (btn) {
      btn.setAttribute("aria-label", resolved === "dark" ? "Açık temaya geç" : "Koyu temaya geç");
      btn.title = resolved === "dark" ? "Açık tema" : "Koyu tema";
      btn.innerHTML = resolved === "dark"
        ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>'
        : '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
    if (!silent) toast(resolved === "dark" ? "Koyu tema etkinleştirildi" : "Açık tema etkinleştirildi");
  }
  applyTheme(savedTheme, true);
  if ($("themeBtn")) {
    $("themeBtn").onclick = () => {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      try { localStorage.setItem("ep_site_theme", next); } catch(e){}
      applyTheme(next, false);
    };
  }

  /* ── Toast ── */
  let toastTimer = null;
  function toast(msg){
    const el = $("toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
  }

  /* ── Scroll Progress + Sticky Nav + Floating Bottom Bar ── */
  let floatDismissed = false;
  const scrollBar = $("scrollBar");
  const nav = $("siteNav");
  const floatBar = $("floatBar");
  function onScroll(){
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollBar) scrollBar.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + "%";
    if (nav) nav.classList.toggle("scrolled", y > 16);
    if (floatBar && !floatDismissed) floatBar.classList.toggle("show", y > 520 && y < h - 180);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ($("closeTopbar")) $("closeTopbar").onclick = () => { const tb = $("topbar"); if (tb) tb.classList.add("hidden"); };
  if ($("closeFloat")) $("closeFloat").onclick = () => { floatDismissed = true; if (floatBar) floatBar.classList.remove("show"); };

  /* ── Mobile Drawer ── */
  const drawer = $("mobileDrawer");
  function setDrawer(open){
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  if ($("openDrawer")) $("openDrawer").onclick = () => setDrawer(true);
  if ($("closeDrawer")) $("closeDrawer").onclick = () => setDrawer(false);
  if (drawer) {
    drawer.addEventListener("click", e => { if (e.target === drawer) setDrawer(false); });
    drawer.querySelectorAll("a, button.m-link").forEach(x => x.addEventListener("click", () => setDrawer(false)));
  }

  /* ── Modal Helpers ── */
  let activeModal = null;
  function openModal(id){
    const m = $(id);
    if (!m) return;
    if (activeModal && activeModal !== m) activeModal.classList.remove("open");
    m.classList.add("open");
    activeModal = m;
    document.body.style.overflow = "hidden";
  }
  function closeModal(){
    if (!activeModal) return;
    activeModal.classList.remove("open");
    activeModal = null;
    document.body.style.overflow = "";
  }
  document.querySelectorAll(".modal-backdrop").forEach(m => {
    m.addEventListener("click", e => { if (e.target === m) closeModal(); });
    m.querySelectorAll("[data-close]").forEach(btn => btn.addEventListener("click", closeModal));
  });
  document.querySelectorAll("[data-open-modal]").forEach(btn => {
    btn.addEventListener("click", () => openModal(btn.dataset.openModal));
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); setDrawer(false); }
    if (activeModal && activeModal.id === "modalLightbox") {
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    }
  });

  /* ── Screenshot Catalog (14 screens) ── */
  const SHOTS = [
    { key:"genel-bakis", label:"Genel Bakış", img:"assets/genel-bakis.webp", w:1100, h:712, desc:"Çevrimiçi kullanıcılar, kanallar, roller, kayıtlı kişi sayısı, canlı ping / paket kaybı / bant genişliği ve son olaylar tek ekranda." },
    { key:"roller", label:"Roller", img:"assets/roller.webp", w:1100, h:712, desc:"Yetkinin yettiği roller otomatik listelenir. Tek tek veya toplu rol ver/al, rol baloncuğundan tek tıkla rol geri al." },
    { key:"rol-filtresi", label:"Rol Filtresi", img:"assets/rol-filtresi.webp", w:1100, h:712, desc:"Birden fazla rol seçip VE / VEYA mantığıyla kullanıcıları anında filtrele ve seçilenlere toplu işlem uygula." },
    { key:"kullanicilar", label:"Kullanıcılar", img:"assets/kullanicilar.webp", w:1100, h:615, desc:"Çevrimiçi kullanıcılar, Client ID, DB ID, IP ve Unique ID tek tabloda; taşı, dürt, mesaj at, at veya banla." },
    { key:"kanal-duzenleyici", label:"Kanal Düzenleyici", img:"assets/kanal-duzenleyici.webp", w:1100, h:712, desc:"Kanal ağacı, sürükle-taşı, simge atama, şifre/kodek/Talk Power ayarları ve toplu kanal oluşturma." },
    { key:"toplu-kanal-adi", label:"Toplu Kanal Adı", img:"assets/toplu-kanal-adi.webp", w:996, h:659, desc:"Tüm kanal adlarını kalın/italik/özel yazı stiliyle tek seferde biçimlendir; istediğin an tek tıkla eski hâline al." },
    { key:"izinler", label:"İzinler (265+)", img:"assets/izinler.webp", w:1100, h:631, desc:"TeamSpeak izin penceresinin tamamı Türkçe açıklamalarıyla. İzin bulucu, rol karşılaştırma ve sunucular arası kopyalama dahil." },
    { key:"kisi-izinleri", label:"Kişi İzinleri", img:"assets/kisi-izinleri.webp", w:1100, h:712, desc:"Kişiye özel izinler, kanal izinleri ve kanal grupları aynı tutarlı arayüzde yönetilir." },
    { key:"guc-onizleme", label:"Güç Önizleme", img:"assets/guc-onizleme.webp", w:996, h:719, desc:"Bir rolün veya kişinin gücünü değiştirmeden önce o güçle hangi rolleri verip alabileceğini canlı gör." },
    { key:"rol-kayitlari", label:"Rol Kayıtları", img:"assets/rol-kayitlari.webp", w:1100, h:615, desc:"Hangi rolü kimin kime verdiğinin ve geri aldığının kalıcı zaman damgalı arşivi." },
    { key:"kickler", label:"Kick Kayıtları", img:"assets/kickler.webp", w:1100, h:712, desc:"Sunucudan ve kanaldan atılanlar (kim, kimi, neden, ne zaman) otomatik kaydedilir." },
    { key:"mikrofon-kayitlari", label:"Mikrofon Kayıtları", img:"assets/mikrofon-kayitlari.webp", w:1100, h:712, desc:"Mikrofonunu devre dışı bırakanların anlık listesi ve geçmiş süre takibi." },
    { key:"kanal-sohbeti", label:"Kanal Sohbeti", img:"assets/kanal-sohbeti.webp", w:1100, h:615, desc:"BBCode biçimlendirme araç çubuğu ve gelen mesajları tek tıkla 8 dile çevirme." },
    { key:"sohbet", label:"Sunucu Sohbeti", img:"assets/sohbet.webp", w:1100, h:712, desc:"Sunucu geneli sohbet, toplu dürtme ve güvenli modda toplu özel mesaj gönderimi." }
  ];

  /* ── Hero Preview Switcher ── */
  const heroImg = $("heroShotImg");
  const heroTitle = $("heroFrameTitle");
  let heroShotKey = "genel-bakis";
  document.querySelectorAll(".hero-switcher button").forEach(btn => {
    btn.onclick = () => {
      const s = SHOTS.find(x => x.key === btn.dataset.shot);
      if (!s || !heroImg) return;
      heroShotKey = s.key;
      document.querySelectorAll(".hero-switcher button").forEach(b => b.classList.toggle("on", b === btn));
      heroImg.src = s.img;
      heroImg.width = s.w;
      heroImg.height = s.h;
      heroImg.alt = "EasyPanel — " + s.label;
      if (heroTitle) heroTitle.textContent = "EasyPanel — " + s.label;
    };
  });
  if ($("heroStage")) {
    $("heroStage").onclick = () => openLightbox(SHOTS.findIndex(x => x.key === heroShotKey));
  }

  /* ── Gallery Showcase + Lightbox ── */
  let galIdx = 0;
  let lbIdx = 0;
  const galTabs = $("galleryTabs");
  const galImg = $("galleryImg");
  const galTitle = $("galleryTitle");
  const galDesc = $("galleryDesc");
  const galCount = $("galleryCount");

  function renderGallery(i){
    galIdx = (i + SHOTS.length) % SHOTS.length;
    const s = SHOTS[galIdx];
    if (galImg) { galImg.src = s.img; galImg.width = s.w; galImg.height = s.h; galImg.alt = "EasyPanel ekran görüntüsü — " + s.label; }
    if (galTitle) galTitle.textContent = s.label;
    if (galDesc) galDesc.textContent = s.desc;
    if (galCount) galCount.textContent = (galIdx + 1) + " / " + SHOTS.length;
    if (galTabs) {
      galTabs.querySelectorAll("button").forEach((b, idx) => b.classList.toggle("on", idx === galIdx));
    }
  }
  if (galTabs) {
    SHOTS.forEach((s, idx) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = s.label;
      b.onclick = () => renderGallery(idx);
      galTabs.appendChild(b);
    });
    renderGallery(0);
  }
  if ($("galPrev")) $("galPrev").onclick = () => renderGallery(galIdx - 1);
  if ($("galNext")) $("galNext").onclick = () => renderGallery(galIdx + 1);
  if ($("galZoom")) $("galZoom").onclick = () => openLightbox(galIdx);
  if ($("galImgWrap")) $("galImgWrap").onclick = () => openLightbox(galIdx);

  function openLightbox(i){
    lbIdx = (i < 0 ? 0 : i) % SHOTS.length;
    updateLightbox();
    openModal("modalLightbox");
  }
  function stepLightbox(d){
    lbIdx = (lbIdx + d + SHOTS.length) % SHOTS.length;
    updateLightbox();
  }
  function updateLightbox(){
    const s = SHOTS[lbIdx];
    if ($("lbTitle")) $("lbTitle").textContent = s.label;
    if ($("lbImg")) { $("lbImg").src = s.img; $("lbImg").alt = "EasyPanel — " + s.label; }
    if ($("lbDesc")) $("lbDesc").textContent = s.desc;
    if ($("lbCount")) $("lbCount").textContent = (lbIdx + 1) + " / " + SHOTS.length;
  }
  if ($("lbPrev")) $("lbPrev").onclick = () => stepLightbox(-1);
  if ($("lbNext")) $("lbNext").onclick = () => stepLightbox(1);

  /* ── Feature Catalog & Detail Pop-up ── */
  const FEATURES = {
    roller: {
      cat:"Yönetim",
      title:"Roller ve VE / VEYA Filtreleme",
      summary:"Sunucudaki rollerini tek tek ya da toplu olarak verip geri al; yetkinin yettiği roller otomatik ayrılır.",
      bullets:[
        "Tek tıkla rol verme, rol baloncuğu üzerinden doğrudan rol kaldırma",
        "Çoklu rol seçimiyle VE / VEYA filtreleme — örn. hem Klan Üyesi hem VIP olanları anında bul",
        "Yetkine göre otomatik süzme: sadece gücünün yettiği roller işlem listesinde açılır",
        "Toplu işlemlerde başlamadan önce kişi ve rol özetiyle onay ekranı"
      ],
      tip:"Çoklu rol filtresiyle onlarca kişi arasından hedef grubu saniyeler içinde seçip tek komutla taşıyabilir veya rol güncelleyebilirsin.",
      shot:"roller"
    },
    kullanicilar: {
      cat:"Yönetim",
      title:"Çevrimiçi Kullanıcılar ve Anlık Moderasyon",
      summary:"O an sunucuda bulunan tüm kullanıcıları tek tabloda izle ve anlık moderasyon komutlarını uygula.",
      bullets:[
        "Client ID, DB ID, IP adresi, Unique ID ve mevcut kanal bilgisi aynı ekranda",
        "Taşıma, dürtme, özel mesaj, kanaldan veya sunucudan atma, banlama ve Talk Power verme",
        "Herkesi tek komutla seçili kanala çekme",
        "Mikrofonunu devre dışı bırakanları anlık alt listeden takip etme"
      ],
      tip:"Kullanıcı tablosunda arama yapıp birden fazla kişiyi seçerek toplu taşıma, dürtme veya özel mesaj gönderebilirsin.",
      shot:"kullanicilar"
    },
    veritabani: {
      cat:"Veritabanı & Güvenlik",
      title:"Client Veritabanı ve Silinmeyen Eski İsim Geçmişi",
      summary:"Sunucuya bugüne kadar girmiş tüm kayıtlı hesapları çevrimdışı olsalar bile incele, ara ve arşivle.",
      bullets:[
        "Çevrimdışı hesaplar dahil tüm kayıtlı kullanıcılar (DB ID, UID, son IP, giriş sayısı, son görülme)",
        "Asla silinmeyen kalıcı eski isim geçmişi — kişi nick değiştirse bile eski tüm isimleri arşivde kalır",
        "Banlı hesapları tabloda renkli olarak ayırma",
        "Tek tıkla CSV dışa aktarma ve tam metin arama (eski isimler dahil)"
      ],
      tip:"İsim değiştirip geri gelen birini aramak için eski nick'ini arama kutusuna yazman yeterli; kalıcı arşivden anında bulunur.",
      shot:"kullanicilar"
    },
    yanhesap: {
      cat:"Veritabanı & Güvenlik",
      title:"Aynı IP Yan Hesap Tespiti ve İnceleme Penceresi",
      summary:"Aynı IP adresinden bağlanmış birden fazla TeamSpeak hesabını otomatik işaretle ve tek tıkla detaylarını gör.",
      bullets:[
        "Ortak IP paylaşan hesaplarda otomatik 'Aynı IP ×N' uyarısı",
        "Hücrenin üzerine gelince diğer hesapların adlarını ve Unique ID'lerini gösteren anlık özet",
        "Çift tıklayınca açılan detay penceresi: tüm ortak IP hesaplarının adı, durumu, eski isimleri, UID, DB ID ve son görülme tarihi",
        "Detay penceresinden tek tıkla tüm bilgileri kopyalama, doğrudan banlama veya o IP'ye göre filtreleme"
      ],
      tip:"Ban yiyip yeni kimlikle (Unique ID) sunucuya dönen kişileri yakalamak için Veritabanı bölümünde 'Aynı IP' uyarısına çift tıklaman yeterlidir.",
      shot:"kullanicilar"
    },
    kanallar: {
      cat:"Yönetim",
      title:"Kanal Ağacı, Toplu Oluşturma ve Ad Biçimi",
      summary:"Kanal düzeni oluşturmayı ve büyük sunucuları yeniden yapılandırmayı dakikalardan saniyelere indir.",
      bullets:[
        "Tam kanal düzenleyici: ad, konu, açıklama, şifre, kodek, kalite, Talk Power ve kalıcılık ayarları",
        "Toplu kanal oluşturma: tek şablondan numaralı odalar veya çok satırlı liste ile onlarca odayı tek seferde aç",
        "Toplu ad biçimi: tüm kanal adlarına kalın/italik/özel yazı stili uygula ve istediğin an geri al",
        "Tek tek veya toplu kanal simgesi atama ve sürükle-taşı desteği"
      ],
      tip:"Turnuva veya etkinlik öncesi 20 adet takım odasını Toplu Kanal Oluştur ile 5 saniyede açabilirsin.",
      shot:"kanal-duzenleyici"
    },
    izinler: {
      cat:"İzinler",
      title:"265+ Türkçe Açıklamalı İzin ve Güç Önizleme",
      summary:"Karmaşık İngilizce izin isimleriyle uğraşmadan tüm TeamSpeak yetkilerini anlayarak yönet.",
      bullets:[
        "Sunucu grupları, kişi izinleri, kanal izinleri ve kanal gruplarının tamamı tek çatı altında",
        "265'ten fazla TeamSpeak izni ne işe yaradığıyla birlikte sade Türkçe açıklamalı",
        "Güç Önizleme: seçtiğin güç değeriyle hangi rolleri verip alabileceğini veya hangi kanallara müdahale edebileceğini anlık gör",
        "Tek tıkla İngilizce / Türkçe dil geçişi"
      ],
      tip:"Yetki verirken yanlışlıkla admin rolü dağıtma riskini önlemek için Güç Önizleme penceresinden sınırını önceden kontrol et.",
      shot:"izinler"
    },
    izinaraclari: {
      cat:"İzinler",
      title:"İzin Bulucu, Rol Karşılaştırma ve Sunucular Arası Kopyalama",
      summary:"YaTQA kullanıcılarının en çok aradığı ileri seviye izin araçları modern ve anlaşılır arayüzde.",
      bullets:[
        "İzin Bulucu: seçtiğin bir iznin hangi sunucu gruplarında, kanallarda veya kişilerde tanımlı olduğunu tek taramada listele",
        "Rol Karşılaştırma: iki sunucu grubunu yan yana koyup sadece farkları renkli olarak incele",
        "Sunucular Arası Kopyalama: bir sunucudaki rolü tüm izinleriyle açık başka bir sunucuya birebir aktar",
        "Hızlı izin arama ve sıfırlama"
      ],
      tip:"Yeni bir TS3 sunucusu açtığında eski sunucundaki tüm yetkili rollerini tek tek uğraşmadan doğrudan kopyalayabilirsin.",
      shot:"guc-onizleme"
    },
    kayitlar: {
      cat:"Kayıtlar & Sohbet",
      title:"Kalıcı Moderasyon Kayıtları",
      summary:"Sunucuda kim ne zaman hangi yetkiyi verdi, kimi attı, mikrofonunu ne kadar kapattı — hepsi kalıcı kayıt altında.",
      bullets:[
        "Rol kayıtları: hangi rolü kimin kime verip aldığının zaman damgalı geçmişi",
        "Kick kayıtları: sunucudan ve kanaldan atılmalar (atan, atılan, sebep, saat)",
        "Mikrofon kayıtları: mikrofonunu devre dışı bırakanların zaman ve süre geçmişi",
        "Canlı günlük ve yerel dosyaya otomatik arşivleme"
      ],
      tip:"Yetkili ekibinin yaptığı tüm rol değişiklikleri yerel dosyada saklandığı için geriye dönük denetim yapmak çok kolaydır.",
      shot:"rol-kayitlari"
    },
    sohbet: {
      cat:"Kayıtlar & Sohbet",
      title:"Sohbet, BBCode Araç Çubuğu ve 8 Dil Çeviri",
      summary:"Yabancı oyuncularla veya büyük topluluklarla doğrudan panel içinden iletişim kur.",
      bullets:[
        "Sunucu ve kanal sohbetini aynı yerden takip etme ve yazma",
        "BBCode biçimlendirme araç çubuğu (kalın, italik, renk, bağlantı)",
        "Gelen sohbet mesajlarını tek tıkla 8 farklı dile çevirme",
        "Hızlı veya flood korumalı güvenli modda toplu dürtme ve toplu özel mesaj"
      ],
      tip:"Çok uluslu oyun klanlarında gelen mesajın yanındaki çeviri düğmesiyle farklı dillerdeki oyuncuları anında anlayabilirsin.",
      shot:"kanal-sohbeti"
    },
    ssh: {
      cat:"Sunucu Araçları",
      title:"SSH Tüneli ve Çoklu Sunucu Sekmeleri",
      summary:"ServerQuery portunu dışarı açmadan şifreli SSH üzerinden bağlan, birden fazla sunucuyu sekmelerde yönet.",
      bullets:[
        "Yerleşik SSH tüneli (Windows ssh -L desteği) — parola veya özel anahtar dosyası (.pem/.ppk) ile güvenli bağlantı",
        "ClientQuery (açık TeamSpeak istemcisi) ve ServerQuery desteği aynı programda",
        "Aynı pencerede birden fazla sunucuya paralel sekmelerle bağlanma",
        "Kayıtlı sunucu profilleri (şifreler yalnızca kendi bilgisayarında Windows şifrelemesiyle saklanır)"
      ],
      tip:"Sunucular arası rol kopyalamak için iki sunucuyu ayrı sekmelerde açman yeterlidir.",
      shot:"genel-bakis"
    },
    sunucu: {
      cat:"Sunucu Araçları",
      title:"Sanal Sunucular, Medya Galerisi ve Ham Konsol",
      summary:"Tek bir TS3 örneğindeki tüm sanal sunucuları, sunucu simgelerini ve ham ServerQuery komutlarını yönet.",
      bullets:[
        "Sanal Sunucular (Instance): tüm virtual server'ları listele, başlat/durdur, yeni oluştur, tek tıkla yeni sekmede aç",
        "Genel Duyuru (gm): aynı sunucudaki tüm sanal sunuculara tek mesaj gönder",
        "Medya Galerisi: sunucuya yüklenmiş tüm simge ve avatarları görüntüle, sahiplerini gör, indir, yeni simge yükle veya sil",
        "Ham ServerQuery Konsolu: komut geçmişi (↑/↓) ve hızlı komutlarla doğrudan ham sorgu çalıştır"
      ],
      tip:"Sunucu simgelerini düzenlerken Medya Galerisi sayesinde hangi simgenin kime ait olduğunu anında görebilirsin.",
      shot:"genel-bakis"
    },
    canli: {
      cat:"Sunucu Araçları",
      title:"Canlı İstatistik Şeridi ve Uygulama İçi Destek",
      summary:"Sunucu sağlığını anlık izle, ihtiyacın olduğunda programdan çıkmadan doğrudan destek talebi aç.",
      bullets:[
        "Genel Bakış üzerinde gerçek zamanlı ping, paket kaybı, gelen/giden bant genişliği ve çalışma süresi şeridi",
        "Flood önleyici akıllı komut birleştirme — 'Packet resend failed' hatasıyla sunucudan düşmezsin",
        "Uygulama içinden doğrudan destek talebi (ticket) açma ve cevapları takip etme",
        "Yeni sürümler çıktığında uygulama içinden tek tıkla otomatik güncelleme"
      ],
      tip:"Sunucuda lag şikayeti geldiğinde Genel Bakış'taki canlı istatistik şeridinden paket kaybını saniyeler içinde doğrulayabilirsin.",
      shot:"genel-bakis"
    }
  };

  /* Feature Filtering + Search */
  let activeCat = "all";
  const featCards = Array.from(document.querySelectorAll(".feat-card"));
  const featSearch = $("featSearch");
  const featEmpty = $("featEmpty");

  function filterFeatures(){
    const q = (featSearch ? featSearch.value : "").trim().toLowerCase();
    let shown = 0;
    featCards.forEach(card => {
      const catOk = activeCat === "all" || card.dataset.cat === activeCat;
      const text = (card.textContent + " " + (card.dataset.tags || "")).toLowerCase();
      const qOk = !q || text.includes(q);
      const vis = catOk && qOk;
      card.classList.toggle("hidden", !vis);
      if (vis) shown++;
    });
    if (featEmpty) featEmpty.classList.toggle("hidden", shown > 0);
  }
  document.querySelectorAll(".filter-pills button").forEach(btn => {
    btn.onclick = () => {
      activeCat = btn.dataset.filter;
      document.querySelectorAll(".filter-pills button").forEach(b => b.classList.toggle("on", b === btn));
      filterFeatures();
    };
  });
  if (featSearch) featSearch.addEventListener("input", filterFeatures);

  /* Open Feature Modal */
  featCards.forEach(card => {
    card.onclick = () => {
      const f = FEATURES[card.dataset.feat];
      if (!f) return;
      $("mfCat").textContent = f.cat;
      $("mfTitle").textContent = f.title;
      $("mfSummary").textContent = f.summary;
      const ul = $("mfBullets");
      ul.innerHTML = "";
      f.bullets.forEach(b => { const li = document.createElement("li"); li.textContent = b; ul.appendChild(li); });
      $("mfTip").innerHTML = "<b>İpucu:</b> " + f.tip;
      const shotObj = SHOTS.find(s => s.key === f.shot);
      const shotWrap = $("mfShotWrap");
      if (shotObj && shotWrap) {
        shotWrap.classList.remove("hidden");
        $("mfShot").src = shotObj.img;
        $("mfShot").alt = "EasyPanel — " + shotObj.label;
        shotWrap.onclick = () => openLightbox(SHOTS.indexOf(shotObj));
      } else if (shotWrap) {
        shotWrap.classList.add("hidden");
      }
      openModal("modalFeature");
    };
  });

  /* ── Scroll Reveal & Animated Bars ── */
  if ("IntersectionObserver" in window) {
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target.querySelectorAll("[data-fill]").forEach(bar => {
          bar.style.width = bar.dataset.fill + "%";
        });
        revObs.unobserve(e.target);
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal, .metrics, .cap-panel").forEach(el => revObs.observe(el));

    /* Active nav highlight */
    const navLinks = Array.from(document.querySelectorAll(".nav-links a[href^='#']"));
    const secObs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const id = "#" + e.target.id;
        navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === id));
      });
    }, { rootMargin: "-35% 0px -55% 0px" });
    navLinks.forEach(a => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) secObs.observe(target);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("in"));
    document.querySelectorAll("[data-fill]").forEach(bar => { bar.style.width = bar.dataset.fill + "%"; });
  }
})();
