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
    psychologyFlow: '지금 겉으로는 강하게 달리고 있지만,\n그 안에는 쉬고 싶은 마음이 조용히 쌓여 있습니다.',
    personalityFlow: '혼자서도 잘 해내려는 성향이 강하고,\n멈추는 것을 허락하지 않는 내면의 목소리가 있습니다.\n스스로에게 충분히 잘하고 있다고 말해주는 연습이 필요합니다.',
    strengths: ['추진력', '열정', '용기', '집중력'],
    shadows: ['긴장 과부하', '감정 억누름', '쉬지 못함'],
    coachingMessages: [
      '충분히 오래 달려왔습니다.\n지금은 잠시 멈추어 숨을 고르는 시간이 필요합니다.',
      '강하게 버텨온 마음에도\n따뜻한 쉼이 필요합니다.',
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
    psychologyFlow: '밝고 활기찬 에너지로 주변을 채우고 있지만,\n내면 깊은 곳에서는 조용히 자신을 돌아볼 시간이 필요합니다.',
    personalityFlow: '관계 속에서 에너지를 얻고,\n표현하고 나누는 것을 통해 살아있음을 느끼는 성향입니다.\n다만 혼자만의 고요한 시간이 부족할 수 있습니다.',
    strengths: ['창의성', '활력', '따뜻한 사교성', '유머'],
    shadows: ['내면 소홀', '감정 소진', '집중력 분산'],
    coachingMessages: [
      '밝은 에너지로 많이 나누어왔습니다.\n오늘은 그 빛을 자신에게도 비춰 주세요.',
      '활기찬 하루를 보냈다면,\n저녁에는 조용히 자신과 대화하는 시간을 가져보세요.',
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
    psychologyFlow: '머릿속에 생각이 많이 흐르고 있습니다.\n희망을 품고 있지만, 그 생각들이 마음을 분주하게 만들고 있습니다.',
    personalityFlow: '아이디어가 풍부하고 소통을 좋아하지만,\n생각이 앞서다 보니 마음이 쉬지 못하는 패턴이 있습니다.\n때로는 생각을 내려놓고 그냥 느끼는 연습이 필요합니다.',
    strengths: ['지성', '소통력', '희망', '창의적 사고'],
    shadows: ['과도한 생각', '마음의 분주함', '결정 어려움'],
    coachingMessages: [
      '생각이 많은 당신,\n지금은 머릿속을 비우고 몸의 감각에 집중해 보세요.',
      '천천히 자신 안의 고요함을 찾아보세요.\n그 안에 답이 있습니다.',
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
    psychologyFlow: '회복의 흐름 속에 있습니다.\n균형을 찾아가는 과정에서 내면이 조금씩 자라고 있습니다.',
    personalityFlow: '조화를 중시하고 갈등을 피하려는 성향이 있습니다.\n타인을 배려하다 보니 자신의 감정을 표현하는 것이 어색할 수 있습니다.',
    strengths: ['균형감', '회복력', '배려', '안정성'],
    shadows: ['자기표현 어려움', '과도한 배려', '감정 안으로 담기'],
    coachingMessages: [
      '이미 회복의 길 위에 있습니다.\n천천히, 자신의 속도로 걸어가세요.',
      '오늘은 자신의 감정을 솔직하게 표현해 보세요.\n그것이 진정한 회복의 시작입니다.',
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
    psychologyFlow: '깊은 곳에서 무언가를 정리하고 있는 시기입니다.\n명료하게 보고 싶지만, 감정이 아직 정리되지 않은 느낌이 있습니다.',
    personalityFlow: '직관적으로 상황을 파악하고 혼자 정리하는 성향이 있습니다.\n감정을 안으로 담아두다 보니 가까운 사람에게도 거리감을 줄 수 있습니다.',
    strengths: ['통찰력', '치유력', '명료함', '균형'],
    shadows: ['감정 안으로 담기', '혼자 정리하는 패턴', '거리감'],
    coachingMessages: [
      '깊이 보는 눈을 가진 당신,\n오늘은 자신의 감정도 그렇게 따뜻하게 바라봐 주세요.',
      '혼자 감당해온 것들을 조금씩 내려놓아도 됩니다.',
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
    psychologyFlow: '묵묵히 자신의 역할을 다해왔지만,\n내면에는 감정을 표현하고 싶은 마음이 조용히 쌓여 있습니다.',
    personalityFlow: '책임감이 강하고 혼자 견디는 성향이 있습니다.\n감정을 표현하는 것이 약함처럼 느껴져 안으로 담아두는 패턴이 있습니다.',
    strengths: ['신뢰감', '책임감', '깊이', '안정성'],
    shadows: ['감정 억압', '혼자 감당하기', '소통 어려움'],
    coachingMessages: [
      '충분히 오래 버텨왔습니다.\n이제는 자신의 감정을 표현할 용기를 내어 보세요.',
      '신뢰받는 당신이지만,\n오늘은 누군가에게 기대어도 괜찮습니다.',
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
    psychologyFlow: '내면 깊은 곳에서 무언가를 탐구하고 있습니다.\n생각이 깊어질수록 현실과의 거리가 멀어지는 느낌이 있습니다.',
    personalityFlow: '혼자 깊이 생각하고 정리하는 성향이 강합니다.\n내면의 세계가 풍부하지만, 그것을 나누는 것이 어색할 수 있습니다.',
    strengths: ['직관력', '깊이', '탐구심', '창의성'],
    shadows: ['현실과의 거리감', '고립 패턴', '소통 어려움'],
    coachingMessages: [
      '깊은 생각 속에 있는 당신,\n오늘은 그 생각을 누군가와 나누어 보세요.',
      '내면의 지혜를 현실에서 표현할 때,\n당신의 빛이 더욱 빛납니다.',
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
    psychologyFlow: '변화와 성장을 향한 열망이 있지만,\n이상과 현실 사이에서 마음이 흔들리는 시기입니다.',
    personalityFlow: '이상적인 것을 추구하고 의미 있는 삶을 원하는 성향입니다.\n현실이 그 이상에 미치지 못할 때 내면에서 갈등이 생깁니다.',
    strengths: ['창의성', '영감', '이상주의', '변화 수용'],
    shadows: ['이상과 현실의 간극', '완벽주의 패턴', '현실 수용 어려움'],
    coachingMessages: [
      '당신의 이상은 아름답습니다.\n오늘은 그 이상을 작은 현실로 만들어 보세요.',
      '지금 이 순간도 충분히 소중합니다.\n변화는 천천히 와도 됩니다.',
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
    psychologyFlow: '타인을 위해 많은 에너지를 쏟아왔습니다.\n내면 깊은 곳에서는 자신도 돌봄을 받고 싶은 마음이 있습니다.',
    personalityFlow: '감성적이고 배려심이 깊지만,\n타인을 먼저 생각하다 보니 자신의 필요를 뒤로 미루는 패턴이 있습니다.',
    strengths: ['따뜻함', '공감능력', '배려', '감성'],
    shadows: ['자기 소홀', '낮은 자존감 패턴', '감정 소진'],
    coachingMessages: [
      '타인을 위해 많이 쏟아온 당신,\n오늘은 그 따뜻함을 자신에게도 주세요.',
      '당신의 배려는 충분합니다.\n이제는 자신을 사랑하는 연습을 해보세요.',
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
    psychologyFlow: '강렬한 에너지와 변화에 대한 열망이 있습니다.\n하지만 그 강렬함이 내면을 흔들리게 만들기도 합니다.',
    personalityFlow: '변화를 주도하고 강하게 표현하는 성향이 있습니다.\n감정 기복이 있을 수 있으며, 내면의 안정이 필요한 시기입니다.',
    strengths: ['열정', '변화 주도', '강인함', '창의성'],
    shadows: ['감정 기복', '내면 불안정', '충동적 패턴'],
    coachingMessages: [
      '강렬한 에너지를 가진 당신,\n오늘은 그 에너지를 부드럽게 흐르도록 해보세요.',
      '변화를 원하는 마음은 소중합니다.\n먼저 내면의 안정을 찾는 것부터 시작해 보세요.',
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
    psychologyFlow: '활기차고 따뜻한 에너지로 관계 속에서 살아가고 있습니다.\n하지만 그 과정에서 자신을 돌보는 시간이 부족했을 수 있습니다.',
    personalityFlow: '관계 속에서 에너지를 나누고 받는 것을 좋아하지만,\n자신의 경계를 지키는 것이 어색한 패턴이 있습니다.',
    strengths: ['활기', '온기', '소통력', '친화력'],
    shadows: ['자기 돌봄 부족', '감정 소진', '경계 설정 어려움'],
    coachingMessages: [
      '활기찬 당신이지만,\n오늘은 자신을 위한 조용한 시간도 필요합니다.',
      '따뜻한 에너지를 나누는 당신,\n자신도 그 온기를 받을 자격이 있습니다.',
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
    psychologyFlow: '성취를 향해 나아가고 있지만,\n내면에서는 인정받고 싶은 마음이 조용히 흐르고 있습니다.',
    personalityFlow: '목표 지향적이고 자신감이 있지만,\n인정받지 못할 때 내면에서 흔들리는 패턴이 있습니다.',
    strengths: ['자신감', '성취력', '리더십', '풍요로움'],
    shadows: ['인정 욕구', '비교하는 패턴', '마음의 여유 부족'],
    coachingMessages: [
      '강함보다 지금 당신에게 필요한 것은\n마음의 여유입니다.',
      '당신의 성취는 빛납니다.\n오늘은 그 빛을 자신에게도 나누어 주세요.',
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
    psychologyFlow: '안정적인 기반 위에 서 있지만,\n변화 앞에서 내면이 조금 경직되어 있는 느낌이 있습니다.',
    personalityFlow: '신뢰할 수 있고 현실적이지만,\n변화를 받아들이는 것이 불편하게 느껴지는 패턴이 있습니다.',
    strengths: ['안정성', '신뢰감', '현실감각', '인내'],
    shadows: ['변화 저항', '경직된 패턴', '유연성 부족'],
    coachingMessages: [
      '안정을 추구하는 당신,\n때로는 새로운 흐름에 몸을 맡겨보는 것도 좋습니다.',
      '견고한 기반 위에 서 있는 당신,\n이제는 그 위에서 자유롭게 움직여도 됩니다.',
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
    psychologyFlow: '편안하고 자연스러운 흐름 속에 있지만,\n자신의 가능성을 과소평가하는 마음이 있을 수 있습니다.',
    personalityFlow: '소박하고 진정성 있는 성향이지만,\n자신을 드러내는 것을 불편해하거나 뒤로 물러서는 패턴이 있습니다.',
    strengths: ['편안함', '자연스러움', '진정성', '소박함'],
    shadows: ['자기 과소평가', '소극적 패턴', '변화 회피'],
    coachingMessages: [
      '소박하지만 깊이 있는 당신,\n그 진정성이 당신의 가장 큰 매력입니다.',
      '오늘은 자신의 가능성을 조금 더 믿어보세요.\n당신은 충분히 빛납니다.',
    ],
  },
  {
    id: 'cream',
    name: 'CREAM',
    korName: '아이보리',
    hex: '#F5EDD8',
    keywords: ['온화함', '섬세함', '내면 평화'],
    recovery: '에너지 충전',
    complementColors: ['코랄', '테라코타'],
    psychologyFlow: '부드럽고 조용한 에너지 속에서 버티고 있지만,\n내면에는 잠시 쉬고 싶고 현실에서 거리를 두고 싶은 마음이 흐르고 있습니다.',
    personalityFlow: '온화하고 섬세한 성향이지만,\n갈등을 피하려는 경향이 강하고 감정을 안으로 담아두는 패턴이 있습니다.',
    strengths: ['온화함', '섬세함', '내면 평화', '조화'],
    shadows: ['감정 안으로 담기', '갈등 회피 패턴', '자기주장 어려움'],
    coachingMessages: [
      '조용히 버텨온 마음에도\n따뜻한 생기가 필요합니다.',
      '천천히 자신 안의 에너지를\n다시 깨워보세요.',
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
    psychologyFlow: '지금 많은 것을 비워내고 싶은 마음이 있습니다.\n새롭게 시작하고 싶지만, 어디서부터 시작해야 할지 막막한 느낌도 있습니다.',
    personalityFlow: '깨끗하게 정리하고 싶은 성향이 있지만,\n비워낸 자리에 무엇을 채울지 방향을 찾는 것이 어려울 수 있습니다.',
    strengths: ['순수함', '정화력', '새로운 시작', '명료함'],
    shadows: ['방향 상실감', '공허함 패턴', '생기 부족'],
    coachingMessages: [
      '비워낸 공간에 새로운 것이 채워집니다.\n지금의 비움은 새로운 시작의 준비입니다.',
      '깨끗하게 시작하고 싶은 마음,\n그 자체가 이미 아름다운 시작입니다.',
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
    psychologyFlow: '성찰하고 분석하는 에너지가 강하게 흐르고 있습니다.\n하지만 감정과의 연결이 조금 끊어진 느낌이 있습니다.',
    personalityFlow: '이성적으로 상황을 파악하고 중립을 유지하려는 성향이 있습니다.\n감정보다 논리를 앞세우다 보니 자신의 감정을 놓치는 패턴이 있습니다.',
    strengths: ['지혜', '성찰력', '중립성', '객관성'],
    shadows: ['감정 단절 패턴', '냉담함', '거리감'],
    coachingMessages: [
      '지혜로운 당신,\n오늘은 머리가 아닌 가슴으로 느껴보는 시간을 가져보세요.',
      '성찰하는 당신의 모습이 아름답습니다.\n그 지혜를 자신의 감정에도 사용해 보세요.',
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
    psychologyFlow: '내면 깊은 곳에서 자신을 보호하고 있습니다.\n외부로부터 거리를 두고 싶은 마음이 강하게 흐르고 있습니다.',
    personalityFlow: '신중하고 깊이 있는 성향이지만,\n자신을 드러내는 것이 두렵거나 불편한 패턴이 있습니다.',
    strengths: ['깊이', '신중함', '보호력', '경계 설정'],
    shadows: ['고립 패턴', '폐쇄적 경향', '과도한 방어'],
    coachingMessages: [
      '자신을 보호하는 것은 중요합니다.\n하지만 때로는 그 문을 조금 열어도 괜찮습니다.',
      '깊은 내면을 가진 당신,\n그 깊이를 빛과 연결할 때 더욱 빛납니다.',
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
    psychologyFlow: '성숙하고 균형 잡힌 에너지가 흐르고 있습니다.\n하지만 자신의 감정을 표현하는 것이 어색하게 느껴질 수 있습니다.',
    personalityFlow: '중재하고 조화를 이끌어가는 성향이 있지만,\n그 과정에서 자신의 목소리를 뒤로 미루는 패턴이 있습니다.',
    strengths: ['지혜', '성숙함', '균형', '포용력'],
    shadows: ['자기 표현 어려움', '과도한 중재', '자기희생 패턴'],
    coachingMessages: [
      '성숙한 당신이지만,\n오늘은 자신의 감정을 솔직하게 표현해 보세요.',
      '지혜로운 당신의 목소리가 필요합니다.\n용기 내어 말해보세요.',
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
    psychologyFlow: '신선하고 치유적인 에너지가 흐르고 있습니다.\n새로운 시작을 향해 나아가고 있지만, 깊은 휴식이 먼저 필요합니다.',
    personalityFlow: '치유와 회복의 에너지를 자연스럽게 발산하지만,\n자신이 먼저 충분히 쉬지 못하는 패턴이 있습니다.',
    strengths: ['치유력', '신선함', '회복력', '청량감'],
    shadows: ['자기 돌봄 부족', '깊은 휴식 어려움', '과도한 활동'],
    coachingMessages: [
      '치유의 에너지를 가진 당신,\n오늘은 자신을 먼저 치유해 주세요.',
      '신선한 시작을 원한다면,\n먼저 깊은 휴식이 필요합니다.',
    ],
  },
  {
    id: 'skyblue',
    name: 'SKYBLUE',
    korName: '스카이블루',
    hex: '#87CEEB',
    keywords: ['자유', '희망', '개방성'],
    recovery: '현실 집중',
    complementColors: ['코랄', '오렌지'],
    psychologyFlow: '자유롭고 싶은 마음이 강하게 흐르고 있습니다.\n현실에서 벗어나 가능성을 향해 시선이 향해 있습니다.',
    personalityFlow: '개방적이고 자유를 추구하지만,\n현실의 무게를 피하고 싶은 마음이 생기는 패턴이 있습니다.',
    strengths: ['자유로움', '개방성', '희망', '가능성'],
    shadows: ['현실 회피 경향', '집중력 분산', '책임 부담감'],
    coachingMessages: [
      '자유를 꿈꾸는 당신,\n오늘은 그 꿈을 현실에서 한 걸음 실현해 보세요.',
      '넓은 하늘을 바라보는 당신,\n발 아래 땅도 함께 느껴보세요.',
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
    psychologyFlow: '섬세하고 평온한 에너지 속에서 치유를 경험하고 있습니다.\n내면이 조용히 회복되는 시기입니다.',
    personalityFlow: '섬세하고 감성적이며 아름다움을 추구하지만,\n자신의 감정에 너무 예민하게 반응하는 패턴이 있습니다.',
    strengths: ['섬세함', '치유력', '평온함', '감성'],
    shadows: ['과민한 감정 패턴', '자기 소홀', '경계 설정 어려움'],
    coachingMessages: [
      '섬세한 당신,\n오늘은 자신을 위한 특별한 돌봄의 시간을 가져보세요.',
      '평온함이 이미 당신 안에 있습니다.\n그것을 느끼는 시간을 가져보세요.',
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
    psychologyFlow: '따뜻하고 친근한 에너지가 흐르고 있습니다.\n관계 속에서 편안함을 주지만, 자신을 사랑하는 연습이 필요합니다.',
    personalityFlow: '관계에서 편안함을 주고받는 것을 중요하게 여기지만,\n자신의 필요보다 타인의 필요를 먼저 채우는 패턴이 있습니다.',
    strengths: ['따뜻함', '친근함', '부드러움', '친화력'],
    shadows: ['자기 사랑 부족', '과도한 배려', '경계 설정 어려움'],
    coachingMessages: [
      '따뜻한 당신,\n오늘은 그 따뜻함으로 자신을 먼저 감싸 주세요.',
      '자신에게도 친근하게 대해주세요.\n당신은 그럴 자격이 있습니다.',
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
    psychologyFlow: '안정적인 에너지와 열정이 공존하고 있습니다.\n하지만 내면에서는 평화를 찾고 싶은 마음이 흐르고 있습니다.',
    personalityFlow: '현실적이고 열정적이지만,\n내면의 갈등을 혼자 감당하려는 패턴이 있습니다.',
    strengths: ['안정성', '열정', '현실감각', '따뜻함'],
    shadows: ['내면 갈등', '고집스러운 패턴', '유연성 부족'],
    coachingMessages: [
      '대지처럼 안정적인 당신,\n오늘은 내면의 평화를 찾는 시간을 가져보세요.',
      '열정과 안정이 공존하는 당신,\n그 균형이 당신의 강점입니다.',
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
    psychologyFlow: '자연과 연결된 치유의 에너지가 흐르고 있습니다.\n내면의 균형을 찾아가는 과정에서 자기 표현이 필요합니다.',
    personalityFlow: '균형과 조화를 중시하고 자연스럽게 치유하는 성향이 있지만,\n자신의 감정을 표현하는 것이 어색하게 느껴지는 패턴이 있습니다.',
    strengths: ['치유력', '자연스러움', '균형', '평온함'],
    shadows: ['자기 표현 어려움', '소극적 패턴', '자기희생'],
    coachingMessages: [
      '자연처럼 치유의 에너지를 가진 당신,\n오늘은 자신의 감정을 자연스럽게 표현해 보세요.',
      '균형을 찾는 당신의 여정이 아름답습니다.\n천천히, 자신의 속도로 가세요.',
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
  const psychologyFlow = generatePsychologyFlow(card1, card2, card3);
  const personalityFlow = generatePersonalityFlow(card1, card2);

  // 장점: 3가지 컬러에서 각 1-2개씩 선택, 중복 제거
  const strengths = [
    ...card1.strengths.slice(0, 2),
    card2.strengths[0],
    card3.strengths[0],
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 4);

  // 감정 패턴: 카드1 + 카드2에서 선택
  const shadows = [
    ...card1.shadows.slice(0, 2),
    card2.shadows[0],
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3);

  // 보완 컬러: 카드3(회복 방향) 기반
  const complementColors = card3.complementColors;

  // 코칭 메시지: 카드3 기반 우선, 카드1 보조
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
  // 주요 조합별 맞춤 해석
  const combos: Record<string, string> = {
    // 레드 조합
    'red_blue_white': '겉으로는 강하게 버티고 있지만,\n내면에는 지친 감정이 조용히 쌓여 있습니다.\n정화와 새로운 시작이 필요한 시기입니다.',
    'red_blue_green': '강한 추진력으로 달려왔지만,\n내면에서는 균형과 회복을 원하고 있습니다.',
    'red_green_white': '열정적으로 살아왔지만,\n이제는 비우고 자연스럽게 회복할 시간이 필요합니다.',
    // 블루 조합
    'blue_white_green': '책임감 있게 살아왔지만,\n내면에서는 비우고 새롭게 회복하고 싶은 마음이 흐릅니다.',
    'blue_green_pink': '신뢰와 배려의 에너지가 흐르고 있습니다.\n자신을 돌보는 시간이 필요한 시기입니다.',
    // 아이보리 + 스카이블루 조합
    'cream_skyblue_orange': '부드럽고 조용한 에너지 속에서 버티고 있지만,\n내면에는 잠시 쉬고 싶고 현실에서 거리를 두고 싶은 마음이 흐르고 있습니다.',
    // 그린 조합
    'green_pink_sage': '회복과 배려의 에너지가 흐르고 있습니다.\n자신과 타인 모두를 돌보는 따뜻한 시기입니다.',
    'green_blue_white': '균형을 찾아가고 있지만,\n내면에서는 감정을 표현하고 비워내고 싶은 마음이 있습니다.',
    // 옐로우 조합
    'yellow_blue_green': '생각이 많고 소통을 원하지만,\n내면에서는 안정과 균형을 찾고 있습니다.',
    // 화이트 조합
    'white_blue_green': '정화와 새로운 시작을 원하고 있습니다.\n책임감 있게 살아왔지만, 이제는 균형을 찾을 시간입니다.',
  };

  const key1 = `${card1.id}_${card2.id}_${card3.id}`;
  const key2 = `${card1.id}_${card2.id}`;
  const key3 = `${card2.id}_${card3.id}`;

  if (combos[key1]) return combos[key1];
  if (combos[key2]) return combos[key2];
  if (combos[key3]) return combos[key3];

  // 기본 조합 생성 - 감성적 문장으로
  return `${card1.psychologyFlow}\n내면에서는 ${card2.keywords[0]}의 에너지가 흐르고 있으며,\n${card3.recovery}이 필요한 시기입니다.`;
}

function generatePersonalityFlow(card1: ColorData, card2: ColorData): string {
  // 주요 조합별 맞춤 성격 흐름
  const personalityCombos: Record<string, string> = {
    'red_blue': '책임감이 강하고 혼자 견디는 성향이 있습니다.\n감정을 표현하는 것이 약함처럼 느껴져 안으로 담아두는 패턴이 있습니다.',
    'blue_white': '책임감 있게 살아왔지만,\n이제는 비우고 새롭게 시작하려는 내면의 흐름이 있습니다.',
    'green_pink': '배려심이 깊고 조화를 중시하지만,\n자신의 감정을 표현하는 것이 어색한 패턴이 있습니다.',
    'cream_skyblue': '온화하고 섬세한 성향이지만,\n갈등을 피하려는 경향이 강하고 감정을 안으로 담아두는 흐름이 있습니다.',
    'yellow_blue': '생각이 많고 소통을 원하지만,\n내면에서는 안정을 찾고 있습니다.',
    'pink_blue': '감성적이고 배려심이 깊지만,\n자신의 필요보다 타인의 필요를 먼저 채우는 패턴이 있습니다.',
  };

  const key = `${card1.id}_${card2.id}`;
  if (personalityCombos[key]) return personalityCombos[key];

  return `${card1.personalityFlow}\n내면적으로는 ${card2.keywords[0]}와 ${card2.keywords[1]}의 흐름이 함께 있습니다.`;
}
