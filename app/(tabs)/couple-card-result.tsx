/**
 * 커플 세션 카드 해석 중간 결과 화면 (2단계 심화 코칭)
 * - 카드 3장 개별 해석 (무의식·현재·미래 위치별)
 * - 무의식→현재→미래 통합 흐름 분석
 * - 카드 기반 코칭 메시지
 * - 보완 루틴 (호흡 / 휴식 / 관계 / 감정표현)
 * - A 완료 후 → B 컬러 선택으로 이동
 * - B 완료 후 → 커플 통합 결과로 이동
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CARD_DATA } from '@/constants/cardData';
import { COLOR_DATA } from '@/constants/colorData';
import type { CoupleSessionData, PersonSession } from '@/constants/coupleData';

const POSITION_LABELS = ['무의식 · 내면 에너지', '현재 현실 에너지', '미래 · 회복 · 희망 에너지'];
const POSITION_DESCS = [
  '지금 의식하지 못하는 내면 깊은 곳의 에너지입니다.',
  '현재 현실에서 드러나는 심리 흐름입니다.',
  '앞으로 회복하고 나아갈 방향의 에너지입니다.',
];
const POSITION_COLORS = ['#3D6B3D', '#B5A0C8', '#C4956A'];

// 카드 3장 흐름 통합 분석 생성
function buildCardFlowAnalysis(
  cards: typeof CARD_DATA,
  prevColors: { korName: string; hex: string }[],
  faith: string
): { flow: string; coaching: string; routine: string } {
  if (cards.length < 3) {
    return {
      flow: '카드 흐름을 읽는 중입니다.',
      coaching: '마음이 이끄는 방향으로 천천히 나아가세요.',
      routine: '하루 5분, 조용히 자신의 감정을 들여다보는 시간을 가져보세요.',
    };
  }

  const c1 = cards[0] as any; // 무의식
  const c2 = cards[1] as any; // 현재
  const c3 = cards[2] as any; // 미래/회복

  // 통합 흐름 문장: 무의식→현재→미래 연결
  const flowParts: string[] = [];

  // 무의식 카드 기반 도입
  const unconsciousIntros: Record<string, string> = {
    red: '무의식 깊은 곳에서는 강한 추진력과 열정이 자리하고 있습니다.',
    orange: '내면에는 따뜻한 관계와 연결에 대한 깊은 갈망이 있습니다.',
    coral: '무의식 안에 자신을 먼저 돌봐주고 싶은 마음이 담겨 있습니다.',
    magenta: '내면 깊은 곳에 강렬한 감정과 변화에 대한 욕구가 있습니다.',
    pink: '무의식 안에 사랑받고 싶은 마음과 따뜻한 연결에 대한 갈망이 있습니다.',
    peach: '내면에는 부드럽고 따뜻한 관계를 원하는 마음이 자리하고 있습니다.',
    beige: '무의식 안에 안정과 포근함에 대한 깊은 필요가 있습니다.',
    cream: '내면 깊은 곳에서 고요하고 단순한 삶을 원하는 마음이 있습니다.',
    gold: '무의식 안에 자신의 가치를 인정받고 싶은 마음이 담겨 있습니다.',
    brown: '내면에는 안정적인 기반과 뿌리에 대한 깊은 필요가 있습니다.',
    terracotta: '무의식 안에 열정과 안정 사이에서 균형을 찾으려는 마음이 있습니다.',
    blue: '내면 깊은 곳에 신뢰와 진솔한 소통에 대한 갈망이 자리하고 있습니다.',
    skyblue: '무의식 안에 자유롭게 펼쳐지고 싶은 마음이 담겨 있습니다.',
    teal: '내면에는 감정의 균형과 조화로운 흐름에 대한 깊은 필요가 있습니다.',
    mint: '무의식 안에 가볍고 청명하게 회복되고 싶은 마음이 있습니다.',
    indigo: '내면 깊은 곳에서 진리와 의미를 탐구하려는 성찰의 에너지가 있습니다.',
    violet: '무의식 안에 깊은 내면 탐색과 영적 연결에 대한 갈망이 있습니다.',
    black: '내면 깊은 곳에 경계와 자기 보호에 대한 강한 필요가 있습니다.',
    silver: '무의식 안에 명료함과 정제된 감정을 원하는 마음이 담겨 있습니다.',
    green: '내면에는 자연스러운 회복과 균형에 대한 깊은 갈망이 있습니다.',
    olive: '무의식 안에 안정적인 뿌리와 성숙한 성장을 원하는 마음이 있습니다.',
    sage: '내면 깊은 곳에 치유와 평온함에 대한 깊은 필요가 자리하고 있습니다.',
    lavender: '무의식 안에 조용하고 섬세한 감정의 흐름이 자리하고 있습니다.',
    white: '내면 깊은 곳에 모든 것을 비우고 새롭게 시작하고 싶은 마음이 있습니다.',
    yellow: '무의식 안에 밝고 희망적인 에너지와 새로운 가능성에 대한 갈망이 있습니다.',
  };

  // 현재 카드 기반 연결
  const currentBridges: Record<string, string> = {
    red: '현재는 그 에너지가 현실에서 강하게 분출되고 있는 시기입니다.',
    orange: '현재는 관계 속에서 활발하게 표현하며 살아가고 있습니다.',
    coral: '지금은 자신과 타인 사이에서 균형을 찾으려 노력하는 시기입니다.',
    magenta: '현재는 강한 감정이 현실에서 드러나고 있는 시기입니다.',
    pink: '지금은 따뜻한 관계를 통해 감정을 채워가고 있는 시기입니다.',
    peach: '현재는 부드럽게 주변과 연결되며 감정을 나누고 있습니다.',
    beige: '지금은 조용히 안정을 유지하며 살아가고 있는 시기입니다.',
    cream: '현재는 복잡함을 정리하고 고요함 속에 머물고 있는 시기입니다.',
    gold: '지금은 자신의 가치를 현실에서 표현하며 살아가고 있습니다.',
    brown: '현재는 안정적인 기반 위에서 차분하게 나아가고 있는 시기입니다.',
    terracotta: '지금은 열정과 현실 사이에서 균형을 잡아가고 있는 시기입니다.',
    blue: '현재는 신뢰와 책임감을 바탕으로 살아가고 있는 시기입니다.',
    skyblue: '지금은 자유로운 가능성을 현실에서 펼쳐가고 있는 시기입니다.',
    teal: '현재는 감정과 이성 사이에서 균형을 찾아가고 있는 시기입니다.',
    mint: '지금은 가볍고 청명한 에너지로 현실을 살아가고 있습니다.',
    indigo: '현재는 깊은 성찰과 내면 탐색이 이루어지고 있는 시기입니다.',
    violet: '지금은 내면의 깊이와 의미를 현실에서 찾아가고 있는 시기입니다.',
    black: '현재는 경계를 지키며 자신을 보호하는 시기입니다.',
    silver: '지금은 감정을 차분히 정리하며 명료함을 찾아가고 있습니다.',
    green: '현재는 자연스러운 회복의 흐름 속에 있는 시기입니다.',
    olive: '지금은 묵묵히 자리를 지키며 성숙하게 나아가고 있습니다.',
    sage: '현재는 치유의 에너지가 조용히 흐르고 있는 시기입니다.',
    lavender: '지금은 섬세한 감정을 천천히 정리해가고 있는 시기입니다.',
    white: '현재는 비우고 정리하며 새로운 시작을 준비하고 있는 시기입니다.',
    yellow: '지금은 밝고 희망적인 에너지로 현실을 살아가고 있습니다.',
  };

  // 회복 카드 기반 마무리
  const recoveryClosings: Record<string, string> = {
    red: '앞으로는 잠시 속도를 늦추고 자신을 쉬게 해주는 시간이 필요합니다.',
    orange: '앞으로는 따뜻한 관계 속에서 자연스럽게 생기를 되찾을 수 있습니다.',
    coral: '앞으로는 자신을 먼저 돌봐주는 연습이 회복의 시작이 됩니다.',
    magenta: '앞으로는 억눌린 감정을 부드럽게 꺼내는 시간이 회복을 도울 것입니다.',
    pink: '앞으로는 자신에게 따뜻하게 대해주는 것이 가장 중요한 회복입니다.',
    peach: '앞으로는 자신을 사랑하는 연습을 시작하는 것이 회복의 방향입니다.',
    beige: '앞으로는 포근하고 부드러운 안정 속에서 자연스럽게 회복될 것입니다.',
    cream: '앞으로는 자신만의 고요한 리듬으로 돌아가는 시간이 필요합니다.',
    gold: '앞으로는 자신의 고유한 가치를 편안하게 인정하는 것이 회복의 시작입니다.',
    brown: '앞으로는 익숙한 것에서 조금씩 유연해지는 연습이 도움이 됩니다.',
    terracotta: '앞으로는 내면의 고요한 평화를 찾는 시간이 회복을 이끌 것입니다.',
    blue: '앞으로는 믿을 수 있는 사람에게 솔직하게 표현하는 것이 회복의 방향입니다.',
    skyblue: '앞으로는 현실에 발을 딛고 꿈을 향해 나아가는 균형이 필요합니다.',
    teal: '앞으로는 감정을 정화하고 균형을 되찾는 시간이 회복을 도울 것입니다.',
    mint: '앞으로는 몸과 마음을 충분히 쉬게 해주는 것이 가장 중요한 회복입니다.',
    indigo: '앞으로는 자신의 직관을 신뢰하며 깊이 성찰하는 시간이 필요합니다.',
    violet: '앞으로는 지금 있는 그대로의 자신을 조용히 바라보는 시간이 회복을 이끕니다.',
    black: '앞으로는 경계를 지키며 자신을 보호하는 것이 회복의 시작입니다.',
    silver: '앞으로는 감정을 천천히 정리하고 명료함을 찾는 시간이 필요합니다.',
    green: '앞으로는 자연스럽게 회복되도록 두는 것이 가장 좋은 방향입니다.',
    olive: '앞으로는 뿌리를 내리고 안정을 찾는 과정이 회복을 도울 것입니다.',
    sage: '앞으로는 치유의 마음을 자신에게도 돌려주는 것이 회복의 방향입니다.',
    lavender: '앞으로는 자신을 위한 조용하고 따뜻한 시간을 갖는 것이 회복을 이끕니다.',
    white: '앞으로는 복잡함을 내려놓고 단순하게 정리하는 것이 회복의 시작입니다.',
    yellow: '앞으로는 밝고 가벼운 마음으로 다시 시작하는 것이 회복의 방향입니다.',
  };

  const intro = unconsciousIntros[c1.color ?? c1.id] ?? '내면 깊은 곳에 중요한 에너지가 자리하고 있습니다.';
  const bridge = currentBridges[c2.color ?? c2.id] ?? '현재는 그 에너지가 현실에서 드러나고 있는 시기입니다.';
  const closing = recoveryClosings[c3.color ?? c3.id] ?? '앞으로는 자신을 돌봐주는 시간이 회복을 이끌 것입니다.';

  const flow = `${intro} ${bridge} ${closing}`;

  // 코칭 메시지: 1번 카드 현재 상태 + 3번 카드 회복 방향 연결
  const faithNote =
    faith === '기독교'
      ? ' 기도와 말씀 안에서 그 흐름을 찾아가실 수 있습니다.'
      : faith === '무교'
      ? ' 조용한 산책이나 혼자만의 시간이 그 흐름을 도와줄 것입니다.'
      : '';

  const coachingIntros: Record<string, string> = {
    red: '지금 많은 힘을 쏟으며 달려오고 있습니다.',
    orange: '관계 속에서 많은 것을 주고 있는 시기입니다.',
    coral: '주변을 돌보느라 자신을 뒤로 미뤄온 것 같습니다.',
    magenta: '강렬한 감정이 마음속에 쌓여 있는 시기입니다.',
    pink: '타인을 위해 많은 감정을 쏟아온 시간이었습니다.',
    peach: '따뜻하게 주변을 챙겨왔지만 정작 자신은 지쳐 있습니다.',
    beige: '조용히 안정을 유지하려 애써온 시기입니다.',
    cream: '복잡한 것들을 정리하고 고요히 머물고 싶은 마음이 있습니다.',
    gold: '자신의 가치를 충분히 인정받지 못한 느낌이 있을 수 있습니다.',
    brown: '안정을 원하면서도 변화 앞에서 마음이 경직되는 시기입니다.',
    terracotta: '안정과 열정 사이에서 내면의 갈등이 있는 시기입니다.',
    blue: '책임감 있게 살아왔지만 감정을 표현하지 못해 답답함이 쌓여 있습니다.',
    skyblue: '자유롭고 싶은 마음이 강하지만 현실의 무게가 느껴지는 시기입니다.',
    teal: '이성적으로는 잘 정리되어 있지만 감정과의 연결이 조금 부족한 시기입니다.',
    mint: '새롭게 시작하고 싶지만 먼저 깊은 휴식이 필요한 상태입니다.',
    indigo: '혼자 오래 생각하며 많은 것을 마음속에 담아온 시기입니다.',
    violet: '내면을 깊이 들여다보고 싶은 마음이 강한 시기입니다.',
    black: '많은 것을 혼자 감당하며 경계를 지켜온 시기입니다.',
    silver: '감정을 조용히 정리하며 명료함을 찾고 있는 시기입니다.',
    green: '균형을 유지하려 노력해왔지만 내면의 회복이 필요한 시기입니다.',
    olive: '묵묵히 자리를 지켜왔지만 자신을 위한 시간이 부족했습니다.',
    sage: '주변을 치유하느라 자신의 감정은 조용히 쌓아온 시기입니다.',
    lavender: '감정을 섬세하게 느끼며 천천히 정리하고 싶은 시기입니다.',
    white: '복잡한 것들을 내려놓고 단순하게 정리하고 싶은 마음이 있습니다.',
    yellow: '밝게 지내려 했지만 내면에는 정리되지 않은 감정이 있습니다.',
  };

  const recoveryKeywords: Record<string, string> = {
    red: '잠시 속도를 늦추고 자신을 쉬게 해주는',
    orange: '따뜻한 관계 속에서 생기를 되찾는',
    coral: '자신을 먼저 돌봐주는',
    magenta: '억눌린 감정을 부드럽게 꺼내는',
    pink: '자신에게 따뜻하게 대해주는',
    peach: '자신을 사랑하는 연습을 시작하는',
    beige: '포근하고 부드러운 안정을 찾는',
    cream: '자신만의 고요한 리듬으로 돌아가는',
    gold: '자신의 고유한 가치를 편안하게 인정하는',
    brown: '익숙한 것에서 조금씩 유연해지는',
    terracotta: '내면의 고요한 평화를 찾는',
    blue: '믿을 수 있는 사람에게 솔직하게 표현하는',
    skyblue: '현실에 발을 딛고 꿈을 향해 나아가는',
    teal: '감정을 정화하고 균형을 되찾는',
    mint: '몸과 마음을 충분히 쉬게 해주는',
    indigo: '자신의 직관을 신뢰하며 깊이 성찰하는',
    violet: '지금 있는 그대로의 자신을 조용히 바라보는',
    black: '경계를 지키며 자신을 보호하는',
    silver: '감정을 천천히 정리하고 명료함을 찾는',
    green: '자연스럽게 회복되도록 두는',
    olive: '뿌리를 내리고 안정을 찾는',
    sage: '치유의 마음을 자신에게도 돌려주는',
    lavender: '자신을 위한 조용하고 따뜻한 시간을 갖는',
    white: '복잡함을 내려놓고 단순하게 정리하는',
    yellow: '밝고 가벼운 마음으로 다시 시작하는',
  };

  const c1Id = c1.color ?? c1.id;
  const c3Id = c3.color ?? c3.id;
  const coachingIntro = coachingIntros[c1Id] ?? '지금 마음속에 많은 것들이 쌓여 있는 시기입니다.';
  const recoveryKeyword = recoveryKeywords[c3Id] ?? '한 걸음씩 자신에게 돌아오는';
  const coaching = `${coachingIntro} ${recoveryKeyword} 시간이 지금 가장 필요합니다.${faithNote}`;

  // 보완 루틴: 3번 카드(회복 방향) 기반
  const routineMap: Record<string, string> = {
    red: '하루 10분, 조용히 앉아 아무것도 하지 않는 시간을 가져보세요. 빠른 호흡 대신 천천히 숨을 고르는 연습이 도움이 됩니다.',
    orange: '가까운 사람과 짧은 대화를 나눠보세요. 맛있는 것을 함께 먹거나 가벼운 산책이 감정을 자연스럽게 회복시켜 줍니다.',
    coral: '하루 한 번, 자신에게 "오늘 수고했어"라고 말해주세요. 따뜻한 차 한 잔과 함께 자신을 위한 시간을 만들어 보세요.',
    magenta: '감정 일기를 써보세요. 억눌린 감정을 글로 꺼내는 것만으로도 마음이 가벼워집니다.',
    pink: '자신에게 작은 선물을 해보세요. 좋아하는 것을 하거나 좋아하는 공간에서 시간을 보내는 것이 회복을 돕습니다.',
    peach: '거울을 보며 자신에게 따뜻한 말을 건네보세요. 자기 자신을 돌보는 작은 루틴이 큰 회복을 만들어 냅니다.',
    beige: '포근한 공간에서 좋아하는 음악을 들으며 쉬어보세요. 억지로 무언가를 하지 않아도 되는 시간이 필요합니다.',
    cream: '디지털 기기를 잠시 내려놓고 조용한 시간을 가져보세요. 단순하고 고요한 환경이 마음을 정리해 줍니다.',
    gold: '자신이 잘하는 것, 좋아하는 것을 적어보세요. 자신의 강점을 인식하는 것이 자기 가치 회복의 시작입니다.',
    brown: '자연 속을 천천히 걸어보세요. 땅을 밟으며 뿌리를 내리는 느낌이 안정감을 회복시켜 줍니다.',
    terracotta: '명상이나 깊은 호흡 연습을 시도해보세요. 내면의 고요함을 찾는 시간이 균형을 회복시켜 줍니다.',
    blue: '신뢰하는 사람에게 솔직하게 감정을 표현해보세요. 말로 꺼내는 것만으로도 마음이 가벼워집니다.',
    skyblue: '하늘을 바라보며 자유롭게 꿈꾸는 시간을 가져보세요. 현실과 꿈 사이의 균형을 찾는 것이 중요합니다.',
    teal: '물 근처에서 시간을 보내거나 따뜻한 목욕을 해보세요. 감정을 정화하고 균형을 되찾는 데 도움이 됩니다.',
    mint: '충분한 수면과 휴식을 취해보세요. 몸이 쉬어야 마음도 회복됩니다. 가벼운 스트레칭도 좋습니다.',
    indigo: '조용한 공간에서 혼자만의 성찰 시간을 가져보세요. 일기 쓰기나 명상이 내면의 직관을 깨우는 데 도움이 됩니다.',
    violet: '예술 활동이나 창의적인 표현을 시도해보세요. 자신을 있는 그대로 바라보는 시간이 깊은 회복을 이끕니다.',
    black: '혼자만의 공간과 시간을 충분히 확보해보세요. 경계를 지키는 것이 자신을 보호하는 가장 중요한 방법입니다.',
    silver: '복잡한 생각들을 종이에 적어 정리해보세요. 명료함을 찾는 것이 감정 회복의 시작입니다.',
    green: '자연 속에서 시간을 보내거나 식물을 돌봐보세요. 자연스러운 회복의 리듬을 따라가는 것이 가장 좋습니다.',
    olive: '뿌리 있는 것들과 연결되어 보세요. 오래된 친구를 만나거나 익숙한 공간에서 안정감을 찾아보세요.',
    sage: '자신에게도 치유의 마음을 돌려주세요. 다른 사람을 돌보듯 자신을 돌보는 연습이 필요합니다.',
    lavender: '라벤더 향이 나는 차를 마시거나 조용한 음악을 들으며 쉬어보세요. 섬세한 감각을 통한 회복이 효과적입니다.',
    white: '불필요한 것들을 정리하고 공간을 비워보세요. 단순함 속에서 새로운 시작의 에너지가 생겨납니다.',
    yellow: '좋아하는 것을 하며 가볍게 즐겨보세요. 밝고 긍정적인 에너지가 자연스럽게 회복을 이끌 것입니다.',
  };

  const routine = routineMap[c3Id] ?? '하루 5분, 조용히 자신의 감정을 들여다보는 시간을 가져보세요.';

  return { flow, coaching, routine };
}

type CardItem = {
  id: string;
  colorId?: string;
  colorKor: string;
  colorHex: string;
  shapeKor: string;
  shapeSymbol: string;
  psychologyFlow: string;
  personalityFlow: string;
  recoveryDirection: string;
};

export default function CoupleCardResultScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { person } = useLocalSearchParams<{ person: 'A' | 'B' }>();
  const personLabel = person === 'A' ? '첫 번째 사람' : '두 번째 사람';
  const accentColor = person === 'A' ? '#3D6B3D' : '#7B5EA7';
  const accentBg = person === 'A' ? '#F0F5F0' : '#F5F0FA';
  const accentBorder = person === 'A' ? '#8BAF8B55' : '#7B5EA755';

  const [isLoading, setIsLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState<CardItem[]>([]);
  const [prevColors, setPrevColors] = useState<{ korName: string; hex: string }[]>([]);
  const [cardFlow, setCardFlow] = useState<{ flow: string; coaching: string; routine: string } | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem('@couple_session').then(raw => {
      if (!raw) return;
      const data: CoupleSessionData = JSON.parse(raw);
      const session: PersonSession = person === 'A' ? data.personA : data.personB;
      if (!session?.cards?.length) return;

      const cards = session.cards
        .map(id => CARD_DATA.find(c => c.id === id))
        .filter(Boolean) as typeof CARD_DATA;

      setSelectedCards(cards.map(c => ({
        id: c.id,
        colorId: (c as any).color,
        colorKor: c.colorKor,
        colorHex: c.colorHex,
        shapeKor: c.shapeKor,
        shapeSymbol: c.shapeSymbol,
        psychologyFlow: c.psychologyFlow,
        personalityFlow: c.personalityFlow,
        recoveryDirection: c.recoveryDirection,
      })));

      const colorIds = session.colors ?? [];
      const colors = colorIds.map((id: string) => COLOR_DATA.find((c: any) => c.id === id)).filter(Boolean);
      const prevColorsMapped = colors.map((c: any) => ({ korName: c.korName, hex: c.hex }));
      setPrevColors(prevColorsMapped);

      // 통합 흐름 분석 생성
      const flow = buildCardFlowAnalysis(cards as any, prevColorsMapped, session.info?.faith ?? '무교');
      setCardFlow(flow);

      setIsLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    });
  }, [person]);

  const handleNext = () => {
    if (person === 'A') {
      router.push({ pathname: '/(tabs)/couple-select', params: { person: 'B' } } as any);
    } else {
      router.push('/(tabs)/couple-result' as any);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>🌿 카드 에너지를 읽는 중...</Text>
        </View>
      </ScreenContainer>
    );
  }

  const readings = [
    selectedCards[0]?.psychologyFlow,
    selectedCards[1]?.personalityFlow,
    selectedCards[2]?.recoveryDirection,
  ];

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            <View style={[styles.personBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.personBadgeText, { color: accentColor }]}>{personLabel}</Text>
            </View>
          </View>

          {/* 단계 배지 */}
          <View style={styles.stepBadgeRow}>
            <View style={[styles.stepBadge, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.stepBadgeText, { color: accentColor }]}>2단계 · 심리카드 심화 코칭</Text>
            </View>
          </View>

          {/* 타이틀 */}
          <View style={styles.titleArea}>
            <Text style={styles.title}>심리카드 에너지 흐름</Text>
            <Text style={styles.subtitle}>무의식 · 현재 · 미래 카드가 연결하는 내면의 이야기입니다</Text>
          </View>

          {/* 이전 단계 컬러 요약 */}
          {prevColors.length > 0 && (
            <View style={[styles.prevColorBanner, { backgroundColor: accentBg, borderColor: accentBorder }]}>
              <Text style={[styles.prevColorTitle, { color: accentColor }]}>🌿 1단계 컬러 흐름</Text>
              <View style={styles.prevColorRow}>
                {prevColors.map((c, i) => (
                  <View key={i} style={styles.prevColorItem}>
                    <View style={[styles.prevColorDot, { backgroundColor: c.hex }]} />
                    <Text style={[styles.prevColorName, { color: accentColor }]}>{c.korName}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 선택된 카드 3장 + 위치별 해석 */}
          {selectedCards.map((card, i) => (
            <View key={card.id} style={[styles.cardSection, { borderColor: POSITION_COLORS[i] + '44' }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.cardVisual, { backgroundColor: card.colorHex }]}>
                  <Text style={[styles.cardShape, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.92)',
                  }]}>{card.shapeSymbol}</Text>
                  <Text style={[styles.cardColorName, {
                    color: card.colorKor === '화이트' ? '#D4AF37' : 'rgba(255,255,255,0.95)',
                  }]}>{card.colorKor}</Text>
                </View>
                <View style={styles.cardHeaderInfo}>
                  <Text style={[styles.positionLabel, { color: POSITION_COLORS[i] }]}>
                    {i + 1}번 · {POSITION_LABELS[i]}
                  </Text>
                  <Text style={styles.cardName}>{card.colorKor} · {card.shapeKor}</Text>
                  <Text style={styles.positionDesc}>{POSITION_DESCS[i]}</Text>
                </View>
              </View>
              <View style={[styles.readingBox, { backgroundColor: POSITION_COLORS[i] + '0D' }]}>
                <Text style={styles.readingText}>{readings[i]}</Text>
              </View>
            </View>
          ))}

          {/* 통합 흐름 분석 */}
          {cardFlow && (
            <>
              <View style={[styles.flowCard, { borderColor: accentColor + '44', backgroundColor: accentBg }]}>
                <Text style={[styles.flowCardLabel, { color: accentColor }]}>🌊 카드 흐름 통합 분석</Text>
                <Text style={[styles.flowCardTitle, { color: '#3D3530' }]}>무의식 → 현재 → 미래 흐름</Text>
                <Text style={styles.flowCardText}>{cardFlow.flow}</Text>
              </View>

              {/* 코칭 메시지 */}
              <View style={[styles.coachingCard, { borderColor: accentColor + '55', backgroundColor: accentColor + '0F' }]}>
                <Text style={[styles.coachingLabel, { color: accentColor }]}>🌿 오늘의 코칭 메시지</Text>
                <Text style={styles.coachingText}>{cardFlow.coaching}</Text>
              </View>

              {/* 보완 루틴 */}
              <View style={[styles.routineCard, { borderColor: '#C4956A44' }]}>
                <Text style={[styles.routineLabel, { color: '#C4956A' }]}>✨ 회복을 위한 보완 루틴</Text>
                <Text style={styles.routineText}>{cardFlow.routine}</Text>
              </View>
            </>
          )}

          {/* 다음 단계 안내 */}
          <View style={[styles.nextHint, { backgroundColor: accentBg, borderColor: accentBorder }]}>
            {person === 'A' ? (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 다음 단계</Text>
                <Text style={styles.nextHintText}>
                  첫 번째 사람의 컬러와 카드 흐름을 확인했습니다.{"\n"}
                  이제 두 번째 사람이 같은 방식으로 진행합니다.
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.nextHintTitle, { color: accentColor }]}>🌿 마지막 단계</Text>
                <Text style={styles.nextHintText}>
                  두 사람의 컬러와 카드 흐름을 모두 확인했습니다.{"\n"}
                  이제 두 사람의 관계 에너지를 통합 해석합니다.
                </Text>
              </>
            )}
          </View>

          {/* 다음 버튼 */}
          <TouchableOpacity
            style={[styles.nextBtn, { backgroundColor: accentColor }]}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {person === 'A' ? '🌿 두 번째 사람 시작하기 →' : '🌿 커플 통합 결과 보기 →'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 16, color: '#5F4B3B' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F2EFE7', alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 18, fontWeight: '600', color: '#5F4B3B' },
  personBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  personBadgeText: { fontSize: 13, fontWeight: '700' },
  stepBadgeRow: { alignItems: 'center', marginBottom: 8 },
  stepBadge: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4 },
  stepBadgeText: { fontSize: 12, fontWeight: '600' },
  titleArea: { alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#3D3530', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#5F4B3B', textAlign: 'center', lineHeight: 22 },
  prevColorBanner: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 16, gap: 8 },
  prevColorTitle: { fontSize: 12, fontWeight: '700' },
  prevColorRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  prevColorItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  prevColorDot: { width: 18, height: 18, borderRadius: 9 },
  prevColorName: { fontSize: 12, fontWeight: '600' },
  cardSection: {
    borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 14, gap: 12,
    backgroundColor: '#FAFAF8',
  },
  cardHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  cardVisual: {
    width: 64, height: 88, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 5, elevation: 4,
  },
  cardShape: { fontSize: 22 },
  cardColorName: { fontSize: 9, fontWeight: '700' },
  cardHeaderInfo: { flex: 1, gap: 4 },
  positionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  cardName: { fontSize: 15, fontWeight: '700', color: '#3D3530' },
  positionDesc: { fontSize: 12, color: '#5F4B3B', lineHeight: 18 },
  readingBox: { borderRadius: 10, padding: 12 },
  readingText: { fontSize: 14, color: '#3D3530', lineHeight: 22 },
  flowCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12, gap: 8,
  },
  flowCardLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  flowCardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  flowCardText: { fontSize: 14, color: '#3D3530', lineHeight: 23 },
  coachingCard: {
    borderRadius: 14, borderWidth: 1.5, padding: 18, marginBottom: 12, gap: 8,
  },
  coachingLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.3 },
  coachingText: { fontSize: 15, color: '#3D3530', lineHeight: 24, fontWeight: '500' },
  routineCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 20,
    backgroundColor: '#FDF8F2', gap: 8,
  },
  routineLabel: { fontSize: 12, fontWeight: '700' },
  routineText: { fontSize: 14, color: '#5F4B3B', lineHeight: 22 },
  nextHint: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16, gap: 6 },
  nextHintTitle: { fontSize: 12, fontWeight: '700' },
  nextHintText: { fontSize: 13, color: '#5F4B3B', lineHeight: 21 },
  nextBtn: { borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 8 },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
