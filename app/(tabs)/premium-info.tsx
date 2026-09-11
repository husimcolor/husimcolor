import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { getTrialStatus, startTrial } from '@/lib/trialUtils';

const JOB_OPTIONS = [
  '생산직', '서비스직', '사역자', '주부',
  '학생', '프리랜서', '자영업', '무직', '기타',
];
const FAITH_OPTIONS = ['기독교', '타종교', '무교'];
const CONCERN_OPTIONS = [
  '관계', '감정 회복', '진로/일', '영성/내면',
  '가족', '자기이해', '번아웃/스트레스', '미래 방향성',
];

export default function PremiumInfoScreen() {
  const router = useRouter();
  const colors = useColors();
  const [profileAge, setProfileAge] = useState('');
  const [profileJob, setProfileJob] = useState('');
  const [profileFaith, setProfileFaith] = useState('');
  const [profileConcerns, setProfileConcerns] = useState<string[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const saved = await AsyncStorage.getItem('userProfile');
      if (!saved) return;
      const profile = JSON.parse(saved);
      if (profile.age) setProfileAge(profile.age);
      if (profile.job) setProfileJob(profile.job);
      if (profile.faith) setProfileFaith(profile.faith);
      if (profile.concerns) setProfileConcerns(profile.concerns);
    };
    loadProfile();
  }, []);

  const toggleConcern = (item: string) => {
    setProfileConcerns((previous) => {
      if (previous.includes(item)) return previous.filter((concern) => concern !== item);
      if (previous.length >= 2) return previous;
      return [...previous, item];
    });
  };

  const canContinue = Boolean(profileAge && profileJob && profileFaith);

  const handleContinue = async () => {
    if (!canContinue) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await AsyncStorage.setItem('userProfile', JSON.stringify({
      age: profileAge,
      job: profileJob,
      faith: profileFaith,
      concerns: profileConcerns,
    }));

    if (await getTrialStatus() === 'none') {
      await startTrial();
    }
    router.push('/premium-color-select' as any);
  };

  return (
    <ScreenContainer edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Pressable
              style={({ pressed }) => [styles.backButton, { backgroundColor: colors.surface }, pressed && { opacity: 0.7 }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.backButtonText, { color: colors.muted }]}>←</Text>
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>개인 심화분석 정보 입력</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>더 정확한 맞춤 해석을 위해{`\n`}간단한 정보를 입력해 주세요.</Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>나이</Text>
            <TextInput
              style={[styles.ageInput, { backgroundColor: colors.surface, borderColor: profileAge ? '#8BAF8B' : colors.border, color: colors.foreground }]}
              placeholder="나이를 입력하세요 (예: 35)"
              placeholderTextColor={colors.muted}
              keyboardType="numeric"
              value={profileAge}
              onChangeText={(text) => setProfileAge(text.replace(/[^0-9]/g, ''))}
              maxLength={3}
              returnKeyType="done"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>직업</Text>
            <View style={styles.chipGrid}>
              {JOB_OPTIONS.map((job) => (
                <TouchableOpacity
                  key={job}
                  style={[styles.chip, { backgroundColor: profileJob === job ? '#8BAF8B' : colors.surface, borderColor: profileJob === job ? '#8BAF8B' : colors.border }]}
                  onPress={() => setProfileJob(job)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: profileJob === job ? '#FFFFFF' : colors.foreground, fontWeight: profileJob === job ? '700' : '400' }]}>{job}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>신앙 여부</Text>
            <View style={styles.faithRow}>
              {FAITH_OPTIONS.map((faith) => (
                <TouchableOpacity
                  key={faith}
                  style={[styles.faithChip, { backgroundColor: profileFaith === faith ? '#8BAF8B' : colors.surface, borderColor: profileFaith === faith ? '#8BAF8B' : colors.border }]}
                  onPress={() => setProfileFaith(faith)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, { color: profileFaith === faith ? '#FFFFFF' : colors.foreground, fontWeight: profileFaith === faith ? '700' : '400' }]}>{faith}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.label, { color: colors.foreground }]}>현재 가장 고민되는 분야 <Text style={[styles.labelHint, { color: colors.muted }]}>(최대 2개)</Text></Text>
            <View style={styles.chipGrid}>
              {CONCERN_OPTIONS.map((item) => {
                const selected = profileConcerns.includes(item);
                const disabled = !selected && profileConcerns.length >= 2;
                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.chip, { backgroundColor: selected ? '#7B9FBF' : colors.surface, borderColor: selected ? '#7B9FBF' : colors.border, opacity: disabled ? 0.45 : 1 }]}
                    onPress={() => !disabled && toggleConcern(item)}
                    activeOpacity={disabled ? 1 : 0.7}
                  >
                    <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.foreground, fontWeight: selected ? '700' : '400' }]}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.continueButton, { backgroundColor: canContinue ? '#8BAF8B' : colors.border }, pressed && canContinue && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
            onPress={handleContinue}
            disabled={!canContinue}
          >
            <Text style={styles.continueButtonText}>컬러 선택하기 →</Text>
          </Pressable>
          <Text style={[styles.privacyNote, { color: colors.muted }]}>입력하신 정보는 결과 해석에만 활용되며{`\n`}외부로 전송되지 않습니다.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 48 },
  header: { alignItems: 'center', marginBottom: 30 },
  backButton: { position: 'absolute', left: 0, top: 0, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  backButtonText: { fontSize: 18, fontWeight: '700' },
  title: { fontSize: 22, fontWeight: '800', marginTop: 6, marginBottom: 8, letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 14, lineHeight: 22, textAlign: 'center' },
  section: { marginBottom: 24 },
  label: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  labelHint: { fontSize: 13, fontWeight: '400' },
  ageInput: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1.5 },
  chipText: { fontSize: 14 },
  faithRow: { flexDirection: 'row', gap: 12 },
  faithChip: { flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  continueButton: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  privacyNote: { fontSize: 12, textAlign: 'center', lineHeight: 20 },
});
