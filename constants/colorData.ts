export interface ColorData {
  id: string;
  name: string;
  korName: string;
  hex: string;
  keywords: string[];
  recovery: string;
  complementColors: string[];
  // 1번 카드(무의식/내면 흐름)로 선택되었을 때의 설명
  innerFlow: string;
  // 2번 카드(현재 상태/심리 흐름)로 선택되었을 때의 설명
  psychologyFlow: string;
  // 성격 흐름 (1번+2번 카드 기반)
  personalityFlow: string;
  strengths: string[];
  shadows: string[];
  coachingMessages: string[];
  // 3번 카드(회복 방향)으로 선택되었을 때 생성할 코칭 메시지
  recoveryMessages: string[];
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
    innerFlow: '내면 깊은 곳에서 강한 에너지가 흐르고 있습니다.\n멈추지 않으려는 힘이 무의식 속에서 계속 작동하고 있습니다.',
    psychologyFlow: '지금 겉으로는 강하게 달리고 있지만,\n그 안에는 쉬고 싶은 마음이 조용히 쌓여 있습니다.',
    personalityFlow: '혼자서도 잘 해내려는 성향이 강하고,\n멈추는 것을 허락하지 않는 내면의 목소리가 있습니다.\n스스로에게 충분히 잘하고 있다고 말해주는 연습이 필요합니다.',
    strengths: ['추진력', '열정', '용기', '집중력'],
    shadows: ['긴장 과부하', '감정 억누름', '쉬지 못함'],
    coachingMessages: [
      '충분히 오래 달려왔습니다.\n지금은 잠시 멈추어 숨을 고르는 시간이 필요합니다.',
      '강하게 버텨온 마음에도\n따뜻한 쉬임이 필요합니다.',
    ],
    recoveryMessages: [
      '지치고 달려온 마음에,\n이제는 조용히 쉬어가도 됩니다.',
      '멈추는 것이 약함이 아닙니다.\n지금 당신에게 가장 필요한 에너지는 안정과 휴식입니다.',
      '강하게 달려온 만큼,\n천천히 자신을 돌보는 시간을 허락해 주세요.',
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
    innerFlow: '관계 속에서 에너지를 나누고 싶은 마음이 무의식 깊이 흐르고 있습니다.\n따뜻한 연결을 향한 갈망이 내면에 있습니다.',
    psychologyFlow: '밝고 활기찬 에너지로 주변을 채우고 있지만,\n내면 깊은 곳에서는 조용히 자신을 돌아볼 시간이 필요합니다.',
    personalityFlow: '관계 속에서 에너지를 얻고,\n표현하고 나누는 것을 통해 살아있음을 느끼는 성향입니다.\n다만 혼자만의 고요한 시간이 부족할 수 있습니다.',
    strengths: ['창의성', '활력', '따뜻한 사교성', '유머'],
    shadows: ['내면 소홀', '감정 소진', '집중력 분산'],
    coachingMessages: [
      '밝은 에너지로 많이 나누어왔습니다.\n오늘은 그 빛을 자신에게도 비춰 주세요.',
      '활기찬 하루를 보냈다면,\n저녁에는 조용히 자신과 대화하는 시간을 가져보세요.',
    ],
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
    keywords: ['생각', '희망', '소통'],
    recovery: '마음 안정',
    complementColors: ['올리브', '베이지'],
    innerFlow: '희망과 가능성을 향한 에너지가 내면에서 흐르고 있습니다.\n무언가를 이루고 싶은 마음이 조용히 움직이고 있습니다.',
    psychologyFlow: '머릿속에 생각이 많이 흐르고 있습니다.\n희망을 품고 있지만, 그 생각들이 마음을 분주하게 만들고 있습니다.',
    personalityFlow: '아이디어가 풍부하고 소통을 좋아하지만,\n생각이 앞서다 보니 마음이 쉬지 못하는 패턴이 있습니다.\n때로는 생각을 내려놓고 그냥 느끼는 연습이 필요합니다.',
    strengths: ['지성', '소통력', '희망', '창의적 사고'],
    shadows: ['과도한 생각', '마음의 분주함', '결정 어려움'],
    coachingMessages: [
      '생각이 많은 당신,\n지금은 머릿속을 비우고 몸의 감각에 집중해 보세요.',
      '천천히 자신 안의 고요함을 찾아보세요.\n그 안에 답이 있습니다.',
    ],
    recoveryMessages: [
      '분주한 생각들을 잠시 내려놓고,\n마음이 고요해지는 시간을 가져보세요.',
      '생각보다 느낌이 먼저입니다.\n지금 이 순간 몸의 감각에 집중해 보세요.',
      '마음이 안정될 때,\n진짜 원하는 것이 보이기 시작합니다.',
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
    innerFlow: '균형과 회복을 향한 에너지가 내면에서 조용히 흐르고 있습니다.\n자연스럽게 성장하고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '회복의 흐름 속에 있습니다.\n균형을 찾아가는 과정에서 내면이 조금씩 자라고 있습니다.',
    personalityFlow: '조화를 중시하고 갈등을 피하려는 성향이 있습니다.\n타인을 배려하다 보니 자신의 감정을 표현하는 것이 어색할 수 있습니다.',
    strengths: ['균형감', '회복력', '배려', '안정성'],
    shadows: ['자기표현 어려움', '과도한 배려', '감정 안으로 담기'],
    coachingMessages: [
      '이미 회복의 길 위에 있습니다.\n천천히, 자신의 속도로 걸어가세요.',
      '오늘은 자신의 감정을 솔직하게 표현해 보세요.\n그것이 진정한 회복의 시작입니다.',
    ],
    recoveryMessages: [
      '자신의 목소리를 내는 것이\n가장 자연스러운 회복의 시작입니다.',
      '안으로 담아왔던 감정을\n조금씩 표현해 보세요.',
      '균형은 자신을 표현할 때\n비로소 완성됩니다.',
    ],
  },
  {
    id: 'teal',
    name: 'TEAL',
    korName: '틸',
    hex: '#4A9A9A',
    keywords: ['통찰', '균형', '치유'],
    recovery: '감정 표현',
    complementColors: ['코랄', '피치'],
    innerFlow: '깊은 통찰과 치유를 향한 에너지가 내면에서 흐르고 있습니다.\n균형을 찾고 싶은 마음이 무의식 속에서 작동하고 있습니다.',
    psychologyFlow: '깊은 통찰력으로 상황을 바라보고 있지만,\n감정을 표현하는 것이 어렵게 느껴지는 시기입니다.',
    personalityFlow: '이성적이고 통찰력이 있지만,\n감정보다 분석이 앞서는 패턴이 있습니다.\n마음의 온기를 표현하는 연습이 필요합니다.',
    strengths: ['통찰력', '균형감', '치유력', '깊이'],
    shadows: ['감정 표현 어려움', '거리감', '과도한 분석'],
    coachingMessages: [
      '깊이 있는 당신,\n오늘은 그 깊이를 따뜻하게 표현해 보세요.',
      '분석보다 감정이 먼저일 때가 있습니다.\n마음의 소리에 귀 기울여 보세요.',
    ],
    recoveryMessages: [
      '마음의 온기를 표현하는 것이\n진정한 치유의 시작입니다.',
      '감정을 나누는 것이\n균형 회복의 열쇠입니다.',
      '따뜻한 표현 하나가\n관계를 더 깊게 만듭니다.',
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
    innerFlow: '책임감과 신뢰를 중요하게 여기는 에너지가 내면 깊이 흐르고 있습니다.\n혼자 감당하려는 마음이 무의식 속에 자리하고 있습니다.',
    psychologyFlow: '책임감 있게 살아왔지만,\n내면에서는 감정을 표현하고 싶은 마음이 조용히 흐르고 있습니다.',
    personalityFlow: '책임감이 강하고 혼자 견디는 성향이 있습니다.\n감정을 표현하는 것이 약함처럼 느껴져 안으로 담아두는 패턴이 있습니다.',
    strengths: ['책임감', '신뢰감', '집중력', '인내'],
    shadows: ['감정 억압', '혼자 감당하는 패턴', '외로움'],
    coachingMessages: [
      '혼자 감당해온 마음,\n오늘은 누군가에게 조금 기대어도 됩니다.',
      '신뢰받는 당신이지만,\n당신도 신뢰받을 자격이 있습니다.',
    ],
    recoveryMessages: [
      '안으로만 담아왔던 감정을\n조금씩 표현해 보세요.',
      '감정을 나누는 것이\n약함이 아니라 용기입니다.',
      '따뜻한 한마디가\n당신의 회복을 시작하게 합니다.',
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
    innerFlow: '깊은 내면에서 무언가를 탐구하고 이해하려는 에너지가 흐르고 있습니다.\n직관적인 앎을 향한 갈망이 무의식 속에 있습니다.',
    psychologyFlow: '내면 깊은 곳에서 무언가를 탐구하고 있습니다.\n생각이 깊어질수록 현실과의 거리가 멀어지는 느낌이 있습니다.',
    personalityFlow: '혼자 깊이 생각하고 정리하는 성향이 강합니다.\n내면의 세계가 풍부하지만, 그것을 나누는 것이 어색할 수 있습니다.',
    strengths: ['직관력', '깊이', '탐구심', '창의성'],
    shadows: ['현실과의 거리감', '고립 패턴', '소통 어려움'],
    coachingMessages: [
      '깊은 생각 속에 있는 당신,\n오늘은 그 생각을 누군가와 나누어 보세요.',
      '내면의 지혜를 현실에서 표현할 때,\n당신의 빛이 더욱 빛납니다.',
    ],
    recoveryMessages: [
      '생각 속에 오래 머물러 있었다면,\n이제는 현실의 따뜻함으로 돌아올 시간입니다.',
      '내면의 깊이를 현실과 연결할 때,\n진정한 성장이 시작됩니다.',
      '작은 일상의 온기가\n지금 당신에게 필요한 회복 에너지입니다.',
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
    innerFlow: '변화와 성장을 향한 열망이 내면 깊이 흐르고 있습니다.\n더 높은 무언가를 향한 갈망이 무의식 속에 자리하고 있습니다.',
    psychologyFlow: '변화와 성장을 향한 열망이 있지만,\n이상과 현실 사이에서 마음이 흔들리는 시기입니다.',
    personalityFlow: '이상적인 것을 추구하고 의미 있는 삶을 원하는 성향입니다.\n현실이 그 이상에 미치지 못할 때 내면에서 갈등이 생깁니다.',
    strengths: ['창의성', '영감', '이상주의', '변화 수용'],
    shadows: ['이상과 현실의 간극', '완벽주의 패턴', '현실 수용 어려움'],
    coachingMessages: [
      '당신의 이상은 아름답습니다.\n오늘은 그 이상을 작은 현실로 만들어 보세요.',
      '지금 이 순간도 충분히 소중합니다.\n변화는 천천히 와도 됩니다.',
    ],
    recoveryMessages: [
      '이상을 잠시 내려놓고,\n지금 이 순간의 현실을 따뜻하게 받아들여 보세요.',
      '완벽하지 않아도 괜찮습니다.\n지금 있는 그대로도 충분히 아름답습니다.',
      '현실 속 작은 것들에서\n진정한 의미를 발견해 보세요.',
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
    innerFlow: '따뜻함과 연결을 향한 에너지가 내면 깊이 흐르고 있습니다.\n사랑받고 싶고 사랑하고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '타인을 위해 많은 에너지를 쏟아왔습니다.\n내면 깊은 곳에서는 자신도 돌봄을 받고 싶은 마음이 있습니다.',
    personalityFlow: '감성적이고 배려심이 깊지만,\n타인을 먼저 생각하다 보니 자신의 필요를 뒤로 미루는 패턴이 있습니다.',
    strengths: ['따뜻함', '공감능력', '배려', '감성'],
    shadows: ['자기 소홀', '낮은 자존감 패턴', '감정 소진'],
    coachingMessages: [
      '타인을 위해 많이 쏟아온 당신,\n오늘은 그 따뜻함을 자신에게도 주세요.',
      '당신의 배려는 충분합니다.\n이제는 자신을 사랑하는 연습을 해보세요.',
    ],
    recoveryMessages: [
      '지금 당신에게 필요한 것은\n자신을 향한 따뜻한 시선입니다.',
      '타인에게 쏟아온 배려를\n이제는 자신에게 돌려주세요.',
      '당신은 충분히 사랑받을 자격이 있습니다.\n그 사실을 오늘 자신에게 말해주세요.',
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
    innerFlow: '강렬한 변화를 향한 에너지가 내면에서 흐르고 있습니다.\n무언가를 바꾸고 싶은 강한 충동이 무의식 속에 있습니다.',
    psychologyFlow: '강렬한 에너지와 변화에 대한 열망이 있습니다.\n하지만 그 강렬함이 내면을 흔들리게 만들기도 합니다.',
    personalityFlow: '변화를 주도하고 강하게 표현하는 성향이 있습니다.\n감정 기복이 있을 수 있으며, 내면의 안정이 필요한 시기입니다.',
    strengths: ['열정', '변화 주도', '강인함', '창의성'],
    shadows: ['감정 기복', '내면 불안정', '충동적 패턴'],
    coachingMessages: [
      '강렬한 에너지를 가진 당신,\n오늘은 그 에너지를 부드럽게 흐르도록 해보세요.',
      '변화를 원하는 마음은 소중합니다.\n먼저 내면의 안정을 찾는 것부터 시작해 보세요.',
    ],
    recoveryMessages: [
      '흔들리는 마음을 잠시 고요하게 두세요.\n안정 속에서 진짜 방향이 보입니다.',
      '강렬함을 잠시 내려놓고,\n내면의 고요한 중심을 찾아보세요.',
      '폭풍 같은 감정 뒤에는\n반드시 고요한 시간이 찾아옵니다.',
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
    innerFlow: '따뜻한 관계와 생기 있는 연결을 향한 에너지가 내면에서 흐르고 있습니다.\n온기와 소통을 향한 갈망이 무의식 속에 있습니다.',
    psychologyFlow: '활기차고 따뜻한 에너지로 관계 속에서 살아가고 있습니다.\n하지만 그 과정에서 자신을 돌보는 시간이 부족했을 수 있습니다.',
    personalityFlow: '관계 속에서 에너지를 나누고 받는 것을 좋아하지만,\n자신의 경계를 지키는 것이 어색한 패턴이 있습니다.',
    strengths: ['활기', '온기', '소통력', '친화력'],
    shadows: ['자기 돌봄 부족', '감정 소진', '경계 설정 어려움'],
    coachingMessages: [
      '활기찬 당신이지만,\n오늘은 자신을 위한 조용한 시간도 필요합니다.',
      '따뜻한 에너지를 나누는 당신,\n자신도 그 온기를 받을 자격이 있습니다.',
    ],
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
    keywords: ['풍요', '자신감', '성취'],
    recovery: '겸손과 수용',
    complementColors: ['바이올렛', '인디고'],
    innerFlow: '성취와 인정을 향한 에너지가 내면 깊이 흐르고 있습니다.\n자신의 가치를 빛내고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '성취를 향해 나아가고 있지만,\n내면에서는 인정받고 싶은 마음이 조용히 흐르고 있습니다.',
    personalityFlow: '목표 지향적이고 자신감이 있지만,\n인정받지 못할 때 내면에서 흔들리는 패턴이 있습니다.',
    strengths: ['자신감', '성취력', '리더십', '풍요로움'],
    shadows: ['인정 욕구', '비교하는 패턴', '마음의 여유 부족'],
    coachingMessages: [
      '강함보다 지금 당신에게 필요한 것은\n마음의 여유입니다.',
      '당신의 성취는 빛납니다.\n오늘은 그 빛을 자신에게도 나누어 주세요.',
    ],
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
    keywords: ['안정', '신뢰', '현실'],
    recovery: '유연성 회복',
    complementColors: ['스카이블루', '민트'],
    innerFlow: '안정과 신뢰를 향한 에너지가 내면 깊이 흐르고 있습니다.\n확실한 기반 위에 서고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '안정적인 기반 위에 서 있지만,\n변화 앞에서 내면이 조금 경직되어 있는 느낌이 있습니다.',
    personalityFlow: '신뢰할 수 있고 현실적이지만,\n변화를 받아들이는 것이 불편하게 느껴지는 패턴이 있습니다.',
    strengths: ['안정성', '신뢰감', '현실감각', '인내'],
    shadows: ['변화 저항', '경직된 패턴', '유연성 부족'],
    coachingMessages: [
      '안정을 추구하는 당신,\n때로는 새로운 흐름에 몸을 맡겨보는 것도 좋습니다.',
      '견고한 기반 위에 서 있는 당신,\n이제는 그 위에서 자유롭게 움직여도 됩니다.',
    ],
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
    keywords: ['온화함', '편안함', '자연스러움'],
    recovery: '자기 표현',
    complementColors: ['테라코타', '올리브'],
    innerFlow: '온화하고 편안한 에너지가 내면에서 조용히 흐르고 있습니다.\n자연스러운 흐름 속에 있고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '온화하고 편안한 에너지로 살아가고 있습니다.\n하지만 자신의 감정을 표현하는 것이 어색하게 느껴질 수 있습니다.',
    personalityFlow: '갈등을 피하고 조화를 중시하는 성향이 있습니다.\n자신의 의견보다 분위기를 맞추려는 패턴이 있습니다.',
    strengths: ['온화함', '편안함', '조화로움', '친화력'],
    shadows: ['자기 표현 어려움', '과도한 순응', '감정 억누름'],
    coachingMessages: [
      '온화한 당신이지만,\n오늘은 자신의 목소리를 내보세요.',
      '편안함 속에서도\n자신을 표현하는 용기가 필요합니다.',
    ],
    recoveryMessages: [
      '자신의 감정을 표현하는 것이\n가장 자연스러운 회복입니다.',
      '온화함을 유지하면서도\n자신의 목소리를 낼 수 있습니다.',
      '당신의 생각과 감정은\n충분히 표현될 자격이 있습니다.',
    ],
  },
  {
    id: 'cream',
    name: 'CREAM',
    korName: '아이보리',
    hex: '#F5EDD6',
    keywords: ['순수함', '고요함', '내면 보호'],
    recovery: '생기 회복',
    complementColors: ['코랄', '옐로우'],
    innerFlow: '고요하고 순수한 에너지가 내면 깊이 흐르고 있습니다.\n자신을 보호하고 싶은 마음이 무의식 속에 조용히 자리하고 있습니다.',
    psychologyFlow: '부드럽고 조용한 에너지 속에서 버티고 있지만,\n내면에는 잠시 쉬고 싶고 현실에서 거리를 두고 싶은 마음이 흐르고 있습니다.',
    personalityFlow: '온화하고 섬세한 성향이지만,\n갈등을 피하려는 경향이 강하고 감정을 안으로 담아두는 흐름이 있습니다.',
    strengths: ['순수함', '섬세함', '내면의 고요함', '온화함'],
    shadows: ['감정 억누름', '현실 회피 경향', '에너지 부족'],
    coachingMessages: [
      '조용히 버텨온 마음에도\n따뜻한 생기가 필요합니다.',
      '천천히 자신 안의 에너지를\n다시 깨워보세요.',
    ],
    recoveryMessages: [
      '조용히 머물러 있던 마음에\n따뜻한 생기와 연결이 필요합니다.',
      '작은 움직임 하나가\n내면의 에너지를 다시 깨웁니다.',
      '천천히, 자신의 속도로\n다시 세상과 연결되어 보세요.',
    ],
  },
  {
    id: 'white',
    name: 'WHITE',
    korName: '화이트',
    hex: '#F5F5F0',
    keywords: ['정화', '리셋', '비움'],
    recovery: '생기 회복',
    complementColors: ['코랄', '옐로우'],
    innerFlow: '정화와 새로운 시작을 향한 에너지가 내면에서 흐르고 있습니다.\n모든 것을 비우고 다시 시작하고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '비우고 정화하려는 에너지가 흐르고 있습니다.\n새로운 시작을 원하지만, 아직 그 방향이 명확하지 않을 수 있습니다.',
    personalityFlow: '깔끔하고 정돈된 것을 선호하지만,\n감정을 표현하기보다 정리하려는 패턴이 있습니다.',
    strengths: ['정화력', '새로운 시작', '명료함', '순수함'],
    shadows: ['감정 억압', '과도한 정리 욕구', '생기 부족'],
    coachingMessages: [
      '비워낸 자리에\n따뜻한 생기를 다시 채워보세요.',
      '새로운 시작은 이미 시작되었습니다.\n천천히 자신을 채워가세요.',
    ],
    recoveryMessages: [
      '비워낸 자리에\n따뜻한 생기와 에너지를 채워보세요.',
      '몸과 마음을 충전하는 것이\n지금 가장 필요한 회복입니다.',
      '새로운 시작을 위해\n자신에게 생기를 선물해 주세요.',
    ],
  },
  {
    id: 'silver',
    name: 'SILVER',
    korName: '실버',
    hex: '#A8B0B8',
    keywords: ['이성', '명료함', '거리감'],
    recovery: '감정 연결',
    complementColors: ['코랄', '피치'],
    innerFlow: '이성과 명료함을 향한 에너지가 내면에서 흐르고 있습니다.\n감정보다 논리를 통해 세상을 이해하려는 흐름이 무의식 속에 있습니다.',
    psychologyFlow: '이성적으로 상황을 분석하고 있지만,\n감정과의 연결이 조금 멀어진 느낌이 있습니다.',
    personalityFlow: '논리적이고 명료하지만,\n감정을 표현하는 것이 불편하게 느껴지는 패턴이 있습니다.',
    strengths: ['이성적 판단', '명료함', '객관성', '분석력'],
    shadows: ['감정 거리감', '차가운 인상', '연결 어려움'],
    coachingMessages: [
      '이성의 거리를 조금 좁히고,\n따뜻한 감정의 온기를 느껴보세요.',
      '분석보다 감정이 먼저일 때가 있습니다.\n마음의 소리에 귀 기울여 보세요.',
    ],
    recoveryMessages: [
      '이성의 거리를 조금 좁히고,\n따뜻한 감정과 연결되어 보세요.',
      '감정을 느끼는 것이\n더 깊은 이해를 만들어 줍니다.',
      '마음의 온기가\n지금 당신에게 필요한 회복 에너지입니다.',
    ],
  },
  {
    id: 'black',
    name: 'BLACK',
    korName: '블랙',
    hex: '#3A3A3A',
    keywords: ['보호', '경계', '깊이'],
    recovery: '개방과 연결',
    complementColors: ['화이트', '골드'],
    innerFlow: '자신을 보호하고 경계를 지키려는 에너지가 내면 깊이 흐르고 있습니다.\n외부로부터 자신을 지키고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '자신을 보호하는 에너지가 강하게 작동하고 있습니다.\n외부와의 연결보다 내면의 안전을 우선하는 시기입니다.',
    personalityFlow: '깊이 있고 강인하지만,\n마음의 문을 열기가 어렵게 느껴지는 패턴이 있습니다.',
    strengths: ['깊이', '강인함', '보호력', '집중력'],
    shadows: ['고립 패턴', '마음의 문 닫기', '연결 어려움'],
    coachingMessages: [
      '보호막 뒤에 있는 마음,\n조금씩 문을 열어도 됩니다.',
      '강한 당신이지만,\n연결과 개방이 더 큰 힘을 만들어 줍니다.',
    ],
    recoveryMessages: [
      '보호막 뒤에 있던 마음을\n조금씩 열어보세요.',
      '연결과 개방이\n더 깊은 안전감을 만들어 줍니다.',
      '마음의 문을 조금 열 때,\n진정한 회복이 시작됩니다.',
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
    innerFlow: '지혜와 성숙함을 향한 에너지가 내면에서 흐르고 있습니다.\n조화롭게 살아가고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '성숙하고 균형 잡힌 에너지가 흐르고 있습니다.\n하지만 자신의 감정을 표현하는 것이 어색하게 느껴질 수 있습니다.',
    personalityFlow: '중재하고 조화를 이끌어가는 성향이 있지만,\n그 과정에서 자신의 목소리를 뒤로 미루는 패턴이 있습니다.',
    strengths: ['지혜', '성숙함', '균형', '포용력'],
    shadows: ['자기 표현 어려움', '과도한 중재', '자기희생 패턴'],
    coachingMessages: [
      '성숙한 당신이지만,\n오늘은 자신의 감정을 솔직하게 표현해 보세요.',
      '지혜로운 당신의 목소리가 필요합니다.\n용기 내어 말해보세요.',
    ],
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
    keywords: ['신선함', '치유', '청량감'],
    recovery: '깊은 휴식',
    complementColors: ['코랄', '피치'],
    innerFlow: '신선함과 치유를 향한 에너지가 내면에서 흐르고 있습니다.\n새롭게 시작하고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '신선하고 치유적인 에너지가 흐르고 있습니다.\n새로운 시작을 향해 나아가고 있지만, 깊은 휴식이 먼저 필요합니다.',
    personalityFlow: '치유와 회복의 에너지를 자연스럽게 발산하지만,\n자신이 먼저 충분히 쉬지 못하는 패턴이 있습니다.',
    strengths: ['치유력', '신선함', '회복력', '청량감'],
    shadows: ['자기 돌봄 부족', '깊은 휴식 어려움', '과도한 활동'],
    coachingMessages: [
      '치유의 에너지를 가진 당신,\n오늘은 자신을 먼저 치유해 주세요.',
      '신선한 시작을 원한다면,\n먼저 깊은 휴식이 필요합니다.',
    ],
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
    keywords: ['자유', '희망', '개방성'],
    recovery: '현실 집중',
    complementColors: ['코랄', '오렌지'],
    innerFlow: '자유와 가능성을 향한 에너지가 내면에서 흐르고 있습니다.\n현실의 무게에서 벗어나고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '자유롭고 싶은 마음이 강하게 흐르고 있습니다.\n현실에서 벗어나 가능성을 향해 시선이 향해 있습니다.',
    personalityFlow: '개방적이고 자유를 추구하지만,\n현실의 무게를 피하고 싶은 마음이 생기는 패턴이 있습니다.',
    strengths: ['자유로움', '개방성', '희망', '가능성'],
    shadows: ['현실 회피 경향', '집중력 분산', '책임 부담감'],
    coachingMessages: [
      '자유를 꿈꾸는 당신,\n오늘은 그 꿈을 현실에서 한 걸음 실현해 보세요.',
      '넓은 하늘을 바라보는 당신,\n발 아래 땅도 함께 느껴보세요.',
    ],
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
    keywords: ['평온', '치유', '섬세함'],
    recovery: '자기 돌봄',
    complementColors: ['골드', '크림'],
    innerFlow: '평온함과 치유를 향한 에너지가 내면에서 조용히 흐르고 있습니다.\n섬세하게 자신을 돌보고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '섬세하고 평온한 에너지 속에서 치유를 경험하고 있습니다.\n내면이 조용히 회복되는 시기입니다.',
    personalityFlow: '섬세하고 감성적이며 아름다움을 추구하지만,\n자신의 감정에 너무 예민하게 반응하는 패턴이 있습니다.',
    strengths: ['섬세함', '치유력', '평온함', '감성'],
    shadows: ['과민한 감정 패턴', '자기 소홀', '경계 설정 어려움'],
    coachingMessages: [
      '섬세한 당신,\n오늘은 자신을 위한 특별한 돌봄의 시간을 가져보세요.',
      '평온함이 이미 당신 안에 있습니다.\n그것을 느끼는 시간을 가져보세요.',
    ],
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
    keywords: ['따뜻함', '친근함', '부드러움'],
    recovery: '자기 사랑',
    complementColors: ['세이지그린', '틸'],
    innerFlow: '따뜻함과 친근함을 향한 에너지가 내면에서 흐르고 있습니다.\n사랑받고 싶고 친밀하게 연결되고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '따뜻하고 친근한 에너지가 흐르고 있습니다.\n관계 속에서 편안함을 주지만, 자신을 사랑하는 연습이 필요합니다.',
    personalityFlow: '관계에서 편안함을 주고받는 것을 중요하게 여기지만,\n자신의 필요보다 타인의 필요를 먼저 채우는 패턴이 있습니다.',
    strengths: ['따뜻함', '친근함', '부드러움', '친화력'],
    shadows: ['자기 사랑 부족', '과도한 배려', '경계 설정 어려움'],
    coachingMessages: [
      '따뜻한 당신,\n오늘은 그 따뜻함으로 자신을 먼저 감싸 주세요.',
      '자신에게도 친근하게 대해주세요.\n당신은 그럴 자격이 있습니다.',
    ],
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
    keywords: ['대지', '안정', '열정'],
    recovery: '내면 평화',
    complementColors: ['스카이블루', '민트'],
    innerFlow: '대지처럼 안정적인 에너지가 내면에서 흐르고 있습니다.\n현실에 뿌리를 내리고 싶은 마음이 무의식 속에 있습니다.',
    psychologyFlow: '안정적인 에너지와 열정이 공존하고 있습니다.\n하지만 내면에서는 평화를 찾고 싶은 마음이 흐르고 있습니다.',
    personalityFlow: '현실적이고 열정적이지만,\n내면의 갈등을 혼자 감당하려는 패턴이 있습니다.',
    strengths: ['안정성', '열정', '현실감각', '따뜻함'],
    shadows: ['내면 갈등', '고집스러운 패턴', '유연성 부족'],
    coachingMessages: [
      '대지처럼 안정적인 당신,\n오늘은 내면의 평화를 찾는 시간을 가져보세요.',
      '열정과 안정이 공존하는 당신,\n그 균형이 당신의 강점입니다.',
    ],
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
    keywords: ['치유', '자연', '균형'],
    recovery: '자기 표현',
    complementColors: ['코랄', '피치'],
    innerFlow: '자연과 연결된 치유의 에너지가 내면에서 흐르고 있습니다.\n균형 잡힌 삶을 향한 마음이 무의식 속에 있습니다.',
    psychologyFlow: '자연과 연결된 치유의 에너지가 흐르고 있습니다.\n내면의 균형을 찾아가는 과정에서 자기 표현이 필요합니다.',
    personalityFlow: '균형과 조화를 중시하고 자연스럽게 치유하는 성향이 있지만,\n자신의 감정을 표현하는 것이 어색하게 느껴지는 패턴이 있습니다.',
    strengths: ['치유력', '자연스러움', '균형', '평온함'],
    shadows: ['자기 표현 어려움', '소극적 패턴', '자기희생'],
    coachingMessages: [
      '자연처럼 치유의 에너지를 가진 당신,\n오늘은 자신의 감정을 자연스럽게 표현해 보세요.',
      '균형을 찾는 당신의 여정이 아름답습니다.\n천천히, 자신의 속도로 가세요.',
    ],
    recoveryMessages: [
      '자연스럽게 자신을 표현하는 것이\n가장 큰 치유입니다.',
      '안으로만 담아왔던 감정을\n자연스럽게 흘려보내 보세요.',
      '자신의 목소리를 내는 것이\n균형 회복의 시작입니다.',
    ],
  },
];

export function getColorById(id: string): ColorData | undefined {
  return COLOR_DATA.find((c) => c.id === id);
}

export function generateInterpretation(
  card1: ColorData, // 1번 카드: 무의식 / 내면 흐름
  card2: ColorData, // 2번 카드: 현재 상태 / 심리 흐름
  card3: ColorData  // 3번 카드: 회복 방향 / 필요한 에너지
): {
  psychologyFlow: string;
  personalityFlow: string;
  strengths: string[];
  shadows: string[];
  complementColors: string[];
  coachingMessage: string;
} {
  // 현재 심리 흐름: 무의식(1번) + 현재상태(2번) + 회복방향(3번) 연결
  const psychologyFlow = generatePsychologyFlow(card1, card2, card3);
  // 성격 흐름: 무의식(1번) + 현재상태(2번) 기반
  const personalityFlow = generatePersonalityFlow(card1, card2);
  // 장점: 1번(무의식) + 2번(현재) + 3번(회복) 각 1개씩, 중복 제거
  const strengths = [
    card1.strengths[0],
    card2.strengths[0],
    card3.strengths[0],
    card2.strengths[1],
  ].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 4);
  // 감정 패턴: 2번(현재) + 1번(무의식) 기반
  const shadows = [
    ...card2.shadows.slice(0, 2),
    card1.shadows[0],
  ].filter((v, i, a) => v && a.indexOf(v) === i).slice(0, 3);
  // 보완 컬러: 3번 카드(회복 방향) 기반
  const complementColors = card3.complementColors;
  // 코칭 메시지: 무의식(1번) + 현재(2번) 상태를 인식하고, 회복(3번) 방향으로 연결
  const coachingMessage = generateCoachingMessage(card1, card2, card3);
  return {
    psychologyFlow,
    personalityFlow,
    strengths,
    shadows,
    complementColors,
    coachingMessage,
  };
}

/**
 * 코칭 메시지 생성
 * 무의식(1번) + 현재상태(2번)를 인식하고, 회복방향(3번)으로 연결하는 메시지
 */
function generateCoachingMessage(card1: ColorData, card2: ColorData, card3: ColorData): string {
  // 주요 조합별 맞춤 코칭 메시지
  const coachingCombos: Record<string, string> = {
    // 아이보리(무의식) + 스카이블루(현재) → 오렌지(회복)
    'cream_skyblue_orange': '혼자 머물러 있던 마음에\n다시 따뜻한 연결이 필요합니다.',
    // 블루(무의식) + 레드(현재) → 화이트(회복)
    'blue_red_white': '책임감으로 달려온 마음을\n이제는 조용히 비워도 됩니다.',
    // 레드(무의식) + 블루(현재) → 그린(회복)
    'red_blue_green': '강하게 버텨온 에너지를 내려놓고,\n자연스러운 회복의 흐름에 몸을 맡겨보세요.',
    // 블루(무의식) + 화이트(현재) → 그린(회복)
    'blue_white_green': '책임감 있게 살아왔지만,\n이제는 균형과 회복의 에너지가 필요합니다.',
    // 핑크(무의식) + 블루(현재) → 골드(회복)
    'pink_blue_gold': '타인을 위해 쏟아온 에너지를\n이제는 자신의 가치를 빛내는 데 사용해 보세요.',
    // 그린(무의식) + 핑크(현재) → 세이지(회복)
    'green_pink_sage': '배려하는 마음을 자신에게도 돌려,\n자신의 감정을 자연스럽게 표현해 보세요.',
    // 옐로우(무의식) + 블루(현재) → 그린(회복)
    'yellow_blue_green': '분주한 생각들을 내려놓고,\n균형 잡힌 회복의 에너지를 찾아보세요.',
    // 화이트(무의식) + 블루(현재) → 그린(회복)
    'white_blue_green': '비워낸 자리에\n균형과 회복의 에너지를 채워보세요.',
    // 바이올렛(무의식) + 인디고(현재) → 골드(회복)
    'violet_indigo_gold': '이상을 현실로 연결하는 작은 한 걸음이\n지금 당신에게 필요합니다.',
    // 블랙(무의식) + 실버(현재) → 화이트(회복)
    'black_silver_white': '보호막 뒤에 있던 마음을\n조용히 정화하고 새롭게 시작해 보세요.',
  };
  const key = `${card1.id}_${card2.id}_${card3.id}`;
  if (coachingCombos[key]) return coachingCombos[key];
  // 2카드 조합 체크 (현재상태 + 회복방향)
  const key2 = `${card2.id}_${card3.id}`;
  const twoCardCombos: Record<string, string> = {
    'red_green': '달려온 에너지를 내려놓고,\n자연스러운 회복의 흐름을 따라가 보세요.',
    'red_white': '강하게 버텨온 마음,\n이제는 조용히 비워도 됩니다.',
    'blue_pink': '혼자 감당해온 마음에\n따뜻한 돌봄이 필요합니다.',
    'blue_orange': '침묵 속에 담아왔던 에너지를\n따뜻한 연결로 표현해 보세요.',
    'cream_orange': '조용히 머물러 있던 마음에\n따뜻한 생기와 연결이 필요합니다.',
    'white_coral': '비워낸 자리에\n따뜻한 생기를 다시 채워보세요.',
    'indigo_orange': '깊은 내면에서 나온 에너지를\n따뜻한 관계와 표현으로 연결해 보세요.',
    'violet_yellow': '이상과 현실 사이에서,\n작은 희망의 씨앗을 현실에 심어보세요.',
    'black_white': '보호막 뒤에 있던 마음을\n조용히 정화하고 새롭게 시작해 보세요.',
    'silver_coral': '이성의 거리를 조금 좁히고,\n따뜻한 감정의 온기를 느껴보세요.',
  };
  if (twoCardCombos[key2]) return twoCardCombos[key2];
  // 기본 회복 방향 메시지: 3번 카드의 recoveryMessages에서 선택
  const recoveryMsgs = card3.recoveryMessages;
  return recoveryMsgs[Math.floor(Math.random() * recoveryMsgs.length)];
}

/**
 * 현재 심리 흐름 생성
 * 무의식(1번) → 현재상태(2번) → 회복방향(3번) 흐름으로 연결
 */
function generatePsychologyFlow(card1: ColorData, card2: ColorData, card3: ColorData): string {
  // 주요 조합별 맞춤 해석
  const combos: Record<string, string> = {
    // 아이보리(무의식) + 스카이블루(현재) 조합
    'cream_skyblue': '부드럽고 조용한 에너지 속에서 버티고 있지만,\n내면에는 잠시 쉬고 싶고 현실에서 거리를 두고 싶은 마음이 흐르고 있습니다.',
    // 블루(무의식) + 레드(현재) 조합
    'blue_red': '책임감 있게 달려왔지만,\n내면에서는 그 긴장이 쌓여 쉬고 싶은 마음이 조용히 흐르고 있습니다.',
    // 레드(무의식) + 블루(현재) 조합
    'red_blue': '강한 에너지가 내면에서 흐르고 있지만,\n지금은 책임감 속에서 감정을 억누르며 버티고 있습니다.',
    // 핑크(무의식) + 블루(현재) 조합
    'pink_blue': '따뜻한 연결을 원하는 마음이 내면에 있지만,\n지금은 책임감 속에서 감정을 안으로 담아두고 있습니다.',
    // 그린(무의식) + 핑크(현재) 조합
    'green_pink': '회복과 균형을 원하는 에너지가 내면에 흐르지만,\n지금은 타인을 위해 에너지를 쏟으며 자신을 소홀히 하고 있습니다.',
    // 옐로우(무의식) + 블루(현재) 조합
    'yellow_blue': '희망과 소통을 원하는 마음이 내면에 있지만,\n지금은 책임감 속에서 감정을 표현하지 못하고 있습니다.',
    // 화이트(무의식) + 블루(현재) 조합
    'white_blue': '정화와 새로운 시작을 원하는 마음이 내면에 있지만,\n지금은 책임감 있게 살아가며 감정을 비우지 못하고 있습니다.',
    // 블루(무의식) + 화이트(현재) 조합
    'blue_white': '책임감 있게 살아왔던 에너지가 내면에 흐르지만,\n지금은 비우고 정화하려는 마음이 강하게 작동하고 있습니다.',
    // 바이올렛(무의식) + 인디고(현재) 조합
    'violet_indigo': '변화와 성장을 향한 열망이 내면에 있지만,\n지금은 깊은 탐구 속에서 현실과의 거리가 멀어지고 있습니다.',
  };
  const key12 = `${card1.id}_${card2.id}`;
  if (combos[key12]) return combos[key12];
  // 기본 조합 생성 - 3카드 흐름 연결
  return `${card1.innerFlow.split('\n')[0]}\n${card2.psychologyFlow.split('\n')[0]}\n${card3.recovery}이 필요한 시기입니다.`;
}

/**
 * 성격 흐름 생성
 * 무의식(1번) + 현재상태(2번) 기반으로 감정 패턴 설명
 */
function generatePersonalityFlow(card1: ColorData, card2: ColorData): string {
  const personalityCombos: Record<string, string> = {
    'cream_skyblue': '온화하고 섬세한 성향이지만,\n갈등을 피하려는 경향이 강하고 감정을 안으로 담아두는 흐름이 있습니다.',
    'blue_red': '책임감이 강하고 혼자 견디는 성향이 있습니다.\n감정을 표현하는 것이 약함처럼 느껴져 안으로 담아두는 패턴이 있습니다.',
    'red_blue': '강하게 추진하는 성향이 있지만,\n책임감 속에서 감정을 억누르며 혼자 감당하려는 패턴이 있습니다.',
    'pink_blue': '따뜻하고 배려심이 깊지만,\n자신의 감정보다 타인을 먼저 생각하다 보니 내면이 소진되는 패턴이 있습니다.',
    'green_pink': '배려심이 깊고 조화를 중시하지만,\n자신의 감정을 표현하는 것이 어색한 패턴이 있습니다.',
    'yellow_blue': '생각이 많고 소통을 원하지만,\n책임감 속에서 감정을 표현하지 못하는 패턴이 있습니다.',
    'white_blue': '정화와 새로운 시작을 원하지만,\n책임감 있게 살아가며 자신을 비우지 못하는 패턴이 있습니다.',
    'blue_white': '책임감 있게 살아왔지만,\n이제는 비우고 새롭게 시작하려는 내면의 흐름이 있습니다.',
    'violet_indigo': '이상을 추구하고 깊이 탐구하는 성향이 있지만,\n현실과의 연결이 어색하게 느껴지는 패턴이 있습니다.',
  };
  const key = `${card1.id}_${card2.id}`;
  if (personalityCombos[key]) return personalityCombos[key];
  return `${card1.personalityFlow.split('\n')[0]}\n${card2.personalityFlow.split('\n')[0]}`;
}
