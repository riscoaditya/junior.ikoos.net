import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const STAGE_WIDTH = 1500;
const STAGE_HEIGHT = 1000;
const root = process.cwd();
const stagesRoot = path.join(root, 'public', 'assets', 'stages');
const sharedObjectsDir = path.join(stagesRoot, 'shared', 'objects');
const objectFileNames = {
  'bee-character': 'beeCharacter',
  'ikoobot-character': 'ikoobotCharacter',
};
const objectUrl = (name) => {
  if (name === 'friend') return '/assets/stages/shared/characters/teman-main.png';
  return `/assets/stages/shared/objects/${objectFileNames[name] || name}.png`;
};

const sounds = {
  pop: { id: 'pop', name: 'Pop', file: '/assets/stages/stage-1/sounds/pop.wav' },
  success: { id: 'success', name: 'Success', file: '/assets/stages/stage-1/sounds/success.wav' },
  salam: { id: 'salam', name: 'Salam', file: '/assets/stages/stage-1/sounds/salam.wav' },
  bismillah: { id: 'bismillah', name: 'Bismillah', file: '/assets/stages/stage-4/sounds/Bismillahirrahmanirrahim.mp3' },
  alhamdulillah: { id: 'alhamdulillah', name: 'Alhamdulillah', file: '/assets/stages/stage-2/sounds/alhamdulillah.mp3' },
  masyaallah: { id: 'masyaallah', name: 'MasyaAllah', file: '/assets/stages/stage-3/sounds/MasyaAllah.mp3' },
};

const stageOneBackgrounds = [
  ['masjid-ceria', 'Masjid Ceria', '/assets/stages/stage-1/backgrounds/masjid.png', '/assets/stages/stage-1/thumbnails/masjid.png'],
  ['taman', 'Taman Ceria', '/assets/stages/stage-1/backgrounds/taman.png', '/assets/stages/stage-1/thumbnails/taman.png'],
  ['sekolah', 'Sekolah Ceria', '/assets/stages/stage-1/backgrounds/sekolah.png', '/assets/stages/stage-1/thumbnails/sekolah.png'],
];

const stageTwoBackgrounds = [
  ['stage-2-taman', 'Taman Nikmat', '/assets/stages/stage-2/backgrounds/taman.png', '/assets/stages/stage-2/thumbnails/taman.png'],
  ['stage-2-masjid', 'Masjid Syukur', '/assets/stages/stage-2/backgrounds/masjid.png', '/assets/stages/stage-2/thumbnails/masjid.png'],
  ['stage-2-sekolah', 'Sekolah Syukur', '/assets/stages/stage-2/backgrounds/sekolah.png', '/assets/stages/stage-2/thumbnails/sekolah.png'],
];

const stageTwoRevealBackground = {
  id: 'stage-2-food-reveal',
  name: 'Nikmat Makanan',
  file: '/assets/stages/stage-2/backgrounds/reveal-food.png',
  thumbnail: '/assets/stages/stage-2/backgrounds/reveal-food.png',
  fit: 'cover',
  completionOnly: true,
};

const stageThreeRevealBackground = {
  id: 'stage-3-nature-reveal',
  name: 'Pegunungan MasyaAllah',
  file: '/assets/stages/stage-3/backgrounds/reveal-nature.png',
  thumbnail: '/assets/stages/stage-3/backgrounds/reveal-nature.png',
  fit: 'cover',
  completionOnly: true,
};

const stageFourRevealBackgrounds = [
  {
    id: 'stage-4-bismillah-meal',
    name: 'Bismillah Sebelum Makan',
    file: '/assets/stages/stage-4/backgrounds/bismillah-meal.png',
    thumbnail: '/assets/stages/stage-4/backgrounds/bismillah-meal.png',
    fit: 'cover',
    completionOnly: true,
  },
  {
    id: 'stage-4-bismillah-study',
    name: 'Bismillah Sebelum Belajar',
    file: '/assets/stages/stage-4/backgrounds/bismillah-study.png',
    thumbnail: '/assets/stages/stage-4/backgrounds/bismillah-study.png',
    fit: 'cover',
    completionOnly: true,
  },
  {
    id: 'stage-4-bismillah-travel',
    name: 'Bismillah Sebelum Bepergian',
    file: '/assets/stages/stage-4/backgrounds/bismillah-travel.png',
    thumbnail: '/assets/stages/stage-4/backgrounds/bismillah-travel.png',
    fit: 'cover',
    completionOnly: true,
  },
];

const stageFiveBackgrounds = [
  {
    id: 'stage-5-masjid-route-lv1',
    name: 'Papan Jalur Masjid Lv 1',
    file: '/assets/stages/stage-5/backgrounds/masjid-board-lv1.png',
    thumbnail: '/assets/stages/stage-5/backgrounds/masjid-board-lv1.png',
    fit: 'cover',
  },
  {
    id: 'stage-5-masjid-route-lv2',
    name: 'Papan Jalur Masjid Lv 2',
    file: '/assets/stages/stage-5/backgrounds/masjid-board-lv2.png',
    thumbnail: '/assets/stages/stage-5/backgrounds/masjid-board-lv2.png',
    fit: 'cover',
  },
  {
    id: 'stage-5-masjid-route-lv3',
    name: 'Papan Jalur Masjid Lv 3',
    file: '/assets/stages/stage-5/backgrounds/masjid-board-lv3.png',
    thumbnail: '/assets/stages/stage-5/backgrounds/masjid-board-lv3.png',
    fit: 'cover',
  },
];

const backgroundNamesByStage = {
  3: ['Taman Indah', 'Pelangi Ceria', 'Kebun Bunga'],
  5: ['Mulai Aktivitas', 'Meja Makan', 'Pojok Belajar'],
  6: ['Halaman Masjid', 'Serambi Masjid', 'Ruang Shalat'],
  7: ['Sudut Rencana', 'Jalan ke Tempat Mengaji', 'Jalur Janji Baik'],
  8: ['Paviliun Makan', 'Ruang Makan Keluarga', 'Teras Makan'],
  9: ['Kamar Rapi', 'Taman Bersih', 'Rak Buku'],
  10: ['Teman Baik', 'Kelas Peduli', 'Pojok Tolong'],
  11: ['Station Wudhu', 'Tempat Air', 'Masjid Kecil'],
  12: ['Perlengkapan Shalat', 'Ruang Ibadah', 'Lemari Rapi'],
  13: ['Langit Subuh', 'Waktu Shalat', 'Malam Maghrib'],
  14: ['Kotak Sedekah', 'Pasar Mini', 'Meja Berbagi'],
  15: ['Buah untuk Teman', 'Karpet Berbagi', 'Meja Kurma'],
  16: ['Jalan Jujur', 'Rumah Amanah', 'Pilihan Baik'],
  17: ['Antri Rapi', 'Perosotan Ceria', 'Ayunan Bergilir'],
  18: ['Teman Butuh Bantuan', 'Meja Sekolah', 'Kotak P3K'],
  19: ['Dunia Hewan', 'Kebun Wortel', 'Kolam Ikan'],
  20: ['Taman Hijau', 'Rumah Hemat', 'Kelas Bersih'],
  21: ['Bulan Bintang', 'Karpet Pola', 'Langit Pola'],
  22: ['Lebah dan Bunga', 'Kebun Madu', 'Zig-zag Bunga'],
  23: ['IKOOBOT Peduli', 'Kota Mini', 'Misi Kebaikan'],
  24: ['Studio Cerita', 'Panggung Karya', 'Wisuda Junior'],
};

const standardCharacters = [
  {
    id: 'anak-muslim',
    name: 'Ali',
    file: '/assets/stages/shared/characters/ali-main.png',
    thumbnail: '/assets/stages/shared/characters/ali-main.png',
    instructionAvatar: '/assets/stages/shared/characters/ali-avatar.png',
    startPosition: { x: 350, y: 680 },
    displaySize: { width: 630, height: 630 },
    scale: 1,
  },
  {
    id: 'anak-ceria',
    name: 'Aisyah',
    file: '/assets/stages/shared/characters/aisyah-main.png',
    thumbnail: '/assets/stages/shared/characters/aisyah-main.png',
    instructionAvatar: '/assets/stages/shared/characters/aisyah-avatar.png',
    startPosition: { x: 350, y: 680 },
    displaySize: { width: 630, height: 630 },
    scale: 1,
  },
  {
    id: 'kucing-lucu',
    name: 'Kucing',
    file: '/assets/stages/stage-1/characters/kucing.png',
    thumbnail: '/assets/stages/stage-1/thumbnails/kucing.png',
    startPosition: { x: 330, y: 735 },
    displaySize: { width: 435, height: 435 },
    scale: 1,
  },
];

const stageFiveAli = {
  ...standardCharacters[0],
  startPosition: { x: 145, y: 710 },
  displaySize: { width: 330, height: 330 },
};

const stageRouteAisyah = {
  ...standardCharacters[1],
  startPosition: { x: 145, y: 710 },
  displaySize: { width: 330, height: 330 },
};

const beeCharacter = {
  id: 'bee-character',
  name: 'Lebah',
  file: objectUrl('bee-character'),
  thumbnail: objectUrl('bee-character'),
  startPosition: { x: 300, y: 590 },
  displaySize: { width: 345, height: 345 },
  scale: 1,
};

const ikoobotCharacter = {
  id: 'ikoobot-character',
  name: 'IKOOBOT',
  file: objectUrl('ikoobot-character'),
  thumbnail: objectUrl('ikoobot-character'),
  startPosition: { x: 330, y: 705 },
  displaySize: { width: 420, height: 420 },
  scale: 1,
};

function svgShell(body, accent = '#38bdf8') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="12" stdDeviation="10" flood-color="#17345e" flood-opacity=".22"/>
    </filter>
    <linearGradient id="badge" x1="38" y1="28" x2="212" y2="226" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fffdf4"/>
      <stop offset=".52" stop-color="#e9f7ff"/>
      <stop offset="1" stop-color="${accent}"/>
    </linearGradient>
  </defs>
  <circle cx="128" cy="128" r="104" fill="url(#badge)" filter="url(#shadow)"/>
  <circle cx="104" cy="82" r="18" fill="#fff" opacity=".62"/>
  ${body}
</svg>`;
}

const svgAssets = {
  friend: svgShell(`
    <circle cx="128" cy="104" r="36" fill="#ffd5a8" stroke="#12305f" stroke-width="8"/>
    <path d="M74 208c8-44 36-68 54-68s46 24 54 68" fill="#48c774" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>
    <path d="M98 86c18-38 70-29 66 12-19-13-45-10-66-12z" fill="#314e8a"/>
    <circle cx="115" cy="105" r="5" fill="#12305f"/><circle cx="141" cy="105" r="5" fill="#12305f"/>
    <path d="M112 124c11 10 24 10 34 0" fill="none" stroke="#12305f" stroke-width="7" stroke-linecap="round"/>`, '#77dd77'),
  gift: svgShell(`
    <rect x="64" y="96" width="128" height="92" rx="16" fill="#ff5d8f" stroke="#12305f" stroke-width="8"/>
    <path d="M128 96v92M64 128h128" stroke="#ffe45c" stroke-width="16"/>
    <path d="M126 94c-38-10-36-42-8-34 10 3 12 18 10 34zm4 0c38-10 36-42 8-34-10 3-12 18-8 34z" fill="#ffe45c" stroke="#12305f" stroke-width="7"/>`, '#ffb703'),
  rainbow: svgShell(`
    <path d="M52 170a76 76 0 0 1 152 0" fill="none" stroke="#ff4d6d" stroke-width="18" stroke-linecap="round"/>
    <path d="M74 170a54 54 0 0 1 108 0" fill="none" stroke="#ffd166" stroke-width="18" stroke-linecap="round"/>
    <path d="M96 170a32 32 0 0 1 64 0" fill="none" stroke="#06d6a0" stroke-width="18" stroke-linecap="round"/>
    <circle cx="70" cy="178" r="22" fill="#fff"/><circle cx="184" cy="178" r="22" fill="#fff"/>`, '#8ecae6'),
  mosqueTarget: svgShell(`
    <path d="M67 195V98h122v97" fill="#f8fff8" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>
    <path d="M75 99c24-54 82-54 106 0H75z" fill="#18a058" stroke="#12305f" stroke-width="8"/>
    <path d="M112 195v-48a16 16 0 0 1 32 0v48" fill="#16c7a4" stroke="#12305f" stroke-width="8"/>
    <path d="M59 195h138M128 42v22M128 42c12 6 16 18 0 28" stroke="#ffc928" stroke-width="8" stroke-linecap="round"/>`, '#22c55e'),
  tree: svgShell(`
    <path d="M118 188V96h24v92" fill="#9b5a24" stroke="#12305f" stroke-width="8"/>
    <circle cx="100" cy="94" r="35" fill="#60c342" stroke="#12305f" stroke-width="7"/>
    <circle cx="137" cy="75" r="42" fill="#77d64b" stroke="#12305f" stroke-width="7"/>
    <circle cx="162" cy="112" r="35" fill="#48b947" stroke="#12305f" stroke-width="7"/>`, '#86efac'),
  pond: svgShell(`
    <ellipse cx="128" cy="150" rx="78" ry="42" fill="#57c7ff" stroke="#12305f" stroke-width="8"/>
    <path d="M74 147c26 14 51-14 78 0 14 8 24 8 32 2" fill="none" stroke="#e1f7ff" stroke-width="8" stroke-linecap="round"/>
    <ellipse cx="88" cy="122" rx="22" ry="10" fill="#7ddf64"/><ellipse cx="174" cy="130" rx="22" ry="10" fill="#7ddf64"/>`, '#38bdf8'),
  starToken: svgShell(`
    <path d="m128 48 23 47 52 8-38 37 9 52-46-24-46 24 9-52-38-37 52-8 23-47z" fill="#ffd84d" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="116" cy="111" r="6" fill="#12305f"/><circle cx="142" cy="111" r="6" fill="#12305f"/>
    <path d="M112 134c10 9 22 9 32 0" fill="none" stroke="#12305f" stroke-width="7" stroke-linecap="round"/>`, '#facc15'),
  food: svgShell(`
    <circle cx="128" cy="148" r="62" fill="#fff8ea" stroke="#12305f" stroke-width="8"/>
    <circle cx="128" cy="148" r="38" fill="#f97316"/>
    <path d="M80 78v62M96 78v62M80 108h16M176 78v68" stroke="#12305f" stroke-width="8" stroke-linecap="round"/>`, '#fb923c'),
  book: svgShell(`
    <path d="M58 68h72c18 0 26 10 26 26v94H82c-14 0-24-10-24-24V68z" fill="#38bdf8" stroke="#12305f" stroke-width="8"/>
    <path d="M156 84h42v96h-42" fill="#ffe45c" stroke="#12305f" stroke-width="8"/>
    <path d="M83 100h45M83 124h42M83 148h32" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`, '#38bdf8'),
  shelf: svgShell(`
    <rect x="55" y="84" width="146" height="98" rx="12" fill="#c7833a" stroke="#12305f" stroke-width="8"/>
    <path d="M70 118h116M70 154h116" stroke="#7c4218" stroke-width="8"/>
    <rect x="78" y="93" width="18" height="25" fill="#38bdf8"/><rect x="102" y="93" width="18" height="25" fill="#ffd84d"/><rect x="128" y="93" width="18" height="25" fill="#ff5d8f"/>`, '#d97706'),
  trash: svgShell(`
    <path d="M86 90h84l-12 106H98L86 90z" fill="#94a3b8" stroke="#12305f" stroke-width="8"/>
    <path d="M78 90h100M104 71h48l8 19H96l8-19zM111 112v58M128 112v58M145 112v58" stroke="#12305f" stroke-width="8" stroke-linecap="round"/>`, '#94a3b8'),
  bin: svgShell(`
    <path d="M76 84h104l-10 108H86L76 84z" fill="#22c55e" stroke="#12305f" stroke-width="8"/>
    <path d="M68 84h120M102 64h52l8 20H94l8-20z" stroke="#12305f" stroke-width="8" stroke-linecap="round"/>
    <path d="m111 128 15 16 28-36" fill="none" stroke="#fff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`, '#22c55e'),
  soap: svgShell(`
    <rect x="68" y="102" width="120" height="70" rx="28" fill="#7dd3fc" stroke="#12305f" stroke-width="8"/>
    <circle cx="92" cy="82" r="14" fill="#fff" stroke="#12305f" stroke-width="6"/>
    <circle cx="136" cy="70" r="18" fill="#fff" stroke="#12305f" stroke-width="6"/>
    <circle cx="166" cy="92" r="10" fill="#fff" stroke="#12305f" stroke-width="6"/>`, '#67e8f9'),
  moon: svgShell(`
    <path d="M154 55c-35 12-58 44-51 82 7 39 42 65 80 62-18 22-52 31-84 18-43-18-63-67-45-110 17-42 60-63 100-52z" fill="#ffe45c" stroke="#12305f" stroke-width="8"/>`, '#fde68a'),
  mountain: svgShell(`
    <path d="M40 190 103 76l44 76 26-43 43 81H40z" fill="#5fb3ff" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>
    <path d="m103 76 19 34-20-8-18 12 19-38zM173 109l13 25-14-6-13 8 14-27z" fill="#fff"/>`, '#60a5fa'),
  planCard: svgShell(`
    <rect x="64" y="60" width="128" height="140" rx="18" fill="#ffffff" stroke="#12305f" stroke-width="8"/>
    <path d="M88 102h80M88 132h64M88 162h54" stroke="#38bdf8" stroke-width="10" stroke-linecap="round"/>
    <path d="m85 75 16 16 28-34" fill="none" stroke="#22c55e" stroke-width="9" stroke-linecap="round"/>`, '#bfdbfe'),
  hand: svgShell(`
    <path d="M90 160V96c0-10 16-10 16 0v43-62c0-11 17-11 17 0v61-52c0-11 17-11 17 0v54-40c0-10 17-10 17 0v54l12-18c8-11 23-1 16 13l-26 51c-8 16-22 24-43 24-28 0-46-17-46-44v-20c0-12 20-12 20 0z" fill="#ffd5a8" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>`, '#fdba74'),
  wudhuStation: svgShell(`
    <path d="M84 172h88v34H84z" fill="#94a3b8" stroke="#12305f" stroke-width="8"/>
    <ellipse cx="128" cy="160" rx="66" ry="32" fill="#e0f7ff" stroke="#12305f" stroke-width="8"/>
    <path d="M128 80v46M128 80c38 0 38 31 6 31" fill="none" stroke="#12305f" stroke-width="9" stroke-linecap="round"/>
    <path d="M154 118c17 22 17 41 0 57" stroke="#38bdf8" stroke-width="10" stroke-linecap="round"/>`, '#67e8f9'),
  prayerMat: svgShell(`
    <path d="M78 55h100c16 28 24 60 24 96v54H54v-54c0-36 8-68 24-96z" fill="#16a34a" stroke="#12305f" stroke-width="8"/>
    <path d="M96 96c8-22 56-22 64 0v68H96V96z" fill="#dcfce7" stroke="#12305f" stroke-width="6"/>
    <path d="M74 185h108" stroke="#ffd84d" stroke-width="10" stroke-linecap="round"/>`, '#22c55e'),
  donationBox: svgShell(`
    <rect x="60" y="88" width="136" height="96" rx="18" fill="#22c55e" stroke="#12305f" stroke-width="8"/>
    <path d="M86 88h84l-12-32H98L86 88z" fill="#86efac" stroke="#12305f" stroke-width="8"/>
    <path d="M105 112h46" stroke="#fff" stroke-width="10" stroke-linecap="round"/>
    <circle cx="128" cy="151" r="23" fill="#ffd84d" stroke="#12305f" stroke-width="7"/>`, '#86efac'),
  apple: svgShell(`
    <path d="M127 82c28-25 70-3 70 43 0 45-30 82-64 74-4-1-7-1-11 0-34 8-64-29-64-74 0-46 42-68 69-43z" fill="#ef4444" stroke="#12305f" stroke-width="8"/>
    <path d="M128 81c-1-22 13-36 35-42M139 67c24-4 35 9 39 26-24 4-36-8-39-26z" fill="#22c55e" stroke="#12305f" stroke-width="7"/>`, '#f87171'),
  honestPath: svgShell(`
    <path d="M52 190c23-70 54-38 75-88 20 50 54 18 77 88H52z" fill="#fef3c7" stroke="#12305f" stroke-width="8"/>
    <path d="m91 145 27 26 52-65" fill="none" stroke="#22c55e" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>`, '#fef08a'),
  queueMarker: svgShell(`
    <path d="M70 190h116" stroke="#12305f" stroke-width="10" stroke-linecap="round"/>
    <circle cx="92" cy="93" r="24" fill="#ffd5a8" stroke="#12305f" stroke-width="7"/>
    <circle cx="132" cy="83" r="26" fill="#ffd5a8" stroke="#12305f" stroke-width="7"/>
    <circle cx="172" cy="96" r="23" fill="#ffd5a8" stroke="#12305f" stroke-width="7"/>
    <path d="M64 164c5-31 22-48 40-48s35 17 40 48M104 168c5-38 26-58 48-58s43 20 48 58" fill="none" stroke="#38bdf8" stroke-width="13" stroke-linecap="round"/>`, '#93c5fd'),
  pencil: svgShell(`
    <path d="M69 174 164 79l26 26-95 95-34 8 8-34z" fill="#ffd84d" stroke="#12305f" stroke-width="8" stroke-linejoin="round"/>
    <path d="m164 79 16-16 26 26-16 16" fill="#ff5d8f" stroke="#12305f" stroke-width="8"/>
    <path d="m69 174 26 26" stroke="#12305f" stroke-width="8"/>`, '#fde047'),
  aidBox: svgShell(`
    <rect x="58" y="80" width="140" height="112" rx="18" fill="#fff" stroke="#12305f" stroke-width="8"/>
    <path d="M98 80V61h60v19" fill="none" stroke="#12305f" stroke-width="8"/>
    <path d="M128 108v56M100 136h56" stroke="#ef4444" stroke-width="18" stroke-linecap="round"/>`, '#fecaca'),
  rabbit: svgShell(`
    <ellipse cx="128" cy="145" rx="58" ry="51" fill="#fff" stroke="#12305f" stroke-width="8"/>
    <path d="M98 105C80 42 123 32 124 104M157 105c18-63-25-73-26-1" fill="#fff" stroke="#12305f" stroke-width="8"/>
    <circle cx="108" cy="142" r="5" fill="#12305f"/><circle cx="148" cy="142" r="5" fill="#12305f"/>
    <path d="M128 152v16M112 172c10 8 22 8 32 0" stroke="#12305f" stroke-width="7" stroke-linecap="round"/>`, '#f8fafc'),
  carrot: svgShell(`
    <path d="M95 77c48 7 78 37 86 86-38 25-89 16-111-29 5-24 12-42 25-57z" fill="#fb923c" stroke="#12305f" stroke-width="8"/>
    <path d="M93 75c-22-26 5-44 22-19 2-31 36-33 33 1 27-20 47 9 17 25" fill="#22c55e" stroke="#12305f" stroke-width="7" stroke-linejoin="round"/>
    <path d="M108 111h34M122 139h31" stroke="#ffedd5" stroke-width="8" stroke-linecap="round"/>`, '#fb923c'),
  flower: svgShell(`
    <path d="M128 126v74" stroke="#22c55e" stroke-width="12" stroke-linecap="round"/>
    <circle cx="128" cy="116" r="22" fill="#ffd84d" stroke="#12305f" stroke-width="7"/>
    <circle cx="128" cy="75" r="24" fill="#ff5d8f" stroke="#12305f" stroke-width="7"/>
    <circle cx="92" cy="114" r="24" fill="#ff5d8f" stroke="#12305f" stroke-width="7"/>
    <circle cx="164" cy="114" r="24" fill="#ff5d8f" stroke="#12305f" stroke-width="7"/>
    <circle cx="128" cy="154" r="24" fill="#ff5d8f" stroke="#12305f" stroke-width="7"/>`, '#f9a8d4'),
  wateringCan: svgShell(`
    <path d="M74 116h78c22 0 39 17 39 39v27H74v-66z" fill="#38bdf8" stroke="#12305f" stroke-width="8"/>
    <path d="M152 124c13-27 41-22 50 6M190 138l34-15M84 116V88h43v28M58 139H36" stroke="#12305f" stroke-width="8" stroke-linecap="round"/>
    <circle cx="211" cy="122" r="6" fill="#38bdf8"/><circle cx="226" cy="114" r="5" fill="#38bdf8"/>`, '#7dd3fc'),
  crescent: svgShell(`
    <path d="M153 55c-37 17-52 60-33 95 16 29 48 43 80 35-18 30-57 44-94 31-45-17-69-67-52-112 15-40 55-60 99-49z" fill="#ffd84d" stroke="#12305f" stroke-width="8"/>
    <path d="m72 75 10 20 22 3-16 15 4 22-20-11-20 11 4-22-16-15 22-3 10-20z" fill="#38bdf8" stroke="#12305f" stroke-width="7"/>`, '#fde047'),
  beeCharacter: svgShell(`
    <ellipse cx="132" cy="137" rx="58" ry="43" fill="#ffd84d" stroke="#12305f" stroke-width="8"/>
    <path d="M104 101c-28-38-74 4-36 39 17 16 41 9 48-8M152 101c28-38 74 4 36 39-17 16-41 9-48-8" fill="#dff7ff" stroke="#12305f" stroke-width="7" opacity=".92"/>
    <path d="M111 101v72M133 94v86M156 103v66" stroke="#12305f" stroke-width="10"/>
    <circle cx="105" cy="130" r="6" fill="#12305f"/><circle cx="158" cy="130" r="6" fill="#12305f"/>
    <path d="M106 73c-7-20-21-26-32-21M150 73c7-20 21-26 32-21" stroke="#12305f" stroke-width="7" stroke-linecap="round"/>`, '#fde047'),
  ikoobotCharacter: svgShell(`
    <rect x="68" y="78" width="120" height="110" rx="28" fill="#dff7ff" stroke="#12305f" stroke-width="8"/>
    <rect x="86" y="102" width="84" height="48" rx="16" fill="#0f72b8" stroke="#12305f" stroke-width="7"/>
    <circle cx="111" cy="126" r="8" fill="#a7f3d0"/><circle cx="145" cy="126" r="8" fill="#a7f3d0"/>
    <path d="M111 160c12 9 24 9 36 0" stroke="#12305f" stroke-width="7" stroke-linecap="round"/>
    <path d="M128 78V51M114 51h28M68 136H42M188 136h26" stroke="#12305f" stroke-width="8" stroke-linecap="round"/>
    <circle cx="128" cy="51" r="10" fill="#ffd84d" stroke="#12305f" stroke-width="6"/>`, '#93c5fd'),
  certificate: svgShell(`
    <rect x="56" y="73" width="144" height="102" rx="14" fill="#fff8dc" stroke="#12305f" stroke-width="8"/>
    <path d="M86 109h84M86 136h62" stroke="#38bdf8" stroke-width="10" stroke-linecap="round"/>
    <circle cx="168" cy="172" r="24" fill="#ffd84d" stroke="#12305f" stroke-width="7"/>
    <path d="m158 192-12 30 22-12 22 12-12-30" fill="#ff5d8f" stroke="#12305f" stroke-width="7" stroke-linejoin="round"/>`, '#fef08a'),
};

function commandKey(command) {
  return [
    command.type,
    command.value ?? '',
    command.text ?? '',
    command.targetText ?? '',
    command.objectId ?? '',
    command.targetId ?? '',
    command.choiceId ?? '',
    command.soundId ?? '',
    command.times ?? '',
    command.repeatCommand ? JSON.stringify(command.repeatCommand) : '',
    command.promptText ?? '',
  ].join('|');
}

function dedupeCommands(commands) {
  const seen = new Set();
  const result = [];
  commands.forEach((command) => {
    const key = commandKey(command);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(command);
  });
  return result;
}

const command = {
  start: () => ({ type: 'start', icon: 'flag', label: 'Start', color: '#ffd84d' }),
  right: (value = 5, label = `Kanan ${value}`) => ({ type: 'moveRight', value, icon: 'arrow-right', label, color: '#168eea' }),
  left: (value = 5, label = `Kiri ${value}`) => ({ type: 'moveLeft', value, icon: 'arrow-left', label, color: '#168eea' }),
  up: (value = 4, label = `Naik ${value}`) => ({ type: 'moveUp', value, icon: 'arrow-up', label, color: '#168eea' }),
  down: (value = 4, label = `Turun ${value}`) => ({ type: 'moveDown', value, icon: 'arrow-down', label, color: '#168eea' }),
  jump: (value = 4, label = `Lompat ${value}`) => ({ type: 'jump', value, icon: 'jump', label, color: '#ff9f18' }),
  wait: (value = 1, label = `Tunggu ${value}`) => ({ type: 'wait', value, icon: 'wait', label, color: '#ff8a96' }),
  say: (text, label = 'Bicara') => ({ type: 'say', text, icon: 'say', label, color: '#b865dd' }),
  sound: (soundId, label = sounds[soundId]?.name || 'Suara') => ({ type: 'sound', soundId, icon: 'sound', label, color: '#27c488' }),
  record: (targetText, label = 'Rekam Suara') => ({ type: 'recordVoice', targetText, duration: 3, icon: 'mic', label, color: '#f0528d' }),
  write: (promptText, label = 'Tulis Pesan') => ({ type: 'writeMessage', message: '', promptText, icon: 'write', label, color: '#31b87d' }),
  pick: (objectId, label = 'Ambil') => ({ type: 'pick', objectId, icon: 'pick', label, color: '#f97316' }),
  drop: (targetId, label = 'Taruh') => ({ type: 'drop', targetId, icon: 'drop', label, color: '#14b8a6' }),
  choice: (choiceId, text, label = text, correct = true) => ({ type: 'choice', choiceId, text, correct, icon: 'choice', label, color: correct ? '#8b5cf6' : '#94a3b8' }),
  repeat: (times, repeatCommand, label = `Ulangi ${times}x`) => ({ type: 'repeat', times, repeatCommand, icon: 'repeat', label, color: '#7c5cff' }),
  turnRight: (value = 3, label = 'Putar Kanan') => ({ type: 'turnRight', value, icon: 'turn-right', label, color: '#7c5cff' }),
  turnLeft: (value = 3, label = 'Putar Kiri') => ({ type: 'turnLeft', value, icon: 'turn-left', label, color: '#7c5cff' }),
  reset: () => ({ type: 'reset', icon: 'reset', label: 'Ulang', color: '#64748b' }),
};

const hiddenMove = (item, label) => ({ ...item, label, hideValue: true });
const stageOneCommand = {
  right: () => hiddenMove(command.right(7), 'Kanan'),
  left: () => hiddenMove(command.left(3), 'Kiri'),
  up: () => hiddenMove(command.up(3), 'Naik'),
  down: () => hiddenMove(command.down(3), 'Turun'),
  sound: () => command.sound('salam', 'Suara'),
  say: () => command.say("Assalamu'alaikum!", 'Bicara'),
  record: () => command.record("Assalamu'alaikum!", 'Rekam'),
};

const stageOnePalette = [
  command.start(),
  stageOneCommand.right(),
  stageOneCommand.left(),
  stageOneCommand.up(),
  stageOneCommand.down(),
  stageOneCommand.sound(),
  stageOneCommand.say(),
  stageOneCommand.record(),
];

function createListeningPractice(phrase, soundId, movementPatterns) {
  const moveBlocks = {
    right: () => hiddenMove(command.right(7), 'Kanan'),
    left: () => hiddenMove(command.left(3), 'Kiri'),
    up: () => hiddenMove(command.up(3), 'Naik'),
    down: () => hiddenMove(command.down(3), 'Turun'),
  };
  const speechBlocks = {
    sound: () => command.sound(soundId, 'Suara'),
    say: () => command.say(phrase, 'Bicara'),
    record: () => command.record(phrase, 'Rekam'),
  };
  const expectedMoveCounts = { level1: 2, level2: 4, level3: 7 };
  const movesFor = (levelId) => {
    const pattern = movementPatterns[levelId] || [];
    if (pattern.length !== expectedMoveCounts[levelId]) {
      throw new Error(`${phrase} ${levelId} membutuhkan ${expectedMoveCounts[levelId]} perintah gerak.`);
    }

    return pattern.map((direction) => {
      const createMove = moveBlocks[direction];
      if (!createMove) throw new Error(`Arah ${direction} tidak dikenal.`);
      return createMove();
    });
  };

  return {
    palette: [
      command.start(),
      moveBlocks.right(),
      moveBlocks.left(),
      moveBlocks.up(),
      moveBlocks.down(),
      speechBlocks.sound(),
      speechBlocks.say(),
      speechBlocks.record(),
    ],
    level1: [command.start(), ...movesFor('level1'), speechBlocks.say(), speechBlocks.sound()],
    level2: [command.start(), ...movesFor('level2'), speechBlocks.say(), speechBlocks.sound()],
    level3: [
      command.start(),
      ...movesFor('level3'),
      speechBlocks.say(),
      speechBlocks.record(),
    ],
  };
}

const alhamdulillahPractice = createListeningPractice('Alhamdulillah', 'alhamdulillah', {
  level1: ['up', 'right'],
  level2: ['right', 'down', 'left', 'right'],
  level3: ['up', 'right', 'down', 'right', 'left', 'up', 'right'],
});

const masyaallahPractice = createListeningPractice('MasyaAllah', 'masyaallah', {
  level1: ['right', 'up'],
  level2: ['up', 'right', 'right', 'down'],
  level3: ['right', 'up', 'right', 'down', 'left', 'right', 'right'],
});

const bismillahPractice = createListeningPractice('Bismillah', 'bismillah', {
  level1: ['down', 'right'],
  level2: ['down', 'right', 'up', 'right'],
  level3: ['right', 'down', 'right', 'up', 'left', 'right', 'up'],
});

const stageFiveCommand = {
  right: () => hiddenMove(command.right(27), 'Kanan'),
  left: () => hiddenMove(command.left(27), 'Kiri'),
  up: () => hiddenMove(command.up(6), 'Naik'),
  down: () => hiddenMove(command.down(6), 'Turun'),
  jump: () => hiddenMove(command.jump(7), 'Lompat'),
};

const stageFivePalette = [
  command.start(),
  stageFiveCommand.right(),
  stageFiveCommand.left(),
  stageFiveCommand.up(),
  stageFiveCommand.down(),
  stageFiveCommand.jump(),
];

const stageSixCommand = {
  pickSandals: () => command.pick('stage-6-sandals', 'Ambil Sandal'),
  dropSandals: () => command.drop('stage-6-shelf', 'Rapikan di Rak'),
  sayEntryPrayer: () => command.say('Allahummaftah li abwaba rahmatik', 'Baca Doa Masuk'),
  recordEntryPrayer: () => command.record('Allahummaftah li abwaba rahmatik', 'Rekam Doa Masuk'),
};

const stageSixMovementPalette = [
  command.start(),
  stageFiveCommand.right(),
  stageFiveCommand.left(),
  stageFiveCommand.up(),
  stageFiveCommand.down(),
];

const stageSixLevelOnePalette = [
  ...stageSixMovementPalette,
  stageSixCommand.pickSandals(),
  stageSixCommand.dropSandals(),
];

const stageSixLevelTwoPalette = [
  ...stageSixMovementPalette,
  stageSixCommand.sayEntryPrayer(),
  stageSixCommand.recordEntryPrayer(),
];

const stageSevenCommand = {
  choosePromise: () => command.choice('stage-7-plan', 'InsyaAllah', 'Pilih InsyaAllah'),
  sayPromise: () => command.say('Besok mengaji, InsyaAllah', 'Ucap InsyaAllah'),
  recordPromise: () => command.record('Besok mengaji, InsyaAllah', 'Rekam Janji'),
};

const stageSevenPalette = [
  command.start(),
  stageFiveCommand.right(),
  stageFiveCommand.left(),
  stageFiveCommand.up(),
  stageFiveCommand.down(),
  stageSevenCommand.choosePromise(),
  stageSevenCommand.sayPromise(),
];

const stageEightCommand = {
  pickSoap: () => command.pick('stage-8-soap', 'Ambil Sabun'),
  returnSoap: () => command.drop('stage-8-wash-station', 'Taruh Sabun'),
  chooseRightHand: () => command.choice('stage-8-right-hand', 'Gunakan tangan kanan', 'Pilih Tangan Kanan'),
  sayBismillah: () => command.say('Bismillah', 'Ucap Bismillah'),
  hearBismillah: () => command.sound('bismillah', 'Dengar Bismillah'),
  sayAlhamdulillah: () => ({ ...command.say('Alhamdulillah', 'Ucap Alhamdulillah'), color: '#f59e0b' }),
  hearAlhamdulillah: () => ({ ...command.sound('alhamdulillah', 'Dengar Alhamdulillah'), color: '#06b6d4' }),
};

const stageEightBasePalette = [
  command.start(),
  stageFiveCommand.right(),
  stageFiveCommand.left(),
  stageFiveCommand.up(),
  stageFiveCommand.down(),
  stageEightCommand.pickSoap(),
  stageEightCommand.returnSoap(),
  stageEightCommand.sayBismillah(),
  stageEightCommand.hearBismillah(),
];

const stageFiveRouteLayouts = {
  'level-1': {
    actorFootOffset: 135,
    tileSize: { width: 140, height: 82 },
    points: [
      { x: 330, y: 705 },
      { x: 550, y: 705 },
      { x: 780, y: 705 },
      { x: 1080, y: 705 },
      { x: 1080, y: 565 },
      { x: 1080, y: 425 },
      { x: 880, y: 425 },
      { x: 880, y: 285 },
      { x: 880, y: 150 },
    ],
  },
  'level-2': {
    actorFootOffset: 135,
    tileSize: { width: 132, height: 84 },
    points: [
      { x: 220, y: 755 },
      { x: 220, y: 620 },
      { x: 500, y: 620 },
      { x: 750, y: 620 },
      { x: 1030, y: 620 },
      { x: 1030, y: 470 },
      { x: 780, y: 470 },
      { x: 780, y: 340 },
      { x: 1030, y: 340 },
      { x: 1250, y: 340 },
      { x: 1250, y: 200 },
      { x: 1080, y: 200 },
    ],
  },
  'level-3': {
    actorFootOffset: 135,
    tileSize: { width: 116, height: 76 },
    points: [
      { x: 220, y: 785 },
      { x: 430, y: 785 },
      { x: 650, y: 785 },
      { x: 920, y: 785 },
      { x: 920, y: 650 },
      { x: 720, y: 650 },
      { x: 510, y: 650 },
      { x: 510, y: 520 },
      { x: 740, y: 520 },
      { x: 970, y: 520 },
      { x: 1220, y: 520 },
      { x: 1220, y: 390 },
      { x: 1010, y: 390 },
      { x: 800, y: 390 },
      { x: 800, y: 220 },
      { x: 1040, y: 220 },
    ],
  },
};

function instructionFromCommand(item, index) {
  const instruction = {
    order: index + 1,
    command: item.type,
    label: item.label,
    icon: item.icon,
  };

  [
    'value',
    'text',
    'targetText',
    'objectId',
    'targetId',
    'choiceId',
    'times',
    'repeatCommand',
    'duration',
    'promptText',
    'soundId',
    'hideValue',
  ].forEach((key) => {
    if (item[key] !== undefined) instruction[key] = item[key];
  });

  return instruction;
}

function level(id, label, description, items, reward, extras = [], maxCommands, paletteCommands) {
  const instructions = items.map(instructionFromCommand);

  return {
    id,
    title: label,
    label,
    description,
    maxCommands: maxCommands || instructions.length || 8,
    instructions,
    commands: dedupeCommands(paletteCommands || [...items, ...extras]),
    reward,
  };
}

function visualRouteLevel(id, label, description, items, backgroundId, badgeTitle) {
  const layout = stageFiveRouteLayouts[id];
  if (!layout || layout.points.length !== items.length) {
    throw new Error(`${id} harus memiliki satu titik rute untuk setiap perintah.`);
  }

  const route = {
    ...layout,
    missionTitle: 'Jalur Masjid',
    points: layout.points.map((point, index) => ({
      ...point,
      kind: index === 0 ? 'start' : index === layout.points.length - 1 ? 'goal' : 'path',
      hint: items[index].type,
    })),
    startLabel: 'START',
    goalLabel: 'MASJID',
  };
  const jumpSteps = items
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => item.type === 'jump' && index > 0);
  const obstacles = jumpSteps.map(({ index }, obstacleIndex) => {
    const before = route.points[index - 1];
    const after = route.points[index];
    return object(
    'log',
    `${id}-jump-log-${obstacleIndex + 1}`,
    'Batang Kayu',
    'obstacle',
    (before.x + after.x) / 2,
    (before.y + after.y) / 2 + route.actorFootOffset,
    90,
    46,
    { showHalo: false, depth: 3 },
    );
  });

  return {
    ...level(id, label, description, items, reward(5, badgeTitle), [], items.length, stageFivePalette),
    instructionMode: 'visual-route',
    route,
    objects: obstacles,
    startBackgroundId: backgroundId,
  };
}

function storyRouteLevel(stageNumber, id, label, description, items, backgroundId, badgeTitle, options) {
  const {
    points,
    objects = [],
    palette,
    missionTitle,
    goalLabel,
    tileSize,
    actorFootOffset = 120,
  } = options;

  if (!points || points.length !== items.length) {
    throw new Error(`Stage ${stageNumber} ${id} harus memiliki satu titik rute untuk setiap perintah.`);
  }

  return {
    ...level(id, label, description, items, reward(stageNumber, badgeTitle), [], items.length, palette),
    instructionMode: 'visual-route',
    route: {
      actorFootOffset,
      tileSize: tileSize || (items.length <= 8 ? { width: 126, height: 76 } : { width: 108, height: 70 }),
      missionTitle,
      startLabel: 'START',
      goalLabel,
      points: points.map((point, index) => ({
        ...point,
        kind: index === 0 ? 'start' : index === points.length - 1 ? 'goal' : 'path',
        hint: items[index].type,
        hintColor: items[index].color,
      })),
    },
    objects,
    startBackgroundId: backgroundId,
  };
}

function withBackgroundReveal(stageLevel, startBackgroundId, completionBackgroundId, completionMessage) {
  return {
    ...stageLevel,
    objects: [],
    startBackgroundId,
    completionBackgroundId,
    completionMessage,
  };
}

function reward(stageNumber, title, stars = 3) {
  return {
    stars,
    badgeId: `stage-${stageNumber}-badge`,
    badgeTitle: title,
    badgeText: 'Misi selesai. Tantangan berikutnya siap dicoba bersama guru.',
    unlockId: `stage-${stageNumber}-unlock`,
    unlockTitle: stageNumber < 24 ? `Stage ${stageNumber + 1}` : 'Koleksi cerita akhir',
  };
}

function object(asset, id, name, kind, x, y, width = 130, height = 130, extra = {}) {
  const displayWidth = asset === 'friend' && width <= 160 ? 360 : width;
  const displayHeight = asset === 'friend' && height <= 160 ? 360 : height;
  const friendDefaults = asset === 'friend' ? { showHalo: false } : {};

  return {
    id,
    name,
    file: objectUrl(asset),
    kind,
    position: { x, y },
    displaySize: { width: displayWidth, height: displayHeight },
    interactionRadius: extra.interactionRadius || 210,
    ...friendDefaults,
    ...extra,
  };
}

function mosqueEtiquetteObjects(sandalsPosition, shelfPosition) {
  return [
    object('sandals', 'stage-6-sandals', 'Sandal Ali', 'collectible', sandalsPosition.x, sandalsPosition.y, 112, 88, {
      targetId: 'stage-6-shelf',
      interactionRadius: 270,
      pickupText: 'Sandal sudah diambil.',
      depth: 1.32,
    }),
    object('shelf', 'stage-6-shelf', 'Rak Sandal', 'target', shelfPosition.x, shelfPosition.y, 170, 170, {
      interactionRadius: 310,
      dropText: 'MasyaAllah, sandal Ali tersusun rapi.',
      depth: 1.28,
    }),
  ];
}

function promisePlanObject(position) {
  return [
    object('planCard', 'stage-7-plan', 'Rencana Mengaji', 'choice', position.x, position.y, 150, 172, {
      label: 'Rencana Besok',
      choiceText: 'Besok mengaji, InsyaAllah.',
      interactionRadius: 290,
      depth: 1.25,
    }),
  ];
}

function mealEtiquetteObjects(soapPosition, washPosition, handPosition, foodPosition) {
  return [
    object('soap', 'stage-8-soap', 'Sabun', 'collectible', soapPosition.x, soapPosition.y, 96, 96, {
      targetId: 'stage-8-wash-station',
      interactionRadius: 270,
      pickupText: 'Ayo cuci tangan sampai bersih.',
      depth: 1.32,
    }),
    object('wudhuStation', 'stage-8-wash-station', 'Tempat Cuci Tangan', 'target', washPosition.x, washPosition.y, 156, 156, {
      interactionRadius: 310,
      dropText: 'Tangan sudah bersih dan sabun dikembalikan.',
      depth: 1.24,
    }),
    object('hand', 'stage-8-right-hand', 'Tangan Kanan', 'choice', handPosition.x, handPosition.y, 112, 128, {
      choiceText: 'Gunakan tangan kanan.',
      interactionRadius: 300,
      depth: 1.3,
    }),
    object('food', 'stage-8-meal', 'Makanan', 'decoration', foodPosition.x, foodPosition.y, 150, 124, {
      showHalo: false,
      depth: 1.16,
    }),
  ];
}

function generatedBackgrounds(stageNumber) {
  if (stageNumber === 1) {
    return stageOneBackgrounds.map(([id, name, file, thumbnail]) => ({ id, name, file, thumbnail, fit: 'cover' }));
  }

  if (stageNumber === 2) {
    return [
      ...stageTwoBackgrounds.map(([id, name, file, thumbnail]) => ({ id, name, file, thumbnail, fit: 'cover' })),
      stageTwoRevealBackground,
    ];
  }

  if (stageNumber === 4) {
    const startBackgrounds = [stageOneBackgrounds[1], stageOneBackgrounds[2], stageOneBackgrounds[0]]
      .map(([id, name, file, thumbnail]) => ({ id: `stage-4-${id}`, name, file, thumbnail, fit: 'cover' }));
    return [...startBackgrounds, ...stageFourRevealBackgrounds];
  }

  if (stageNumber === 5) return stageFiveBackgrounds;

  const names = backgroundNamesByStage[stageNumber] || ['Dunia Ceria', 'Petualangan', 'Tantangan'];
  const backgrounds = names.map((name, index) => ({
    id: `stage-${stageNumber}-bg-${index + 1}`,
    name,
    file: `/assets/stages/stage-${stageNumber}/backgrounds/bg-${index + 1}.png`,
    thumbnail: `/assets/stages/stage-${stageNumber}/backgrounds/bg-${index + 1}.png`,
    fit: 'cover',
  }));

  return stageNumber === 3 ? [...backgrounds, stageThreeRevealBackground] : backgrounds;
}

function stageSummary(stage) {
  const thumbnail = stage.thumbnail || (stage.number <= 2
    ? `/assets/stages/stage-${stage.number}/thumbnails/stage-preview.png`
    : generatedBackgrounds(stage.number)[0].thumbnail);

  return {
    id: `stage-${stage.number}`,
    title: stage.title,
    manifest: `/assets/stages/stage-${stage.number}/manifest.json`,
    thumbnail,
    status: 'active',
    difficulty: stage.number,
  };
}

const wrongChoices = {
  hello: command.choice('wrong-hello', 'Halo dulu', 'Halo', false),
  later: command.choice('wrong-later', 'Nanti saja', 'Nanti', false),
  hide: command.choice('wrong-hide', 'Sembunyikan', 'Sembunyi', false),
  hurry: command.choice('wrong-hurry', 'Langsung jalan', 'Langsung', false),
};

const stages = [
  {
    number: 1,
    title: 'Mengucap Salam',
    description: 'Kita belajar menjadi anak baik dengan selalu mengucap salam.',
    objects: [
      object('friend', 'friend-salam', 'Teman', 'npc', 910, 670, 585, 585, { label: 'Teman', choiceText: "Assalamu'alaikum!" }),
    ],
    levels: [
      level(
        'level-1',
        'Lv 1',
        'Jalan ke teman lalu ucap salam.',
        [command.start(), stageOneCommand.right(), stageOneCommand.right(), stageOneCommand.say(), stageOneCommand.sound()],
        reward(1, 'Pemula Salam'),
        [],
        undefined,
        stageOnePalette,
      ),
      level(
        'level-2',
        'Lv 2',
        'Jalur sedikit lebih menantang tanpa blok tunggu.',
        [command.start(), stageOneCommand.right(), stageOneCommand.up(), stageOneCommand.down(), stageOneCommand.right(), stageOneCommand.say(), stageOneCommand.sound()],
        reward(1, 'Salam Rapi'),
        [],
        undefined,
        stageOnePalette,
      ),
      {
        ...level(
          'level-3',
          'Lv 3',
          'Susun 10 blok, dekati teman, lalu rekam salam dengan suara sendiri.',
          [
            command.start(),
            stageOneCommand.right(),
            stageOneCommand.right(),
            stageOneCommand.up(),
            stageOneCommand.down(),
            stageOneCommand.right(),
            stageOneCommand.left(),
            stageOneCommand.right(),
            stageOneCommand.say(),
            stageOneCommand.record(),
          ],
          reward(1, 'Sahabat Salam'),
          [],
          10,
          stageOnePalette,
        ),
        objects: [
          object('friend', 'friend-salam', 'Teman', 'npc', 1180, 670, 585, 585, { label: 'Teman', choiceText: "Assalamu'alaikum!" }),
        ],
      },
    ],
  },
  {
    number: 2,
    title: 'Mengucap Alhamdulillah',
    description: 'Dengarkan contoh suara, lalu latih mengucapkan Alhamdulillah saat menerima nikmat.',
    objects: [],
    levels: [
      withBackgroundReveal(
        level('level-1', 'Lv 1', 'Susun 5 blok, dengarkan contoh, lalu ucapkan Alhamdulillah.', alhamdulillahPractice.level1, reward(2, 'Anak Bersyukur'), [], undefined, alhamdulillahPractice.palette),
        'stage-2-taman',
        'stage-2-food-reveal',
        'Wah, banyak makanan lezat!\nAyo ucapkan Alhamdulillah.',
      ),
      withBackgroundReveal(
        level('level-2', 'Lv 2', 'Susun 7 blok dan dengarkan kembali ucapan Alhamdulillah.', alhamdulillahPractice.level2, reward(2, 'Syukur Hebat'), [], undefined, alhamdulillahPractice.palette),
        'stage-2-taman',
        'stage-2-food-reveal',
        'Alhamdulillah, Allah memberi banyak nikmat.\nAyo ucapkan bersama.',
      ),
      withBackgroundReveal(
        level('level-3', 'Lv 3', 'Susun 10 blok, lalu rekam ucapan Alhamdulillah dengan suara sendiri.', alhamdulillahPractice.level3, reward(2, 'Sahabat Syukur'), [], 10, alhamdulillahPractice.palette),
        'stage-2-taman',
        'stage-2-food-reveal',
        'Makanannya sudah siap.\nUcapkan Alhamdulillah dengan suara lantang!',
      ),
    ],
  },
  {
    number: 3,
    title: 'Mengucap MasyaAllah',
    description: 'Dengarkan contoh suara, lalu latih mengucapkan MasyaAllah saat melihat ciptaan Allah.',
    characters: [standardCharacters[1], standardCharacters[0], standardCharacters[2]],
    objects: [],
    levels: [
      withBackgroundReveal(
        level('level-1', 'Lv 1', 'Susun 5 blok, dengarkan contoh, lalu ucapkan MasyaAllah.', masyaallahPractice.level1, reward(3, 'Penjelajah Indah'), [], undefined, masyaallahPractice.palette),
        'stage-3-bg-1',
        'stage-3-nature-reveal',
        'MasyaAllah, indah sekali ciptaan Allah!\nAyo ucapkan MasyaAllah.',
      ),
      withBackgroundReveal(
        level('level-2', 'Lv 2', 'Susun 7 blok dan dengarkan kembali ucapan MasyaAllah.', masyaallahPractice.level2, reward(3, 'Kagum Ciptaan Allah'), [], undefined, masyaallahPractice.palette),
        'stage-3-bg-1',
        'stage-3-nature-reveal',
        'Lihat gunung dan air terjunnya.\nMasyaAllah!',
      ),
      withBackgroundReveal(
        level('level-3', 'Lv 3', 'Susun 10 blok, lalu rekam ucapan MasyaAllah dengan suara sendiri.', masyaallahPractice.level3, reward(3, 'Pilihan Kagum'), [], 10, masyaallahPractice.palette),
        'stage-3-bg-1',
        'stage-3-nature-reveal',
        'Alam ini indah dan menakjubkan.\nUcapkan MasyaAllah dengan suara lantang!',
      ),
    ],
  },
  {
    number: 4,
    title: 'Mengucap Bismillah',
    description: 'Dengarkan contoh suara, lalu latih mengucapkan Bismillah sebelum memulai kegiatan baik.',
    thumbnail: '/assets/stages/stage-4/backgrounds/bismillah-meal.png',
    objects: [],
    levels: [
      withBackgroundReveal(
        level(
          'level-1',
          'Lv 1',
          'Susun 5 blok, dengarkan contoh, lalu ucapkan Bismillah sebelum makan.',
          bismillahPractice.level1,
          reward(4, 'Siap Makan dengan Bismillah'),
          [],
          undefined,
          bismillahPractice.palette,
        ),
        'stage-4-taman',
        'stage-4-bismillah-meal',
        'Makanan sudah siap.\nAyo ucapkan Bismillah sebelum makan.',
      ),
      withBackgroundReveal(
        level(
          'level-2',
          'Lv 2',
          'Susun 7 blok dan dengarkan kembali ucapan Bismillah sebelum belajar.',
          bismillahPractice.level2,
          reward(4, 'Belajar dengan Bismillah'),
          [],
          undefined,
          bismillahPractice.palette,
        ),
        'stage-4-sekolah',
        'stage-4-bismillah-study',
        'Waktunya belajar.\nUcapkan Bismillah sebelum mulai.',
      ),
      withBackgroundReveal(
        level(
          'level-3',
          'Lv 3',
          'Susun 10 blok, lalu rekam ucapan Bismillah sebelum bepergian.',
          bismillahPractice.level3,
          reward(4, 'Sahabat Bismillah'),
          [],
          10,
          bismillahPractice.palette,
        ),
        'stage-4-masjid-ceria',
        'stage-4-bismillah-travel',
        'Kita siap bepergian.\nUcapkan Bismillah sebelum berangkat.',
      ),
    ],
  },
  {
    number: 5,
    title: 'Antar Ali ke Masjid',
    description: 'Bantu Ali mengikuti jalur taman hingga tiba di masjid.',
    thumbnail: '/assets/stages/stage-5/backgrounds/masjid-board-lv1.png',
    characters: [stageFiveAli],
    objects: [],
    levels: [
      visualRouteLevel(
        'level-1',
        'Lv 1',
        'Ikuti tanda panah dari START. Lompat saat bertemu kayu, lalu antar Ali ke masjid.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.jump(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.up(),
        ],
        'stage-5-masjid-route-lv1',
        'Penjelajah Masjid',
      ),
      visualRouteLevel(
        'level-2',
        'Lv 2',
        'Ikuti tanda panah pada jalur yang lebih panjang dan lompati dua batang kayu.',
        [
          command.start(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.jump(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.jump(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
        ],
        'stage-5-masjid-route-lv2',
        'Ahli Jalur Taman',
      ),
      visualRouteLevel(
        'level-3',
        'Lv 3',
        'Baca semua tanda arah, ikuti jalur berkelok, dan lompati setiap batang kayu.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.jump(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.jump(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
        ],
        'stage-5-masjid-route-lv3',
        'Navigator Masjid',
      ),
    ],
  },
  {
    number: 6,
    title: 'Adab Masuk Masjid',
    description: 'Bantu Ali merapikan sandal, membaca doa masuk masjid, lalu berjalan tenang menuju saf.',
    thumbnail: '/assets/stages/stage-6/backgrounds/bg-1.png',
    characters: [stageFiveAli],
    objects: [],
    levels: [
      storyRouteLevel(
        6,
        'level-1',
        'Lv 1',
        'Ikuti jalur, ambil sandal Ali, lalu letakkan rapi di rak.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.right(),
          stageSixCommand.pickSandals(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageSixCommand.dropSandals(),
        ],
        'stage-6-bg-1',
        'Sandal Rapi',
        {
          missionTitle: 'Adab Masuk Masjid',
          goalLabel: 'RAK RAPI',
          palette: stageSixLevelOnePalette,
          objects: mosqueEtiquetteObjects({ x: 780, y: 720 }, { x: 1190, y: 500 }),
          points: [
            { x: 290, y: 710 },
            { x: 500, y: 710 },
            { x: 700, y: 710 },
            { x: 850, y: 710 },
            { x: 850, y: 530, actorPosition: { x: 700, y: 530 } },
            { x: 1060, y: 530, actorPosition: { x: 970, y: 530 } },
            { x: 1320, y: 530 },
          ],
        },
      ),
      storyRouteLevel(
        6,
        'level-2',
        'Lv 2',
        'Sampai di pintu masjid, ucapkan "Allahummaftah li abwaba rahmatik", lalu rekam suaramu.',
        [
          command.start(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageSixCommand.sayEntryPrayer(),
          stageSixCommand.recordEntryPrayer(),
        ],
        'stage-6-bg-2',
        'Sahabat Doa Masjid',
        {
          missionTitle: 'Doa Masuk Masjid',
          goalLabel: 'REKAM DOA',
          palette: stageSixLevelTwoPalette,
          tileSize: { width: 118, height: 72 },
          objects: [],
          points: [
            { x: 285, y: 750 },
            { x: 285, y: 590 },
            { x: 520, y: 590 },
            { x: 760, y: 590 },
            { x: 760, y: 400 },
            { x: 980, y: 400 },
            { x: 1210, y: 400 },
          ],
        },
      ),
      storyRouteLevel(
        6,
        'level-3',
        'Lv 3',
        'Ikuti arah di karpet dan antar Ali berjalan tenang sampai ke saf depan.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
        ],
        'stage-6-bg-3',
        'Saf Depan',
        {
          missionTitle: 'Menuju Saf Depan',
          goalLabel: 'SAF DEPAN',
          palette: stageSixMovementPalette,
          tileSize: { width: 110, height: 70 },
          objects: [],
          points: [
            { x: 270, y: 760 },
            { x: 470, y: 760 },
            { x: 470, y: 620 },
            { x: 700, y: 620 },
            { x: 700, y: 490 },
            { x: 540, y: 490 },
            { x: 540, y: 360 },
            { x: 800, y: 360 },
            { x: 800, y: 230 },
          ],
        },
      ),
    ],
  },
  {
    number: 7,
    title: 'Janji Baik, InsyaAllah',
    description: 'Aisyah membuat rencana baik, berusaha menepatinya, lalu mengucapkan InsyaAllah.',
    thumbnail: '/assets/stages/stage-7/backgrounds/bg-1.png',
    characters: [stageRouteAisyah],
    objects: [],
    levels: [
      storyRouteLevel(
        7,
        'level-1',
        'Lv 1',
        'Ikuti jalur ke kartu rencana, pilih ucapan yang tepat, lalu ucapkan InsyaAllah.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageSevenCommand.choosePromise(),
          stageSevenCommand.sayPromise(),
        ],
        'stage-7-bg-1',
        'Niat Baik',
        {
          missionTitle: 'Rencana Besok',
          goalLabel: 'JANJI BAIK',
          palette: stageSevenPalette,
          objects: promisePlanObject({ x: 760, y: 480 }),
          points: [
            { x: 290, y: 735 },
            { x: 500, y: 735 },
            { x: 500, y: 560 },
            { x: 720, y: 560 },
            { x: 900, y: 560 },
            { x: 1090, y: 560 },
          ],
        },
      ),
      storyRouteLevel(
        7,
        'level-2',
        'Lv 2',
        'Susun rute menuju tempat mengaji dan sampaikan rencana baik dengan InsyaAllah.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageSevenCommand.choosePromise(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageSevenCommand.sayPromise(),
        ],
        'stage-7-bg-2',
        'Rencana Rapi',
        {
          missionTitle: 'Pergi Mengaji',
          goalLabel: 'TEMPAT MENGAJI',
          palette: stageSevenPalette,
          objects: promisePlanObject({ x: 770, y: 535 }),
          points: [
            { x: 285, y: 750 },
            { x: 500, y: 750 },
            { x: 500, y: 590 },
            { x: 730, y: 590 },
            { x: 900, y: 590 },
            { x: 900, y: 420, actorPosition: { x: 730, y: 420 } },
            { x: 1120, y: 420, actorPosition: { x: 1000, y: 420 } },
            { x: 1300, y: 420 },
          ],
        },
      ),
      storyRouteLevel(
        7,
        'level-3',
        'Lv 3',
        'Selesaikan jalur berkelok, lalu rekam janji baik dengan suara sendiri.',
        [
          command.start(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageFiveCommand.right(),
          stageSevenCommand.choosePromise(),
          stageFiveCommand.left(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageSevenCommand.sayPromise(),
          stageSevenCommand.recordPromise(),
        ],
        'stage-7-bg-3',
        'Penjaga Janji',
        {
          missionTitle: 'Janji Baik',
          goalLabel: 'INSYAALLAH',
          palette: [...stageSevenPalette, stageSevenCommand.recordPromise()],
          tileSize: { width: 108, height: 70 },
          objects: promisePlanObject({ x: 740, y: 540 }),
          points: [
            { x: 275, y: 760 },
            { x: 275, y: 610 },
            { x: 490, y: 610 },
            { x: 700, y: 610 },
            { x: 865, y: 610 },
            { x: 650, y: 610, actorPosition: { x: 500, y: 610 } },
            { x: 650, y: 450, actorPosition: { x: 500, y: 450 } },
            { x: 890, y: 450, actorPosition: { x: 780, y: 450 } },
            { x: 1080, y: 450 },
            { x: 1270, y: 450 },
          ],
        },
      ),
    ],
  },
  {
    number: 8,
    title: 'Jalur Adab Makan',
    description: 'Cuci tangan, ucapkan Bismillah, gunakan tangan kanan, lalu bersyukur setelah makan.',
    thumbnail: '/assets/stages/stage-8/backgrounds/bg-1.png',
    characters: [stageFiveAli],
    objects: [],
    levels: [
      storyRouteLevel(
        8,
        'level-1',
        'Lv 1',
        'Ambil sabun, cuci tangan, lalu dengarkan dan ucapkan Bismillah sebelum makan.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageEightCommand.pickSoap(),
          stageEightCommand.returnSoap(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageEightCommand.sayBismillah(),
          stageEightCommand.hearBismillah(),
        ],
        'stage-8-bg-1',
        'Tangan Bersih',
        {
          missionTitle: 'Adab Sebelum Makan',
          goalLabel: 'MEJA MAKAN',
          palette: stageEightBasePalette,
          objects: mealEtiquetteObjects(
            { x: 500, y: 720 },
            { x: 620, y: 690 },
            { x: 880, y: 545 },
            { x: 1240, y: 500 },
          ),
          points: [
            { x: 285, y: 760 },
            { x: 480, y: 760 },
            { x: 640, y: 760 },
            { x: 800, y: 760 },
            { x: 800, y: 590, actorPosition: { x: 480, y: 590 } },
            { x: 1000, y: 590, actorPosition: { x: 800, y: 590 } },
            { x: 1160, y: 590 },
            { x: 1320, y: 590 },
          ],
        },
      ),
      storyRouteLevel(
        8,
        'level-2',
        'Lv 2',
        'Cuci tangan, pilih tangan kanan, lalu ucapkan Bismillah sebelum makan.',
        [
          command.start(),
          stageFiveCommand.up(),
          stageFiveCommand.right(),
          stageEightCommand.pickSoap(),
          stageEightCommand.returnSoap(),
          stageFiveCommand.right(),
          stageEightCommand.chooseRightHand(),
          stageFiveCommand.up(),
          stageEightCommand.sayBismillah(),
          stageEightCommand.hearBismillah(),
        ],
        'stage-8-bg-2',
        'Makan dengan Tangan Kanan',
        {
          missionTitle: 'Adab Makan',
          goalLabel: 'MEJA MAKAN',
          palette: [...stageEightBasePalette, stageEightCommand.chooseRightHand()],
          tileSize: { width: 106, height: 68 },
          objects: mealEtiquetteObjects(
            { x: 500, y: 570 },
            { x: 620, y: 535 },
            { x: 815, y: 535 },
            { x: 1260, y: 390 },
          ),
          points: [
            { x: 275, y: 760 },
            { x: 275, y: 610 },
            { x: 480, y: 610 },
            { x: 640, y: 610 },
            { x: 800, y: 610 },
            { x: 970, y: 610, actorPosition: { x: 780, y: 610 } },
            { x: 1130, y: 610 },
            { x: 1130, y: 440, actorPosition: { x: 780, y: 440 } },
            { x: 1280, y: 440 },
            { x: 1390, y: 440 },
          ],
        },
      ),
      storyRouteLevel(
        8,
        'level-3',
        'Lv 3',
        'Selesaikan seluruh adab makan sampai mengucapkan Alhamdulillah.',
        [
          command.start(),
          stageFiveCommand.right(),
          stageEightCommand.pickSoap(),
          stageEightCommand.returnSoap(),
          stageFiveCommand.up(),
          stageEightCommand.sayBismillah(),
          stageEightCommand.hearBismillah(),
          stageFiveCommand.right(),
          stageEightCommand.chooseRightHand(),
          command.wait(1, 'Makan Perlahan'),
          stageEightCommand.sayAlhamdulillah(),
          stageEightCommand.hearAlhamdulillah(),
        ],
        'stage-8-bg-3',
        'Anak Bersyukur',
        {
          missionTitle: 'Adab Makan Lengkap',
          goalLabel: 'BERSYUKUR',
          palette: [
            ...stageEightBasePalette,
            stageEightCommand.chooseRightHand(),
            command.wait(1, 'Makan Perlahan'),
            stageEightCommand.sayAlhamdulillah(),
            stageEightCommand.hearAlhamdulillah(),
          ],
          tileSize: { width: 96, height: 64 },
          actorFootOffset: 112,
          objects: mealEtiquetteObjects(
            { x: 450, y: 730 },
            { x: 590, y: 690 },
            { x: 850, y: 545 },
            { x: 1080, y: 365 },
          ),
          points: [
            { x: 245, y: 780 },
            { x: 430, y: 780 },
            { x: 580, y: 780 },
            { x: 730, y: 780 },
            { x: 730, y: 610, actorPosition: { x: 430, y: 610 } },
            { x: 880, y: 610 },
            { x: 1030, y: 610 },
            { x: 1200, y: 610, actorPosition: { x: 820, y: 610 } },
            { x: 1340, y: 610 },
            { x: 1340, y: 450 },
            { x: 1180, y: 450 },
            { x: 1020, y: 450 },
          ],
        },
      ),
    ],
  },
  {
    number: 9,
    title: 'Menjaga Kebersihan',
    description: 'Mulai memakai command pick dan drop untuk merapikan benda.',
    objects: [
      object('book', 'book-clean', 'Buku', 'collectible', 525, 730, 130, 130, { label: 'Buku', targetId: 'shelf-clean', pickupText: 'Buku diambil' }),
      object('shelf', 'shelf-clean', 'Rak', 'target', 895, 720, 160, 150, { label: 'Rak', dropText: 'Buku masuk rak' }),
      object('trash', 'trash-clean', 'Sampah', 'collectible', 620, 805, 110, 110, { label: 'Sampah', targetId: 'bin-clean', pickupText: 'Sampah diambil' }),
      object('bin', 'bin-clean', 'Tempat Sampah', 'target', 1040, 735, 145, 145, { label: 'Tempat' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Ambil satu buku lalu taruh di rak.', [command.start(), command.right(7), command.right(7), command.pick('book-clean', 'Ambil Buku'), command.right(7), command.right(7), command.drop('shelf-clean', 'Taruh Rak')], reward(9, 'Kamar Rapi')),
      level('level-2', 'Lv 2', 'Rapikan buku dan sampah.', [command.start(), command.right(7), command.right(7), command.pick('book-clean', 'Ambil Buku'), command.right(7), command.right(7), command.drop('shelf-clean', 'Taruh Rak'), command.left(7), command.pick('trash-clean', 'Ambil Sampah'), command.right(7), command.drop('bin-clean', 'Buang Sampah')], reward(9, 'Penjaga Bersih')),
      level('level-3', 'Lv 3', 'Tiga aksi dengan tujuan berbeda.', [command.start(), command.right(7), command.right(7), command.pick('book-clean', 'Ambil Buku'), command.right(7), command.right(7), command.drop('shelf-clean', 'Taruh Rak'), command.left(7), command.pick('trash-clean', 'Ambil Sampah'), command.right(7), command.drop('bin-clean', 'Buang Sampah'), command.say('Bersih itu indah'), command.sound('success', 'Hebat')], reward(9, 'Sahabat Kebersihan')),
    ],
  },
  {
    number: 10,
    title: 'Tolong, Maaf, Terima Kasih',
    description: 'Pilih respons sosial yang tepat di situasi berbeda.',
    objects: [
      object('friend', 'friend-help', 'Teman', 'choice', 650, 725, 150, 150, { label: 'Teman', choiceText: 'Terima kasih' }),
      object('pencil', 'pencil-help', 'Pensil', 'collectible', 500, 750, 120, 120, { targetId: 'friend-help', pickupText: 'Pensil diambil' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Dipinjami pensil lalu ucap terima kasih.', [command.start(), command.right(7), command.choice('friend-help', 'Terima kasih', 'Terima Kasih')], reward(10, 'Kata Baik'), [wrongChoices.hello]),
      level('level-2', 'Lv 2', 'Ambil pensil dan bantu teman.', [command.start(), command.right(7), command.pick('pencil-help', 'Ambil Pensil'), command.right(7), command.drop('friend-help', 'Beri Teman'), command.choice('friend-help', 'Terima kasih', 'Terima Kasih')], reward(10, 'Sahabat Penolong')),
      level('level-3', 'Lv 3', 'Pilih kata baik untuk beberapa situasi.', [command.start(), command.right(7), command.pick('pencil-help', 'Ambil Pensil'), command.right(7), command.drop('friend-help', 'Beri Teman'), command.choice('friend-help', 'Terima kasih', 'Terima Kasih'), command.say('Maaf ya teman'), command.sound('success', 'Hebat')], reward(10, 'Pandai Berkata Baik'), [wrongChoices.later]),
    ],
  },
  {
    number: 11,
    title: 'Belajar Wudhu',
    description: 'Station wudhu mengajarkan algoritma langkah demi langkah.',
    objects: [
      object('wudhuStation', 'station-hand', 'Cuci Tangan', 'checkpoint', 520, 735, 140, 140, { label: '1' }),
      object('wudhuStation', 'station-mouth', 'Berkumur', 'checkpoint', 720, 735, 140, 140, { label: '2' }),
      object('wudhuStation', 'station-face', 'Cuci Wajah', 'checkpoint', 920, 735, 140, 140, { label: '3' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Tiga station awal.', [command.start(), command.right(7), command.choice('station-hand', 'Cuci tangan', 'Cuci Tangan'), command.right(7), command.choice('station-mouth', 'Berkumur', 'Berkumur'), command.right(7), command.choice('station-face', 'Cuci wajah', 'Cuci Wajah')], reward(11, 'Urutan Wudhu')),
      level('level-2', 'Lv 2', 'Tambah jeda tertib.', [command.start(), command.right(7), command.choice('station-hand', 'Cuci tangan', 'Cuci Tangan'), command.wait(1), command.right(7), command.choice('station-mouth', 'Berkumur', 'Berkumur'), command.right(7), command.choice('station-face', 'Cuci wajah', 'Cuci Wajah')], reward(11, 'Wudhu Tertib')),
      level('level-3', 'Lv 3', 'Urutan lebih lengkap dengan suara.', [command.start(), command.say('Bismillah'), command.sound('bismillah', 'Bismillah'), command.right(7), command.choice('station-hand', 'Cuci tangan', 'Cuci Tangan'), command.right(7), command.choice('station-mouth', 'Berkumur', 'Berkumur'), command.right(7), command.choice('station-face', 'Cuci wajah', 'Cuci Wajah'), command.sound('success', 'Hebat')], reward(11, 'Sahabat Wudhu')),
    ],
  },
  {
    number: 12,
    title: 'Perlengkapan Shalat',
    description: 'Pilih perlengkapan shalat dan antar ke tempatnya.',
    objects: [
      object('prayerMat', 'sajadah-item', 'Sajadah', 'collectible', 520, 750, 130, 150, { targetId: 'prayer-area', pickupText: 'Sajadah diambil' }),
      object('mosqueTarget', 'prayer-area', 'Tempat Shalat', 'target', 900, 720, 170, 170, { label: 'Shalat', dropText: 'Siap shalat' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Ambil satu perlengkapan.', [command.start(), command.right(7), command.right(7), command.pick('sajadah-item', 'Ambil Sajadah'), command.right(7), command.right(7), command.drop('prayer-area', 'Taruh Sajadah')], reward(12, 'Siap Shalat')),
      level('level-2', 'Lv 2', 'Antar perlengkapan lalu salam.', [command.start(), command.right(7), command.right(7), command.pick('sajadah-item', 'Ambil Sajadah'), command.right(7), command.right(7), command.drop('prayer-area', 'Taruh Sajadah'), command.say("Assalamu'alaikum")], reward(12, 'Rapi Beribadah')),
      level('level-3', 'Lv 3', 'Pilih perlengkapan sesuai tujuan.', [command.start(), command.right(7), command.right(7), command.pick('sajadah-item', 'Ambil Sajadah'), command.right(7), command.right(7), command.drop('prayer-area', 'Taruh Sajadah'), command.choice('prayer-area', 'Siap shalat', 'Siap Shalat'), command.sound('success', 'Hebat')], reward(12, 'Sahabat Ibadah')),
    ],
  },
  {
    number: 13,
    title: 'Shalat 5 Waktu',
    description: 'Pilih gerbang waktu shalat yang tepat.',
    objects: [
      object('moon', 'time-subuh', 'Subuh', 'choice', 520, 620, 140, 140, { label: 'Subuh', choiceText: 'Subuh' }),
      object('mosqueTarget', 'time-maghrib', 'Maghrib', 'choice', 850, 710, 160, 160, { label: 'Maghrib', choiceText: 'Maghrib' }),
      object('starToken', 'time-five', '5 Waktu', 'choice', 1080, 650, 135, 135, { label: '5 Waktu', choiceText: 'Lima waktu' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Kenal Subuh dan Maghrib.', [command.start(), command.right(7), command.choice('time-subuh', 'Subuh', 'Subuh'), command.right(7), command.choice('time-maghrib', 'Maghrib', 'Maghrib')], reward(13, 'Kenal Waktu')),
      level('level-2', 'Lv 2', 'Tiga waktu shalat.', [command.start(), command.right(7), command.choice('time-subuh', 'Subuh', 'Subuh'), command.right(7), command.choice('time-maghrib', 'Maghrib', 'Maghrib'), command.right(7), command.choice('time-five', 'Isya', 'Isya')], reward(13, 'Pilih Waktu')),
      level('level-3', 'Lv 3', 'Lima waktu dengan cerita singkat.', [command.start(), command.say('Aku belajar shalat'), command.right(7), command.choice('time-subuh', 'Subuh', 'Subuh'), command.right(7), command.choice('time-maghrib', 'Maghrib', 'Maghrib'), command.right(7), command.choice('time-five', 'Lima waktu', '5 Waktu'), command.sound('success', 'Hebat')], reward(13, 'Sahabat Shalat')),
    ],
  },
  {
    number: 14,
    title: 'Sedekah',
    description: 'Collecting mission: ambil benda baik lalu masukkan ke kotak sedekah.',
    objects: [
      object('book', 'donation-book', 'Buku', 'collectible', 520, 740, 120, 120, { targetId: 'donation-box', pickupText: 'Buku diambil' }),
      object('food', 'donation-food', 'Makanan', 'collectible', 650, 770, 120, 120, { targetId: 'donation-box', pickupText: 'Makanan diambil' }),
      object('donationBox', 'donation-box', 'Kotak Sedekah', 'target', 940, 720, 165, 165, { label: 'Sedekah', dropText: 'Masuk kotak sedekah' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Satu benda untuk sedekah.', [command.start(), command.right(7), command.right(7), command.pick('donation-book', 'Ambil Buku'), command.right(7), command.right(7), command.drop('donation-box', 'Sedekahkan')], reward(14, 'Anak Dermawan')),
      level('level-2', 'Lv 2', 'Dua benda untuk sedekah.', [command.start(), command.right(7), command.right(7), command.pick('donation-book', 'Ambil Buku'), command.right(7), command.right(7), command.drop('donation-box', 'Sedekahkan'), command.left(7), command.pick('donation-food', 'Ambil Makanan'), command.right(7), command.drop('donation-box', 'Sedekahkan')], reward(14, 'Berbagi Bahagia')),
      level('level-3', 'Lv 3', 'Beberapa benda dengan ucapan baik.', [command.start(), command.say('Bismillah berbagi'), command.right(7), command.pick('donation-book', 'Ambil Buku'), command.right(7), command.drop('donation-box', 'Sedekahkan'), command.left(7), command.pick('donation-food', 'Ambil Makanan'), command.right(7), command.drop('donation-box', 'Sedekahkan'), command.sound('success', 'Hebat')], reward(14, 'Sahabat Sedekah')),
    ],
  },
  {
    number: 15,
    title: 'Berbagi dengan Teman',
    description: 'Berbagi sama rata memakai counting dan pengulangan sederhana.',
    objects: [
      object('apple', 'apple-share', 'Apel', 'collectible', 525, 740, 125, 125, { targetId: 'friend-share', pickupText: 'Apel diambil' }),
      object('friend', 'friend-share', 'Teman', 'target', 875, 720, 150, 150, { label: 'Teman', dropText: 'Teman mendapat bagian' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Berbagi untuk dua anak.', [command.start(), command.right(7), command.right(7), command.pick('apple-share', 'Ambil Apel'), command.right(7), command.right(7), command.drop('friend-share', 'Beri Teman')], reward(15, 'Berbagi Adil')),
      level('level-2', 'Lv 2', 'Pakai repeat untuk langkah yang sama.', [command.start(), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Kanan'), command.pick('apple-share', 'Ambil Apel'), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Kanan'), command.drop('friend-share', 'Beri Teman')], reward(15, 'Repeat Berbagi')),
      level('level-3', 'Lv 3', 'Jumlah benda lebih banyak.', [command.start(), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Kanan'), command.pick('apple-share', 'Ambil Apel'), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Kanan'), command.drop('friend-share', 'Beri Teman'), command.say('Berbagi itu indah'), command.sound('success', 'Hebat')], reward(15, 'Sahabat Berbagi')),
    ],
  },
  {
    number: 16,
    title: 'Jujur Itu Hebat',
    description: 'Branch choice: pilih jalan mengaku dan belajar sebab-akibat.',
    objects: [
      object('honestPath', 'honest-choice', 'Mengaku', 'choice', 700, 710, 165, 165, { label: 'Jujur', choiceText: 'Aku jujur' }),
      object('pond', 'hide-choice', 'Sembunyi', 'choice', 930, 730, 140, 110, { label: 'Salah', correct: false, choiceText: 'Sembunyi' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Pilih mengaku saat gelas pecah.', [command.start(), command.right(7), command.right(7), command.choice('honest-choice', 'Aku jujur', 'Mengaku')], reward(16, 'Jujur Hebat'), [wrongChoices.hide]),
      level('level-2', 'Lv 2', 'Mengaku lalu minta maaf.', [command.start(), command.right(7), command.right(7), command.choice('honest-choice', 'Aku jujur', 'Mengaku'), command.say('Maaf ya'), command.sound('success', 'Hebat')], reward(16, 'Berani Mengaku')),
      level('level-3', 'Lv 3', 'Pilih jalan baik dan lihat akibatnya.', [command.start(), command.right(7), command.right(7), command.choice('honest-choice', 'Aku jujur', 'Mengaku'), command.wait(1), command.say('Aku akan memperbaiki'), command.sound('success', 'Hebat')], reward(16, 'Anak Amanah'), [wrongChoices.hide]),
    ],
  },
  {
    number: 17,
    title: 'Sabar Menunggu Giliran',
    description: 'Wait before action: anak belajar timing dan tertib.',
    objects: [
      object('queueMarker', 'queue-slide', 'Antrian', 'checkpoint', 610, 725, 170, 150, { label: 'Antri', choiceText: 'Aku antri' }),
      object('starToken', 'turn-slide', 'Giliran', 'target', 900, 720, 130, 130, { label: 'Giliran', choiceText: 'Sekarang giliranku' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Tunggu satu kali sebelum maju.', [command.start(), command.wait(1), command.right(7), command.choice('queue-slide', 'Aku antri', 'Antri')], reward(17, 'Sabar Menunggu')),
      level('level-2', 'Lv 2', 'Tunggu lebih lama lalu maju.', [command.start(), command.wait(1), command.wait(1), command.right(7), command.choice('queue-slide', 'Aku antri', 'Antri'), command.right(7), command.choice('turn-slide', 'Giliranku', 'Giliran')], reward(17, 'Antri Rapi')),
      level('level-3', 'Lv 3', 'Antre beberapa anak.', [command.start(), command.wait(1), command.right(7), command.choice('queue-slide', 'Aku antri', 'Antri'), command.wait(1), command.right(7), command.choice('turn-slide', 'Giliranku', 'Giliran'), command.sound('success', 'Hebat')], reward(17, 'Penunggu Hebat'), [wrongChoices.hurry]),
    ],
  },
  {
    number: 18,
    title: 'Suka Menolong',
    description: 'Cari barang yang tepat lalu bantu teman.',
    objects: [
      object('pencil', 'help-pencil', 'Pensil', 'collectible', 520, 750, 120, 120, { targetId: 'help-friend', pickupText: 'Pensil diambil' }),
      object('aidBox', 'help-aid', 'Plester', 'collectible', 640, 750, 120, 120, { targetId: 'help-friend', pickupText: 'Plester diambil' }),
      object('friend', 'help-friend', 'Teman', 'target', 910, 720, 150, 150, { label: 'Teman', dropText: 'Teman terbantu' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Satu bantuan: pensil.', [command.start(), command.right(7), command.right(7), command.pick('help-pencil', 'Ambil Pensil'), command.right(7), command.right(7), command.drop('help-friend', 'Bantu Teman')], reward(18, 'Suka Menolong')),
      level('level-2', 'Lv 2', 'Dua bantuan.', [command.start(), command.right(7), command.pick('help-pencil', 'Ambil Pensil'), command.right(7), command.drop('help-friend', 'Bantu Teman'), command.left(7), command.pick('help-aid', 'Ambil Plester'), command.right(7), command.drop('help-friend', 'Bantu Teman')], reward(18, 'Penolong Cilik')),
      level('level-3', 'Lv 3', 'Pilih barang yang tepat.', [command.start(), command.right(7), command.right(7), command.pick('help-pencil', 'Ambil Pensil'), command.right(7), command.right(7), command.drop('help-friend', 'Bantu Teman'), command.choice('help-friend', 'Terima kasih', 'Terima Kasih'), command.sound('success', 'Hebat')], reward(18, 'Sahabat Penolong')),
    ],
  },
  {
    number: 19,
    title: 'Sayang Hewan Ciptaan Allah',
    description: 'Matching dan delivery: beri makanan yang tepat untuk hewan.',
    objects: [
      object('carrot', 'carrot-food', 'Wortel', 'collectible', 520, 755, 120, 120, { targetId: 'rabbit-target', pickupText: 'Wortel diambil' }),
      object('rabbit', 'rabbit-target', 'Kelinci', 'target', 895, 720, 150, 150, { label: 'Kelinci', dropText: 'Kelinci senang' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Cocokkan kelinci dengan wortel.', [command.start(), command.right(7), command.right(7), command.pick('carrot-food', 'Ambil Wortel'), command.right(7), command.right(7), command.drop('rabbit-target', 'Beri Kelinci')], reward(19, 'Sayang Hewan')),
      level('level-2', 'Lv 2', 'Tambah ucapan sayang hewan.', [command.start(), command.right(7), command.right(7), command.pick('carrot-food', 'Ambil Wortel'), command.right(7), command.right(7), command.drop('rabbit-target', 'Beri Kelinci'), command.say('Subhanallah hewan lucu')], reward(19, 'Peduli Hewan')),
      level('level-3', 'Lv 3', 'Ada makanan pengalih.', [command.start(), command.right(7), command.right(7), command.pick('carrot-food', 'Ambil Wortel'), command.right(7), command.right(7), command.drop('rabbit-target', 'Beri Kelinci'), command.choice('rabbit-target', 'Makanan tepat', 'Tepat'), command.sound('success', 'Hebat')], reward(19, 'Sahabat Hewan')),
    ],
  },
  {
    number: 20,
    title: 'Menjaga Alam',
    description: 'Eco multi-mission: buang sampah dan siram tanaman.',
    objects: [
      object('trash', 'eco-trash', 'Sampah', 'collectible', 500, 775, 110, 110, { targetId: 'eco-bin', pickupText: 'Sampah diambil' }),
      object('bin', 'eco-bin', 'Tempat Sampah', 'target', 830, 735, 140, 140, { label: 'Tempat', dropText: 'Sampah dibuang' }),
      object('wateringCan', 'eco-water', 'Air', 'collectible', 650, 760, 125, 125, { targetId: 'eco-flower', pickupText: 'Air diambil' }),
      object('flower', 'eco-flower', 'Tanaman', 'target', 1040, 735, 135, 135, { label: 'Tanaman', dropText: 'Tanaman disiram' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Satu target: buang sampah.', [command.start(), command.right(7), command.right(7), command.pick('eco-trash', 'Ambil Sampah'), command.right(7), command.drop('eco-bin', 'Buang Sampah')], reward(20, 'Jaga Taman')),
      level('level-2', 'Lv 2', 'Dua target: sampah dan tanaman.', [command.start(), command.right(7), command.pick('eco-trash', 'Ambil Sampah'), command.right(7), command.drop('eco-bin', 'Buang Sampah'), command.left(7), command.pick('eco-water', 'Ambil Air'), command.right(7), command.right(7), command.drop('eco-flower', 'Siram Tanaman')], reward(20, 'Penjaga Alam')),
      level('level-3', 'Lv 3', 'Multi aksi dalam satu panggung.', [command.start(), command.right(7), command.pick('eco-trash', 'Ambil Sampah'), command.right(7), command.drop('eco-bin', 'Buang Sampah'), command.left(7), command.pick('eco-water', 'Ambil Air'), command.right(7), command.right(7), command.drop('eco-flower', 'Siram Tanaman'), command.say('Alam bersih'), command.sound('success', 'Hebat')], reward(20, 'Sahabat Alam')),
    ],
  },
  {
    number: 21,
    title: 'Pola Bulan dan Bintang',
    description: 'Anak membaca pola AB dan AAB lewat checkpoint visual.',
    objects: [
      object('crescent', 'pattern-moon', 'Bulan', 'checkpoint', 540, 660, 135, 135, { label: 'Bulan', choiceText: 'Bulan' }),
      object('starToken', 'pattern-star', 'Bintang', 'checkpoint', 750, 660, 120, 120, { label: 'Bintang', choiceText: 'Bintang' }),
      object('crescent', 'pattern-next', 'Bulan Lagi', 'checkpoint', 960, 660, 135, 135, { label: 'Lanjut', choiceText: 'Bulan' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Pola AB: bulan lalu bintang.', [command.start(), command.right(7), command.choice('pattern-moon', 'Bulan', 'Bulan'), command.right(7), command.choice('pattern-star', 'Bintang', 'Bintang')], reward(21, 'Pola AB')),
      level('level-2', 'Lv 2', 'Pola AAB sederhana.', [command.start(), command.right(7), command.choice('pattern-moon', 'Bulan', 'Bulan'), command.right(7), command.choice('pattern-star', 'Bintang', 'Bintang'), command.right(7), command.choice('pattern-next', 'Bulan', 'Bulan')], reward(21, 'Pola AAB')),
      level('level-3', 'Lv 3', 'Prediksi lanjutan pola.', [command.start(), command.right(7), command.choice('pattern-moon', 'Bulan', 'Bulan'), command.right(7), command.choice('pattern-star', 'Bintang', 'Bintang'), command.right(7), command.choice('pattern-next', 'Bulan', 'Bulan'), command.say('Polanya selesai'), command.sound('success', 'Hebat')], reward(21, 'Ahli Pola')),
    ],
  },
  {
    number: 22,
    title: 'Lebah Mencari Bunga',
    description: 'Loop sederhana: perintah yang sama tidak perlu ditulis berulang.',
    characters: [beeCharacter, ...standardCharacters],
    objects: [
      object('flower', 'flower-loop', 'Bunga', 'target', 930, 610, 145, 145, { label: 'Bunga', choiceText: 'Bunga ditemukan', interactionRadius: 360 }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Jalur lurus dengan repeat.', [command.start(), command.repeat(3, { type: 'moveRight', value: 7 }, 'Ulang Maju'), command.choice('flower-loop', 'Bunga ditemukan', 'Bunga')], reward(22, 'Loop Pertama')),
      level('level-2', 'Lv 2', 'Zig-zag sederhana.', [command.start(), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Maju'), command.up(4), command.right(7), command.down(4), command.choice('flower-loop', 'Bunga ditemukan', 'Bunga')], reward(22, 'Lebah Zig-zag')),
      level('level-3', 'Lv 3', 'Kombinasi loop dan arah.', [command.start(), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Maju'), command.up(4), command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Maju'), command.down(4), command.choice('flower-loop', 'Bunga ditemukan', 'Bunga'), command.sound('success', 'Hebat')], reward(22, 'Sahabat Loop')),
    ],
  },
  {
    number: 23,
    title: 'IKOOBOT Misi Kebaikan',
    description: 'Multi-mission challenge dengan robot ramah anak.',
    characters: [ikoobotCharacter, ...standardCharacters],
    objects: [
      object('trash', 'bot-trash', 'Sampah', 'collectible', 500, 760, 110, 110, { targetId: 'bot-bin', pickupText: 'Sampah diambil' }),
      object('bin', 'bot-bin', 'Tempat Sampah', 'target', 790, 730, 140, 140, { label: 'Tempat', dropText: 'Lingkungan bersih' }),
      object('friend', 'bot-friend', 'Teman', 'choice', 1010, 720, 150, 150, { label: 'Teman', choiceText: "Assalamu'alaikum" }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Dua misi: sampah dan salam.', [command.start(), command.right(7), command.pick('bot-trash', 'Ambil Sampah'), command.right(7), command.drop('bot-bin', 'Buang Sampah'), command.right(7), command.choice('bot-friend', "Assalamu'alaikum", 'Salam')], reward(23, 'IKOOBOT Peduli')),
      level('level-2', 'Lv 2', 'Tiga misi dengan suara.', [command.start(), command.right(7), command.pick('bot-trash', 'Ambil Sampah'), command.right(7), command.drop('bot-bin', 'Buang Sampah'), command.right(7), command.choice('bot-friend', "Assalamu'alaikum", 'Salam'), command.sound('salam', 'Suara Salam')], reward(23, 'Robot Kebaikan')),
      level('level-3', 'Lv 3', 'Empat misi dalam satu panggung.', [command.start(), command.right(7), command.pick('bot-trash', 'Ambil Sampah'), command.right(7), command.drop('bot-bin', 'Buang Sampah'), command.right(7), command.choice('bot-friend', "Assalamu'alaikum", 'Salam'), command.say('Aku suka menolong'), command.sound('success', 'Hebat')], reward(23, 'Junior Mission Planner')),
    ],
  },
  {
    number: 24,
    title: 'Petualangan Anak Saleh',
    description: 'Creative coding: anak membuat cerita digital sederhana.',
    characters: [ikoobotCharacter, beeCharacter, ...standardCharacters],
    objects: [
      object('certificate', 'final-certificate', 'Sertifikat', 'reward', 870, 690, 170, 170, { label: 'Karya' }),
      object('mosqueTarget', 'final-mosque', 'Masjid', 'target', 1090, 710, 160, 160, { label: 'Masjid' }),
    ],
    levels: [
      level('level-1', 'Lv 1', 'Cerita pendek dengan salam.', [command.start(), command.right(7), command.say("Assalamu'alaikum"), command.sound('salam', 'Suara Salam')], reward(24, 'Pembuat Cerita')),
      level('level-2', 'Lv 2', 'Gabungkan gerak, suara, dan ucapan syukur.', [command.start(), command.say('Bismillah'), command.sound('bismillah', 'Bismillah'), command.right(7), command.right(7), command.say('Alhamdulillah'), command.sound('alhamdulillah', 'Alhamdulillah')], reward(24, 'Kreator Junior')),
      level('level-3', 'Lv 3', 'Buat cerita bebasmu sendiri.', [], reward(24, 'Junior Coder'), [
        command.start(),
        command.right(7),
        command.left(7),
        command.up(4),
        command.down(4),
        command.jump(4),
        command.wait(1),
        command.say("Assalamu'alaikum"),
        command.say('Alhamdulillah'),
        command.sound('salam', 'Suara Salam'),
        command.sound('alhamdulillah', 'Alhamdulillah'),
        command.record('Ceritaku hebat'),
        command.write('Tulis pesan cerita'),
        command.repeat(2, { type: 'moveRight', value: 7 }, 'Ulang Kanan'),
      ], 14),
    ],
  },
];

function manifestFor(stage) {
  const stageId = `stage-${stage.number}`;
  const levels = stage.levels;
  const maxCommands = Math.max(...levels.map((item) => item.maxCommands || item.instructions.length || 1));
  const characters = stage.characters || standardCharacters;
  const allCommands = dedupeCommands(levels.flatMap((item) => item.commands || []));

  return {
    id: stageId,
    stageSize: { width: STAGE_WIDTH, height: STAGE_HEIGHT, aspectRatio: '3:2' },
    title: stage.title,
    description: stage.description,
    thumbnail: stageSummary(stage).thumbnail,
    status: 'active',
    difficulty: stage.number,
    maxCommands,
    ui: {
      stageLabel: `Stage ${stage.number}`,
      tip: 'Selesaikan misi kecil, kumpulkan bintang, lalu lihat ceritanya bergerak.',
      theme: 'junior-gameplay',
    },
    backgrounds: generatedBackgrounds(stage.number),
    characters,
    objects: stage.objects || [],
    sounds: [sounds.pop, sounds.success, sounds.salam, sounds.bismillah, sounds.alhamdulillah, sounds.masyaallah],
    levels,
    instructions: levels[0]?.instructions || [],
    commands: allCommands,
    reward: levels[0]?.reward || reward(stage.number, 'Misi Selesai'),
  };
}

async function writeSharedAssets() {
  await mkdir(sharedObjectsDir, { recursive: true });
}

async function writeStage(stage) {
  const stageDir = path.join(stagesRoot, `stage-${stage.number}`);
  await mkdir(stageDir, { recursive: true });
  await writeFile(path.join(stageDir, 'manifest.json'), `${JSON.stringify(manifestFor(stage), null, 2)}\n`, 'utf8');
}

async function writeStagesIndex() {
  const index = {
    defaultStageId: 'stage-1',
    stages: stages.map(stageSummary),
  };

  await writeFile(path.join(stagesRoot, 'stages.json'), `${JSON.stringify(index, null, 2)}\n`, 'utf8');
}

await mkdir(stagesRoot, { recursive: true });
await writeSharedAssets();
await Promise.all(stages.map(writeStage));
await writeStagesIndex();

console.log(`Generated ${stages.length} curriculum manifests. Object assets are expected as PNG files in ${path.relative(root, sharedObjectsDir)}.`);
