"use no memo";
import React, { useState, useEffect } from "react";
import { Linking } from "react-native";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  TextInput,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { type CardData, CARD_DATA } from "@/constants/cardData";
import { type ColorData } from "@/constants/colorData";
import { type UserProfile } from "./profile";
import { trpc } from "@/lib/trpc";
import { buildLifeEnergyResult, type LifeEnergyResult, type ContextualRoutine } from "@/constants/lifeArchetype";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getTrialStatus, getTrialRemainingLabel, type TrialStatus } from "@/lib/trialUtils";
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

// 밝은 컬러(크림, 화이트, 아이보리 등) 자동 테두리 처리
function getLightColorBorder(hex: string): { borderWidth: number; borderColor: string } | {} {
  // RGB 밝기 계산 (0~255)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  // 밝기 200 이상이면 테두리 추가
  if (brightness >= 200) {
    return { borderWidth: 1.5, borderColor: '#C8BFB0' };
  }
  return {};
}

// 보완 컬러 칩용 한글명 → hex 매핑 (colorData.ts 기준)
const COLOR_KOR_HEX: Record<string, { hex: string; isLight: boolean }> = {
  '레드':       { hex: '#CC1A1A', isLight: false },
  '오렌지':     { hex: '#F0874A', isLight: false },
  '옐로우':     { hex: '#F0C040', isLight: true  },
  '그린':       { hex: '#6BAF7A', isLight: false },
  '블루':       { hex: '#5A7EC4', isLight: false },
  '인디고':     { hex: '#4A5A9A', isLight: false },
  '퍼플':       { hex: '#8A5AC4', isLight: false },
  '핑크':       { hex: '#E8849A', isLight: false },
  '마젠타':     { hex: '#C2478A', isLight: false },
  '코랄':       { hex: '#E8735A', isLight: false },
  '골드':       { hex: '#C4A832', isLight: false },
  '브라운':     { hex: '#8B6355', isLight: false },
  '베이지':     { hex: '#D4B896', isLight: true  },
  '화이트':     { hex: '#F0EDE8', isLight: true  },
  '블랙':       { hex: '#3A3A3A', isLight: false },
  '실버':       { hex: '#A8B0B8', isLight: false },
  '올리브':     { hex: '#8A9A5B', isLight: false },
  '민트':       { hex: '#7EC8C0', isLight: false },
  '스카이블루': { hex: '#87CEEB', isLight: true  },
  '라벤더':     { hex: '#B8A8D0', isLight: true  },
  '피치':       { hex: '#FFBE9F', isLight: true  },
  '테라코타':   { hex: '#C4704A', isLight: false },
  '세이지그린': { hex: '#8FA68E', isLight: false },
  '틸':         { hex: '#4A9A9A', isLight: false },
  '크림':       { hex: '#F5F0E8', isLight: true  },
  '아이보리':   { hex: '#F5F0E8', isLight: true  },
  '네이비':     { hex: '#283593', isLight: false },
  '터콰이즈':   { hex: '#4A9A9A', isLight: false },
  '라일락':     { hex: '#B8A8D0', isLight: true  },
};

/** 컬러명으로 hex와 텍스트 대비 색상 반환 */
function getColorChipStyle(korName: string): { chipBg: string; chipBorder: string; textColor: string; tagBg: string } {
  const entry = COLOR_KOR_HEX[korName];
  if (!entry) return { chipBg: '#C4956A', chipBorder: '#C4956A88', textColor: '#5C3D00', tagBg: '#C4956A12' };
  const { hex, isLight } = entry;
  // 태그 배경: hex를 매우 연하게 (10% 불투명도)
  const tagBg = hex + '18';
  const chipBorder = hex + '99';
  const textColor = isLight ? '#4A3A2A' : '#3A2A1A';
  return { chipBg: hex, chipBorder, textColor, tagBg };
}

const POSITION_LABELS = [
  { label: "1번 카드", sub: "무의식 · 내면 에너지", color: "#4A7A4A" },
  { label: "2번 카드", sub: "현재 현실 에너지", color: "#7A5CA8" },
  { label: "3번 카드", sub: "미래 · 회복 · 희망 에너지", color: "#8B6030" },
];

// 직업별 맞춤 코칭 문구
type JobCoaching = {
  routineNote: string;   // 보완 루틴 하단에 추가될 한 문장
  coachingNote: string;  // 종합 코칭 메시지 하단에 추가될 한 문장
  scriptureVerse?: { text: string; ref: string; label: string }; // 조건부 위로 구절
};

// 신앙에 따라 루틴 표현을 자연스럽게 치환
function sanitizeRecovery(text: string, faith: string): string {
  if (faith === '기독교') {
    // 기독교: 묵상·기도·말씀 중심 표현 유지, 명상 → 묵상 시간
    return text
      .replace(/명상 또는 기도/g, '기도 또는 묵상 시간')
      .replace(/명상이나 기도/g, '기도나 묵상 시간')
      .replace(/명상이나 조용한/g, '묵상이나 조용한')
      .replace(/명상 호흡/g, '조용한 기도 호흡')
      .replace(/명상/g, '묵상 시간')
      .replace(/마음 정리 시간/g, '기도 또는 묵상 시간')
      .replace(/조용한 호흡 또는 마음 정리 시간/g, '기도 또는 말씀 묵상 시간');
  }
  if (faith === '타종교') {
    // 타종교: 중립적 내면 안정 표현 (기도·예배 제거, 명상도 중립화)
    return text
      .replace(/기도, 예배, 상담/g, '내면 안정, 감정 일기, 상담')
      .replace(/기도나 묵상/g, '내면 안정 시간이나 조용한 호흡')
      .replace(/기도, 명상/g, '내면 안정 시간, 조용한 호흡')
      .replace(/기도나 명상/g, '내면 안정 시간이나 조용한 호흡')
      .replace(/명상 또는 기도/g, '조용한 호흡 또는 내면 안정 시간')
      .replace(/명상 호흡/g, '조용한 호흡 시간')
      .replace(/명상/g, '내면 안정 시간')
      .replace(/\(기도 등\)/g, '(감정 일기, 조용한 산책 등)')
      .replace(/\(글쓰기, 기도, 정리 등\)/g, '(글쓰기, 감정 정리, 산책 등)')
      .replace(/기도/g, '내면 안정 시간')
      .replace(/예배/g, '조용한 휴식');
  }
  // 무교/기타(선택 안 함 포함): 마음 정리·산책·조용한 시간 중심
  return text
    .replace(/기도, 예배, 상담/g, '마음 정리, 감정 일기, 상담')
    .replace(/기도나 묵상/g, '조용한 호흡이나 마음 정리 시간')
    .replace(/기도, 명상/g, '마음 정리 시간, 조용한 호흡')
    .replace(/기도나 명상/g, '마음 정리 시간이나 조용한 호흡')
    .replace(/명상 또는 기도/g, '조용한 호흡 또는 마음 정리 시간')
    .replace(/명상 호흡/g, '조용한 호흡 시간')
    .replace(/명상/g, '마음 정리 시간')
    .replace(/\(기도 등\)/g, '(감정 일기, 조용한 산책 등)')
    .replace(/\(글쓰기, 기도, 정리 등\)/g, '(글쓰기, 감정 정리, 산책 등)')
    .replace(/기도/g, '마음 정리 시간')
    .replace(/예배/g, '조용한 휴식');
}

// recoveryDirection에서 첫 문장만 추출 (\n 이후 불릿 포인트 제거)
function extractFirstSentence(text: string): string {
  return text.split('\n')[0].trim();
}

// 직업+고민 조합 코칭 노트 (핵심 1문장)
function getJobConcernNote(job: string, concerns: string[]): string {
  const hasConcern = (keywords: string[]) =>
    concerns.some(c => keywords.some(k => c.includes(k)));

  if (job === '학생') {
    if (hasConcern(['진로', '일'])) return '기질에 맞는 방향은 억지로 찾는 것이 아니라, 지금 끌리는 것을 따라가다 보면 자연스럽게 드러납니다.';
    if (hasConcern(['관계'])) return '친구 관계에서 오는 감정 소모가 생각보다 클 수 있습니다. 나를 편하게 해주는 한 사람과의 시간이 회복의 시작입니다.';
    if (hasConcern(['번아웃', '스트레스'])) return '학업 스트레스는 몸보다 마음이 먼저 신호를 보냅니다. 오늘은 10분만 완전히 쉬어도 됩니다.';
    if (hasConcern(['자기이해'])) return '비교는 나를 흐리게 합니다. 지금 내가 느끼는 것이 나의 진짜 흐름입니다.';
    return '잘해야 한다는 압박이 오히려 흐름을 막고 있을 수 있습니다. 오늘 하루, 결과보다 과정에 머물러 보세요.';
  }
  if (job === '자영업') {
    if (hasConcern(['진로', '일'])) return '사업 방향이 흔들릴 때는 처음 시작한 이유로 돌아가보세요. 그 에너지가 다시 흐름을 잡아줍니다.';
    if (hasConcern(['번아웃', '스트레스'])) return '재정 스트레스는 판단력을 흐립니다. 오늘은 숫자보다 에너지 회복에 집중해보세요.';
    if (hasConcern(['관계'])) return '고객과의 에너지 소모가 쌓이면 방향도 흔들립니다. 나의 에너지 원천을 먼저 채워야 합니다.';
    return '책임감이 많을수록 에너지 소진도 빠릅니다. 하루 한 번, 일에서 완전히 분리되는 시간이 지속 가능한 흐름을 만듭니다.';
  }
  if (job === '프리랜서') {
    if (hasConcern(['번아웃', '스트레스'])) return '자기관리가 곧 사업 관리입니다. 에너지 기복을 인식하는 것이 회복의 첫 단계입니다.';
    if (hasConcern(['감정 회복'])) return '감정 기복이 심할 때는 창의성보다 안정을 먼저 회복해야 합니다. 오늘은 쉬는 것이 일입니다.';
    if (hasConcern(['진로', '일'])) return '불안정한 리듬 속에서도 나만의 페이스를 찾는 것이 지속 가능한 창작의 기반입니다.';
    return '일과 쉼의 경계가 없을수록 창의성이 먼저 고갈됩니다. 오늘 업무 종료 시간을 정해보세요.';
  }
  if (job === '사역자') {
    if (hasConcern(['감정 회복'])) return '감정 소진은 사역의 질을 떨어뜨립니다. 회복 없이 섬김은 지속될 수 없습니다.';
    if (hasConcern(['관계'])) return '관계적 부담이 클 때는 먼저 나의 내면을 채우는 시간이 필요합니다.';
    if (hasConcern(['영성', '내면'])) return '영적 돌봄을 받는 사람도 자신의 영적 회복이 필요합니다. 오늘은 받는 사람이 되어보세요.';
    return '섬기는 역할 속에서 나 자신을 돌보는 경계가 반드시 필요합니다. 돌봄 피로는 조용히 쌓입니다.';
  }
  if (job === '서비스직') {
    if (hasConcern(['번아웃', '스트레스'])) return '타인의 감정을 담아내는 역할이라면, 퇴근 후 10분은 자신만을 위한 시간으로 비워두세요.';
    if (hasConcern(['관계'])) return '모든 관계에 같은 에너지를 쏟지 않아도 됩니다. 나를 편하게 해주는 관계에 집중해보세요.';
    return '타인의 필요를 채우다 보면 나의 감정은 뒤로 밀립니다. 오늘 퇴근 후 5분만 나를 위해 써보세요.';
  }
  if (job === '주부') {
    if (hasConcern(['관계'])) return '가족 관계의 에너지 소모는 가장 보이지 않는 피로입니다. 나의 감정도 중요합니다.';
    if (hasConcern(['감정 회복'])) return '하루 종일 타인의 필요를 채우다 보면 나의 감정은 뒤로 밀립니다. 오늘 5분만 나를 위해 써보세요.';
    return '가족을 위한 돌봄 속에서 나를 위한 5분이 가장 중요한 회복 루틴입니다.';
  }
  if (job === '무직') return '지금의 멈춤은 다음 흐름을 준비하는 시간입니다. 조급함보다 회복의 리듬을 먼저 찾아보세요.';
  // 생산직, 기타
  return '';
}

// 3번 카드 컬러 계열 기준 위로 성경구절 선택
// 무교 사용자용 위로 문구 (성경구절 대신)
const COMFORT_QUOTES: Record<string, { text: string; ref: string }> = {
  warm_active: { text: '움직이는 것이 용기입니다. 오늘의 한 걸음이 당신을 앞으로 데려갑니다.', ref: '' },
  warm_social: { text: '눈을 맞추고 마음을 나누는 것이 지금 가장 좋은 회복입니다.', ref: '' },
  yellow:      { text: '생각이 많을수록 오늘 할 수 있는 한 가지에 집중해 보세요.', ref: '' },
  green:       { text: '자연 속에서 마음이 조용히 정리됩니다.', ref: '' },
  blue:        { text: '스스로를 신뢰하는 것이 지금 가장 필요한 힘입니다.', ref: '' },
  purple:      { text: '내면을 천천히 들여다보는 시간이 회복의 시작입니다.', ref: '' },
  lavender:    { text: '조용한 시간 속에서 자신을 다시 만나보세요.', ref: '' },
  cool:        { text: '휴식도 일의 일부입니다. 오늘은 충분히 쉬어도 됩니다.', ref: '' },
  black:       { text: '어두운 시간도 당신의 이야기의 일부입니다.', ref: '' },
  neutral:     { text: '조용히 정리하는 시간이 다음 흐름을 준비합니다.', ref: '' },
};

function getScriptureVerse(
  colorId: string,
  faith: string,
  flowType?: string,
  archetypeKey?: string,
): { text: string; ref: string; label: string } {
  const family = getColorFamily(colorId);

  // 무교 사용자: 성경구절 대신 위로 문구
  if (faith !== '기독교') {
    const quote = COMFORT_QUOTES[family] ?? COMFORT_QUOTES['neutral'];
    return { ...quote, label: '🌿 오늘의 위로' };
  }

  const label = '✝️ 오늘의 말씀';

  // ── 오행 흐름 유형별 구절 풀 (각 유형당 4~6개, 컬러 계열로 세분화) ──
  // 진장(화 과다): 긴장·예민·압박 → 담대함·평안·쉼
  const tensionVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라', ref: '이사야 41:10' },
    warm_social: { text: '아무것도 염려하지 말고 다만 모든 일에 기도와 간구로 너희 구할 것을 감사함으로 하나님께 아뢰라', ref: '빌립보서 4:6' },
    yellow:      { text: '내가 주는 평안은 세상이 주는 것과 같지 아니하니라 너희는 마음에 근심하지도 말고 두려워하지도 말라', ref: '요한복음 14:27' },
    green:       { text: '그가 나를 푸른 풀밭에 누이시며 쉴 만한 물 가로 인도하시는도다', ref: '시편 23:2' },
    blue:        { text: '하나님이 우리에게 주신 것은 두려워하는 마음이 아니요 오직 능력과 사랑과 절제하는 마음이니', ref: '디모데후서 1:7' },
    purple:      { text: '내 영혼아 잠잠히 하나님만 바라라 무릇 나의 소망이 그로부터 나오는도다', ref: '시편 62:5' },
    neutral:     { text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라', ref: '마태복음 11:28' },
  };

  // 침잠(수 과다): 피로·감정 침잠·무기력 → 소망·새 힘·일어남
  const drainVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '오직 여호와를 앙망하는 자는 새 힘을 얻으리니 독수리가 날개치며 올라감 같을 것이요', ref: '이사야 40:31' },
    warm_social: { text: '사랑하는 자여 네 영혼이 잘됨 같이 네가 범사에 잘되고 강건하기를 내가 간구하노라', ref: '요한삼서 1:2' },
    yellow:      { text: '내가 산을 향하여 눈을 들리라 나의 도움이 어디서 올까 나의 도움은 천지를 지으신 여호와에게서로다', ref: '시편 121:1-2' },
    green:       { text: '여호와는 나의 목자시니 내게 부족함이 없으리로다 그가 나를 푸른 풀밭에 누이시며', ref: '시편 23:1-2' },
    blue:        { text: '내가 사망의 음침한 골짜기로 다닐지라도 해를 두려워하지 않을 것은 주께서 나와 함께 하심이라', ref: '시편 23:4' },
    purple:      { text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다', ref: '시편 119:105' },
    neutral:     { text: '여호와여 내가 주께 부르짖으오니 나의 반석이여 내게 귀를 막지 마소서', ref: '시편 28:1' },
  };

  // 정체(토 과다): 무거움·답답함·감정 정체 → 새 시작·변화·움직임
  const stagnantVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '보라 내가 새 일을 행하리니 이제 나타낼 것이라 너희가 그것을 알지 못하겠느냐', ref: '이사야 43:19' },
    warm_social: { text: '그런즉 누구든지 그리스도 안에 있으면 새로운 피조물이라 이전 것은 지나갔으니 보라 새 것이 되었도다', ref: '고린도후서 5:17' },
    yellow:      { text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라 너는 범사에 그를 인정하라 그리하면 네 길을 지도하시리라', ref: '잠언 3:5-6' },
    green:       { text: '내가 너희에게 평안을 끼치노니 곧 나의 평안을 너희에게 주노라', ref: '요한복음 14:27' },
    blue:        { text: '내가 네 갈 길을 가르쳐 보이고 너를 주목하여 훈계하리로다', ref: '시편 32:8' },
    purple:      { text: '지혜가 부족한 자가 있으면 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라', ref: '야고보서 1:5' },
    neutral:     { text: '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라', ref: '예레미야 29:11' },
  };

  // 예민(금 과다): 예민·정리 욕구·경계 민감 → 평안·지혜·내려놓음
  const sensitiveVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '모든 지킬 만한 것 중에 더욱 네 마음을 지키라 생명의 근원이 이에서 남이니라', ref: '잠언 4:23' },
    warm_social: { text: '사랑 안에 두려움이 없고 온전한 사랑이 두려움을 내쫓나니', ref: '요한일서 4:18' },
    yellow:      { text: '평강의 하나님이 친히 너희와 함께 하시리라', ref: '빌립보서 4:9' },
    green:       { text: '주의 인자하심이 하늘에 있고 주의 진실하심이 공중에 사무쳤으며', ref: '시편 36:5' },
    blue:        { text: '하나님은 어지러움의 하나님이 아니시요 오직 화평의 하나님이시니라', ref: '고린도전서 14:33' },
    purple:      { text: '오직 위로부터 난 지혜는 첫째 성결하고 다음에 화평하고 관용하고 양순하며', ref: '야고보서 3:17' },
    neutral:     { text: '범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', ref: '데살로니가전서 5:18' },
  };

  // 성장(목 과다): 성장·추진·의미 탐색 → 인도하심·지혜·방향성
  const growthVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라', ref: '여호수아 1:9' },
    warm_social: { text: '사랑은 오래 참고 사랑은 온유하며 투기하는 자가 되지 아니하며', ref: '고린도전서 13:4' },
    yellow:      { text: '너는 마음을 다하여 여호와를 신뢰하고 네 명철을 의지하지 말라', ref: '잠언 3:5' },
    green:       { text: '내가 너희를 향하여 가지고 있는 생각들을 내가 아나니 재앙이 아니라 평안이요 미래와 희망을 주는 것이니라', ref: '예레미야 29:11' },
    blue:        { text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다', ref: '시편 119:105' },
    purple:      { text: '지혜가 부족한 자가 있으면 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라', ref: '야고보서 1:5' },
    neutral:     { text: '내가 네 갈 길을 가르쳐 보이고 너를 주목하여 훈계하리로다', ref: '시편 32:8' },
  };

  // 균형: 감사·평안·충만 → 돌봄·사랑·안식
  const balancedVerses: Record<string, { text: string; ref: string }> = {
    warm_active: { text: '하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니', ref: '요한복음 3:16' },
    warm_social: { text: '사랑은 오래 참고 사랑은 온유하며 투기하는 자가 되지 아니하며', ref: '고린도전서 13:4' },
    yellow:      { text: '범사에 감사하라 이것이 그리스도 예수 안에서 너희를 향하신 하나님의 뜻이니라', ref: '데살로니가전서 5:18' },
    green:       { text: '여호와는 나의 목자시니 내게 부족함이 없으리로다', ref: '시편 23:1' },
    blue:        { text: '평강의 하나님이 친히 너희와 함께 하시리라', ref: '빌립보서 4:9' },
    purple:      { text: '내 멍에는 쉽고 내 짐은 가벼움이라', ref: '마태복음 11:30' },
    lavender:    { text: '사랑 안에 두려움이 없고 온전한 사랑이 두려움을 내쫓나니', ref: '요한일서 4:18' },
    cool:        { text: '하나님은 어지러움의 하나님이 아니시요 오직 화평의 하나님이시니라', ref: '고린도전서 14:33' },
    black:       { text: '주의 말씀은 내 발에 등이요 내 길에 빛이니이다', ref: '시편 119:105' },
    neutral:     { text: '여호와의 말씀이니라 너희를 향한 나의 생각을 내가 아나니 평안이요 재앙이 아니니라', ref: '예레미야 29:11' },
  };

  // Archetype별 보조 구절 (flowType이 균형일 때 Archetype으로 세분화)
  const archetypeVerses: Record<string, { text: string; ref: string }> = {
    connector: { text: '사람이 친구를 위하여 자기 목숨을 버리면 이보다 더 큰 사랑이 없나니', ref: '요한복음 15:13' },
    healer:    { text: '마음이 상한 자를 고치시며 그들의 상처를 싸매시는도다', ref: '시편 147:3' },
    analyst:   { text: '오직 위로부터 난 지혜는 첫째 성결하고 다음에 화평하고 관용하고 양순하며', ref: '야고보서 3:17' },
    leader:    { text: '강하고 담대하라 두려워하지 말며 놀라지 말라 네가 어디로 가든지 네 하나님 여호와가 너와 함께 하느니라', ref: '여호수아 1:9' },
    artist:    { text: '하나님이 지으신 모든 것을 보시니 보시기에 심히 좋았더라', ref: '창세기 1:31' },
    expert:    { text: '지혜가 부족한 자가 있으면 모든 사람에게 후히 주시고 꾸짖지 아니하시는 하나님께 구하라', ref: '야고보서 1:5' },
  };

  // 흐름 유형 → 구절 풀 선택
  let pool: Record<string, { text: string; ref: string }>;
  if (flowType === '진장') pool = tensionVerses;
  else if (flowType === '침잠') pool = drainVerses;
  else if (flowType === '정체') pool = stagnantVerses;
  else if (flowType === '예민') pool = sensitiveVerses;
  else if (flowType === '성장') pool = growthVerses;
  else pool = balancedVerses; // 균형 또는 미정

  // 컬러 패밀리로 구절 선택, 없으면 Archetype 보조 구절, 없으면 neutral
  let verse = pool[family];
  if (!verse && archetypeKey) verse = archetypeVerses[archetypeKey];
  if (!verse) verse = pool['neutral'] ?? { text: '수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라', ref: '마태복음 11:28' };

  return { ...verse, label };
}

function getJobCoaching(job: string, faith: string, colorId?: string, concerns?: string[], flowType?: string, archetypeKey?: string): JobCoaching {
  // 신앙별 추가 문구
  const faithNote =
    faith === "기독교"
      ? "말씀 묵상이나 기도 시간을 루틴에 더하면 내면 회복이 더 깊어질 수 있습니다."
      : faith === "타종교"
      ? "내면 안정과 고요한 시간을 루틴에 더하면 회복 흐름이 더 깊어질 수 있습니다."
      : "";

  // 직업별 맥락 한 문장 (콜러 루틴 노트 앞에 추가)
  const jobContextMap: Record<string, string> = {
    서비스직: "타인의 감정을 많이 담아내는 역할이라면, 퇴근 후 10분은 자신만을 위한 시간으로 비워두세요.",
    사역자: "섬기는 역할 속에서도 나 자신을 돌보는 경계가 필요합니다.",
    프리랜서: "일과 쉼의 경계가 흐릿할수록 하루의 끝을 의식적으로 마무리하는 작은 루틴이 중요합니다.",
    학생: "잘해야 한다는 긴장이 쌓이면 집중력이 오히려 떨어집니다.",
    주부: "가족을 위한 돌봄 속에서 나를 위한 5분이 가장 중요한 회복 루틴입니다.",
    생산직: "몸의 피로가 마음에도 영향을 줍니다.",
    자영업: "책임감과 긴장이 쌓이기 쉬운 환경에서, 하루 한 번 일에서 완전히 단절하는 시간이 필요합니다.",
    무직: "지금의 멈춤은 다음 흐름을 준비하는 시간입니다.",
    기타: "자신의 리듬에 맞는 회복 루틴을 하나씩 찾아가는 것이 가장 좋습니다.",
  };

  const jobContext = jobContextMap[job] ?? jobContextMap["기타"];

  // 콜러 계열별 행동 루틴 노트 (직업 맥락 후 출력)
  const colorRoutineMap: Record<string, string> = {
    warm_active:
      "스트레칭 5분, 빠른 걸음 10분이 에너지 순환에 도움이 됩니다.",
    warm_social:
      "신뢰하는 사람과 짧은 대화 한 번이 오늘의 회복 루틴이 될 수 있습니다.",
    yellow:
      "오늘 할 일 중 가장 중요한 것 하나만 골라 먼저 해보세요. 목록을 줄이는 것이 생각 정리의 시작입니다.",
    green:
      "잠깐 밖으로 나가 햇빛을 보거나 식물 한 그루를 바라보는 것만으로도 마음의 균형이 회복됩니다.",
    blue:
      "오늘 하루 일정 중 하나를 의도적으로 비워두세요. 빈 시간이 내면의 질서를 되찾는 공간이 됩니다.",
    purple:
      "오늘 느낀 것을 3줄 이내로 적어보세요. 글로 꺼내는 것이 생각 과몰입을 줄이는 데 도움이 됩니다.",
    lavender:
      "좋아하는 향이나 음악을 5분만 즐겨보세요. 감각을 통한 회복이 지금 당신에게 잘 맞는 루틴입니다.",
    neutral:
      "오늘 하루 작은 것 하나를 정리해보세요. 책상 위, 가방 안, 메모 앱 — 작은 정리가 마음 정리로 이어집니다.",
    cool:
      "물 한 잔 마시기, 창문 열기, 짧은 스트레칭이 몸에 신호를 보내는 작은 행동입니다. 리듬 회복에 도움이 됩니다.",
    black:
      "오늘은 외부 자극을 최소화하고 에너지를 보호하는 시간을 가져보세요. 완전한 휴식이 가장 강력한 회복입니다.",
  };

  const family = colorId ? getColorFamily(colorId) : 'neutral';
  const colorRoutineNote = colorRoutineMap[family] ?? colorRoutineMap['neutral'];

  // 직업+고민 조합 코칭 노트 (1문장)
  const coachingNote = getJobConcernNote(job, concerns ?? []);

  // 조건부 위로 문구/성경구절 (타종교 제외 전체 표시)
  const showScripture = faith !== '타종교' && colorId !== undefined;
  const scriptureVerse = (showScripture && colorId) ? getScriptureVerse(colorId, faith, flowType, archetypeKey) : undefined;

  return { routineNote: colorRoutineNote, coachingNote, scriptureVerse };
}

function SectionCard({
  title,
  children,
  accentColor,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  accentColor: string;
  colors: any;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' },
      ]}
    >
      <View style={[styles.sectionTitleBar, { borderLeftColor: accentColor }]}>
        <Text style={[styles.sectionTitle, { color: '#3D3530' }]}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

export default function PremiumResultScreen() {
  const colors = useColors();
  const router = useRouter();
  const [cards, setCards] = useState<CardData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [trialStatus, setTrialStatus] = useState<TrialStatus>("none");
  const [remainingLabel, setRemainingLabel] = useState<string | null>(null);
   const [prevColors, setPrevColors] = useState<ColorData[]>([]);
  // 후기 state
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewId, setReviewId] = useState<number | null>(null);
  const [isEditingReview, setIsEditingReview] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const REVIEW_TAGS = ["성향 해석", "관계 흐름", "무의식 흐름", "회복 방향", "코칭 메시지", "보완 루틴"];

  const createReviewMutation = trpc.reviews.create.useMutation();
  const updateReviewMutation = trpc.reviews.update.useMutation();
  const logVisitor = trpc.visitors.log.useMutation();

  const handleReviewSubmit = async () => {
    if (reviewRating === 0) {
      Alert.alert("별점을 선택해 주세요");
      return;
    }
    setReviewSubmitting(true);
    Keyboard.dismiss();
    try {
      // 결제 시 입력한 이름 불러오기 (없으면 "익명")
      const storedName = await AsyncStorage.getItem("senderName");
      const nickname = storedName?.trim() || "익명";
      const colorCombo = prevColors.length > 0
        ? prevColors.map(c => c.korName).join(' + ')
        : undefined;
      const tagsStr = reviewTags.join(',');

      let savedId = reviewId;
      if (isEditingReview && reviewId) {
        // 수정
        await updateReviewMutation.mutateAsync({
          id: reviewId,
          rating: reviewRating,
          content: reviewText.trim(),
          tags: tagsStr,
        });
      } else {
        // 신규 저장
        savedId = await createReviewMutation.mutateAsync({
          nickname,
          rating: reviewRating,
          content: reviewText.trim(),
          tags: tagsStr,
          colorCombo,
        }) as number;
        setReviewId(savedId);
      }

      const localData = {
        id: savedId,
        rating: reviewRating,
        text: reviewText.trim(),
        tags: reviewTags,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("premiumReview", JSON.stringify(localData));
      setReviewDone(true);
      setIsEditingReview(false);
    } catch (e) {
      // 서버 실패 시 로컈에만 저장
      const localData = {
        rating: reviewRating,
        text: reviewText.trim(),
        tags: reviewTags,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("premiumReview", JSON.stringify(localData));
      setReviewDone(true);
      setIsEditingReview(false);
    }
    setReviewSubmitting(false);
  };
  useEffect(() => {
      let mounted = true;
      (async () => {
        const raw = await AsyncStorage.getItem("premiumSelectedCards");
        const profileRaw = await AsyncStorage.getItem("userProfile");
        const colorsRaw = await AsyncStorage.getItem("premiumSelectedColors");
        const reviewRaw = await AsyncStorage.getItem("premiumReview");
        if (!mounted) return;
        if (raw) {
          try {
            const parsed: CardData[] = JSON.parse(raw);
            // 구형 데이터 마이그레이션: strengths 필드가 없는 카드는 CARD_DATA에서 최신 데이터로 교체
            const migrated = parsed.map((card) => {
              if (!Array.isArray(card.strengths)) {
                // id 정규화: 하이픈 → 언더스코어 (구형 포맷 호환)
                const normalizedId = card.id?.replace(/-/g, '_');
                const fresh = CARD_DATA.find(
                  (c) => c.id === normalizedId || c.id === card.id ||
                  (c.color === card.color && c.shape === card.shape)
                );
                return fresh ?? { ...card, strengths: [] };
              }
              return card;
            });
            setCards([...migrated]);
          } catch {
            // 파싱 실패 시 빈 배열 유지
          }
        }
        if (profileRaw) setProfile({ ...JSON.parse(profileRaw) });
        if (colorsRaw) {
          try { setPrevColors([...JSON.parse(colorsRaw)]); } catch {}
        }
        // 심화 결과 도달 추적
        try {
          const deviceId = await AsyncStorage.getItem('husim_device_id') ?? 'unknown';
          const cardIds = raw ? JSON.parse(raw).map((c: any) => c.id).join(',') : '';
          const colorIds = colorsRaw ? JSON.parse(colorsRaw).map((c: any) => c.id).join(',') : '';
          logVisitor.mutate({
            deviceId,
            visitType: 'deep_result',
            testType: 'deep',
            selectedCards: cardIds,
            selectedColors: colorIds,
          });
        } catch (_) {}
        if (reviewRaw) {
          try {
            const saved = JSON.parse(reviewRaw);
            if (!mounted) return;
            setReviewDone(true);
            setReviewRating(saved.rating ?? 0);
            setReviewText(saved.text ?? "");
            setReviewTags(saved.tags ?? []);
            if (saved.id) setReviewId(saved.id);
          } catch {}
        }
        const status = await getTrialStatus();
        if (!mounted) return;
        setTrialStatus(status);
        if (status === "active") {
          const label = await getTrialRemainingLabel();
          if (mounted) setRemainingLabel(label);
        }
      })();
      return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = cards.length < 3;

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: '#555555' }]}>
            카드 정보를 불러오는 중...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const [card1, card2, card3] = cards;

  // 삶의 역할 Archetype + 오행 기반 에너지 흐름 해석 (jobCoaching보다 먼저 계산)
  const lifeEnergyResult: LifeEnergyResult = buildLifeEnergyResult(
    prevColors.length >= 3 ? prevColors.map((c) => c.id) : [card1.color, card2.color, card3.color],
    [card1, card2, card3].map((c) => ({ color: c.color, shape: c.shape })),
  );
  // 오행 흐름 유형 및 메인 Archetype 키 추출 (성경구절 매칭용)
  const _lifeFlowType = lifeEnergyResult.flowType;
  const _archetypeKey = lifeEnergyResult.archetypes[0]?.key ?? '';

  // 직업별 맞춤 문구 (3번 카드 콜러 기준 성경구절)
  const jobCoaching = profile ? getJobCoaching(profile.job, profile.faith, card3?.color, profile.concerns, _lifeFlowType, _archetypeKey) : null;

  // 3카드 조합 종합 코칭 메시지 생성 (감정 공감 중심)
  const combinedCoaching = generateCombinedCoaching(card1, card2, card3, prevColors.length >= 3 ? prevColors : undefined);
  // 하단 여운 문장: 3번 카드(회복 방향) 기준
  const closingLine = card3.closingLine;

  const handleShare = async () => {
    // 보완 루틴 텍스트 구성 (card3 wellness 기준)
    const routineLines = card3.wellness.routine
      .slice(0, 2)
      .map((r: string) => `  · ${sanitizeRecovery(r, profile?.faith ?? '')}`);
    const wellnessText =
      `🌿 오늘의 보완 루틴\n` +
      `  · 추천 차: ${card3.wellness.tea}\n` +
      `  · 추천 호흡: ${card3.wellness.breath}\n` +
      routineLines.join('\n');

    const shareText = `[휴심컬러 나의 컬러 심리 해석]\n\n` +
      `1번(내면): ${card1.colorKor} ${card1.shapeKor} - ${card1.energyTitle}\n` +
      `2번(현재): ${card2.colorKor} ${card2.shapeKor} - ${card2.energyTitle}\n` +
      `3번(회복): ${card3.colorKor} ${card3.shapeKor} - ${card3.energyTitle}\n\n` +
      `${combinedCoaching}\n\n` +
      `${wellnessText}\n\nhusimcolor.vercel.app`;

    if (Platform.OS === "web") {
      // 웹: navigator.share 또는 클립보드 복사
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          await navigator.share({ text: shareText, title: "휴심COLOR 나의 콜러 심리 해석" });
        } catch {}
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
        Alert.alert("복사 완료", "결과가 클립보드에 복사되었습니다.");
      }
    } else {
      // 네이티브(iOS/Android): expo-sharing 사용
      try {
        const available = await Sharing.isAvailableAsync();
        if (available) {
          // 텍스트를 임시 파일로 저장 후 공유
          const fileUri = `${FileSystem.cacheDirectory}husimcolor_share_${Date.now()}.txt`;
          await FileSystem.writeAsStringAsync(fileUri, shareText, { encoding: FileSystem.EncodingType.UTF8 });
          await Sharing.shareAsync(fileUri, { mimeType: 'text/plain', dialogTitle: '휴심COLOR 결과 공유' });
        } else {
          Alert.alert('공유', shareText, [{ text: '확인' }]);
        }
      } catch {
        Alert.alert('공유 오류', '결과 공유에 실패했습니다. 다시 시도해 주세요.');
      }
    }
  };

  return (
    <ScreenContainer>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: '#3D3530' }]}>
            나의 컬러 심리 해석
          </Text>
          {profile && (
            <Text style={[styles.headerProfile, { color: '#555555' }]}>
              {profile.age}세 · {profile.job} · {profile.faith}
            </Text>
          )}
          {profile?.concerns && profile.concerns.length > 0 && (
            <View style={styles.concernsRow}>
              {profile.concerns.map((c) => (
                <View key={c} style={[styles.concernBadge, { backgroundColor: '#7B9FBF22', borderColor: '#7B9FBF55' }]}>
                  <Text style={[styles.concernBadgeText, { color: '#5A7FA0' }]}>{c}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 선택 카드 3장 요약 */}
        <View style={styles.cardSummaryRow}>
          {cards.map((card, i) => (
            <View key={card.id} style={styles.cardSummaryItem}>
              <View
                style={[
                  styles.cardSummaryBadge,
                  {
                    backgroundColor: card.colorHex,
                    // 블랙 카드: 골드 테두리, 화이트 카드: 연한 골드 테두리
                    borderWidth: card.colorKor === "블랙" ? 2 : card.colorKor === "화이트" ? 1.5 : 0,
                    borderColor: card.colorKor === "블랙" ? "#D4AF37" : card.colorKor === "화이트" ? "#D8C7A5" : "transparent",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardSummarySymbol,
                    card.colorKor === "화이트" && { color: "#D4AF37" },
                  ]}
                >
                  {card.shapeSymbol}
                </Text>
              </View>
              <Text
                style={[
                  styles.cardSummaryPosition,
                  { color: POSITION_LABELS[i].color },
                ]}
              >
                {POSITION_LABELS[i].label}
              </Text>
              <Text
                style={[styles.cardSummaryName, { color: '#3D3530' }]}
              >
                {card.colorKor}
              </Text>
              <Text style={[styles.cardSummaryShape, { color: '#555555' }]}>
                {card.shapeKor}
              </Text>
              <Text
                style={[styles.cardSummaryEnergy, { color: POSITION_LABELS[i].color }]}
                numberOfLines={2}
              >
                {card.energyTitle}
              </Text>
            </View>
          ))}
        </View>

        {/* 카드별 상세 해석 */}
        {cards.map((card, i) => (
          <SectionCard
            key={card.id}
            title={`${POSITION_LABELS[i].label} · ${card.colorKor} ${card.shapeKor}`}
            accentColor={POSITION_LABELS[i].color}
            colors={colors}
          >
            <View style={styles.cardDetailContent}>
              {/* 오각형 안내 배지 */}
              {card.shape === 'pentagon' && (
                <View style={[styles.pentagonBadge, { backgroundColor: POSITION_LABELS[i].color + '18', borderColor: POSITION_LABELS[i].color + '40' }]}>
                  <Text style={[styles.pentagonBadgeText, { color: POSITION_LABELS[i].color }]}>
                    ⬠ 오각형 에너지 · 연결 · 통합 · 의미 확장
                  </Text>
                </View>
              )}
              {/* 1번 카드: 무의식/내면 에너지 흐름 */}
              {i === 0 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: '#555555' }]}>
                    무의식 에너지 흐름
                  </Text>
                  <Text style={[styles.detailText, { color: '#3D3530' }]}>
                    {card.psychologyFlow}
                  </Text>
                </View>
              )}
              {/* 2번 카드: 현재 에너지 흐름 */}
              {i === 1 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: '#555555' }]}>
                    현재 에너지 흐름
                  </Text>
                  <Text style={[styles.detailText, { color: '#3D3530' }]}>
                    {card.personalityFlow}
                  </Text>
                </View>
              )}
              {/* 3번 카드: 회복 방향 */}
              {i === 2 && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: '#555555' }]}>
                    회복 방향
                  </Text>
                  <Text style={[styles.detailText, { color: '#3D3530' }]}>
                    {extractFirstSentence(sanitizeRecovery(card.recoveryDirection, profile?.faith ?? ''))}
                  </Text>
                </View>
              )}
              {/* 감정 패턴 - 공통 */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: '#555555' }]}>
                  감정 패턴
                </Text>
                <Text style={[styles.detailText, { color: '#3D3530' }]}>
                  {card.emotionPattern}
                </Text>
              </View>
              {/* 장점 - 공통 */}
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: '#555555' }]}>
                  장점
                </Text>
                <View style={styles.tagsRow}>
                  {(card.strengths ?? []).map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.tag,
                        {
                          backgroundColor: POSITION_LABELS[i].color + "22",
                          borderColor: POSITION_LABELS[i].color + "55",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          { color: POSITION_LABELS[i].color },
                        ]}
                      >
                        {s}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </SectionCard>
        ))}

        {/* 보완 컬러 */}
        <SectionCard
          title="지금 나에게 필요한 컬러"
          accentColor="#7A4A10"
          colors={colors}
        >
          <View style={styles.complementContent}>
            <Text style={[styles.complementDesc, { color: '#555555' }]}>
              지금 마음을 채워줄 컬러입니다
            </Text>
            <View style={styles.tagsRow}>
              {(() => {
                // 정화·안정·내면 성향 콜러: 레드·코랄·오렌지 같은 고에너지 콜러와 충돌
                const CALM_RECOVERY = [
                  '화이트', '아이보리', '비이지', '그린', '세이지그린',
                  '네이비', '블루', '라이트블루', '스카이블루',
                  '라벤더', '퍼플', '라일락', '인디고', '실버', '미드나이트',
                ];
                // 강한 확장·추진 에너지 콜러: 정화·안정 회복 방향에는 제외
                const HIGH_ENERGY = ['레드', '코랄', '오렌지', '마젠타'];
                // 유사 계열 그룹: 같은 그룹에서 하나만 추천
                // 코랄·오렌지·레드는 에너지 방향이 격쳐 동시 추천 불가
                const SIMILAR_GROUPS: string[][] = [
                  ['블루', '네이비', '인디고', '미드나이트'],
                  ['레드', '코랄', '오렌지', '마젠타'],  // 활성 계열: 전체 그룹에서 1개만 허용
                  ['그린', '세이지그린', '올리브'],
                  ['라벤더', '라일락', '퍼플'],
                  ['화이트', '아이보리', '크림', '비이지'],
                  ['미트', '스카이블루', '라이트블루', '틸'],
                ];
                // 레드 허용 조건: 사용자 카드 3장 모두 쿨/안정 계열일 때만 (극심한 무기력 상황)
                const COOL_STABLE_KORS = ['블루', '네이비', '인디고', '스카이블루', '틸', '미트', '라벤더', '실버', '화이트', '크림', '아이보리', '비이지'];
                const allCardsAreCoolStable = [card1.colorKor, card2.colorKor, card3.colorKor].every(c => COOL_STABLE_KORS.includes(c));
                const isCalm = CALM_RECOVERY.includes(card3.colorKor);
                // 현재 이미 강하게 활성화된 컬러(3장 카드에 사용된 컬러) 목록
                const activeColors = new Set([card1.colorKor, card2.colorKor, card3.colorKor]);
                // 활성화 컬러와 같은 계열 그룹도 제외 대상에 포함
                const activeGroups = new Set<number>();
                activeColors.forEach(name => {
                  const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(name));
                  if (gIdx >= 0) activeGroups.add(gIdx);
                });
                // card3 보완 컬러를 우선, card1 보완 컬러를 보조로 추가
                const allColors = [...card3.complementColors, ...card1.complementColors];
                const seen = new Set<string>();
                const usedGroups = new Set<number>();
                const filtered = allColors.filter(c => {
                  if (seen.has(c.name)) return false;
                  seen.add(c.name);
                  // 이미 카드에서 강하게 나타난 콜러 자체는 제외
                  if (activeColors.has(c.name)) return false;
                  // 레드는 특수 조건(전체 쿨/안정 계열)일 때만 허용
                  if (c.name === '레드' && !allCardsAreCoolStable) return false;
                  // 회복 방향이 안정·정리 성향이면 고에너지 콜러는 제외
                  if (isCalm && HIGH_ENERGY.includes(c.name)) return false;
                  // 유사 계열 중복 방지: 같은 그룹에서 이미 추천된 콜러가 있으면 제외
                  const groupIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                  if (groupIdx >= 0) {
                    // 이미 활성화된 콜러와 같은 계열이면 우선순위 낙춴(뒤로 미릉)
                    if (activeGroups.has(groupIdx)) return false;
                    if (usedGroups.has(groupIdx)) return false;
                    usedGroups.add(groupIdx);
                  }
                  return true;
                });
                // 필터 후 3개 미만이면 계열 제한 없이 보충 (activeColors 자체만 제외)
                if (filtered.length < 3) {
                  const seen2 = new Set(filtered.map(c => c.name));
                  const usedGroups2 = new Set<number>();
                  filtered.forEach(c => {
                    const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                    if (gIdx >= 0) usedGroups2.add(gIdx);
                  });
                  const extra = allColors.filter(c => {
                    if (seen2.has(c.name)) return false;
                    if (activeColors.has(c.name)) return false;
                    if (c.name === '레드' && !allCardsAreCoolStable) return false;
                    if (isCalm && HIGH_ENERGY.includes(c.name)) return false;
                    const gIdx = SIMILAR_GROUPS.findIndex(g => g.includes(c.name));
                    if (gIdx >= 0) {
                      if (usedGroups2.has(gIdx)) return false;
                      usedGroups2.add(gIdx);
                    }
                    seen2.add(c.name);
                    return true;
                  });
                  return [...filtered, ...extra].slice(0, 3);
                }
                return filtered.slice(0, 3); // 최대 3개까지만 표시
              })().map((c) => {
                const chipStyle = getColorChipStyle(c.name);
                return (
                  <View
                    key={c.name}
                    style={[
                      styles.tag,
                      {
                        backgroundColor: chipStyle.tagBg,
                        borderColor: chipStyle.chipBorder,
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        minWidth: 110,
                        flex: 1,
                      }
                    ]}
                  >
                    {/* 컨러칩 + 컨러명 행 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                      <View
                        style={[
                          {
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: chipStyle.chipBg,
                            marginRight: 6,
                          },
                          getLightColorBorder(chipStyle.chipBg),
                        ]}
                      />
                      <Text style={{ color: chipStyle.textColor, fontSize: 13, fontWeight: '700', letterSpacing: 0.2 }}>
                        {c.name}
                      </Text>
                    </View>
                    {/* 의미 텍스트 */}
                    <Text style={{ color: chipStyle.textColor, fontSize: 11, lineHeight: 16, opacity: 0.85 }}>
                      {c.meaning}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </SectionCard>

        {/* 컬러 성향 흐름 섹션 */}
        {prevColors.length >= 3 && (
          <View style={[styles.colorFlowSection, { backgroundColor: "#F8F4EE", borderColor: "#D4C8B844" }]}>
          <Text style={[styles.colorFlowSectionTitle, { color: "#5C3D00" }]}>
              🎨 나의 컬러 성향
            </Text>
            <Text style={[styles.colorFlowSectionSub, { color: "#6B5030" }]}>
              선택한 컬러가 보여주는 나의 성향
            </Text>
            <View style={styles.colorFlowSectionRow}>
              {prevColors.map((c: ColorData, i: number) => (
                <View key={c.id} style={styles.colorFlowSectionItem}>
                  <View style={[styles.colorFlowSectionDot, { backgroundColor: c.hex }, getLightColorBorder(c.hex)]} />
                  <Text style={[styles.colorFlowSectionName, { color: "#3D2A00" }]}>{c.korName}</Text>
                  <Text style={[styles.colorFlowSectionKeyword, { color: "#6B5030" }]}>{c.keywords[0]}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.colorFlowSectionDesc, { color: "#4A3010" }]}>
              {prevColors[0].korName}의 {prevColors[0].keywords[0]}·{prevColors[1].korName}의 {prevColors[1].keywords[0]}·{prevColors[2].korName}의 {prevColors[2].keywords[0]} 이
              {" "}당신의 성향을 이루고 있습니다.
            </Text>
          </View>
        )}
        {/* 종합 코칭 메시지 - 감정 공감 중심 */}
        <View
          style={[
            styles.coachingBox,
            { backgroundColor: "#8BAF8B18", borderColor: "#8BAF8B55" },
          ]}
        >
          <Text style={[styles.coachingLabel, { color: "#3D6B3D" }]}>
            💚 지금 마음의 흐름
          </Text>
          <Text style={[styles.coachingText, { color: '#3D3530' }]}>
            {combinedCoaching}
          </Text>
          {/* 직업+고민 조합 코칭 노트 */}
          {jobCoaching?.coachingNote ? (
            <View style={styles.jobCoachingNote}>
              <Text style={[styles.jobCoachingNoteText, { color: '#3D6B3D' }]}>
                💡 {jobCoaching.coachingNote}
              </Text>
            </View>
          ) : null}
        </View>
        {/* 조건부 위로 성경구절 */}
        {jobCoaching?.scriptureVerse ? (
          <View style={styles.scriptureBox}>
            <Text style={[styles.scriptureLabel, { color: '#7A5C30' }]}>
              {jobCoaching.scriptureVerse.label}
            </Text>
            <Text style={[styles.scriptureText, { color: '#4A3010' }]}>
              “{jobCoaching.scriptureVerse.text}”
            </Text>
            <Text style={[styles.scriptureRef, { color: '#A0845C' }]}>
              — {jobCoaching.scriptureVerse.ref}
            </Text>
          </View>
        ) : null}

        {/* ── 삶의 역할 에너지 Archetype 섹션 ── */}
        <View style={[styles.archetypeSection, { backgroundColor: '#F5F0FF', borderColor: '#C8B8E8' }]}>
          <Text style={[styles.archetypeSectionTitle, { color: '#5B3A8A' }]}>
            ✨ 나의 삶의 역할 에너지
          </Text>
          <Text style={[styles.archetypeSectionSub, { color: '#7A5CAA' }]}>
            컬러와 카드가 보여주는 나만의 역할 흐름
          </Text>
          {lifeEnergyResult.archetypes.map((arch, idx) => (
            <View key={arch.key} style={[styles.archetypeCard, { borderLeftColor: idx === 0 ? '#8B5CF6' : '#A78BFA' }]}>
              <View style={styles.archetypeCardHeader}>
                <View style={[styles.archetypeIndexBadge, { backgroundColor: idx === 0 ? '#8B5CF6' : '#A78BFA' }]}>
                  <Text style={styles.archetypeIndexText}>{idx === 0 ? '메인' : '보조'}</Text>
                </View>
                <MaterialIcons
                  name={arch.iconName as any}
                  size={20}
                  color={idx === 0 ? '#7C3AED' : '#9B72CF'}
                  style={{ marginRight: 6, marginTop: 1 }}
                />
                <Text style={[styles.archetypeLabel, { color: '#3D1F6E', flex: 1 }]}>{arch.label}</Text>
              </View>
              <Text style={[styles.archetypeCoreEnergy, { color: '#4A2E7A' }]}>{arch.coreEnergy}</Text>
              <Text style={[styles.archetypeDetail, { color: '#6B4E9A' }]}>
                <Text style={{ fontWeight: '600' }}>살아나는 환경  </Text>
                {arch.thriveIn}
              </Text>
              <Text style={[styles.archetypeDetail, { color: '#6B4E9A' }]}>
                <Text style={{ fontWeight: '600' }}>지치는 패턴  </Text>
                {arch.drainPattern}
              </Text>
              <Text style={[styles.archetypeDirection, { color: '#5B3A8A' }]}>{arch.lifeDirection}</Text>
            </View>
          ))}
          {lifeEnergyResult.archetypes.length >= 2 && (
            <View style={[styles.archetypeCoachingBox, { backgroundColor: '#EDE9FF', borderColor: '#C4B5FD' }]}>
              <Text style={[styles.archetypeCoachingText, { color: '#3D1F6E' }]}>
                {lifeEnergyResult.archetypeCoaching}
              </Text>
            </View>
          )}
          {/* 메인 Archetype 오늘의 실천 카드 */}
          {lifeEnergyResult.archetypes.length > 0 && lifeEnergyResult.archetypes[0].dailyPractice && (
            <View style={[styles.dailyPracticeCard, { backgroundColor: '#FAF5FF', borderColor: '#DDD6FE' }]}>
              <View style={styles.dailyPracticeHeader}>
                <MaterialIcons name="wb-twilight" size={16} color="#7C3AED" style={{ marginRight: 6 }} />
                <Text style={[styles.dailyPracticeLabel, { color: '#5B3A8A' }]}>오늘의 작은 실천</Text>
              </View>
              <Text style={[styles.dailyPracticeText, { color: '#3D1F6E' }]}>
                {lifeEnergyResult.archetypes[0].dailyPractice}
              </Text>
            </View>
          )}
        </View>
        {/* ── 몸·감정 에너지 흐름 섹션 ── */}
        <View style={[styles.energyFlowSection, { backgroundColor: '#F0F7F4', borderColor: '#A8D5C2' }]}>
          <Text style={[styles.energyFlowTitle, { color: '#2D6A4F' }]}>
            🌊 지금 몸과 마음의 흐름
          </Text>
          <Text style={[styles.energyFlowSub, { color: '#4A8C70' }]}>
            선택한 컬러와 카드가 읽어주는 현재 에너지
          </Text>
          <View style={[styles.energyFlowTitleBadge, { backgroundColor: '#D8F0E8', borderColor: '#A8D5C2' }]}>
            <Text style={[styles.energyFlowTitleBadgeText, { color: '#1B5E3B' }]}>
              {lifeEnergyResult.energyFlow.title}
            </Text>
          </View>
          <Text style={[styles.energyFlowDesc, { color: '#2D4A3E' }]}>
            {lifeEnergyResult.energyFlow.description}
          </Text>
          <View style={[styles.energyFlowRecoveryBox, { backgroundColor: '#E8F5EE', borderColor: '#A8D5C2' }]}>
            <Text style={[styles.energyFlowRecoveryLabel, { color: '#1B5E3B' }]}>
              💚 지금 필요한 것
            </Text>
            <Text style={[styles.energyFlowRecoveryText, { color: '#2D4A3E' }]}>
              {lifeEnergyResult.energyFlow.recovery}
            </Text>
          </View>
          <View style={styles.energyFlowKeywords}>
            {lifeEnergyResult.energyFlow.balanceKeywords.map((kw) => (
              <View key={kw} style={[styles.energyFlowKeywordTag, { backgroundColor: '#C8EAD8', borderColor: '#8BBFA8' }]}>
                <Text style={[styles.energyFlowKeywordText, { color: '#1B5E3B' }]}>{kw}</Text>
              </View>
            ))}
          </View>
        </View>
        {/* 보완 루틴 섹션 */}
        <View style={[styles.wellnessSection, { backgroundColor: '#FFF8F0', borderColor: '#E8D5B0' }]}>
          <Text style={[styles.wellnessSectionTitle, { color: '#8B6914' }]}>
            🌿 오늘의 보완 루틴
          </Text>
          <Text style={[styles.wellnessSectionSub, { color: '#A0845C' }]}>
            오늘 실천할 수 있는 회복 행동 가이드입니다
          </Text>
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🍵</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 차</Text>
              <Text style={[styles.wellnessValue, { color: '#5C4A1E' }]}>{card3.wellness.tea}</Text>
            </View>
          </View>
          <View style={styles.wellnessDivider} />
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🌬️</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 호흡</Text>
              <Text style={[styles.wellnessValue, { color: '#5C4A1E' }]}>{card3.wellness.breath}</Text>
            </View>
          </View>
          <View style={styles.wellnessDivider} />
          <View style={styles.wellnessRow}>
            <Text style={styles.wellnessIcon}>🌱</Text>
            <View style={styles.wellnessContent}>
              <Text style={[styles.wellnessLabel, { color: '#8B6914' }]}>추천 루틴</Text>
              {card3.wellness.routine.map((item, idx) => (
                <Text key={idx} style={[styles.wellnessRoutineItem, { color: '#5C4A1E' }]}>
                  · {sanitizeRecovery(item, profile?.faith ?? '')}
                </Text>
              ))}
            </View>
          </View>
          {/* 직업별 루틴 노트 - 행동 가이드 보완 */}
          {jobCoaching && (
            <View style={styles.jobRoutineNote}>
              <Text style={[styles.jobRoutineText, { color: '#8B6914' }]}>
                💡 {jobCoaching.routineNote}
              </Text>
            </View>
          )}
        </View>

        {/* 맞춤 회복 루틴 섹션 — Archetype + 에너지 흐름 조합 */}
        <View style={[styles.contextualRoutineSection, { backgroundColor: '#F0F4FF', borderColor: '#B8C8F0' }]}>
          <Text style={[styles.contextualRoutineTitle, { color: '#2A3A6E' }]}>
            🌱 {lifeEnergyResult.routines.label}
          </Text>
          <Text style={[styles.contextualRoutineSub, { color: '#4A5A8E' }]}>
            지금 나의 에너지 흐름에 맞춘 실천 제안입니다
          </Text>
          {lifeEnergyResult.routines.items.map((item, idx) => (
            <View key={idx} style={styles.contextualRoutineItem}>
              <Text style={[styles.contextualRoutineDot, { color: '#5B6FB8' }]}>·</Text>
              <Text style={[styles.contextualRoutineText, { color: '#2A3A6E' }]}>{item}</Text>
            </View>
          ))}
          <View style={[styles.contextualRoutineCoachingBox, { backgroundColor: '#E8EDFF', borderColor: '#B8C8F0' }]}>
            <Text style={[styles.contextualRoutineCoachingText, { color: '#1A2A5E' }]}>
              {lifeEnergyResult.routines.coaching}
            </Text>
          </View>
        </View>

        {/* 체험 중 결제 유도 배너 */}
        {(trialStatus === "active" || trialStatus === "expired") && (
          <View style={[styles.trialBanner, {
            backgroundColor: trialStatus === "expired" ? "#F5EDE0" : "#EDF5ED",
            borderColor: trialStatus === "expired" ? "#C4956A55" : "#8BAF8B55",
          }]}>
            {trialStatus === "active" && remainingLabel ? (
              <>
                <Text style={[styles.trialBannerTitle, { color: "#5A8A5A" }]}>
                  🌿 무료체험 중 · 남은 시간 {remainingLabel}
                </Text>
                <Text style={[styles.trialBannerDesc, { color: "#5A8A5A" }]}>
                  체험 기간 종료 후에는 결제 후 이용 가능합니다
                </Text>
              </>
            ) : (
              <>
                <Text style={[styles.trialBannerTitle, { color: "#7A4A10" }]}>
                  현재 초기 오픈 체험중입니다
                </Text>
                <Text style={[styles.trialBannerDesc, { color: "#7A4A10" }]}>
                  공유와 후기를 남겨주시면 큰 도움이 됩니다 🙂
                </Text>
              </>
            )}
            <TouchableOpacity
              style={[styles.trialBannerBtn, {
                backgroundColor: trialStatus === "expired" ? "#C4956A" : "#8BAF8B",
              }]}
              onPress={() => router.push("/payment" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.trialBannerBtnText}>컬러+도형 심층 해석 (유료)</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* 공유 버튼 */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' }]}
          onPress={handleShare}
          activeOpacity={0.7}
        >
          <Text style={[styles.shareButtonText, { color: '#3D3530' }]}>
            결과 공유하기
          </Text>
        </TouchableOpacity>

        {/* 1:1 코칭 연결 섹션 */}
        <View style={styles.coachingSection}>
          <Text style={[styles.coachingSectionTitle, { color: '#3D3530' }]}>
            지금의 마음 흐름을{"\n"}더 깊이 이해하고 싶다면
          </Text>
          <Text style={[styles.coachingSectionSub, { color: '#555555' }]}>
            휴심컬러와 함께하는 1:1 컬러코칭을 만나보세요
          </Text>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#03C75A" }]}
            onPress={() => {
              Linking.openURL("https://naver.me/ID3fxw2W");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>N</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>네이버 예약</Text>
                <Text style={styles.coachingLinkDesc}>1:1 컬러코칭 예약하기</Text>
                <Text style={styles.coachingLinkDesc}>이음트레이드 · 동소문로 47 701호</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#FEE500" }]}
            onPress={() => {
              Linking.openURL("https://open.kakao.com/o/sp6nBerh");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#00000022" }]}>
                <Text style={[styles.coachingLinkIconText, { color: "#3A1D00" }]}>💬</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={[styles.coachingLinkTitle, { color: "#3A1D00" }]}>온라인 상담 문의</Text>
                <Text style={[styles.coachingLinkDesc, { color: "#3A1D00AA" }]}>멀리 계시거나 방문이 어려운 분은</Text>
                <Text style={[styles.coachingLinkDesc, { color: "#3A1D00AA" }]}>카카오톡으로 온라인 코칭 가능 여부를 문의해 주세요.</Text>
              </View>
              <Text style={[styles.coachingLinkArrow, { color: "#3A1D00" }]}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#E1306C" }]}
            onPress={() => {
              Linking.openURL("https://www.instagram.com/husim_lumiere?igsh=MTh6bWhpdWRjb2Rtcw==");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>📷</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>인스타그램</Text>
                <Text style={styles.coachingLinkDesc}>@husim_lumiere 팔로우</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>

          {/* 유튜브 묵상채널 */}
          <TouchableOpacity
            style={[styles.coachingLinkBtn, { backgroundColor: "#FF0000" }]}
            onPress={() => {
              Linking.openURL("https://youtube.com/@huali7603?si=4R0Hk-Xna6iS3OP9");
            }}
            activeOpacity={0.8}
          >
            <View style={styles.coachingLinkInner}>
              <View style={[styles.coachingLinkIcon, { backgroundColor: "#FFFFFF33" }]}>
                <Text style={styles.coachingLinkIconText}>▶️</Text>
              </View>
              <View style={styles.coachingLinkTexts}>
                <Text style={styles.coachingLinkTitle}>유튜브 묵상채널</Text>
                <Text style={styles.coachingLinkDesc}>마음을 쉬게 하는 묵상 영상</Text>
              </View>
              <Text style={styles.coachingLinkArrow}>→</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 하단 여운 한 문장 + 후기 인라인 섹션 */}
        <View style={[styles.reviewSection, { backgroundColor: '#F2EFE7', borderColor: "#8BAF8B44" }]}>
          {reviewDone ? (
            /* 후기 완료 상태 */
            <View style={styles.reviewDoneBox}>
              <Text style={[styles.reviewDoneIcon]}>🌿</Text>
              <Text style={[styles.reviewDoneText, { color: "#3D6B3D" }]}>
                후기를 남겨주셔서 감사합니다
              </Text>
              <Text style={[styles.reviewDoneSub, { color: '#555555' }]}>
                {"⭐".repeat(reviewRating)} · {reviewTags.join(" · ")}
              </Text>
              <TouchableOpacity
                style={styles.reviewEditBtn}
                onPress={() => {
                  setIsEditingReview(true);
                  setReviewDone(false);
                }}
              >
                <Text style={[styles.reviewEditBtnText, { color: '#555555' }]}>
                  수정하기
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* 후기 입력 폼 */
            <View style={styles.reviewForm}>
              <Text style={[styles.reviewAskText, { color: '#3D3530' }]}>
                짧은 후기를 남겨주시면{"\n"}휴심컬러가 더 따뜻하게 성장하는 데 큰 힘이 됩니다 😊
              </Text>

              {/* 별점 */}
              <View style={styles.reviewStarRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setReviewRating(star)}
                    activeOpacity={0.7}
                    style={styles.reviewStarBtn}
                  >
                    <Text style={[styles.reviewStarText, { color: star <= reviewRating ? "#F59E0B" : '#DDD8CE' }]}>
                      ★
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 공감 포인트 선택 */}
              <Text style={[styles.reviewTagLabel, { color: '#444444' }]}>
                어떤 부분이 가장 공감되셨나요?
              </Text>
              <View style={styles.reviewTagRow}>
                {REVIEW_TAGS.map((tag) => {
                  const selected = reviewTags.includes(tag);
                  return (
                    <TouchableOpacity
                      key={tag}
                      onPress={() => {
                        setReviewTags(prev =>
                          prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                        );
                      }}
                      activeOpacity={0.75}
                      style={[
                        styles.reviewTag,
                        selected
                          ? { backgroundColor: "#8BAF8B", borderColor: "#8BAF8B" }
                          : { backgroundColor: '#F2EFE7', borderColor: '#DDD8CE' },
                      ]}
                    >
                      <Text style={[styles.reviewTagText, { color: selected ? "#FFFFFF" : '#444444' }]}>
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 한줄 후기 */}
              <TextInput
                  style={[
                  styles.reviewInput,
                  { backgroundColor: '#FAF8F3', borderColor: '#DDD8CE', color: '#3D3530' },
                ]}
                placeholder="짧은 후기를 남겨주세요 (선택)"
                placeholderTextColor={'#9B8E85'}
                value={reviewText}
                onChangeText={setReviewText}
                maxLength={100}
                returnKeyType="done"
                onSubmitEditing={Keyboard.dismiss}
              />

              {/* 제출 버튼 */}
              <TouchableOpacity
                style={[styles.reviewSubmitBtn, { backgroundColor: "#8BAF8B" }]}
                onPress={handleReviewSubmit}
                activeOpacity={0.85}
                disabled={reviewSubmitting}
              >
                <Text style={styles.reviewSubmitBtnText}>
                  {reviewSubmitting ? "저장 중..." : "후기 남기기"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 다시 선택 */}
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: '#DDD8CE' }]}
          onPress={() => router.push("/premium-select" as any)}
          activeOpacity={0.7}
        >
          <Text style={[styles.retryButtonText, { color: '#444444' }]}>
            다시 선택하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}

// 조사 처리 헬퍼
function josaCoach(word: string, jong: string, noJong: string): string {
  if (!word) return jong;
  const code = word.charCodeAt(word.length - 1);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    return (code - 0xAC00) % 28 > 0 ? jong : noJong;
  }
  return jong;
}

// 1번 카드: 무의식/내면 흐름 → 공감 어조 1~2문장 (간결)
function toFlowPhrase(title: string): string {
  const eun = josaCoach(title, '은', '는');
  if (title.endsWith('마음')) {
    return `${title}${eun} 지금 당신 안에 조용히 자리하고 있습니다. 억지로 바꾸려 하기보다 그 마음을 먼저 알아봐 주세요.`;
  }
  if (title.endsWith('에너지')) {
    const base = title.replace(/에너지$/, '').trim();
    return `${base}을 향한 마음이 내면에서 조용히 이어지고 있습니다.`;
  }
  if (title.endsWith('균형') || title.endsWith('조화')) {
    return `${title}을 원하는 마음이 있습니다. 그 바람 자체가 이미 회복의 시작입니다.`;
  }
  if (title.endsWith('기질') || title.endsWith('성향')) {
    return `${title}${eun} 당신 안에 자연스럽게 흐르고 있습니다.`;
  }
  return `${title}${eun} 지금 당신 안에 조용히 자리하고 있습니다.`;
}

// 2번 카드: 현재 상태 → 담담하고 공감되는 1~2문장 (간결)
function toCurrentPhrase(title: string): string {
  const eun = josaCoach(title, '은', '는');
  if (title.endsWith('마음')) {
    return `지금은 ${title}으로 하루를 보내고 있는 것 같습니다.`;
  }
  if (title.endsWith('에너지')) {
    const base = title.replace(/에너지$/, '').trim();
    return `지금은 ${base}을 중심으로 움직이고 있는 시기입니다.`;
  }
  if (title.endsWith('흐름')) {
    return `지금은 ${title} 안에 있는 시간입니다. 억지로 벗어나려 하기보다 조용히 따라가 보세요.`;
  }
  if (title.endsWith('기질') || title.endsWith('성향')) {
    return `지금${eun} ${title} 안에 있는 시간입니다.`;
  }
  return `지금${eun} ${title} 안에 있는 시간입니다.`;
}

// 3번 카드: 회복 방향 → 따뜻한 1~2문장 브랜드 톤 (간결)
function toRecoveryPhrase(title: string): string {
  const eul = josaCoach(title, '을', '를');
  if (title.endsWith('마음')) {
    return `지금은 ${title}${eul} 천천히 따라가는 것이 가장 자연스러운 회복입니다.`;
  }
  if (title.endsWith('에너지')) {
    const base = title.replace(/에너지$/, '').trim();
    return `${base}을 위한 작은 시간을 스스로 허락해 보세요.`;
  }
  if (title.endsWith('균형') || title.endsWith('조화')) {
    return `${title}${eul} 되찾는 것이 지금 가장 중요한 한 걸음입니다.`;
  }
  if (title.endsWith('기질') || title.endsWith('성향')) {
    return `${title}${eul} 있는 그대로 받아들이는 것이 지금의 회복입니다.`;
  }
  if (title.endsWith('흐름')) {
    return `${title}${eul} 억지로 바꾸려 하기보다 조용히 따라가 보세요.`;
  }
  return `${title}${eul} 위한 여유를 스스로 허락해 보세요.`;
}

// 컬러 id → 계열 분류
function getColorFamily(colorId: string): string {
  if (['red', 'coral', 'magenta'].includes(colorId)) return 'warm_active';
  if (['orange', 'peach'].includes(colorId)) return 'warm_social';
  if (['yellow', 'gold'].includes(colorId)) return 'yellow';
  if (['green', 'sage', 'teal'].includes(colorId)) return 'green';
  if (['blue', 'navy'].includes(colorId)) return 'blue';
  if (['indigo', 'violet', 'purple'].includes(colorId)) return 'purple';
  if (['lavender', 'pink'].includes(colorId)) return 'lavender';
  if (['white', 'ivory', 'beige', 'cream'].includes(colorId)) return 'neutral';
  if (['silver', 'gray', 'charcoal'].includes(colorId)) return 'cool';
  if (['black', 'darkgray', 'dark'].includes(colorId)) return 'black';
  return 'neutral';
}

// 컬러 계열별 마지막 공감 문장 (상단 키워드 중복 방지용 - 다른 방향)
function getColorClosingLine(colorId: string, usedKeywords: string[]): string {
  const family = getColorFamily(colorId);
  const hasQuiet = usedKeywords.some(k => ['조용', '산책', '이완', '호흡', '고요'].some(w => k.includes(w)));
  const hasRecover = usedKeywords.some(k => ['회복', '안정', '쉼', '내려놓'].some(w => k.includes(w)));
  const hasPrayer = usedKeywords.some(k => ['기도', '묵상', '말씀'].some(w => k.includes(w)));

  const lines: Record<string, string[]> = {
    warm_active: [
      "마음속에 담아두기보다 작은 표현 하나가 흐름을 바꿔줄 수 있습니다.",
      "지금 느끼는 것을 작게라도 밖으로 꺼내보는 것이 에너지 순환의 시작입니다.",
      "몸을 움직이는 것이 마음을 움직이는 가장 빠른 방법일 수 있습니다.",
      "감정을 억누르기보다 작은 행동 하나로 흐름을 만들어 보세요.",
    ],
    warm_social: [
      "혼자 해결하려 하기보다 신뢰하는 한 사람에게 마음을 나눠보세요.",
      "따뜻한 연결이 지금의 회복에 가장 큰 힘이 될 수 있습니다.",
      "오늘 한 사람과의 짧은 대화가 마음의 온도를 높여줄 수 있습니다.",
      "관계 속에서 에너지를 얻는 당신에게, 오늘은 가벼운 만남 하나를 허락해 보세요.",
    ],
    yellow: [
      "모든 것을 완벽히 정리하려 하기보다 오늘 가장 중요한 한 가지에 집중해보세요.",
      "생각이 많아질수록 가장 단순한 것 하나를 먼저 해보는 것이 도움이 됩니다.",
      "우선순위를 하나 정하는 것만으로도 마음의 무게가 가벼워질 수 있습니다.",
      "지금 당장 해결하려 하기보다 오늘 할 수 있는 것 하나에 집중해보세요.",
    ],
    green: [
      "사람과 자연 속에서 숨을 고르는 시간이 마음의 균형을 회복시켜줄 수 있습니다.",
      "관계와 나 자신 사이의 균형을 찾는 것이 지금 가장 필요한 회복입니다.",
      "작은 자연의 변화를 느끼는 것만으로도 마음이 정돈되는 시간이 됩니다.",
      "지금은 관계보다 자신의 마음 속도를 먼저 살펴보는 것이 중요합니다.",
    ],
    blue: [
      "지금은 외부 자극보다 자신만의 리듬을 지켜가는 것이 중요합니다.",
      "신뢰는 스스로를 믿는 것에서 시작됩니다. 오늘의 선택을 믿어보세요.",
      "내면의 질서를 되찾는 것이 지금의 가장 중요한 회복입니다.",
      "조급함보다 일관된 리듬이 지금 당신에게 더 필요한 에너지입니다.",
    ],
    purple: [
      "작은 감정 하나를 가볍게 넘기지 않을 때 내면의 회복이 더 깊어질 수 있습니다.",
      "지금 느끼는 것을 글로 적어보는 것이 내면 정리에 큰 도움이 됩니다.",
      "깊이 생각하는 것은 강점입니다. 오늘은 그 생각을 잠시 내려두어도 됩니다.",
      "성찰의 시간이 쌓일수록 자신을 더 깊이 이해하게 됩니다.",
    ],
    lavender: [
      "섬세한 감각을 가진 당신에게, 오늘은 자신을 위한 작은 아름다움을 찾아보세요.",
      "감정을 억누르기보다 부드럽게 흘려보내는 연습이 지금의 회복입니다.",
      "억지로 붙잡기보다 편안한 거리감이 도움이 됩니다.",
      "지금의 감정을 판단하지 않고 그대로 바라보는 것이 치유의 시작입니다.",
    ],
    neutral: [
      "조용한 정리가 지금의 회복이 될 수 있습니다.",
      "단순하게 하나씩 정리해 가는 것이 지금 가장 좋은 방향입니다.",
      "오늘은 결과보다 과정을 믿어보세요.",
      "지금의 고요함이 다음 흐름을 준비하는 시간입니다.",
    ],
    cool: [
      "생각을 정리하려 애쓰기보다 마음을 먼저 쉬게 해보세요.",
      "분석보다 느낌을 먼저 따라가 보는 것이 지금의 회복입니다.",
      "지금은 버티는 힘보다 내려놓는 연습이 더 중요할 수 있습니다.",
      "효율보다 리듬을 먼저 되찾는 것이 지금 필요한 방향입니다.",
    ],
  };

  const pool = lines[family] ?? lines['neutral'];
  // 상단에서 이미 '조용한/산책/이완' 사용 시 → 행동/관계/리듬 방향 우선
  // 상단에서 이미 '회복/안정/쉼' 사용 시 → 행동/통찰 방향 우선
  // 상단에서 이미 '기도/묵상' 사용 시 → 생활 루틴/행동 방향 우선
  let idx = 0;
  if (hasQuiet || hasRecover || hasPrayer) {
    // 인덱스 1 이상 (행동/통찰 방향) 우선
    idx = 1 + (Math.abs(colorId.charCodeAt(0) - 97) % (pool.length - 1));
  } else {
    idx = colorId.charCodeAt(0) % pool.length;
  }
  return pool[idx % pool.length];
}

function generateCombinedCoaching(card1: CardData, card2: CardData, card3: CardData, colorFlow?: ColorData[]): string {
  // 문단 1: 1번(내면 흐름) + 2번(현재 상태) 공감 통합 - 간결하게
  const flow1 = toFlowPhrase(card1.energyTitle);
  const curr = toCurrentPhrase(card2.energyTitle);
  const para1 = `${flow1} ${curr}`;

  // 문단 2: 3번(회복 방향) - 짧고 따뜻하게
  const recovery = toRecoveryPhrase(card3.energyTitle);

  // 컬러 성향 흐름이 있을 때만 마지막 공감 문장 추가 (없으면 생략)
  if (colorFlow && colorFlow.length >= 3) {
    const [c1] = colorFlow;
    const usedKeywords = [para1, recovery].join(' ').split(/[.,\s]+/);
    const colorLine = getColorClosingLine(c1.id, usedKeywords);
    return `${para1}\n\n${recovery}\n\n${colorLine}`;
  }

  return `${para1}\n\n${recovery}`;
}

const styles = StyleSheet.create({
  colorFlowSection: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  colorFlowSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  colorFlowSectionSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  colorFlowSectionRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 8,
  },
  colorFlowSectionItem: {
    alignItems: "center",
    gap: 4,
  },
  colorFlowSectionDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  colorFlowSectionName: {
    fontSize: 12,
    fontWeight: "700",
  },
  colorFlowSectionKeyword: {
    fontSize: 11,
  },
  colorFlowSectionDesc: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 60,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  headerProfile: {
    fontSize: 13,
  },
  concernsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  concernBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  concernBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardSummaryRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  cardSummaryItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  cardSummaryBadge: {
    width: 44,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  cardSummarySymbol: {
    fontSize: 22,
    color: "#FFFFFF",
  },
  cardSummaryPosition: {
    fontSize: 10,
    fontWeight: "700",
  },
  cardSummaryName: {
    fontSize: 13,
    fontWeight: "700",
  },
  cardSummaryShape: {
    fontSize: 11,
  },
  cardSummaryEnergy: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
  },
  sectionTitleBar: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 12,
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  cardDetailContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  detailRow: {
    gap: 4,
  },
  pentagonBadge: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 4,
    alignSelf: 'flex-start',
  },
  pentagonBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  detailText: {
    fontSize: 14,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  complementContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  complementDesc: {
    fontSize: 13,
  },
  coachingBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 14,
    gap: 10,
  },
  coachingLabel: {
    fontSize: 14,
    fontWeight: "700",
  },
  coachingText: {
    fontSize: 15,
    lineHeight: 26,
    fontStyle: "italic",
    fontWeight: "500",
  },
  jobCoachingNote: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#8BAF8B33",
  },
  jobCoachingNoteText: {
    fontSize: 13,
    lineHeight: 22,
    fontStyle: "normal",
    fontWeight: "500",
  },
  jobCoachingText: {
    fontSize: 13,
    lineHeight: 22,
    fontStyle: "normal",
    fontWeight: "500",
  },
  scriptureBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D4B896',
    backgroundColor: '#FDF6EC',
    paddingHorizontal: 18,
    paddingVertical: 14,
    marginBottom: 12,
    gap: 6,
    alignItems: 'center',
  },
  scriptureLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  scriptureText: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  scriptureRef: {
    fontSize: 12,
    fontWeight: '400',
  },
  shareButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 28,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "600",
  },
  coachingSection: {
    gap: 10,
    marginBottom: 20,
  },
  coachingSectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 30,
  },
  coachingSectionSub: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  coachingLinkBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  coachingLinkInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coachingLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  coachingLinkIconText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  coachingLinkTexts: {
    flex: 1,
    gap: 2,
  },
  coachingLinkTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  coachingLinkDesc: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  coachingLinkArrow: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  retryButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
  },
  retryButtonText: {
    fontSize: 14,
    color: '#888',
  },
  archetypeSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  archetypeSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  archetypeSectionSub: {
    fontSize: 13,
    marginBottom: 16,
  },
  archetypeCard: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 14,
    marginBottom: 12,
  },
  archetypeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  archetypeIndexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archetypeIndexText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  archetypeLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  archetypeCoreEnergy: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
  },
  archetypeDetail: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  archetypeDirection: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 20,
  },
  archetypeCoachingBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
    marginTop: 4,
  },
  archetypeCoachingText: {
    fontSize: 14,
    lineHeight: 22,
  },
  dailyPracticeCard: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  dailyPracticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dailyPracticeLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  dailyPracticeText: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  energyFlowSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  energyFlowTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  energyFlowSub: {
    fontSize: 13,
    marginBottom: 14,
  },
  energyFlowTitleBadge: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  energyFlowTitleBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  energyFlowDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  energyFlowRecoveryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  energyFlowRecoveryLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  energyFlowRecoveryText: {
    fontSize: 14,
    lineHeight: 22,
  },
  energyFlowKeywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  energyFlowKeywordTag: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  energyFlowKeywordText: {
    fontSize: 12,
    fontWeight: '600',
  },
  wellnessSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  wellnessSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  wellnessSectionSub: {
    fontSize: 13,
    marginBottom: 16,
    lineHeight: 18,
  },
  wellnessRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  wellnessIcon: {
    fontSize: 22,
    marginRight: 12,
    marginTop: 2,
  },
  wellnessContent: {
    flex: 1,
  },
  wellnessLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  wellnessValue: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  wellnessDivider: {
    height: 1,
    backgroundColor: '#E8D5B055',
    marginVertical: 2,
  },
  wellnessRoutineItem: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400',
  },
  jobRoutineNote: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8D5B0',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    padding: 12,
  },
  jobRoutineText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
  // 체험 중/만료 배너
  trialBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 8,
    alignItems: 'center',
  },
  trialBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  trialBannerDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  trialBannerBtn: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  trialBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // 후기 섹션 스타일
  reviewSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 12,
    gap: 16,
  },
  reviewClosingText: {
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
  },
  reviewAskText: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  reviewDoneBox: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  reviewDoneIcon: {
    fontSize: 28,
  },
  reviewDoneText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  reviewDoneSub: {
    fontSize: 13,
    textAlign: 'center',
  },
  reviewForm: {
    gap: 12,
  },
  reviewStarRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reviewStarBtn: {
    padding: 4,
  },
  reviewStarText: {
    fontSize: 32,
  },
  reviewTagLabel: {
    fontSize: 13,
    textAlign: 'center',
  },
  reviewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  reviewTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  reviewTagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  reviewInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  reviewSubmitBtn: {
    paddingVertical: 13,
    borderRadius: 24,
    alignItems: 'center',
  },
  reviewSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  reviewEditBtn: {
    marginTop: 10,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  reviewEditBtnText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  contextualRoutineSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  contextualRoutineTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  contextualRoutineSub: {
    fontSize: 13,
    marginBottom: 14,
    lineHeight: 18,
  },
  contextualRoutineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 6,
  },
  contextualRoutineDot: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '700',
  },
  contextualRoutineText: {
    fontSize: 14,
    lineHeight: 21,
    flex: 1,
  },
  contextualRoutineCoachingBox: {
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  contextualRoutineCoachingText: {
    fontSize: 14,
    lineHeight: 21,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
