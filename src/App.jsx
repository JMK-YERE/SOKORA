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

function LiveViewer({ playback }) {
  const [videoElement, setVideoElement] = useState(null);
  const [status, setStatus] = useState('Inaunganisha player...');
  useEffect(() => {
    if (!videoElement || !playback) return undefined;
    let active = true; let peer;
    async function connect() {
      try {
        if (!/^https:\/\//i.test(playback)) throw new Error('Anwani ya playback si salama.');
        peer = new RTCPeerConnection();
        peer.addTransceiver('video', { direction: 'recvonly' });
        peer.addTransceiver('audio', { direction: 'recvonly' });
        peer.ontrack = (event) => { if (active) { videoElement.srcObject = event.streams[0]; setStatus('LIVE inaonyeshwa'); } };
        const offer = await peer.createOffer(); await peer.setLocalDescription(offer);
        const response = await fetch(playback, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer.sdp });
        if (!response.ok) throw new Error('Player imeshindwa kuunganishwa (' + response.status + ').');
        await peer.setRemoteDescription({ type: 'answer', sdp: await response.text() });
      } catch (error) { if (active) setStatus(error.message || 'LIVE haipatikani kwa sasa.'); }
    }
    connect();
    return () => { active = false; if (peer) peer.close(); videoElement.srcObject = null; };
  }, [playback, videoElement]);
  return <div className="live-player-wrap"><video ref={setVideoElement} autoPlay playsInline controls className="live-player" /><p className="modal-muted">{status}</p></div>;
}

export default function App() {
  const [videos, setVideos] = useState(seedVideos);
  const [mode, setMode] = useState('demo');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Zote');
  const [sortOrder, setSortOrder] = useState('recommended');
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
  const [liveItems, setLiveItems] = useState([]);
  const [liveConfigured, setLiveConfigured] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState('');
  const [liveStream, setLiveStream] = useState(null);
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem('sokora_token') || '');
  const [authUser, setAuthUser] = useState(null);
  const [authMode, setAuthMode] = useState('login');
  const [authIdentity, setAuthIdentity] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authDisplayName, setAuthDisplayName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authAccountType, setAuthAccountType] = useState('customer');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [viewerStream, setViewerStream] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch((API || '') + '/api/feed?limit=30', { headers: { Accept: 'application/json' } })
      .then((r) => { if (!r.ok) throw new Error('feed unavailable'); return r.json(); })
      .then((data) => {
        if (!alive) return;
        const rows = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
        const seen = new Set();
        const normalized = rows.filter((row) => {
          const id = String(row.video_id ?? row.id ?? '');
          if (!id || seen.has(id)) return false;
          seen.add(id);
          return true;
        }).map((row, i) => ({
          id: String(row.video_id ?? row.id ?? 'video-' + i),
          seller: row.seller_username ? '@' + String(row.seller_username).replace(/^@/, '') : (row.seller_name || '@sokora_seller'),
          product: row.product_name || row.name || 'Bidhaa ya SOKORA',
          price: Number(row.price_tzs || 0),
          location: row.location || 'Tanzania',
          category: row.category || 'Biashara',
          caption: row.caption || row.description || '',
          emoji: '🛍️',
          image: row.product_image_url || row.image_url || row.thumbnail_url || '',
          video: row.video_url || '',
          likes: Number(row.likes_count || 0),
          demo: false,
        }));
        setVideos(normalized);
        setMode('api');
      })
      .catch(() => { if (alive) { setVideos(seedVideos); setMode('demo'); } });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    let alive = true;
    const loadLive = () => fetch((API || '') + '/api/live', { headers: { Accept: 'application/json' } })
      .then((r) => { if (!r.ok) throw new Error('LIVE unavailable'); return r.json(); })
      .then((data) => { if (alive) { setLiveItems(Array.isArray(data.items) ? data.items : []); setLiveConfigured(Boolean(data.configured)); } })
      .catch(() => { if (alive) { setLiveItems([]); setLiveConfigured(false); } });
    loadLive();
    const timer = window.setInterval(loadLive, 20000);
    return () => { alive = false; window.clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (!authToken) { setAuthUser(null); return undefined; }
    let alive = true;
    fetch((API || '') + '/api/auth/me', { headers: { Authorization: 'Bearer ' + authToken, Accept: 'application/json' } })
      .then((r) => { if (!r.ok) throw new Error('Session expired'); return r.json(); })
      .then((data) => { if (alive) setAuthUser(data.user || null); })
      .catch(() => { if (alive) { window.localStorage.removeItem('sokora_token'); setAuthToken(''); setAuthUser(null); } });
    return () => { alive = false; };
  }, [authToken]);

  useEffect(() => {
    if (!toast) return undefined;
    const id = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(id);
  }, [toast]);

  const filtered = useMemo(() => {
    const matching = videos.filter((v) => {
      const matchesCategory = category === 'Zote' || v.category.toLocaleLowerCase('sw').includes(category.toLocaleLowerCase('sw'));
      const haystack = [v.product, v.seller, v.location, v.caption, v.category].join(' ').toLocaleLowerCase('sw');
      return matchesCategory && haystack.includes(query.trim().toLocaleLowerCase('sw'));
    });
    if (sortOrder === 'price-low') matching.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortOrder === 'price-high') matching.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return matching;
  }, [videos, category, query, sortOrder]);

  const closeModal = () => { setModal(''); setSelected(null); setCommentText(''); setLiveError(''); };
  async function submitAuth() {
    setAuthBusy(true); setAuthError('');
    try {
      const registering = authMode === 'register';
      const payload = registering ? { email: authEmail, phone: authPhone, username: authUsername, displayName: authDisplayName, password: authPassword, accountType: authAccountType } : { identity: authIdentity, password: authPassword };
      const response = await fetch((API || '') + '/api/auth/' + (registering ? 'register' : 'login'), { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.token) throw new Error(data.message || ({ AUTH_NOT_CONFIGURED: 'Mfumo wa akaunti bado haujawekwa kwenye server.', DATABASE_NOT_CONFIGURED: 'Database haijaunganishwa na API.', INVALID_CREDENTIALS: 'Taarifa za kuingia si sahihi.', ACCOUNT_ALREADY_EXISTS: 'Akaunti hii tayari ipo.' }[data.error] || 'Imeshindikana kuingia. Hakiki taarifa na API.'));
      window.localStorage.setItem('sokora_token', data.token); setAuthToken(data.token); setAuthUser(data.user || null); setAuthPassword(''); setModal(''); notify('Umeingia SOKORA salama.');
    } catch (error) { setAuthError(error.message || 'Hitilafu ya kuingia.'); } finally { setAuthBusy(false); }
  }
  function signOut() { window.localStorage.removeItem('sokora_token'); setAuthToken(''); setAuthUser(null); setAuthPassword(''); notify('Umetoka kwenye akaunti.'); }
  async function startLive() {
    setLiveBusy(true); setLiveError(''); let stream; let pc;
    try {
      if (!authToken || !authUser) throw new Error('Ingia kwanza kwenye akaunti ya muuzaji ili kuanza LIVE.');
      if (!['SELLER', 'BUSINESS', 'ADMIN'].includes(String(authUser.role || '').toUpperCase())) throw new Error('Akaunti hii haina ruhusa ya muuzaji. Role ya SELLER/BUSINESS inahitajika.');
      if (!liveTitle.trim()) throw new Error('Andika kichwa cha LIVE kwanza.');
      if (!navigator.mediaDevices?.getUserMedia || !window.RTCPeerConnection) throw new Error('Kivinjari hiki hakitumii kamera/microphone kwa WebRTC.');
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const response = await fetch((API || '') + '/api/live/start', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + authToken }, body: JSON.stringify({ title: liveTitle.trim() }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.id || !data.publish) throw new Error(({ AUTH_REQUIRED: 'Session imeisha. Ingia tena.', SELLER_ACCOUNT_REQUIRED: 'Akaunti ya muuzaji inahitajika.', LIVE_NOT_CONFIGURED: 'Cloudflare Stream bado haijawekwa kwenye Worker.' }[data.error] || 'Server haijatoa anwani ya WebRTC ya LIVE.'));
      pc = new RTCPeerConnection(); stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      const offer = await pc.createOffer(); await pc.setLocalDescription(offer);
      const publishResponse = await fetch(data.publish, { method: 'POST', headers: { 'Content-Type': 'application/sdp' }, body: offer.sdp });
      if (!publishResponse.ok) throw new Error('Cloudflare Stream imekataa kuanzisha broadcast (' + publishResponse.status + ').');
      await pc.setRemoteDescription({ type: 'answer', sdp: await publishResponse.text() });
      setLiveStream({ id: data.id, pc, media: stream });
      setLiveItems((old) => [{ id: data.id, title: liveTitle.trim(), creator: authUser.username ? '@' + authUser.username : 'Muuzaji', status: 'connected', playback: data.playback || null }, ...old.filter((item) => item.id !== data.id)]);
      notify('LIVE imeanzishwa. Usifunge ukurasa wakati unaendelea kutangaza.');
    } catch (error) { if (pc) pc.close(); if (stream) stream.getTracks().forEach((track) => track.stop()); setLiveError(error.message || 'Imeshindikana kuanza LIVE.'); } finally { setLiveBusy(false); }
  }
  async function stopLive() {
    if (!liveStream) return; setLiveBusy(true); setLiveError('');
    try {
      const response = await fetch((API || '') + '/api/live/' + encodeURIComponent(liveStream.id) + '/stop', { method: 'POST', headers: { Authorization: 'Bearer ' + authToken } });
      if (!response.ok) { const data = await response.json().catch(() => ({})); throw new Error(data.error || 'Server haikuweza kusimamisha LIVE.'); }
      notify('LIVE imesimamishwa.');
    } catch (error) { setLiveError(error.message || 'Imeshindikana kusimamisha LIVE.'); }
    finally { liveStream.pc.close(); liveStream.media.getTracks().forEach((track) => track.stop()); setLiveStream(null); setLiveBusy(false); fetch((API || '') + '/api/live').then((r) => r.json()).then((data) => setLiveItems(Array.isArray(data.items) ? data.items : [])).catch(() => {}); }
  }
  async function joinLive(item) { setViewerStream(item); setLiveError(''); setModal('live'); }
  const notify = (message) => setToast(message);
  const askDemo = (feature) => { setModal(feature); };
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
        <div className="header-actions">{authUser ? <><button className="ghost-btn" onClick={() => notify('@' + (authUser.username || 'mtumiaji') + ' · ' + (authUser.role || 'USER'))}>@{authUser.username}</button><button className="gold-btn" onClick={signOut}>Toka</button></> : <button className="ghost-btn" onClick={() => { setAuthMode('login'); setAuthError(''); askDemo('login'); }}>Ingia</button>}<button className="gold-btn" onClick={() => askDemo('upload')}>＋ Weka bidhaa</button></div>
      </header>

      <main id="home">
        <section className="welcome-row">
          <div><p className="eyebrow">🇹🇿 SOKO LA TANZANIA</p><h1>Biashara halisi.<br /><span>Fursa kila mahali.</span></h1><p className="welcome-copy">Gundua bidhaa, huduma na biashara kupitia picha na video fupi kutoka Tanzania nzima.</p></div>
          <div className="welcome-stats"><span><b>{filtered.length}</b><small>Matangazo yanayoonekana</small></span><span><b>24/7</b><small>Gundua kwa muda wako</small></span></div>
        </section>

        <section className="live-row" aria-label="LIVE">
          <div className="section-label"><span className="live-dot"></span><div><b>LIVE sasa</b><small>Maonyesho ya wafanyabiashara</small></div></div>
          <div className="live-creators">
            {liveItems.length ? liveItems.map((item, i) => <button key={item.id} className="live-person" onClick={() => joinLive(item)}><span className={'live-avatar avatar-' + (i % 4)}>LIVE</span><span>{item.creator || item.title || 'Muuzaji'}</span></button>) : <p className="modal-muted">{liveConfigured ? 'Hakuna matangazo ya LIVE kwa sasa.' : 'LIVE itajitokeza hapa baada ya kuunganisha Cloudflare Stream.'}</p>}
          </div>
          <button className="live-outline" onClick={() => { setViewerStream(null); setLiveTitle(''); setLiveError(''); askDemo('live'); }}>● Anza LIVE</button>
        </section>

        <section className="market-section">
          <div className="section-heading"><div><p className="eyebrow">GUNDUA KITU KIPYA</p><h2>Video na bidhaa</h2></div><span className="source-note">{mode === 'api' ? 'Imeunganishwa na API' : 'Data za mfano'}</span></div>
          <div className="category-row" aria-label="Makundi ya bidhaa">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <div className="result-line"><span>{filtered.length} matokeo</span><label className="sort-label">Panga kwa <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option value="recommended">Vinavyopendekezwa</option><option value="price-low">Bei: chini kwenda juu</option><option value="price-high">Bei: juu kwenda chini</option></select></label></div>
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

      <nav className="mobile-nav" aria-label="Urambazaji wa SOKORA">{[['⌂','Nyumbani'],['⌕','Gundua'],['＋','Weka'],['●','LIVE'],['◉','Wasifu']].map(([icon, label]) => <button key={label} className={mobileTab === label ? 'active' : ''} onClick={() => { setMobileTab(label); if (label === 'Weka') askDemo('upload'); else if (label === 'LIVE') askDemo('live'); else if (label === 'Wasifu') askDemo('login'); else window.scrollTo({ top: label === 'Gundua' ? 420 : 0, behavior: 'smooth' }); }}><span>{icon}</span>{label}</button>)}</nav>

      {toast && <div className="toast" role="status">{toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={closeModal} aria-label="Funga">×</button>
        {modal === 'details' && current && <><p className="eyebrow">TAARIFA ZA TANGAZO</p><h2>{current.product}</h2><p className="modal-price">{money(current.price)}</p><p>{current.caption}</p><p className="modal-muted">Muuzaji: {current.seller} · {current.location}</p><div className="modal-actions"><button className="gold-btn" onClick={() => shareVideo(current)}>Shiriki bidhaa</button><button className="ghost-btn" onClick={closeModal}>Rudi sokoni</button></div></>}
        {modal === 'login' && <><p className="eyebrow">AKAUNTI YA SOKORA</p><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu SOKORA'}</h2><div className="modal-actions"><button className={authMode === 'login' ? 'gold-btn' : 'ghost-btn'} onClick={() => { setAuthMode('login'); setAuthError(''); }}>Ingia</button><button className={authMode === 'register' ? 'gold-btn' : 'ghost-btn'} onClick={() => { setAuthMode('register'); setAuthError(''); }}>Jisajili</button></div>{authMode === 'register' && <><label className="field-label">Jina linaloonekana<input value={authDisplayName} onChange={(e) => setAuthDisplayName(e.target.value)} autoComplete="name" /></label><label className="field-label">Username<input value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} autoComplete="username" placeholder="mfano jmk_shop" /></label><label className="field-label">Aina ya akaunti<select value={authAccountType} onChange={(e) => setAuthAccountType(e.target.value)}><option value="customer">Mnunuzi</option><option value="seller">Muuzaji (LIVE na matangazo)</option></select></label><label className="field-label">Email (hiari ikiwa unaweka simu)<input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} autoComplete="email" /></label><label className="field-label">Namba ya simu (hiari ikiwa unaweka email)<input value={authPhone} onChange={(e) => setAuthPhone(e.target.value)} autoComplete="tel" /></label></>}{authMode === 'login' && <label className="field-label">Username, email au simu<input value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} autoComplete="username" /></label>}<label className="field-label">Nenosiri (angalau herufi 10 wakati wa usajili)<input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} /></label>{authError && <p role="alert" className="auth-error">{authError}</p>}<div className="modal-actions"><button className="gold-btn" disabled={authBusy} onClick={submitAuth}>{authBusy ? 'Subiri...' : authMode === 'register' ? 'Jisajili' : 'Ingia'}</button><button className="ghost-btn" onClick={closeModal}>Ghairi</button></div></>}
        {modal === 'live' && <><p className="eyebrow"><span className="live-dot"></span> LIVE</p>{viewerStream ? <><h2>{viewerStream.title || viewerStream.creator || 'SOKORA LIVE'}</h2><p>{viewerStream.creator || 'Muuzaji wa SOKORA'} · {viewerStream.status || 'LIVE'}</p>{viewerStream.playback ? <LiveViewer playback={viewerStream.playback} /> : <p className="modal-muted">Stream hii haina anwani ya playback inayoweza kufunguliwa na player hii.</p>}<button className="gold-btn" onClick={closeModal}>Funga player</button></> : <><h2>{liveStream ? 'Una LIVE inayoendelea' : 'Anza LIVE'}</h2><p>Ruhusu kamera na microphone baada ya kubonyeza Anza LIVE. Akaunti lazima iwe na role ya muuzaji.</p>{!authUser && <button className="ghost-btn" onClick={() => { setModal('login'); setAuthMode('login'); }}>Ingia kwanza</button>}{liveStream ? <p>LIVE yako inaendelea. Usifunge ukurasa hadi umalize kutangaza.</p> : <label className="field-label">Kichwa cha LIVE<input value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} placeholder="Mf. Onyesho la bidhaa mpya" maxLength={100} /></label>}{liveError && <p className="auth-error" role="alert">{liveError}</p>}<div className="modal-actions">{liveStream ? <button className="gold-btn" disabled={liveBusy} onClick={stopLive}>{liveBusy ? 'Inasimamisha...' : '■ Simamisha LIVE'}</button> : <button className="gold-btn" disabled={liveBusy} onClick={startLive}>{liveBusy ? 'Inaunganisha...' : '● Anza LIVE'}</button>}<button className="ghost-btn" onClick={closeModal}>Funga</button></div></>}</>}
        {modal === 'comments' && current && <><p className="eyebrow">MAONI</p><h2>{current.product}</h2><div className="comment-list">{(comments[current.id] || []).map((comment, i) => <p key={i}><b>{comment.name}</b><br />{comment.text}</p>)}{!(comments[current.id] || []).length && <p className="modal-muted">Bado hakuna maoni yaliyowekwa kwenye kivinjari hiki.</p>}</div><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Andika maoni..." rows="3" /><button className="gold-btn" onClick={() => { if (!commentText.trim()) return; setComments((old) => ({ ...old, [current.id]: [...(old[current.id] || []), { name: 'Wewe (kifaa hiki)', text: commentText.trim() }] })); setCommentText(''); notify('Maoni yameongezwa kwenye kifaa hiki tu.'); }}>Ongeza maoni</button></>}
        {modal === 'upload' && <><p className="eyebrow">TANGAZO JIPYA</p><h2>Weka bidhaa au video</h2><p>Hili ni tangazo la ndani ya kivinjari kwa sasa. Halitapakiwa kwa umma hadi upload API na storage salama viunganishwe.</p><label className="field-label">Picha au video<input type="file" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></label><label className="field-label">Jina/maelezo ya bidhaa<input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Mf. Simu Samsung..." /></label><label className="field-label">Bei kwa TSh<input inputMode="numeric" value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="25000" /></label><label className="field-label">Eneo<input value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)} /></label>{uploadFile && <p className="modal-muted">Faili: {uploadFile.name} · {(uploadFile.size / 1048576).toFixed(1)} MB</p>}<div className="modal-actions"><button className="gold-btn" onClick={saveLocalListing}>Ongeza kwenye kifaa hiki</button><button className="ghost-btn" onClick={closeModal}>Ghairi</button></div></>}
      </section></div>}
    </div>
  );
}
