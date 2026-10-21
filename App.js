import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
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
} from 'react-native';

const { height: windowHeight } = Dimensions.get('window');
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
    emoji: '🛍️',
    background: '#233C59',
    likes: Number(row.likes_count || 0),
    comments: Number(row.comments_count || 0),
    isDemo: false,
  };
}
const FEED_HEIGHT = Platform.OS === 'web'\n  ? Math.max(420, windowHeight - 155)\n  : Math.max(420, windowHeight - 245);

const demoVideos = [
  {
    id: 'phone',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    seller: '@jiji_gadgets_tz',
    verified: true,
    product: 'Simu janja ya kisasa',
    price: 'TSh 450,000',
    location: 'Dar es Salaam',
    caption: 'Simu za kisasa kwa bei rafiki 🇹🇿 Uliza muuzaji kuhusu stock na delivery.',
    emoji: '📱',
    background: '#233C59',
    likes: 1200,
    comments: 2,
  },
  {
    id: 'fashion',
    videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    seller: '@mariam_fashion',
    verified: true,
    product: 'Viatu vya mtindo',
    price: 'TSh 65,000',
    location: 'Dar es Salaam',
    caption: 'Mitindo mipya imefika! Uliza kuhusu rangi na size zinazopatikana.',
    emoji: '👟',
    background: '#71465D',
    likes: 846,
    comments: 1,
  },
  {
    id: 'home',
    videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
    seller: '@mama_neema_home',
    verified: false,
    product: 'Kiti cha sebuleni',
    price: 'TSh 220,000',
    location: 'Mwanza',
    caption: 'Badili mwonekano wa nyumba yako kwa samani zilizotengenezwa kwa umakini.',
    emoji: '🪑',
    background: '#3C594B',
    likes: 532,
    comments: 1,
  },
];

const liveCreators = [
  { id: 'live-fashion', name: 'Mariam Fashion', emoji: '👗', viewers: '128' },
  { id: 'live-gadgets', name: 'Dodoma Gadgets', emoji: '📱', viewers: '76' },
  { id: 'live-home', name: 'Mama Neema', emoji: '🪑', viewers: '54' },
  { id: 'live-tech', name: 'JMK Tech', emoji: '💻', viewers: '31' },
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
  const [feedVideos, setFeedVideos] = useState(demoVideos.map((video) => ({ ...video, isDemo: true })));
  const [feedMode, setFeedMode] = useState('demo');
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedMessage, setFeedMessage] = useState('');

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
        setFeedVideos(rows.map(normalizeApiVideo));
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

  const uploadVideo = () => Alert.alert(
    'Weka video ya bidhaa',
    'Muundo wa sehemu hii umeandaliwa. Hatua inayofuata itaongeza kuchagua video, maelezo ya bidhaa, bei, eneo na kupakia faili kwenye hifadhi salama. Kwa sasa hakuna video inayopakiwa kwa umma.',
  );

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
      {Platform.OS === 'web' && item.videoUrl ? (
        <View style={styles.demoVideoStage}>
          {React.createElement('video', {
            key: item.videoUrl,
            src: item.videoUrl,
            controls: false,
            playsInline: true,
            muted: true,\n            autoPlay: true,
            loop: true,
            preload: 'metadata',
            'aria-label': 'Video ya majaribio ya SOKORA: ' + item.product,
            style: { width: '100%', height: '100%', objectFit: 'cover', backgroundColor: '#102A43' },
          })}
          <View style={styles.demoVideoOverlay}>
            <Text style={styles.demoVideoTag}>{item.isDemo ? 'VIDEO YA MAJARIBIO' : 'VIDEO YA BIDHAA'}</Text>
            <Text style={styles.demoVideoProduct}>{item.emoji}  {item.product}</Text>
            {item.isDemo && <Text style={styles.demoVideoHint}>Video za mfano kwa kupima feed · si video halisi za bidhaa</Text>}
          </View>
        </View>
      ) : (
        <View style={styles.productArt}>
          <Text style={styles.productEmoji}>{item.emoji}</Text>
          <Text style={styles.productArtCaption}>{item.isDemo ? 'SOKORA · VIDEO ZA MAJARIBIO' : 'SOKORA · BIDHAA'}</Text>
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
            <Text style={styles.brand}>SOKORA <Text style={styles.brandPlay}>▶</Text></Text>
            <Text style={styles.tagline}>Tazama. Gundua. Nunua.</Text>
          </View>
          <Pressable style={styles.goLiveButton} onPress={startLive}><Text style={styles.goLiveText}>● LIVE</Text></Pressable>
        </View>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput value={searchText} onChangeText={setSearchText} placeholder="Tafuta bidhaa, muuzaji au mji..." placeholderTextColor="#9AA3B2" style={styles.searchInput} returnKeyType="search" />
          {!!searchText && <Pressable onPress={() => setSearchText('')}><Text style={styles.clearSearch}>✕</Text></Pressable>}
        </View>
        <View style={styles.feedTabs}>
          {['Kwa ajili yako', 'Inafuatwa'].map((tab) => (
            <Pressable key={tab} onPress={() => setActiveTab(tab)} style={[styles.feedTab, activeTab === tab && styles.feedTabActive]}>
              <Text style={[styles.feedTabText, activeTab === tab && styles.feedTabTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {Platform.OS !== 'web' && (
      <View style={styles.liveSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveList}>
          {liveCreators.map((creator) => (
            <Pressable key={creator.id} style={styles.liveCreator} onPress={() => joinLive(creator)}>
              <View style={styles.liveAvatarWrap}><Text style={styles.liveEmoji}>{creator.emoji}</Text><View style={styles.liveDot} /></View>
              <Text numberOfLines={1} style={styles.liveName}>{creator.name}</Text>
              <Text style={styles.liveViewers}>● LIVE · {creator.viewers}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      )}

      {Platform.OS !== 'web' && (
      <View style={styles.feedHeader}>
        <View><Text style={styles.feedHeaderTitle}>Video za bidhaa</Text>{!!feedMessage && <Text style={styles.feedStatusText}>{feedMessage}</Text>}</View>
        <Pressable onPress={uploadVideo} style={styles.uploadButton}><Text style={styles.uploadButtonText}>＋ Weka video</Text></Pressable>
      </View>
      )}

      {feedLoading ? (
        <View style={styles.emptyState}><Text style={styles.emptyTitle}>Inapakia video…</Text><Text style={styles.emptyText}>Tunasoma video kutoka SOKORA.</Text></View>
      ) : visibleVideos.length ? (
        <FlatList
          key={activeTab}
          data={visibleVideos}
          keyExtractor={(item) => item.id}
          renderItem={renderVideo}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.feedList}
          snapToInterval={FEED_HEIGHT + 12}
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
          { id: 'Video', icon: '▶', label: 'Video' },
          { id: 'Gundua', icon: '⌕', label: 'Gundua' },
          { id: 'Weka', icon: '＋', label: 'Weka' },
          { id: 'Inbox', icon: '♡', label: 'Inbox' },
          { id: 'Wasifu', icon: '◉', label: 'Wasifu' },
        ].map((nav) => (
          <Pressable key={nav.id} style={styles.navItem} onPress={() => {
            setActiveNav(nav.id);
            if (nav.id === 'Weka') uploadVideo();
            else if (nav.id !== 'Video') Alert.alert(nav.label, 'Sehemu hii itaunganishwa na akaunti, bidhaa na ujumbe katika hatua inayofuata.');
          }}>
            <Text style={[styles.navIcon, activeNav === nav.id && styles.navIconActive]}>{nav.icon}</Text>
            <Text style={[styles.navLabel, activeNav === nav.id && styles.navLabelActive]}>{nav.label}</Text>
          </Pressable>
        ))}
      </View>

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0, backgroundColor: '#102A43' },
  header: { backgroundColor: '#102A43', paddingHorizontal: 16, paddingTop: Platform.OS === 'web' ? 3 : 8, paddingBottom: Platform.OS === 'web' ? 0 : 0 },
  headerBrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: '#FFFFFF', fontSize: Platform.OS === 'web' ? 19 : 23, fontWeight: '900', letterSpacing: 1.2 },
  brandPlay: { color: '#18A999', fontSize: 15 },
  tagline: { color: '#C3D2DA', fontSize: Platform.OS === 'web' ? 9 : 10, marginTop: 1 },
  goLiveButton: { backgroundColor: '#E53945', borderRadius: 7, paddingHorizontal: 12, paddingVertical: 8 },
  goLiveText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginTop: Platform.OS === 'web' ? 3 : 12, paddingHorizontal: 12, height: Platform.OS === 'web' ? 30 : 39, borderRadius: 10, backgroundColor: '#183A56', borderWidth: 1, borderColor: '#2A4A63' },
  searchIcon: { color: '#C3D2DA', fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, color: '#FFFFFF', paddingVertical: 5, fontSize: 12 },
  clearSearch: { color: '#FFFFFF', fontSize: 15, paddingHorizontal: 4 },
  feedTabs: { flexDirection: 'row', justifyContent: 'center', gap: 25, marginTop: Platform.OS === 'web' ? 1 : 10 },
  feedTab: { paddingHorizontal: 4, paddingBottom: Platform.OS === 'web' ? 3 : 9, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  feedTabActive: { borderBottomColor: '#18A999' },
  feedTabText: { color: '#B3C5D0', fontSize: 12, fontWeight: '700' },
  feedTabTextActive: { color: '#FFFFFF' },
  liveSection: { backgroundColor: '#102A43', borderBottomWidth: 1, borderBottomColor: '#24445D' },
  liveList: { paddingHorizontal: 13, paddingVertical: 10, gap: 15 },
  liveCreator: { width: 70, alignItems: 'center' },
  liveAvatarWrap: { width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: '#18A999', alignItems: 'center', justifyContent: 'center', backgroundColor: '#24445D', marginBottom: 5 },
  liveEmoji: { fontSize: 23 },
  liveDot: { position: 'absolute', right: -2, bottom: -1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#18A999', borderWidth: 2, borderColor: '#102A43' },
  liveName: { color: '#F7F4EA', fontSize: 9, fontWeight: '700', maxWidth: 70 },
  liveViewers: { color: '#7DDED3', fontSize: 8, marginTop: 3 },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 9 },
  feedHeaderTitle: { color: '#F7F4EA', fontSize: 13, fontWeight: '800' },
  feedStatusText: { color: '#C3D2DA', fontSize: 10, marginTop: 4, maxWidth: 230 },
  uploadButton: { backgroundColor: '#24445D', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  uploadButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  feedList: { paddingHorizontal: Platform.OS === 'web' ? 0 : 10, paddingBottom: 0, alignItems: 'stretch' },
  videoCard: { width: '100%', alignSelf: 'stretch', borderRadius: Platform.OS === 'web' ? 0 : 17, overflow: 'hidden', justifyContent: 'space-between', marginBottom: Platform.OS === 'web' ? 0 : 12, position: 'relative' },
  videoBackdropCircle: { position: 'absolute', width: 310, height: 310, borderRadius: 155, borderWidth: 40, borderColor: '#FFFFFF0D', top: '12%', alignSelf: 'center' },
  demoVideoStage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden', backgroundColor: '#102A43' },
  demoVideoOverlay: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'flex-start', pointerEvents: 'none' },
  demoVideoTag: { color: '#FFFFFF', backgroundColor: '#102A43DD', overflow: 'hidden', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  demoVideoProduct: { color: '#FFFFFF', fontSize: 17, fontWeight: '900', marginTop: 10, textShadowColor: '#000A', textShadowRadius: 5 },
  demoVideoHint: { color: '#FFFFFF', fontSize: 9, marginTop: 5, textShadowColor: '#000A', textShadowRadius: 5 },
  productArt: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 30 },
  productEmoji: { fontSize: 105, textShadowColor: '#0006', textShadowOffset: { width: 0, height: 12 }, textShadowRadius: 18 },
  productArtCaption: { color: '#FFFFFF88', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 18 },
  videoTopLine: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  demoBadge: { backgroundColor: '#0006', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 5 },
  demoBadgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '900' },
  videoLocation: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', textShadowColor: '#0008', textShadowRadius: 5 },
  videoBottom: { flexDirection: 'row', alignItems: 'flex-end', padding: 13, paddingBottom: 16, gap: 10, backgroundColor: '#05070A66' },
  videoDescription: { flex: 1, paddingBottom: 2 },
  sellerLine: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 8 },
  sellerName: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  followButton: { backgroundColor: '#18A999', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 5 },
  followingButton: { backgroundColor: '#2C4A61', borderWidth: 1, borderColor: '#FFFFFF55' },
  followButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  videoCaption: { color: '#FFFFFF', fontSize: 11, lineHeight: 16, marginBottom: 10, textShadowColor: '#0008', textShadowRadius: 3 },
  productPrice: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 9 },
  productPriceText: { color: '#102A43', fontSize: 10, fontWeight: '900' },
  actionsRail: { alignItems: 'center', gap: 13, width: 53, paddingBottom: 3 },
  actionButton: { alignItems: 'center', justifyContent: 'center', minWidth: 48 },
  actionIcon: { color: '#FFFFFF', fontSize: 25, fontWeight: '700', textShadowColor: '#000A', textShadowRadius: 5 },
  actionIconActive: { color: '#18A999' },
  actionLabel: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', marginTop: 2, textShadowColor: '#000A', textShadowRadius: 5, textAlign: 'center' },
  endOfFeed: { color: '#B3C5D0', fontSize: 10, textAlign: 'center', paddingHorizontal: 25, paddingVertical: 14, lineHeight: 15 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyEmoji: { fontSize: 38, marginBottom: 12 },
  emptyTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: '#C3D2DA', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: '#0B2239', borderTopWidth: 1, borderTopColor: '#252833', paddingTop: Platform.OS === 'web' ? 4 : 8, paddingBottom: Platform.OS === 'web' ? 4 : 7 },
  navItem: { alignItems: 'center', justifyContent: 'center', minWidth: 48, gap: 3 },
  navIcon: { color: '#A9BECC', fontSize: 19, fontWeight: '800' },
  navIconActive: { color: '#18A999' },
  navLabel: { color: '#B3C5D0', fontSize: 9, fontWeight: '700' },
  navLabelActive: { color: '#FFFFFF' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#000A' },
  commentSheet: { maxHeight: '78%', minHeight: '48%', backgroundColor: '#102A43', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 17, paddingTop: 10, paddingBottom: 18 },
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
  sendComment: { backgroundColor: '#18A999', paddingHorizontal: 13, paddingVertical: 11, borderRadius: 9 },
  sendCommentText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  modalFootnote: { color: '#B3C5D0', fontSize: 9, marginTop: 9, textAlign: 'center' },
});
