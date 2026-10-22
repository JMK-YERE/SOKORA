import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';

const API_BASE_URL = (typeof process !== 'undefined' && process.env && process.env.EXPO_PUBLIC_API_URL)
  ? process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '')
  : '';

function normalizeApiVideo(row, index) {
  const amount = Number(row.price_tzs || 0);
  return {
    id: String(row.video_id ?? row.id ?? `video-${index}`),
    videoUrl: row.video_url || '',
    seller: row.seller_username ? '@' + String(row.seller_username).replace(/^@/, '') : (row.seller_name || 'Muuzaji wa SOKORA'),
    verified: false,
    product: row.product_name || row.name || 'Bidhaa ya SOKORA',
    price: 'TSh ' + amount.toLocaleString('en-TZ'),
    location: row.location || 'Tanzania',
    caption: row.caption || row.description || '',
    emoji: '',
    imageUrl: row.product_image_url || row.image_url || row.thumbnail_url || '',
    background: '#233C59',
    likes: Number(row.likes_count || 0),
    comments: Number(row.comments_count || 0),
    isDemo: false,
  };
}
const demoVideos = [
  {
    id: 'phone',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=85',
    seller: '@jiji_gadgets_tz',
    verified: true,
    product: 'Simu janja ya kisasa',
    price: 'TSh 450,000',
    location: 'Dar es Salaam',
    caption: 'Simu za kisasa kwa bei rafiki 🇹🇿 Uliza muuzaji kuhusu stock na delivery.',
    background: '#233C59',
    likes: 1200,
    comments: 2,
  },
  {
    id: 'fashion',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=85',
    seller: '@mariam_fashion',
    verified: true,
    product: 'Viatu vya mtindo',
    price: 'TSh 65,000',
    location: 'Dar es Salaam',
    caption: 'Mitindo mipya imefika! Uliza kuhusu rangi na size zinazopatikana.',
    background: '#71465D',
    likes: 846,
    comments: 1,
  },
  {
    id: 'home',
    videoUrl: '',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
    seller: '@mama_neema_home',
    verified: false,
    product: 'Kiti cha sebuleni',
    price: 'TSh 220,000',
    location: 'Mwanza',
    caption: 'Badili mwonekano wa nyumba yako kwa samani zilizotengenezwa kwa umakini.',
    background: '#3C594B',
    likes: 532,
    comments: 1,
  },
];

const liveCreators = [
  { id: 'live-fashion', name: 'Mariam Fashion', avatar: 'MF', viewers: '128' },
  { id: 'live-gadgets', name: 'Dodoma Gadgets', avatar: 'DG', viewers: '76' },
  { id: 'live-home', name: 'Mama Neema', avatar: 'MN', viewers: '54' },
  { id: 'live-tech', name: 'JMK Tech', avatar: 'JT', viewers: '31' },
];

function ActionButton({ icon, label, onPress, active = false }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.actionButton}>
      <Text style={[styles.actionIcon, active && styles.actionIconActive]}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const { height: windowHeight } = useWindowDimensions();
  const [feedViewportHeight, setFeedViewportHeight] = useState(0);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 70 }), []);
  const onViewableItemsChanged = useMemo(() => ({ viewableItems }) => {
    if (viewableItems && viewableItems.length) setActiveVideoId(viewableItems[0].item.id);
  }, []);
  const FEED_HEIGHT = feedViewportHeight > 0 ? feedViewportHeight : Math.max(280, windowHeight - (Platform.OS === 'web' ? 84 : 66));
  const [activeTab, setActiveTab] = useState('Kwa ajili yako');
  const [liked, setLiked] = useState({});
  const [following, setFollowing] = useState({});
  const [saved, setSaved] = useState({});
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState({
    phone: ['Asha: Je, delivery ipo Dodoma?', 'Baraka: Naomba maelezo zaidi.'],
    fashion: ['Neema: Size 39 ipo?'],
    home: ['Peter: Mnafanya delivery Mwanza?'],
  });
  const [searchText, setSearchText] = useState('');
  const [activeNav, setActiveNav] = useState('Video');
  const [showProfile, setShowProfile] = useState(false);
  const [accountName, setAccountName] = useState('Mtumiaji wa SOKORA');
  const [accountHandle, setAccountHandle] = useState('@sokora_user');
  const [feedVideos, setFeedVideos] = useState(demoVideos.map((video) => ({ ...video, isDemo: true })));
  const [feedMode, setFeedMode] = useState('demo');
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedMessage, setFeedMessage] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPrice, setUploadPrice] = useState('');
  const [uploadLocation, setUploadLocation] = useState('Dodoma');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    const feedUrl = API_BASE_URL ? API_BASE_URL + '/api/feed?limit=20' : '/api/feed?limit=20';
    fetch(feedUrl, { headers: { Accept: 'application/json' } })
      .then((response) => {
        if (!response.ok) throw new Error('API status ' + response.status);
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : []);
        const uniqueRows = [];
        const seenVideoIds = new Set();
        const seenVideoUrls = new Set();
        for (const row of rows) {
          const id = String(row.video_id ?? row.id ?? '');
          const url = String(row.video_url ?? '').trim();
          if ((!id && !url) || (id && seenVideoIds.has(id)) || (url && seenVideoUrls.has(url))) continue;
          if (id) seenVideoIds.add(id);
          if (url) seenVideoUrls.add(url);
          uniqueRows.push(row);
        }
        setFeedVideos(uniqueRows.map(normalizeApiVideo));
        setFeedMode('backend');
        setFeedMessage(rows.length ? '' : 'Bado hakuna video zilizochapishwa. Weka bidhaa na video ili zionekane hapa.');
      })
      .catch(() => {
        if (!active) return;
        setFeedVideos(demoVideos.map((video) => ({ ...video, isDemo: true })));
        setFeedMode('demo');
        setFeedMessage('API haijapatikana; unaona video za majaribio. Weka EXPO_PUBLIC_API_URL ili kuunganisha API ya SOKORA.');
      })
      .finally(() => { if (active) setFeedLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const manifestLink = document.querySelector('link[rel="manifest"]') || document.createElement('link');
    manifestLink.rel = 'manifest';
    manifestLink.href = '/manifest.json';
    if (!manifestLink.parentNode) document.head.appendChild(manifestLink);

    const themeMeta = document.querySelector('meta[name="theme-color"]') || document.createElement('meta');
    themeMeta.name = 'theme-color';
    themeMeta.content = '#080B10';
    if (!themeMeta.parentNode) document.head.appendChild(themeMeta);

    const descriptionMeta = document.querySelector('meta[name="description"]') || document.createElement('meta');
    descriptionMeta.name = 'description';
    descriptionMeta.content = 'Gundua bidhaa, biashara na video fupi kutoka Tanzania kwenye SOKORA.';
    if (!descriptionMeta.parentNode) document.head.appendChild(descriptionMeta);
  }, []);

  const visibleVideos = useMemo(() => {
    const term = searchText.trim().toLocaleLowerCase();
    const base = activeTab === 'Inafuatwa'
      ? feedVideos.filter((video) => following[video.seller])
      : feedVideos;
    if (!term) return base;
    return base.filter((video) =>
      [video.product, video.seller, video.location, video.caption].some((value) =>
        value.toLocaleLowerCase().includes(term),
      ),
    );
  }, [activeTab, feedVideos, following, searchText]);

  const toggleLike = (id) => setLiked((current) => ({ ...current, [id]: !current[id] }));
  const toggleFollow = (seller) => setFollowing((current) => ({ ...current, [seller]: !current[seller] }));
  const toggleSave = (id) => setSaved((current) => ({ ...current, [id]: !current[id] }));
  const myFollowingCount = Object.values(following).filter(Boolean).length;
  const myLikedCount = Object.values(liked).filter(Boolean).length;
  const mySavedCount = Object.values(saved).filter(Boolean).length;

  const shareVideo = async (video) => {
    try {
      await Share.share({
        message: 'Angalia bidhaa hii kwenye SOKORA: ' + video.product + ' — ' + video.price + '. Muuzaji: ' + video.seller + '.',
        title: 'Shiriki bidhaa ya SOKORA',
      });
    } catch {
      Alert.alert('Kushiriki', 'Kushiriki hakukukamilika. Jaribu tena.');
    }
  };

  const openComments = (video) => {
    setCommentText('');
    setSelectedVideo(video);
  };

  const submitComment = () => {
    const text = commentText.trim();
    if (!text || !selectedVideo) return;
    setComments((current) => ({
      ...current,
      [selectedVideo.id]: [...(current[selectedVideo.id] || []), 'Wewe: ' + text],
    }));
    setCommentText('');
    setSelectedVideo(null);
    Alert.alert('Maoni yameongezwa', 'Maoni haya yamehifadhiwa kwenye mfano wa app kwenye kifaa hiki pekee. Backend itahitajika kuyafanya yaonekane kwa watu wote.');
  };

  const uploadVideo = () => {
    setUploadFile(null);
    setUploadTitle('');
    setUploadPrice('');
    setUploadCaption('');
    setShowUpload(true);
  };

  const publishProduct = async () => {
    if (!uploadFile || !uploadTitle.trim() || !uploadPrice.trim()) {
      Alert.alert('Taarifa hazijakamilika', 'Chagua video au picha, andika jina la bidhaa na bei.');
      return;
    }
    if (!API_BASE_URL) {
      Alert.alert('API haijaunganishwa', 'Faili limechaguliwa kwenye kifaa hiki, lakini uchapishaji wa umma unahitaji EXPO_PUBLIC_API_URL na endpoint ya upload kwenye backend. Hakuna faili lililotumwa.');
      return;
    }
    const body = new FormData();
    body.append('file', uploadFile);
    body.append('product_name', uploadTitle.trim());
    body.append('price_tzs', uploadPrice.trim());
    body.append('location', uploadLocation.trim());
    body.append('caption', uploadCaption.trim());
    setUploading(true);
    try {
      const response = await fetch(API_BASE_URL + '/api/videos', { method: 'POST', body });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      setShowUpload(false);
      setFeedMessage('Bidhaa imetumwa. Inapakia upya feed…');
      const refreshed = await fetch(API_BASE_URL + '/api/feed?limit=20', { headers: { Accept: 'application/json' } });
      if (refreshed.ok) {
        const payload = await refreshed.json();
        const rows = Array.isArray(payload) ? payload : (Array.isArray(payload.items) ? payload.items : []);
        setFeedVideos(rows.map(normalizeApiVideo));
        setFeedMode('backend');
      }
      Alert.alert('Imetumwa', 'Backend imekubali bidhaa yako.');
    } catch (error) {
      Alert.alert('Haijachapishwa', 'Backend haikukubali upload (' + String(error.message || error) + '). Hakuna bidhaa iliyothibitishwa kuchapishwa. Hakikisha endpoint ya POST /api/videos inakubali multipart/form-data.');
    } finally {
      setUploading(false);
    }
  };

  const startLive = () => Alert.alert(
    'Anza LIVE',
    'LIVE halisi inahitaji akaunti ya muuzaji, ruhusa ya kamera na microphone, pamoja na huduma ya live streaming. Skrini hii ni maandalizi ya UI tu; haijaanzisha matangazo ya moja kwa moja.',
  );

  const joinLive = (creator) => Alert.alert(
    'LIVE · ' + creator.name,
    'Hii ni preview ya kujiunga na LIVE ya muuzaji. Video na sauti za moja kwa moja zitaunganishwa baada ya kuweka huduma ya streaming.',
    [{ text: 'Rudi kwenye video', style: 'cancel' }],
  );

  const renderVideo = ({ item }) => (
    <View style={[styles.videoCard, { height: FEED_HEIGHT, backgroundColor: item.background }]}>
      <View style={styles.videoBackdropCircle} />
      {Platform.OS === 'web' && item.videoUrl && !item.isDemo ? (
        <View style={styles.demoVideoStage}>
          {React.createElement('video', {
            key: item.videoUrl,
            src: item.videoUrl,
            controls: false,
            playsInline: true,
            muted: true,
            autoPlay: item.id === (activeVideoId || visibleVideos[0]?.id),
            loop: true,
            preload: 'metadata',
            'aria-label': 'Video ya SOKORA: ' + item.product,
            style: { width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#070B13' },
          })}
          <View style={styles.demoVideoOverlay}>
            <Text style={styles.demoVideoTag}>{item.isDemo ? 'DEMO' : 'VIDEO YA BIDHAA'}</Text>
            <Text style={styles.demoVideoProduct}>{item.product}</Text>
            {item.isDemo && <Text style={styles.demoVideoHint}>Video ya mfano · si tangazo halisi</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.productArt}>
          {item.imageUrl ? (
            <Image source={{ uri: item.imageUrl }} style={styles.productImage} resizeMode="cover" accessibilityLabel={'Picha ya ' + item.product} />
          ) : (
            <View style={styles.imageMissing}><Text style={styles.imageMissingText}>Picha ya bidhaa haijawekwa</Text></View>
          )}
          <View style={styles.productImageShade} />
          <Text style={styles.productArtCaption}>{item.isDemo ? 'SOKORA · MFANO' : 'SOKORA · BIDHAA'}</Text>
        </View>
      )}

      <View style={styles.videoTopLine}>
        <View style={styles.demoBadge}><Text style={styles.demoBadgeText}>{item.isDemo ? 'VIDEO YA MFANO' : 'VIDEO YA BIDHAA'}</Text></View>
        <Text style={styles.videoLocation}>⌖ {item.location}</Text>
      </View>

      <View style={styles.videoBottom}>
        <View style={styles.videoDescription}>
          <View style={styles.sellerLine}>
            <Text style={styles.sellerName}>{item.seller}{item.verified ? ' ✓' : ''}</Text>
            <Pressable
              onPress={() => toggleFollow(item.seller)}
              style={[styles.followButton, following[item.seller] && styles.followingButton]}
            >
              <Text style={styles.followButtonText}>{following[item.seller] ? '✓ Unamfuata' : '+ Fuata'}</Text>
            </Pressable>
          </View>
          <Text style={styles.videoCaption}>{item.caption}</Text>
          <Pressable style={styles.productPrice} onPress={() => Alert.alert(item.product, item.price + '\nMuuzaji: ' + item.seller + '\nEneo: ' + item.location + (item.isDemo ? '\n\nTaarifa hizi ni za mfano; mawasiliano ya muuzaji bado hayajaunganishwa.' : ''))}>
            <Text style={styles.productPriceText}>{item.price}  ·  Tazama bidhaa</Text>
          </Pressable>
        </View>
        <View style={styles.actionsRail}>
          <ActionButton icon={liked[item.id] ? '♥' : '♡'} label={liked[item.id] ? 'Umependa' : String(item.likes + (liked[item.id] ? 1 : 0))} active={!!liked[item.id]} onPress={() => toggleLike(item.id)} />
          <ActionButton icon="▢" label={String((comments[item.id] || []).length) + ' maoni'} onPress={() => openComments(item)} />
          <ActionButton icon="↗" label="Shiriki" onPress={() => shareVideo(item)} />
          <ActionButton icon={saved[item.id] ? '▣' : '♧'} label={saved[item.id] ? 'Imehifadhiwa' : 'Hifadhi'} active={!!saved[item.id]} onPress={() => toggleSave(item.id)} />
          <ActionButton icon="↓" label="Pakua" onPress={() => Alert.alert('Pakua video', 'Video zinazoonekana hapa ni vielelezo vya UI, si faili halisi. Kipengele cha kupakua kitaunganishwa baada ya video halisi kuhifadhiwa kwenye backend.')} />
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#102A43" />
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View>
            <Text style={styles.brand}>SOKORA</Text>
            <Text style={styles.tagline}>Tazama. Gundua. Nunua.</Text>
          </View>
          <View style={styles.headerLinks}>
            <Pressable onPress={() => setActiveTab('Kwa ajili yako')}><Text style={[styles.headerLink, activeTab === 'Kwa ajili yako' && styles.headerLinkActive]}>For you</Text></Pressable>
            <Pressable onPress={() => setActiveTab('Inafuatwa')}><Text style={[styles.headerLink, activeTab === 'Inafuatwa' && styles.headerLinkActive]}>Discover</Text></Pressable>
            <Pressable onPress={startLive} style={styles.headerLiveButton}><Text style={styles.headerLive}>● LIVE</Text></Pressable>
            <Pressable onPress={() => { setShowProfile(true); setActiveNav('Wasifu'); }} style={styles.profileTopButton}><Text style={styles.profileTopButtonText}>Wasifu</Text></Pressable>
          </View>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={searchText} onChangeText={setSearchText} placeholder="Tafuta bidhaa, muuzaji au mji..." placeholderTextColor="#9AA3B2" style={styles.searchInput} returnKeyType="search" />
          {!!searchText && <Pressable onPress={() => setSearchText('')}><Text style={styles.clearSearch}>✕</Text></Pressable>}
        </View>

      </View>

      <View style={styles.liveSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveList}>
          {liveCreators.map((creator) => (
            <Pressable key={creator.id} style={styles.liveCreator} onPress={() => joinLive(creator)}>
              <View style={styles.liveAvatarWrap}><Text style={styles.liveAvatarInitials}>{creator.avatar}</Text><View style={styles.liveDot} /></View>
              <Text numberOfLines={1} style={styles.liveName}>{creator.name}</Text>
              <Text style={styles.liveViewers}>● LIVE · {creator.viewers}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.feedHeader}>
        <View><Text style={styles.feedHeaderTitle}>Video za bidhaa</Text>{!!feedMessage && <Text style={styles.feedStatusText}>{feedMessage}</Text>}</View>
        <Pressable onPress={uploadVideo} style={styles.uploadButton}><Text style={styles.uploadButtonText}>＋ Weka video</Text></Pressable>
      </View>

      {feedLoading ? (
        <View style={styles.emptyState}><Text style={styles.emptyTitle}>Inapakia video…</Text><Text style={styles.emptyText}>Tunasoma video kutoka SOKORA.</Text></View>
      ) : visibleVideos.length ? (
        <FlatList
          onLayout={(event) => {
            const measured = Math.round(event.nativeEvent.layout.height);
            setFeedViewportHeight((current) => current === measured ? current : measured);
          }}
          key={activeTab}
          data={visibleVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideo}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          style={styles.feedScroll}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={Platform.OS !== 'web'}
          windowSize={3}
          initialNumToRender={1}
          maxToRenderPerBatch={2}
          contentContainerStyle={styles.feedList}
          snapToInterval={FEED_HEIGHT + (Platform.OS === 'web' ? 0 : 12)}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          ListFooterComponent={<Text style={styles.endOfFeed}>{feedMode === 'demo' ? 'Umefika mwisho wa video za mfano. ' : 'Umefika mwisho wa video zilizochapishwa. '}{feedMode === 'demo' ? 'Unganisha API ili kuonyesha video halisi.' : 'Rudi baadaye kuona bidhaa mpya.'}</Text>}
        />
      ) : (
        <View style={styles.emptyState}><Text style={styles.emptyEmoji}>🔎</Text><Text style={styles.emptyTitle}>Hakuna video zilizopatikana</Text><Text style={styles.emptyText}>Jaribu kutafuta neno jingine au fuata wauzaji ili kuona video zao kwenye kichupo cha “Inafuatwa”.</Text></View>
      )}

      <View style={styles.bottomNav}>
        {[
          { id: 'Video', icon: '🎬', label: 'Video' },
          { id: 'Gundua', icon: '🔎', label: 'Gundua' },
          { id: 'Weka', icon: '➕', label: 'Weka' },
          { id: 'Inbox', icon: '💬', label: 'Inbox' },
          { id: 'Wasifu', icon: '👤', label: 'Wasifu' },
        ].map((nav) => (
          <Pressable key={nav.id} style={styles.navItem} onPress={() => {
            setActiveNav(nav.id);
            if (nav.id === 'Weka') uploadVideo();
            else if (nav.id === 'Wasifu') setShowProfile(true);
            else if (nav.id === 'Inbox') Alert.alert(nav.label, 'Ujumbe utaunganishwa na akaunti katika hatua inayofuata.');
            else if (nav.id === 'Gundua') { setActiveTab('Kwa ajili yako'); setSearchText(''); }
            else if (nav.id !== 'Video') Alert.alert(nav.label, 'Sehemu hii itaunganishwa katika hatua inayofuata.');
          }}>
            <Text style={[styles.navIcon, activeNav === nav.id && styles.navIconActive]}>{nav.icon}</Text>
            <Text style={[styles.navLabel, activeNav === nav.id && styles.navLabelActive]}>{nav.label}</Text>
          </Pressable>
        ))}
      </View>

      <Modal visible={showUpload} animationType="slide" transparent onRequestClose={() => setShowUpload(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.uploadSheet}>
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>➕ Weka bidhaa SOKORA</Text>
              <Pressable onPress={() => setShowUpload(false)}><Text style={styles.closeModal}>✕</Text></Pressable>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 18 }}>
              <Text style={styles.uploadIntro}>Chagua video ya bidhaa au picha, kisha jaza taarifa zake.</Text>
              {Platform.OS === 'web' ? React.createElement('input', {
                type: 'file',
                accept: 'video/*,image/*',
                onChange: (event) => setUploadFile(event.target.files && event.target.files[0] ? event.target.files[0] : null),
                style: { display: 'block', width: '100%', color: '#FFFFFF', marginTop: 12, marginBottom: 12 },
              }) : <Text style={styles.uploadIntro}>Kuchagua faili kwenye simu kutahitaji kuunganishwa na kichagua media cha Android/iOS.</Text>}
              {!!uploadFile && <Text style={styles.uploadFileName}>✓ {uploadFile.name || 'Faili limechaguliwa'} · {Math.max(1, Math.round((uploadFile.size || 0) / 1024))} KB</Text>}
              <Text style={styles.uploadFieldLabel}>Jina la bidhaa *</Text>
              <TextInput value={uploadTitle} onChangeText={setUploadTitle} style={styles.uploadInput} placeholder="Mfano: Samsung Galaxy A55" placeholderTextColor="#9FB4C5" />
              <Text style={styles.uploadFieldLabel}>Bei kwa TSh *</Text>
              <TextInput value={uploadPrice} onChangeText={setUploadPrice} keyboardType="numeric" style={styles.uploadInput} placeholder="Mfano: 650000" placeholderTextColor="#9FB4C5" />
              <Text style={styles.uploadFieldLabel}>Eneo</Text>
              <TextInput value={uploadLocation} onChangeText={setUploadLocation} style={styles.uploadInput} placeholder="Mji / eneo" placeholderTextColor="#9FB4C5" />
              <Text style={styles.uploadFieldLabel}>Maelezo ya bidhaa</Text>
              <TextInput value={uploadCaption} onChangeText={setUploadCaption} multiline style={[styles.uploadInput, { minHeight: 76, textAlignVertical: 'top' }]} placeholder="Eleza bidhaa, hali yake na delivery..." placeholderTextColor="#9FB4C5" />
              <Pressable disabled={uploading} onPress={publishProduct} style={[styles.publishButton, uploading && { opacity: 0.6 }]}>
                <Text style={styles.publishButtonText}>{uploading ? 'Inatuma…' : 'Chapisha bidhaa'}</Text>
              </Pressable>
              <Text style={styles.uploadFootnote}>Uchapishaji wa umma utafanikiwa tu ikiwa backend ya SOKORA ina endpoint ya POST /api/videos na hifadhi ya media.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedVideo} transparent animationType="slide" onRequestClose={() => setSelectedVideo(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.commentSheet}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Maoni · {selectedVideo?.product}</Text>
              <Pressable onPress={() => setSelectedVideo(null)}><Text style={styles.closeModal}>✕</Text></Pressable>
            </View>
            <ScrollView style={styles.commentsList}>
              {(selectedVideo ? comments[selectedVideo.id] || [] : []).map((comment, index) => (
                <View key={selectedVideo.id + '-' + index} style={styles.commentRow}><View style={styles.commentAvatar}><Text>☺</Text></View><Text style={styles.commentText}>{comment}</Text></View>
              ))}
            </ScrollView>
            <View style={styles.commentComposer}>
              <TextInput value={commentText} onChangeText={setCommentText} placeholder="Andika maoni..." placeholderTextColor="#B3C5D0" style={styles.commentInput} multiline />
              <Pressable onPress={submitComment} style={styles.sendComment}><Text style={styles.sendCommentText}>Tuma</Text></Pressable>
            </View>
            <Text style={styles.modalFootnote}>Maoni ya demo yanabaki kwenye kifaa hiki pekee.</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showProfile} animationType="slide" onRequestClose={() => setShowProfile(false)}>
        <SafeAreaView style={styles.profileScreen}>
          <View style={styles.profileHeader}>
            <Pressable onPress={() => setShowProfile(false)} style={styles.profileBack}><Text style={styles.profileBackText}>‹  Rudi</Text></Pressable>
            <Text style={styles.profileScreenTitle}>Wasifu wangu</Text>
            <View style={{ width: 54 }} />
          </View>
          <ScrollView contentContainerStyle={styles.profileContent}>
            <View style={styles.profileIdentity}>
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>{accountName.trim().charAt(0).toUpperCase() || 'S'}</Text></View>
              <Text style={styles.profileName}>{accountName}</Text>
              <Text style={styles.profileHandle}>{accountHandle}</Text>
              <Text style={styles.profileBio}>Karibu SOKORA — soko la video za bidhaa Tanzania.</Text>
            </View>
            <View style={styles.profileStats}>
              <View style={styles.profileStat}><Text style={styles.profileStatNumber}>{myFollowingCount}</Text><Text style={styles.profileStatLabel}>Following</Text></View>
              <View style={styles.profileStat}><Text style={styles.profileStatNumber}>0</Text><Text style={styles.profileStatLabel}>Followers</Text></View>
              <View style={[styles.profileStat, { borderRightWidth: 0 }]}><Text style={styles.profileStatNumber}>{myLikedCount}</Text><Text style={styles.profileStatLabel}>Likes</Text></View>
            </View>
            <View style={styles.profileEditCard}>
              <Text style={styles.profileSectionTitle}>Taarifa za akaunti</Text>
              <Text style={styles.profileFieldLabel}>Jina linaloonekana</Text>
              <TextInput value={accountName} onChangeText={setAccountName} style={styles.profileInput} placeholder="Jina lako" placeholderTextColor="#8296A8" />
              <Text style={styles.profileFieldLabel}>Username</Text>
              <TextInput value={accountHandle} onChangeText={(value) => setAccountHandle(value.startsWith('@') ? value : '@' + value)} style={styles.profileInput} placeholder="@username" placeholderTextColor="#8296A8" autoCapitalize="none" />
            </View>
            <View style={styles.profileQuickStats}>
              <View style={styles.profileQuickRow}><Text style={styles.profileQuickLabel}>Video ulizopenda</Text><Text style={styles.profileQuickValue}>{myLikedCount}</Text></View>
              <View style={styles.profileQuickRow}><Text style={styles.profileQuickLabel}>Video ulizohifadhi</Text><Text style={styles.profileQuickValue}>{mySavedCount}</Text></View>
              <View style={styles.profileQuickRow}><Text style={styles.profileQuickLabel}>Wauzaji unaowafuata</Text><Text style={styles.profileQuickValue}>{myFollowingCount}</Text></View>
            </View>
            <Text style={styles.profileNote}>Takwimu hizi ni za kifaa hiki kwa sasa. Followers wa kweli, kuingia kwenye akaunti na takwimu zinazoonekana kwa watumiaji wote zinahitaji backend ya akaunti.</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: '#070B13', ...(Platform.OS === 'web' ? { width: '100%', maxWidth: 900, height: '100vh', alignSelf: 'center', overflow: 'hidden', borderLeftWidth: 0, borderRightWidth: 0, borderColor: 'transparent' } : {}) },
  header: { backgroundColor: 'transparent', paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 12 : 8, paddingBottom: 8, borderWidth: 0, borderColor: 'transparent', elevation: 0, shadowColor: 'transparent', ...(Platform.OS !== 'web' ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 } : {}) },
  headerBrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42, gap: 10 },
  brand: { color: '#FFFFFF', fontSize: Platform.OS === 'web' ? 23 : 22, fontWeight: '900', letterSpacing: 1.5 },
  headerLinks: { flexDirection: 'row', alignItems: 'center', gap: Platform.OS === 'web' ? 12 : 7, flexShrink: 1 },
  headerLink: { color: '#C1D0DC', fontSize: Platform.OS === 'web' ? 13 : 10, fontWeight: '800', paddingVertical: 7, backgroundColor: 'transparent' },
  headerLinkActive: { color: '#FFFFFF', textDecorationLine: 'underline', textDecorationColor: '#F3B84B', backgroundColor: 'transparent' },
  headerLive: { color: '#FF5A63', fontSize: 13, fontWeight: '900' },
  headerLiveButton: { paddingVertical: 8, paddingHorizontal: 2 },
  profileTopButton: { paddingHorizontal: 6, paddingVertical: 8, borderRadius: 0, backgroundColor: 'transparent' },
  profileTopButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  tagline: { color: '#C3D2DA', fontSize: Platform.OS === 'web' ? 9 : 10, marginTop: 1, backgroundColor: 'transparent' },

  searchBox: { flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'web' ? 8 : 5, paddingHorizontal: 12, height: Platform.OS === 'web' ? 40 : 36, borderRadius: 0, backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent' },
  searchIcon: { color: '#C3D2DA', fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', paddingVertical: 7, fontSize: 14 },
  clearSearch: { color: '#FFFFFF', fontSize: 15, paddingHorizontal: 4 },

  liveSection: { backgroundColor: 'transparent', borderBottomWidth: 0, borderBottomColor: 'transparent' },
  liveList: { paddingHorizontal: 13, paddingVertical: 10, gap: 15 },
  liveCreator: { width: 70, alignItems: 'center' },
  liveAvatarWrap: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#E83D4D', alignItems: 'center', justifyContent: 'center', backgroundColor: '#151B24', marginBottom: 5 },
  liveAvatarInitials: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  liveDot: { position: 'absolute', right: -2, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#E83D4D', borderWidth: 2, borderColor: '#070B13' },
  liveName: { color: '#F7F4EA', fontSize: 9, fontWeight: '700', maxWidth: 70 },
  liveViewers: { color: '#F3B84B', fontSize: 8, marginTop: 3 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 9, backgroundColor: 'transparent' },
  feedHeaderTitle: { color: '#F7F4EA', fontSize: 13, fontWeight: '800' },
  feedStatusText: { color: '#C3D2DA', fontSize: 10, marginTop: 4, maxWidth: 230 },
  uploadButton: { backgroundColor: '#F3B84B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  uploadButtonText: { color: '#11161D', fontSize: 10, fontWeight: '800' },
  feedScroll: { flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' },
  feedList: { paddingHorizontal: 0, paddingBottom: 0, alignItems: 'center', flexGrow: 0 },
  videoCard: { width: '100%', maxWidth: 500, alignSelf: 'center', borderRadius: Platform.OS === 'web' ? 18 : 0, overflow: 'hidden', justifyContent: 'space-between', marginBottom: 0, position: 'relative', flexShrink: 0 },
  videoBackdropCircle: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 40, borderColor: '#FFFFFF0D', top: '12%', alignSelf: 'center' },
  demoVideoStage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: '#102A43' },
  demoVideoOverlay: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start', pointerEvents: 'none' },
  demoVideoTag: { color: '#FFFFFF', backgroundColor: 'transparent', borderWidth: 0, overflow: 'visible', borderRadius: 0, paddingHorizontal: 0, paddingVertical: 0, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  demoVideoProduct: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 10, textShadowColor: '#000A', textShadowRadius: 5 },
  demoVideoHint: { color: '#FFFFFF', fontSize: 9, marginTop: 5, textShadowColor: '#000A', textShadowRadius: 5 },
  productArt: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingBottom: 30, backgroundColor: 'transparent' },
  productImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', backgroundColor: 'transparent' },
  productImageShade: { ...StyleSheet.absoluteFillObject, backgroundColor: '#05070A30' },
  imageMissing: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#141B24' },
  imageMissingText: { color: '#C7D0DA', fontSize: 13, fontWeight: '700' },
  nativeVideo: { width: '100%', height: '100%', backgroundColor: '#070B13' },
  productArtCaption: { color: '#FFFFFF88', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 18, backgroundColor: 'transparent' },
  videoTopLine: { position: 'absolute', top: Platform.OS === 'web' ? 112 : 100, left: 14, right: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoBadge: { backgroundColor: 'transparent', borderWidth: 0, borderColor: 'transparent', borderRadius: 0, paddingHorizontal: 0, paddingVertical: 0 },
  demoBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  videoLocation: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textShadowColor: '#0008', textShadowRadius: 5 },
  videoBottom: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingTop: 34, paddingBottom: Platform.OS === 'web' ? 20 : 24, gap: 6, backgroundColor: 'transparent' },
  videoDescription: { flex: 1, paddingBottom: 2 },
  sellerLine: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 8 },
  sellerName: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  followButton: { backgroundColor: '#F3B84B', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, minHeight: 38, justifyContent: 'center' },
  followingButton: { backgroundColor: '#344B5E' },
  followButtonText: { color: '#11161D', fontSize: 12, fontWeight: '900' },
  videoCaption: { color: '#FFFFFF', fontSize: 12, lineHeight: 18, marginBottom: 11, textShadowColor: '#000B', textShadowRadius: 5 },
  productPrice: { alignSelf: 'flex-start', backgroundColor: '#F5C451', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 13, minHeight: 46, justifyContent: 'center', borderWidth: 0, shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 8, elevation: 4 },
  productPriceText: { color: '#102A43', fontSize: 12, fontWeight: '900' },
  actionsRail: { alignItems: 'center', gap: Platform.OS === 'web' ? 9 : 7, width: 54, paddingBottom: 4 },
  actionButton: { alignItems: 'center', justifyContent: 'center', width: 48, minHeight: 50, paddingHorizontal: 2, paddingTop: 4, paddingBottom: 4, borderRadius: 16, backgroundColor: '#07111FAD', borderWidth: 1, borderColor: '#FFFFFF24' },
  actionIcon: { color: '#FFFFFF', fontSize: 26, fontWeight: '800' },
  actionIconActive: { color: '#F3B84B' },
  actionLabel: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', marginTop: 3, textAlign: 'center', maxWidth: 58 },
  endOfFeed: { color: '#B3C5D0', fontSize: 10, textAlign: 'center', paddingHorizontal: 25, paddingVertical: 14, lineHeight: 15 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyEmoji: { fontSize: 38, marginBottom: 12 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#C3D2DA', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#070B13', borderTopWidth: 1, borderTopColor: '#273447', paddingHorizontal: 4, paddingTop: 3, paddingBottom: Platform.OS === 'web' ? 10 : 3, minHeight: Platform.OS === 'web' ? 76 : 66, flexShrink: 0, zIndex: 25, elevation: 12 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1, minWidth: 48, minHeight: 56, paddingHorizontal: 2, paddingVertical: 3, borderRadius: 14, gap: 1, backgroundColor: 'transparent' },
  navIcon: { color: '#A9BECC', fontSize: 25, fontWeight: '900', lineHeight: 30 },
  navIconActive: { color: '#F3B84B', fontSize: 27 },
  navLabel: { color: '#E4EAF2', fontSize: 10, fontWeight: '900', textAlign: 'center', includeFontPadding: true },
  navLabelActive: { color: '#F3B84B', fontWeight: '900' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000A' },
  commentSheet: { maxHeight: '78%', minHeight: '48%', backgroundColor: '#111720', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 17, paddingTop: 10, paddingBottom: 18 },
  uploadSheet: { maxHeight: '88%', minHeight: '55%', width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#111720', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 },
  uploadIntro: { color: '#C3D2DA', fontSize: 13, lineHeight: 19, marginTop: 12 },
  uploadFileName: { color: '#F3B84B', fontSize: 12, fontWeight: '800', marginVertical: 8 },
  uploadFieldLabel: { color: '#D4E0E8', fontSize: 12, fontWeight: '800', marginTop: 14, marginBottom: 6 },
  uploadInput: { backgroundColor: '#081A2B', color: '#FFFFFF', borderWidth: 1, borderColor: '#35536A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14 },
  publishButton: { backgroundColor: '#F3B84B', borderRadius: 10, paddingVertical: 15, alignItems: 'center', marginTop: 18 },
  publishButtonText: { color: '#11161D', fontSize: 15, fontWeight: '900' },
  uploadFootnote: { color: '#9FB4C5', fontSize: 10, lineHeight: 15, marginTop: 10, textAlign: 'center' },
  modalHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: '#6B879B', alignSelf: 'center', marginBottom: 15 },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#2C4A61' },
  modalTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '900', flex: 1, marginRight: 10 },
  closeModal: { color: '#FFFFFF', fontSize: 17, padding: 4 },
  commentsList: { flexGrow: 0, marginVertical: 10 },
  commentRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 9 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#24445D', alignItems: 'center', justifyContent: 'center' },
  commentText: { color: '#E9EBF0', fontSize: 12, flex: 1 },
  commentComposer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#2C4A61', paddingTop: 10 },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 95, backgroundColor: '#1A3A54', color: '#FFFFFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 12 },
  sendComment: { backgroundColor: '#F3B84B', paddingHorizontal: 13, paddingVertical: 11, borderRadius: 9 },
  sendCommentText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  modalFootnote: { color: '#B3C5D0', fontSize: 9, marginTop: 9, textAlign: 'center' },

  profileScreen: { flex: 1, backgroundColor: '#0B0F15' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#233D52' },
  profileBack: { minWidth: 54, paddingVertical: 8 },
  profileBackText: { color: '#F3B84B', fontSize: 14, fontWeight: '800' },
  profileScreenTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  profileContent: { padding: 20, paddingBottom: 36 },
  profileIdentity: { alignItems: 'center', paddingVertical: 18 },
  profileAvatar: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C2530', borderWidth: 3, borderColor: '#F3B84B', marginBottom: 12 },
  profileAvatarText: { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  profileName: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  profileHandle: { color: '#9FB4C5', fontSize: 14, marginTop: 4 },
  profileBio: { color: '#C7D5DF', fontSize: 13, marginTop: 10, textAlign: 'center', lineHeight: 19 },
  profileStats: { flexDirection: 'row', backgroundColor: '#102A43', borderRadius: 14, paddingVertical: 18, marginVertical: 10 },
  profileStat: { flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: '#29465D' },
  profileStatNumber: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  profileStatLabel: { color: '#B7C9D5', fontSize: 12, fontWeight: '700', marginTop: 4 },
  profileEditCard: { backgroundColor: '#102A43', borderRadius: 14, padding: 16, marginTop: 12 },
  profileSectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', marginBottom: 12 },
  profileFieldLabel: { color: '#B7C9D5', fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  profileInput: { backgroundColor: '#081A2B', color: '#FFFFFF', borderWidth: 1, borderColor: '#35536A', borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12, fontSize: 14 },
  profileQuickStats: { backgroundColor: '#102A43', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 4, marginTop: 14 },
  profileQuickRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#29465D' },
  profileQuickLabel: { color: '#D4E0E8', fontSize: 13, fontWeight: '700' },
  profileQuickValue: { color: '#F3B84B', fontSize: 14, fontWeight: '900' },
  profileNote: { color: '#91A9BA', fontSize: 11, lineHeight: 17, marginTop: 14 },

});
