/**
 * Build the crossword word bank from the ENABLE word list.
 * Filters to 3-7 letter words, scores by commonness heuristics.
 *
 * Run: npx tsx scripts/build-wordbank.ts
 * Output: src/data/words.json
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

// Common English letter frequencies (approximate, for scoring)
const LETTER_FREQ: Record<string, number> = {
  E: 12.7, T: 9.1, A: 8.2, O: 7.5, I: 7.0, N: 6.7, S: 6.3, H: 6.1,
  R: 6.0, D: 4.3, L: 4.0, C: 2.8, U: 2.8, M: 2.4, W: 2.4, F: 2.2,
  G: 2.0, Y: 2.0, P: 1.9, B: 1.5, V: 1.0, K: 0.8, J: 0.2, X: 0.2,
  Q: 0.1, Z: 0.1,
};

// Very common words get a bonus (top ~3000 English words)
// This is a subset — the full list would be loaded from a frequency corpus
const COMMON_WORDS = new Set([
  // Top common 3-letter words
  "THE", "AND", "FOR", "ARE", "BUT", "NOT", "YOU", "ALL", "CAN", "HER",
  "WAS", "ONE", "OUR", "OUT", "DAY", "HAD", "HAS", "HIS", "HOW", "MAN",
  "NEW", "NOW", "OLD", "SEE", "WAY", "MAY", "SAY", "SHE", "TWO", "USE",
  "BOY", "DID", "GET", "LET", "SAY", "TOO", "OWN", "SAY", "RUN", "SET",
  "TRY", "ASK", "MEN", "RAN", "PUT", "BIG", "END", "ACT", "ADD", "AGE",
  "AGO", "AID", "AIM", "AIR", "ART", "BAD", "BAR", "BED", "BIT", "BOX",
  "BUS", "CAR", "CUT", "DOG", "EAR", "EAT", "EYE", "FAR", "FAT", "FEW",
  "FIT", "FLY", "GOD", "GUN", "GUY", "HAT", "HIT", "HOT", "ICE", "JOB",
  "KEY", "LAW", "LAY", "LEG", "LIE", "LIP", "LOG", "LOT", "LOW", "MAP",
  "MIX", "NET", "OIL", "PAY", "PEN", "PIE", "PIN", "PIT", "RAW", "RED",
  "RIB", "ROW", "RUG", "SEA", "SIT", "SIX", "SKI", "SKY", "SON", "SUN",
  "TAX", "TEA", "TEN", "TIE", "TIN", "TIP", "TOP", "TOY", "VAN", "WAR",
  "WEB", "WET", "WIN", "WON", "YES", "YET",
  // Top common 4-letter words
  "ABLE", "ALSO", "AREA", "ARMY", "AWAY", "BACK", "BALL", "BAND", "BANK",
  "BASE", "BATH", "BEAR", "BEAT", "BEEN", "BELL", "BEST", "BILL", "BIRD",
  "BLUE", "BOAT", "BODY", "BOMB", "BOND", "BONE", "BOOK", "BORN", "BOSS",
  "BOTH", "BURN", "BUSY", "CALL", "CALM", "CAME", "CAMP", "CARD", "CARE",
  "CASE", "CASH", "CAST", "CELL", "CHAT", "CHIP", "CITY", "CLUB", "COAT",
  "CODE", "COLD", "COME", "COOK", "COOL", "COPY", "CORE", "COST", "CREW",
  "CROP", "DARK", "DATA", "DATE", "DEAD", "DEAL", "DEAR", "DEEP", "DIET",
  "DIRT", "DISH", "DISK", "DOCK", "DOES", "DONE", "DOOR", "DOWN", "DRAW",
  "DROP", "DRUG", "DRUM", "DUAL", "DUST", "DUTY", "EACH", "EARN", "EASE",
  "EAST", "EASY", "EDGE", "ELSE", "EVEN", "EVER", "EVIL", "EXAM", "FACE",
  "FACT", "FAIL", "FAIR", "FALL", "FAME", "FARM", "FAST", "FATE", "FEAR",
  "FEED", "FEEL", "FEET", "FELL", "FILE", "FILL", "FILM", "FIND", "FINE",
  "FIRE", "FIRM", "FISH", "FLAG", "FLAT", "FLEW", "FLIP", "FLOW", "FOLD",
  "FOLK", "FOOD", "FOOT", "FORD", "FORM", "FORT", "FOUR", "FREE", "FROM",
  "FUEL", "FULL", "FUND", "GAIN", "GAME", "GATE", "GAVE", "GENE", "GIFT",
  "GIRL", "GIVE", "GLAD", "GOAL", "GOES", "GOLD", "GOLF", "GONE", "GOOD",
  "GRAB", "GRAY", "GREW", "GRID", "GROW", "GULF", "HAIR", "HALF", "HALL",
  "HAND", "HANG", "HARD", "HARM", "HATE", "HAVE", "HEAD", "HEAR", "HEAT",
  "HELD", "HELP", "HERE", "HERO", "HIGH", "HILL", "HIRE", "HOLD", "HOLE",
  "HOME", "HOOK", "HOPE", "HOST", "HOUR", "HUGE", "HUNG", "HUNT", "HURT",
  "IDEA", "INCH", "INTO", "IRON", "ITEM", "JACK", "JAIL", "JANE", "JEAN",
  "JOHN", "JOIN", "JOKE", "JUMP", "JUNE", "JURY", "JUST", "KEEN", "KEEP",
  "KEPT", "KICK", "KILL", "KIND", "KING", "KISS", "KNEE", "KNEW", "KNOW",
  "LACK", "LAID", "LAKE", "LAMP", "LAND", "LANE", "LAST", "LATE", "LEAD",
  "LEAN", "LEFT", "LEND", "LESS", "LIFE", "LIFT", "LIKE", "LINE", "LINK",
  "LIST", "LIVE", "LOAD", "LOAN", "LOCK", "LONG", "LOOK", "LORD", "LOSE",
  "LOSS", "LOST", "LOTS", "LOVE", "LUCK", "MADE", "MAIL", "MAIN", "MAKE",
  "MALE", "MANY", "MARK", "MASS", "MATE", "MEAL", "MEAN", "MEAT", "MEET",
  "MILE", "MILK", "MILL", "MIND", "MINE", "MISS", "MODE", "MOOD", "MOON",
  "MORE", "MOST", "MOVE", "MUCH", "MUST", "NAME", "NAVY", "NEAR", "NEAT",
  "NECK", "NEED", "NEWS", "NEXT", "NICE", "NINE", "NODE", "NONE", "NOSE",
  "NOTE", "ODDS", "OKAY", "ONCE", "ONLY", "ONTO", "OPEN", "ORAL", "OVER",
  "PACE", "PACK", "PAGE", "PAID", "PAIN", "PAIR", "PALE", "PALM", "PARK",
  "PART", "PASS", "PAST", "PATH", "PEAK", "PICK", "PILE", "PINE", "PINK",
  "PIPE", "PLAN", "PLAY", "PLOT", "PLUG", "PLUS", "POEM", "POET", "POLL",
  "POOL", "POOR", "PORT", "POSE", "POST", "POUR", "PRAY", "PULL", "PUMP",
  "PURE", "PUSH", "RACE", "RAIN", "RANK", "RARE", "RATE", "READ", "REAL",
  "REAR", "RELY", "RENT", "REST", "RICE", "RICH", "RIDE", "RING", "RISE",
  "RISK", "ROAD", "ROCK", "RODE", "ROLE", "ROLL", "ROOF", "ROOM", "ROOT",
  "ROPE", "ROSE", "RULE", "RUSH", "SAFE", "SAID", "SAIL", "SAKE", "SALE",
  "SALT", "SAME", "SAND", "SANG", "SAVE", "SEAT", "SEED", "SEEK", "SEEM",
  "SEEN", "SELF", "SELL", "SEND", "SENT", "SEPT", "SHIP", "SHOP", "SHOT",
  "SHOW", "SHUT", "SICK", "SIDE", "SIGN", "SING", "SINK", "SITE", "SIZE",
  "SKIN", "SLIP", "SLOW", "SNAP", "SNOW", "SOFT", "SOIL", "SOLD", "SOLE",
  "SOME", "SONG", "SOON", "SORT", "SOUL", "SPAN", "SPIN", "SPOT", "STAR",
  "STAY", "STEM", "STEP", "STOP", "SUCH", "SUIT", "SURE", "SWIM", "TAIL",
  "TAKE", "TALE", "TALK", "TALL", "TANK", "TAPE", "TASK", "TAXI", "TEAM",
  "TEAR", "TELL", "TEND", "TERM", "TEST", "TEXT", "THAN", "THAT", "THEM",
  "THEN", "THEY", "THIN", "THIS", "THUS", "TIDE", "TIED", "TIER", "TILL",
  "TIME", "TINY", "TIRE", "TOLD", "TOLL", "TONE", "TOOK", "TOOL", "TOPS",
  "TORE", "TORN", "TOUR", "TOWN", "TRAP", "TREE", "TRIM", "TRIP", "TRUE",
  "TUBE", "TUCK", "TUNE", "TURN", "TWIN", "TYPE", "UGLY", "UNIT", "UPON",
  "URGE", "USED", "USER", "VALE", "VARY", "VAST", "VERY", "VIEW", "VINE",
  "VISA", "VOTE", "WADE", "WAGE", "WAIT", "WAKE", "WALK", "WALL", "WANT",
  "WARD", "WARM", "WARN", "WASH", "WAVE", "WEAK", "WEAR", "WEEK", "WELL",
  "WENT", "WERE", "WEST", "WHAT", "WHEN", "WHOM", "WIDE", "WIFE", "WILD",
  "WILL", "WIND", "WINE", "WING", "WIRE", "WISE", "WISH", "WITH", "WOOD",
  "WORD", "WORE", "WORK", "WORM", "WORN", "WRAP", "YARD", "YEAR", "YOUR",
  "ZERO", "ZONE", "ZOOM",
  // Top common 5-letter words
  "ABOUT", "ABOVE", "ABUSE", "ACTOR", "ADAPT", "ADMIT", "ADOPT", "ADULT",
  "AFTER", "AGAIN", "AGENT", "AGREE", "AHEAD", "ALARM", "ALBUM", "ALERT",
  "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLOW", "ALONE", "ALONG", "ALTER",
  "AMONG", "ANGEL", "ANGER", "ANGLE", "ANGRY", "APART", "APPLE", "APPLY",
  "ARENA", "ARGUE", "ARISE", "ARRAY", "ASIDE", "AVOID", "AWARD", "AWARE",
  "BADLY", "BASED", "BASIC", "BEACH", "BEGIN", "BEING", "BELOW", "BENCH",
  "BLACK", "BLADE", "BLAME", "BLANK", "BLAST", "BLAZE", "BLEED", "BLEND",
  "BLIND", "BLOCK", "BLOOD", "BLOWN", "BOARD", "BONUS", "BOOTH", "BOUND",
  "BRAIN", "BRAND", "BRAVE", "BREAD", "BREAK", "BREED", "BRICK", "BRIEF",
  "BRING", "BROAD", "BROKE", "BROWN", "BUILD", "BUILT", "BURST", "BUYER",
  "CABLE", "CARRY", "CATCH", "CAUSE", "CHAIN", "CHAIR", "CHAOS", "CHARM",
  "CHART", "CHASE", "CHEAP", "CHECK", "CHEEK", "CHEER", "CHESS", "CHEST",
  "CHIEF", "CHILD", "CHINA", "CIVIL", "CLAIM", "CLASS", "CLEAN", "CLEAR",
  "CLIMB", "CLING", "CLOCK", "CLOSE", "CLOTH", "CLOUD", "COACH", "COAST",
  "COLOR", "COULD", "COUNT", "COURT", "COVER", "CRACK", "CRAFT", "CRASH",
  "CRAZY", "CREAM", "CRIME", "CROSS", "CROWD", "CROWN", "CRUEL", "CRUSH",
  "CURVE", "CYCLE", "DAILY", "DANCE", "DEATH", "DEBUT", "DELAY", "DELTA",
  "DEMON", "DENSE", "DEPTH", "DEVIL", "DIRTY", "DOUBT", "DOUGH", "DRAFT",
  "DRAIN", "DRAMA", "DRANK", "DRAWN", "DREAM", "DRESS", "DRIED", "DRIFT",
  "DRINK", "DRIVE", "DROPS", "DRUNK", "DYING", "EAGER", "EARLY", "EARTH",
  "EIGHT", "ELECT", "ELITE", "EMPTY", "ENEMY", "ENJOY", "ENTER", "ENTRY",
  "EQUAL", "ERROR", "EVENT", "EVERY", "EXACT", "EXIST", "EXTRA", "FAITH",
  "FALSE", "FANCY", "FATAL", "FAULT", "FAVOR", "FEAST", "FENCE", "FEVER",
  "FIBER", "FIELD", "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLAME",
  "FLASH", "FLESH", "FLOAT", "FLOOD", "FLOOR", "FLOUR", "FLUID", "FOCUS",
  "FORCE", "FORGE", "FORTH", "FORUM", "FOUND", "FRAME", "FRANK", "FRAUD",
  "FRESH", "FRONT", "FROST", "FROZE", "FRUIT", "FULLY", "FUNNY", "GIANT",
  "GIVEN", "GLASS", "GLOBE", "GLORY", "GOING", "GRACE", "GRADE", "GRAIN",
  "GRAND", "GRANT", "GRAPH", "GRASP", "GRASS", "GRAVE", "GREAT", "GREEN",
  "GREET", "GROSS", "GROUP", "GROVE", "GROWN", "GUARD", "GUESS", "GUEST",
  "GUIDE", "GUILT", "HABIT", "HAPPY", "HARSH", "HEART", "HEAVY", "HENCE",
  "HORSE", "HOTEL", "HOUSE", "HUMAN", "HUMOR", "HURRY", "IDEAL", "IMAGE",
  "IMPLY", "INDEX", "INNER", "INPUT", "IRONY", "ISSUE", "IVORY", "JOINT",
  "JUDGE", "JUICE", "KNOWN", "LABEL", "LABOR", "LARGE", "LASER", "LATER",
  "LAUGH", "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL", "LEVEL",
  "LIGHT", "LIMIT", "LIVER", "LOCAL", "LODGE", "LOGIC", "LONELY", "LOOSE",
  "LOVER", "LOWER", "LOYAL", "LUCKY", "LUNCH", "MAGIC", "MAJOR", "MAKER",
  "MARCH", "MATCH", "MAYOR", "MEDIA", "MERCY", "MERGE", "MERIT", "METAL",
  "METER", "MIGHT", "MINOR", "MODEL", "MONEY", "MONTH", "MORAL", "MOTOR",
  "MOUNT", "MOUSE", "MOUTH", "MOVED", "MOVIE", "MUSIC", "NAVAL", "NERVE",
  "NEVER", "NEWLY", "NIGHT", "NOBLE", "NOISE", "NORTH", "NOTED", "NOVEL",
  "NURSE", "OCCUR", "OCEAN", "OFFER", "OFTEN", "OLIVE", "OPERA", "ORDER",
  "OTHER", "OUGHT", "OUTER", "OWNER", "PAINT", "PANEL", "PANIC", "PAPER",
  "PARTY", "PATCH", "PAUSE", "PEACE", "PENNY", "PHASE", "PHONE", "PHOTO",
  "PIANO", "PIECE", "PILOT", "PITCH", "PIXEL", "PLACE", "PLAIN", "PLANE",
  "PLANT", "PLATE", "PLAZA", "PLEAD", "POINT", "POLAR", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROOF",
  "PROUD", "PROVE", "PSALM", "PULSE", "PUPIL", "QUEEN", "QUEST", "QUEUE",
  "QUICK", "QUIET", "QUOTE", "RADAR", "RADIO", "RAISE", "RALLY", "RANGE",
  "RAPID", "RATIO", "REACH", "REACT", "REALM", "REBEL", "REIGN", "RELAX",
  "REPLY", "RIDER", "RIGHT", "RIGID", "RISKY", "RIVAL", "RIVER", "ROBOT",
  "ROCKY", "ROGER", "ROUGH", "ROUND", "ROUTE", "ROYAL", "RULER", "RURAL",
  "SAINT", "SALAD", "SCALE", "SCENE", "SCENT", "SCOPE", "SCORE", "SCOUT",
  "SENSE", "SERVE", "SEVEN", "SHADE", "SHAKE", "SHALL", "SHAME", "SHAPE",
  "SHARE", "SHARP", "SHEER", "SHEET", "SHELF", "SHELL", "SHIFT", "SHINE",
  "SHIRT", "SHOCK", "SHOOT", "SHORE", "SHORT", "SHOUT", "SIGHT", "SINCE",
  "SIXTH", "SIXTY", "SKILL", "SKULL", "SLATE", "SLAVE", "SLEEP", "SLICE",
  "SLIDE", "SLOPE", "SMALL", "SMART", "SMELL", "SMILE", "SMOKE", "SNAKE",
  "SOLAR", "SOLID", "SOLVE", "SORRY", "SOUND", "SOUTH", "SPACE", "SPARE",
  "SPEAK", "SPEED", "SPELL", "SPEND", "SPENT", "SPILL", "SPINE", "SPLIT",
  "SPOKE", "SPORT", "SPRAY", "STACK", "STAFF", "STAGE", "STAIN", "STAKE",
  "STALE", "STALL", "STAMP", "STAND", "STARE", "START", "STATE", "STAYS",
  "STEAK", "STEAL", "STEAM", "STEEL", "STEEP", "STEER", "STERN", "STICK",
  "STIFF", "STILL", "STOCK", "STOLE", "STONE", "STOOD", "STOOL", "STORE",
  "STORM", "STORY", "STOVE", "STRIP", "STUCK", "STUDY", "STUFF", "STYLE",
  "SUGAR", "SUITE", "SUPER", "SURGE", "SWEAR", "SWEAT", "SWEEP", "SWEET",
  "SWEPT", "SWIFT", "SWING", "SWORD", "SWORE", "TABLE", "TASTE", "TEACH",
  "TEETH", "THANK", "THEME", "THERE", "THICK", "THIEF", "THING", "THINK",
  "THIRD", "THOSE", "THREE", "THREW", "THROW", "THUMB", "TIGHT", "TIRED",
  "TITLE", "TODAY", "TOKEN", "TOPIC", "TOTAL", "TOUCH", "TOUGH", "TOWEL",
  "TOWER", "TRACE", "TRACK", "TRADE", "TRAIL", "TRAIN", "TRAIT", "TRASH",
  "TREAT", "TREND", "TRIAL", "TRIBE", "TRICK", "TRIED", "TROOP", "TRUCK",
  "TRULY", "TRUNK", "TRUST", "TRUTH", "TWICE", "TWIST", "ULTRA", "UNCLE",
  "UNDER", "UNION", "UNITE", "UNITY", "UNTIL", "UPPER", "UPSET", "URBAN",
  "USUAL", "VALID", "VALUE", "VIDEO", "VIGOR", "VIRUS", "VISIT", "VITAL",
  "VIVID", "VOCAL", "VOICE", "VOTER", "WASTE", "WATCH", "WATER", "WEAVE",
  "WEIGH", "WEIRD", "WHEAT", "WHEEL", "WHERE", "WHICH", "WHILE", "WHITE",
  "WHOLE", "WHOSE", "WOMAN", "WORLD", "WORRY", "WORSE", "WORST", "WORTH",
  "WOULD", "WOUND", "WRITE", "WRONG", "WROTE", "YACHT", "YIELD", "YOUNG",
  "YOUTH",
]);

// "Crosswordese" penalty words — too obscure / overused in crosswords
const CROSSWORDESE = new Set([
  "ETUI", "ESNE", "ERNE", "EPEE", "ALEE", "ALAE", "ANOA", "ATAP",
  "EDDO", "ESAU", "ENTIA", "OATER", "ARIEL", "ORIOLE", "NAEVI",
  "AALII", "ADIEU", "AGENE", "AINEE", "AIRER", "ALANE", "ANILE",
]);

function scoreWord(word: string): number {
  let score = 50; // base score

  // Letter frequency bonus: words with common letters are more crossing-friendly
  let freqSum = 0;
  for (const c of word) {
    freqSum += LETTER_FREQ[c] || 0;
  }
  const avgFreq = freqSum / word.length;
  score += Math.round(avgFreq * 2); // +0 to +25

  // Vowel balance: prefer words with 30-60% vowels
  const vowels = word.split("").filter((c) => "AEIOU".includes(c)).length;
  const vowelRatio = vowels / word.length;
  if (vowelRatio >= 0.3 && vowelRatio <= 0.6) score += 5;
  if (vowelRatio < 0.15 || vowelRatio > 0.7) score -= 10;

  // Common word bonus
  if (COMMON_WORDS.has(word)) score += 15;

  // Crosswordese penalty
  if (CROSSWORDESE.has(word)) score -= 25;

  // Penalize words with rare letter combos
  if (word.includes("Q") && !word.includes("QU")) score -= 15;
  if (word.includes("ZZ") || word.includes("XX") || word.includes("QQ")) score -= 10;

  // Penalize words that are ALL consonants or ALL vowels
  if (vowels === 0) score -= 20;
  if (vowels === word.length) score -= 15;

  // Slight bonus for medium-length words (4-5 are ideal for mini crosswords)
  if (word.length === 4 || word.length === 5) score += 3;

  return Math.max(1, Math.min(99, score));
}

function main() {
  const inputPath = join(__dirname, "enable1.txt");
  const outputPath = join(__dirname, "..", "src", "data", "words.json");

  console.log("Reading ENABLE word list...");
  const raw = readFileSync(inputPath, "utf-8");
  const allWords = raw
    .split("\n")
    .map((w) => w.trim().toUpperCase())
    .filter((w) => /^[A-Z]+$/.test(w));

  console.log(`Total raw words: ${allWords.length}`);

  // Filter to 3-7 letter words (mini crossword range)
  const filtered = allWords.filter((w) => w.length >= 3 && w.length <= 7);
  console.log(`After length filter (3-7): ${filtered.length}`);

  // Score each word
  const scored = filtered.map((w) => ({
    w,
    s: scoreWord(w),
  }));

  // Sort by score descending within each length
  scored.sort((a, b) => {
    if (a.w.length !== b.w.length) return a.w.length - b.w.length;
    return b.s - a.s;
  });

  // Stats
  const byLength = new Map<number, number>();
  for (const { w } of scored) {
    byLength.set(w.length, (byLength.get(w.length) || 0) + 1);
  }
  console.log("\nWords by length:");
  for (const [len, count] of [...byLength.entries()].sort()) {
    console.log(`  ${len} letters: ${count}`);
  }

  // Score distribution
  const buckets = [0, 0, 0, 0, 0]; // 1-20, 21-40, 41-60, 61-80, 81-99
  for (const { s } of scored) {
    if (s <= 20) buckets[0]++;
    else if (s <= 40) buckets[1]++;
    else if (s <= 60) buckets[2]++;
    else if (s <= 80) buckets[3]++;
    else buckets[4]++;
  }
  console.log("\nScore distribution:");
  console.log(`  1-20:  ${buckets[0]}`);
  console.log(`  21-40: ${buckets[1]}`);
  console.log(`  41-60: ${buckets[2]}`);
  console.log(`  61-80: ${buckets[3]}`);
  console.log(`  81-99: ${buckets[4]}`);

  // Write output
  writeFileSync(outputPath, JSON.stringify(scored));
  const sizeMB = (Buffer.byteLength(JSON.stringify(scored)) / 1024 / 1024).toFixed(1);
  console.log(`\nWritten ${scored.length} words to ${outputPath} (${sizeMB} MB)`);
}

main();
