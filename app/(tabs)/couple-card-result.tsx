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

  // 무의식 카드 기반 도입 — 겉모습과 내면의 차이, 반복 패턴, 억눌린 감정 묘사
  const unconsciousIntros: Record<string, string> = {
    red: '겉으로는 단단하고 추진력 있어 보이지만, 무의식 안에는 인정받고 싶은 마음과 상처받고 싶지 않은 긴장이 함께 자리하고 있습니다.',
    orange: '활발하고 따뜻해 보이지만, 무의식 안에는 관계에서 혼자 남겨질지 모른다는 두려움이 조용히 자리하고 있습니다.',
    coral: '주변을 잘 챙기는 것처럼 보이지만, 무의식 안에는 정작 자신은 충분히 돌봄받지 못했다는 결핍감이 있습니다.',
    magenta: '강하고 독립적으로 보이지만, 무의식 안에는 깊이 연결되고 싶은 갈망과 감정이 억눌려 있는 긴장이 공존합니다.',
    pink: '온화하고 배려 깊어 보이지만, 무의식 안에는 충분히 사랑받고 있는지 확인받고 싶은 마음이 반복됩니다.',
    peach: '부드럽고 따뜻해 보이지만, 무의식 안에는 거절당할까봐 먼저 물러서는 패턴이 반복되고 있습니다.',
    beige: '안정적이고 차분해 보이지만, 무의식 안에는 변화에 대한 불안과 익숙한 것을 잃고 싶지 않은 긴장이 있습니다.',
    cream: '조용하고 평온해 보이지만, 무의식 안에는 복잡한 감정들을 혼자 정리하느라 지쳐 있는 상태가 있습니다.',
    gold: '자신감 있어 보이지만, 무의식 안에는 자신의 가치를 스스로 충분히 인정하지 못하는 패턴이 반복됩니다.',
    brown: '믿음직하고 안정적으로 보이지만, 무의식 안에는 변화를 두려워하며 현재 자리에서 벗어나지 못하는 패턴이 있습니다.',
    terracotta: '열정적이고 현실적으로 보이지만, 무의식 안에는 열정과 안정 사이에서 방향을 잡지 못하는 내면의 갈등이 있습니다.',
    blue: '신뢰할 수 있고 책임감 있어 보이지만, 무의식 안에는 감정을 표현하지 못해 쌓인 답답함이 자리하고 있습니다.',
    skyblue: '자유롭고 밝아 보이지만, 무의식 안에는 현실의 무게와 자유 사이에서 균형을 잡지 못하는 긴장이 있습니다.',
    teal: '이성적이고 균형 잡혀 보이지만, 무의식 안에는 감정을 충분히 표현하지 못해 내면에 쌓인 것들이 있습니다.',
    mint: '가볍고 청명해 보이지만, 무의식 안에는 충분히 쉬지 못하고 계속 움직여온 피로가 쌓여 있습니다.',
    indigo: '깊고 지혜로워 보이지만, 무의식 안에는 오랜 시간 혼자 생각하며 감정을 안으로만 담아온 고독이 있습니다.',
    violet: '섬세하고 영적으로 보이지만, 무의식 안에는 현실과 내면 사이에서 방향을 잃은 듯한 혼란이 조용히 자리합니다.',
    black: '강하고 독립적으로 보이지만, 무의식 안에는 상처받지 않으려고 경계를 높게 쌓아온 긴장이 있습니다.',
    silver: '차분하고 명료해 보이지만, 무의식 안에는 감정을 정리하지 못한 채 조용히 쌓아온 것들이 있습니다.',
    green: '균형 잡히고 안정적으로 보이지만, 무의식 안에는 자신을 위한 회복보다 주변을 먼저 챙겨온 피로가 있습니다.',
    olive: '묵직하고 성숙해 보이지만, 무의식 안에는 오랫동안 자리를 지키며 자신의 감정을 뒤로 미뤄온 패턴이 있습니다.',
    sage: '치유적이고 따뜻해 보이지만, 무의식 안에는 다른 사람을 돌보느라 정작 자신의 감정은 조용히 쌓아온 상태입니다.',
    lavender: '섬세하고 감성적으로 보이지만, 무의식 안에는 자신의 감정을 충분히 표현하지 못해 내면에 쌓인 것들이 있습니다.',
    white: '깔끔하고 정돈되어 보이지만, 무의식 안에는 모든 것을 비우고 새롭게 시작하고 싶은 간절함이 자리하고 있습니다.',
    yellow: '밝고 긍정적으로 보이지만, 무의식 안에는 정리되지 않은 감정들을 밝음으로 덮어온 패턴이 반복됩니다.',
  };

  // 현재 카드 기반 연결 — 현재 관계에서 드러나는 구체적 행동 패턴
  const currentBridges: Record<string, string> = {
    red: '지금은 그 긴장이 관계 안에서 쉽게 불꽃이 튀거나, 반대로 지나치게 억누르는 방식으로 나타나고 있습니다.',
    orange: '지금은 그 두려움이 관계에서 더 많이 주거나, 반응이 없을 때 쉽게 불안해지는 방식으로 드러납니다.',
    coral: '지금은 그 결핍이 타인에게 과하게 맞춰주거나, 정작 자신의 필요는 말하지 못하는 방식으로 나타납니다.',
    magenta: '지금은 그 억눌림이 감정이 한꺼번에 터지거나, 반대로 완전히 닫아버리는 방식으로 드러납니다.',
    pink: '지금은 그 마음이 상대의 반응에 지나치게 민감해지거나, 확인을 반복하는 방식으로 나타납니다.',
    peach: '지금은 그 패턴이 갈등 앞에서 먼저 양보하거나, 자신의 감정을 잘 꺼내지 못하는 방식으로 드러납니다.',
    beige: '지금은 그 불안이 변화를 피하거나, 익숙한 방식만 고집하는 방식으로 관계에 영향을 주고 있습니다.',
    cream: '지금은 그 피로가 혼자 있고 싶거나, 관계에서 한 발 물러서는 방식으로 나타납니다.',
    gold: '지금은 그 패턴이 자신을 낮추거나, 인정을 기다리며 표현을 미루는 방식으로 드러납니다.',
    brown: '지금은 그 두려움이 새로운 시도를 망설이거나, 현재 상태를 유지하려는 방식으로 나타납니다.',
    terracotta: '지금은 그 갈등이 에너지를 쏟아붓다가 갑자기 지치거나, 방향을 잃는 방식으로 드러납니다.',
    blue: '지금은 그 답답함이 말하지 않고 참거나, 이미 늦었다고 느껴 표현을 포기하는 방식으로 나타납니다.',
    skyblue: '지금은 그 긴장이 현실에서 도망치고 싶거나, 반대로 너무 현실에 묶여 답답함을 느끼는 방식으로 드러납니다.',
    teal: '지금은 그 쌓임이 이성으로는 괜찮다고 하면서도 감정적으로는 지쳐 있는 방식으로 나타납니다.',
    mint: '지금은 그 피로가 쉬고 싶으면서도 쉬지 못하거나, 가볍게 있으려 해도 마음이 무거운 방식으로 드러납니다.',
    indigo: '지금은 그 고독이 혼자 오래 생각하거나, 감정을 말로 꺼내지 않고 안으로 삭히는 방식으로 나타납니다.',
    violet: '지금은 그 혼란이 현실에 집중하기 어렵거나, 감정과 이성 사이에서 방향을 잡지 못하는 방식으로 드러납니다.',
    black: '지금은 그 긴장이 쉽게 마음을 열지 않거나, 가까워질수록 오히려 거리를 두는 방식으로 나타납니다.',
    silver: '지금은 그 쌓임이 감정보다 논리로 상황을 정리하려 하거나, 감정 표현이 어색해지는 방식으로 드러납니다.',
    green: '지금은 그 피로가 균형을 유지하려 노력하면서도 내면에서는 지쳐가는 방식으로 나타납니다.',
    olive: '지금은 그 패턴이 자신의 감정보다 역할과 책임을 먼저 챙기는 방식으로 드러납니다.',
    sage: '지금은 그 상태가 다른 사람의 감정에는 민감하면서도 자신의 감정은 뒤로 미루는 방식으로 나타납니다.',
    lavender: '지금은 그 쌓임이 감정을 혼자 정리하려 하거나, 표현하고 싶어도 말이 잘 나오지 않는 방식으로 드러납니다.',
    white: '지금은 그 간절함이 모든 것을 내려놓고 싶거나, 관계에서도 복잡함을 피하고 싶은 방식으로 나타납니다.',
    yellow: '지금은 그 패턴이 밝게 지내려 노력하면서도 내면의 감정은 충분히 다루지 못하는 방식으로 드러납니다.',
  };

  // 회복 카드 기반 마무리 — 구체적 변화 방향과 희망
  const recoveryClosings: Record<string, string> = {
    red: '지금 필요한 것은 잠시 멈추고 자신에게 "충분히 잘하고 있다"고 말해주는 시간입니다.',
    orange: '지금 필요한 것은 받는 연습입니다. 주기만 하지 않고, 자신도 채워지는 관계를 허용해 보세요.',
    coral: '지금 필요한 것은 자신의 필요를 말하는 연습입니다. 작은 것부터 솔직하게 표현해 보세요.',
    magenta: '지금 필요한 것은 감정을 안전하게 꺼낼 수 있는 공간입니다. 혼자 담아두지 않아도 됩니다.',
    pink: '지금 필요한 것은 상대의 반응과 상관없이 자신을 충분히 사랑하는 연습입니다.',
    peach: '지금 필요한 것은 양보 대신 자신의 감정을 먼저 확인하는 습관입니다.',
    beige: '지금 필요한 것은 작은 변화를 두려워하지 않는 연습입니다. 익숙함 밖에도 안전한 곳이 있습니다.',
    cream: '지금 필요한 것은 혼자만의 고요한 시간입니다. 아무것도 하지 않아도 되는 시간이 회복을 이끕니다.',
    gold: '지금 필요한 것은 외부의 인정을 기다리지 않고 스스로 자신의 가치를 인정하는 연습입니다.',
    brown: '지금 필요한 것은 작은 변화를 시도해 보는 용기입니다. 뿌리는 흔들리지 않습니다.',
    terracotta: '지금 필요한 것은 방향을 정하고 한 가지에 집중하는 시간입니다. 모든 것을 동시에 잡으려 하지 않아도 됩니다.',
    blue: '지금 필요한 것은 신뢰하는 한 사람에게 솔직하게 감정을 꺼내는 것입니다. 말하는 것만으로도 달라집니다.',
    skyblue: '지금 필요한 것은 현실에 발을 딛고 꿈을 향해 한 걸음씩 나아가는 균형입니다.',
    teal: '지금 필요한 것은 이성이 아닌 감정으로 자신을 들여다보는 시간입니다. 감정도 충분히 다뤄질 자격이 있습니다.',
    mint: '지금 필요한 것은 아무것도 하지 않는 진짜 휴식입니다. 몸이 쉬어야 마음도 가벼워집니다.',
    indigo: '지금 필요한 것은 혼자 담아두는 대신 한 사람에게라도 털어놓는 용기입니다.',
    violet: '지금 필요한 것은 현실의 작은 것에 집중하는 연습입니다. 깊이 들어가기 전에 잠시 밖으로 나와 보세요.',
    black: '지금 필요한 것은 경계를 낮추지 않아도 되지만, 신뢰할 수 있는 한 사람에게는 마음을 조금 여는 연습입니다.',
    silver: '지금 필요한 것은 논리가 아닌 감정으로 자신을 느끼는 시간입니다. 정리하기 전에 먼저 느껴보세요.',
    green: '지금 필요한 것은 자신을 위한 회복 시간입니다. 균형을 유지하려면 먼저 자신이 채워져야 합니다.',
    olive: '지금 필요한 것은 역할 밖의 자신을 만나는 시간입니다. 아무 역할도 하지 않아도 되는 순간이 필요합니다.',
    sage: '지금 필요한 것은 자신에게도 치유의 마음을 돌려주는 것입니다. 당신도 돌봄받을 자격이 있습니다.',
    lavender: '지금 필요한 것은 감정을 말로 꺼내는 연습입니다. 완벽하게 정리되지 않아도 표현해도 됩니다.',
    white: '지금 필요한 것은 복잡한 것들을 내려놓는 용기입니다. 비워야 새것이 들어올 수 있습니다.',
    yellow: '지금 필요한 것은 밝음 뒤에 있는 감정도 충분히 다뤄주는 시간입니다. 슬프거나 지쳐도 괜찮습니다.',
  };

  const intro = unconsciousIntros[c1.color ?? c1.id] ?? '겉으로는 괜찮아 보이지만, 무의식 안에는 오랫동안 혼자 담아온 감정들이 자리하고 있습니다.';
  const bridge = currentBridges[c2.color ?? c2.id] ?? '지금은 그 감정이 관계 안에서 조용히 드러나고 있는 시기입니다.';
  const closing = recoveryClosings[c3.color ?? c3.id] ?? '지금 필요한 것은 자신을 위한 작은 시간입니다.';

  const flow = `${intro}\n\n${bridge}\n\n${closing}`;

  // 코칭 메시지: 1번 카드 현재 상태 + 3번 카드 회복 방향 연결
  const faithNote =
    faith === '기독교'
      ? ' 기도와 말씀 안에서 그 흐름을 찾아가실 수 있습니다.'
      : faith === '무교'
      ? ' 조용한 산책이나 혼자만의 시간이 그 흐름을 도와줄 것입니다.'
      : '';

  const coachingIntros: Record<string, string> = {
    red: '지금 많은 힘을 쏟으며 달려오고 있습니다. 멈추면 뒤처질 것 같은 느낌이 있을 수 있지만, 지금 가장 필요한 것은 잠깐의 쉼입니다.',
    orange: '관계 속에서 많은 것을 주고 있는 시기입니다. 주는 것에 익숙해져 정작 자신이 받는 것은 어색하게 느껴질 수 있습니다.',
    coral: '주변을 돌보느라 자신을 뒤로 미뤄온 것 같습니다. "나는 괜찮아"라고 말하는 횟수가 늘어났다면, 지금이 자신을 돌볼 때입니다.',
    magenta: '강렬한 감정이 마음속에 쌓여 있는 시기입니다. 표현하고 싶지만 어떻게 꺼내야 할지 몰라 안으로 담아온 것들이 있습니다.',
    pink: '타인을 위해 많은 감정을 쏟아온 시간이었습니다. 상대의 기분이 좋지 않으면 자신이 무언가 잘못한 것 같은 느낌이 드는 패턴이 있을 수 있습니다.',
    peach: '따뜻하게 주변을 챙겨왔지만 정작 자신은 지쳐 있습니다. 갈등이 생기면 먼저 양보하는 것이 습관이 되어 있을 수 있습니다.',
    beige: '조용히 안정을 유지하려 애써온 시기입니다. 변화가 두렵거나, 지금 있는 자리를 잃을까봐 마음이 경직되어 있을 수 있습니다.',
    cream: '복잡한 것들을 정리하고 고요히 머물고 싶은 마음이 있습니다. 자극이 많아질수록 혼자 있고 싶어지는 패턴이 반복될 수 있습니다.',
    gold: '자신의 가치를 충분히 인정받지 못한 느낌이 있을 수 있습니다. 열심히 했는데도 "이 정도면 됐나?"라는 의심이 반복된다면, 지금 자신을 인정해주는 연습이 필요합니다.',
    brown: '안정을 원하면서도 변화 앞에서 마음이 경직되는 시기입니다. 새로운 것을 시도하고 싶지만 "괜찮을까?"라는 걱정이 앞서는 패턴이 있을 수 있습니다.',
    terracotta: '안정과 열정 사이에서 내면의 갈등이 있는 시기입니다. 뜨겁게 달려가다가 갑자기 지치거나 방향을 잃는 패턴이 반복될 수 있습니다.',
    blue: '책임감 있게 살아왔지만 감정을 표현하지 못해 답답함이 쌓여 있습니다. 말하고 싶었지만 "이걸 말해도 될까?"라고 망설이다 넘어간 순간들이 있을 것입니다.',
    skyblue: '자유롭고 싶은 마음이 강하지만 현실의 무게가 느껴지는 시기입니다. 어딘가로 훌쩍 떠나고 싶은 마음이 자주 든다면, 지금 내면이 숨 쉴 공간을 원하고 있는 것입니다.',
    teal: '이성적으로는 잘 정리되어 있지만 감정과의 연결이 조금 부족한 시기입니다. "괜찮아"라고 말하면서도 어딘가 무거운 느낌이 남아 있다면, 감정을 더 들여다볼 필요가 있습니다.',
    mint: '새롭게 시작하고 싶지만 먼저 깊은 휴식이 필요한 상태입니다. 쉬어야 한다는 것을 알면서도 쉬지 못하는 패턴이 반복되고 있을 수 있습니다.',
    indigo: '혼자 오래 생각하며 많은 것을 마음속에 담아온 시기입니다. 말하면 이해받지 못할 것 같아 혼자 정리하려는 패턴이 반복될 수 있습니다.',
    violet: '내면을 깊이 들여다보고 싶은 마음이 강한 시기입니다. 현실보다 내면의 세계가 더 선명하게 느껴져 현실에 집중하기 어려운 때가 있을 수 있습니다.',
    black: '많은 것을 혼자 감당하며 경계를 지켜온 시기입니다. 가까워질수록 오히려 거리를 두고 싶어지는 패턴이 있다면, 그것은 자신을 보호하려는 무의식의 반응입니다.',
    silver: '감정을 조용히 정리하며 명료함을 찾고 있는 시기입니다. 감정보다 논리로 상황을 처리하다 보니 정작 자신이 어떤 감정인지 모를 때가 있을 수 있습니다.',
    green: '균형을 유지하려 노력해왔지만 내면의 회복이 필요한 시기입니다. 주변을 위해 균형을 잡으려 하다 보니 정작 자신은 소진되어 있을 수 있습니다.',
    olive: '묵묵히 자리를 지켜왔지만 자신을 위한 시간이 부족했습니다. 역할과 책임을 먼저 챙기다 보니 "나는 어떤 사람인가?"라는 질문을 잊어버린 것 같은 느낌이 있을 수 있습니다.',
    sage: '주변을 치유하느라 자신의 감정은 조용히 쌓아온 시기입니다. 다른 사람의 감정에는 민감하게 반응하면서도 자신의 감정은 뒤로 미루는 패턴이 있을 수 있습니다.',
    lavender: '감정을 섬세하게 느끼며 천천히 정리하고 싶은 시기입니다. 표현하고 싶은 것들이 있지만 말로 꺼내기 전에 이미 지쳐버리는 패턴이 반복될 수 있습니다.',
    white: '복잡한 것들을 내려놓고 단순하게 정리하고 싶은 마음이 있습니다. 모든 것을 새롭게 시작하고 싶은 마음이 강하다면, 지금 내면이 깊은 변화를 원하고 있는 것입니다.',
    yellow: '밝게 지내려 했지만 내면에는 정리되지 않은 감정이 있습니다. 밝음 뒤에 있는 감정들도 충분히 다뤄질 자격이 있습니다.',
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
    // 레드 계열: 에너지 발산, 몸 움직이기, 표현
    red: '몸을 움직여 에너지를 발산해보세요. 빠르게 걷거나 가벼운 운동으로 쌓인 긴장을 몸 밖으로 내보내는 것이 가장 효과적입니다. 말하고 싶었던 것을 큰 소리로 표현해보는 것도 좋습니다.',
    // 오렌지 계열: 따뜻한 관계, 생기 회복
    orange: '가까운 사람과 맛있는 것을 먹거나 웃음이 있는 시간을 만들어보세요. 혼자 회복하려 하지 말고, 따뜻한 관계 속에서 자연스럽게 생기를 되찾는 것이 오렌지 에너지의 회복 방식입니다.',
    // 코랄 계열: 자기 돌봄, 따뜻한 자기 표현
    coral: '하루 한 번, 자신에게 "오늘 수고했어"라고 말해주세요. 따뜻한 차 한 잔과 함께 자신을 위한 시간을 만들고, 오늘 기분이 어땠는지 짧게 적어보는 것도 좋습니다.',
    // 마젠타 계열: 감정 표현, 글쓰기
    magenta: '억눌린 감정을 글로 꺼내보세요. 감정 일기를 쓰거나, 하고 싶었던 말을 편지 형식으로 써보는 것이 도움이 됩니다. 표현하는 것 자체가 회복의 시작입니다.',
    // 핑크 계열: 자기 사랑, 작은 기쁨
    pink: '자신에게 작은 선물을 해보세요. 좋아하는 카페에 가거나, 오래 미뤄온 취미 활동을 해보세요. 타인을 위한 배려만큼 자신을 위한 시간도 소중합니다.',
    // 피치 계열: 자기 인정, 부드러운 자기 표현
    peach: '거울을 보며 자신에게 따뜻한 말을 건네보세요. "나는 충분해"라는 말을 하루 세 번 말해보는 연습이 자기 인정의 시작입니다.',
    // 베이지 계열: 포근한 안정, 익숙한 것들과의 연결
    beige: '포근하고 익숙한 공간에서 좋아하는 음악을 들으며 쉬어보세요. 억지로 변화를 만들지 않아도 됩니다. 지금 있는 자리에서 안정을 느끼는 것이 먼저입니다.',
    // 크림 계열: 비움, 단순화, 고요
    cream: '디지털 기기를 잠시 내려놓고 조용한 시간을 가져보세요. 복잡한 것들을 하나씩 내려놓고, 지금 이 순간에만 집중하는 연습이 마음을 정리해 줍니다.',
    // 골드 계열: 자기 가치 인정, 작은 성취
    gold: '오늘 자신이 잘한 것 세 가지를 적어보세요. 작은 성취를 인식하고 기록하는 것이 자기 가치 회복의 시작입니다. 자신의 강점을 다시 발견하는 시간을 가져보세요.',
    // 브라운 계열: 뿌리 내리기, 자연, 안정
    brown: '자연 속을 천천히 걸어보세요. 땅을 밟으며 뿌리를 내리는 느낌이 안정감을 회복시켜 줍니다. 오래된 친구를 만나거나 익숙한 공간에서 시간을 보내는 것도 좋습니다.',
    // 테라코타 계열: 방향 정하기, 집중, 한 가지에 몰입
    terracotta: '지금 가장 중요한 한 가지를 정하고 거기에만 집중해보세요. 모든 것을 동시에 잡으려 하지 않아도 됩니다. 방향이 정해지면 에너지가 자연스럽게 모입니다.',
    // 블루 계열: 글쓰기, 깊은 대화, 솔직한 표현
    blue: '신뢰하는 한 사람에게 솔직하게 감정을 꺼내보세요. 말하기 어렵다면 편지나 메시지로 시작해도 좋습니다. 표현하는 것만으로도 마음속 답답함이 풀립니다.',
    // 스카이블루 계열: 자유, 현실과 꿈의 균형
    skyblue: '하늘이 보이는 곳에서 잠시 멍하니 앉아보세요. 아무것도 계획하지 않아도 되는 시간이 자유로운 에너지를 회복시켜 줍니다. 가고 싶은 곳을 상상하며 작은 계획을 세워보는 것도 좋습니다.',
    // 틸 계열: 감정 정화, 균형, 숨 고르기
    teal: '따뜻한 목욕이나 샤워로 하루를 마무리해보세요. 물이 감정을 정화해주는 느낌을 의식적으로 받아들이며 숨을 고르는 시간을 가져보세요. 감정과 이성 사이의 균형을 찾는 것이 틸의 회복 방식입니다.',
    // 민트 계열: 진짜 휴식, 몸과 마음 이완
    mint: '아무것도 하지 않는 진짜 휴식을 취해보세요. 충분한 수면, 가벼운 스트레칭, 시원한 공기 마시기가 도움이 됩니다. 몸이 먼저 쉬어야 마음도 가벼워집니다.',
    // 인디고 계열: 깊은 성찰, 일기 쓰기, 혼자만의 시간
    indigo: '조용한 공간에서 혼자만의 성찰 시간을 가져보세요. 오늘 마음속에 있었던 것들을 일기로 적거나, 오래된 질문 하나를 천천히 생각해보는 것이 인디고의 회복 방식입니다.',
    // 바이올렛 계열: 묵상, 성찰, 감정 기록, 영성
    violet: '조용한 음악을 틀고 촛불을 켜거나, 좋아하는 책 한 구절을 읽으며 묵상해보세요. 감정 기록이나 짧은 성찰 글쓰기가 내면의 혼란을 정리하는 데 도움이 됩니다.',
    // 블랙 계열: 혼자만의 공간, 경계 지키기
    black: '혼자만의 공간과 시간을 충분히 확보해보세요. 아무도 없는 조용한 공간에서 자신을 재충전하는 것이 가장 효과적입니다. 경계를 지키는 것이 자신을 보호하는 방법입니다.',
    // 실버 계열: 정리, 명료함, 글쓰기
    silver: '복잡한 생각들을 종이에 적어 정리해보세요. 머릿속에 있는 것들을 글로 꺼내면 명료함이 생깁니다. 불필요한 것들을 하나씩 정리하는 것도 좋습니다.',
    // 그린 계열: 자연, 산책, 균형 회복
    green: '자연 속에서 천천히 걸어보세요. 나무나 식물을 가까이 두는 것만으로도 균형이 회복됩니다. 자연의 리듬에 맞춰 쉬고 움직이는 것이 그린의 회복 방식입니다.',
    // 올리브 계열: 안정, 뿌리, 오래된 것들
    olive: '오래된 친구를 만나거나 익숙한 공간에서 시간을 보내보세요. 뿌리 있는 것들과 연결되는 것이 안정감을 회복시켜 줍니다. 역할 밖의 자신을 만나는 시간도 필요합니다.',
    // 세이지 계열: 자기 치유, 자기 돌봄
    sage: '다른 사람을 돌보듯 자신을 돌봐보세요. 허브차를 마시거나 조용한 산책을 하며 자신에게도 치유의 마음을 돌려주세요. 당신도 돌봄받을 자격이 있습니다.',
    // 라벤더 계열: 감성적 회복, 조용한 시간
    lavender: '라벤더 향이 나는 차를 마시거나 조용한 음악을 들으며 쉬어보세요. 감정을 말로 꺼내기 어렵다면 그림이나 글로 표현해보는 것도 좋습니다.',
    // 화이트 계열: 비우기, 공간 정리, 새 시작
    white: '불필요한 것들을 정리하고 공간을 비워보세요. 서랍 하나, 책상 위 하나씩 정리하는 것이 마음을 비우는 데 도움이 됩니다. 단순해질수록 새로운 시작의 에너지가 생겨납니다.',
    // 옐로우 계열: 현실 루틴, 작은 성취, 가벼운 즐거움
    yellow: '좋아하는 것을 하며 가볍게 즐겨보세요. 작은 목표를 하나 정하고 달성해보는 것도 좋습니다. 밝음 뒤에 있는 감정도 충분히 다뤄주는 시간이 함께 필요합니다.',
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
