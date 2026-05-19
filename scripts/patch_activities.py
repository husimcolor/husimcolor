#!/usr/bin/env python3
"""
buildActivities 함수 내 comboActivities 맵을 관계 유형별로 분리하는 패치 스크립트.
- 연인/부부: 감정 교류, 데이트, 음악, 요리, 드라이브 등 친밀한 활동
- 친구/형제자매: 산책, 카페, 취미 공유, 음식, 보드게임 등
- 동료: 티타임, 가벼운 식사, 짧은 대화, 산책, 협업 루틴 중심
"""

import re

path = '/home/ubuntu/hyusim-color/constants/coupleData.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 기존 buildActivities 함수 전체를 새 버전으로 교체
old_func_start = 'function buildActivities(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string[] {'
old_func_end = '  return base.slice(0, 4);\n}'

# 함수 시작/끝 위치 찾기
start_idx = content.find(old_func_start)
if start_idx == -1:
    print("ERROR: buildActivities 함수를 찾을 수 없습니다.")
    exit(1)

# 함수 끝 위치 찾기 (return base.slice(0, 4);\n} 이후)
end_marker = '  return base.slice(0, 4);\n}'
end_idx = content.find(end_marker, start_idx)
if end_idx == -1:
    print("ERROR: 함수 끝을 찾을 수 없습니다.")
    exit(1)

end_idx += len(end_marker)

new_func = '''function buildActivities(fA: EnergyFamily, fB: EnergyFamily, rel: RelationType): string[] {
  const isCouple = rel === '연인' || rel === '부부';
  const isFriend = rel === '친구' || rel === '형제자매';
  const isColleague = rel === '동료';

  // 에너지 조합별 특화 활동 — 관계 유형별 분기
  const key = `${fA}-${fB}`;

  // ── 동료 관계 전용 활동 ──────────────────────────────────────────────
  if (isColleague) {
    const colleagueActivities: Partial<Record<string, string[]>> = {
      'warm_active-warm_active': [
        '점심 식사 후 짧은 산책하기',
        '새로운 카페에서 티타임 갖기',
        '업무 외 가벼운 대화 나누기',
        '팀 점심 식사 함께하기',
      ],
      'warm_active-cool_deep': [
        '점심 식사 후 짧은 산책하기',
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 아이디어 가볍게 나누기',
        '팀 점심 식사 함께하기',
      ],
      'cool_deep-warm_active': [
        '점심 식사 후 짧은 산책하기',
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 아이디어 가볍게 나누기',
        '팀 점심 식사 함께하기',
      ],
      'warm_soft-cool_clear': [
        '티타임이나 커피 한 잔 나누기',
        '가벼운 점심 식사 함께하기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
      'cool_clear-warm_soft': [
        '티타임이나 커피 한 잔 나누기',
        '가벼운 점심 식사 함께하기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
      'cool_deep-cool_deep': [
        '조용한 카페에서 커피 한 잔 나누기',
        '업무 관련 깊은 대화 나누기',
        '점심 식사 후 짧은 산책하기',
        '함께 세미나나 강의 듣기',
      ],
      'warm_grounded-warm_grounded': [
        '점심 식사 함께하기',
        '티타임이나 커피 한 잔 나누기',
        '업무 외 짧은 대화 나누기',
        '팀 회의 후 간식 나누기',
      ],
    };
    const collegeAct = colleagueActivities[key] ?? colleagueActivities[`${fB}-${fA}`];
    if (collegeAct) return collegeAct.slice(0, 4);
    // 동료 기본 폴백
    return [
      '점심 식사 후 짧은 산책하기',
      '티타임이나 커피 한 잔 나누기',
      '업무 외 가벼운 대화 나누기',
      '팀 점심 식사 함께하기',
    ];
  }

  // ── 친구 / 형제자매 관계 전용 활동 ──────────────────────────────────
  if (isFriend) {
    const friendActivities: Partial<Record<string, string[]>> = {
      'warm_active-warm_active': [
        '새로운 음식점 함께 탐방하기',
        '함께 운동하거나 스포츠 즐기기',
        '주말 당일치기 여행 계획하기',
        '공원에서 피크닉 즐기기',
      ],
      'warm_active-cool_deep': [
        '가벼운 산책 후 카페에서 대화 나누기',
        '함께 영화 보고 각자 느낀 점 나누기',
        '새로운 음식점 함께 탐방하기',
        '저녁 산책 후 따뜻한 음료 나누기',
      ],
      'cool_deep-warm_active': [
        '가벼운 산책 후 카페에서 대화 나누기',
        '함께 영화 보고 각자 느낀 점 나누기',
        '새로운 음식점 함께 탐방하기',
        '저녁 산책 후 따뜻한 음료 나누기',
      ],
      'warm_soft-cool_clear': [
        '카페에서 차 한 잔 나누며 이야기하기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
        '함께 보드게임이나 퍼즐 즐기기',
        '소품 가게나 서점 함께 구경하기',
      ],
      'cool_clear-warm_soft': [
        '카페에서 차 한 잔 나누며 이야기하기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
        '함께 보드게임이나 퍼즐 즐기기',
        '소품 가게나 서점 함께 구경하기',
      ],
      'cool_deep-cool_deep': [
        '조용한 카페에서 각자 독서하거나 작업하기',
        '전시회나 미술관 함께 방문하기',
        '깊은 주제로 대화하는 시간 갖기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
      'nature-nature': [
        '자연 속 산책 (공원, 숲길, 강변)',
        '식물 가꾸기나 정원 산책',
        '공원에서 피크닉 즐기기',
        '따뜻한 음료 마시며 조용한 시간 보내기',
      ],
      'warm_grounded-warm_grounded': [
        '단골 카페에서 차 나누기',
        '함께 영화 보거나 드라마 정주행하기',
        '함께 요리하거나 식사 준비하기',
        '가벼운 산책 후 식사 즐기기',
      ],
      'warm_soft-warm_soft': [
        '따뜻한 음료 마시며 서로의 이야기 나누기',
        '꽃 시장이나 소품 가게 함께 구경하기',
        '감성적인 영화 보고 감상 나누기',
        '서로의 플레이리스트 공유하고 음악 감상하기',
      ],
    };
    const friendAct = friendActivities[key] ?? friendActivities[`${fB}-${fA}`];
    if (friendAct) return friendAct.slice(0, 4);
    // 친구/형제자매 기본 폴백
    const friendBase: string[] = [];
    if (fA === 'warm_active' || fB === 'warm_active') {
      friendBase.push('새로운 음식점 함께 탐방하기');
      friendBase.push('함께 운동하거나 스포츠 즐기기');
      friendBase.push('공원에서 피크닉 즐기기');
      friendBase.push('주말 당일치기 여행 계획하기');
    } else if (fA === 'cool_deep' || fB === 'cool_deep') {
      friendBase.push('조용한 카페에서 각자 독서하거나 작업하기');
      friendBase.push('전시회나 미술관 함께 방문하기');
      friendBase.push('서로의 플레이리스트 공유하고 음악 감상하기');
      friendBase.push('가벼운 산책 후 카페에서 대화 나누기');
    } else if (fA === 'nature' || fB === 'nature') {
      friendBase.push('자연 속 산책 (공원, 숲길, 강변)');
      friendBase.push('공원에서 피크닉 즐기기');
      friendBase.push('따뜻한 음료 마시며 조용한 시간 보내기');
      friendBase.push('식물 가꾸기나 정원 산책');
    } else {
      friendBase.push('카페에서 차 한 잔 나누며 이야기하기');
      friendBase.push('함께 보드게임이나 퍼즐 즐기기');
      friendBase.push('서로의 플레이리스트 공유하고 음악 감상하기');
      friendBase.push('가벼운 산책 후 식사 즐기기');
    }
    return friendBase.slice(0, 4);
  }

  // ── 연인 / 부부 관계 활동 (기존 comboActivities 유지) ────────────────
  const comboActivities: Partial<Record<string, string[]>> = {
    'warm_active-warm_active': [
      '함께 달리기나 자전거 타기',
      '새로운 음식점 탐방하기',
      '함께 운동하거나 스트레칭 루틴 만들기',
      '주말 드라이브나 당일치기 여행 계획하기',
    ],
    'warm_active-cool_deep': [
      '가벼운 산책 후 조용한 카페에서 대화 나누기',
      '함께 영화 보고 각자 느낀 점 나누기',
      '한 사람이 활동을 제안하고 다른 사람이 장소를 고르기',
      '드라이브하며 음악 함께 듣기',
    ],
    'cool_deep-warm_active': [
      '가벼운 산책 후 조용한 카페에서 대화 나누기',
      '함께 영화 보고 각자 느낀 점 나누기',
      '한 사람이 활동을 제안하고 다른 사람이 장소를 고르기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_soft-cool_clear': [
      '함께 요리하거나 식사 준비하기',
      '조용한 카페에서 차 한 잔 나누기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '함께 영화 보거나 드라마 정주행하기',
    ],
    'cool_clear-warm_soft': [
      '함께 요리하거나 식사 준비하기',
      '조용한 카페에서 차 한 잔 나누기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '함께 영화 보거나 드라마 정주행하기',
    ],
    'cool_deep-cool_deep': [
      '조용한 카페에서 책 읽거나 각자 작업하기',
      '전시회나 미술관 함께 방문하기',
      '조용한 음악 틀어놓고 각자 하고 싶은 것 하기',
      '깊은 주제로 대화하는 시간 갖기',
    ],
    'nature-nature': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '식물 가꾸기나 정원 가꾸기',
      '함께 텃밭 가꾸거나 꽃 심기',
      '조용한 카페에서 차 한 잔 나누기',
    ],
    'nature-warm_active': [
      '자연 속 가벼운 하이킹이나 산책',
      '공원에서 피크닉 즐기기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 따뜻한 음료 나누기',
    ],
    'warm_active-nature': [
      '자연 속 가벼운 하이킹이나 산책',
      '공원에서 피크닉 즐기기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 따뜻한 음료 나누기',
    ],
    'warm_grounded-warm_grounded': [
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
      '함께 영화 보거나 드라마 정주행하기',
      '주말 아침 함께 시장 보러 가기',
    ],
    'warm_soft-warm_soft': [
      '따뜻한 음료 마시며 서로의 이야기 나누기',
      '함께 요리하거나 베이킹하기',
      '꽃 시장이나 소품 가게 함께 구경하기',
      '감성적인 영화 보고 감상 나누기',
    ],
    'warm_active-warm_soft': [
      '가벼운 산책 후 따뜻한 카페에서 시간 보내기',
      '새로운 음식점 함께 탐방하기',
      '함께 요리하거나 식사 준비하기',
      '드라이브 후 영화 보기',
    ],
    'warm_grounded-cool_deep': [
      '조용한 카페에서 각자 독서하거나 작업하기',
      '전시회나 미술관 함께 방문하기',
      '함께 요리하거나 식사 준비하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_grounded-cool_clear': [
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
      '주말 아침 함께 시장 보러 가기',
      '함께 영화 보거나 드라마 정주행하기',
    ],
    'warm_soft-cool_deep': [
      '조용한 카페에서 각자 원하는 것 하기',
      '전시회나 미술관 함께 방문하기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_soft-warm_grounded': [
      '따뜻한 음료 마시며 서로의 이야기 나누기',
      '함께 요리하거나 브런치 즐기기',
      '집 근처 단골 카페에서 조용한 시간 보내기',
      '주말 아침 함께 시장 보러 가기',
    ],
    'cool_clear-cool_deep': [
      '조용한 카페에서 각자 작업하거나 독서하기',
      '전시회나 미술관 함께 방문하기',
      '깊은 주제로 대화하는 시간 갖기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
    ],
    'cool_clear-cool_clear': [
      '새로운 주제로 함께 공부하거나 강의 듣기',
      '조용한 카페에서 각자 작업하기',
      '서로의 관심사를 공유하고 대화하기',
      '함께 요리하거나 식사 준비하기',
    ],
    'nature-warm_soft': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '따뜻한 음료 마시며 조용한 시간 보내기',
      '식물 가꾸기나 정원 가꾸기',
      '함께 요리하거나 브런치 즐기기',
    ],
    'nature-cool_deep': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '조용한 카페에서 각자 원하는 것 하기',
      '전시회나 미술관 함께 방문하기',
      '서로의 플레이리스트 공유하고 음악 감상하기',
    ],
    'nature-cool_clear': [
      '자연 속 산책 (공원, 숲길, 강변)',
      '조용한 카페에서 각자 작업하거나 독서하기',
      '함께 요리하거나 식사 준비하기',
      '드라이브하며 음악 함께 듣기',
    ],
    'warm_grounded-warm_active': [
      '가벼운 산책 후 식사 즐기기',
      '주말 드라이브나 당일치기 여행 계획하기',
      '함께 요리하거나 식사 준비하기',
      '집 근처 단골 카페에서 차 나누기',
    ],
  };

  const activities = comboActivities[key] ?? comboActivities[`${fB}-${fA}`];
  if (activities) return activities.slice(0, 4);

  // 기본 활동 (연인/부부, 조합 미매핑 시) — 계열별 세분화
  const base: string[] = [];

  if (fA === 'warm_active' || fB === 'warm_active') {
    base.push('가벼운 산책이나 조깅 함께하기');
    base.push('새로운 음식점 함께 탐방하기');
    base.push('주말 드라이브나 당일치기 여행 계획하기');
    base.push('공원에서 피크닉 즐기기');
  } else if (fA === 'cool_deep' || fB === 'cool_deep') {
    base.push('조용한 카페에서 각자 독서하거나 작업하기');
    base.push('전시회나 미술관 함께 방문하기');
    base.push('서로의 플레이리스트 공유하고 음악 감상하기');
    base.push('드라이브하며 음악 함께 듣기');
  } else if (fA === 'cool_clear' || fB === 'cool_clear') {
    base.push('새로운 주제로 함께 공부하거나 강의 듣기');
    base.push('조용한 카페에서 차 한 잔 나누기');
    base.push('함께 요리하거나 식사 준비하기');
    base.push('서로의 관심사를 공유하고 대화하기');
  } else if (fA === 'nature' || fB === 'nature') {
    base.push('자연 속 산책 (공원, 숲길, 강변)');
    base.push('식물 가꾸기나 정원 가꾸기');
    base.push('따뜻한 음료 마시며 조용한 시간 보내기');
    base.push('함께 요리하거나 브런치 즐기기');
  } else if (fA === 'warm_soft' || fB === 'warm_soft') {
    base.push('따뜻한 음료 마시며 서로의 이야기 나누기');
    base.push('꽃 시장이나 소품 가게 함께 구경하기');
    base.push('감성적인 영화 보고 감상 나누기');
    base.push('함께 베이킹하거나 요리하기');
  } else {
    base.push('조용한 카페에서 차 한 잔 나누기');
    base.push('자연 속 산책 (공원, 숲길, 강변)');
    base.push('함께 요리하거나 식사 준비하기');
    base.push('드라이브하며 음악 함께 듣기');
  }
  return base.slice(0, 4);
}'''

new_content = content[:start_idx] + new_func + content[end_idx:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("buildActivities 함수 교체 완료")
print(f"원본 길이: {len(content)}, 새 길이: {len(new_content)}")
