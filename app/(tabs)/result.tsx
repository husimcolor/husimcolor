import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import ViewShot, { captureRef, type ViewShotRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useColorContext } from '@/lib/colorContext';
import { useColors } from '@/hooks/use-colors';
import { generateInterpretation, COLOR_DATA } from '@/constants/colorData';
import { isPremiumActive, getTrialStatus } from '@/lib/trialUtils';

// 밝은 컬러(크림, 화이트, 아이보리 등) 자동 테두리 처리
function getLightColorBorder(hex: string): { borderWidth: number; borderColor: string } | {} {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  if (brightness >= 200) {
    return { borderWidth: 1.5, borderColor: '#C8BFB0' };
  }
  return {};
}

const SOCIAL_LINKS = {
  naver: 'https://naver.me/ID3fxw2W',
  youtube: 'https://youtube.com/@huali7603?si=zMMC1MRxIfrlWUIA',
  instagram: 'https://www.instagram.com/husim_lumiere?igsh=MTh6bWhpdWRjb2Rtcw==',
};

export default function ResultScreen() {
  const router = useRouter();
  const [trialStatus, setTrialStatus] = useState<'none' | 'active' | 'expired' | 'paid'>('none');
  const { selectedColors, resetColors } = useColorContext();
  const colors = useColors();

  // Animated 완전 제거 - 인앱 브라우저(인스타/카카오)에서 opacity 0 버그 방지
  const viewShotRef = useRef<ViewShotRef>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 이미지 저장 - 웹: <a> 다운로드 방식 / 네이티브: 시스템 공유 시트
  const handleSaveImage = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      // ViewShot으로 화면 캡처
      let uri: string | undefined;
      if (viewShotRef.current && typeof viewShotRef.current.capture === 'function') {
        uri = await viewShotRef.current.capture();
      } else {
        uri = await captureRef(viewShotRef, { format: 'png', quality: 0.95 });
      }
      if (!uri) throw new Error('캡처 실패');

      // 웹 환경: <a> 태그로 직접 다운로드
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `husimcolor_result_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      // 네이티브 환경: 임시 파일로 복사 후 시스템 공유 시트
      const destUri = `${FileSystem.cacheDirectory}husimcolor_result_${Date.now()}.png`;
      await FileSystem.copyAsync({ from: uri, to: destUri });

      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(destUri, {
          mimeType: 'image/png',
          dialogTitle: '휴심컬러 결과 저장',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('알림', '이 환경에서는 저장 기능을 사용할 수 없습니다.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('저장 실패', `이미지 저장에 실패했습니다.\n(${msg})`);
    } finally {
      setIsSaving(false);
    }
  };

  // 웹 환경 공유 헬퍼 - navigator.share() 또는 URL 클립보드 복사
  const handleWebShare = async (title: string) => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://husimcolor.vercel.app';
    // Web Share API 지원 여부 확인
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: '휴심컬러 - 나의 컬러 해석 결과',
          text: '25가지 컬러로 읽는 나의 마음 흐름 💫 지금 확인해보세요!',
          url: shareUrl,
        });
        return;
      } catch {
        // 공유 취소 등 - 아래 클립보드 복사로 폴백
      }
    }
    // 클립보드 복사 폴백
    try {
      await navigator.clipboard.writeText(shareUrl);
      Alert.alert('링크 복사 완료', `${title}에 붙여넣기 하여 공유해보세요!\n\n${shareUrl}`);
    } catch {
      Alert.alert('공유 링크', `아래 링크를 복사하여 ${title}에 공유해보세요:\n\n${shareUrl}`);
    }
  };

  // 카카오톡 공유
  const handleKakaoShare = async () => {
    if (Platform.OS === 'web') {
      await handleWebShare('카카오톡');
      return;
    }
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 0.95 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '휴심컬러 결과 공유' });
      } else {
        Alert.alert('알림', '이 환경에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch {
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  // 인스타그램 스토리 공유
  const handleInstaShare = async () => {
    if (Platform.OS === 'web') {
      await handleWebShare('인스타그램');
      return;
    }
    try {
      const uri = await captureRef(viewShotRef, { format: 'png', quality: 0.95 });
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: '인스타그램에 공유' });
      } else {
        Alert.alert('알림', '이 환경에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch {
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  const card1 = selectedColors[0];
  const card2 = selectedColors[1];
  const card3 = selectedColors[2];

  useEffect(() => {
    getTrialStatus().then(setTrialStatus);
  }, []);

  useEffect(() => {
    if (!card1 || !card2 || !card3) {
      router.replace('/(tabs)');
      return;
    }
    // 애니메이션 완전 제거 - 인앱 브라우저 호환성 우선
  }, []);

  if (!card1 || !card2 || !card3) return null;

  const interpretation = generateInterpretation(card1, card2, card3);

  const handleRestart = () => {
    resetColors();
    router.replace('/(tabs)');
  };

  const openLink = async (url: string, name: string) => {
    try {
      // 인스타그램은 앱으로 직접 열기 (WebBrowser에서 정지 화면 문제 방지)
      if (url.includes('instagram.com')) {
        await Linking.openURL(url);
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } catch {
      try {
        await Linking.openURL(url);
      } catch {
        Alert.alert('알림', `${name} 링크를 열 수 없습니다.\n직접 접속해 주세요.`);
      }
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right']}>
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: '#DDD8CE' }]}>
        <Pressable
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
          onPress={() => router.push({ pathname: '/(tabs)/select', params: { step: '2' } })}
        >
          <Text style={[styles.backButtonText, { color: '#9B8E85' }]}>← 다시 선택</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: '#3D3530' }]}>나의 컬러 해석</Text>
        <View style={{ minWidth: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ViewShot 캡처 영역 */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.95 }}>
        {/* 선택한 컬러 카드 3개 */}
        <View style={styles.colorCardsSection}>
          <Text style={[styles.sectionLabel, { color: '#555555' }]}>오늘 선택한 컬러</Text>
          <View style={styles.colorCards}>
            {[
              { card: card1, label: '1번 카드', desc: '무의식 / 내면 성향' },
              { card: card2, label: '2번 카드', desc: '현재 상태' },
              { card: card3, label: '3번 카드', desc: '회복 방향' },
            ].map(({ card, label, desc }, i) => (
              <View
                key={i}
                style={[
                  styles.colorCard,
                  { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' },
                ]}
              >
                <View
                  style={[
                    styles.colorCardCircle,
                    {
                      backgroundColor: card.hex,
                      shadowColor: card.hex,
                      shadowOpacity: 0.4,
                      shadowOffset: { width: 0, height: 3 },
                      shadowRadius: 8,
                      elevation: 4,
                      overflow: 'hidden',
                    },
                    getLightColorBorder(card.hex),
                  ]}
                >
                  <LinearGradient
                    colors={[
                      (card.highlightColor ?? 'rgba(255,255,255,0.25)') as string,
                      'transparent' as string,
                      'rgba(0,0,0,0.08)' as string,
                    ]}
                    locations={[0, 0.5, 1]}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                  />
                </View>
                <Text style={[styles.colorCardLabel, { color: '#555555' }]}>{label}</Text>
                <Text style={[styles.colorCardName, { color: '#3D3530' }]}>{card.korName}</Text>
                <Text style={[styles.colorCardDesc, { color: '#555555' }]}>{desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 해석 결과 섹션들 */}
        <View style={styles.resultSections}>

          {/* 현재 심리 흐름 */}
          <ResultCard
            icon="🌊"
            title="지금 나의 마음"
            content={interpretation.psychologyFlow}
            bgColor="#F2EFE7"
            borderColor="#DDD8CE"
            titleColor="#3D3530"
            contentColor="#3D3530"
          />

          {/* 성격 흐름 */}
          <ResultCard
            icon="🌿"
            title="나의 성향"
            content={interpretation.personalityFlow}
            bgColor="#F2EFE7"
            borderColor="#DDD8CE"
            titleColor="#3D3530"
            contentColor="#3D3530"
          />

          {/* 장점 & 감정 패턴 나란히 */}
          <View style={styles.twoColumnSection}>
            <View
              style={[
                styles.halfCard,
                { backgroundColor: '#F0F7F0', borderColor: '#C8DFC8' },
              ]}
            >
              <Text style={styles.halfCardIcon}>✨</Text>
              <Text style={[styles.halfCardTitle, { color: '#4A7A4A' }]}>장점</Text>
              {interpretation.strengths.map((s, i) => (
                <View key={i} style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: '#C8DFC8' }]}>
                    <Text style={[styles.tagText, { color: '#3A6A3A' }]}>{s}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View
              style={[
                styles.halfCard,
                { backgroundColor: '#FBF5EE', borderColor: '#E8D8C0' },
              ]}
            >
              <Text style={styles.halfCardIcon}>💛</Text>
              <Text style={[styles.halfCardTitle, { color: '#8A6A3A' }]}>마음 습관</Text>
              {interpretation.shadows.map((s, i) => (
                <View key={i} style={styles.tagRow}>
                  <View style={[styles.tag, { backgroundColor: '#E8D8C0' }]}>
                    <Text style={[styles.tagText, { color: '#7A5A2A' }]}>{s}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* 보완 컬러 */}
          <View
            style={[
              styles.complementCard,
              { backgroundColor: '#F8F5EE', borderColor: '#E0D8C8' },
            ]}
          >
            <View style={styles.complementHeader}>
              <Text style={styles.complementIcon}>🎨</Text>
              <Text style={[styles.complementTitle, { color: '#2A2A2A' }]}>보완 컬러</Text>
            </View>
            <Text style={[styles.complementDesc, { color: '#555555' }]}>
              지금 나에게 도움이 되는 컬러
            </Text>
            <View style={styles.complementTags}>
              {interpretation.complementColors.map((c, i) => {
                const colorInfo = COLOR_DATA.find(d => d.korName === c);
                return (
                  <View
                    key={i}
                    style={[styles.complementTag, { backgroundColor: '#4A7A5A', borderColor: '#2E5C3E', flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 7, paddingHorizontal: 12, minWidth: 90 }]}
                  >
                    <Text style={[styles.complementTagText, { color: '#FFFFFF', fontWeight: '700' }]}>{c}</Text>
                    {colorInfo && (
                      <Text style={{ color: '#CCEAD6', fontSize: 11, marginTop: 2, lineHeight: 15 }}>{colorInfo.recovery}</Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* 회복 방향 - 3번 카드 고유 회복 에너지 설명 */}
          <View
            style={[
              styles.recoveryCard,
              { backgroundColor: '#EFF7F0', borderColor: '#B8D8C0' },
            ]}
          >
            <View style={styles.recoveryHeader}>
              <Text style={styles.recoveryIcon}>🌱</Text>
              <Text style={[styles.recoveryTitle, { color: '#2A6A3A' }]}>회복 방향</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              <View style={[styles.recoveryBadge, { backgroundColor: '#B8D8C0', borderColor: '#8ABF9A' }]}>
                <Text style={[styles.recoveryBadgeText, { color: '#1A5A2A' }]}>{card3.korName} 컬러</Text>
              </View>
              <View style={[styles.recoveryBadge, { backgroundColor: '#D8EED8', borderColor: '#A8CEB0' }]}>
                <Text style={[styles.recoveryBadgeText, { color: '#1A5A2A' }]}>{card3.recovery}</Text>
              </View>
            </View>
            <Text style={[styles.recoveryDetail, { color: '#2A5A3A', lineHeight: 24 }]}>
              {interpretation.recoveryFlow}
            </Text>
          </View>

          {/* 오늘의 코칭 메시지 - 짧고 따뜻한 한 마디 */}
          <View
            style={[
              styles.coachingCard,
              { backgroundColor: '#FBF5EE', borderColor: '#E8D8C0' },
            ]}
          >
            <View style={styles.coachingHeader}>
              <Text style={styles.coachingIcon}>💌</Text>
              <Text style={[styles.coachingTitle, { color: '#8A6A3A' }]}>오늘의 코칭 메시지</Text>
            </View>
            <View style={[styles.coachingDivider, { backgroundColor: '#E8D8C0' }]} />
            <Text style={[styles.coachingMessage, { color: '#4A3010', lineHeight: 30, textAlign: 'center' }]}>
              {interpretation.coachingMessage}
            </Text>
          </View>

        </View>
        </ViewShot>{/* ViewShot 캡처 영역 끝 */}

        {/* 공유 버튼 섹션 */}
        <View style={styles.shareSection}>
          <Text style={[styles.shareSectionTitle, { color: '#555555' }]}>결과 저장 및 공유</Text>
          <View style={styles.shareButtons}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.shareButton, { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' }]}
              onPress={handleSaveImage}
            >
              <Text style={styles.shareButtonIcon}>📷</Text>
              <Text style={[styles.shareButtonText, { color: '#3D3530' }]}>
                {isSaving ? '저장 중...' : '이미지 저장'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.shareButton, { backgroundColor: '#FEE500', borderColor: '#FEE500' }]}
              onPress={handleKakaoShare}
            >
              <Text style={styles.shareButtonIcon}>💬</Text>
              <Text style={[styles.shareButtonText, { color: '#3A1D1D' }]}>카카오톡 공유</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.shareButton, { backgroundColor: '#E1306C', borderColor: '#E1306C' }]}
              onPress={handleInstaShare}
            >
              <Text style={styles.shareButtonIcon}>📸</Text>
              <Text style={[styles.shareButtonText, { color: '#fff' }]}>인스타 스토리</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 소셜 링크 섹션 */}
        <View style={styles.socialSection}>
          <View style={[styles.socialDivider, { backgroundColor: '#DDD8CE' }]} />

          {/* 브랜드 문구 */}
          <View style={styles.brandMessageBox}>
            <Text style={[styles.socialTitle, { color: '#3D3530' }]}>
              {'나를 더 깊이 이해하고 싶다면\n컬러 코칭이 도움이 될 수 있습니다'}
            </Text>
            <Text style={[styles.socialSubtitle, { color: '#555555' }]}>
              휴심컬러와 함께하는 1:1 컬러 코칭을 만나보세요
            </Text>
          </View>

          <View style={styles.socialButtons}>
            {/* 네이버 예약 */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.socialButton, { backgroundColor: '#03C75A' }]}
              onPress={() => openLink(SOCIAL_LINKS.naver, '네이버 예약')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>N</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>네이버 예약</Text>
                  <Text style={styles.socialButtonDesc}>1:1 컬러 코칭 예약하기</Text>
                  <Text style={styles.socialButtonAddr}>이음트레이드 · 동소문로 47 701호</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* 유튜브 묵상채널 */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.socialButton, { backgroundColor: '#FF0000' }]}
              onPress={() => openLink(SOCIAL_LINKS.youtube, '유튜브 묵상채널')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>▶</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>유튜브 묵상채널</Text>
                  <Text style={styles.socialButtonDesc}>마음을 쉬게 하는 묵상 영상</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </TouchableOpacity>

            {/* 인스타그램 */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.socialButton, { backgroundColor: '#E1306C' }]}
              onPress={() => openLink(SOCIAL_LINKS.instagram, '인스타그램')}
            >
              <View style={styles.socialButtonContent}>
                <View style={[styles.socialIconBg, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.socialIconText}>📷</Text>
                </View>
                <View style={styles.socialTextGroup}>
                  <Text style={styles.socialButtonTitle}>인스타그램</Text>
                  <Text style={styles.socialButtonDesc}>휴심컬러 감성 코칭 팔로우</Text>
                </View>
                <Text style={styles.socialArrow}>→</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 심화 코칭 결제 유도 배너 */}
        <View style={styles.upsellBanner}>
          <Text style={styles.upsellTitle}>
            🌿 더 깊은 내면의 흐름이 궁금하신가요?
          </Text>
          <Text style={styles.upsellDesc}>
            63장 컬러+도형 카드로 무의식 · 현재 심리 · 회복 방향을{"\n"}
            심층 분석해 드립니다
          </Text>
          {trialStatus === 'none' && (
            <TouchableOpacity
              style={[styles.upsellTrialBtn]}
              onPress={() => router.push('/payment' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.upsellTrialBtnText}>🌿 초기 오픈 체험 중 · 지금 무료로 시작하기</Text>
            </TouchableOpacity>
          )}
          {trialStatus === 'active' && (
            <TouchableOpacity
              style={[styles.upsellActiveBtn]}
              onPress={() => router.push('/payment' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.upsellActiveBtnText}>심화 분석 열기 →</Text>
            </TouchableOpacity>
          )}
          {(trialStatus === 'expired' || trialStatus === 'paid') && (
            <TouchableOpacity
              style={[styles.upsellPayBtn]}
              onPress={() => router.push('/payment' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.upsellPayBtnText}>심화 코칭 전체 보기 (30,000원) →</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* 후기 남기기 버튼 */}
        <View style={styles.reviewButtonSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.reviewButton, { backgroundColor: '#8FA68E' }]}
            onPress={() => router.push('/reviews' as any)}
          >
            <Text style={styles.reviewButtonText}>후기 남기기 혹은 후기 보기 →</Text>
          </TouchableOpacity>
        </View>

        {/* 다시 시작 버튼 */}
        <View style={styles.restartSection}>
          <Pressable
            style={({ pressed }) => [
              styles.restartButton,
              { borderColor: '#DDD8CE', backgroundColor: '#F2EFE7' },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handleRestart}
          >
            <Text style={[styles.restartButtonText, { color: '#444444' }]}>
              ↺  처음부터 다시 시작하기
            </Text>
          </Pressable>
          <Text style={[styles.footer, { color: '#666666' }]}>
            휴심컬러 · 색으로 읽는 나의 마음
          </Text>        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenContainer>
  );
}

function ResultCard({
  icon,
  title,
  content,
  bgColor,
  borderColor,
  titleColor,
  contentColor,
}: {
  icon: string;
  title: string;
  content: string;
  bgColor: string;
  borderColor: string;
  titleColor: string;
  contentColor: string;
}) {
  return (
    <View style={[styles.resultCard, { backgroundColor: bgColor, borderColor }]}>
      <View style={styles.resultCardHeader}>
        <Text style={styles.resultCardIcon}>{icon}</Text>
        <Text style={[styles.resultCardTitle, { color: titleColor }]}>{title}</Text>
      </View>
      <Text style={[styles.resultCardContent, { color: contentColor }]}>{content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  backButton: {
    paddingVertical: 4,
    paddingRight: 8,
    minWidth: 80,
  },
  backButtonText: {
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  colorCardsSection: {
    marginBottom: 20,
    gap: 10,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  colorCards: {
    flexDirection: 'row',
    gap: 10,
  },
  colorCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  colorCardCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  colorCardLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  colorCardName: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorCardDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  resultSections: {
    gap: 12,
  },
  resultCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  resultCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultCardIcon: {
    fontSize: 18,
  },
  resultCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultCardContent: {
    fontSize: 14,
    lineHeight: 24,
  },
  twoColumnSection: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  halfCardIcon: {
    fontSize: 18,
  },
  halfCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'column',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    flexWrap: 'wrap',
  },
  complementCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  complementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  complementIcon: {
    fontSize: 18,
  },
  complementTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  complementDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  complementTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  complementTag: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  complementTagText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  coachingCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  coachingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coachingIcon: {
    fontSize: 20,
  },
  coachingTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  coachingDivider: {
    height: 1,
    borderRadius: 1,
  },
  coachingMessage: {
    fontSize: 16,
    lineHeight: 28,
    fontWeight: '500',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 4,
  },
  recoveryCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  recoveryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recoveryIcon: {
    fontSize: 18,
  },
  recoveryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  recoveryContent: {
    fontSize: 15,
    fontWeight: '600',
  },
  recoveryDetail: {
    fontSize: 14,
    lineHeight: 22,
  },
  recoveryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  recoveryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  socialSection: {
    marginTop: 24,
    gap: 14,
  },
  socialDivider: {
    height: 1,
    borderRadius: 1,
    marginBottom: 4,
  },
  brandMessageBox: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  socialTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: 0.3,
  },
  socialSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  socialButtons: {
    gap: 10,
  },
  socialButton: {
    borderRadius: 14,
    padding: 16,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  socialTextGroup: {
    flex: 1,
    gap: 2,
  },
  socialButtonTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  socialButtonDesc: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  socialButtonAddr: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 2,
  },
  socialArrow: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '300',
  },
  restartSection: {
    marginTop: 24,
    alignItems: 'center',
    gap: 16,
  },
  restartButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  restartButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
  shareSection: {
    marginTop: 20,
    marginHorizontal: 16,
    gap: 10,
  },
  shareSectionTitle: {
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  shareButtons: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  shareButtonIcon: {
    fontSize: 20,
  },
  shareButtonText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  upsellBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F0F7F0',
    borderWidth: 1,
    borderColor: '#8BAF8B55',
  },
  upsellTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3A6B3A',
    marginBottom: 6,
    textAlign: 'center',
  },
  upsellDesc: {
    fontSize: 13,
    color: '#5A7A5A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  upsellTrialBtn: {
    backgroundColor: '#8BAF8B',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  upsellTrialBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  upsellActiveBtn: {
    backgroundColor: '#5A8A5A',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  upsellActiveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  upsellPayBtn: {
    backgroundColor: '#3A6B3A',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center' as const,
  },
  upsellPayBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  reviewButtonSection: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  reviewButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});
