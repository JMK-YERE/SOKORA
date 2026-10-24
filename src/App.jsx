import { useEffect, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const categories = ['Zote', 'Elektroniki', 'Mitindo', 'Nyumba', 'Magari', 'Huduma', 'Vyumba vya kupanga', 'Biashara'];

const categoryShowcases = [
  { name: 'Mitindo na viatu', filter: 'Mitindo', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=85', alt: 'Viatu vya mitindo' },
  { name: 'Nyumba na samani', filter: 'Nyumba', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85', alt: 'Samani za sebuleni' },
  { name: 'Bidhaa za kila siku', filter: 'Biashara', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85', alt: 'Bidhaa za dukani' },
  { name: 'Simu na vifaa vya elektroniki', filter: 'Elektroniki', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', alt: 'Simu janja' },
  { name: 'Kilimo na mazao', filter: 'Biashara', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=85', alt: 'Mazao sokoni' },
  { name: 'Magari na usafiri', filter: 'Magari', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=85', alt: 'Gari' },
  { name: 'Huduma na biashara', filter: 'Huduma', image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=900&q=85', alt: 'Watu wakifanya kazi' },
  { name: 'Vifaa vya nyumbani', filter: 'Nyumba', image: 'https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&w=900&q=85', alt: 'Vifaa vya nyumbani' },
];

const marketplaceCategories = [
  ['Vifaa vya nyumbani','Nyumba'], ['TV, sauti na burudani','Elektroniki'], ['Mitindo na mavazi','Mitindo'],
  ['Vito na accessories','Mitindo'], ['Simu na accessories','Elektroniki'], ['Vifaa vya afya','Huduma'],
  ['Elektroniki','Elektroniki'], ['Samani','Nyumba'], ['Mapambo ya nyumba','Nyumba'], ['Laptop','Elektroniki'],
  ['Hardware na magari','Magari'], ['Wauzaji wa magari','Magari'], ['Vitabu','Biashara'], ['Vyombo vya muziki','Elektroniki'],
  ['Vifaa vya biashara','Biashara'], ['Vifaa vya ofisi','Biashara'], ['Jikoni na dining','Nyumba'],
  ['Vifaa vya michezo','Biashara'], ['Bidhaa za watoto','Biashara'], ['Baiskeli','Magari'],
  ['Midoli na display','Nyumba'], ['Mifuko na luggage','Mitindo'], ['Taa na mwanga','Nyumba'],
  ['Michezo ya video','Elektroniki'], ['Kompyuta desktop','Elektroniki'], ['Vifaa vya umeme','Elektroniki'],
  ['Urembo na personal care','Huduma'], ['Nishati na power','Elektroniki'], ['Viatu','Mitindo'],
  ['Bidhaa za sauti na video','Elektroniki'], ['Vifaa vya utamaduni','Mitindo'], ['Huduma za afya na urembo','Huduma'],
  ['Groceries na pet care','Biashara'], ['Usalama na surveillance','Elektroniki'], ['Automotive','Magari'],
  ['Huduma za wanyama','Huduma'], ['Burudani na media','Biashara'], ['Chakula na vinywaji','Biashara'],
  ['Gaming accessories','Elektroniki'], ['Afya na wellness','Huduma'], ['Bidhaa za plastiki','Nyumba'],
  ['Vitabu vya shule','Biashara'], ['Mashine za kufulia','Nyumba'], ['Nyinginezo','Biashara']
];

const sellerMediaShowcase = [
  { title: 'Mitindo na mavazi', region: 'Dar es Salaam', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=85' },
  { title: 'Simu na vifaa', region: 'Kariakoo', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=85' },
  { title: 'Samani za nyumbani', region: 'Dodoma', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=85' },
  { title: 'Bidhaa za kila siku', region: 'Mwanza', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=85' },
  { title: 'Viatu na mitindo', region: 'Arusha', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=85' },
];

const videoShowcase = [
  { title: 'Mitindo na mavazi', category: 'Mitindo', poster: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85', video: 'https://videos.pexels.com/video-files/3195394/3195394-hd_1920_1080_25fps.mp4' },
  { title: 'Simu na teknolojia', category: 'Elektroniki', poster: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=85', video: 'https://videos.pexels.com/video-files/856857/856857-hd_1920_1080_25fps.mp4' },
  { title: 'Samani na nyumba', category: 'Nyumba', poster: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85', video: 'https://videos.pexels.com/video-files/5495784/5495784-hd_1920_1080_25fps.mp4' },
];



function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored === null ? initialValue : JSON.parse(stored);
    } catch {
      return initialValue;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage may be unavailable */ }
  }, [key, value]);
  return [value, setValue];
}

function openSokoraListingsDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) { reject(new Error('IndexedDB haipatikani')); return; }
    const request = indexedDB.open('sokora-listings-v1', 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('listings')) request.result.createObjectStore('listings', { keyPath: 'id' }); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Database ya kifaa haikufunguka'));
  });
}

const money = (value) => 'TSh ' + Number(value || 0).toLocaleString('en-TZ');

// Do not present known seeded/demo records as genuine marketplace listings.
function isDemoRecord(row) {
  const id = String(row.video_id ?? row.product_id ?? row.id ?? '').toLowerCase();
  const seller = String(row.seller_username ?? '').toLowerCase().replace(/^@/, '');
  const media = String(row.video_url ?? '').toLowerCase();
  const caption = String(row.caption ?? row.description ?? '').toLowerCase();
  const seededSellers = new Set(['jiji_gadgets_tz','mariam_fashion','mama_neema_home','jmk_tech','smart_zone_tz','pixel_hub','mwanza_furniture','urban_style_tz','motor_hub_tz','makazi_tanzania','sokora_video_demo','sokora_demo_shop']);
  return id.startsWith('demo-')
    || seededSellers.has(seller)
    || /^(sokora_)?(video_)?demo/.test(seller)
    || media.includes('storage.googleapis.com/gtv-videos-bucket/sample/')
    || caption.includes('maudhui haya si tangazo la muuzaji halisi')
    || caption.includes('mfano wa video ya bidhaa')
    || caption.includes('mfano wa video kwa duka');
}

export default function App() {
  const [videos, setVideos] = useState([]);
  const [mode, setMode] = useState('loading');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Zote');
  const [sortBy, setSortBy] = useState('recommended');
  const [feedTab, setFeedTab] = useState('for-you');
  const [nearbyRegion, setNearbyRegion] = useState('Dodoma');
  const [liked, setLiked] = useLocalStorageState('sokora_liked_v1', {});
  const [saved, setSaved] = useLocalStorageState('sokora_saved_v1', {});
  const [following, setFollowing] = useLocalStorageState('sokora_following_v1', {});
  const [modal, setModal] = useState('');
  const [toast, setToast] = useState('');
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useLocalStorageState('sokora_comments_v1', {});
  const [commentText, setCommentText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadLocation, setUploadLocation] = useState('Dodoma');
  const [uploadPhone, setUploadPhone] = useState('');
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
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  const [navHidden, setNavHidden] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(12);

  useEffect(() => {
    let alive = true;
    openSokoraListingsDB().then((db) => new Promise((resolve) => {
      const request = db.transaction('listings', 'readonly').objectStore('listings').getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    })).then((items) => {
      if (!alive || !items.length) return;
      const restored = items.map(({ mediaBlob, mediaType, ...item }) => ({
        ...item,
        image: mediaType.startsWith('image/') ? URL.createObjectURL(mediaBlob) : item.image,
        video: mediaType.startsWith('video/') ? URL.createObjectURL(mediaBlob) : item.video,
        local: true,
      }));
      setVideos((old) => [...restored, ...old.filter((v) => !restored.some((savedItem) => savedItem.id === v.id))]);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

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
        location: row.location || row.city || row.region || 'Tanzania',
        sellerPhone: row.seller_phone || row.sellerPhone || row.phone || row.whatsapp || row.whatsapp_number || '',
        category: row.category || row.category_name || 'Biashara',
        caption: row.caption || row.description || '',
        emoji: '🛍️',
        image: row.thumbnail_url || row.product_image_url || row.image_url || '',
        video: row.video_url || '',
        likes: Number(row.likes_count || 0),
        demo: false,
      });
      const normalizedVideos = feedRows.filter((row) => !isDemoRecord(row)).map((row, i) => normalizeProduct(row, i, true));
      const normalizedProducts = productRows.filter((row) => !isDemoRecord(row)).map((row, i) => normalizeProduct(row, i, false));
      // Show both real product listings and seller videos together; a non-empty video feed must not hide the product catalog.
      const combined = [...normalizedProducts, ...normalizedVideos];
      const seen = new Set();
      const normalized = combined.filter((item) => {
        const key = [item.id, item.product, item.seller].join('|').toLocaleLowerCase('sw');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      if (normalized.length) {
        setVideos(normalized);
        setMode(normalizedVideos.length && normalizedProducts.length ? 'mixed-api' : (normalizedVideos.length ? 'video-api' : 'api'));
      } else {
        setVideos([]);
        setMode('empty-api');
      }
    }).catch(() => {
      if (alive) { setVideos([]); setMode('api-error'); }
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
      const matchesFollowing = feedTab !== 'following' || Boolean(following[v.seller]);
      const matchesNearby = feedTab !== 'nearby' || String(v.location || '').toLocaleLowerCase('sw').includes(nearbyRegion.toLocaleLowerCase('sw'));
      return matchesCategory && matchesFollowing && matchesNearby && haystack.includes(query.trim().toLocaleLowerCase('sw'));
    });
    if (sortBy === 'price-low') return [...results].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === 'price-high') return [...results].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    return results;
  }, [videos, category, query, sortBy, feedTab, nearbyRegion, following]);

  const shopSummaries = useMemo(() => {
    const shops = new Map();
    videos.filter((item) => !item.demo && !item.local && item.seller && item.seller !== '@sokora_seller').forEach((item) => {
      const key = item.seller;
      const currentShop = shops.get(key) || { seller: key, location: item.location || 'Tanzania', count: 0 };
      currentShop.count += 1;
      if (currentShop.location === 'Tanzania' && item.location) currentShop.location = item.location;
      shops.set(key, currentShop);
    });
    return Array.from(shops.values());
  }, [videos]);

  useEffect(() => { setVisibleProducts(12); }, [query, category, feedTab, nearbyRegion, sortBy]);

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
        ? { email: authIdentity.trim().includes('@') ? authIdentity.trim() : '', phone: authIdentity.trim().includes('@') ? '' : authIdentity.trim(), username: authUsername.trim(), displayName: authDisplayName.trim(), password: authPassword }
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
          LOGIN_FAILED: 'Seva imeshindwa kuthibitisha akaunti kwenye database. Jaribu tena; ikiwa inaendelea, muunganisho au muundo wa jedwali la users unahitaji kukaguliwa.',
          SESSION_LOOKUP_FAILED: 'Seva imeshindwa kusoma akaunti yako kwenye database. Ingia tena baadaye.',
          ACCOUNT_INACTIVE: 'Akaunti hii haijawezeshwa. Wasiliana na msimamizi.',
          INVALID_REGISTRATION: data.message || 'Angalia taarifa za usajili; password iwe na herufi angalau 10.',
          ACCOUNT_ALREADY_EXISTS: 'Username, email au simu hiyo tayari imesajiliwa.',
          INVALID_CREDENTIALS: 'Taarifa za kuingia si sahihi au akaunti haijawashwa.',
          INVALID_SESSION: 'Session imeisha. Ingia tena.',
        };
        throw new Error(messages[data.error] || 'Imeshindikana. Jaribu tena baada ya muda.');
      }
      window.localStorage.setItem('sokora_token', data.token);
      setAuthUser(data.user);
      setDashboardSection('dashboard');
      setNavHidden(false);
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
    setDashboardSection('dashboard');
    setNavHidden(false);
    notify('Umetoka kwenye akaunti yako.');
  }
  const current = selected || videos[0];
  // Use genuine SOKORA listings when available. If the catalogue is empty, show clearly labelled category imagery so the hero is never blank or misleading.
  const realHeroMedia = videos.filter((item) => !item.demo && !item.local && (item.image || item.video)).slice(0, 4);
  const showcaseMedia = [
    { id: 'showcase-electronics', product: 'Elektroniki na simu', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85', video: '', isShowcase: true },
    { id: 'showcase-fashion', product: 'Mitindo na viatu', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85', video: '', isShowcase: true },
    { id: 'showcase-home', product: 'Nyumba na samani', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85', video: '', isShowcase: true },
    { id: 'showcase-lifestyle', product: 'Bidhaa za kila siku', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85', video: '', isShowcase: true },
  ];
  const heroMedia = realHeroMedia.length ? realHeroMedia : showcaseMedia;

  useEffect(() => {
    const id = window.setInterval(() => setHeroSlide((currentSlide) => (currentSlide + 1) % 4), 4800);
    return () => window.clearInterval(id);
  }, []);

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
    const mediaUrl = current?.video || current?.image;
    if (!mediaUrl) { notify('Tangazo hili halina faili ya picha/video ya kupakua.'); return; }
    const a = document.createElement('a');
    a.href = mediaUrl;
    a.download = (String(current.product || 'sokora-bidhaa').trim().replace(/[^a-z0-9_-]+/gi, '-').slice(0, 60) || 'sokora-bidhaa') + (current.video ? '.mp4' : '.jpg');
    a.rel = 'noopener';
    a.target = '_blank';
    a.click();
  }

  function contactSeller(video) {
    const phone = String(video?.sellerPhone || '').replace(/[^0-9]/g, '');
    if (!phone || phone.length < 9) {
      notify('Muuzaji hajaweka namba ya WhatsApp. Kagua maelezo ya tangazo kabla ya kuwasiliana.');
      return;
    }
    const message = 'Habari, nimeona tangazo la ' + video.product + ' kwenye SOKORA. Bei: ' + money(video.price) + '. Je, bado linapatikana?';
    window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  }

  function saveLocalListing() {
    if (!uploadFile || !uploadCaption.trim() || !uploadPrice.trim()) {
      notify('Jaza maelezo, bei na uchague picha/video kwanza.'); return;
    }
    const localUrl = URL.createObjectURL(uploadFile);
    const localItem = {
      id: 'local-' + Date.now(), seller: authUser?.username ? '@' + authUser.username : '@wewe', sellerPhone: uploadPhone.trim(), product: uploadCaption.trim(),
      price: Number(uploadPrice.replace(/[^0-9]/g, '')) || 0, location: uploadLocation,
      category: 'Biashara', caption: uploadCaption.trim(), emoji: '🛍️',
      image: uploadFile.type.startsWith('image/') ? localUrl : '', video: uploadFile.type.startsWith('video/') ? localUrl : '',
      likes: 0, demo: true, local: true,
    };
    openSokoraListingsDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction('listings', 'readwrite');
      tx.objectStore('listings').put({ ...localItem, mediaBlob: uploadFile, mediaType: uploadFile.type, image: '', video: '' });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    })).then(() => notify('Tangazo limehifadhiwa kwenye kifaa hiki; bado halionekani kwa watumiaji wengine.'))
      .catch(() => notify('Tangazo limeongezwa kwa muda, lakini kifaa hakikuruhusu kulihifadhi kabisa.'));
    setVideos((old) => [localItem, ...old]);
    setQuery('');
    setCategory('Zote');
    closeModal();
    setUploadFile(null); setUploadCaption(''); setUploadPrice(''); setUploadPhone('');
  }

  return (
    <div className="app-shell">
      <header className={'site-header myshop-header ' + (authUser ? 'private-header' : 'public-header')}>
        <a className="brand" href="#home" aria-label="SOKORA nyumbani"><span className="brand-mark">S</span><span><strong>SOKORA</strong><small>TAZAMA · GUNDUA · NUNUA</small></span><span className="brand-country">Tanzania</span></a>
        {!authUser && <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta bidhaa..." aria-label="Tafuta SOKORA" onKeyDown={(e) => { if (e.key === 'Enter') document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }} /><button type="button" aria-label="Tafuta bidhaa" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>Tafuta</button></label>}
        <div className="header-actions"><button className="language-toggle" type="button" onClick={() => notify('Lugha ya Kiingereza itaongezwa kwenye mipangilio ya lugha.')}>EN</button>{!authUser ? <button className="gold-btn" onClick={() => openAuth('login')}>Ingia</button> : <button className="ghost-btn" onClick={logout}>Toka kwenye akaunti</button>}</div>
      </header>

      {!authUser ? <main id="home">
        <nav className="commerce-nav myshop-style-nav" aria-label="Urambazaji wa soko">
          <button className="commerce-nav-active" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Nyumbani</button>
          <button onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>Bidhaa</button>
          <button onClick={() => document.getElementById('sokora-shops')?.scrollIntoView({ behavior: 'smooth' })}>Maduka yote</button>
          <button onClick={() => { if (!authUser) { openAuth('login'); return; } setDashboardSection('saved'); document.querySelector('.account-layout')?.scrollIntoView({ behavior: 'smooth' }); }}>Bidhaa nilizohifadhi</button>
          <button onClick={() => openAuth('login')}>Ingia</button>
          <button onClick={() => authUser ? (setDashboardSection('settings'), document.querySelector('.account-layout')?.scrollIntoView({ behavior: 'smooth' })) : openAuth('login')}>Mipangilio</button>
        </nav>

        <section className="industry-hero">
          <aside className="industry-categories">
            <div className="industry-category-title">Nunua kwa kundi</div>
            {categories.filter((name) => name !== 'Zote').map((name, i) => <button key={name} onClick={() => { setCategory(name); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}><span className="category-symbol">{['▣','◇','⌂','▤','⚒','⌂','▦'][i]}</span><span>{name}</span><span className="category-chevron">›</span></button>)}
            <button className="all-category-link" onClick={() => { setCategory('Zote'); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Angalia makundi yote <span>→</span></button>
          </aside>
          <div className="industry-feature">
            <div className="industry-feature-copy">
              <p className="eyebrow">SOKORA · SOKO LA TANZANIA</p>
              <div className="hero-copy-slider" aria-live="polite" aria-atomic="true">
                <h1 key={heroSlide}>{['Nunua vizuri.','Uza kwa urahisi.','Gundua bidhaa.','Kuza biashara yako.'][heroSlide % 4]}<br /><span>{['Grow with SOKORA.','Kutoka Tanzania nzima.','Bei kwa TSh.','Kwa urahisi.'][heroSlide % 4]}</span></h1>
                <p key={'desc-'+heroSlide}>{['Nunua bidhaa kwa urahisi, wasiliana na wauzaji na gundua biashara mbalimbali kwenye jukwaa moja.','Tafuta bidhaa kulingana na kundi, bei na eneo la muuzaji kote Tanzania.','Linganisha matangazo halisi na wasiliana na muuzaji kabla ya kununua.','Una bidhaa za kuuza? Fungua akaunti ya muuzaji na anza kujenga biashara yako.'][heroSlide % 4]}</p>
              </div>
              <div className="hero-cta-row"><button className="industry-primary-cta" onClick={() => { setCategory('Zote'); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Gundua bidhaa <span>→</span></button><button className="hero-sell-cta" onClick={() => openAuth('register')}>Nataka kuuza <span>↗</span></button></div>
              <div className="industry-proof"><span>✓ Bei kwa TSh</span><span>✓ Wauzaji wa Tanzania</span><span>✓ Mawasiliano ya moja kwa moja</span></div>
              <div className="hero-slide-controls" aria-label="Badilisha ujumbe wa ukurasa mkuu"><button aria-label="Ujumbe uliotangulia" onClick={() => setHeroSlide((heroSlide + 3) % 4)}>‹</button>{[0,1,2,3].map((n) => <button key={n} className={heroSlide === n ? 'hero-dot active' : 'hero-dot'} aria-label={'Ujumbe '+(n+1)} aria-pressed={heroSlide===n} onClick={() => setHeroSlide(n)} />)}<button aria-label="Ujumbe unaofuata" onClick={() => setHeroSlide((heroSlide + 1) % 4)}>›</button></div>
            </div>
            <div className="industry-feature-art" aria-label="Picha na video za bidhaa zilizowekwa na wauzaji SOKORA">
              {heroMedia.length ? <div className="feature-photo feature-photo-main hero-media-slide" key={heroMedia[heroSlide % heroMedia.length].id}>{heroMedia[heroSlide % heroMedia.length].video ? <video src={heroMedia[heroSlide % heroMedia.length].video} muted playsInline autoPlay loop /> : <img src={heroMedia[heroSlide % heroMedia.length].image} alt={heroMedia[heroSlide % heroMedia.length].product} loading="lazy" />}<span>{heroMedia[heroSlide % heroMedia.length].isShowcase ? 'Picha ya kuonyesha kundi · ' + heroMedia[heroSlide % heroMedia.length].product : heroMedia[heroSlide % heroMedia.length].product}</span></div> : <div className="feature-photo-empty feature-photo-main"><strong>Picha halisi za bidhaa za Tanzania</strong><span>Zitaonekana hapa bidhaa zikiwekwa na wauzaji waliothibitishwa. Hatutumii picha za kubuni.</span></div>}
              {heroMedia.length > 1 ? <div className="feature-photo feature-photo-top hero-media-secondary" key={'secondary-'+heroMedia[(heroSlide+1)%heroMedia.length].id}>{heroMedia[(heroSlide+1)%heroMedia.length].video ? <video src={heroMedia[(heroSlide+1)%heroMedia.length].video} muted playsInline autoPlay loop /> : <img src={heroMedia[(heroSlide+1)%heroMedia.length].image} alt={heroMedia[(heroSlide+1)%heroMedia.length].product} loading="lazy" />}<span>{heroMedia[(heroSlide+1)%heroMedia.length].isShowcase ? 'Kundi · ' + heroMedia[(heroSlide+1)%heroMedia.length].product : heroMedia[(heroSlide+1)%heroMedia.length].product}</span></div> : null}
              {heroMedia.length > 2 ? <div className="feature-photo feature-photo-bottom hero-media-secondary" key={'third-'+heroMedia[(heroSlide+2)%heroMedia.length].id}>{heroMedia[(heroSlide+2)%heroMedia.length].video ? <video src={heroMedia[(heroSlide+2)%heroMedia.length].video} muted playsInline autoPlay loop /> : <img src={heroMedia[(heroSlide+2)%heroMedia.length].image} alt={heroMedia[(heroSlide+2)%heroMedia.length].product} loading="lazy" />}<span>{heroMedia[(heroSlide+2)%heroMedia.length].isShowcase ? 'Kundi · ' + heroMedia[(heroSlide+2)%heroMedia.length].product : heroMedia[(heroSlide+2)%heroMedia.length].product}</span></div> : null}
              <div className="feature-float float-top">Media za wauzaji</div><div className="feature-float float-bottom">SOKORA Tanzania</div>
            </div>
          </div>
          <aside className="industry-seller-panel">
            <div className="seller-panel-avatar">S</div><h2>Una biashara?</h2><p>Jiunge na SOKORA na anza kuandaa matangazo ya bidhaa zako.</p><button className="seller-join-btn" onClick={() => openAuth('register')}>Fungua akaunti</button><button className="seller-login-btn" onClick={() => openAuth('login')}>Tayari una akaunti? Ingia</button>
            <div className="seller-panel-divider"></div>
            <div className="seller-benefit"><span>✓</span><div><b>Wasifu wa muuzaji</b><small>Jitambulishe kwa wateja</small></div></div>
            <div className="seller-benefit"><span>✓</span><div><b>Matangazo ya bidhaa</b><small>Onyesha bei na eneo</small></div></div>
          </aside>
        </section>

        <section className="commerce-benefits" aria-label="Faida za SOKORA">
          <div><span className="benefit-icon">⌕</span><div><b>Tafuta kwa urahisi</b><small>Bidhaa, makundi na maeneo</small></div></div>
          <div><span className="benefit-icon">▤</span><div><b>Bei zilizo wazi</b><small>Bei za bidhaa kwa TSh</small></div></div>
          <div><span className="benefit-icon">↗</span><div><b>Wasiliana na muuzaji</b><small>Uliza kuhusu bidhaa moja kwa moja</small></div></div>
          <div><span className="benefit-icon">◎</span><div><b>Kwa Tanzania</b><small>Biashara kutoka mikoa mbalimbali</small></div></div>
        </section>

        
        <section className="market-category-section" aria-labelledby="market-category-title">
          <div className="section-heading"><div><p className="eyebrow">TAFUTA KWA MAKUNDI</p><h2 id="market-category-title">Makundi ya bidhaa</h2></div><button className="category-showcase-more" onClick={() => { setCategory('Zote'); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Angalia bidhaa zote →</button></div>
          <p className="market-category-intro">Chagua kundi moja ili kuchuja matangazo halisi yanayopatikana SOKORA.</p>
          <div className="market-category-grid">{marketplaceCategories.map(([name, filter]) => <button className="market-category-item" key={name} onClick={() => { setCategory(filter); setQuery(''); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}><span className="market-category-icon" aria-hidden="true">{filter === 'Nyumba' ? '⌂' : filter === 'Mitindo' ? '◇' : filter === 'Magari' ? '▰' : filter === 'Huduma' ? '✳' : filter === 'Elektroniki' ? '▣' : '▤'}</span><span>{name}</span><b>›</b></button>)}</div>
        </section>

        <section className="tanzania-sources" aria-labelledby="tanzania-sources-title">
          <div className="section-heading"><div><p className="eyebrow">BIASHARA ZA NDANI</p><h2 id="tanzania-sources-title">Gundua maduka ya Tanzania</h2></div><span className="source-note">Orodha ya maduka ya umma</span></div>
          <p className="tanzania-sources-intro">Chunguza bidhaa zinazouzwa na maduka ya Tanzania. Viungo hivi vinafungua katalogi za maduka husika; bei, upatikanaji, picha na video vinathibitishwa kwenye tovuti ya muuzaji.</p>
          <div className="tanzania-store-grid">
            <a className="tanzania-store-card" href="https://darshopping.co.tz/products" target="_blank" rel="noopener noreferrer"><span className="store-mark">DS</span><span className="store-copy"><strong>Dar Shopping</strong><small>Simu, vifaa vya nyumbani, kompyuta, mitindo</small><em>Katalogi ya bidhaa ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.rebumall.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">RM</span><span className="store-copy"><strong>Rebu Mall</strong><small>Wauzaji wa ndani, nguo, viatu, vifaa vya nyumbani</small><em>Angalia maduka ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.kichi.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">KC</span><span className="store-copy"><strong>Kichi Tanzania</strong><small>Simu, kompyuta, vifaa, nguo na viatu</small><em>Angalia bidhaa ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.naneka.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">NK</span><span className="store-copy"><strong>Naneka</strong><small>Vifaa vya elektroniki, simu na bidhaa za nyumbani</small><em>Nunua mtandaoni ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.shopping.co.tz/products/" target="_blank" rel="noopener noreferrer"><span className="store-mark">ST</span><span className="store-copy"><strong>Shopping.co.tz</strong><small>Elektroniki, vifaa vya nyumbani, groceries, zana na bidhaa nyingi</small><em>Angalia bidhaa ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.nuvia.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">NV</span><span className="store-copy"><strong>Nuvia</strong><small>Bidhaa kutoka maduka mengi ya ndani na makundi mbalimbali</small><em>Gundua maduka ↗</em></span></a>
            <a className="tanzania-store-card" href="https://myshop.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">MS</span><span className="store-copy"><strong>MyShop Tanzania</strong><small>Maduka na bidhaa za wauzaji wa Tanzania, bei kwa TSh</small><em>Angalia bidhaa mpya ↗</em></span></a>
            <a className="tanzania-store-card" href="https://sokoni.co.tz/?lang=en" target="_blank" rel="noopener noreferrer"><span className="store-mark">SK</span><span className="store-copy"><strong>Sokoni Tanzania</strong><small>Bidhaa, groceries, simu, vifaa, fashion na huduma za karibu</small><em>Gundua matangazo ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.sokoniapp.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">SA</span><span className="store-copy"><strong>Sokoni App</strong><small>Mboga, matunda, nafaka, viungo na bidhaa za chakula</small><em>Angalia katalogi ↗</em></span></a>
            <a className="tanzania-store-card" href="https://kariakoohub.com/" target="_blank" rel="noopener noreferrer"><span className="store-mark">KH</span><span className="store-copy"><strong>Kariakoo Hub</strong><small>Simu, kompyuta, elektroniki, samani na bidhaa za nyumbani</small><em>Angalia katalogi ↗</em></span></a>
            <a className="tanzania-store-card" href="https://www.nidadanish.com/" target="_blank" rel="noopener noreferrer"><span className="store-mark">ND</span><span className="store-copy"><strong>NidaDanish</strong><small>Vifaa vya nyumbani, elektroniki, fashion, hardware na zaidi</small><em>Angalia katalogi ↗</em></span></a>
            <a className="tanzania-store-card" href="https://impala.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">IP</span><span className="store-copy"><strong>Impala</strong><small>Elektroniki, vifaa vya nyumbani, zana na ujenzi</small><em>Angalia katalogi ↗</em></span></a>
            <a className="tanzania-store-card" href="https://findandgetgroup.com/shop" target="_blank" rel="noopener noreferrer"><span className="store-mark">FG</span><span className="store-copy"><strong>Find &amp; Get</strong><small>Bidhaa za familia, watoto, urembo na afya</small><em>Angalia bidhaa ↗</em></span></a>
            <a className="tanzania-store-card" href="https://zudua.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">ZU</span><span className="store-copy"><strong>Zudua</strong><small>Nyumbani, jikoni, shule, mitindo na lifestyle</small><em>Tembelea duka ↗</em></span></a>
            <a className="tanzania-store-card" href="https://unustore.co.tz/" target="_blank" rel="noopener noreferrer"><span className="store-mark">UN</span><span className="store-copy"><strong>Unustore</strong><small>Elektroniki, simu, kompyuta na wauzaji wa Tanzania</small><em>Gundua bidhaa ↗</em></span></a>
          </div>
          <div className="tanzania-source-note"><strong>Kwa nini bidhaa hizi hazijaingizwa kama matangazo ya SOKORA?</strong><span>Viungo hivi vinafungua katalogi za wauzaji; si uagizaji wa bidhaa ndani ya SOKORA. Picha/video za ukurasa mkuu sasa zinatokana na matangazo halisi ya SOKORA yanapopatikana—picha za stock zisizohusiana hazitumiki tena. Ili kuonyesha katalogi nzima ya maduka haya ndani ya SOKORA, tunahitaji API/feed rasmi au ruhusa ya wauzaji, pamoja na njia ya kusawazisha bei na stock. Hatutadai bidhaa inapatikana sasa bila uthibitisho.</span></div>
        </section>

        <section className="category-showcase-section" aria-labelledby="popular-categories-title">
          <div className="section-heading"><div><p className="eyebrow">TAFUTA KWA MAKUNDI</p><h2 id="popular-categories-title">Vikundi Maarufu</h2></div><button className="category-showcase-more" onClick={() => { setCategory('Zote'); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Tazama vyote →</button></div>
          <div className="category-showcase-grid">
            {categoryShowcases.map((item) => <button className="category-showcase-card" key={item.name} onClick={() => { setCategory(item.filter); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }} aria-label={'Gundua kundi: ' + item.name}>
              <img src={item.image} alt={item.alt} loading="lazy" />
              <span className="category-showcase-shade" />
              <span className="category-showcase-copy"><strong>{item.name}</strong><small>Picha ya kuonyesha kundi</small></span>
              <span className="category-showcase-arrow" aria-hidden="true">→</span>
            </button>)}
          </div>
        </section>

        <section className="seller-media-showcase" aria-labelledby="seller-media-title">
          <div className="section-heading"><div><p className="eyebrow">GUNDUA KWA PICHA</p><h2 id="seller-media-title">Media za wauzaji</h2></div><button className="category-showcase-more" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>Tazama bidhaa zote →</button></div>
          <div className="seller-media-showcase-grid">
            {sellerMediaShowcase.map((item) => <button className="seller-media-showcase-card" key={item.title} onClick={() => { setQuery(item.title.split(' ')[0]); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>
              <img src={item.image} alt={item.title} loading="lazy" /><span className="seller-media-play" aria-hidden="true">▶</span><strong>{item.title}</strong><small>{item.region} · Picha ya kuonyesha kundi</small>
            </button>)}
          </div>
          <p className="showcase-disclaimer">Picha hizi ni za kuonyesha makundi tu; si matangazo ya wauzaji halisi. Matangazo halisi yataonekana kwenye orodha ya bidhaa yakitolewa na API ya SOKORA.</p>
        </section>

        <section className="video-showcase-section" aria-labelledby="video-showcase-title">
          <div className="section-heading"><div><p className="eyebrow">TAZAMA KABLA YA KUNUNUA</p><h2 id="video-showcase-title">Video za kuangalia bidhaa</h2></div><button className="category-showcase-more" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>Nenda kwenye soko →</button></div>
          <div className="video-showcase-grid">
            {videoShowcase.map((item) => <article className="video-showcase-card" key={item.title}>
              <video controls playsInline preload="none" poster={item.poster} aria-label={'Video ya kuonyesha ' + item.title}>
                <source src={item.video} type="video/mp4" />
                Kivinjari chako hakiwezi kucheza video hii.
              </video>
              <div className="video-showcase-caption"><strong>{item.title}</strong><span>Video ya mfano · si tangazo la muuzaji</span><button onClick={() => { setCategory(item.category); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Gundua kundi →</button></div>
            </article>)}
          </div>
          <p className="showcase-disclaimer">Video hizi ni za kuonyesha muundo wa video kwenye SOKORA, si bidhaa zinazouzwa wala video za wauzaji wetu. Video halisi za wauzaji zitaonekana hapa kupitia API ya SOKORA zikishapakiwa.</p>
        </section>

        
        <section className="sokora-shops-section" id="sokora-shops" aria-labelledby="sokora-shops-title">
          <div className="section-heading"><div><p className="eyebrow">MADUKA YA TANZANIA</p><h2 id="sokora-shops-title">Maduka yote</h2></div><button className="category-showcase-more" onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' })}>Bidhaa zote →</button></div>
          <p className="market-category-intro">Maduka hapa hutokana na matangazo halisi yaliyopokelewa na SOKORA API. Hatubuni maduka au majina ya wauzaji.</p>
          {shopSummaries.length ? <div className="sokora-shops-grid">{shopSummaries.slice(0,8).map((shop) => <article className="sokora-shop-card" key={shop.seller}><div className="sokora-shop-avatar">{shop.seller.replace(/^@/,'').slice(0,2).toUpperCase()}</div><div className="sokora-shop-copy"><strong>{shop.seller}</strong><span>{shop.location}</span><small>{shop.count} tangazo{shop.count===1?'':' '} kwenye soko</small></div><button onClick={() => { setQuery(shop.seller.replace(/^@/,'')); document.getElementById('marketplace-products')?.scrollIntoView({ behavior: 'smooth' }); }}>Tazama duka</button></article>)}</div> : <div className="shops-empty-state"><span>▦</span><div><strong>Maduka ya SOKORA yataonekana hapa</strong><p>Kwa sasa API haijarudisha matangazo ya wauzaji. Tunapoanza kupokea matangazo halisi, maduka yataorodheshwa hapa moja kwa moja.</p></div><button onClick={() => openAuth('register')}>Anza kuuza</button></div>}
        </section>

        <section className="market-section" id="marketplace-products">
          <div className="section-heading"><div><p className="eyebrow">BIDHAA ZA SASA</p><h2>Bidhaa za hivi karibuni</h2></div><span className="source-note">{mode === 'loading' ? 'Inapakia soko…' : mode === 'video-api' ? 'Video kutoka API' : mode === 'api' ? 'Bidhaa kutoka API' : mode === 'empty-api' ? 'Hakuna matangazo bado' : mode === 'api-error' ? 'API haipatikani' : 'Data za mfano'}</span></div>
          <div className="category-row" aria-label="Makundi ya bidhaa">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <div className="result-line"><span>{filtered.length} matokeo</span><label className="sort-label">Panga kwa <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="recommended">Vinavyopendekezwa</option><option value="price-low">Bei: chini kwenda juu</option><option value="price-high">Bei: juu kwenda chini</option></select></label></div>
          {mode === 'api-error' ? <div className="empty-state"><span>⚠</span><h3>Imeshindikana kupakia soko</h3><p>Muunganisho wa API umeshindwa. Jaribu tena baada ya muda; bidhaa za mfano hazitaonyeshwa kama bidhaa halisi.</p><button className="gold-btn" onClick={() => window.location.reload()}>Jaribu tena</button></div> : mode === 'loading' ? <div className="empty-state"><span>…</span><h3>Inapakia matangazo</h3><p>Tunasoma bidhaa kutoka SOKORA API.</p></div> : mode === 'empty-api' && !filtered.length ? <div className="empty-market-state"><div className="empty-state"><span>🛍️</span><h3>Bado hakuna matangazo ya umma</h3><p>Bidhaa halisi zitaonekana hapa baada ya wauzaji kuweka matangazo kupitia API. Kwa sasa unaweza kuvinjari makundi haya kwa picha.</p></div><div className="empty-market-gallery" aria-label="Picha za makundi ya bidhaa"><div className="empty-market-gallery-heading"><h3>Gundua kwa picha</h3><p>Picha za kuonyesha makundi, si matangazo ya bidhaa zinazopatikana sasa.</p></div><div className="empty-market-gallery-grid">{categoryShowcases.map((item) => <button className="empty-market-image-card" key={item.name} onClick={() => { setCategory(item.filter); setQuery(''); }}><img src={item.image} alt={item.alt} loading="lazy" /><span className="empty-market-image-shade" /><strong>{item.name}</strong><span className="empty-market-image-arrow">→</span></button>)}</div></div></div> : filtered.length ? <><div className="product-grid">{filtered.slice(0, visibleProducts).map((video) => <article className="product-card" key={video.id}>
            <button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>
              {video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <div className="media-placeholder"><span aria-hidden="true">▧</span><strong>Picha haijawekwa</strong><small>Muuzaji hajaongeza picha</small></div>}
              {(video.video || video.image) && <span className="media-tag">{video.video ? '▶ VIDEO' : 'PICHA'}</span>}
            </button>
            <div className="product-content"><div className="seller-line"><span className="seller-avatar">{(video.seller || 'S').replace('@','').slice(0,2).toUpperCase()}</span><span>{video.seller}</span><button className={'follow-mini ' + (following[video.seller] ? 'following' : '')} onClick={() => { setFollowing((old) => ({ ...old, [video.seller]: !old[video.seller] })); notify('Ufuatiliaji huu ni wa kivinjari hiki tu.'); }}>{following[video.seller] ? '✓' : '+'}</button></div><h3>{video.product}</h3><p className="product-caption">{video.caption}</p><div className="product-bottom"><strong>{money(video.price)}</strong><span>⌖ {video.location}</span></div><div className="card-actions"><button onClick={() => { setLiked((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Like imehifadhiwa kwenye hali ya kivinjari hiki tu.'); }} className={liked[video.id] ? 'is-liked' : ''}>{liked[video.id] ? '♥' : '♡'} <span>{Number(video.likes || 0) + (liked[video.id] ? 1 : 0)}</span></button><button onClick={() => { setSelected(video); askDemo('comments'); }}>▢ Maoni</button><button onClick={() => shareVideo(video)}>↗ Shiriki</button><button onClick={() => { setSaved((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Hifadhi ni ya kivinjari hiki tu.'); }}>{saved[video.id] ? '★' : '☆'}</button></div></div>
          </article>)}</div>{filtered.length > visibleProducts ? <div className="view-more-wrap"><button className="view-more-btn" onClick={() => setVisibleProducts((count) => count + 12)}>View more <span>· Onyesha bidhaa zaidi</span> <b>↓</b></button><small>Unaona {Math.min(visibleProducts, filtered.length)} kati ya {filtered.length} bidhaa na video</small></div> : visibleProducts > 12 && filtered.length ? <div className="view-more-wrap"><button className="view-more-btn view-less-btn" onClick={() => { setVisibleProducts(12); document.getElementById('marketplace-products')?.scrollIntoView({behavior:'smooth'}); }}>View less <span>· Onyesha chache</span> <b>↑</b></button></div> : null}</> : <div className="empty-state"><span>⌕</span><h3>Hakuna kilichopatikana</h3><p>Badili neno la utafutaji au chagua kundi jingine.</p><button className="gold-btn" onClick={() => { setQuery(''); setCategory('Zote'); }}>Ondoa vichujio</button></div>}
        </section>

        <section className="seller-banner"><div className="banner-icon">↗</div><div><p className="eyebrow">WEKA BIASHARA YAKO</p><h2>Bidhaa yako inastahili kuonekana.</h2><p>Andaa tangazo lenye picha au video, bei na eneo la biashara yako.</p></div>{authUser && <button className="gold-btn" onClick={() => askDemo('upload')}>＋ Tengeneza tangazo</button>}</section>
        <p className="disclaimer">SOKORA · Bei na maelezo hutegemea taarifa zilizotolewa na wauzaji. Hakikisha unathibitisha bidhaa kabla ya kufanya malipo.</p>
        
        <footer className="marketplace-footer">
          <div className="marketplace-footer-brand"><a className="brand footer-brand" href="#home"><span className="brand-mark">S</span><span><strong>SOKORA</strong><small>TAZAMA · GUNDUA · NUNUA</small></span></a><p>SOKORA ni soko la mtandaoni linalowaunganisha wanunuzi na wauzaji nchini Tanzania.</p><span className="footer-country">Tanzania</span></div>
          <div className="marketplace-footer-column"><strong>Viungo vya haraka</strong><button onClick={() => document.getElementById('marketplace-products')?.scrollIntoView({behavior:'smooth'})}>Bidhaa</button><button onClick={() => document.getElementById('sokora-shops')?.scrollIntoView({behavior:'smooth'})}>Maduka yote</button><button onClick={() => authUser ? setDashboardSection('saved') : openAuth('login')}>Zilizohifadhiwa</button><button onClick={() => openAuth('register')}>Anza kuuza</button></div>
          <div className="marketplace-footer-column"><strong>Makundi maarufu</strong>{marketplaceCategories.slice(0,5).map(([name,filter]) => <button key={name} onClick={() => { setCategory(filter); document.getElementById('marketplace-products')?.scrollIntoView({behavior:'smooth'}); }}>{name}</button>)}</div>
          <div className="marketplace-footer-column"><strong>Msaada na taarifa</strong><button onClick={() => notify('Taarifa za SOKORA zitaongezwa hapa.')}>Kuhusu SOKORA</button><button onClick={() => notify('Masharti ya matumizi yatachapishwa hapa.')}>Masharti ya matumizi</button><button onClick={() => notify('Sera ya faragha itaongezwa hapa.')}>Sera ya faragha</button><button onClick={() => notify('Tafadhali tumia njia rasmi za mawasiliano za SOKORA.')}>Msaada kwa wateja</button></div>
          <div className="marketplace-footer-bottom"><span>© {new Date().getFullYear()} SOKORA Tanzania.</span><span>Bei huonyeshwa kwa TSh pale zinapotolewa na muuzaji.</span></div>
        </footer>
      </main> : <main className={'account-layout ' + (navHidden ? 'nav-is-hidden' : '')}>
        {!navHidden && <aside className="account-sidebar" aria-label="Menyu ya akaunti">
          <div className="account-identity"><span className="account-avatar">{String(authUser.display_name || authUser.displayName || authUser.username || 'S').slice(0,1).toUpperCase()}</span><div><strong>{authUser.display_name || authUser.displayName || authUser.username || 'Akaunti ya SOKORA'}</strong><small>@{authUser.username || 'mtumiaji'}</small></div></div>
          <p className="sidebar-caption">MENYU KUU</p>
          {[['dashboard','▦','Muhtasari'],['marketplace','⌕','Gundua soko'],['upload','＋','Weka bidhaa'],['orders','▤','Maagizo yangu'],['following','♡','Ninaowafuata'],['saved','☆','Bidhaa nilizohifadhi'],['listings','▣','Matangazo yangu'],['profile','◉','Wasifu wangu'],['settings','⚙','Mipangilio']].map(([id,icon,label]) => <button key={id} className={'account-menu-item ' + (dashboardSection === id ? 'active' : '')} onClick={() => { if (id === 'upload') { askDemo('upload'); return; } setDashboardSection(id); if (id === 'marketplace') { setQuery(''); setCategory('Zote'); } }}><span>{icon}</span>{label}{id === 'saved' && Object.values(saved).filter(Boolean).length > 0 && <small>{Object.values(saved).filter(Boolean).length}</small>}</button>)}
          <div className="sidebar-help"><b>Karibu SOKORA</b><p>Tazama. Gundua. Nunua.</p><button onClick={() => setDashboardSection('marketplace')}>Endelea sokoni ↗</button></div>
        </aside>}
        <section className="account-main">
          <div className="account-topline"><div><p className="eyebrow">AKAUNTI YA SOKORA</p><h1>{({dashboard:'Karibu tena',marketplace:'Gundua soko',orders:'Maagizo yangu',following:'Ninaowafuata',saved:'Bidhaa nilizohifadhi',listings:'Matangazo yangu',profile:'Wasifu wangu',settings:'Mipangilio'})[dashboardSection] || 'Akaunti yako'}</h1><p>{dashboardSection === 'dashboard' ? 'Muhtasari wa akaunti yako.' : 'Chagua sehemu unayotaka.'}</p></div><span className="account-role">{authUser.role || 'MTUMIAJI'}</span></div>
          {dashboardSection === 'dashboard' && <><div className="dashboard-welcome"><div><span className="welcome-pill">✓ UMEINGIA</span><h2>Habari, {authUser.display_name || authUser.displayName || authUser.username || 'mteja'}!</h2><p>Anza kuchunguza bidhaa, hifadhi unazopenda au weka tangazo lako la biashara.</p><button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Gundua bidhaa →</button></div><div className="welcome-art" aria-hidden="true"><span>✦</span><strong>SOKORA</strong><small>TAZAMA · GUNDUA · NUNUA</small></div></div>
            <div className="account-stat-grid"><article><span className="stat-icon">♡</span><small>Unazofuata</small><strong>{Object.values(following).filter(Boolean).length}</strong><p>Wauzaji unaowafuatilia kwenye kifaa hiki</p></article><article><span className="stat-icon gold">☆</span><small>Bidhaa ulizohifadhi</small><strong>{Object.values(saved).filter(Boolean).length}</strong><p>Bidhaa ulizoweka kwenye orodha yako</p></article><article><span className="stat-icon coral">♥</span><small>Bidhaa ulizopenda</small><strong>{Object.values(liked).filter(Boolean).length}</strong><p>Mapendeleo yaliyohifadhiwa kwenye kivinjari</p></article></div>
            <div className="dashboard-section-head"><p className="eyebrow">NJIA ZA MKATO</p></div><div className="shortcut-grid"><button onClick={() => setDashboardSection('marketplace')}><span>⌕</span><b>Gundua bidhaa</b><small>Tafuta bidhaa na biashara</small></button><button onClick={() => setDashboardSection('saved')}><span>☆</span><b>Bidhaa nilizohifadhi</b><small>Angalia ulizohifadhi</small></button></div><div className="account-note"><span>ⓘ</span><p>Maagizo, malipo na chat zitaonekana hapa baada ya API zake kuunganishwa; hatuonyeshi shughuli za kubuni kama data halisi.</p></div></>}
          {dashboardSection === 'marketplace' && <section className="account-marketplace"><div className="section-heading"><div><p className="eyebrow">SOKO LA TANZANIA</p><h2>Bidhaa na biashara</h2></div><span className="source-note">{mode === 'api-error' ? 'API haipatikani' : mode === 'loading' ? 'Inapakia…' : mode === 'empty-api' ? 'Hakuna matangazo' : 'Matangazo yanayoonekana'}</span></div><div className="feed-mode-tabs" role="tablist" aria-label="Aina ya feed"><button role="tab" aria-selected={feedTab === 'for-you'} className={feedTab === 'for-you' ? 'active' : ''} onClick={() => setFeedTab('for-you')}>Kwa ajili yako</button><button role="tab" aria-selected={feedTab === 'following'} className={feedTab === 'following' ? 'active' : ''} onClick={() => setFeedTab('following')}>Ninaowafuata</button><button role="tab" aria-selected={feedTab === 'nearby'} className={feedTab === 'nearby' ? 'active' : ''} onClick={() => setFeedTab('nearby')}>Karibu nami</button>{feedTab === 'nearby' && <label className="nearby-region-label">Mkoa <select value={nearbyRegion} onChange={(e) => setNearbyRegion(e.target.value)}>{['Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga','Kaskazini Unguja','Kusini Unguja','Mjini Magharibi','Kaskazini Pemba','Kusini Pemba'].map((region) => <option key={region} value={region}>{region}</option>)}</select></label>}</div><label className="account-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta bidhaa, muuzaji au eneo..." /></label><div className="category-row">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>{mode === 'api-error' ? <div className="empty-state"><h3>Soko halijapatikana</h3><p>Muunganisho wa API haujapatikana. Jaribu tena baadaye.</p><button className="gold-btn" onClick={() => window.location.reload()}>Jaribu tena</button></div> : filtered.length ? <div className="product-grid">{filtered.map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>{video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <div className="media-placeholder"><span aria-hidden="true">▧</span><strong>Picha haijawekwa</strong><small>Muuzaji hajaongeza picha</small></div>}{(video.video || video.image) && <span className="media-tag">{video.video ? '▶ VIDEO' : 'PICHA'}</span>}</button><div className="product-content"><div className="seller-line"><span className="seller-avatar">{(video.seller || 'S').replace('@','').slice(0,2).toUpperCase()}</span><span>{video.seller}</span><button className={'follow-mini ' + (following[video.seller] ? 'following' : '')} onClick={() => setFollowing((old) => ({ ...old, [video.seller]: !old[video.seller] }))}>{following[video.seller] ? '✓' : '+'}</button></div><h3>{video.product}</h3><p className="product-caption">{video.caption}</p><div className="product-bottom"><strong>{money(video.price)}</strong><span>⌖ {video.location}</span></div><div className="card-actions"><button onClick={() => setLiked((old) => ({ ...old, [video.id]: !old[video.id] }))} className={liked[video.id] ? 'is-liked' : ''}>{liked[video.id] ? '♥' : '♡'} {Number(video.likes || 0) + (liked[video.id] ? 1 : 0)}</button><button onClick={() => { setSelected(video); askDemo('comments'); }}>▢ Maoni</button><button onClick={() => shareVideo(video)}>↗ Shiriki</button><button onClick={() => setSaved((old) => ({ ...old, [video.id]: !old[video.id] }))}>{saved[video.id] ? '★' : '☆'}</button></div></div></article>)}</div> : <div className="empty-state"><h3>{feedTab === 'following' ? 'Bado huwafuati wauzaji' : feedTab === 'nearby' ? 'Hakuna matangazo katika eneo hili' : 'Hakuna bidhaa zilizopatikana'}</h3><p>{feedTab === 'following' ? 'Fuata wauzaji kutoka sokoni ili kuona matangazo yao hapa.' : feedTab === 'nearby' ? 'Matokeo yanategemea eneo lililochaguliwa na eneo lililotajwa kwenye tangazo.' : 'Jaribu kutafuta kwa jina jingine au badili kundi.'}</p><button className="ghost-btn" onClick={() => { setFeedTab('for-you'); setCategory('Zote'); setQuery(''); }}>Rudisha Kwa ajili yako</button></div>}</section>}
          {dashboardSection === 'orders' && <div className="account-empty-panel"><span>▤</span><h2>Maagizo yako</h2><p>Historia ya maagizo itaonekana baada ya checkout na API ya maagizo kuunganishwa.</p></div>}
          {dashboardSection === 'following' && <div className="account-empty-panel"><span>♡</span><h2>Wauzaji unaowafuata</h2><p>Ufuatiliaji uliopo sasa umehifadhiwa kwenye kivinjari hiki, si kwenye akaunti ya seva.</p><button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Tafuta wauzaji</button></div>}
          {dashboardSection === 'saved' && <div className="account-empty-panel"><span>☆</span><h2>Bidhaa ulizohifadhi</h2>{filtered.filter((v) => saved[v.id]).length ? <div className="product-grid">{filtered.filter((v) => saved[v.id]).map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }}>{video.image ? <img src={video.image} alt={video.product} /> : <span>{video.emoji}</span>}</button><div className="product-content"><h3>{video.product}</h3><strong>{money(video.price)}</strong></div></article>)}</div> : <p>Bado hujahifadhi bidhaa zinazopatikana kwenye orodha hii.</p>}<button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Gundua bidhaa</button></div>}
          {dashboardSection === 'listings' && <div className="account-empty-panel"><span>▣</span><h2>Matangazo yangu</h2><p>Hapa unaona matangazo uliyohifadhi kwenye kifaa hiki. Bado hayajachapishwa kwa watumiaji wengine kwa sababu upload API na storage ya media havijaunganishwa.</p>{videos.filter((v) => v.local).length ? <div className="product-grid">{videos.filter((v) => v.local).map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>{video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <span className="product-emoji">{video.emoji || '🛍️'}</span>}<span className="media-tag">KIFAA HIKI</span></button><div className="product-content"><h3>{video.product}</h3><strong>{money(video.price)}</strong><p className="product-caption">{video.location}</p><button className="ghost-btn" onClick={() => { setSelected(video); askDemo('details'); }}>Angalia tangazo</button></div></article>)}</div> : <p>Bado hujaweka tangazo kwenye kifaa hiki.</p>}<button className="gold-btn" onClick={() => askDemo('upload')}>＋ Weka tangazo</button></div>}
          {dashboardSection === 'profile' && <div className="profile-panel"><span className="profile-avatar-large">{String(authUser.display_name || authUser.displayName || authUser.username || 'S').slice(0,1).toUpperCase()}</span><div><p className="eyebrow">WASIFU WAKO</p><h2>{authUser.display_name || authUser.displayName || authUser.username}</h2><p>@{authUser.username}</p><p className="modal-muted">{authUser.email || 'Hakuna email iliyowekwa'} · {authUser.phone || 'Hakuna simu iliyowekwa'}</p><button className="ghost-btn" onClick={() => notify('Kuhariri wasifu kutawashwa baada ya endpoint ya profile kuunganishwa.')}>Hariri wasifu</button></div></div>}
          {dashboardSection === 'settings' && <div className="account-empty-panel"><span>⚙</span><h2>Mipangilio</h2><p>Session yako imelindwa na token ya akaunti. Unaweza kutoka kwenye kifaa hiki kwa kitufe cha “Toka”.</p><button className="ghost-btn" onClick={logout}>Toka kwenye akaunti</button></div>}
        </section>
      </main>}

      {toast && <div className="toast" role="status">{toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={closeModal} aria-label="Funga">×</button>
        {modal === 'details' && current && <><p className="eyebrow">TAARIFA ZA TANGAZO</p><h2>{current.product}</h2>{current.video ? <video className="detail-media" style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: 12, background: "#080808" }} src={current.video} controls playsInline preload="metadata" /> : current.image ? <img className="detail-media" style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: 12, background: "#080808" }} src={current.image} alt={current.product} /> : null}<p className="modal-price">{money(current.price)}</p><p>{current.caption}</p><p className="modal-muted">Muuzaji: {current.seller} · {current.location}</p><p className="modal-muted">Usitume malipo kabla ya kuthibitisha bidhaa na muuzaji. Kagua bidhaa na tumia njia salama ya malipo.</p><div className="modal-actions"><button className="gold-btn" onClick={() => contactSeller(current)}>Wasiliana WhatsApp</button><button className="ghost-btn" onClick={() => shareVideo(current)}>Shiriki bidhaa</button><button className="ghost-btn" onClick={() => { setSelected(current); setModal('comments'); }}>Maoni</button><button className="ghost-btn" onClick={downloadSelected}>Pakua picha/video</button><button className="ghost-btn" onClick={closeModal}>Rudi sokoni</button></div></>}
        {modal === 'login' && <><p className="eyebrow">AKAUNTI YA SOKORA</p><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu SOKORA'}</h2><p>{authMode === 'register' ? 'Jisajili ili uweze kuanza kuweka biashara na kufuatilia wauzaji.' : 'Ingia kwa username, email au namba ya simu.'}</p><form className="auth-form" onSubmit={submitAuth}>
          {authMode === 'register' ? <><label className="field-label">Jina kamili<input autoComplete="name" value={authDisplayName} onChange={(e) => setAuthDisplayName(e.target.value)} required minLength={2} maxLength={80} /></label><label className="field-label">Username<input autoComplete="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="mfano_joseph" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" /></label><label className="field-label">Namba ya simu au email<input type="text" autoComplete="username" value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} placeholder="+255... au jina@email.com" required /></label></> : <label className="field-label">Username, email au simu<input autoComplete="username" value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} required /></label>}
          <label className="field-label">Password<input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength={authMode === 'register' ? 10 : 1} maxLength={128} /></label>
          {authMode === 'register' && <p className="modal-muted">Tumia password ya angalau herufi 10. Hifadhi kwa usalama; usimpe mtu mwingine.</p>}
          <button className="gold-btn" type="submit" disabled={authBusy}>{authBusy ? 'Inashughulikia...' : authMode === 'register' ? 'Fungua akaunti' : 'Ingia'}</button>
        </form><p className="auth-switch">{authMode === 'register' ? 'Tayari una akaunti?' : 'Bado huna akaunti?'} <button type="button" className="text-link" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Ingia' : 'Jisajili'}</button></p></>}
        {modal === 'live' && <><p className="eyebrow"><span className="live-dot"></span> LIVE</p><h2>Maonyesho ya moja kwa moja</h2><p>LIVE halisi haijaunganishwa bado. Inahitaji huduma ya streaming, akaunti ya muuzaji na udhibiti wa usalama. Hatuonyeshi video ya moja kwa moja ya kubuni.</p><button className="gold-btn" onClick={closeModal}>Sawa</button></>}
        {modal === 'comments' && current && <><p className="eyebrow">MAONI</p><h2>{current.product}</h2><div className="comment-list">{(comments[current.id] || []).map((comment, i) => <p key={i}><b>{comment.name}</b><br />{comment.text}</p>)}{!(comments[current.id] || []).length && <p className="modal-muted">Bado hakuna maoni yaliyowekwa kwenye kivinjari hiki.</p>}</div><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Andika maoni..." rows="3" /><button className="gold-btn" onClick={() => { if (!commentText.trim()) return; setComments((old) => ({ ...old, [current.id]: [...(old[current.id] || []), { name: 'Wewe (kifaa hiki)', text: commentText.trim() }] })); setCommentText(''); notify('Maoni yameongezwa kwenye kifaa hiki tu.'); }}>Ongeza maoni</button></>}
        {modal === 'upload' && authUser && <><p className="eyebrow">TANGAZO JIPYA</p><h2>Weka bidhaa au video</h2><p>Uwekaji wa picha/video za umma bado unasubiri media storage na API ya upload. Hatutakuambia tangazo limechapishwa kwa wengine mpaka huduma hiyo iunganishwe.</p><label className="field-label">Picha au video<input type="file" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></label><label className="field-label">Jina/maelezo ya bidhaa<input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Mf. Simu Samsung..." /></label><label className="field-label">Bei kwa TSh<input inputMode="numeric" value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="25000" /></label><label className="field-label">Mkoa wa bidhaa<select value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)} required>{['Arusha','Dar es Salaam','Dodoma','Geita','Iringa','Kagera','Katavi','Kigoma','Kilimanjaro','Lindi','Manyara','Mara','Mbeya','Morogoro','Mtwara','Mwanza','Njombe','Pwani','Rukwa','Ruvuma','Shinyanga','Simiyu','Singida','Songwe','Tabora','Tanga','Kaskazini Unguja','Kusini Unguja','Mjini Magharibi','Kaskazini Pemba','Kusini Pemba'].map((region) => <option key={region} value={region}>{region}</option>)}</select></label><label className="field-label">Namba ya WhatsApp ya biashara (hiari)<input type="tel" value={uploadPhone} onChange={(e) => setUploadPhone(e.target.value)} placeholder="2557XXXXXXXX" /></label>{uploadFile && <p className="modal-muted">Faili: {uploadFile.name} · {(uploadFile.size / 1048576).toFixed(1)} MB</p>}<div className="modal-actions"><button className="gold-btn" onClick={saveLocalListing}>Ongeza kwenye kifaa hiki</button><button className="ghost-btn" onClick={closeModal}>Ghairi</button></div></>}
      </section></div>}
    </div>
  );
}
