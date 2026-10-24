import { useEffect, useMemo, useState } from 'react';

const API = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const categories = ['Zote', 'Elektroniki', 'Mitindo', 'Nyumba', 'Magari', 'Huduma', 'Vyumba vya kupanga', 'Biashara'];
const seedVideos = [
  { id: 'demo-phone', seller: '@jiji_gadgets_tz', product: 'Simu janja ya kisasa', price: 450000, location: 'Dar es Salaam', category: 'Elektroniki', caption: 'Simu za kisasa kwa bei rafiki 🇹🇿 Uliza kuhusu stock na delivery.', emoji: '📱', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', likes: 1200, demo: true },
  { id: 'demo-shoes', seller: '@mariam_fashion', product: 'Viatu vya mtindo', price: 65000, location: 'Arusha', category: 'Mitindo', caption: 'Mitindo mipya imefika. Uliza kuhusu rangi na size zinazopatikana.', emoji: '👟', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80', likes: 846, demo: true },
  { id: 'demo-sofa', seller: '@mama_neema_home', product: 'Kiti cha sebuleni', price: 220000, location: 'Mwanza', category: 'Nyumba', caption: 'Boresha nyumba yako kwa samani zilizotengenezwa kwa umakini.', emoji: '🪑', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80', likes: 532, demo: true },
  { id: 'demo-laptop', seller: '@jmk_tech', product: 'Laptop kwa kazi na masomo', price: 780000, location: 'Dodoma', category: 'Elektroniki', caption: 'Laptop kwa kazi, biashara na masomo. Wasiliana kwa maelezo.', emoji: '💻', image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80', likes: 319, demo: true },
  { id: 'demo-watch', seller: '@smart_zone_tz', product: 'Smartwatch ya michezo', price: 85000, location: 'Dar es Salaam', category: 'Elektroniki', caption: 'Smartwatch yenye muonekano wa kisasa. Uliza kuhusu dhamana na delivery.', emoji: '⌚', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=85', likes: 284, demo: true },
  { id: 'demo-camera', seller: '@pixel_hub', product: 'Kamera kwa content creators', price: 540000, location: 'Dodoma', category: 'Elektroniki', caption: 'Kwa picha na video za biashara yako. Wasiliana kuthibitisha stock.', emoji: '📷', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85', likes: 192, demo: true },
  { id: 'demo-chair', seller: '@mwanza_furniture', product: 'Samani za nyumbani', price: 180000, location: 'Mwanza', category: 'Nyumba', caption: 'Samani za nyumba na ofisi. Uliza vipimo na gharama ya usafirishaji.', emoji: '🪑', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1000&q=85', likes: 177, demo: true },
  { id: 'demo-bag', seller: '@urban_style_tz', product: 'Mkoba wa kila siku', price: 42000, location: 'Arusha', category: 'Mitindo', caption: 'Muonekano safi kwa matumizi ya kila siku. Uliza rangi zinazopatikana.', emoji: '👜', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=1000&q=85', likes: 231, demo: true },
  { id: 'demo-headphones', seller: '@jmk_tech', product: 'Headphones za wireless', price: 68000, location: 'Dodoma', category: 'Elektroniki', caption: 'Sikiliza muziki na hudhuria mikutano. Hakiki stock kabla ya kulipa.', emoji: '🎧', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1000&q=85', likes: 356, demo: true },
  { id: 'demo-sneakers', seller: '@mariam_fashion', product: 'Sneakers za mitaani', price: 55000, location: 'Arusha', category: 'Mitindo', caption: 'Viatu vya mtindo mbalimbali. Uliza size na rangi zilizopo.', emoji: '👟', image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1000&q=85', likes: 411, demo: true },
  { id: 'demo-car', seller: '@motor_hub_tz', product: 'Gari na huduma za magari', price: 18500000, location: 'Dar es Salaam', category: 'Magari', caption: 'Mfano wa tangazo la magari. Hakiki nyaraka na hali ya gari ana kwa ana.', emoji: '🚙', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1000&q=85', likes: 128, demo: true },
  { id: 'demo-house', seller: '@makazi_tanzania', product: 'Nyumba na vyumba vya kupanga', price: 250000, location: 'Dodoma', category: 'Vyumba vya kupanga', caption: 'Mfano wa tangazo la makazi. Tembelea eneo na thibitisha mwenye nyumba kabla ya malipo.', emoji: '🏠', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85', likes: 96, demo: true },
  { id: 'demo-video-one', seller: '@sokora_video_demo', product: 'Video ya bidhaa — onyesho', price: 32000, location: 'Tanzania', category: 'Elektroniki', caption: 'Mfano wa video ya bidhaa. Bei na maelezo ni ya kuonyesha mtiririko wa mfumo tu.', emoji: '🎬', video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=85', likes: 63, demo: true },
  { id: 'demo-video-two', seller: '@sokora_demo_shop', product: 'Video ya duka — onyesho', price: 75000, location: 'Tanzania', category: 'Biashara', caption: 'Mfano wa video kwa duka. Maudhui haya si tangazo la muuzaji halisi.', emoji: '🛍️', video: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=85', likes: 41, demo: true },
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
  const [liveSessions, setLiveSessions] = useState([]);
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
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [deliveryName, setDeliveryName] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNote, setOrderNote] = useState('');
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [authUser, setAuthUser] = useState(null);
  const [dashboardSection, setDashboardSection] = useState('dashboard');
  const [navHidden, setNavHidden] = useState(false);

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
      loadJson('/api/live?limit=8').catch(() => ({ items: [] })),
    ]).then(([feedData, productData, liveData]) => {
      if (alive) setLiveSessions(Array.isArray(liveData?.items) ? liveData.items : []);
      if (!alive) return;
      const feedRows = Array.isArray(feedData) ? feedData : (Array.isArray(feedData.items) ? feedData.items : []);
      const productRows = Array.isArray(productData) ? productData : (Array.isArray(productData.items) ? productData.items : []);
      const normalizeProduct = (row, i, isVideo) => ({
        id: String(isVideo ? (row.video_id ?? row.id ?? 'video-' + i) : (row.id ?? row.product_id ?? 'product-' + i)),
        productId: String(isVideo ? (row.product_id ?? '') : (row.id ?? row.product_id ?? '')),
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
      const normalized = normalizedVideos.length ? normalizedVideos : normalizedProducts;
      if (normalized.length) {
        setVideos(normalized);
        setMode(normalizedVideos.length ? 'video-api' : 'api');
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
    if (!authUser || dashboardSection !== 'orders') return undefined;
    let alive = true;
    const token = window.localStorage.getItem('sokora_token');
    if (!token) return undefined;
    setOrdersLoading(true);
    fetch((API || '') + '/api/orders', { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'ORDERS_UNAVAILABLE');
        return data;
      })
      .then((data) => { if (alive) setOrders(Array.isArray(data.items) ? data.items : []); })
      .catch((error) => { if (alive) notify(error.message === 'INVALID_SESSION' ? 'Session imeisha. Ingia tena.' : 'Orodha ya oda haipatikani kwa sasa. Hakiki database na ujaribu tena.'); })
      .finally(() => { if (alive) setOrdersLoading(false); });
    return () => { alive = false; };
  }, [authUser, dashboardSection]);

  async function updateOrderStatus(order, status) {
    const token = window.localStorage.getItem('sokora_token');
    if (!token) { openAuth('login'); return; }
    try {
      const response = await fetch((API || '') + '/api/orders/' + encodeURIComponent(order.id) + '/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, Accept: 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'ORDER_UPDATE_FAILED');
      setOrders((old) => old.map((item) => String(item.id) === String(order.id) ? { ...item, status: data.order.status, updated_at: data.order.updated_at } : item));
      notify('Oda ' + order.order_number + ' sasa iko hatua ya ' + data.order.status + '.');
    } catch {
      notify('Hali ya oda haikubadilika. Hakiki ruhusa, hatua inayofuata na muunganisho wa database.');
    }
  }

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

  const closeModal = () => { setModal(''); setSelected(null); setCommentText(''); setAuthPassword(''); };
  const notify = (message) => setToast(message);
  const askDemo = (feature) => {
    if (feature === 'upload' && (!authUser || !window.localStorage.getItem('sokora_token'))) {
      notify('Ingia au jisajili kwanza ili kuweka bidhaa au video.');
      openAuth('login');
      return;
    }
    setModal(feature);
  };
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


  function startCheckout(video) {
    if (!authUser) {
      setSelected(video);
      openAuth('login');
      notify('Ingia kwanza ili kutengeneza oda ya bidhaa hii.');
      return;
    }
    if (!video?.productId || !/^\d+$/.test(String(video.productId))) {
      notify('Bidhaa hii haina rekodi ya database inayoweza kuagizwa. Chagua bidhaa halisi kutoka API.');
      return;
    }
    setSelected(video);
    setDeliveryName(authUser.display_name || authUser.displayName || '');
    setDeliveryPhone(authUser.phone || '');
    setDeliveryAddress('');
    setOrderNote('');
    setModal('checkout');
  }

  async function submitCheckout(event) {
    event?.preventDefault();
    if (checkoutBusy || !selected) return;
    const token = window.localStorage.getItem('sokora_token');
    if (!token) { openAuth('login'); return; }
    setCheckoutBusy(true);
    try {
      const response = await fetch((API || '') + '/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token, Accept: 'application/json' },
        body: JSON.stringify({
          items: [{ productId: selected.productId, quantity: 1 }],
          deliveryName: deliveryName.trim(),
          deliveryPhone: deliveryPhone.trim(),
          deliveryAddress: deliveryAddress.trim(),
          note: orderNote.trim(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const messages = {
          INVALID_SESSION: 'Session imeisha. Ingia tena.',
          DATABASE_UNAVAILABLE: 'Database haipatikani kwa sasa.',
          PRODUCT_NOT_AVAILABLE: 'Bidhaa hii haipatikani tena.',
          ONE_SELLER_PER_ORDER: 'Bidhaa za maduka tofauti zinahitaji oda tofauti.',
          ORDER_CREATION_FAILED: 'Oda haikuundwa. Hakiki muunganisho wa database.',
        };
        throw new Error(messages[data.error] || 'Imeshindikana kutengeneza oda. Jaribu tena.');
      }
      closeModal();
      setDashboardSection('orders');
      notify('Oda ' + (data.order?.order_number || '') + ' imetengenezwa. Hali: PENDING.');
    } catch (error) {
      notify(error.message || 'Hitilafu ya mtandao wakati wa kutengeneza oda.');
    } finally {
      setCheckoutBusy(false);
    }
  }

  function saveLocalListing() {
    // Enforce the sign-in requirement again at the action boundary, not only in the UI.
    if (!authUser || !window.localStorage.getItem('sokora_token')) {
      setModal('');
      notify('Ingia au jisajili kwanza ili kuhifadhi tangazo.');
      openAuth('login');
      return;
    }
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
      <header className={'site-header ' + (authUser ? 'private-header' : 'public-header')}>
        <a className="brand" href="#home" aria-label="SOKORA nyumbani"><span className="brand-mark">S</span><span><strong>SOKORA</strong><small>TAZAMA · GUNDUA · NUNUA</small></span></a>
        {!authUser && <label className="search-box"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta bidhaa, biashara, eneo..." aria-label="Tafuta SOKORA" /><kbd>Enter</kbd></label>}
        <div className="header-actions">{!authUser ? <button className="gold-btn" onClick={() => openAuth('login')}>Ingia / Jisajili</button> : <button className="ghost-btn" onClick={logout}>Toka kwenye akaunti</button>}</div>
      </header>

      {!authUser ? <main id="home">
        <section className="welcome-row">
          <div><p className="eyebrow">🇹🇿 SOKO LA TANZANIA</p><h1>Biashara halisi.<br /><span>Fursa kila mahali.</span></h1><p className="welcome-copy">Gundua bidhaa, huduma na biashara kupitia picha na video fupi kutoka Tanzania nzima.</p></div>
          <div className="welcome-stats"><span><b>{filtered.length}</b><small>Matangazo yanayoonekana</small></span><span><b>24/7</b><small>Gundua kwa muda wako</small></span></div>
        </section>

        <section className="live-row" aria-label="LIVE">
          <div className="section-label"><span className="live-dot"></span><div><b>LIVE sasa</b><small>Maonyesho ya wafanyabiashara</small></div></div>
          <div className="live-creators">
            {liveSessions.length ? liveSessions.map((session) => <button key={session.id} className="live-person" onClick={() => { setSelected({ product: session.title, seller: session.business_name || session.seller_name, liveSessionId: session.id, productId: session.pinned_product_id ? String(session.pinned_product_id) : '' }); askDemo('live'); }}><span className="live-avatar live-avatar-real">●</span><span>{session.business_name || session.seller_name || '@' + session.seller_username}</span></button>) : <p className="live-empty">Hakuna kipindi LIVE kilichoanza kwa sasa. Vipindi halisi vitaonekana hapa.</p>}
          </div>
          <button className="live-outline" onClick={() => notify('Utangazaji wa LIVE utawezeshwa baada ya kuunganisha Cloudflare Stream Live.')} disabled>● Anza LIVE</button>
        </section>

        <section className="market-section">
          <div className="section-heading"><div><p className="eyebrow">GUNDUA KITU KIPYA</p><h2>Video na bidhaa</h2></div><span className="source-note">{mode === 'loading' ? 'Inapakia soko…' : mode === 'video-api' ? 'Video kutoka API' : mode === 'api' ? 'Bidhaa kutoka API' : mode === 'empty-api' ? 'Hakuna matangazo bado' : mode === 'api-error' ? 'API haipatikani' : 'Data za mfano'}</span></div>
          <div className="category-row" aria-label="Makundi ya bidhaa">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>
          <div className="result-line"><span>{filtered.length} matokeo</span><label className="sort-label">Panga kwa <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="recommended">Vinavyopendekezwa</option><option value="price-low">Bei: chini kwenda juu</option><option value="price-high">Bei: juu kwenda chini</option></select></label></div>
          {mode === 'api-error' ? <div className="empty-state"><span>⚠</span><h3>Imeshindikana kupakia soko</h3><p>Muunganisho wa API umeshindwa. Jaribu tena baada ya muda; bidhaa za mfano hazitaonyeshwa kama bidhaa halisi.</p><button className="gold-btn" onClick={() => window.location.reload()}>Jaribu tena</button></div> : mode === 'loading' ? <div className="empty-state"><span>…</span><h3>Inapakia matangazo</h3><p>Tunasoma bidhaa kutoka SOKORA API.</p></div> : mode === 'empty-api' && !filtered.length ? <div className="empty-state"><span>🛍️</span><h3>Bado hakuna matangazo ya umma</h3><p>Bidhaa zitaonekana hapa baada ya muuzaji kuweka tangazo kupitia API.</p></div> : filtered.length ? <div className="product-grid">{filtered.map((video) => <article className="product-card" key={video.id}>
            <button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>
              {video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <div className="media-placeholder"><span aria-hidden="true">▧</span><strong>Picha haijawekwa</strong><small>Muuzaji hajaongeza picha</small></div>}
              {(video.video || video.image) && <span className="media-tag">{video.video ? '▶ VIDEO' : 'PICHA'}</span>}
            </button>
            <div className="product-content"><div className="seller-line"><span className="seller-avatar">{(video.seller || 'S').replace('@','').slice(0,2).toUpperCase()}</span><span>{video.seller}</span><button className={'follow-mini ' + (following[video.seller] ? 'following' : '')} onClick={() => { setFollowing((old) => ({ ...old, [video.seller]: !old[video.seller] })); notify('Ufuatiliaji huu ni wa kivinjari hiki tu.'); }}>{following[video.seller] ? '✓' : '+'}</button></div><h3>{video.product}</h3><p className="product-caption">{video.caption}</p><div className="product-bottom"><strong>{money(video.price)}</strong><span>⌖ {video.location}</span></div><button className="gold-btn buy-now-btn" onClick={() => startCheckout(video)}>Nunua Sasa ↗</button><div className="card-actions"><button onClick={() => { setLiked((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Like imehifadhiwa kwenye hali ya kivinjari hiki tu.'); }} className={liked[video.id] ? 'is-liked' : ''}>{liked[video.id] ? '♥' : '♡'} <span>{Number(video.likes || 0) + (liked[video.id] ? 1 : 0)}</span></button><button onClick={() => { setSelected(video); askDemo('comments'); }}>▢ Maoni</button><button onClick={() => shareVideo(video)}>↗ Shiriki</button><button onClick={() => { setSaved((old) => ({ ...old, [video.id]: !old[video.id] })); notify('Hifadhi ni ya kivinjari hiki tu.'); }}>{saved[video.id] ? '★' : '☆'}</button></div></div>
          </article>)}</div> : <div className="empty-state"><span>⌕</span><h3>Hakuna kilichopatikana</h3><p>Badili neno la utafutaji au chagua kundi jingine.</p><button className="gold-btn" onClick={() => { setQuery(''); setCategory('Zote'); }}>Ondoa vichujio</button></div>}
        </section>

        <section className="seller-banner"><div className="banner-icon">↗</div><div><p className="eyebrow">WEKA BIASHARA YAKO</p><h2>Bidhaa yako inastahili kuonekana.</h2><p>Andaa tangazo lenye picha au video, bei na eneo la biashara yako.</p></div>{authUser && <button className="gold-btn" onClick={() => askDemo('upload')}>＋ Tengeneza tangazo</button>}</section>
        <p className="disclaimer">SOKORA Web · Taarifa zilizoandikwa “mfano” ni za kuonyesha muonekano tu. Likes, follows na matangazo ya kifaa hiki hazijahifadhiwa kwenye akaunti au database ya umma.</p>
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
          {dashboardSection === 'marketplace' && <section className="account-marketplace"><div className="section-heading"><div><p className="eyebrow">SOKO LA TANZANIA</p><h2>Bidhaa na biashara</h2></div><span className="source-note">{mode === 'api-error' ? 'API haipatikani' : mode === 'loading' ? 'Inapakia…' : mode === 'empty-api' ? 'Hakuna matangazo' : 'Matangazo yanayoonekana'}</span></div><div className="feed-mode-tabs" role="tablist" aria-label="Aina ya feed"><button role="tab" aria-selected={feedTab === 'for-you'} className={feedTab === 'for-you' ? 'active' : ''} onClick={() => setFeedTab('for-you')}>Kwa ajili yako</button><button role="tab" aria-selected={feedTab === 'following'} className={feedTab === 'following' ? 'active' : ''} onClick={() => setFeedTab('following')}>Ninaowafuata</button><button role="tab" aria-selected={feedTab === 'nearby'} className={feedTab === 'nearby' ? 'active' : ''} onClick={() => setFeedTab('nearby')}>Karibu nami</button>{feedTab === 'nearby' && <label className="nearby-region-label">Mkoa <select value={nearbyRegion} onChange={(e) => setNearbyRegion(e.target.value)}>{['Dodoma','Dar es Salaam','Arusha','Mwanza','Morogoro','Mbeya','Tanga','Zanzibar','Kilimanjaro','Tabora','Iringa','Mtwara','Kigoma','Shinyanga','Singida','Manyara','Geita','Kagera','Rukwa','Ruvuma','Njombe','Katavi','Simiyu','Songwe','Pwani','Lindi'].map((region) => <option key={region} value={region}>{region}</option>)}</select></label>}</div><label className="account-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tafuta bidhaa, muuzaji au eneo..." /></label><div className="category-row">{categories.map((name) => <button key={name} className={'category-chip ' + (category === name ? 'active' : '')} onClick={() => setCategory(name)}>{name}</button>)}</div>{mode === 'api-error' ? <div className="empty-state"><h3>Soko halijapatikana</h3><p>Muunganisho wa API haujapatikana. Jaribu tena baadaye.</p><button className="gold-btn" onClick={() => window.location.reload()}>Jaribu tena</button></div> : filtered.length ? <div className="product-grid">{filtered.map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>{video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <div className="media-placeholder"><span aria-hidden="true">▧</span><strong>Picha haijawekwa</strong><small>Muuzaji hajaongeza picha</small></div>}{(video.video || video.image) && <span className="media-tag">{video.video ? '▶ VIDEO' : 'PICHA'}</span>}</button><div className="product-content"><div className="seller-line"><span className="seller-avatar">{(video.seller || 'S').replace('@','').slice(0,2).toUpperCase()}</span><span>{video.seller}</span><button className={'follow-mini ' + (following[video.seller] ? 'following' : '')} onClick={() => setFollowing((old) => ({ ...old, [video.seller]: !old[video.seller] }))}>{following[video.seller] ? '✓' : '+'}</button></div><h3>{video.product}</h3><p className="product-caption">{video.caption}</p><div className="product-bottom"><strong>{money(video.price)}</strong><span>⌖ {video.location}</span></div><div className="card-actions"><button onClick={() => setLiked((old) => ({ ...old, [video.id]: !old[video.id] }))} className={liked[video.id] ? 'is-liked' : ''}>{liked[video.id] ? '♥' : '♡'} {Number(video.likes || 0) + (liked[video.id] ? 1 : 0)}</button><button onClick={() => { setSelected(video); askDemo('comments'); }}>▢ Maoni</button><button onClick={() => shareVideo(video)}>↗ Shiriki</button><button onClick={() => setSaved((old) => ({ ...old, [video.id]: !old[video.id] }))}>{saved[video.id] ? '★' : '☆'}</button></div></div></article>)}</div> : <div className="empty-state"><h3>{feedTab === 'following' ? 'Bado huwafuati wauzaji' : feedTab === 'nearby' ? 'Hakuna matangazo katika eneo hili' : 'Hakuna bidhaa zilizopatikana'}</h3><p>{feedTab === 'following' ? 'Fuata wauzaji kutoka sokoni ili kuona matangazo yao hapa.' : feedTab === 'nearby' ? 'Matokeo yanategemea eneo lililochaguliwa na eneo lililotajwa kwenye tangazo.' : 'Jaribu kutafuta kwa jina jingine au badili kundi.'}</p><button className="ghost-btn" onClick={() => { setFeedTab('for-you'); setCategory('Zote'); setQuery(''); }}>Rudisha Kwa ajili yako</button></div>}</section>}
          {dashboardSection === 'orders' && <div className="orders-panel"><div className="panel-heading"><div><p className="eyebrow">UNUNUZI NA MAUZO</p><h2>Maagizo yako</h2></div><button className="ghost-btn" onClick={() => setDashboardSection('marketplace')}>Gundua bidhaa</button></div>{ordersLoading ? <div className="account-empty-panel"><span>…</span><p>Inapakia oda zako kutoka database…</p></div> : orders.length ? <div className="orders-list">{orders.map((order) => <article className="order-row" key={order.id}><div><strong>{order.order_number}</strong><p>{order.is_buyer ? 'Umenunua' : 'Umeuza'} · {new Date(order.created_at).toLocaleDateString('sw-TZ')}</p></div><strong>{money(order.total_tzs)}</strong><span className={'order-status status-' + String(order.status).toLowerCase()}>{order.status}</span><div className="order-actions">{!order.is_buyer && order.status === 'PENDING' && <button className="gold-btn" onClick={() => updateOrderStatus(order, 'CONFIRMED')}>Thibitisha</button>}{!order.is_buyer && order.status === 'CONFIRMED' && <button className="gold-btn" onClick={() => updateOrderStatus(order, 'SHIPPED')}>Weka imesafirishwa</button>}{order.is_buyer && order.status === 'SHIPPED' && <button className="gold-btn" onClick={() => updateOrderStatus(order, 'DELIVERED')}>Nimepokea bidhaa</button>}{order.status === 'PENDING' && <button className="ghost-btn" onClick={() => updateOrderStatus(order, 'CANCELLED')}>Ghairi</button>}</div></article>)}</div> : <div className="account-empty-panel"><span>▤</span><h2>Bado huna oda</h2><p>Oda utakazotengeneza zitaonekana hapa pamoja na hatua yake: pending, confirmed, shipped au delivered.</p><button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Nunua bidhaa</button></div>}</div>}
          {dashboardSection === 'following' && <div className="account-empty-panel"><span>♡</span><h2>Wauzaji unaowafuata</h2><p>Ufuatiliaji uliopo sasa umehifadhiwa kwenye kivinjari hiki, si kwenye akaunti ya seva.</p><button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Tafuta wauzaji</button></div>}
          {dashboardSection === 'saved' && <div className="account-empty-panel"><span>☆</span><h2>Bidhaa ulizohifadhi</h2>{filtered.filter((v) => saved[v.id]).length ? <div className="product-grid">{filtered.filter((v) => saved[v.id]).map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }}>{video.image ? <img src={video.image} alt={video.product} /> : <span>{video.emoji}</span>}</button><div className="product-content"><h3>{video.product}</h3><strong>{money(video.price)}</strong></div></article>)}</div> : <p>Bado hujahifadhi bidhaa zinazopatikana kwenye orodha hii.</p>}<button className="gold-btn" onClick={() => setDashboardSection('marketplace')}>Gundua bidhaa</button></div>}
          {dashboardSection === 'listings' && <div className="account-empty-panel"><span>▣</span><h2>Matangazo yangu</h2><p>Hapa unaona matangazo uliyohifadhi kwenye kifaa hiki. Bado hayajachapishwa kwa watumiaji wengine kwa sababu upload API na storage ya media havijaunganishwa.</p>{videos.filter((v) => v.local).length ? <div className="product-grid">{videos.filter((v) => v.local).map((video) => <article className="product-card" key={video.id}><button className="product-media" onClick={() => { setSelected(video); askDemo('details'); }} aria-label={'Tazama ' + video.product}>{video.video ? <video src={video.video} muted playsInline preload="metadata" /> : video.image ? <img src={video.image} alt={video.product} loading="lazy" /> : <span className="product-emoji">{video.emoji || '🛍️'}</span>}<span className="media-tag">KIFAA HIKI</span></button><div className="product-content"><h3>{video.product}</h3><strong>{money(video.price)}</strong><p className="product-caption">{video.location}</p><button className="ghost-btn" onClick={() => { setSelected(video); askDemo('details'); }}>Angalia tangazo</button></div></article>)}</div> : <p>Bado hujaweka tangazo kwenye kifaa hiki.</p>}<button className="gold-btn" onClick={() => askDemo('upload')}>＋ Weka tangazo</button></div>}
          {dashboardSection === 'profile' && <div className="profile-panel"><span className="profile-avatar-large">{String(authUser.display_name || authUser.displayName || authUser.username || 'S').slice(0,1).toUpperCase()}</span><div><p className="eyebrow">WASIFU WAKO</p><h2>{authUser.display_name || authUser.displayName || authUser.username}</h2><p>@{authUser.username}</p><p className="modal-muted">{authUser.email || 'Hakuna email iliyowekwa'} · {authUser.phone || 'Hakuna simu iliyowekwa'}</p><button className="ghost-btn" onClick={() => notify('Kuhariri wasifu kutawashwa baada ya endpoint ya profile kuunganishwa.')}>Hariri wasifu</button></div></div>}
          {dashboardSection === 'settings' && <div className="account-empty-panel"><span>⚙</span><h2>Mipangilio</h2><p>Session yako imelindwa na token ya akaunti. Unaweza kutoka kwenye kifaa hiki kwa kitufe cha “Toka”.</p><button className="ghost-btn" onClick={logout}>Toka kwenye akaunti</button></div>}
        </section>
      </main>}

      {authUser && !navHidden && <nav className="mobile-nav account-mobile-nav" aria-label="Urambazaji wa akaunti">{[['dashboard','⌂','Mwanzo'],['marketplace','⌕','Soko'],['upload','＋','Weka'],['profile','◉','Wasifu']].map(([id,icon,label]) => <button key={id} className={dashboardSection === id ? 'active' : ''} onClick={() => { if (id === 'upload') askDemo('upload'); else setDashboardSection(id); }}><span>{icon}</span>{label}</button>)}</nav>}
      {!authUser && <nav className="mobile-nav" aria-label="Urambazaji wa SOKORA">{[['⌂','Nyumbani'],['⌕','Gundua'],['●','LIVE'],['↪','Ingia']].map(([icon, label]) => <button key={label} className={mobileTab === label ? 'active' : ''} onClick={() => { setMobileTab(label); if (label === 'Ingia') openAuth('login'); else if (label === 'LIVE') askDemo('live'); else window.scrollTo({ top: label === 'Gundua' ? 420 : 0, behavior: 'smooth' }); }}><span>{icon}</span>{label}</button>)}</nav>}

      {toast && <div className="toast" role="status">{toast}</div>}
      {modal && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) closeModal(); }}><section className="modal-card" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={closeModal} aria-label="Funga">×</button>
        {modal === 'details' && current && <><p className="eyebrow">TAARIFA ZA TANGAZO</p><h2>{current.product}</h2>{current.video ? <video className="detail-media" style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: 12, background: "#080808" }} src={current.video} controls playsInline preload="metadata" /> : current.image ? <img className="detail-media" style={{ width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: 12, background: "#080808" }} src={current.image} alt={current.product} /> : null}<p className="modal-price">{money(current.price)}</p><p>{current.caption}</p><p className="modal-muted">Muuzaji: {current.seller} · {current.location}</p><p className="modal-muted">Usitume malipo kabla ya kuthibitisha bidhaa na muuzaji. Kagua bidhaa na tumia njia salama ya malipo.</p><div className="modal-actions"><button className="gold-btn" onClick={() => startCheckout(current)}>Nunua Sasa</button><button className="ghost-btn" onClick={() => contactSeller(current)}>Wasiliana WhatsApp</button><button className="ghost-btn" onClick={() => shareVideo(current)}>Shiriki bidhaa</button><button className="ghost-btn" onClick={() => { setSelected(current); setModal('comments'); }}>Maoni</button><button className="ghost-btn" onClick={downloadSelected}>Pakua picha/video</button><button className="ghost-btn" onClick={closeModal}>Rudi sokoni</button></div></>}
        {modal === 'checkout' && selected && <><p className="eyebrow">ODA YA BIDHAA</p><h2>Nunua {selected.product}</h2><p className="modal-price">{money(selected.price)}</p><p className="modal-muted">Bei inathibitishwa tena na database wakati oda inapotengenezwa. Hakuna malipo yanayochukuliwa kwenye hatua hii.</p><form className="auth-form" onSubmit={submitCheckout}><label className="field-label">Jina la mpokeaji<input value={deliveryName} onChange={(e) => setDeliveryName(e.target.value)} required minLength={2} maxLength={120} /></label><label className="field-label">Namba ya simu<input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} required maxLength={32} placeholder="+255..." /></label><label className="field-label">Anwani ya delivery<input value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} required minLength={4} maxLength={500} placeholder="Mtaa, eneo, mji" /></label><label className="field-label">Maelezo ya ziada (hiari)<textarea value={orderNote} onChange={(e) => setOrderNote(e.target.value)} maxLength={1000} rows={3} /></label><button className="gold-btn" type="submit" disabled={checkoutBusy}>{checkoutBusy ? 'Inatengeneza oda…' : 'Thibitisha oda'}</button><button className="ghost-btn" type="button" onClick={closeModal}>Ghairi</button></form></>}
        {modal === 'login' && <><p className="eyebrow">AKAUNTI YA SOKORA</p><h2>{authMode === 'register' ? 'Fungua akaunti' : 'Karibu SOKORA'}</h2><p>{authMode === 'register' ? 'Jisajili ili uweze kuanza kuweka biashara na kufuatilia wauzaji.' : 'Ingia kwa username, email au namba ya simu.'}</p><form className="auth-form" onSubmit={submitAuth}>
          {authMode === 'register' ? <><label className="field-label">Jina kamili<input autoComplete="name" value={authDisplayName} onChange={(e) => setAuthDisplayName(e.target.value)} required minLength={2} maxLength={80} /></label><label className="field-label">Username<input autoComplete="username" value={authUsername} onChange={(e) => setAuthUsername(e.target.value)} placeholder="mfano_joseph" required minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" /></label><label className="field-label">Namba ya simu au email<input type="text" autoComplete="username" value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} placeholder="+255... au jina@email.com" required /></label></> : <label className="field-label">Username, email au simu<input autoComplete="username" value={authIdentity} onChange={(e) => setAuthIdentity(e.target.value)} required /></label>}
          <label className="field-label">Password<input type="password" autoComplete={authMode === 'register' ? 'new-password' : 'current-password'} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} required minLength={authMode === 'register' ? 10 : 1} maxLength={128} /></label>
          {authMode === 'register' && <p className="modal-muted">Tumia password ya angalau herufi 10. Hifadhi kwa usalama; usimpe mtu mwingine.</p>}
          <button className="gold-btn" type="submit" disabled={authBusy}>{authBusy ? 'Inashughulikia...' : authMode === 'register' ? 'Fungua akaunti' : 'Ingia'}</button>
        </form><p className="auth-switch">{authMode === 'register' ? 'Tayari una akaunti?' : 'Bado huna akaunti?'} <button type="button" className="text-link" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Ingia' : 'Jisajili'}</button></p></>}
        {modal === 'live' && <><p className="eyebrow"><span className="live-dot"></span> LIVE</p><h2>Maonyesho ya moja kwa moja</h2><p>LIVE halisi haijaunganishwa bado. Inahitaji huduma ya streaming, akaunti ya muuzaji na udhibiti wa usalama. Hatuonyeshi video ya moja kwa moja ya kubuni.</p><button className="gold-btn" onClick={closeModal}>Sawa</button></>}
        {modal === 'comments' && current && <><p className="eyebrow">MAONI</p><h2>{current.product}</h2><div className="comment-list">{(comments[current.id] || []).map((comment, i) => <p key={i}><b>{comment.name}</b><br />{comment.text}</p>)}{!(comments[current.id] || []).length && <p className="modal-muted">Bado hakuna maoni yaliyowekwa kwenye kivinjari hiki.</p>}</div><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Andika maoni..." rows="3" /><button className="gold-btn" onClick={() => { if (!commentText.trim()) return; setComments((old) => ({ ...old, [current.id]: [...(old[current.id] || []), { name: 'Wewe (kifaa hiki)', text: commentText.trim() }] })); setCommentText(''); notify('Maoni yameongezwa kwenye kifaa hiki tu.'); }}>Ongeza maoni</button></>}
        {modal === 'upload' && authUser && <><p className="eyebrow">TANGAZO JIPYA</p><h2>Weka bidhaa au video</h2><p>Uwekaji wa picha/video za umma bado unasubiri media storage na API ya upload. Hatutakuambia tangazo limechapishwa kwa wengine mpaka huduma hiyo iunganishwe.</p><label className="field-label">Picha au video<input type="file" accept="image/*,video/*" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} /></label><label className="field-label">Jina/maelezo ya bidhaa<input value={uploadCaption} onChange={(e) => setUploadCaption(e.target.value)} placeholder="Mf. Simu Samsung..." /></label><label className="field-label">Bei kwa TSh<input inputMode="numeric" value={uploadPrice} onChange={(e) => setUploadPrice(e.target.value)} placeholder="25000" /></label><label className="field-label">Eneo<input value={uploadLocation} onChange={(e) => setUploadLocation(e.target.value)} required /></label><label className="field-label">Namba ya WhatsApp ya biashara (hiari)<input type="tel" value={uploadPhone} onChange={(e) => setUploadPhone(e.target.value)} placeholder="2557XXXXXXXX" /></label>{uploadFile && <p className="modal-muted">Faili: {uploadFile.name} · {(uploadFile.size / 1048576).toFixed(1)} MB</p>}<div className="modal-actions"><button className="gold-btn" onClick={saveLocalListing}>Ongeza kwenye kifaa hiki</button><button className="ghost-btn" onClick={closeModal}>Ghairi</button></div></>}
      </section></div>}
    </div>
  );
}
