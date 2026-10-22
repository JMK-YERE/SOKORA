import { useEffect, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const categories = ['Zote', 'Elektroniki', 'Mitindo', 'Nyumba', 'Magari', 'Huduma', 'Vyumba vya kupanga', 'Biashara'];
const seedVideos = [
  { id: 'demo-phone', seller: '@jiji_gadgets_tz', product: 'Simu janja ya kisasa', price: 450000, location: 'Dar es Salaam', category: 'Elektroniki', caption: 'Simu za kisasa kwa bei rafiki 🇹🇿 Uliza kuhusu stock na delivery.', emoji: '📱', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', likes: 1200, demo: true },
  { id: 'demo-shoes', seller: '@mariam_fashion', product: 'Viatu vya mtindo', price: 65000, location: 'Arusha', category: 'Mitindo', caption: 'Mitindo mipya imefika. Uliza kuhusu rangi na size zinazopatikana.', emoji: '👟', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', likes: 846, demo: true },
  { id: 'demo-sofa', seller: '@mama_neema_home', product: 'Kiti cha sebuleni', price: 220000, location: 'Mwanza', category: 'Nyumba', caption: 'Boresha nyumba yako kwa samani zilizotengenezwa kwa umakini.', emoji: '🪑', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80', likes: 532, demo: true },
  { id: 'demo-laptop', seller: '@jmk_tech', product: 'Laptop kwa kazi na masomo', price: 780000, location: 'Dodoma', category: 'Elektroniki', caption: 'Laptop kwa kazi, biashara na masomo. Wasiliana kwa maelezo.', emoji: '💻', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', likes: 319, demo: true },
];

const money = (value) => 'TSh ' + Number(value || 0).toLocaleString('en-TZ');

export default function App() {
  const [videos, setVideos] = useState(seedVideos);
  const [mode, setMode] = useState('demo');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Zote');
  const [sortBy, setSortBy] = useState('recommended');
  const [liked, setLiked] = useState({});
  const [saved, setSaved] = useState({});
  const [following, setFollowing] = useState({});
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState({});
  const [commentText, setCommentText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadLocation, setUploadLocation] = useState('Dodoma');
  const [mobileTab, setMobileTab] = useState('Nyumbani');
  const [authMode, setAuthMode] = useState('login');
  const [authIdentity, setAuthIdentity] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    const token = window.localStorage.getItem('sokora_token');
    if (!token) return;
    fetch((API || '') + '/api/auth/me', { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Session expired')))
      .then((data) => setAuthUser(data.user || null))
      .catch(() => window.localStorage.removeItem('sokora_token'));
  }, []);

  useEffect(() => {
    let alive = true;
    const loadJson = async (path) => {
      const response = await fetch((API || '') + path, { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(path + ' unavailable');
      return response.json();
    };
    Promise.all([
      loadJson('/api/feed?limit=30').catch(() => ({ items: [] })),
      loadJson('/api/products?limit=30').catch(() => ({ items: [] })),
    ]).then(([feedData, productData]) => {
      if (!alive) return;
      const feedRows = Array.isArray(feedData) ? feedData : (Array.isArray(feedData.items) ? feedData.items : []);
      const productRows = Array.isArray(productData) ? productData : (Array.isArray(productData.items) ? productData.items : []);
      const normalizeProduct = (row, i, isVideo) => ({
        id: String(isVideo ? (row.video_id ?? row.id ?? 'video-' + i) : (row.id ?? row.product_id ?? 'product-' + i)),
        seller: row.seller_username ? '@' + String(row.seller_username).replace(/^@/, '') : (row.seller_name || '@sokora_seller'),
        product: row.product_name || row.name || 'Bidhaa ya SOKORA',
        price: Number(row.price_tzs || 0),
        location: row.location || 'Tanzania',
        category: row.category || 'Biashara',
        caption: row.caption || row.description || '',
        emoji: '🛍️',
        image: row.thumbnail_url || row.product_image_url || row.image_url || '',
        video: row.video_url || '',
        likes: Number(row.likes_count || 0),
        demo: false,
      });
      const normalizedVideos = feedRows.map((row, i) => normalizeProduct(row, i, true));
      const normalizedProducts = productRows.map((row, i) => normalizeProduct(row, i, false));
      const normalized = normalizedVideos.length ? normalizedVideos : normalizedProducts;
      if (normalized.length) {
        setVideos(normalized);
        setMode(normalizedVideos.length ? 'video-api' : 'api');
      } else {
        setVideos(seedVideos);
        setMode('demo');
      }
    }).catch(() => {
      if (alive) { setVideos(seedVideos); setMode('demo'); }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const results = videos.filter((v) => {
      const matchesCategory = category === 'Zote' || v.category.toLocaleLowerCase('sw').includes(category.toLocaleLowerCase('sw'));
      const haystack = [v.product, v.seller, v.location, v.caption, v.category].join(' ').toLocaleLowerCase('sw');
      return matchesCategory && haystack.includes(query.trim().toLocaleLowerCase('sw'));
    });
    if (sortBy === 'price-low') return [...results].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === 'price-high') return [...results].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return results;
  }, [videos, category, query, sortBy]);

  const closeModal = () => { setModal(''); setSelected(null); setCommentText(''); setAuthPassword(''); };
  const notify = (message) => setToast(message);
  const askDemo = (feature) => { setModal(feature); };
  async function submitAuth(event) {
    event?.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    try {
      const registering = authMode === 'register';
      const payload = registering
        ? { email: authEmail.trim(), phone: authPhone.trim(), username: authUsername.trim(), displayName: authDisplayName.trim(), password: authPassword }
        : { identity: authIdentity.trim(), password: authPassword };
      const response = await fetch((API || '') + (registering ? '/api/auth/register' : '/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages = {
          AUTH_NOT_CONFIGURED: 'Mfumo wa akaunti bado haujawezeshwa kwenye Cloudflare.',
          DATABASE_NOT_CONFIGURED: 'Database haijaunganishwa bado.',
          INVALID_REGISTRATION: data.message || 'Angalia taarifa za usajili; password iwe na herufi angalau 10.',
          ACCOUNT_ALREADY_EXISTS: 'Username, email au simu hiyo tayari imesajiliwa.',
          INVALID_CREDENTIALS: 'Taarifa za kuingia si sahihi au akaunti haijawashwa.',
          INVALID_SESSION: 'Session imeisha. Ingia tena.',
        };
        throw new Error(messages[data.error] || 'Imeshindikana. Jaribu tena baada ya muda.');
      }
      window.localStorage.setItem('sokora_token', data.token);
      setAuthUser(data.user);
      closeModal();
      setAuthIdentity('');
      setAuthPassword('');
      setAuthUsername('');
      setAuthDisplayName('');
      setAuthEmail('');
      setAuthPhone('');
      notify(registering ? 'Akaunti ya SOKORA imefunguliwa.' : 'Umeingia SOKORA kikamilifu.');
    } catch (error) {
      notify(error.message || 'Hitilafu ya mtandao. Jaribu tena.');
    } finally {
      setAuthBusy(false);
    }
  }
  function openAuth(mode = 'login') {
    setAuthMode(mode);
    setAuthIdentity('');
    setAuthPassword('');
    setModal('login');
  }
  function logout() {
    window.localStorage.removeItem('sokora_token');
    setAuthUser(null);
    notify('Umetoka kwenye akaunti yako.');
  }
  const current = selected || videos[0];

  async function shareVideo(video) {
    const url = window.location.href;
    const text = video.product + ' — ' + money(video.price) + ' kupitia SOKORA';
    if (navigator.share) {
      try { await navigator.share({ title: video.product, text, url }); } catch { /* user cancelled */ }
    } else {
      try { await navigator.clipboard.writeText(text + ' ' + url); notify('Maelezo yamenakiliwa.'); }
      catch { notify(text + ' · ' + url); }
    }
  }

  function handleUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      notify('Chagua picha au video ya bidhaa.'); return;
    }
    setUploadFile(file);
    setModal('upload');
  }

  function downloadSelected() {
    if (!current?.video) { notify('Hakuna faili halisi ya video ya kupakua kwenye tangazo hili.'); return; }
    const a = document.createElement('a');
    a.href = current.video; a.download = 'sokora-video'; a.rel = 'noopener'; a.click();
  }

  function saveLocalListing() {
    if (!uploadFile || !uploadCaption.trim() || !uploadPrice.trim()) {
      notify('Jaza maelezo, bei na uchague picha/video kwanza.'); return;
    }
    const localUrl = URL.createObjectURL(uploadFile);
    const localItem = {
      id: 'local-' + Date.now(), seller: '@wewe', product: uploadCaption.trim(),
      price: Number(uploadPrice.replace(/[^0-9]/g, '')) || 0, location: uploadLocation,
      category: 'Biashara', caption: uploadCaption.trim(), emoji: '🛍️',
      image: uploadFile.type.startsWith('image/') ? localUrl : '', video: uploadFile.type.startsWith('video/') ? localUrl : '',
      likes: 0, demo: true, local: true,
    };
    setVideos((old) => [localItem, ...old]);
    setQuery('');
    setCategory('Zote');
    closeModal();
    setUploadFile(null); setUploadCaption(''); setUploadPrice('');
    notify('Tangazo limeongezwa kwenye kivinjari hiki tu; halijapakiwa kwa umma.');
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="SOKORA nyumbani"><span className="brand-mark">S</span><span><strong>SOKORA</strong><small>TAZAMA · GUNDUA · NUNUA</small></span></a>
        <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta bidhaa, biashara, eneo..." aria-label="Tafuta SOKORA" /><kbd>Enter</kbd></label>
        <div className="header-actions"><button className="ghost-btn" onClick={() => authUser ? logout() : openAuth('login')}>{authUser ? 'Toka' : 'Ingia'}</button><button className="gold-btn" onClick={() => authUser ? askDemo('upload') : openAuth('login')}>＋ Weka bidhaa</button></div>
      </header>

      <main id="home">
        <section className="welcome-row">
          <div><p className="eyebrow">🇹🇿 SOKO LA TANZANIA</p><h1>Biashara halisi.<br /><span>Fursa kila mahali.</span></h1><p className="welcome-copy">Gundua bidhaa, huduma na biashara kupitia picha na video fupi kutoka Tanzania nzima.</p></div>
          <div className="welcome-stats"><span><b>{filtered.length}</b><small>Matangazo yanayoonekana</small></span><span><b>24/7</b><small>Gundua kwa muda wako</small></span></div>
        </section>

        <section className="live-row" aria-label="LIVE">
          <div className="section-label"><span className="live-dot"></span><div><b>LIVE sasa</b><small>Maonyesho ya wafanyabiashara</small></div></div>
          <div className="live-creators">
            {['Mariam Fashion', 'Dodoma Gadgets', 'Mama Neema', 'JMK Tech'].map((name, i) => <button key={name} className="live-person" onClick={() => { setSelected({ product: name, seller: name }); askDemo('live'); }}><span className={'live-avatar avatar-' + i}>{['MF', 'DG', 'MN', 'JT'][i]}</span><span>{name}</span></button>)}
          </div>
          <button className="live-outline" onClick={() => askDemo('live')}>● Anza LIVE</button>
        </section>

        <section className="market-section">
          <div className="section-heading"><div><p className="eyebrow">GUNDUA KITU KIPYA</p><h2>Video na bidhaa</h2></div><span className="source-note">{mode === 'video-api' ? 'Video halisi kutoka API' : mode === 'api' ? 'Bidhaa kutoka API' : 'Data za mfano'}</span></div>
          <div className="category-row" aria-label="Makundi ya bidhaa">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <div className="result-line"><span>{filtered.length} matokeo</span><label className="sort-label">Panga kwa <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="recommended">Vinavyopendekezwa</option><option value="price-low">Bei: chini kwenda juu</option><option value="price-high">Bei: juu kwenda chini</option></select></label></div>
          {filtered.length ? <div className="product-grid">{filtered.map((video) => <article className="product-card" key={video.id}>
            <button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>
              {video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <span className="product-emoji">{video.emoji || '🛍️'}</span>}
              <span className="media-tag">{video.video ? '▶ VIDEO' : video.demo ? 'MFANO' : 'BIDHAA'}</span>
            </button>
            <div className="product-content"><div className="seller-line"><span className="seller-avatar">{(video.seller || 'S').replace('@','').slice(0,2).toUpperCase()}</span><span>{video.seller}</span><button className={'follow-mini ' + (following[video.seller] ? 'following' : '')} onClick={() => { setFollowing((old) => ({ ...old, [video.seller]: !old[video.seller] })); notify('Ufuatiliaji huu ni wa kivinjari hiki tu.'); }}>{following[video.seller] ? '✓' : '+'}</button></div><h3>{video.product}</h3><p className="product-caption">{video.caption}</p><div className="product-bottom"><strong>{money(video.price)}</strong><span>⌖ {video.location}</span></div><div className="card-actions"><button onClick={() => { setLiked((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Like imehifadhiwa kwenye hali ya kivinjari hiki tu.'); }} className={liked[video.id] ? 'is-liked' : ''}>{liked[video.id] ? '♥' : '♡'} <span>{Number(video.likes || 0) + (liked[video.id] ? 1 : 0)}</span></button><button onClick={() => { setSelected(video); askDemo('comments'); }}>▢ Maoni</button><button onClick={() => shareVideo(video)}>↗ Shiriki</button><button onClick={() => { setSaved((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Hifadhi ni ya kivinjari hiki tu.'); }}>{saved[video.id] ? '★' : '☆'}</button></div></div>
          </article>)}</div> : <div className="empty-state"><span>⌕</span><h3>Hakuna kilichopatikana</h3><p>Badili neno la utafutaji au chagua kundi jingine.</p><button className="gold-btn" onClick={() => { setQuery(''); setCategory('Zote'); }}>Ondoa vichujio</button></div>}
        </section>

        <section className="seller-banner"><div className="banner-icon">↗</div><div><p className="eyebrow">WEKA BIASHARA YAKO</p><h2>Bidhaa yako inastahili kuonekana.</h2><p>Andaa tangazo lenye picha au video, bei na eneo la biashara yako.</p></div><button className="gold-btn" onClick={() => askDemo('upload')}>＋ Tengeneza tangazo</button></section>
        <p className="disclaimer">SOKORA Web · Taarifa zilizoandikwa “mfano” ni za kuonyesha muonekano tu. Likes, follows na matangazo ya kifaa hiki hazijahifadhiwa kwenye akaunti au database ya umma.</p>
      </main>

      <nav className="mobile-nav" aria-label="Urambazaji wa SOKORA">{[['⌂','Nyumbani'],['⌕','Gundua'],['＋','Weka'],['●','LIVE'],['◉','Wasifu']].map(([icon, label]) => <button key={label} className={mobileTab === label ? 'active' : ''} onClick={() => { setMobileTab(label); if (label === 'Weka') askDemo('upload'); else if (label === 'LIVE') askDemo('live'); else if (label === 'Wasifu') authUser ? notify('Umeingia kama @' + authUser.username + '.') : openAuth('login'); else window.scrollTo({ top: label === 'Gundua' ? 420 : 0, behavior: 'smooth' }); }}><span>{icon}</span>{label}</button>)}</nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={closeModal} aria-label="Funga">×</button>
        {modal === 'details' && current && <><p className="eyebrow">TAARIFA ZA TANGAZO</p><h2>{current.product}</h2><p className="modal-price">{money(current.price)}</p><p>{current.caption}</p><p className="modal-muted">Muuzaji: {current.seller} · {current.location}</p><div className="modal-actions"><button className="gold-btn" onClick={() => shareVideo(current)}>Shiriki bidhaa</button><button className="ghost-btn" onClick={closeModal}>Rudi sokoni</button></div></>}
        {modal === 'login' && <><p className="eyebrow">AKAUNTI YA SOKORA</p><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu SOKORA'}</h2><p>{authMode === 'register' ? 'Jisajili ili uweze kuanza kuweka biashara na kufuatilia wauzaji.' : 'Ingia kwa username, email au namba ya simu.'}</p><form className="auth-form" onSubmit={submitAuth}>
          {authMode === 'register' ? <><label className="field-label">Jina kamili<input autoComplete="name" value={authDisplayName} onChange={(e) => setAuthDisplayName(e.target.value)} required minLength={2} maxLength={80} /></label><label className="field-label">Username<input autoComplete="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="mfano_joseph" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" /></label><label className="field-label">Email (si lazima ikiwa una simu)<input type="email" autoComplete="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label><label className="field-label">Namba ya simu (si lazima ikiwa una email)<input type="tel" autoComplete="tel" value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} placeholder="+255..." /></label></> : <label className="field-label">Username, email au simu<input autoComplete="username" value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} required /></label>}
          <label className="field-label">Password<input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength={authMode === 'register' ? 10 : 1} maxLength={128} /></label>
          {authMode === 'register' && <p className="modal-muted">Tumia password ya angalau herufi 10. Hifadhi kwa usalama; usimpe mtu mwingine.</p>}
          <button className="gold-btn" type="submit" disabled={authBusy}>{authBusy ? 'Inashughulikia...' : authMode === 'register' ? 'Fungua akaunti' : 'Ingia'}</button>
        </form><p className="auth-switch">{authMode === 'register' ? 'Tayari una akaunti?' : 'Bado huna akaunti?'} <button type="button" className="text-link" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Ingia' : 'Jisajili'}</button></p></>}
        {modal === 'live' && <><p className="eyebrow"><span className="live-dot"></span> LIVE</p><h2>Maonyesho ya moja kwa moja</h2><p>LIVE halisi haijaunganishwa bado. Inahitaji huduma ya streaming, akaunti ya muuzaji na udhibiti wa usalama. Hatuonyeshi video ya moja kwa moja ya kubuni.</p><button className="gold-btn" onClick={closeModal}>Sawa</button></>}
        {modal === 'comments' && current && <><p className="eyebrow">MAONI</p><h2>{current.product}</h2><div className="comment-list">{(comments[current.id] || []).map((comment, i) => <p key={i}><b>{comment.name}</b><br />{comment.text}</p>)}{!(comments[current.id] || []).length && <p className="modal-muted">Bado hakuna maoni yaliyowekwa kwenye kivinjari hiki.</p>}</div><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Andika maoni..." rows="3" /><button className="gold-btn" onClick={() => { if (!commentText.trim()) return; setComments((old) => ({ ...old, [current.id]: [...(old[current.id] || []), { name: 'Wewe (kifaa hiki)', text: commentText.trim() }] })); setCommentText(''); notify('Maoni yameongezwa kwenye kifaa hiki tu.'); }}>Ongeza maoni</button></>}
        {modal === 'upload' && <><p className="eyebrow">TANGAZO JIPYA</p><h2>Weka bidhaa au video</h2><p>Hili ni tangazo la ndani ya kivinjari kwa sasa. Halitapakiwa kwa umma hadi upload API na storage salama viunganishwe.</p><label className="field-label">Picha au video<input type="file" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></label><label className="field-label">Jina/maelezo ya bidhaa<input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Mf. Simu Samsung..." /></label><label className="field-label">Bei kwa TSh<input inputMode="numeric" value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="25000" /></label><label className="field-label">Eneo<input value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)} /></label>{uploadFile && <p className="modal-muted">Faili: {uploadFile.name} · {(uploadFile.size / 1048576).toFixed(1)} MB</p>}<div className="modal-actions"><button className="gold-btn" onClick={saveLocalListing}>Ongeza kwenye kifaa hiki</button><button className="ghost-btn" onClick={closeModal}>Ghairi</button></div></>}
      </section></div>}
    </div>
  );
}
