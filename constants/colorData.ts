export type GlowStyle = 'metallic' | 'matte' | 'luminous' | 'misty' | 'creamy' | 'natural' | 'radiant';

export interface ColorData {
  id: string;
  name: string;
  korName: string;
  hex: string;
  /** 광택/투명감 스타일 유형 */
  glowStyle: GlowStyle;
  /** 하이라이트 오버레이 색상 (rgba) */
  highlightColor: string;
  /** 반사광 강도 0-1 */
  glowIntensity: number;
  keywords: string[];
  /** 회복 방향 키워드 (짧은 표현) */
  recovery: string;
  complementColors: string[];
  strengths: string[];
  shadows: string[];
  /**
   * 1번 카드 위치 해석 (무의식 / 내면 흐름)
   * "이 색이 무의식에 있다는 것은 어떤 의미인가?"
   * 기준: 깊은 감정, 반복 패턴, 내면 욕구 중심
   */
  reading1: string;
  /**
   * 2번 카드 위치 해석 (현재 상태 / 심리 흐름)
   * "지금 이 순간 이 색이 드러난다는 것은 어떤 의미인가?"
   * 기준: 현재 감정, 관계 반응, 에너지 사용 방식 중심
   */
  reading2: string;
  /**
   * 3번 카드 위치 해석 (회복 방향 / 필요한 에너지)
   * "이 색이 회복 방향으로 나타났다는 것은 어떤 의미인가?"
   * 기준: 이 컬러 고유의 회복 에너지, 감정 정리 방향, 필요한 흐름
   * ※ 코칭 메시지(짧은 한 마디)와 다르게, 회복 에너지의 방향과 성질을 설명
   */
  reading3: string;
  /**
   * 코칭 메시지 후보 (3번 카드 기반 짧은 문장들)
   * generateCoachingMessage에서 조합에 따라 선택
   */
  recoveryMessages: string[];
}

export const COLOR_DATA: ColorData[] = [
  {
    id: 'red',
    name: 'RED',
    korName: '레드',
    hex: '#CC1A1A',
    glowStyle: 'metallic',
    highlightColor: 'rgba(255,160,160,0.45)',
    glowIntensity: 0.58,
    keywords: ['열정', '긴장', '추진력'],
    recovery: '안정과 휴식',
    complementColors: ['그린', '화이트'],
    strengths: ['추진력', '열정', '용기', '집중력'],
    shadows: ['에너지 과소비', '감정 안으로 담기', '쉼 찾는 흐름'],
    reading1: '무의식 깊은 곳에서 강한 에너지가 쉬지 않고 흐르고 있습니다.\n멈추지 않으려는 힘이 반복적으로 작동하는 내면 패턴이 있습니다.\n오랫동안 스스로를 채찍질해온 흔적이 내면에 남아 있습니다.',
    reading2: '지금 겉으로는 강하게 달리고 있지만,\n그 안에는 쉬고 싶은 마음이 조용히 쌓여 있습니다.\n관계나 일 속에서 에너지를 많이 소진하고 있는 상태입니다.',
    reading3: '레드가 회복 방향으로 나타났을 때는,\n지금 당신에게 다시 불꽃 같은 에너지와 추진력이 필요하다는 신호입니다.\n오래 억눌러온 열정을 조금씩 다시 깨워가는 시간이 필요합니다.',
    recoveryMessages: [
      '지쳐있던 마음에\n다시 작은 불꽃을 켜볼 시간입니다.',
      '억눌러왔던 에너지를\n천천히 다시 깨워보세요.',
      '멈춰 있던 열정을\n조금씩 되살려가도 됩니다.',
    ],
  },
  {
    id: 'orange',
    name: 'ORANGE',
    korName: '오렌지',
    hex: '#F0874A',
    glowStyle: 'luminous',
    highlightColor: 'rgba(255,220,160,0.35)',
    glowIntensity: 0.45,
    keywords: ['활력', '창의성', '사교성'],
    recovery: '따뜻한 연결',
    complementColors: ['블루', '인디고'],
    strengths: ['창의성', '활력', '따뜻한 사교성', '유머'],
    shadows: ['자신을 뒤로 미루는 흐름', '마음 피로', '생각 확장 흐름'],
    reading1: '내면 깊은 곳에서 연결과 표현을 향한 욕구가 반복적으로 올라옵니다.\n관계 속에서 에너지를 얻고 싶은 마음이 무의식에 자리하고 있습니다.\n따뜻한 연결 속에서 안정을 찾으려는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 밝고 활기찬 에너지로 주변을 채우고 있지만,\n그 이면에서는 자신을 돌볼 여유가 부족한 상태입니다.\n관계 속에서 많이 소진되고 있는 시기입니다.',
    reading3: '오렌지가 회복 방향으로 나타났을 때는,\n따뜻한 관계와 생기 있는 표현이 지금 당신에게 필요한 에너지라는 신호입니다.\n조용히 닫혀 있던 마음을 천천히 열고, 작은 연결에서 생기를 되찾아 가세요.',
    recoveryMessages: [
      '혼자 머물러 있던 마음에\n다시 따뜻한 연결이 필요합니다.',
      '작은 웃음과 가벼운 만남이\n지금의 회복 에너지가 될 수 있습니다.',
      '조용히 닫혀 있던 마음을\n천천히 다시 열어보세요.',
    ],
  },
  {
    id: 'yellow',
    name: 'YELLOW',
    korName: '옐로우',
    hex: '#F0C040',
    glowStyle: 'luminous',
    highlightColor: 'rgba(255,245,180,0.4)',
    glowIntensity: 0.5,
    keywords: ['생각', '희망', '소통'],
    recovery: '마음 안정',
    complementColors: ['올리브', '베이지'],
    strengths: ['창의적 사고', '희망', '소통력', '긍정성'],
    shadows: ['생각 확장 흐름', '마음 흔들림', '생각 과몰입'],
    reading1: '무의식에서 희망과 소통을 향한 욕구가 조용히 흐르고 있습니다.\n생각이 많아지는 패턴이 오랫동안 내면에 자리하고 있습니다.\n변화 속에서도 마음의 균형을 찾으려는 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 많은 생각과 아이디어가 흐르고 있지만,\n그 분주함 속에서 마음이 쉬지 못하고 있습니다.\n소통을 원하면서도 마음은 안정과 회복을 함께 원하고 있습니다.',
    reading3: '옐로우가 회복 방향으로 나타났을 때는,\n분주한 생각들을 내려놓고 마음의 안정을 찾는 것이 필요한 에너지라는 신호입니다.\n조용히 앉아 자신의 내면을 바라보는 시간이 지금 당신에게 필요합니다.',
    recoveryMessages: [
      '분주한 생각들을 잠시 내려놓고,\n마음이 쉴 수 있는 고요한 시간을 가져보세요.',
      '생각보다 느낌을 따라가 보세요.\n지금 당신에게 필요한 것은 마음의 안정입니다.',
      '머릿속의 소음을 잠시 멈추고,\n조용히 자신 안으로 들어가 보세요.',
    ],
  },
  {
    id: 'green',
    name: 'GREEN',
    korName: '그린',
    hex: '#6BAF7A',
    glowStyle: 'natural',
    highlightColor: 'rgba(180,230,180,0.3)',
    glowIntensity: 0.35,
    keywords: ['회복', '균형', '성장'],
    recovery: '균형 회복',
    complementColors: ['골드', '오렌지'],
    strengths: ['회복력', '균형감', '성장', '안정성'],
    shadows: ['목소리 작아지는 흐름', '배려 우선 흐름', '감정 안으로 담기'],
    reading1: '무의식에서 회복과 균형을 향한 욕구가 깊이 흐르고 있습니다.\n자연스럽게 흐르고 싶은 패턴이 오랫동안 내면에 자리하고 있습니다.\n스스로를 치유하려는 에너지가 조용히 이어지고 있습니다.',
    reading2: '지금 회복과 균형을 찾으려는 에너지가 흐르고 있습니다.\n성장을 원하지만 자신의 감정을 표현하는 것이 어색한 시기입니다.\n안정을 추구하지만 자신의 목소리가 작아지고 있습니다.',
    reading3: '그린이 회복 방향으로 나타났을 때는,\n균형과 자연스러운 회복의 에너지가 지금 당신에게 필요하다는 신호입니다.\n억지로 무언가를 하려 하지 말고, 자연스럽게 흐르는 회복의 흐름에 몸을 맡겨보세요.',
    recoveryMessages: [
      '자연스러운 회복의 흐름에\n조용히 몸을 맡겨보세요.',
      '균형을 찾는 것이\n지금 가장 필요한 에너지입니다.',
      '억지로 하지 않아도 됩니다.\n자연스럽게 회복되는 시간을 허락해 주세요.',
    ],
  },
  {
    id: 'blue',
    name: 'BLUE',
    korName: '블루',
    hex: '#5A7EC4',
    glowStyle: 'matte',
    highlightColor: 'rgba(180,210,255,0.3)',
    glowIntensity: 0.35,
    keywords: ['책임감', '신뢰', '침묵'],
    recovery: '감정 표현',
    complementColors: ['핑크', '터콰이즈'],
    strengths: ['책임감', '신뢰감', '집중력', '침착함'],
    shadows: ['감정 안으로 담기', '에너지 과소비', '연결 그리움'],
    reading1: '무의식에서 책임감과 신뢰를 향한 욕구가 깊이 자리하고 있습니다.\n혼자 감당하려는 패턴이 오랫동안 내면에 이어지고 있습니다.\n감정을 안으로 담아두며 조용히 정리하려는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 책임감 있게 살아가고 있지만,\n내면에는 감정을 표현하지 못하는 답답함이 쌓여 있습니다.\n신뢰받고 싶지만 자신의 감정은 침묵 속에 담아두고 있습니다.',
    reading3: '블루가 회복 방향으로 나타났을 때는,\n감정을 안으로만 담아두지 않고 조금씩 표현하는 것이 필요한 에너지라는 신호입니다.\n책임감 있게 살아온 당신이 이제는 자신의 감정을 조용히 들여다봐야 할 시간입니다.',
    recoveryMessages: [
      '안으로만 담아왔던 감정을\n조금씩 꺼내어 표현해 보세요.',
      '책임감 있게 살아온 당신,\n이제는 자신의 감정을 돌볼 시간입니다.',
      '침묵 속에 담아온 마음을\n따뜻하게 표현해도 됩니다.',
    ],
  },
  {
    id: 'indigo',
    name: 'INDIGO',
    korName: '인디고',
    hex: '#4A5A9A',
    glowStyle: 'misty',
    highlightColor: 'rgba(160,170,230,0.35)',
    glowIntensity: 0.4,
    keywords: ['직관', '탐구', '깊이'],
    recovery: '내면 통찰',
    complementColors: ['오렌지', '골드'],
    strengths: ['직관력', '깊이 있는 사고', '탐구심', '통찰'],
    shadows: ['생각 과몰입', '감정 내면화', '혼자 정리하는 흐름'],
    reading1: '무의식에서 깊은 탐구와 직관을 향한 욕구가 조용히 흐르고 있습니다.\n내면 세계에 머물고 싶은 패턴이 오랫동안 자리하고 있습니다.\n감정을 혼자 안으로 담아두고 생각으로 정리하려는 흐름이 이어지고 있습니다.',
    reading2: '지금 깊은 사고와 탐구 속에 머물러 있습니다.\n생각이 많아지면서 감정은 안으로 담아두는 시간이 길어지고 있습니다.\n내면이 풍부하지만, 그 풍부함이 주변과의 연결을 점점 멀어지게 만들고 있습니다.',
    reading3: '인디고가 회복 방향으로 나타났을 때는,\n깊은 직관과 통찰의 에너지가 지금 당신에게 필요하다는 신호입니다.\n내면의 깊은 목소리에 귀 기울이고, 그 지혜를 현실과 연결하는 시간이 필요합니다.',
    recoveryMessages: [
      '내면의 깊은 목소리에\n조용히 귀 기울여 보세요.',
      '직관이 이끄는 방향을\n신뢰해도 됩니다.',
      '깊은 통찰이 지금\n당신에게 필요한 에너지입니다.',
    ],
  },
  {
    id: 'violet',
    name: 'VIOLET',
    korName: '바이올렛',
    hex: '#8A5AC4',
    glowStyle: 'misty',
    highlightColor: 'rgba(200,170,240,0.4)',
    glowIntensity: 0.45,
    keywords: ['영성', '변화', '이상'],
    recovery: '현실 수용',
    complementColors: ['골드', '옐로우'],
    strengths: ['이상 추구', '변화 주도', '영성', '창의성'],
    shadows: ['이상과 현실 사이 흔들림', '내면 집중 흐름', '마음 흔들림'],
    reading1: '무의식에서 변화와 더 높은 것을 향한 열망이 깊이 흐르고 있습니다.\n이상적인 것을 추구하는 패턴이 오랫동안 내면에 자리하고 있습니다.\n현실이 이상에 미치지 못할 때 내면에서 갈등이 조용히 이어지고 있습니다.',
    reading2: '지금 변화와 성장을 향한 열망이 있지만,\n이상과 현실 사이에서 마음이 흔들리는 시기입니다.\n새로운 시작을 원하지만, 마음은 아직 천천히 자신만의 방향을 찾고 있습니다.',
    reading3: '바이올렛이 회복 방향으로 나타났을 때는,\n지금 있는 현실을 따뜻하게 받아들이는 것이 필요한 에너지라는 신호입니다.\n완벽하지 않아도, 지금 이 순간도 충분히 의미 있다는 것을 느껴보세요.',
    recoveryMessages: [
      '지금 있는 그대로도\n충분히 아름답습니다.',
      '이상을 잠시 내려놓고,\n지금 이 순간을 따뜻하게 바라봐 주세요.',
      '완벽하지 않아도 됩니다.\n지금 여기에 있는 것으로 충분합니다.',
    ],
  },
  {
    id: 'pink',
    name: 'PINK',
    korName: '핑크',
    hex: '#E8849A',
    glowStyle: 'creamy',
    highlightColor: 'rgba(255,200,220,0.4)',
    glowIntensity: 0.45,
    keywords: ['따뜻함', '배려', '감성'],
    recovery: '자존감 회복',
    complementColors: ['골드', '코랄'],
    strengths: ['따뜻함', '공감능력', '배려', '감성'],
    shadows: ['자신을 뒤로 미루는 흐름', '자기 확신 부족', '마음 피로'],
    reading1: '무의식 깊은 곳에서 사랑받고 싶고 연결되고 싶은 욕구가 조용히 흐르고 있습니다.\n타인을 먼저 배려하는 패턴이 오랫동안 내면에 자리하고 있습니다.\n자신의 필요보다 타인의 필요를 먼저 채우는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 타인을 위해 많은 에너지를 쏟고 있습니다.\n내면 깊은 곳에서는 자신도 돌봄을 받고 싶은 마음이 있습니다.\n감성적으로 풍부하지만 자신을 소홀히 하는 시기입니다.',
    reading3: '핑크가 회복 방향으로 나타났을 때는,\n자신을 향한 따뜻한 시선과 자존감 회복이 필요한 에너지라는 신호입니다.\n타인에게 쏟아온 그 따뜻함을 이제는 자신에게 돌려주는 시간이 필요합니다.',
    recoveryMessages: [
      '지금 당신에게 필요한 것은\n자신을 향한 따뜻한 시선입니다.',
      '타인에게 쏟아온 배려를\n이제는 자신에게 돌려주세요.',
      '당신은 충분히 사랑받을 자격이 있습니다.',
    ],
  },
  {
    id: 'magenta',
    name: 'MAGENTA',
    korName: '마젠타',
    hex: '#C2478A',
    glowStyle: 'radiant',
    highlightColor: 'rgba(255,160,210,0.4)',
    glowIntensity: 0.45,
    keywords: ['열정', '변화', '강렬함'],
    recovery: '열정 회복',
    complementColors: ['그린', '민트'],
    strengths: ['열정', '변화 주도', '강인함', '창의성'],
    shadows: ['감정 기복 흐름', '내면 균형 찾기', '방향 탐색 중'],
    reading1: '무의식에서 강렬한 변화를 향한 충동이 깊이 흐르고 있습니다.\n무언가를 바꾸고 싶은 강한 에너지가 내면에서 끊임없이 올라오고 있습니다.\n감정의 기복이 내면 에너지를 재정렬하려는 흐름으로 이어지고 있습니다.',
    reading2: '지금 강렬한 에너지와 변화를 향한 열망이 마음 안에서 살아 움직이고 있습니다.\n그 강렬함이 내면을 흔들리기도 하지만, 동시에 자기 존재감을 되살리려는 흐름이기도 합니다.\n억눌려 있던 감정이 다시 살아나려는 시기입니다.',
    reading3: '마젠타가 회복 방향으로 나타났을 때는,\n억눌려 있던 감정 에너지를 건강하게 되살리는 흐름이 필요하다는 신호입니다.\n자기 존재감을 회복하고, 내 안의 열정과 생명력을 다시 느껴보세요.',
    recoveryMessages: [
      '억눌려 있던 감정을 건강하게 꺼내보세요.\n내 안의 열정과 생명력이 다시 살아납니다.',
      '자기 존재감을 회복하는 것이\n지금 가장 필요한 흐름입니다.',
      '감정을 재정렬하고 내면의 에너지를 활성화하는 시간,\n지금이 바로 그 시작입니다.',
    ],
  },
  {
    id: 'coral',
    name: 'CORAL',
    korName: '코랄',
    hex: '#E8735A',
    glowStyle: 'radiant',
    highlightColor: 'rgba(255,190,170,0.4)',
    glowIntensity: 0.45,
    keywords: ['활기', '온기', '소통'],
    recovery: '자기 돌봄',
    complementColors: ['틸', '세이지그린'],
    strengths: ['활기', '온기', '소통력', '친화력'],
    shadows: ['자기 돌봄 찾는 흐름', '마음 피로', '경계 찾는 흐름'],
    reading1: '무의식에서 따뜻한 연결과 소통을 향한 욕구가 조용히 흐르고 있습니다.\n관계 속에서 에너지를 나누는 패턴이 오랫동안 내면에 자리하고 있습니다.\n자신의 경계를 지키는 것이 어색한 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 활기차고 따뜻한 에너지로 관계 속에서 살아가고 있습니다.\n하지만 그 과정에서 자신을 돌보는 시간이 부족한 상태입니다.\n많이 나누어왔지만 정작 자신은 비어가고 있습니다.',
    reading3: '코랄이 회복 방향으로 나타났을 때는,\n자신을 위한 조용한 돌봄의 에너지가 필요하다는 신호입니다.\n충분히 나누어왔습니다. 이제는 자신을 채우는 따뜻한 시간이 필요합니다.',
    recoveryMessages: [
      '지금은 타인보다 자신을 먼저 돌볼 시간입니다.',
      '자신을 위한 작은 돌봄이\n가장 큰 회복의 시작이 됩니다.',
      '충분히 나누어왔습니다.\n이제는 자신을 채우는 시간을 가져보세요.',
    ],
  },
  {
    id: 'gold',
    name: 'GOLD',
    korName: '골드',
    hex: '#C4A832',
    glowStyle: 'metallic',
    highlightColor: 'rgba(255,235,140,0.45)',
    glowIntensity: 0.6,
    keywords: ['풍요', '자신감', '성취'],
    recovery: '겸손과 수용',
    complementColors: ['바이올렛', '인디고'],
    strengths: ['자신감', '성취력', '리더십', '풍요로움'],
    shadows: ['인정 바라는 마음', '비교 흐름', '여유 찾는 흐름'],
    reading1: '무의식에서 성취와 인정을 향한 욕구가 깊이 흐르고 있습니다.\n자신의 가치를 증명하려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n인정받지 못할 때 내면에서 흔들리는 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 성취를 향해 나아가고 있지만,\n내면에서는 인정받고 싶은 마음이 조용히 흐르고 있습니다.\n목표 지향적이지만 마음의 여유가 부족한 시기입니다.',
    reading3: '골드가 회복 방향으로 나타났을 때는,\n자신의 고유한 빛과 가치를 인정하는 에너지가 필요하다는 신호입니다.\n비교를 내려놓고, 지금 이 순간 자신이 충분히 빛나고 있다는 것을 느껴보세요.',
    recoveryMessages: [
      '성취보다 중요한 것은\n지금 이 순간의 마음의 평화입니다.',
      '비교를 잠시 내려놓고,\n자신의 고유한 빛을 바라봐 주세요.',
      '충분히 잘하고 있습니다.\n그 사실을 조용히 인정해 주세요.',
    ],
  },
  {
    id: 'brown',
    name: 'BROWN',
    korName: '브라운',
    hex: '#8B6355',
    glowStyle: 'matte',
    highlightColor: 'rgba(200,170,140,0.3)',
    glowIntensity: 0.3,
    keywords: ['안정', '신뢰', '현실'],
    recovery: '유연성 회복',
    complementColors: ['스카이블루', '민트'],
    strengths: ['안정성', '신뢰감', '현실감각', '인내'],
    shadows: ['익숙함 붙잡는 흐름', '경직된 흐름', '유연성 찾기'],
    reading1: '무의식에서 안정과 확실함을 향한 욕구가 깊이 자리하고 있습니다.\n변화보다 익숙한 것을 선호하는 패턴이 오랫동안 내면에 이어지고 있습니다.\n예측 가능한 환경에서 안심하는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 안정적인 기반 위에 서 있지만,\n변화 앞에서 내면이 조금 경직되어 있는 느낌이 있습니다.\n신뢰할 수 있는 것을 찾고 있는 시기입니다.',
    reading3: '브라운이 회복 방향으로 나타났을 때는,\n안정된 기반 위에서 조금 더 유연하게 흘러가는 에너지가 필요하다는 신호입니다.\n변화는 당신을 흔드는 것이 아니라, 더 깊은 안정으로 이끌어 줍니다.',
    recoveryMessages: [
      '안정된 기반 위에서\n이제는 조금 더 유연하게 흘러가 봐도 됩니다.',
      '새로운 흐름을 받아들이는 것이\n더 깊은 안정을 만들어 줍니다.',
      '변화는 당신을 흔드는 것이 아니라\n더 풍요롭게 만들어 줍니다.',
    ],
  },
  {
    id: 'beige',
    name: 'BEIGE',
    korName: '베이지',
    hex: '#D4B896',
    glowStyle: 'creamy',
    highlightColor: 'rgba(240,220,190,0.35)',
    glowIntensity: 0.35,
    keywords: ['온화함', '편안함', '자연스러움'],
    recovery: '생활 안정',
    complementColors: ['테라코타', '올리브'],
    strengths: ['온화함', '편안함', '조화로움', '친화력'],
    shadows: ['목소리 작아지는 흐름', '순응 우선 흐름', '감정 안으로 담기'],
    reading1: '무의식에서 조화와 편안함을 향한 욕구가 조용히 흐르고 있습니다.\n갈등을 피하고 분위기를 맞추려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n자신의 의견보다 타인의 편안함을 우선하는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 온화하고 편안한 에너지로 살아가고 있습니다.\n하지만 자신의 감정을 표현하는 것이 어색하게 느껴집니다.\n분위기를 맞추다 보니 자신의 목소리가 작아지고 있습니다.',
    reading3: '베이지가 회복 방향으로 나타났을 때는,\n온화함을 유지하면서도 자신의 감정을 자연스럽게 표현하는 에너지가 필요하다는 신호입니다.\n당신의 목소리는 충분히 들릴 자격이 있습니다.',
    recoveryMessages: [
      '자신의 감정을 표현하는 것이\n가장 자연스러운 회복입니다.',
      '온화함을 유지하면서도\n자신의 목소리를 낼 수 있습니다.',
      '당신의 생각과 감정은\n충분히 표현될 자격이 있습니다.',
    ],
  },
  {
    id: 'white',
    name: 'WHITE',
    korName: '화이트',
    hex: '#F0EDE8',
    glowStyle: 'luminous',
    highlightColor: 'rgba(255,255,255,0.5)',
    glowIntensity: 0.6,
    keywords: ['정화', '리셋', '비움'],
    recovery: '생기 회복',
    complementColors: ['코랄', '옐로우'],
    strengths: ['정화력', '명료함', '새로운 시작', '순수함'],
    shadows: ['감정 정리 중', '내면 공백 느낌', '방향 탐색 중'],
    reading1: '무의식에서 정화와 새로운 시작을 향한 욕구가 깊이 흐르고 있습니다.\n복잡한 것들을 비워내고 싶은 패턴이 오랫동안 내면에 자리하고 있습니다.\n감정과 생각이 너무 많아 비워내고 싶은 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 복잡한 것들을 비워내고 싶은 마음이 강하게 흐르고 있습니다.\n새롭게 시작하고 싶지만, 내면은 조용히 방향을 정리해가는 시간이 필요합니다.\n정화를 원하면서도 마음은 아직 자신만의 흐름을 찾고 있습니다.',
    reading3: '화이트가 회복 방향으로 나타났을 때는,\n복잡함을 비워내고 다시 생기를 회복하는 에너지가 필요하다는 신호입니다.\n깨끗하게 비워낸 자리에 새로운 생기와 활력을 조금씩 채워가세요.',
    recoveryMessages: [
      '복잡함을 비워낸 자리에\n새로운 생기를 채워보세요.',
      '깨끗하게 정리된 마음에\n따뜻한 활력이 필요합니다.',
      '비워낸 것들이 새로운 시작의\n공간이 되어줄 것입니다.',
    ],
  },
  {
    id: 'black',
    name: 'BLACK',
    korName: '블랙',
    hex: '#3A3A3A',
    glowStyle: 'metallic',
    highlightColor: 'rgba(120,120,140,0.25)',
    glowIntensity: 0.3,
    keywords: ['보호', '깊이', '경계'],
    recovery: '연결과 개방',
    complementColors: ['화이트', '골드'],
    strengths: ['깊이', '보호력', '집중력', '신중함'],
    shadows: ['연결 그리움', '감정 거리두기', '자기 보호 흐름'],
    reading1: '무의식에서 자신을 보호하려는 강한 에너지가 깊이 흐르고 있습니다.\n외부로부터 자신을 지키려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n깊이 있지만 연결을 차단하는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 자신을 보호하는 에너지가 강하게 작동하고 있습니다.\n외부와의 연결보다 내면의 안전을 우선하는 시기입니다.\n깊이 있지만 고립감이 느껴지는 상태입니다.',
    reading3: '블랙이 회복 방향으로 나타났을 때는,\n보호막 뒤에서 조금씩 마음의 문을 열고 연결되는 에너지가 필요하다는 신호입니다.\n연결과 개방이 더 깊은 안전감을 만들어 준다는 것을 느껴보세요.',
    recoveryMessages: [
      '조금씩 마음의 문을 열어도\n괜찮습니다.',
      '연결이 당신을 약하게 만드는 것이 아니라\n더 깊이 있게 만들어 줍니다.',
      '보호막 뒤에서 조금씩\n세상과 연결되어 보세요.',
    ],
  },
  {
    id: 'silver',
    name: 'SILVER',
    korName: '실버',
    hex: '#A8B0B8',
    glowStyle: 'metallic',
    highlightColor: 'rgba(220,230,245,0.5)',
    glowIntensity: 0.65,
    keywords: ['이성', '명료함', '거리감'],
    recovery: '감정 연결',
    complementColors: ['코랄', '피치'],
    strengths: ['이성적 판단', '명료함', '객관성', '신중함'],
    shadows: ['감정 거리두기', '생각 우선 흐름', '연결 그리움'],
    reading1: '무의식에서 이성적 명료함을 향한 욕구가 조용히 흐르고 있습니다.\n감정보다 이성으로 판단하려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n감정적 연결이 불편하게 느껴지는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 이성적이고 명료한 에너지가 흐르고 있습니다.\n하지만 감정과의 연결이 멀어지고 있는 느낌이 있습니다.\n이성적으로 정리하려 하지만, 마음은 따뜻한 연결과 회복을 함께 원하고 있습니다.',
    reading3: '실버가 회복 방향으로 나타났을 때는,\n이성의 거리를 조금 좁히고 감정과 연결되는 에너지가 필요하다는 신호입니다.\n따뜻한 감정의 온기를 느끼는 것이 지금 당신에게 필요한 회복입니다.',
    recoveryMessages: [
      '이성의 거리를 조금 좁히고,\n따뜻한 감정의 온기를 느껴보세요.',
      '감정과 연결되는 것이\n지금 당신에게 필요한 에너지입니다.',
      '이성과 감정이 함께할 때,\n더 깊은 균형이 찾아옵니다.',
    ],
  },
  {
    id: 'olive',
    name: 'OLIVE',
    korName: '올리브',
    hex: '#8A9A5B',
    glowStyle: 'natural',
    highlightColor: 'rgba(190,210,160,0.3)',
    glowIntensity: 0.3,
    keywords: ['지혜', '성숙', '조화'],
    recovery: '균형 회복',
    complementColors: ['코랄', '테라코타'],
    strengths: ['지혜', '성숙함', '균형', '포용력'],
    shadows: ['목소리 작아지는 흐름', '중재 우선 흐름', '자신을 뒤로 미루는 흐름'],
    reading1: '무의식에서 지혜와 조화를 향한 욕구가 깊이 흐르고 있습니다.\n중재하고 균형을 맞추려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n자신의 목소리보다 전체의 조화를 우선하는 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 성숙하고 균형 잡힌 에너지가 흐르고 있습니다.\n하지만 자신의 감정을 표현하는 것이 어색하게 느껴집니다.\n지혜롭게 중재하지만 정작 자신의 필요는 뒤로 미루고 있습니다.',
    reading3: '올리브가 회복 방향으로 나타났을 때는,\n지혜로운 당신의 목소리를 세상에 표현하는 에너지가 필요하다는 신호입니다.\n안으로만 담아왔던 생각과 감정을 용기 내어 표현해 보세요.',
    recoveryMessages: [
      '지혜로운 당신의 목소리를\n이제는 세상에 표현해 보세요.',
      '자신의 감정을 표현하는 것이\n성숙함의 완성입니다.',
      '안으로만 담아왔던 생각을\n오늘은 용기 내어 말해보세요.',
    ],
  },
  {
    id: 'mint',
    name: 'MINT',
    korName: '민트',
    hex: '#7EC8C0',
    glowStyle: 'natural',
    highlightColor: 'rgba(180,240,220,0.35)',
    glowIntensity: 0.4,
    keywords: ['신선함', '치유', '청량감'],
    recovery: '깊은 휴식',
    complementColors: ['코랄', '피치'],
    strengths: ['치유력', '신선함', '회복력', '청량감'],
    shadows: ['자기 돌봄 찾는 흐름', '쉼 찾는 흐름', '에너지 과소비'],
    reading1: '무의식에서 신선함과 치유를 향한 욕구가 깊이 흐르고 있습니다.\n새롭게 시작하고 싶은 패턴이 오랫동안 내면에 자리하고 있습니다.\n치유의 에너지를 발산하지만 자신이 먼저 쉬지 못하는 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 신선하고 치유적인 에너지가 흐르고 있습니다.\n새로운 시작을 향해 나아가고 있지만, 깊은 휴식이 먼저 필요합니다.\n치유하려는 마음이 있지만 정작 자신은 지쳐 있는 상태입니다.',
    reading3: '민트가 회복 방향으로 나타났을 때는,\n깊고 충분한 휴식의 에너지가 지금 당신에게 필요하다는 신호입니다.\n억지로 회복하려 하지 말고, 자연스럽게 쉬어가는 것이 가장 강력한 회복입니다.',
    recoveryMessages: [
      '지금 당신에게 필요한 것은\n깊고 충분한 휴식입니다.',
      '억지로 회복하려 하지 말고,\n몸과 마음이 자연스럽게 쉴 수 있도록 두세요.',
      '깊은 휴식이 가장 강력한\n회복의 에너지가 됩니다.',
    ],
  },
  {
    id: 'skyblue',
    name: 'SKYBLUE',
    korName: '스카이블루',
    hex: '#87CEEB',
    glowStyle: 'misty',
    highlightColor: 'rgba(180,230,255,0.4)',
    glowIntensity: 0.45,
    keywords: ['자유', '희망', '개방성'],
    recovery: '현실 집중',
    complementColors: ['코랄', '오렌지'],
    strengths: ['자유로움', '개방성', '희망', '가능성'],
    shadows: ['현실 거리두기', '생각 확장 흐름', '책임 무게 느낌'],
    reading1: '무의식에서 자유와 가능성을 향한 욕구가 조용히 흐르고 있습니다.\n현실의 무게에서 벗어나고 싶은 패턴이 오랫동안 내면에 자리하고 있습니다.\n책임감이 부담스럽게 느껴지는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 자유롭고 싶은 마음이 강하게 흐르고 있습니다.\n현실에서 벗어나 가능성을 향해 시선이 향해 있습니다.\n개방적이지만 현실에 집중하기 어려운 시기입니다.',
    reading3: '스카이블루가 회복 방향으로 나타났을 때는,\n꿈과 현실을 연결하는 작은 한 걸음의 에너지가 필요하다는 신호입니다.\n현실에 발을 딛고 서 있을 때, 꿈이 더욱 선명하게 보입니다.',
    recoveryMessages: [
      '꿈과 현실을 연결하는 작은 한 걸음이\n지금 필요합니다.',
      '현실에 발을 딛고 서 있을 때,\n꿈이 더욱 선명해집니다.',
      '지금 이 순간에 집중하는 것이\n진정한 자유의 시작입니다.',
    ],
  },
  {
    id: 'lavender',
    name: 'LAVENDER',
    korName: '라벤더',
    hex: '#B8A8D0',
    glowStyle: 'misty',
    highlightColor: 'rgba(220,210,255,0.4)',
    glowIntensity: 0.45,
    keywords: ['평온', '치유', '섬세함'],
    recovery: '자기 돌봄',
    complementColors: ['골드', '크림'],
    strengths: ['섬세함', '치유력', '평온함', '감성'],
    shadows: ['감정 안으로 담기', '자신을 뒤로 미루는 흐름', '경계 찾는 흐름'],
    reading1: '무의식에서 평온함과 치유를 향한 욕구가 깊이 자리하고 있습니다.\n감정을 깊고 섬세하게 느끼며 내면을 조용히 관찰하는 패턴이 이어지고 있습니다.\n자신의 감정 흐름을 섬세하게 느끼지만, 그것을 표현하기보다 안으로 담아두는 흐름이 있습니다.',
    reading2: '지금 섬세하고 평온한 에너지 속에서 내면이 조용히 회복되고 있습니다.\n감정을 깊이 통찰하는 능력이 있지만, 그 섬세함이 때로 자신을 지치게 만들기도 합니다.\n아름다움과 치유를 추구하지만 자신을 돌보는 것은 뒤로 미루는 시기입니다.',
    reading3: '라벤더가 회복 방향으로 나타났을 때는,\n자신을 위한 부드럽고 따뜻한 돌봄의 에너지가 필요하다는 신호입니다.\n섬세한 당신에게 가장 필요한 것은 자신을 향한 조용한 사랑입니다.',
    recoveryMessages: [
      '자신을 위한 작은 의식 하나가\n큰 회복의 씨앗이 됩니다.',
      '섬세한 당신에게는\n부드럽고 따뜻한 자기 돌봄이 필요합니다.',
      '자신을 돌보는 것이\n가장 아름다운 행동입니다.',
    ],
  },
  {
    id: 'peach',
    name: 'PEACH',
    korName: '피치',
    hex: '#FFBE9F',
    glowStyle: 'radiant',
    highlightColor: 'rgba(255,210,180,0.4)',
    glowIntensity: 0.7,
    keywords: ['따뜻함', '친근함', '부드러움'],
    recovery: '자기 사랑',
    complementColors: ['세이지그린', '틸'],
    strengths: ['따뜻함', '친근함', '부드러움', '친화력'],
    shadows: ['자기 확신 부족', '배려 우선 흐름', '경계 찾는 흐름'],
    reading1: '무의식에서 사랑받고 친밀하게 연결되고 싶은 욕구가 조용히 흐르고 있습니다.\n관계에서 편안함을 주고받는 것을 중요하게 여기는 패턴이 내면에 자리하고 있습니다.\n자신의 필요보다 타인의 필요를 먼저 채우는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 따뜻하고 친근한 에너지가 흐르고 있습니다.\n관계 속에서 편안함을 주지만, 자신을 사랑하는 연습이 필요합니다.\n타인에게 친절하지만 자신에게는 엄격한 시기입니다.',
    reading3: '피치가 회복 방향으로 나타났을 때는,\n자신을 향한 사랑과 친절함의 에너지가 필요하다는 신호입니다.\n자신을 사랑하는 것이 모든 관계의 시작이라는 것을 느껴보세요.',
    recoveryMessages: [
      '자신을 사랑하는 것이\n모든 관계의 시작입니다.',
      '오늘은 자신에게 가장 친절한 사람이 되어 주세요.',
      '당신이 자신을 사랑할 때,\n주변의 모든 것이 더 따뜻해집니다.',
    ],
  },
  {
    id: 'terracotta',
    name: 'TERRACOTTA',
    korName: '테라코타',
    hex: '#C4704A',
    glowStyle: 'natural',
    highlightColor: 'rgba(220,170,140,0.35)',
    glowIntensity: 0.35,
    keywords: ['대지', '안정', '열정'],
    recovery: '내면 평화',
    complementColors: ['스카이블루', '민트'],
    strengths: ['안정성', '열정', '현실감각', '따뜻함'],
    shadows: ['내면 갈등 흐름', '익숙함 붙잡는 흐름', '유연성 찾기'],
    reading1: '무의식에서 안정과 열정이 함께 흐르는 욕구가 깊이 자리하고 있습니다.\n현실에 뿌리를 내리고 싶은 패턴이 오랫동안 내면에 이어지고 있습니다.\n내면의 갈등을 혼자 감당하려는 흐름이 조용히 흐르고 있습니다.',
    reading2: '지금 안정적인 에너지와 열정이 공존하고 있습니다.\n하지만 내면에서는 평화를 찾고 싶은 마음이 흐르고 있습니다.\n현실적이지만 내면의 갈등이 있는 시기입니다.',
    reading3: '테라코타가 회복 방향으로 나타났을 때는,\n내면의 고요한 평화를 찾는 에너지가 필요하다는 신호입니다.\n대지처럼 깊고 안정된 내면의 평화가 지금 당신에게 필요합니다.',
    recoveryMessages: [
      '열정을 잠시 내려놓고,\n내면의 고요한 평화를 찾아보세요.',
      '바쁘게 달려온 마음에\n따뜻한 평화가 필요합니다.',
      '내면이 평화로울 때,\n진정한 힘이 생겨납니다.',
    ],
  },
  {
    id: 'sage',
    name: 'SAGE',
    korName: '세이지',
    hex: '#8FA68E',
    glowStyle: 'natural',
    highlightColor: 'rgba(190,220,190,0.3)',
    glowIntensity: 0.35,
    keywords: ['치유', '자연', '균형'],
    recovery: '감정 정돈',
    complementColors: ['코랄', '피치'],
    strengths: ['치유력', '자연스러움', '균형', '평온함'],
    shadows: ['목소리 작아지는 흐름', '배려 우선 흐름', '감정 안으로 담기'],
    reading1: '무의식에서 자연스러운 치유와 균형을 향한 욕구가 깊이 흐르고 있습니다.\n조화롭게 흐르고 싶은 패턴이 오랫동안 내면에 자리하고 있습니다.\n자신을 치유하면서도 자기 표현이 어색한 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 자연스럽고 치유적인 에너지가 흐르고 있습니다.\n균형을 찾으려 하지만 자신의 감정을 표현하는 것이 어색합니다.\n치유하는 에너지가 있지만 자신의 목소리는 작아지고 있습니다.',
    reading3: '세이지가 회복 방향으로 나타났을 때는,\n자연스럽게 자신의 감정을 표현하는 에너지가 필요하다는 신호입니다.\n치유의 에너지를 자신에게도 돌려, 자신의 목소리를 자연스럽게 표현해 보세요.',
    recoveryMessages: [
      '자연스럽게 자신의 감정을\n표현해도 됩니다.',
      '치유의 에너지를\n자신에게도 돌려주세요.',
      '자신의 목소리를 자연스럽게\n세상에 내어놓아 보세요.',
    ],
  },
  {
    id: 'teal',
    name: 'TEAL',
    korName: '틸',
    hex: '#4A9A9A',
    glowStyle: 'natural',
    highlightColor: 'rgba(160,220,210,0.35)',
    glowIntensity: 0.4,
    keywords: ['균형', '통합', '명료함'],
    recovery: '감정 표현',
    complementColors: ['코랄', '피치'],
    strengths: ['균형감', '통합력', '명료함', '침착함'],
    shadows: ['감정 표현 찾는 흐름', '생각 우선 흐름', '연결 그리움'],
    reading1: '무의식에서 균형과 통합을 향한 욕구가 깊이 흐르고 있습니다.\n이성과 감정을 통합하려는 패턴이 오랫동안 내면에 자리하고 있습니다.\n명료함을 추구하지만 감정 표현이 어색한 흐름이 조용히 이어지고 있습니다.',
    reading2: '지금 균형 잡힌 에너지가 흐르고 있습니다.\n이성적으로 명료하지만 감정을 표현하는 것이 어색한 시기입니다.\n통합을 원하지만 감정과의 연결이 부족합니다.',
    reading3: '틸이 회복 방향으로 나타났을 때는,\n이성과 감정을 통합하는 균형의 에너지가 필요하다는 신호입니다.\n이성의 명료함과 감정의 따뜻함이 함께할 때 진정한 균형이 찾아옵니다.',
    recoveryMessages: [
      '이성과 감정이 함께할 때\n진정한 균형이 찾아옵니다.',
      '명료함과 따뜻함을\n함께 품어보세요.',
      '균형 잡힌 에너지가\n지금 당신에게 필요합니다.',
    ],
  },
  {
    id: 'cream',
    name: 'CREAM',
    korName: '아이보리',
    hex: '#F5F0E8',
    glowStyle: 'creamy',
    highlightColor: 'rgba(255,248,230,0.45)',
    glowIntensity: 0.5,
    keywords: ['고요함', '정리', '안정감'],
    recovery: '자기 리듬 회복',
    complementColors: ['코랄', '골드'],
    strengths: ['고요함', '섬세함', '내면 정리', '안정감'],
    shadows: ['감정 표현 찾는 흐름', '내면 집중 흐름', '연결 그리움'],
    reading1: '무의식에서 고요함과 안정을 향한 욕구가 깊이 자리하고 있습니다.\n복잡한 것들을 정리하고 조용히 머물고 싶은 패턴이 내면에 이어지고 있습니다.\n외부 자극으로부터 자신을 보호하려는 흐름이 마음 깊은 곳에 머물고 있습니다.',
    reading2: '지금 조용하고 안정된 에너지 속에 머물고 있습니다.\n내면을 정리하려는 마음이 강하지만, 외부와의 연결이 줄어들고 있습니다.\n고요함 속에서 자신을 돌보고 있지만 생기가 조금 부족한 시기입니다.',
    reading3: '아이보리가 회복 방향으로 나타났을 때는,\n복잡함을 정리하고 자신만의 고요한 리듬을 회복하는 에너지가 필요하다는 신호입니다.\n서두르지 않아도 됩니다. 조용히 자신의 페이스를 되찾아가는 것이 지금 가장 필요한 회복입니다.',
    recoveryMessages: [
      '복잡함을 내려놓고\n자신만의 고요한 리듬을 되찾아가세요.',
      '서두르지 않아도 됩니다.\n조용히 자신의 페이스로 돌아가면 됩니다.',
      '감정 숨 고르기가 필요한 시간입니다.\n천천히, 자신의 리듬대로 가세요.',
    ],
  },
];

export function getColorById(id: string): ColorData | undefined {
  return COLOR_DATA.find(c => c.id === id);
}

export function generateInterpretation(
  card1: ColorData,
  card2: ColorData,
  card3: ColorData,
) {
  const strengths = [...new Set([...card1.strengths, ...card2.strengths])].slice(0, 4);
  const shadows = [...new Set([...card1.shadows, ...card2.shadows])].slice(0, 3);
  const complementColors = [...new Set([...card3.complementColors, ...card2.complementColors])].slice(0, 3);

  const psychologyFlow = generatePsychologyFlow(card1, card2, card3);
  const personalityFlow = generatePersonalityFlow(card1, card2, card3);
  const coachingMessage = generateCoachingMessage(card1, card2, card3);
  const recoveryFlow = generateRecoveryFlow(card3);

  return {
    psychologyFlow,
    personalityFlow,
    strengths,
    shadows,
    complementColors,
    coachingMessage,
    recoveryFlow,
  };
}

/**
 * 연결어로 끝나는 문장을 감지하여 자동으로 완결형 마무리 문장을 추가하는 헬퍼
 * "하지만," / "있지만," / "원하지만," 등으로 끝나는 경우 회복 흐름 마무리 문장 자동 추가
 */
function ensureComplete(text: string, card3?: ColorData): string {
  // 연결어/쉼표로 끝나는 모든 패턴 감지
  const incompletePattern = /[하있원되어지이고]지만,?$|[하있원되어지이고]고,?$|[하있원되어지이고]며,?$|[하있원되어지이고]나,?$|[하있원되어지이고]서,?$/;
  const lastLine = text.split('\n').pop() ?? '';
  const trimmed = lastLine.trim();
  // 쉼표로 끝나거나 연결어 패턴으로 끝나는 경우 감지
  const isIncomplete = trimmed.endsWith(',') || incompletePattern.test(trimmed);
  if (!isIncomplete) return text;
  // card3의 recovery 키워드를 활용한 마무리 문장 생성
  const recoveryKeyword = card3?.recovery ?? '회복';
  // recovery 키워드 끝 글자 받침 여부로 '을/를' 선택
  const lastChar = recoveryKeyword[recoveryKeyword.length - 1];
  const charCode = lastChar.charCodeAt(0);
  const hasBatchim = (charCode - 0xAC00) % 28 !== 0;
  const eul = hasBatchim ? '을' : '를';
  const closings = [
    `마음은 안정과 ${recoveryKeyword}${eul} 함께 원하고 있습니다.`,
    `내면은 조용히 ${recoveryKeyword}의 시간을 필요로 하고 있습니다.`,
    `서두르기보다 자신만의 흐름으로 천천히 ${recoveryKeyword}해가는 과정이 이어지고 있습니다.`,
  ];
  // card3 id 길이 기반으로 마무리 문장 선택 (다양성 확보)
  const idx = card3 ? (card3.id.length % closings.length) : 0;
  return `${text}\n${closings[idx]}`;
}

/**
 * 현재 심리 흐름 생성
 * 무의식(1번 reading1) → 현재상태(2번 reading2) 흐름 연결
 */
function generatePsychologyFlow(card1: ColorData, card2: ColorData, card3: ColorData): string {
  const combos: Record<string, string> = {
    'cream_skyblue': '부드럽고 조용한 에너지 속에서 버티고 있지만,\n내면에는 잠시 쉬고 싶고 현실에서 거리를 두고 싶은 마음이 흐르고 있습니다.',
    'blue_red': '책임감 있게 달려왔지만,\n내면에서는 그 긴장이 쌓여 쉬고 싶은 마음이 조용히 흐르고 있습니다.',
    'red_blue': '강하게 앞으로 나아가고 싶은 에너지와 감정을 조절하려는 흐름이 함께 나타나고 있습니다.\n지금은 긴장을 조금 내려놓는 균형이 필요합니다.',
    'pink_blue': '따뜻한 연결을 원하는 마음이 내면에 있지만,\n지금은 책임감 속에서 감정을 안으로 담아두고 있습니다.',
    'green_pink': '회복과 균형을 원하는 에너지가 내면에 흐르지만,\n지금은 타인을 위해 에너지를 쏟으며 자신을 소홀히 하고 있습니다.',
    'yellow_blue': '희망과 소통을 원하는 마음이 내면에 있지만,\n지금은 책임감 속에서 감정을 표현하지 못하고 있습니다.',
    'white_blue': '정화와 새로운 시작을 원하는 마음이 내면에 있지만,\n지금은 책임감 있게 살아가며 감정을 비우지 못하고 있습니다.',
    'coral_lavender': '사람과의 따뜻한 연결을 원하면서도 마음 한편에서는 조용한 치유를 함께 바라고 있습니다.',
    'lavender_coral': '평온함과 치유를 원하는 마음이 내면에 있지만,\n지금은 활기찬 에너지를 나누며 자신을 소진하고 있습니다.',
    'coral_cream': '따뜻한 연결을 원하는 에너지가 내면에 흐르지만,\n지금은 고요함 속에서 자신을 정리하고 싶은 마음이 강합니다.',
    'violet_indigo': '변화와 성장을 향한 열망이 내면에 있지만,\n지금은 깊은 탐구 속에서 조용히 자신만의 흐름을 정리하는 시간이 이어지고 있습니다.',
    'violet_indigo_green': '변화와 성장을 향한 열망이 내면에 깊이 흐르고 있습니다.\n지금은 깊은 탐구 속에서도, 조금씩 자신만의 회복과 균형을 찾아가고 있습니다.',
    'black_silver': '자신을 보호하려는 에너지가 내면에 자리하고 있지만,\n지금은 이성적 거리감 속에서 감정과의 연결이 멀어지고 있습니다.',
    'coral_orange': '따뜻한 연결을 원하는 에너지가 내면에 흐르지만,\n지금은 관계 속에서 많이 소진되어 자신을 돌볼 여유가 없습니다.',
    'lavender_cream': '조용히 자신을 돌보며 마음을 회복하고 싶은 흐름이 이어지고 있습니다.\n지금 가장 필요한 것은 부드러운 휴식과 자기 돌봐입니다.',
    'lavender_indigo': '감정을 섬세하게 느끼며 내면을 관찰하는 에너지가 무의식에 자리하고 있습니다.\n지금은 생각이 깊어지면서 감정은 안으로 담아두는 시간이 길어지고 있습니다.',
    'indigo_blue': '깊은 생각과 감정을 혼자 안으로 담아두는 흐름이 이어지고 있습니다.\n조용한 안정과 감정의 숨 쉬는 공간이 필요한 시기입니다.',
    'peach_green': '따뜻한 관계와 편안한 연결을 향한 마음이 흐르고 있습니다.\n지금은 서두르기보다 안정 속에서 자연스럽게 회복되는 과정이 중요합니다.',
    'peach_yellow': '따뜻한 연결과 밝은 에너지가 함께 흐르고 있지만,\n마음은 안정과 회복을 함께 원하고 있습니다.',
    'yellow_peach': '지금 많은 생각과 아이디어가 흐르고 있지만,\n마음은 안정과 회복을 함께 원하고 있습니다.',
  };
  const key123 = `${card1.id}_${card2.id}_${card3.id}`;
  if (combos[key123]) return ensureComplete(combos[key123], card3);
  const key12 = `${card1.id}_${card2.id}`;
  if (combos[key12]) return ensureComplete(combos[key12], card3);
  const line1 = card1.reading1.split('\n')[0];
  const line2 = card2.reading2.split('\n')[0];
  const combined = `${line1}\n${line2}`;
  return ensureComplete(combined, card3);
}

/**
 * 성격 흐름 생성
 * 무의식(1번) + 현재상태(2번) 기반으로 감정 패턴 설명
 */
function generatePersonalityFlow(card1: ColorData, card2: ColorData, card3?: ColorData): string {
  const personalityCombos: Record<string, string> = {
    'cream_skyblue': '온화하고 섬세한 성향이지만,\n갈등을 피하려는 경향이 강하고 감정을 안으로 담아두는 흐름이 있습니다.',
    'blue_red': '책임감이 강하고 혼자 견디는 성향이 있습니다.\n감정을 표현하는 것이 약함처럼 느껴져 안으로 담아두는 패턴이 있습니다.',
    'red_blue': '강하게 추진하는 성향이 있지만,\n책임감 속에서 감정을 억누르며 혼자 감당하려는 패턴이 있습니다.',
    'pink_blue': '따뜻하고 배려심이 깊지만,\n자신의 감정보다 타인을 먼저 생각하다 보니 내면이 소진되는 패턴이 있습니다.',
    'green_pink': '배려심이 깊고 조화를 중시하지만,\n자신의 감정을 표현하는 것이 어색한 패턴이 있습니다.',
    'coral_lavender': '따뜻하고 활기찬 성향이지만,\n섬세한 내면에서는 조용히 쉬고 싶은 마음이 흐르고 있습니다.',
    'lavender_coral': '섬세하고 평온한 성향이지만,\n관계 속에서 에너지를 나누다 보니 자신을 소홀히 하는 패턴이 있습니다.',
    'coral_cream': '따뜻하고 소통을 좋아하는 성향이지만,\n내면에서는 조용히 정리하고 싶은 마음이 조용히 흐르고 있습니다.',
    'violet_indigo': '이상을 추구하고 깊이 탐구하는 성향이 있지만,\n마음 한편에서는 안정과 확신을 찾고 있는 흐름이 이어지고 있습니다.',
    'violet_indigo_green': '이상을 추구하고 깊이 탐구하는 성향이 있지만,\n마음 한편에서는 자연스러운 회복의 흐름도 함께 이어지고 있습니다.',
    'black_silver': '깊이 있고 이성적이지만,\n감정 표현이 어렵고 고립되는 패턴이 있습니다.',
    'coral_orange': '활기차고 따뜻하지만,\n관계 속에서 에너지를 소진하며 자신을 돌보지 못하는 패턴이 있습니다.',
    'lavender_cream': '섬세하고 평온하지만,\n자신을 표현하는 것이 어색하고 감정을 안으로 담아두는 흐름이 있습니다.',
    'lavender_indigo': '감정을 섬세하게 느끼고 깊이 탐구하는 성향이 있습니다.\n혼자 생각으로 감정을 정리하려는 흐름이 강하고, 그 과정에서 주변과의 연결이 멀어지는 패턴이 있습니다.',
  };
  if (card3) {
    const key3 = `${card1.id}_${card2.id}_${card3.id}`;
    if (personalityCombos[key3]) return ensureComplete(personalityCombos[key3]);
  }
  const key = `${card1.id}_${card2.id}`;
  if (personalityCombos[key]) return ensureComplete(personalityCombos[key]);
  const lines1 = card1.reading1.split('\n');
  const lines2 = card2.reading2.split('\n');
  const combined = `${lines1[lines1.length - 1]}\n${lines2[lines2.length - 1]}`;
  return ensureComplete(combined);
}

/**
 * 회복 방향 설명 생성
 * 3번 카드의 고유한 회복 에너지를 중심으로 설명
 * ※ 코칭 메시지(짧은 한 마디)와 달리, 회복 에너지의 방향과 성질을 설명
 */
function generateRecoveryFlow(card3: ColorData): string {
  return card3.reading3;
}

/**
 * 코칭 메시지 생성
 * 현재 상태(1번+2번)를 인식하고, 3번 카드의 회복 방향으로 연결하는 짧은 문장
 */
function generateCoachingMessage(card1: ColorData, card2: ColorData, card3: ColorData): string {
  const coachingCombos: Record<string, string> = {
    'cream_skyblue_orange': '혼자 머물러 있던 마음에\n다시 따뜻한 연결이 필요합니다.',
    'coral_lavender_cream': '조용히 버텨온 마음에도\n따뜻한 숨 고르기가 필요합니다.',
    'lavender_coral_cream': '활기차게 나누어왔지만,\n이제는 자신만의 고요한 리듬을 되찾을 시간입니다.',
    'coral_cream_lavender': '따뜻하게 달려온 마음을\n조용히 자신에게 돌려주세요.',
    'blue_red_white': '책임감으로 달려온 마음을\n이제는 조용히 비워도 됩니다.',
    'red_blue_green': '강하게 버텨온 에너지를 내려놓고,\n자연스러운 회복의 흐름에 몸을 맡겨보세요.',
    'blue_white_green': '책임감 있게 살아왔지만,\n이제는 균형과 회복의 에너지가 필요합니다.',
    'pink_blue_gold': '타인을 위해 쏟아온 에너지를\n이제는 자신의 가치를 빛내는 데 사용해 보세요.',
    'green_pink_sage': '배려하는 마음을 자신에게도 돌려,\n자신의 감정을 자연스럽게 표현해 보세요.',
    'yellow_blue_green': '분주한 생각들을 내려놓고,\n균형 잡힌 회복의 에너지를 찾아보세요.',
    'white_blue_green': '비워낸 자리에\n균형과 회복의 에너지를 채워보세요.',
    'violet_indigo_gold': '이상을 현실로 연결하는 작은 한 걸음이\n지금 당신에게 필요합니다.',
    'violet_indigo_green': '깊은 탐구와 열망 속에서도,\n자연스러운 회복의 흐름이 지금 당신과 함께하고 있습니다.',
    'black_silver_white': '보호막 뒤에 있던 마음을\n조용히 정화하고 새롭게 시작해 보세요.',
    'coral_orange_lavender': '활기차게 나누어왔지만,\n이제는 자신을 위한 부드러운 돌봄의 시간이 필요합니다.',
    'lavender_cream_coral': '조용히 머물러 있던 마음에\n따뜻한 생기와 연결이 필요합니다.',
    'cream_lavender_coral': '고요함 속에 머물러 있던 마음에\n따뜻한 생기를 조금씩 채워가세요.',
    'cream_coral_orange': '조용히 정리하고 싶은 마음 뒤에\n따뜻한 연결의 에너지가 기다리고 있습니다.',
  };
  const key = `${card1.id}_${card2.id}_${card3.id}`;
  if (coachingCombos[key]) return coachingCombos[key];

  const key2 = `${card2.id}_${card3.id}`;
  const twoCardCombos: Record<string, string> = {
    'red_green': '달려온 에너지를 내려놓고,\n자연스러운 회복의 흐름을 따라가 보세요.',
    'red_white': '강하게 버텨온 마음,\n이제는 조용히 비워도 됩니다.',
    'blue_pink': '혼자 감당해온 마음에\n따뜻한 돌봄이 필요합니다.',
    'blue_orange': '침묵 속에 담아왔던 에너지를\n따뜻한 연결로 표현해 보세요.',
    'cream_orange': '조용히 머물러 있던 마음에\n따뜻한 생기와 연결이 필요합니다.',
    'skyblue_cream': '자유롭게 흘러온 마음을\n이제는 고요한 리듬으로 정리해 보세요.',
    'lavender_cream': '섬세하게 버텨온 마음에\n조용한 숨 고르기가 필요합니다.',
    'coral_cream': '활기차게 달려온 마음을\n이제는 고요히 자신에게 돌려주세요.',
    'white_coral': '비워낸 자리에\n따뜻한 생기를 다시 채워보세요.',
    'indigo_orange': '깊은 내면에서 나온 에너지를\n따뜻한 관계와 표현으로 연결해 보세요.',
    'violet_yellow': '이상과 현실 사이에서,\n작은 희망의 씨앗을 현실에 심어보세요.',
    'black_white': '보호막 뒤에 있던 마음을\n조용히 정화하고 새롭게 시작해 보세요.',
    'silver_coral': '이성의 거리를 조금 좁히고,\n따뜻한 감정의 온기를 느껴보세요.',
    'orange_lavender': '활기찬 에너지를 나누어왔지만,\n이제는 자신을 위한 부드러운 돌봄이 필요합니다.',
    'pink_gold': '타인을 위해 쓸아온 배려를\n이제는 자신의 가치를 빛내는 데 사용해 보세요.',
    'indigo_lavender': '생각 속에 혼자 담아두었던 마음에\n부드럽고 조용한 자기 돌봄이 필요합니다.',
    'indigo_coral': '안으로 담아두었던 생각과 감정을\n이제는 따뜻한 연결로 조금씩 표현해 보세요.',
  };
  if (twoCardCombos[key2]) return twoCardCombos[key2];

  // 기본: 3번 카드의 recoveryMessages 중 첫 번째
  return card3.recoveryMessages[0];
}
