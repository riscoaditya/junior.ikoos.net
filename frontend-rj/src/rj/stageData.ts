export type CommandId =
  | 'start'
  | 'finish'
  | 'moveRight'
  | 'moveLeft'
  | 'moveUp'
  | 'moveDown'
  | 'seedSunflower'
  | 'seedBean'
  | 'seedMango'
  | 'dig'
  | 'insertSeed'
  | 'coverSoil'
  | 'wateringCan'
  | 'stone'
  | 'toyCar'
  | 'water'
  | 'sunlight'
  | 'wait'
  | 'repeat3'
  | 'fruitGreen'
  | 'fruitRipe'
  | 'harvest'
  | 'takeFruit'
  | 'shareAli'
  | 'shareFamily'
  | 'shareFriend'
  | 'voiceText'
  | 'talk'
  | 'sound';

export type StageId = 1 | 2 | 3 | 4 | 5 | 6;

export type CommandDef = {
  id: CommandId;
  label: string;
  shortLabel?: string;
  color: string;
  image: string;
};

export type StageInstruction = {
  command: CommandId;
  label: string;
  targetText?: string;
  duration?: number;
};

export type StageAnimationDef = {
  frameMs?: number;
  loop?: boolean;
  frames?: string[];
  characters?: Record<string, string[]>;
};

export type StageLevelDef = Partial<Omit<StageDef, 'id' | 'levels' | 'level' | 'levelLabel'>> & {
  label?: string;
};

export type StageDef = {
  id: StageId;
  level?: number;
  levelLabel?: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  icon: CommandId;
  accent: string;
  sceneType?: 'seed-choice' | 'planting';
  mission: string;
  bubble: string;
  leftSign: string;
  rightSign: string;
  trainSign: string;
  bottomTip: string;
  quote: string;
  quoteSource: string;
  palette: CommandId[];
  solution: CommandId[];
  instructions: StageInstruction[];
  slots: number;
  initialPlantPhase: number;
  successTitle: string;
  successMessage: string;
  animations?: Record<string, StageAnimationDef>;
  bubbleText?: string;
  voiceText?: string;
  voiceSrc?: string;
  levels?: Record<string, StageLevelDef>;
};

const commandAsset = (name: string) => `/assets/rj/commands/${name}.png`;
const seedAsset = (name: string) => `/assets/rj/seeds/${name}.png`;

export const commandDefs: Record<CommandId, CommandDef> = {
  start: {
    id: 'start',
    label: 'Start',
    color: '#ffd84d',
    image: commandAsset('start'),
  },
  finish: {
    id: 'finish',
    label: 'Selesai',
    color: '#8b5cf6',
    image: commandAsset('finish'),
  },
  moveRight: {
    id: 'moveRight',
    label: 'Kanan',
    color: '#168eea',
    image: commandAsset('move-right'),
  },
  moveLeft: {
    id: 'moveLeft',
    label: 'Kiri',
    color: '#168eea',
    image: commandAsset('move-left'),
  },
  moveUp: {
    id: 'moveUp',
    label: 'Atas',
    color: '#168eea',
    image: commandAsset('move-up'),
  },
  moveDown: {
    id: 'moveDown',
    label: 'Bawah',
    color: '#168eea',
    image: commandAsset('move-down'),
  },
  seedSunflower: {
    id: 'seedSunflower',
    label: 'Biji Bunga Matahari',
    shortLabel: 'Bunga Matahari',
    color: '#f6c84c',
    image: seedAsset('sunflower-seed-sack'),
  },
  seedBean: {
    id: 'seedBean',
    label: 'Biji Buah Apel',
    shortLabel: 'Apel',
    color: '#f59e0b',
    image: seedAsset('apple-seed-sack'),
  },
  seedMango: {
    id: 'seedMango',
    label: 'Biji Buah Mangga',
    shortLabel: 'Mangga',
    color: '#fbbf24',
    image: seedAsset('mango-seed-sack'),
  },
  dig: {
    id: 'dig',
    label: 'Gali Tanah',
    color: '#b87343',
    image: commandAsset('dig'),
  },
  insertSeed: {
    id: 'insertSeed',
    label: 'Masukkan Biji',
    shortLabel: 'Masukkan',
    color: '#f7c948',
    image: commandAsset('insert-seed'),
  },
  coverSoil: {
    id: 'coverSoil',
    label: 'Tutup Tanah',
    color: '#22c55e',
    image: commandAsset('cover-soil'),
  },
  wateringCan: {
    id: 'wateringCan',
    label: 'Penyiram Air',
    shortLabel: 'Penyiram',
    color: '#1ea7f7',
    image: commandAsset('watering-can'),
  },
  stone: {
    id: 'stone',
    label: 'Batu',
    color: '#8aa2b4',
    image: commandAsset('stone'),
  },
  toyCar: {
    id: 'toyCar',
    label: 'Mobil Mainan',
    shortLabel: 'Mobil',
    color: '#fb923c',
    image: commandAsset('toy-car'),
  },
  water: {
    id: 'water',
    label: 'Siram',
    color: '#22bff5',
    image: commandAsset('water'),
  },
  sunlight: {
    id: 'sunlight',
    label: 'Sinar Matahari',
    shortLabel: 'Matahari',
    color: '#fbbf24',
    image: commandAsset('sun'),
  },
  wait: {
    id: 'wait',
    label: 'Tunggu',
    color: '#a855f7',
    image: commandAsset('wait'),
  },
  repeat3: {
    id: 'repeat3',
    label: 'Ulangi x3',
    color: '#22c55e',
    image: commandAsset('repeat3'),
  },
  fruitGreen: {
    id: 'fruitGreen',
    label: 'Buah Hijau',
    color: '#22c55e',
    image: commandAsset('fruit-green'),
  },
  fruitRipe: {
    id: 'fruitRipe',
    label: 'Buah Matang',
    color: '#f43f5e',
    image: commandAsset('fruit-ripe'),
  },
  harvest: {
    id: 'harvest',
    label: 'Panen',
    color: '#f59e0b',
    image: commandAsset('harvest'),
  },
  takeFruit: {
    id: 'takeFruit',
    label: 'Ambil Buah',
    color: '#f43f5e',
    image: commandAsset('take-fruit'),
  },
  shareAli: {
    id: 'shareAli',
    label: 'Beri ke Ali',
    color: '#14b8a6',
    image: commandAsset('share-ali'),
  },
  shareFamily: {
    id: 'shareFamily',
    label: 'Beri Keluarga',
    shortLabel: 'Keluarga',
    color: '#22c55e',
    image: commandAsset('share-family'),
  },
  shareFriend: {
    id: 'shareFriend',
    label: 'Beri Teman',
    shortLabel: 'Teman',
    color: '#38bdf8',
    image: commandAsset('share-friend'),
  },
  voiceText: {
    id: 'voiceText',
    label: 'Voice',
    shortLabel: 'Voice',
    color: '#ec4899',
    image: commandAsset('voice-text'),
  },
  talk: {
    id: 'talk',
    label: 'Bubble Text',
    shortLabel: 'Bubble',
    color: '#a855f7',
    image: commandAsset('talk'),
  },
  sound: {
    id: 'sound',
    label: 'Suara',
    color: '#10b981',
    image: commandAsset('sound'),
  },
};

export const stageDefs: StageDef[] = [
  {
    id: 1,
    title: 'Pilih Biji',
    shortTitle: 'Pilih Biji',
    subtitle: 'Stage 1 - Saatnya memilih biji terbaik.',
    icon: 'seedBean',
    accent: '#22c55e',
    sceneType: 'seed-choice',
    mission: 'Pilih biji buah apel yang benar.',
    bubble: 'Kita belajar memilih biji yang baik sebelum menanam.',
    leftSign: 'Allah Menciptakan Tumbuhnya Segala Kebaikan',
    rightSign: 'Tanam Hari Ini Panen Kebaikan Nanti',
    trainSign: 'Kecil Langkahnya Besar Manfaatnya',
    bottomTip: 'Urutan yang benar akan membuat tanaman tumbuh dengan baik.',
    quote: 'Dan Dialah yang menumbuhkan bagi kamu dengan air hujan itu tanam-tanaman ...',
    quoteSource: "QS. Al-An'am: 99",
    palette: ['start', 'seedSunflower', 'seedBean', 'seedMango', 'talk', 'finish'],
    solution: ['start', 'seedBean', 'talk', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'seedBean', label: 'Pilih Biji Buah Apel' },
      { command: 'talk', label: 'Buble Text "Bismillah biji buah apel yg terbaik!"' },
      { command: 'finish', label: 'Finish' },
    ],
    slots: 4,
    initialPlantPhase: 0,
    successTitle: 'Ikhtiar Hebat!',
    successMessage: 'Biji sudah tertanam dengan urutan yang rapi.',
  },
  {
    id: 2,
    title: 'Tanam Biji',
    shortTitle: 'Tanam Biji',
    subtitle: 'Stage 2 - Saatnya menanam biji kebaikan.',
    icon: 'coverSoil',
    accent: '#22c55e',
    sceneType: 'planting',
    mission: 'Susun langkah menanam biji yang benar.',
    bubble: 'Kita belajar merawat tanaman sebagai ciptaan Allah. Menanam hari ini, menuai kebaikan nanti.',
    leftSign: 'Allah Menciptakan Tumbuhnya Segala Kebaikan',
    rightSign: 'Tanam Hari Ini Panen Kebaikan Nanti',
    trainSign: 'Kecil Langkahnya Besar Manfaatnya',
    bottomTip: 'Urutan yang benar akan membuat tanaman tumbuh dengan baik.',
    quote: 'Dan Dialah yang menumbuhkan bagi kamu dengan air hujan itu tanam-tanaman ...',
    quoteSource: "QS. Al-An'am: 99",
    palette: ['start', 'moveRight', 'moveLeft', 'moveUp', 'moveDown', 'dig', 'insertSeed', 'coverSoil', 'talk', 'sound', 'finish'],
    solution: ['start', 'dig', 'insertSeed', 'coverSoil', 'talk', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'dig', label: 'Gali tanah' },
      { command: 'insertSeed', label: 'Masukkan Biji' },
      { command: 'coverSoil', label: 'Tutup tanah' },
      { command: 'talk', label: 'Buble Text "MasyaAllah, ikhtiar menanam sudah selesai."', targetText: 'MasyaAllah, ikhtiar menanam sudah selesai.' },
      { command: 'finish', label: 'Finish' },
    ],
    slots: 6,
    bubbleText: 'MasyaAllah, ikhtiar menanam sudah selesai.',
    initialPlantPhase: 0,
    successTitle: 'Ikhtiar Hebat!',
    successMessage: 'Biji sudah tertanam dengan urutan yang rapi.',
  },
  {
    id: 3,
    title: 'Siram Tanaman',
    shortTitle: 'Siram Tanaman',
    subtitle: 'Stage 3 - Saatnya membantu tanaman tumbuh.',
    icon: 'water',
    accent: '#22bff5',
    mission: 'Pilih benda yang dibutuhkan tanaman.',
    bubble: 'Air adalah nikmat dari Allah. Yuk pilih alat yang tepat untuk membantu tanaman tumbuh!',
    leftSign: 'Allah Menurunkan Air untuk Kehidupan',
    rightSign: 'Siram Hari Ini, Tumbuh Esok Nanti',
    trainSign: 'Air Membantu Tanaman Tumbuh',
    bottomTip: 'Tanaman membutuhkan air agar tumbuh dengan baik.',
    quote: 'Dan Allah menumbuhkan tanaman dengan air hujan.',
    quoteSource: 'Belajar merawat ciptaan Allah',
    palette: ['start', 'wateringCan', 'stone', 'toyCar', 'water', 'talk', 'sound', 'finish'],
    solution: ['start', 'wateringCan', 'water', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'wateringCan', label: 'Pilih penyiram air' },
      { command: 'water', label: 'Siram tanaman' },
      { command: 'finish', label: 'Selesai' },
    ],
    slots: 4,
    initialPlantPhase: 2,
    successTitle: 'MasyaAllah!',
    successMessage: 'Tanaman terlihat lebih segar setelah disiram.',
  },
  {
    id: 4,
    title: 'Rawat & Tunggu',
    shortTitle: 'Rawat & Tunggu',
    subtitle: 'Stage 4 - Saatnya merawat tanaman agar tumbuh.',
    icon: 'sunlight',
    accent: '#fbbf24',
    mission: 'Lakukan perawatan ini 3 kali.',
    bubble: 'Tanaman perlu dirawat berulang kali. Siram, beri sinar matahari, lalu tunggu ya!',
    leftSign: 'Allah Menumbuhkan Tanaman',
    rightSign: 'Rawat Hari Ini, Tumbuh Esok Nanti',
    trainSign: 'Diulang 3 Kali',
    bottomTip: 'Perawatan yang diulang akan membantu tanaman tumbuh dengan baik.',
    quote: 'Sesungguhnya Allah menumbuhkan tanaman dan buah-buahan.',
    quoteSource: "QS. Al-An'am: 99",
    palette: ['start', 'water', 'sunlight', 'wait', 'repeat3', 'talk', 'sound', 'finish'],
    solution: ['start', 'water', 'sunlight', 'wait', 'repeat3', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'water', label: 'Siram' },
      { command: 'sunlight', label: 'Sinar matahari' },
      { command: 'wait', label: 'Tunggu' },
      { command: 'repeat3', label: 'Ulangi x3' },
      { command: 'finish', label: 'Selesai' },
    ],
    slots: 6,
    initialPlantPhase: 2,
    successTitle: 'Sabar dan Istiqamah!',
    successMessage: 'Tanaman tumbuh lebih besar setelah dirawat berulang.',
  },
  {
    id: 5,
    title: 'Pilih Buah Matang',
    shortTitle: 'Pilih Buah Matang',
    subtitle: 'Stage 5 - Pilih buah yang siap dipanen.',
    icon: 'fruitRipe',
    accent: '#f43f5e',
    mission: 'Pilih buah yang sudah matang.',
    bubble: 'Buah matang siap dipetik. Pilih yang merah dan baik, lalu panen dengan hati bersyukur.',
    leftSign: 'Allah Memberi Buah sebagai Rezeki',
    rightSign: 'Pilih yang Matang, Panen dengan Syukur',
    trainSign: 'Jika Matang, Panen',
    bottomTip: 'Pilih buah matang, lalu panen dengan mengucap Alhamdulillah.',
    quote: 'Makanlah dari buahnya bila dia berbuah.',
    quoteSource: "QS. Al-An'am: 141",
    palette: ['start', 'fruitGreen', 'fruitRipe', 'wait', 'harvest', 'talk', 'sound', 'finish'],
    solution: ['start', 'fruitRipe', 'harvest', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'fruitRipe', label: 'Pilih buah matang' },
      { command: 'harvest', label: 'Panen' },
      { command: 'finish', label: 'Selesai' },
    ],
    slots: 4,
    initialPlantPhase: 7,
    successTitle: 'Alhamdulillah!',
    successMessage: 'Ali memetik buah matang dengan penuh syukur.',
  },
  {
    id: 6,
    title: 'Berbagi Hasil',
    shortTitle: 'Berbagi Hasil',
    subtitle: 'Stage 6 - Bagikan hasil panen.',
    icon: 'shareFamily',
    accent: '#14b8a6',
    mission: 'Bagikan hasil panen.',
    bubble: 'MasyaAllah, buahnya banyak. Yuk ambil hasil panen lalu berbagi kepada keluarga dan teman.',
    leftSign: 'Nikmat Allah Lebih Indah Saat Dibagi',
    rightSign: 'Bersama Kita Tumbuh',
    trainSign: 'Berbagi Membuat Hati Gembira',
    bottomTip: 'Berbagi hasil panen mengajarkan syukur dan kasih sayang.',
    quote: 'MasyaAllah, berbagi itu baik.',
    quoteSource: 'Belajar akhlak mulia',
    palette: ['start', 'takeFruit', 'shareAli', 'shareFamily', 'shareFriend', 'talk', 'sound', 'finish'],
    solution: ['start', 'takeFruit', 'shareFamily', 'shareFriend', 'finish'],
    instructions: [
      { command: 'start', label: 'Start' },
      { command: 'takeFruit', label: 'Ambil buah' },
      { command: 'shareFamily', label: 'Beri ke keluarga' },
      { command: 'shareFriend', label: 'Beri ke teman' },
      { command: 'finish', label: 'Selesai' },
    ],
    slots: 5,
    initialPlantPhase: 8,
    successTitle: 'MasyaAllah!',
    successMessage: 'Ali berbagi hasil panen kepada keluarga dan teman.',
  },
];

export const stageById = new Map(stageDefs.map((stage) => [stage.id, stage]));

export function getCommand(commandId: CommandId) {
  return commandDefs[commandId];
}

export function isSeedChoice(commandId: CommandId) {
  return commandId === 'seedSunflower' || commandId === 'seedBean' || commandId === 'seedMango';
}

export function commandMatches(stage: StageDef, commandId: CommandId | undefined, expected: CommandId, index: number) {
  if (!commandId) return false;
  if (expected === 'seedSunflower' && isSeedChoice(commandId)) return true;
  return commandId === expected;
}
