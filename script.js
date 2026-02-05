/***********************
 * Config
 ***********************/
const ALLOWED_LENGTHS = [3, 4, 5, 6, 7];
// Default (will be overridden by #lenSelect if present)
let WORD_LENGTH = 5;

const MAX_GUESSES = 6;
const STRICT_VALIDATION = true;

let SOLUTIONS = [];
const DICTIONARY = new Set();   // master: all words (3–7)
let CURRENT_WORDS = new Set();  // filtered by current WORD_LENGTH

const REMOTE_WORDLIST_URL = "wordlist.txt";
const DAILY_SALT = "p3pP3r-3xAmpl3-2026-02"; // change periodically

// --- Mode & day helpers ---
function isDailyMode() {
  // Use hash routing: #daily vs anything else is Free Play
  return location.hash === '#daily';
}

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Build the storage key prefix for the current mode/day/length
function keyPrefix() {
  const len = WORD_LENGTH;
  if (isDailyMode()) return `daily_${todayKey()}_${len}`;
  return `free_${len}`;
}

// Namespacing for today's daily state (per length)
function dailyKeys(len = WORD_LENGTH) {
  const date = todayKey();
  return {
    completed: `daily_completed_${date}_${len}`,
    state:     `daily_state_${date}_${len}`
  };
}
const DAILY_EPOCH = "2026-01-01";

// (Your extras – kept intact)
const EXTRA_WORDS = [
  "ALGAE","AGILE","AGLOW","AMITY","APHID","APRON","ARISE","AROMA","ARROW","ASHEN",
  "ASKEW","AVERT","AVIAN","AVOID","AWAIT","AWAKE","AWARE","AWASH",
  "BADGE","BASIL","BATTY","BEGUN","BELCH","BILGE","BINGE","BLAST","BLEAK","BLOOM",
  "BLUFF","BODGE","BONEY","BONGO","BOOBY","BOOST","BOOTH","BRACE","BRAID","BRAVO",
  "BRAWN","BRAWL","BREAD","BRIAR","BRINE","BRINK","BRISK","BROAD","BROIL","BROOM",
  "BROWN","BRUTE",
  "CADDY","CADRE","CAMEO","CANDY","CANOE","CARGO","CAROL","CARVE","CATCH","CATER",
  "CAUSE","CAVIL","CEASE","CHALK","CHANT","CHARD","CHARM","CHART","CHASE","CHEAP",
  "CHEAT","CHEEK","CHEER","CHEST","CHIME","CHIRP","CHOIR","CHOKE","CHORD","CHORE",
  "CIVIC","CLEFT","CLERK","CLING","CLOAK","CLOCK","CLOSE","CLOTH","CLOUD","COAST",
  "COBIA","COBRA","COCOA","COMET","COMFY","COMIC","CORAL","CORDS","COUNT","COURT",
  "COVER","CRABS","CRACK","CRAFT","CRANE","CRANK","CRASH","CRATE","CRAVE","CRAZE",
  "CREAK","CREAM","CREDO","CREED","CREPT","CRISP","CROAK","CROOK","CROSS","CROWD",
  "CROWN","CRUEL","CRUSH","CRYPT",
  "DAIRY","DANCE","DAREY","DEALT","DEARY","DEBIT","DEBUT","DECAL","DECAY","DECOR",
  "DEFER","DEIGN","DELAY","DELTA","DEMON","DENIM","DENSE","DEPOT","DEPTH","DETOX",
  "DIARY","DICEY","DIGIT","DINER","DINGO","DIRGE","DISCO","DITCH","DODGE","DOING",
  "DOUBT","DOZEN","DRAFT","DRAMA","DREAM","DRESS","DRIFT","DRINK","DRIVE","DROOP",
  "DROVE","DRUID",
  "EAGER","EAGLE","EARLY","EARTH","EBONY","EERIE","EGRET","EIGHT","ELATE","ELDER",
  "ELECT","ELFIN","ELIDE","ELITE","ELUDE","ELUTE","EMAIL","EMBER","EMCEE","EMPTY",
  "ENACT","ENEMY","ENJOY","ENNUI","ENSUE","ENTER","ENTRY","EPOCH","EQUAL","EQUIP",
  "ERODE","ERROR","ESSAY","ETHER","ETHIC","ETHOS","EVENS","EVENT","EVERY","EXACT",
  "EXALT","EXCEL","EXERT","EXILE","EXIST","EXTRA",
  "FAINT","FAITH","FALSE","FANCY","FAULT","FAVOR","FEAST","FELON","FEMME","FENCE",
  "FERAL","FERRY","FETID","FETUS","FEVER","FIBER","FIELD","FIEND","FIFTH","FIFTY",
  "FINAL","FINCH","FINER","FIRER","FIRST","FISHY","FJORD","FLAIR","FLAKE","FLAME",
  "FLASK","FLESH","FLICK","FLING","FLOAT","FLOOD","FLOOR","FLOUR","FLOWN","FLUID",
  "FLUKE","FLUSH","FLUTE","FOCUS","FORCE","FORGE","FORGO","FORTH","FORTY","FORUM",
  "FOUND","FRAME","FRAUD","FREAK","FRESH","FRIAR","FRIED","FRISK","FRONT","FROST",
  "FRUIT","FUNGI","FUNNY","FURRY",
  "GAMER","GAUNT","GAUZE","GAWKY","GECKO","GENIE","GENRE","GHOST","GIANT","GIDDY",
  "GIPSY","GIRTH","GIVEN","GLADE","GLAND","GLARE","GLASS","GLAZE","GLEAM","GLIDE",
  "GLOAT","GLOBE","GLOOM","GLORY","GLOVE","GLYPH","GNASH","GNOME","GOING","GOLEM",
  "GONAD","GOODS","GOOEY","GOOSE","GRACE","GRADE","GRAFT","GRAIN","GRAND","GRANT",
  "GRAPE","GRAPH","GRASP","GRASS","GRATE","GRAVE","GRAZE","GREAT","GREEK","GREEN",
  "GREET","GRIEF","GRILL","GRIME","GRIND","GRIPE","GRIST","GROOM","GROUP","GROUT",
  "GROVE","GUARD","GUESS","GUEST","GUIDE","GUILD",
  "HABIT","HAREM","HARPY","HARSH","HASTE","HATCH","HATER","HAUNT","HAVEN",
  "HAVOC","HAZEL","HEADY","HEARD","HEART","HEATH","HEAVE","HEAVY","HEDGE","HEFTY",
  "HEIST","HERON","HILLY","HINGE","HONEY","HORDE","HORSE","HOTEL","HOUND","HOUSE",
  "HUMAN","HUMID","HUMOR","HUMPH","HUNCH","HURRY","HUSKY","HYDRA",
  "ICIER","ICING","IDEAL","IDIOM","IDYLL","IGLOO","IMAGE","IMBUE","IMPEL","IMPLY",
  "INANE","INBOX","INCUR","INDEX","INDIE","INERT","INFER","INPUT","INTER","IONIC",
  "IRATE","IRONY","ISLET","ISSUE","ITSELF","IVORY",
  "JELLY","JETTY","JEWEL","JIMMY","JOINT","JOKER","JOLLY","JOUST","JUDGE","JUICE",
  "JUICY","JUMBO","JUNTA","JUNTO","JUROR",
  "KAPPA","KARMA","KAYAK","KAZOO","KHAKI","KIBIT","KINKY","KIOSK","KISSY","KITTY",
  "KNACK","KNAVE","KNEAD","KNEEL","KNELT","KNIFE","KNOLL","KNOWN",
  "LABEL","LABOR","LADEN","LAGER","LAIRY","LAMPS","LANCE","LANKY","LAPSE","LARGE",
  "LASER","LATCH","LATER","LATTE","LAUGH","LAYER","LEACH","LEAFY","LEAKY","LEARN",
  "LEASE","LEASH","LEAST","LEMON","LEMUR","LEVEL","LEVER","LIBEL","LIGHT","LIKEN",
  "LILAC","LIMBO","LIMIT","LINEN","LINER","LIVER","LOAMY","LOCAL","LOFTY",
  "LOGIC","LOOSE","LOOSE","LORRY","LOSER","LOTUS","LOUSE","LOUSY","LOVER","LOWER","LUCKY","LUNAR",
  "LUNCH","LYING","LYRIC",
  "MACAW","MADAM","MADLY","MAFIA","MAGIC","MAIZE","MAJOR","MAKER","MAMBO","MANGO",
  "MANLY","MANOR","MAPLE","MARCH","MARRY","MARSH","MASON","MATCH","MATEY","MATHS",
  "METAL","METER","METRO","MICRO","MIGHT","MILKY","MIMIC","MINCE","MINER","MINIM",
  "MINOR","MINUS","MIRTH","MISER","MISSY","MIXED","MIXER","MIXUP","MOGUL","MOIST",
  "MOLAR","MONEY","MONTH","MOOSE","MORAL","MOTEL","MOTOR","MOTTO","MOUND","MOUNT",
  "MOURN","MOUTH","MOVER","MOVIE","MOWER","MUCKY","MUCUS","MUMMY","MUSIC","MYTHS",
  "NAIVE","NANNY","NASAL","NEEDS","NERDY","NERVE","NEVER","NEWER","NEWLY","NICER",
  "NIECE","NINJA","NINNY","NINTH","NOBLE","NOISE","NORTH","NOTCH","NOTED","NOVEL",
  "NURSE",
  "OASIS","OCCUR","OCEAN","OCTAL","OCTET","ODDER","ODDLY","OFFER","OFTEN","OZONE",
  "ONION","OPERA","OPTIC","ORBIT","ORDER","OTHER","OTTER","OUNCE","OVARY","OVERT",
  "OVINE","OVOID","OWNER","OXIDE",
  "PADDY","PAGAN","PAINT","PALER","PANEL","PANIC","PAPER","PARER","PARKA","PARRY",
  "PARTY","PASTA","PASTE","PASTY","PATCH","PATHS","PATIO","PAUSE","PEACE","PEACH",
  "PEARL","PECAN","PEDAL","PEEVE","PETTY","PERCH","PERKY","PESTO","PETAL","PETTY","PHONE","PHONY",
  "PHOTO","PIANO","PICKY","PIECE","PIETY","PILOT","PINCH","PINEY","PINKY","PINTO",
  "PINUP","PIPER","PITCH","PITHY","PIXEL","PLACE","PLAID","PLAIN","PLANT","PLATE",
  "PLAZA","PLEAD","PLUCK","PLUMB","PLUME","PLUSH","POESY","POINT","POISE","POLAR",
  "POLKA","POLYP","POPUP","PORCH","PORKY","PORTY","POSSE","POSTS","POWER","PRANK",
  "PRATE","PRIDE","PRIME","PRINT","PRIOR","PRISM","PRIZE","PROBE","PROOF","PROUD",
  "PROXY","PRUNE","PSALM","PUBIC","PUDGY","PULSE","PUNCH","PUPAL","PURGE","PURSE",
  "QUACK","QUAIL","QUAKE","QUALM","QUARK","QUART","QUASH","QUEEN","QUERY","QUEST",
  "QUEUE","QUICK","QUIET","QUILL","QUILT","QUITE","QUOTA","QUOTE",
  "RADAR","RADIO","RANCH","RANDY","RANGE","RAPID","RARER","RATIO","RAVEN","RAZOR",
  "REACH","REACT","READY","REALM","REBEL","RECAP","RECUR","REDID","REDOX","REFER",
  "REGAL","REIGN","RELAX","RELAY","RELISH","REMIT","RENAL","RENEW","REPAY","REPEL","REPLY","RESET",
  "RESIN","RETRO","RETRY","REUSE","REVUE","RHYME","RIDER","RIDGE","RIFLE","RIGHT",
  "RIGID","RINSE","RISEN","RIVAL","RIVER","ROAST","ROBIN","ROBOT","ROGUE","ROUTE",
  "ROVER","ROYAL","RUDDY","RUGBY","RUINS","RURAL",
  "SADLY","SAFER","SALAD","SALES","SALTY","SAUCE","SCALD","SCARF","SCENE","SCENT",
  "SCOFF","SCOPE","SCORE","SCORN","SCOUT","SCRAP","SCREW","SCULP","SEAMY","SEPIA",
  "SEIZE","SENSE","SEPIA","SERVE","SEVEN","SHACK","SHADE","SHADY","SHAKE","SHALL",
  "SHAPE","SHARE","SHARK","SHARP","SHAVE","SHEAR","SHEEN","SHEEP","SHEET","SHELF",
  "SHELL","SHIFT","SHINE","SHINY","SHIRT","SHOCK","SHONE","SHOOK","SHOOT","SHORE",
  "SHORT","SHOUT","SHOWN","SHOWY","SHRED","SHRUB","SHUCK","SHYLY","SIGHT","SIGMA",
  "SILKY","SILLY","SINCE","SINEW","SINGE","SKATE","SKILL","SKIMP","SKIRT","SLATE",
  "SLEEK","SLEEP","SLICE","SLIME","SLING","SLOPE","SMALL","SMART","SMEAR","SMILE",
  "SMIRK","SMOKE","SMOKY","SNACK","SNAIL","SNAKE","SNEAK","SNIDE","SNIFF","SNIPE",
  "SNOOP","SNOTY","SNOWY","SOOTY","SOLAR","SOLID","SOLVE","SONIC","SOUND","SOUTH","SPACE",
  "SPADE","SPARE","SPARK","SPEAK","SPEAR","SPEED","SPELL","SPEND","SPICE","SPICY",
  "SPIKE","SPILL","SPINE","SPINY","SPITE","SPLIT","SPOIL","SPOKE","SPOON","SPORT",
  "SPRAY","SPURT","SQUAD","SQUAT","STACK","STAFF","STAGE","STAIR","STAKE","STALE",
  "STAND","STARE","START","STATE","STEAD","STEAK","STEAL","STEAM","STEEL","STEEP",
  "STEER","STERN","STICK","STIFF","STILL","STING","STOCK","STOLE","STONE","STONY",
  "STOOL","STORM","STORY","STOUT","STOVE","STRAP","STRAW","STRIP","STUCK","STUDY",
  "STUFF","STYLE","SUGAR","SUITE","SUPER","SURGE","SURLY","SUSHI","SWAMI","SWEAR",
  "SWEAT","SWEET","SWIFT","SWING","SWIRL","SWISS","SWORD",
  "TABLE","TAKEN","TANGO","TAPER","TASTE","TEACH","TEARY","TEASE","TEETH","TENET",
  "TENSE","TENTH","TERMS","THEFT","THEIR","THEME","THERE","THESE","THICK","THIEF",
  "THING","THINK","THIRD","THORN","THOSE","THREE","THREW","THROB","THROW","THUMB",
  "TIGER","TIGHT","TIMER","TIMID","TITLE","TOAST","TODAY","TOKEN","TONIC","TOOTH",
  "TOPAZ","TOPIC","TORCH","TOUCH","TOUGH","TOWEL","TOWER","TRACE","TRACK","TRADE",
  "TRAIL","TRAIN","TRAIT","TRASH","TREAD","TREAT","TREND","TRIAD","TRIAL","TRIBE",
  "TRICK","TRIED","TRIPE","TRITE","TROOP","TROPE","TROUT","TRUCK","TRULY","TRUST",
  "TRUTH","TULIP","TUMOR","TUNIC","TURBO","TUTOR","TWICE","TWIRL","TWIST",
  "ULCER","ULTRA","UMBRA","UNCLE","UNDER","UNION","UNITE","UNITY","UNTIL","UPPER",
  "URBAN","USAGE","USUAL","UTTER",
  "VAGUE","VALID","VALUE","VALVE","VAPOR","VAULT","VENOM","VENUE","VERGE","VERSE",
  "VICAR","VIDEO","VIGOR","VILLA","VINYL","VIRAL","VIRUS","VISIT","VITAL","VIVID",
  "VOCAL","VOGUE","VOICE","VOTER",
  "WACKY","WAIST","WASTE","WATCH","WATER","WEARY","WEDGE","WEIGH","WEIRD","WHALE",
  "WHEAT","WHEEL","WHERE","WHILE","WHITE","WHOLE","WHOSE","WIDEN","WIDTH","WINCE",
  "WINDY","WISER","WITCH","WOMAN","WOMEN","WORLD","WORRY","WORSE","WORST","WORTH",
  "WOULD","WRATH","WRECK","WRIST","WRITE","WRONG",
  "YEARN","YEAST","YIELD","YOUNG","YOURS","YOUTH",
  "ZEBRA","ZESTY"
];

/***********************
 * State & DOM
 ***********************/
let answer = null;
let currentRow = 0;
let currentCol = 0;
let guesses = [];
let statusesGrid = [];
let gameOver = false;

const boardEl       = document.getElementById("board");
const keyboardEl    = document.getElementById("keyboard");
const statusEl      = document.getElementById("status");
const shareBtn      = document.getElementById("shareBtn");
const restartBtn    = document.getElementById("restartBtn");
const wordFileInput = document.getElementById("wordFile");
const lenSelect     = document.getElementById("lenSelect");
const applyLenBtn   = document.getElementById("applyLenBtn");

/***********************
 * Bootstrap
 ***********************/
buildBoard();
buildKeyboard();
updateStatus("Loading word list…");

(async function init() {
  try {
    let added = 0;

    const embeddedEl = document.getElementById("wordlist");
    if (embeddedEl && embeddedEl.textContent && embeddedEl.textContent.trim().length) {
      added += mergeWordsFromText(embeddedEl.textContent);
    }

    added += mergeWordsFromArray(EXTRA_WORDS);

    if (REMOTE_WORDLIST_URL) {
      try {
        added += await loadWordListFromUrl(REMOTE_WORDLIST_URL);
      } catch (_) {
        // ignore; will fall back to manual picker if none loaded
      }
    }

    if (DICTIONARY.size === 0) {
      if (wordFileInput) {
        updateStatus('No word list found. Please choose your .txt file…');
        setTimeout(() => wordFileInput.click(), 200);
        return;
      } else {
        updateStatus('No word list found. Add embedded list or enable the Load button.');
        return;
      }
    }
    
    function resetFreePlay(len) {
      localStorage.removeItem(`free_3_state`);
	  localStorage.removeItem(`free_4_state`);
	  localStorage.removeItem(`free_5_state`);
	  localStorage.removeItem(`free_6_state`);
	  localStorage.removeItem(`free_7_state`);
      localStorage.removeItem(`free_3_completed`);
	  localStorage.removeItem(`free_4_completed`);
	  localStorage.removeItem(`free_5_completed`);
	  localStorage.removeItem(`free_6_completed`);
	  localStorage.removeItem(`free_7_completed`);
      localStorage.removeItem(`free_3_answer`);
	  localStorage.removeItem(`free_4_answer`);
	  localStorage.removeItem(`free_5_answer`);
	  localStorage.removeItem(`free_6_answer`);
	  localStorage.removeItem(`free_7_answer`);
	  
    }

    const nav = performance.getEntriesByType?.('navigation')?.[0];
    const isReload = nav ? nav.type === 'reload' : false;

    const desiredLen = lenSelect ? parseInt(lenSelect.value || '5', 10) : 5;

    // Auto-restart Free Play on page reload only
    if (!isDailyMode() && isReload) {
      resetFreePlay(desiredLen);
      // If you want to wipe all lengths on reload, uncomment:
      // for (const L of ALLOWED_LENGTHS) resetFreePlay(L);
    }

    rebuildForLength(desiredLen);
  } catch (err) {
    console.warn("Init failed:", err);
    updateStatus('Could not initialize. See console for details or use "Load list".');
  }
})();

/***********************
 * Loaders
 ***********************/
let isRevealing = false;
const _timeouts = [];
function later(fn, ms) { const id = setTimeout(fn, ms); _timeouts.push(id); return id; }
function clearAllTimeouts() { while (_timeouts.length) { clearTimeout(_timeouts.pop()); } }

wordFileInput?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) { updateStatus("No file selected."); return; }
  try {
    updateStatus(`Reading ${file.name}…`);
    const text = await file.text();
    const added = mergeWordsFromText(text);
    if (DICTIONARY.size === 0) {
      updateStatus("The file had no usable words.");
      return;
    }
    // Rebuild for current length (or default) after merge
    rebuildForLength(WORD_LENGTH);
    updateStatus(`Loaded +${added} words; total unique ${DICTIONARY.size}.`);
  } catch (err) {
    console.error("[Word List Loader] Failed:", err);
    updateStatus("Failed to load list. See console for details.");
  } finally { wordFileInput.value = ""; }
});

async function loadWordListFromUrl(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  return mergeWordsFromText(text);
}

function mergeWordsFromArray(arr) {
  let added = 0;
  for (const raw of arr || []) {
    const w = normalizeWord(raw);
    if (/^[A-Z]{3,7}$/.test(w) && !DICTIONARY.has(w)) { DICTIONARY.add(w); added++; }
  }
  return added;
}

function mergeWordsFromText(text) {
  if (text && text.charCodeAt(0) === 0xFEFF) text = text.slice(1); // BOM
  const lines = (text || "").split(/\r?\n/);
  const before = DICTIONARY.size;
  for (let line of lines) {
    if (!line) continue;
    const w = normalizeWord(line);
    if (/^[A-Z]{3,7}$/.test(w)) DICTIONARY.add(w);
  }
  return DICTIONARY.size - before;
}

function normalizeWord(s){
  return (s || "").trim()
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')  // accents
    .replace(/[\u200B-\u200D\uFEFF]/g,'')              // zero-width/BOM
    .replace(/[’'`´]/g,'')                             // apostrophes
    .replace(/[^A-Za-z]/g,'')                          // letters only
    .toUpperCase();
}

/***********************
 * Length handling
 ***********************/
function clampLength(n){ return ALLOWED_LENGTHS.includes(n) ? n : 5; }

function rebuildForLength(newLen){
  clearAllTimeouts();
  isRevealing = false;

  WORD_LENGTH = clampLength(newLen);

  boardEl.style.width = `calc(${WORD_LENGTH} * var(--tile-size) + ${(WORD_LENGTH - 1)} * var(--gap))`;

  CURRENT_WORDS = new Set([...DICTIONARY].filter(w => w.length === WORD_LENGTH));

  // Reset state (we will attempt to restore immediately after)
  currentRow = 0;
  currentCol = 0;
  guesses = [];
  statusesGrid = [];
  gameOver = false;
  shareBtn && (shareBtn.disabled = true);
  statusEl.textContent = "";

  // Rebuild the board for the chosen WORD_LENGTH
  boardEl.innerHTML = "";
  buildBoard();
  resetKeyboard();

  if (CURRENT_WORDS.size === 0) {
    gameOver = true;  // block input
    answer = null;
    updateStatus(`No words of length ${WORD_LENGTH} in your list.`);
    return;
  }

  SOLUTIONS = Array.from(CURRENT_WORDS).sort();;

  pickNewAnswer();

  // Try to restore any saved state for this mode/length (and date for daily)
  const restored = loadGameState();

  if (!restored) {
    updateStatus(`Playing ${WORD_LENGTH}-letter words — good luck!`);
  }

  updateUiForMode();
}

/***********************
 * Answer selection
 ***********************/
// Simple 32-bit string hash (e.g., cyrb53-lite / djb2-style); good enough for seeding
function hashString32(str) {
  let h = 2166136261 >>> 0; // FNV-like base
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 PRNG (fast, deterministic)
function mulberry32(seed) {
  return function() {
    let t = (seed += 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickNewAnswer() { 
  answer = isDailyMode() ? pickDailyAnswer() : pickRandomAnswer(); 
}
function pickRandomAnswer() {
  const key = `free_${WORD_LENGTH}_answer`;
  const saved = localStorage.getItem(key);
  if (saved && CURRENT_WORDS.has(saved)) return saved;   // reuse existing answer
  const a = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
  localStorage.setItem(key, a);
  return a;
}

function pickDailyAnswer() {
  const epoch = new Date(`${DAILY_EPOCH}T00:00:00`);
  const now = new Date();
  const days = Math.floor(
    (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
     Date.UTC(epoch.getFullYear(), epoch.getMonth(), epoch.getDate())) / 86400000
  );
  // Include the salt
  const seedStr = `daily|${days}|len=${WORD_LENGTH}|v1|salt=${DAILY_SALT}`;
  const seed = hashString32(seedStr);
  const rnd = mulberry32(seed);
  const idx = Math.floor(rnd() * SOLUTIONS.length);
  return SOLUTIONS[idx];
}

/***********************
 * UI & Game Logic
 ***********************/
function buildBoard(){
  for (let r = 0; r < MAX_GUESSES; r++){
    const row = document.createElement("div");
    row.className = "row";
    row.setAttribute("role", "row");

    // Ensure per-row grid matches current WORD_LENGTH (overrides CSS repeat(5, …) if present)
    row.style.display = "grid";
    row.style.gridTemplateColumns = `repeat(${WORD_LENGTH}, var(--tile-size))`;
    row.style.gap = "var(--gap)";

    for (let c = 0; c < WORD_LENGTH; c++){
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.setAttribute("role","gridcell");
      tile.dataset.row = r;
      tile.dataset.col = c;
      row.appendChild(tile);
    }
    boardEl.appendChild(row);
  }
}

function buildKeyboard(){
  const rows = [
    "QWERTYUIOP".split(""),
    "ASDFGHJKL".split(""),
    ["ENTER",..."ZXCVBNM".split(""),"BACK"]
  ];
  keyboardEl.innerHTML = "";
  rows.forEach(r=>{
    const rowEl = document.createElement("div");
    rowEl.className = "kb-row";
    r.forEach(k=>{
      const btn = document.createElement("button");
      btn.className = "key";
      btn.dataset.key = k;
      btn.textContent = k === "BACK" ? "⌫" : k;
      if (k === "ENTER" || k === "BACK") btn.classList.add("wide");
      rowEl.appendChild(btn);
    });
    keyboardEl.appendChild(rowEl);
  });
}

function resetKeyboard(){ keyboardEl.querySelectorAll(".key").forEach(k=>k.classList.remove("absent","present","correct")); }

function onLetter(ch){
  if (isRevealing || gameOver) return;
  if (currentCol >= WORD_LENGTH || currentRow >= MAX_GUESSES) return;
  const tile = getTile(currentRow, currentCol);
  tile.textContent = ch;
  tile.classList.add("filled","pop");
  later(()=>tile.classList.remove("pop"), 100);
  currentCol++;
  // Save after every input
  saveGameState();
}

function onEnter(){
  if (isRevealing || gameOver) return;
  if (currentCol < WORD_LENGTH){
    rowShake(currentRow);
    return updateStatus("Not enough letters.");
  }
  const guess = readRow(currentRow);
  if (STRICT_VALIDATION && !CURRENT_WORDS.has(guess)){
    rowShake(currentRow);
    return updateStatus("Not in word list.");
  }
  revealGuess(guess);
}

function onDelete(){
  if (isRevealing || gameOver) return;
  if (currentCol <= 0) return;
  currentCol--;
  const tile = getTile(currentRow, currentCol);
  tile.textContent = "";
  tile.classList.remove("filled");
  // Save after every deletion
  saveGameState();
}

function readRow(r){
  let s = "";
  for (let c=0; c<WORD_LENGTH; c++) s += getTile(r,c).textContent || "";
  return s.toUpperCase();
}

function getTile(r,c){ return boardEl.children[r].children[c]; }

function rowShake(r){
  const row = boardEl.children[r];
  row.classList.add("shake");
  later(()=>row.classList.remove("shake"), 250);
}

function updateStatus(msg){ statusEl.textContent = msg; }

/* Duplicate-aware scoring */
function scoreGuess(guess, target){
  const result = new Array(WORD_LENGTH).fill("absent");
  const targetArr = target.split(""), guessArr = guess.split("");
  const counts = {};
  for (let i=0;i<WORD_LENGTH;i++){ counts[targetArr[i]] = (counts[targetArr[i]]||0) + 1; }
  for (let i=0;i<WORD_LENGTH;i++){
    if (guessArr[i] === targetArr[i]){ result[i] = "correct"; counts[guessArr[i]] -= 1; }
  }
  for (let i=0;i<WORD_LENGTH;i++){
    if (result[i] === "correct") continue;
    const g = guessArr[i];
    if (counts[g] > 0){ result[i] = "present"; counts[g] -= 1; }
  }
  return result;
}

function revealGuess(guess){
  isRevealing = true;

  const statuses = scoreGuess(guess, answer);
  statusesGrid.push(statuses);

  const rowIdx = currentRow;
  const flipStep = 260;
  const doneDelay = 520;

  statuses.forEach((st, i)=>{
    const tile = getTile(rowIdx, i);
    later(()=>{
      tile.classList.add("reveal");
      later(()=>{
        tile.classList.add(st);
        paintKeyboard(tile.textContent, st);
      }, flipStep);
    }, i * flipStep);
  });

  const totalDelay = (statuses.length - 1) * flipStep + doneDelay;
  later(()=>{
    guesses.push(guess);

    if (guess === answer){
      gameOver = true;
      shareBtn && (shareBtn.disabled = false);
      updateStatus(randomCongrats());
      if (isDailyMode()) localStorage.setItem(dailyKeys().completed, '1');
    } else if (currentRow === MAX_GUESSES - 1){
      gameOver = true;
      shareBtn && (shareBtn.disabled = false);
      updateStatus(`Answer: ${answer}`);
      if (isDailyMode()) localStorage.setItem(dailyKeys().completed, '1');
    } else {
      currentRow++;
      currentCol = 0;
      updateStatus("");
    }

    isRevealing = false;
    // Save after reveal completes
    saveGameState();
  }, totalDelay);
}

function paintKeyboard(letter, newStatus){
  const btn = keyboardEl.querySelector(`.key[data-key="${letter}"]`);
  if (!btn) return;
  const rank = { absent: 0, present: 1, correct: 2 };
  let current = "none";
  if (btn.classList.contains("correct")) current = "correct";
  else if (btn.classList.contains("present")) current = "present";
  else if (btn.classList.contains("absent")) current = "absent";
  if (rank[newStatus] > (rank[current] ?? -1)){
    btn.classList.remove("absent","present","correct");
    btn.classList.add(newStatus);
  }
}

function randomCongrats(){
  const lines = [
    "Nice! You got it!",
    "Great job!",
    "Boom! Ez Claps!",
    "Sweet! AAAAAAAAAAAAAAAA",
    "Look Mom, I'm in a Splash Text!!"
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

/***********************
 * Controls
 ***********************/
window.addEventListener("keydown", (e) => {
  if (gameOver || isRevealing) return;
  const key = e.key;
  if (key === "Enter") onEnter();
  else if (key === "Backspace" || key === "Delete") onDelete();
  else if (/^[a-zA-Z]$/.test(key)) onLetter(key.toUpperCase());
});

keyboardEl.addEventListener("click", (e) => {
  if (gameOver || isRevealing) return;
  const btn = e.target.closest("button.key");
  if (!btn) return;
  const val = btn.dataset.key;
  if (val === "ENTER") onEnter();
  else if (val === "BACK") onDelete();
  else onLetter(val);
});

restartBtn.addEventListener("click", () => {
  // Hard lock: Daily cannot be restarted
  if (isDailyMode()) return;
  // Clear Free Play save so you get a fresh puzzle
  localStorage.removeItem(`${keyPrefix()}_state`);
  localStorage.removeItem(`${keyPrefix()}_completed`);
  localStorage.removeItem(`free_${WORD_LENGTH}_answer`);
  clearAllTimeouts();
  isRevealing = false;
  rebuildForLength(WORD_LENGTH);
});

// Optional: Apply new length if you add #lenSelect + #applyLenBtn in HTML
applyLenBtn?.addEventListener("click", () => {
  const chosen = clampLength(parseInt(lenSelect.value, 10));
  rebuildForLength(chosen);
  boardEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

document.getElementById('lenSelect')?.addEventListener('change', (e) => {
  const val = parseInt(e.target.value, 10);
  if (!isNaN(val)) rebuildForLength(val);
});

// Default to Free Play if no hash
if (!location.hash) location.hash = '#play';

// Switch modes by changing the hash
window.addEventListener('hashchange', () => {
  clearAllTimeouts();
  rebuildForLength(WORD_LENGTH);
  setActiveTabUi();
});

function setActiveTabUi() {
  const daily = isDailyMode();
  document.getElementById('tab-play')?.classList.toggle('active', !daily);
  document.getElementById('tab-daily')?.classList.toggle('active', daily);
}
setActiveTabUi();

function updateUiForMode() {
  if (isDailyMode()) {
    // Disable restarting to prevent replaying today’s daily
    if (restartBtn) {
      restartBtn.disabled = true;
      restartBtn.title = 'Daily mode resets at midnight';
    }
    // If you already finished today, lock input and allow sharing
    const done = localStorage.getItem(dailyKeys().completed);
    if (done) {
      gameOver = true;
      if (shareBtn) shareBtn.disabled = false;
      updateStatus('You’ve completed today’s puzzle. Come back tomorrow!');
    }
  } else {
    if (restartBtn) {
      restartBtn.disabled = false;
      restartBtn.title = 'Restart game';
    }
  }
}

// Refresh daily at midnight (checks every minute)
setInterval(() => {
  if (!isDailyMode()) return;
  // If the day changed, rebuild with the new daily seed
  const keyNow = todayKey();
  const prev = window.__lastDayKey;
  if (!prev) { window.__lastDayKey = keyNow; return; }
  if (prev !== keyNow) {
    window.__lastDayKey = keyNow;
    clearAllTimeouts();
    rebuildForLength(WORD_LENGTH);
    setActiveTabUi();
  }
}, 60_000);

function saveGameState() {
  const data = {
    v: 1,
    mode: isDailyMode() ? 'daily' : 'free',
    date: isDailyMode() ? todayKey() : null,
    len: WORD_LENGTH,
    answer,
    currentRow,
    currentCol,
    guesses,
    statusesGrid,
    gameOver
  };
  localStorage.setItem(`${keyPrefix()}_state`, JSON.stringify(data));
}

function loadGameState() {
  const raw = localStorage.getItem(`${keyPrefix()}_state`);
  if (!raw) return false;
  let data; try { data = JSON.parse(raw); } catch { return false; }

  // Validate saved payload
  if (data.len !== WORD_LENGTH) return false;
  if (isDailyMode() && data.date !== todayKey()) return false;

  // Prefer the saved answer if it still exists in the current word set
  if (data.answer && CURRENT_WORDS.has(data.answer)) {
    answer = data.answer;
  }

  // Clear board visuals and rebuild from saved state
  for (let r = 0; r < MAX_GUESSES; r++) {
    for (let c = 0; c < WORD_LENGTH; c++) {
      const tile = getTile(r, c);
      tile.textContent = '';
      tile.className = 'tile';
    }
  }
  resetKeyboard();

  guesses = Array.isArray(data.guesses) ? data.guesses : [];
  statusesGrid = Array.isArray(data.statusesGrid) ? data.statusesGrid : [];
  currentRow = data.currentRow ?? 0;
  currentCol = data.currentCol ?? 0;
  gameOver = !!data.gameOver;

  // Paint committed rows
  for (let r = 0; r < guesses.length; r++) {
    const g = guesses[r];
    const st = statusesGrid[r] || [];
    for (let i = 0; i < WORD_LENGTH; i++) {
      const ch = g?.[i] ?? '';
      const tile = getTile(r, i);
      tile.textContent = ch;
      if (ch) tile.classList.add('filled');
      const s = st[i];
      if (s) {
        tile.classList.add('reveal', s);  // final state
        paintKeyboard(ch, s);
      }
    }
  }

  // Restore partial row letters (if any)
  if (!gameOver && currentRow < MAX_GUESSES) {
    const partial = guesses[currentRow] || '';
    for (let i = 0; i < currentCol; i++) {
      const tile = getTile(currentRow, i);
      tile.textContent = partial[i] || '';
      tile.classList.add('filled');
    }
  }

  shareBtn && (shareBtn.disabled = !gameOver);
  return true;
}