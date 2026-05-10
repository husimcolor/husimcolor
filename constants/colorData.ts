export interface ColorData {
  id: string;
  name: string;
  korName: string;
  hex: string;
  keywords: string[];
  recovery: string;
  complementColors: string[];
  psychologyFlow: string;
  personalityFlow: string;
  strengths: string[];
  shadows: string[];
  coachingMessages: string[];
}

export const COLOR_DATA: ColorData[] = [
  {
    id: 'red',
    name: 'RED',
    korName: '레드',
    hex: '#E05A4E',
    keywords: ['열정', '긴장', '추진력'],
    recovery: '안정과 휴식',
    complementColors: ['그린', '화이트'],
    psychologyFlow: '강한 에너지와 추진력이 넘치지만, 그 이면에는 긴장과 피로가 쌓여 있을 수 있습니다.',
    personalityFlow: '목표 지향적이고 행동력이 강하며, 도전을 두려워하지 않는 성향을 가지고 있습니다.',
    strengths: ['추진력', '열정', '용기', '리더십'],
    shadows: ['충동성', '과부하', '조급함', '긴장'],
    coachingMessages: [
      '당신의 열정은 충분히 빛나고 있습니다. 지금은 잠시 멈추어 숨을 고르는 시간이 필요합니다.',
      '강하게 달려온 당신, 이제는 스스로를 위한 휴식을 허락해 주세요.',
    ],
  },
  {
    id: 'orange',
    name: 'ORANGE',
    korName: '오렌지',
    hex: '#F0874A',
    keywords: ['활력', '창의성', '사교성'],
    recovery: '내면 집중',
    complementColors: ['블루', '인디고'],
    psychologyFlow: '활기차고 사교적인 에너지가 넘치지만, 때로는 내면의 고요함이 필요한 시기입니다.',
    personalityFlow: '밝고 긍정적이며 사람들과의 교류를 즐기는 성향을 가지고 있습니다.',
    strengths: ['창의성', '활력', '사교성', '유머'],
    shadows: ['산만함', '과잉 자극', '감정 기복', '집중력 부족'],
    coachingMessages: [
      '당신의 밝은 에너지는 주변을 환하게 합니다. 오늘은 그 빛을 자신에게도 비춰 주세요.',
      '활기찬 하루를 보냈다면, 저녁에는 조용히 자신과 대화하는 시간을 가져보세요.',
    ],
  },
  {
    id: 'yellow',
    name: 'YELLOW',
    korName: '옐로우',
    hex: '#F0C040',
    keywords: ['생각', '희망', '소통'],
    recovery: '마음 안정',
    complementColors: ['올리브', '베이지'],
    psychologyFlow: '밝고 지적인 에너지가 활발하게 움직이고 있지만, 생각이 너무 많아 마음이 분주할 수 있습니다.',
    personalityFlow: '호기심이 많고 아이디어가 풍부하며, 소통을 즐기는 성향을 가지고 있습니다.',
    strengths: ['지성', '소통력', '희망', '창의적 사고'],
    shadows: ['과도한 생각', '불안', '우유부단', '집중력 분산'],
    coachingMessages: [
      '생각이 많은 당신, 지금은 머릿속을 비우고 몸의 감각에 집중해 보세요.',
      '희망을 품는 것은 아름답습니다. 그 희망을 오늘 하루 작은 행동으로 표현해 보세요.',
    ],
  },
  {
    id: 'green',
    name: 'GREEN',
    korName: '그린',
    hex: '#6BAE75',
    keywords: ['회복', '균형', '성장'],
    recovery: '자기표현',
    complementColors: ['골드', '오렌지'],
    psychologyFlow: '자연스러운 회복과 균형을 찾아가는 과정에 있으며, 내면의 성장을 향해 나아가고 있습니다.',
    personalityFlow: '안정적이고 조화를 중시하며, 주변과의 균형을 자연스럽게 이끌어가는 성향입니다.',
    strengths: ['균형감', '회복력', '배려', '안정성'],
    shadows: ['우유부단', '자기표현 부족', '과도한 배려', '자기희생'],
    coachingMessages: [
      '당신은 이미 회복의 길 위에 있습니다. 천천히, 자신의 속도로 걸어가세요.',
      '균형을 찾는 당신의 노력이 아름답습니다. 오늘은 자신의 감정을 솔직하게 표현해 보세요.',
    ],
  },
  {
    id: 'teal',
    name: 'TEAL',
    korName: '틸',
    hex: '#4AADA8',
    keywords: ['명료함', '통찰', '치유'],
    recovery: '감정 정화',
    complementColors: ['코랄', '피치'],
    psychologyFlow: '깊은 통찰력과 치유의 에너지가 흐르고 있으며, 명료한 시각으로 상황을 바라보고 있습니다.',
    personalityFlow: '직관적이고 통찰력이 뛰어나며, 감정과 이성의 균형을 잘 유지하는 성향입니다.',
    strengths: ['통찰력', '치유력', '명료함', '균형'],
    shadows: ['감정 억압', '고립', '과도한 분석', '거리감'],
    coachingMessages: [
      '당신의 깊은 통찰력은 큰 선물입니다. 그 지혜를 자신을 치유하는 데도 사용해 보세요.',
      '명료하게 보는 눈을 가진 당신, 오늘은 자신의 감정도 그렇게 바라봐 주세요.',
    ],
  },
  {
    id: 'blue',
    name: 'BLUE',
    korName: '블루',
    hex: '#5B8DB8',
    keywords: ['책임감', '신뢰', '침묵'],
    recovery: '감정 표현',
    complementColors: ['핑크', '터콰이즈'],
    psychologyFlow: '책임감과 신뢰를 바탕으로 묵묵히 자신의 역할을 다하고 있지만, 감정을 표현할 공간이 필요합니다.',
    personalityFlow: '신뢰할 수 있고 책임감이 강하며, 깊이 생각하고 행동하는 성향을 가지고 있습니다.',
    strengths: ['신뢰감', '책임감', '깊이', '안정성'],
    shadows: ['감정 억압', '과도한 책임', '소통 부족', '고독'],
    coachingMessages: [
      '당신은 충분히 오래 버텨왔습니다. 이제는 자신의 감정을 표현할 용기를 내어 보세요.',
      '신뢰받는 당신이지만, 오늘은 누군가에게 기대어도 괜찮습니다.',
    ],
  },
  {
    id: 'indigo',
    name: 'INDIGO',
    korName: '인디고',
    hex: '#5C6BC0',
    keywords: ['직관', '깊이', '탐구'],
    recovery: '현실 연결',
    complementColors: ['오렌지', '골드'],
    psychologyFlow: '깊은 내면의 탐구와 직관적인 에너지가 활발하게 작동하고 있습니다.',
    personalityFlow: '철학적이고 탐구적이며, 깊이 있는 사고와 직관을 중시하는 성향입니다.',
    strengths: ['직관력', '깊이', '탐구심', '창의성'],
    shadows: ['현실 도피', '고립', '과도한 내성', '소통 부족'],
    coachingMessages: [
      '깊은 생각 속에 있는 당신, 오늘은 그 생각을 누군가와 나누어 보세요.',
      '내면의 지혜를 현실에서 표현할 때, 당신의 빛이 더욱 빛납니다.',
    ],
  },
  {
    id: 'violet',
    name: 'VIOLET',
    korName: '바이올렛',
    hex: '#9B59B6',
    keywords: ['영성', '변화', '고귀함'],
    recovery: '현실 수용',
    complementColors: ['옐로우', '골드'],
    psychologyFlow: '변화와 성장에 대한 깊은 열망이 있으며, 영적인 차원에서의 탐구가 활발합니다.',
    personalityFlow: '이상적이고 창의적이며, 아름다움과 의미를 추구하는 성향을 가지고 있습니다.',
    strengths: ['창의성', '영감', '이상주의', '변화 수용'],
    shadows: ['현실 도피', '완벽주의', '고독', '이상과 현실의 괴리'],
    coachingMessages: [
      '당신의 이상은 아름답습니다. 오늘은 그 이상을 작은 현실로 만들어 보세요.',
      '변화를 꿈꾸는 당신, 지금 이 순간도 충분히 소중합니다.',
    ],
  },
  {
    id: 'pink',
    name: 'PINK',
    korName: '핑크',
    hex: '#E8849A',
    keywords: ['따뜻함', '배려', '감성'],
    recovery: '자존감 회복',
    complementColors: ['골드', '코랄'],
    psychologyFlow: '따뜻하고 감성적인 에너지가 흐르고 있으며, 타인에 대한 깊은 배려심이 있습니다.',
    personalityFlow: '감성적이고 따뜻하며, 관계를 소중히 여기고 배려하는 성향을 가지고 있습니다.',
    strengths: ['따뜻함', '공감능력', '배려', '감성'],
    shadows: ['자기희생', '낮은 자존감', '의존성', '감정 과부하'],
    coachingMessages: [
      '타인을 위해 많이 쏟아온 당신, 오늘은 그 따뜻함을 자신에게도 주세요.',
      '당신의 배려는 충분합니다. 이제는 자신을 사랑하는 연습을 해보세요.',
    ],
  },
  {
    id: 'magenta',
    name: 'MAGENTA',
    korName: '마젠타',
    hex: '#C2478A',
    keywords: ['열정', '변화', '강렬함'],
    recovery: '내면 안정',
    complementColors: ['그린', '민트'],
    psychologyFlow: '강렬한 에너지와 변화에 대한 열망이 있으며, 새로운 시작을 향한 의지가 강합니다.',
    personalityFlow: '강렬하고 열정적이며, 변화를 주도하고 새로운 것을 추구하는 성향입니다.',
    strengths: ['열정', '변화 주도', '강인함', '창의성'],
    shadows: ['감정 기복', '충동성', '과도한 강렬함', '불안정'],
    coachingMessages: [
      '강렬한 에너지를 가진 당신, 오늘은 그 에너지를 부드럽게 흐르도록 해보세요.',
      '변화를 원하는 마음은 좋습니다. 먼저 내면의 안정을 찾는 것부터 시작해 보세요.',
    ],
  },
  {
    id: 'coral',
    name: 'CORAL',
    korName: '코랄',
    hex: '#E8735A',
    keywords: ['활기', '온기', '소통'],
    recovery: '자기 돌봄',
    complementColors: ['틸', '세이지그린'],
    psychologyFlow: '활기차고 따뜻한 에너지가 흐르며, 사람들과의 연결을 통해 활력을 얻는 시기입니다.',
    personalityFlow: '활기차고 따뜻하며, 관계 속에서 에너지를 얻는 외향적인 성향입니다.',
    strengths: ['활기', '온기', '소통력', '친화력'],
    shadows: ['자기 소홀', '과도한 사교', '감정 소진', '경계 부족'],
    coachingMessages: [
      '활기찬 당신이지만, 오늘은 자신을 위한 조용한 시간도 필요합니다.',
      '따뜻한 에너지를 나누는 당신, 자신도 그 온기를 받을 자격이 있습니다.',
    ],
  },
  {
    id: 'gold',
    name: 'GOLD',
    korName: '골드',
    hex: '#C4A832',
    keywords: ['풍요', '자신감', '성취'],
    recovery: '겸손과 수용',
    complementColors: ['바이올렛', '인디고'],
    psychologyFlow: '성취와 풍요를 향한 강한 의지가 있으며, 자신의 가치를 인정받고 싶은 마음이 있습니다.',
    personalityFlow: '자신감 있고 목표 지향적이며, 성취와 인정을 중요하게 여기는 성향입니다.',
    strengths: ['자신감', '성취력', '리더십', '풍요로움'],
    shadows: ['자만심', '과도한 경쟁', '인정 욕구', '물질주의'],
    coachingMessages: [
      '당신의 성취는 빛납니다. 오늘은 그 빛을 나누는 기쁨을 경험해 보세요.',
      '강함보다 지금 당신에게 필요한 것은 마음의 여유입니다.',
    ],
  },
  {
    id: 'brown',
    name: 'BROWN',
    korName: '브라운',
    hex: '#8B6355',
    keywords: ['안정', '신뢰', '현실'],
    recovery: '유연성 회복',
    complementColors: ['스카이블루', '민트'],
    psychologyFlow: '안정적이고 현실적인 에너지가 흐르며, 신뢰와 기반을 중시하는 시기입니다.',
    personalityFlow: '안정적이고 신뢰할 수 있으며, 현실적이고 실용적인 성향을 가지고 있습니다.',
    strengths: ['안정성', '신뢰감', '현실감각', '인내'],
    shadows: ['경직성', '변화 거부', '고집', '유연성 부족'],
    coachingMessages: [
      '안정을 추구하는 당신, 때로는 새로운 흐름에 몸을 맡겨보는 것도 좋습니다.',
      '견고한 기반 위에 서 있는 당신, 이제는 그 위에서 자유롭게 춤춰도 됩니다.',
    ],
  },
  {
    id: 'beige',
    name: 'BEIGE',
    korName: '베이지',
    hex: '#D4C4A8',
    keywords: ['편안함', '자연', '소박함'],
    recovery: '자기 인식',
    complementColors: ['테라코타', '올리브'],
    psychologyFlow: '편안하고 자연스러운 에너지 속에 있으며, 소박함과 진정성을 추구하는 시기입니다.',
    personalityFlow: '편안하고 자연스러우며, 복잡함보다 단순함을 선호하는 성향입니다.',
    strengths: ['편안함', '자연스러움', '진정성', '소박함'],
    shadows: ['무기력', '자기 과소평가', '소극성', '변화 회피'],
    coachingMessages: [
      '소박하지만 깊이 있는 당신, 그 진정성이 당신의 가장 큰 매력입니다.',
      '편안함 속에 있는 당신, 오늘은 자신의 가능성을 조금 더 믿어보세요.',
    ],
  },
  {
    id: 'cream',
    name: 'CREAM',
    korName: '크림',
    hex: '#F5EDD8',
    keywords: ['부드러움', '온화함', '평화'],
    recovery: '에너지 충전',
    complementColors: ['코랄', '테라코타'],
    psychologyFlow: '부드럽고 온화한 에너지 속에 있으며, 내면의 평화를 찾아가는 과정에 있습니다.',
    personalityFlow: '온화하고 평화로우며, 갈등을 피하고 조화를 추구하는 성향입니다.',
    strengths: ['온화함', '평화로움', '조화', '부드러움'],
    shadows: ['우유부단', '갈등 회피', '자기주장 부족', '에너지 부족'],
    coachingMessages: [
      '부드러운 당신이지만, 때로는 자신의 목소리를 내는 것도 필요합니다.',
      '평화를 사랑하는 당신, 오늘은 자신을 위한 에너지를 충전해 보세요.',
    ],
  },
  {
    id: 'white',
    name: 'WHITE',
    korName: '화이트',
    hex: '#F0EDE6',
    keywords: ['정화', '리셋', '비움'],
    recovery: '생기 회복',
    complementColors: ['코랄', '옐로우'],
    psychologyFlow: '정화와 새로운 시작을 원하는 마음이 있으며, 과거를 내려놓고 새롭게 시작하려는 의지가 있습니다.',
    personalityFlow: '순수하고 깔끔하며, 새로운 시작과 변화를 받아들이는 성향을 가지고 있습니다.',
    strengths: ['순수함', '정화력', '새로운 시작', '명료함'],
    shadows: ['공허함', '방향 상실', '과도한 완벽주의', '감정 부재'],
    coachingMessages: [
      '비워낸 공간에 새로운 것이 채워집니다. 지금의 비움은 새로운 시작의 준비입니다.',
      '깨끗하게 시작하고 싶은 당신, 그 마음 자체가 이미 아름다운 시작입니다.',
    ],
  },
  {
    id: 'silver',
    name: 'SILVER',
    korName: '실버',
    hex: '#B0B8C0',
    keywords: ['성찰', '지혜', '중립'],
    recovery: '감정 연결',
    complementColors: ['골드', '코랄'],
    psychologyFlow: '성찰적이고 중립적인 에너지 속에서 지혜를 찾아가는 과정에 있습니다.',
    personalityFlow: '성찰적이고 지혜로우며, 감정보다 이성을 중시하는 성향을 가지고 있습니다.',
    strengths: ['지혜', '성찰력', '중립성', '객관성'],
    shadows: ['감정 단절', '냉담함', '과도한 분석', '거리감'],
    coachingMessages: [
      '지혜로운 당신, 오늘은 머리가 아닌 가슴으로 느껴보는 시간을 가져보세요.',
      '성찰하는 당신의 모습이 아름답습니다. 그 지혜를 자신을 위해 사용해 보세요.',
    ],
  },
  {
    id: 'black',
    name: 'BLACK',
    korName: '블랙',
    hex: '#3A3530',
    keywords: ['깊이', '보호', '경계'],
    recovery: '빛과 연결',
    complementColors: ['화이트', '골드'],
    psychologyFlow: '깊은 내면의 보호막을 치고 있으며, 외부로부터 자신을 지키려는 에너지가 강합니다.',
    personalityFlow: '깊이 있고 신중하며, 자신만의 경계를 명확히 하는 성향을 가지고 있습니다.',
    strengths: ['깊이', '신중함', '보호력', '경계 설정'],
    shadows: ['고립', '폐쇄성', '두려움', '과도한 방어'],
    coachingMessages: [
      '자신을 보호하는 것은 중요합니다. 하지만 때로는 그 문을 조금 열어도 괜찮습니다.',
      '깊은 내면을 가진 당신, 그 깊이를 빛과 연결할 때 더욱 빛납니다.',
    ],
  },
  {
    id: 'olive',
    name: 'OLIVE',
    korName: '올리브',
    hex: '#8A9A5B',
    keywords: ['지혜', '성숙', '조화'],
    recovery: '자기 표현',
    complementColors: ['코랄', '테라코타'],
    psychologyFlow: '성숙하고 지혜로운 에너지가 흐르며, 조화와 균형을 통해 성장하는 시기입니다.',
    personalityFlow: '성숙하고 지혜로우며, 다양한 관점을 수용하는 균형 잡힌 성향입니다.',
    strengths: ['지혜', '성숙함', '균형', '포용력'],
    shadows: ['자기 표현 부족', '과도한 중재', '자기희생', '소극성'],
    coachingMessages: [
      '성숙한 당신이지만, 오늘은 자신의 감정을 솔직하게 표현해 보세요.',
      '지혜로운 당신의 목소리가 필요합니다. 용기 내어 말해보세요.',
    ],
  },
  {
    id: 'mint',
    name: 'MINT',
    korName: '민트',
    hex: '#7EC8C0',
    keywords: ['신선함', '치유', '청량감'],
    recovery: '깊은 휴식',
    complementColors: ['코랄', '피치'],
    psychologyFlow: '신선하고 치유적인 에너지가 흐르며, 새로운 시작과 회복을 향해 나아가고 있습니다.',
    personalityFlow: '신선하고 활기차며, 치유와 회복의 에너지를 자연스럽게 발산하는 성향입니다.',
    strengths: ['치유력', '신선함', '회복력', '청량감'],
    shadows: ['과도한 활동', '깊은 휴식 부족', '표면적 치유', '내면 회피'],
    coachingMessages: [
      '신선한 에너지를 가진 당신, 오늘은 깊은 휴식으로 그 에너지를 충전해 보세요.',
      '치유의 에너지를 가진 당신, 자신을 치유하는 것도 잊지 마세요.',
    ],
  },
  {
    id: 'skyblue',
    name: 'SKY BLUE',
    korName: '스카이블루',
    hex: '#87CEEB',
    keywords: ['자유', '희망', '개방성'],
    recovery: '현실 집중',
    complementColors: ['코랄', '오렌지'],
    psychologyFlow: '자유롭고 개방적인 에너지가 흐르며, 가능성과 희망을 향해 시선이 향해 있습니다.',
    personalityFlow: '자유롭고 개방적이며, 새로운 가능성을 탐색하는 것을 즐기는 성향입니다.',
    strengths: ['자유로움', '개방성', '희망', '가능성'],
    shadows: ['현실 도피', '집중력 부족', '책임 회피', '불안정'],
    coachingMessages: [
      '자유를 꿈꾸는 당신, 오늘은 그 꿈을 현실에서 한 걸음 실현해 보세요.',
      '넓은 하늘을 바라보는 당신, 발 아래 땅도 함께 느껴보세요.',
    ],
  },
  {
    id: 'lavender',
    name: 'LAVENDER',
    korName: '라벤더',
    hex: '#B8A8D0',
    keywords: ['평온', '치유', '섬세함'],
    recovery: '자기 돌봄',
    complementColors: ['골드', '크림'],
    psychologyFlow: '섬세하고 평온한 에너지 속에서 치유와 회복을 경험하고 있는 시기입니다.',
    personalityFlow: '섬세하고 감성적이며, 아름다움과 평온함을 추구하는 성향을 가지고 있습니다.',
    strengths: ['섬세함', '치유력', '평온함', '감성'],
    shadows: ['과민함', '자기 소홀', '감정 과부하', '경계 부족'],
    coachingMessages: [
      '섬세한 당신, 오늘은 자신을 위한 특별한 돌봄의 시간을 가져보세요.',
      '평온함을 추구하는 당신, 그 평온함이 이미 당신 안에 있습니다.',
    ],
  },
  {
    id: 'peach',
    name: 'PEACH',
    korName: '피치',
    hex: '#FFBE9F',
    keywords: ['따뜻함', '친근함', '부드러움'],
    recovery: '자기 사랑',
    complementColors: ['세이지그린', '틸'],
    psychologyFlow: '따뜻하고 친근한 에너지가 흐르며, 관계 속에서 편안함과 안정을 찾는 시기입니다.',
    personalityFlow: '따뜻하고 친근하며, 관계에서 편안함을 주고받는 것을 중요하게 여기는 성향입니다.',
    strengths: ['따뜻함', '친근함', '부드러움', '친화력'],
    shadows: ['자기 소홀', '과도한 배려', '경계 부족', '자기 사랑 부족'],
    coachingMessages: [
      '따뜻한 당신, 오늘은 그 따뜻함으로 자신을 감싸 주세요.',
      '친근한 에너지를 가진 당신, 자신에게도 그 친근함을 보여주세요.',
    ],
  },
  {
    id: 'terracotta',
    name: 'TERRACOTTA',
    korName: '테라코타',
    hex: '#C4704A',
    keywords: ['대지', '안정', '열정'],
    recovery: '내면 평화',
    complementColors: ['스카이블루', '민트'],
    psychologyFlow: '대지의 에너지처럼 안정적이면서도 열정적인 에너지가 공존하는 시기입니다.',
    personalityFlow: '안정적이고 현실적이면서도 열정적인 면을 가진 균형 잡힌 성향입니다.',
    strengths: ['안정성', '열정', '현실감각', '따뜻함'],
    shadows: ['고집', '과도한 열정', '유연성 부족', '내면 갈등'],
    coachingMessages: [
      '대지처럼 안정적인 당신, 오늘은 내면의 평화를 찾는 시간을 가져보세요.',
      '열정과 안정이 공존하는 당신, 그 균형이 당신의 강점입니다.',
    ],
  },
  {
    id: 'sage',
    name: 'SAGE',
    korName: '세이지',
    hex: '#8FA68E',
    keywords: ['치유', '자연', '균형'],
    recovery: '자기 표현',
    complementColors: ['코랄', '피치'],
    psychologyFlow: '자연과 연결된 치유의 에너지가 흐르며, 내면의 균형을 찾아가는 과정에 있습니다.',
    personalityFlow: '자연스럽고 치유적이며, 균형과 조화를 중시하는 성향을 가지고 있습니다.',
    strengths: ['치유력', '자연스러움', '균형', '평온함'],
    shadows: ['자기 표현 부족', '소극성', '자기희생', '무기력'],
    coachingMessages: [
      '자연처럼 치유의 에너지를 가진 당신, 오늘은 자신의 감정을 자연스럽게 표현해 보세요.',
      '균형을 찾는 당신의 여정이 아름답습니다. 천천히, 자신의 속도로 가세요.',
    ],
  },
];

export function getColorById(id: string): ColorData | undefined {
  return COLOR_DATA.find((c) => c.id === id);
}

export function generateInterpretation(
  card1: ColorData,
  card2: ColorData,
  card3: ColorData
): {
  psychologyFlow: string;
  personalityFlow: string;
  strengths: string[];
  shadows: string[];
  complementColors: string[];
  coachingMessage: string;
} {
  // 심리 흐름: 카드1(현재) + 카드2(내면) 조합
  const psychologyFlow = generatePsychologyFlow(card1, card2, card3);

  // 성격 흐름: 카드1 + 카드2 기반
  const personalityFlow = generatePersonalityFlow(card1, card2);

  // 장점: 3가지 컬러에서 각 1-2개씩 선택
  const strengths = [
    ...card1.strengths.slice(0, 2),
    card2.strengths[0],
    card3.strengths[0],
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  // 그림자: 카드1 + 카드2에서 선택
  const shadows = [
    ...card1.shadows.slice(0, 2),
    card2.shadows[0],
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

  // 보완 컬러: 카드3(회복 방향) 기반
  const complementColors = card3.complementColors;

  // 코칭 메시지: 카드3(회복 방향) 기반으로 선택
  const messages = [...card3.coachingMessages, ...card1.coachingMessages];
  const coachingMessage = messages[Math.floor(Math.random() * Math.min(2, messages.length))];

  return {
    psychologyFlow,
    personalityFlow,
    strengths,
    shadows,
    complementColors,
    coachingMessage,
  };
}

function generatePsychologyFlow(card1: ColorData, card2: ColorData, card3: ColorData): string {
  const combos: Record<string, string> = {
    'red_blue_white': '겉으로는 강하게 버티고 있지만 내면에는 지친 감정이 남아 있습니다. 정화와 새로운 시작이 필요한 시기입니다.',
    'red_blue': '강한 추진력과 책임감이 공존하지만, 감정을 억누르고 있을 수 있습니다.',
    'blue_white': '책임감 있게 살아왔지만, 이제는 비우고 새롭게 시작할 준비가 되어 있습니다.',
    'green_pink': '회복과 배려의 에너지가 흐르며, 자신과 타인 모두를 돌보는 시기입니다.',
    'yellow_blue': '생각이 많고 소통을 원하지만, 내면에서는 안정을 찾고 있습니다.',
  };

  const key1 = `${card1.id}_${card2.id}_${card3.id}`;
  const key2 = `${card1.id}_${card2.id}`;
  const key3 = `${card2.id}_${card3.id}`;

  if (combos[key1]) return combos[key1];
  if (combos[key2]) return combos[key2];
  if (combos[key3]) return combos[key3];

  return `${card1.psychologyFlow} 내면에서는 ${card2.keywords[0]}의 에너지가 흐르고 있으며, ${card3.recovery}이 필요한 시기입니다.`;
}

function generatePersonalityFlow(card1: ColorData, card2: ColorData): string {
  return `${card1.personalityFlow} 내면적으로는 ${card2.keywords[0]}와 ${card2.keywords[1]}의 특성을 가지고 있습니다.`;
}
