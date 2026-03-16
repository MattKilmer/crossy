/**
 * Quick test: verify the solver can fill all 6 templates
 * with a small hardcoded word bank.
 *
 * Run: npx tsx scripts/test-solver.ts
 */
import { solve } from "../src/lib/solver/solver";
import { TEMPLATES_5x5 } from "../src/lib/solver/templates";
import { extractSlots, findIntersections } from "../src/lib/solver/extract";

// Small but crossing-friendly word bank
const WORDS_3 = [
  "ACE", "ACT", "ADD", "AGE", "AID", "AIM", "AIR", "ALL", "AND", "ANT",
  "APE", "ARC", "ARE", "ARK", "ARM", "ART", "ATE", "AWE", "AXE",
  "BAD", "BAG", "BAN", "BAR", "BAT", "BED", "BIG", "BIT", "BOW", "BOX",
  "BOY", "BUD", "BUG", "BUN", "BUS", "BUT", "BUY",
  "CAB", "CAN", "CAP", "CAR", "CAT", "COP", "COT", "COW", "CRY", "CUB",
  "CUP", "CUT",
  "DAD", "DAM", "DAY", "DEN", "DEW", "DID", "DIG", "DIM", "DIP", "DOC",
  "DOG", "DOT", "DRY", "DUB", "DUG", "DUO", "DYE",
  "EAR", "EAT", "EEL", "EGG", "ELF", "ELK", "ELM", "EMU", "END", "ERA",
  "EVE", "EWE", "EYE",
  "FAN", "FAR", "FAT", "FAX", "FED", "FEW", "FIG", "FIN", "FIT", "FIX",
  "FLY", "FOB", "FOG", "FOR", "FOX", "FRY", "FUN", "FUR",
  "GAB", "GAG", "GAP", "GAS", "GEL", "GEM", "GET", "GIG", "GIN", "GNU",
  "GOB", "GOD", "GOT", "GUM", "GUN", "GUT", "GUY", "GYM",
  "HAD", "HAM", "HAS", "HAT", "HAY", "HEN", "HER", "HEW", "HID", "HIM",
  "HIP", "HIS", "HIT", "HOB", "HOG", "HOP", "HOT", "HOW", "HUB", "HUE",
  "HUG", "HUM", "HUT",
  "ICE", "ICY", "ILL", "IMP", "INK", "INN", "ION", "IRE", "IRK", "IVY",
  "JAB", "JAG", "JAM", "JAR", "JAW", "JAY", "JET", "JIG", "JOB", "JOG",
  "JOT", "JOY", "JUG", "JUT",
  "KEG", "KEN", "KEY", "KID", "KIN", "KIT",
  "LAB", "LAD", "LAG", "LAP", "LAW", "LAY", "LED", "LEG", "LET", "LID",
  "LIE", "LIP", "LIT", "LOG", "LOT", "LOW",
  "MAD", "MAN", "MAP", "MAR", "MAT", "MAW", "MAY", "MEN", "MET", "MIX",
  "MOB", "MOM", "MOP", "MUD", "MUG", "MUM",
  "NAB", "NAG", "NAP", "NET", "NEW", "NIL", "NIT", "NOD", "NOR", "NOT",
  "NOW", "NUB", "NUN", "NUT",
  "OAK", "OAR", "OAT", "ODD", "ODE", "OFF", "OFT", "OIL", "OLD", "ONE",
  "OPT", "ORB", "ORE", "OUR", "OUT", "OWE", "OWL", "OWN",
  "PAD", "PAL", "PAN", "PAT", "PAW", "PAY", "PEA", "PEG", "PEN", "PEP",
  "PET", "PEW", "PIE", "PIG", "PIN", "PIT", "PLY", "POD", "POP", "POT",
  "PRY", "PUB", "PUG", "PUN", "PUP", "PUS", "PUT",
  "RAG", "RAM", "RAN", "RAP", "RAT", "RAW", "RAY", "RED", "REF", "RIB",
  "RID", "RIG", "RIM", "RIP", "ROB", "ROD", "ROT", "ROW", "RUB", "RUG",
  "RUM", "RUN", "RUT",
  "SAD", "SAG", "SAP", "SAT", "SAW", "SAY", "SEA", "SET", "SEW", "SHE",
  "SHY", "SIN", "SIP", "SIS", "SIT", "SIX", "SKI", "SKY", "SLY", "SOB",
  "SOD", "SON", "SOP", "SOT", "SOW", "SOY", "SPA", "SPY", "STY", "SUB",
  "SUM", "SUN", "SUP",
  "TAB", "TAD", "TAG", "TAN", "TAP", "TAR", "TAT", "TAX", "TEA", "TEN",
  "THE", "TIE", "TIN", "TIP", "TOE", "TON", "TOO", "TOP", "TOW", "TOY",
  "TUB", "TUG", "TWO",
  "URN", "USE",
  "VAN", "VAT", "VET", "VEX", "VIA", "VIE", "VOW",
  "WAD", "WAR", "WAS", "WAX", "WAY", "WEB", "WED", "WET", "WHO", "WHY",
  "WIG", "WIN", "WIT", "WOE", "WOK", "WON", "WOO", "WOW",
  "YAK", "YAM", "YAP", "YAW", "YEA", "YES", "YET", "YEW", "YOU", "YOW",
  "ZAP", "ZEN", "ZIP", "ZIT", "ZOO",
];

const WORDS_4 = [
  "ABLE", "ACHE", "ACID", "ACRE", "AGED", "AIDE", "ALLY", "ALSO", "AMID",
  "ARCH", "AREA", "ARMY", "ATOM", "AUTO", "AVID", "AWAY", "AXLE",
  "BACK", "BAKE", "BALD", "BALE", "BALL", "BAND", "BANE", "BANK", "BARE",
  "BARK", "BARN", "BASE", "BATH", "BEAD", "BEAM", "BEAN", "BEAR", "BEAT",
  "BELL", "BELT", "BEND", "BEST", "BIKE", "BILL", "BIND", "BIRD", "BITE",
  "BLOW", "BLUE", "BLUR", "BOAT", "BODY", "BOLD", "BOLT", "BOMB", "BOND",
  "BONE", "BOOK", "BOOM", "BOOT", "BORE", "BORN", "BOSS", "BOTH", "BOWL",
  "BULK", "BULL", "BUMP", "BURN", "BURY", "BUSH", "BUSY", "BUZZ",
  "CAFE", "CAGE", "CAKE", "CALF", "CALL", "CALM", "CAME", "CAMP", "CAPE",
  "CARD", "CARE", "CART", "CASE", "CASH", "CAST", "CAVE", "CELL", "CHAR",
  "CHAT", "CHIP", "CHOP", "CITY", "CLAD", "CLAM", "CLAN", "CLAP", "CLAW",
  "CLAY", "CLIP", "CLOT", "CLUB", "CLUE", "COAL", "COAT", "CODE", "COIL",
  "COIN", "COLD", "COME", "CONE", "COOK", "COOL", "COPE", "COPY", "CORD",
  "CORE", "CORK", "CORN", "COST", "COZY", "CRAB", "CREW", "CROP", "CROW",
  "CUBE", "CULT", "CURB", "CURE", "CURL", "CUTE",
  "DALE", "DAME", "DAMP", "DARE", "DARK", "DART", "DASH", "DATA", "DATE",
  "DAWN", "DEAD", "DEAF", "DEAL", "DEAR", "DEBT", "DECK", "DEED", "DEEM",
  "DEEP", "DEER", "DEMO", "DENT", "DESK", "DIAL", "DICE", "DIET", "DINE",
  "DIRE", "DIRT", "DISH", "DISK", "DOCK", "DOES", "DOLL", "DOME", "DONE",
  "DOOM", "DOOR", "DOSE", "DOVE", "DOWN", "DRAG", "DRAW", "DRIP", "DROP",
  "DRUM", "DUAL", "DUCK", "DUEL", "DULL", "DUMB", "DUMP", "DUNE", "DUSK",
  "DUST", "DUTY",
  "EACH", "EARN", "EASE", "EAST", "EASY", "EDGE", "EDIT", "ELSE", "EMIT",
  "EPIC", "EVEN", "EVER", "EVIL", "EXAM", "EXIT", "EYED",
  "FACE", "FACT", "FADE", "FAIL", "FAIR", "FAKE", "FALL", "FAME", "FANG",
  "FARE", "FARM", "FAST", "FATE", "FAWN", "FEAR", "FEAT", "FEED", "FEEL",
  "FELL", "FELT", "FEND", "FERN", "FEST", "FILE", "FILL", "FILM", "FIND",
  "FINE", "FIRE", "FIRM", "FISH", "FIST", "FLAG", "FLAP", "FLAT", "FLAW",
  "FLED", "FLEW", "FLEX", "FLIP", "FLIT", "FLOG", "FLOW", "FOAM", "FOIL",
  "FOLD", "FOLK", "FOND", "FONT", "FOOD", "FOOL", "FOOT", "FORD", "FORE",
  "FORK", "FORM", "FORT", "FOUL", "FOUR", "FRAY", "FREE", "FROM", "FUEL",
  "FULL", "FUME", "FUND", "FURY", "FUSE", "FUSS",
  "GAIN", "GALE", "GAME", "GANG", "GAPE", "GARB", "GATE", "GAVE", "GAZE",
  "GEAR", "GENE", "GIFT", "GIST", "GIVE", "GLAD", "GLEE", "GLEN", "GLOW",
  "GLUE", "GNAT", "GNAW", "GOAT", "GOES", "GOLD", "GOLF", "GONE", "GOOD",
  "GORE", "GRAB", "GRAM", "GRAY", "GREW", "GRID", "GRIM", "GRIN", "GRIP",
  "GRIT", "GROW", "GULF", "GUST",
  "HACK", "HAIL", "HAIR", "HALE", "HALF", "HALL", "HALT", "HAND", "HANG",
  "HARD", "HARE", "HARM", "HARP", "HASH", "HATE", "HAUL", "HAVE", "HAZE",
  "HEAD", "HEAL", "HEAP", "HEAR", "HEAT", "HEED", "HEEL", "HELD", "HELM",
  "HELP", "HERB", "HERD", "HERE", "HERO", "HIDE", "HIGH", "HIKE", "HILL",
  "HILT", "HIND", "HINT", "HIRE", "HISS", "HIVE", "HOAX", "HOLD", "HOLE",
  "HOME", "HONE", "HOOD", "HOOK", "HOPE", "HORN", "HOST", "HOUR", "HOWL",
  "HUGE", "HULL", "HUMP", "HUNT", "HURL", "HURT", "HUSH", "HYMN",
  "ICON", "IDEA", "IDLE", "INCH", "INTO", "IRON", "ISLE", "ITEM",
  "JADE", "JAIL", "JAMB", "JAZZ", "JEST", "JILT", "JINX", "JIVE", "JOLT",
  "JOWL", "JUMP", "JUNK", "JURY", "JUST",
  "KEEL", "KEEN", "KEEP", "KELP", "KEPT", "KICK", "KILL", "KIND", "KING",
  "KISS", "KITE", "KNOB", "KNOT", "KNOW",
  "LACE", "LACK", "LACY", "LAID", "LAIR", "LAKE", "LAMB", "LAME", "LAMP",
  "LAND", "LANE", "LARD", "LARK", "LASH", "LAST", "LATE", "LAWN", "LEAD",
  "LEAF", "LEAK", "LEAN", "LEAP", "LEFT", "LEND", "LENS", "LESS", "LEST",
  "LEVY", "LIAR", "LICK", "LIED", "LIFE", "LIFT", "LIKE", "LILY", "LIMB",
  "LIME", "LIMP", "LINE", "LINK", "LINT", "LION", "LIST", "LIVE", "LOAD",
  "LOAF", "LOAN", "LOCK", "LODE", "LOFT", "LONE", "LONG", "LOOK", "LOOM",
  "LOOP", "LORD", "LORE", "LOSE", "LOSS", "LOST", "LOUD", "LOVE", "LUCK",
  "LULL", "LUMP", "LUNG", "LURE", "LURK", "LUSH", "LUST",
  "MACE", "MADE", "MAIL", "MAIN", "MAKE", "MALE", "MALT", "MANE", "MANY",
  "MARE", "MARK", "MARS", "MASH", "MASK", "MASS", "MAST", "MATE", "MAZE",
  "MEAL", "MEAN", "MEAT", "MELD", "MELT", "MEMO", "MEND", "MENU", "MERE",
  "MESH", "MESS", "MILD", "MILE", "MILK", "MILL", "MIND", "MINE", "MINT",
  "MIRE", "MISS", "MIST", "MOAN", "MOAT", "MOCK", "MODE", "MOLD", "MOLE",
  "MOOD", "MOON", "MOOR", "MORE", "MOSS", "MOST", "MOTH", "MOVE", "MUCH",
  "MULE", "MUSE", "MUST", "MUTE",
  "NAIL", "NAME", "NAPE", "NAVY", "NEAR", "NEAT", "NECK", "NEED", "NEST",
  "NEWS", "NEXT", "NICE", "NINE", "NODE", "NONE", "NOOK", "NORM", "NOSE",
  "NOTE", "NOUN", "NUDE",
  "OATH", "OBEY", "ODDS", "OMEN", "OMIT", "ONCE", "ONLY", "ONTO", "OOZE",
  "OPAL", "OPEN", "ORAL", "ORCA", "OVEN", "OVER", "OWED", "OXEN",
  "PACE", "PACK", "PAGE", "PAID", "PAIL", "PAIN", "PAIR", "PALE", "PALM",
  "PANE", "PANT", "PARK", "PART", "PASS", "PAST", "PATH", "PAVE", "PAWN",
  "PEAK", "PEAL", "PEAR", "PEAT", "PECK", "PEEL", "PEER", "PELT", "PEND",
  "PERK", "PEST", "PICK", "PIER", "PILE", "PILL", "PINE", "PINK", "PIPE",
  "PLAN", "PLAY", "PLEA", "PLOD", "PLOT", "PLOW", "PLOY", "PLUG", "PLUM",
  "PLUS", "POCK", "POEM", "POET", "POKE", "POLE", "POLL", "POLO", "POND",
  "POOL", "POOR", "POPE", "PORE", "PORK", "PORT", "POSE", "POST", "POUR",
  "PRAY", "PREY", "PROD", "PROP", "PROW", "PULL", "PULP", "PUMP", "PURE",
  "PUSH", "PUTT",
  "QUAY", "QUIT", "QUIZ",
  "RACE", "RACK", "RAFT", "RAGE", "RAID", "RAIL", "RAIN", "RAKE", "RAMP",
  "RANG", "RANK", "RANT", "RARE", "RASH", "RASP", "RATE", "RAVE", "READ",
  "REAL", "REAP", "REAR", "REED", "REEF", "REEL", "REIN", "RELY", "REND",
  "RENT", "REST", "RICE", "RICH", "RIDE", "RIFE", "RIFT", "RILE", "RILL",
  "RIND", "RING", "RIOT", "RISE", "RISK", "ROAD", "ROAM", "ROAR", "ROBE",
  "ROCK", "RODE", "ROLE", "ROLL", "ROOF", "ROOM", "ROOT", "ROPE", "ROSE",
  "ROTE", "ROUT", "RUDE", "RUIN", "RULE", "RUMP", "RUNG", "RUSH", "RUST",
  "SAFE", "SAGE", "SAID", "SAIL", "SAKE", "SALE", "SALT", "SAME", "SAND",
  "SANE", "SANG", "SANK", "SASH", "SAVE", "SCAN", "SCAR", "SEAL", "SEAM",
  "SEAR", "SEAT", "SEED", "SEEK", "SEEM", "SEEN", "SELF", "SELL", "SEND",
  "SENT", "SHED", "SHIN", "SHIP", "SHOE", "SHOO", "SHOP", "SHOT", "SHOW",
  "SHUT", "SICK", "SIDE", "SIFT", "SIGH", "SIGN", "SILK", "SILL", "SILO",
  "SILT", "SING", "SINK", "SIRE", "SITE", "SIZE", "SKIT", "SLAB", "SLAG",
  "SLAM", "SLAP", "SLAT", "SLAW", "SLED", "SLEW", "SLID", "SLIM", "SLIP",
  "SLIT", "SLOT", "SLOW", "SLUG", "SLUM", "SMOG", "SNAP", "SNIP", "SNOB",
  "SNOT", "SNOW", "SNUB", "SNUG", "SOAK", "SOAP", "SOAR", "SOCK", "SODA",
  "SOFT", "SOIL", "SOLD", "SOLE", "SOME", "SONG", "SOON", "SOOT", "SORE",
  "SORT", "SOUL", "SOUR", "SPAN", "SPAR", "SPEC", "SPED", "SPIN", "SPIT",
  "SPOT", "SPUD", "SPUR", "STAB", "STAG", "STAR", "STAY", "STEM", "STEP",
  "STEW", "STIR", "STOP", "STOW", "STUB", "STUD", "STUN", "SUCH", "SUIT",
  "SULK", "SUMP", "SUNG", "SUNK", "SURE", "SURF", "SWAN", "SWAP", "SWIM",
  "SWUM",
  "TACK", "TACT", "TAIL", "TAKE", "TALE", "TALK", "TALL", "TAME", "TANK",
  "TAPE", "TAPS", "TART", "TASK", "TAXI", "TEAK", "TEAL", "TEAM", "TEAR",
  "TELL", "TEND", "TENT", "TERM", "TEST", "TEXT", "THAN", "THAT", "THEM",
  "THEN", "THEY", "THIN", "THIS", "THUD", "TIDE", "TIDY", "TIED", "TIER",
  "TILE", "TILL", "TILT", "TIME", "TINT", "TINY", "TIRE", "TOAD", "TOIL",
  "TOLD", "TOLL", "TOMB", "TONE", "TOOK", "TOOL", "TOPS", "TORE", "TORN",
  "TORT", "TOSS", "TOUR", "TOWN", "TRAP", "TRAY", "TREE", "TREK", "TRIM",
  "TRIO", "TRIP", "TROD", "TROT", "TRUE", "TUBE", "TUCK", "TUFT", "TULIP",
  "TUNA", "TUNE", "TURF", "TURN", "TWIG", "TWIN", "TYPE",
  "UGLY", "UNDO", "UNIT", "UNTO", "UPON", "URGE", "USED",
  "VAIN", "VALE", "VANE", "VARY", "VASE", "VAST", "VEER", "VEIL", "VEIN",
  "VENT", "VERB", "VERY", "VEST", "VIEW", "VILE", "VINE", "VISA", "VOID",
  "VOLT", "VOTE",
  "WADE", "WAGE", "WAIL", "WAIT", "WAKE", "WALK", "WALL", "WAND", "WANT",
  "WARD", "WARM", "WARN", "WARP", "WART", "WARY", "WASH", "WAVE", "WAVY",
  "WAXY", "WEAK", "WEAR", "WEED", "WEEK", "WELL", "WENT", "WERE", "WEST",
  "WHAT", "WHEN", "WHIM", "WHIP", "WHOM", "WICK", "WIDE", "WIFE", "WILD",
  "WILL", "WILT", "WILY", "WIMP", "WIND", "WINE", "WING", "WINK", "WIPE",
  "WIRE", "WISE", "WISH", "WISP", "WITH", "WOKE", "WOLF", "WOOD", "WOOL",
  "WORD", "WORE", "WORK", "WORM", "WORN", "WOVE", "WRAP",
  "YANK", "YARD", "YARN", "YAWN", "YEAR", "YELL", "YOUR",
  "ZEAL", "ZERO", "ZEST", "ZINC", "ZONE", "ZOOM",
];

const WORDS_5 = [
  "ABOUT", "ABOVE", "ABUSE", "ACTED", "ACUTE", "ADAPT", "ADDED", "ADMIT",
  "ADOPT", "ADULT", "AFTER", "AGAIN", "AGREE", "AHEAD", "AIMED", "ALARM",
  "ALBUM", "ALIEN", "ALIGN", "ALIKE", "ALIVE", "ALLEY", "ALLOT", "ALLOW",
  "ALONE", "ALONG", "ALTER", "AMAZE", "AMPLE", "ANGEL", "ANGER", "ANGLE",
  "ANGRY", "ANKLE", "ANNEX", "APART", "APPLE", "APPLY", "ARENA", "ARGUE",
  "ARISE", "ARMOR", "ARRAY", "ARROW", "ASIDE", "ASSET", "ATLAS", "ATTIC",
  "AUDIO", "AUDIT", "AVOID", "AWAKE", "AWARD", "AWARE",
  "BADGE", "BAKER", "BASIC", "BASIN", "BASIS", "BATCH", "BEACH", "BEARD",
  "BEAST", "BEGIN", "BEING", "BENCH", "BERRY", "BIBLE", "BIKES", "BIRTH",
  "BLACK", "BLADE", "BLAME", "BLAND", "BLANK", "BLAST", "BLAZE", "BLEAK",
  "BLEED", "BLEND", "BLESS", "BLIND", "BLINK", "BLISS", "BLOCK", "BLOND",
  "BLOOD", "BLOOM", "BLOWN", "BLUES", "BLUFF", "BLUNT", "BLURT", "BOARD",
  "BOAST", "BONUS", "BOOTH", "BOUND", "BRACE", "BRAIN", "BRAND", "BRASS",
  "BRAVE", "BREAD", "BREAK", "BREED", "BRICK", "BRIDE", "BRIEF", "BRING",
  "BRINK", "BRISK", "BROAD", "BROKE", "BROOK", "BROOM", "BROTH", "BROWN",
  "BRUSH", "BUILD", "BUILT", "BURST", "BUYER",
  "CABIN", "CABLE", "CANAL", "CANDY", "CARGO", "CARRY", "CARVE", "CATCH",
  "CAUSE", "CEDAR", "CHAIN", "CHAIR", "CHALK", "CHAMP", "CHAOS", "CHARM",
  "CHART", "CHASE", "CHEAP", "CHEAT", "CHECK", "CHEEK", "CHEER", "CHESS",
  "CHEST", "CHIEF", "CHILD", "CHILL", "CHINA", "CHIPS", "CHOIR", "CHORD",
  "CHOSE", "CHUNK", "CIVIL", "CLAIM", "CLAMP", "CLASH", "CLASP", "CLASS",
  "CLEAN", "CLEAR", "CLERK", "CLICK", "CLIFF", "CLIMB", "CLING", "CLOCK",
  "CLONE", "CLOSE", "CLOTH", "CLOUD", "CLOWN", "COACH", "COAST", "COLOR",
  "COMET", "CORAL", "COULD", "COUNT", "COUPE", "COURT", "COVER", "CRACK",
  "CRAFT", "CRANE", "CRASH", "CRATE", "CRAWL", "CRAZY", "CREAM", "CREEK",
  "CREST", "CRIED", "CRIME", "CRISP", "CROSS", "CROWD", "CROWN", "CRUDE",
  "CRUSH", "CURVE", "CYCLE",
  "DAILY", "DANCE", "DATED", "DEALT", "DEATH", "DECAY", "DECOY", "DECOR",
  "DELAY", "DELTA", "DEMON", "DENSE", "DEPOT", "DEPTH", "DERBY", "DEVIL",
  "DIARY", "DIRTY", "DOING", "DOUBT", "DOUGH", "DRAFT", "DRAIN", "DRAKE",
  "DRAMA", "DRANK", "DRAPE", "DRAWN", "DREAM", "DRESS", "DRIED", "DRIFT",
  "DRILL", "DRINK", "DRIVE", "DROIT", "DRONE", "DROWN", "DRUMS", "DRUNK",
  "DRYER", "DRYLY", "DYING",
  "EAGER", "EAGLE", "EARLY", "EARTH", "EIGHT", "ELBOW", "ELDER", "ELECT",
  "ELITE", "EMBED", "EMBER", "EMPTY", "ENDED", "ENEMY", "ENJOY", "ENTER",
  "ENTRY", "EQUAL", "EQUIP", "ERASE", "ERROR", "EVENT", "EVERY", "EXACT",
  "EXILE", "EXIST", "EXTRA",
  "FABLE", "FACET", "FAITH", "FALSE", "FANCY", "FATAL", "FAULT", "FEAST",
  "FENCE", "FERRY", "FETCH", "FEVER", "FEWER", "FIBER", "FIELD", "FIERY",
  "FIFTY", "FIGHT", "FINAL", "FIRST", "FIXED", "FLAME", "FLANK", "FLARE",
  "FLASH", "FLASK", "FLESH", "FLICK", "FLIER", "FLING", "FLINT", "FLOAT",
  "FLOCK", "FLOOD", "FLOOR", "FLORA", "FLOUR", "FLUID", "FLUSH", "FLUTE",
  "FOCAL", "FOCUS", "FORCE", "FORGE", "FORTH", "FORUM", "FOUND", "FRAME",
  "FRANK", "FRAUD", "FRESH", "FRONT", "FROST", "FROZE", "FRUIT", "FULLY",
  "FUNDS",
  "GIANT", "GIVEN", "GLAND", "GLARE", "GLASS", "GLEAM", "GLIDE", "GLOBE",
  "GLOOM", "GLORY", "GLOSS", "GLOVE", "GOING", "GRACE", "GRADE", "GRAIN",
  "GRAND", "GRANT", "GRAPE", "GRAPH", "GRASP", "GRASS", "GRATE", "GRAVE",
  "GRAZE", "GREAT", "GREED", "GREEN", "GREET", "GRIEF", "GRILL", "GRIND",
  "GROAN", "GROOM", "GROSS", "GROUP", "GROVE", "GROWL", "GROWN", "GUARD",
  "GUESS", "GUEST", "GUIDE", "GUILD", "GUILT", "GUISE",
  "HABIT", "HANDS", "HAPPY", "HARSH", "HASTE", "HAUNT", "HEARD", "HEART",
  "HEAVY", "HEDGE", "HELLO", "HENCE", "HERBS", "HIRED", "HOBBY", "HOMER",
  "HONOR", "HORSE", "HOTEL", "HOUSE", "HUMAN", "HUMOR", "HURRY", "HYDRO",
  "IDEAL", "IMAGE", "IMPLY", "INDEX", "INDIE", "INFER", "INNER", "INPUT",
  "IRONY", "IVORY", "ISSUE",
  "JEWEL", "JOINT", "JOKER", "JUDGE", "JUICE", "JUICY",
  "KARMA", "KNACK", "KNEEL", "KNIFE", "KNOCK", "KNOTS",
  "LABEL", "LABOR", "LANCE", "LARGE", "LASER", "LATCH", "LATER", "LAUGH",
  "LAYER", "LEARN", "LEASE", "LEAST", "LEAVE", "LEGAL", "LEMON", "LEVEL",
  "LEVER", "LIGHT", "LIMIT", "LINEN", "LINER", "LINKS", "LIVER", "LOCAL",
  "LODGE", "LOGIC", "LOOSE", "LORRY", "LOVER", "LOWER", "LOYAL", "LUCKY",
  "LUNAR", "LUNCH", "LYRIC",
  "MAGIC", "MAJOR", "MAKER", "MANOR", "MAPLE", "MARCH", "MARRY", "MARSH",
  "MATCH", "MAYOR", "MEDIA", "MERCY", "MERGE", "MERIT", "METAL", "METER",
  "MIDST", "MIGHT", "MINOR", "MINUS", "MISTY", "MODEL", "MOIST", "MONEY",
  "MONTH", "MORAL", "MORPH", "MOTOR", "MOUND", "MOUNT", "MOURN", "MOUSE",
  "MOUTH", "MOVED", "MOVIE", "MUDDY", "MULTI", "MURAL", "MUSIC",
  "NAVAL", "NERVE", "NEVER", "NEWLY", "NIGHT", "NOBLE", "NOISE", "NORTH",
  "NOTED", "NOVEL", "NURSE",
  "OASIS", "OCCUR", "OCEAN", "OFFER", "OFTEN", "OLIVE", "ONSET", "OPERA",
  "ORBIT", "ORDER", "OTHER", "OUTER", "OXIDE", "OZONE",
  "PAINT", "PANEL", "PANIC", "PAPER", "PARTY", "PASTE", "PATCH", "PAUSE",
  "PEACE", "PEACH", "PEARL", "PEDAL", "PENNY", "PHASE", "PHONE", "PHOTO",
  "PIANO", "PIECE", "PILOT", "PINCH", "PITCH", "PIXEL", "PLACE", "PLAID",
  "PLAIN", "PLANE", "PLANT", "PLATE", "PLEAD", "PLEAT", "PLUCK", "PLUMB",
  "PLUME", "PLUMP", "POINT", "POLAR", "POSED", "POUND", "POWER",
  "PRESS", "PRICE", "PRIDE", "PRIME", "PRINT", "PRIOR", "PRIZE", "PROBE",
  "PRONE", "PROOF", "PROSE", "PROUD", "PROVE", "PROXY", "PRUNE", "PSALM",
  "PULSE", "PUNCH", "PUPIL", "PURSE",
  "QUEEN", "QUEST", "QUEUE", "QUICK", "QUIET", "QUILT", "QUIRK", "QUOTA",
  "QUOTE",
  "RADAR", "RADIO", "RAINY", "RAISE", "RALLY", "RANCH", "RANGE", "RAPID",
  "RATIO", "REACH", "REACT", "REALM", "REBEL", "REIGN", "RELAX", "REMIT",
  "RENEW", "REPAY", "RIDER", "RIDGE", "RIFLE", "RIGHT", "RIGID", "RISKY",
  "RIVAL", "RIVER", "ROAST", "ROBIN", "ROCKY", "ROGER", "ROUGE", "ROUGH",
  "ROUND", "ROUTE", "ROYAL", "RUGBY", "RULER", "RURAL",
  "SAINT", "SALAD", "SALON", "SANDY", "SAUCE", "SAUNA", "SCALE", "SCARE",
  "SCENE", "SCENT", "SCOPE", "SCORE", "SCOUT", "SCRAP", "SENSE", "SERVE",
  "SEVEN", "SHADE", "SHAKE", "SHALL", "SHAME", "SHAPE", "SHARE", "SHARK",
  "SHARP", "SHAVE", "SHAWL", "SHEAR", "SHEEN", "SHEEP", "SHEER", "SHEET",
  "SHELF", "SHELL", "SHIFT", "SHINE", "SHIRT", "SHOCK", "SHOOT", "SHORE",
  "SHORT", "SHOUT", "SHOVE", "SHRUB", "SIEGE", "SIGHT", "SIGMA", "SILLY",
  "SINCE", "SIXTH", "SIXTY", "SKATE", "SKILL", "SKULL", "SLATE", "SLAVE",
  "SLEEP", "SLICE", "SLIDE", "SLOPE", "SMALL", "SMART", "SMELL", "SMILE",
  "SMOKE", "SNACK", "SNAKE", "SOLAR", "SOLID", "SOLVE", "SONIC", "SORRY",
  "SOUND", "SOUTH", "SPACE", "SPARE", "SPARK", "SPEAK", "SPEAR", "SPEED",
  "SPELL", "SPEND", "SPENT", "SPICE", "SPILL", "SPINE", "SPLIT", "SPOKE",
  "SPOON", "SPORT", "SPRAY", "STACK", "STAFF", "STAGE", "STAIN", "STAIR",
  "STAKE", "STALE", "STALL", "STAMP", "STAND", "STARE", "START", "STATE",
  "STAYS", "STEAK", "STEAL", "STEAM", "STEEL", "STEEP", "STEER", "STERN",
  "STICK", "STIFF", "STILL", "STOCK", "STOKE", "STOLE", "STONE", "STOOD",
  "STOOL", "STORE", "STORM", "STORY", "STOUT", "STOVE", "STRAP", "STRAW",
  "STRAY", "STRIP", "STRUM", "STUCK", "STUDY", "STUFF", "STUMP", "STUNG",
  "STUNT", "STYLE", "SUGAR", "SUITE", "SUPER", "SURGE", "SWAMP", "SWARM",
  "SWEAR", "SWEAT", "SWEEP", "SWEET", "SWEPT", "SWIFT", "SWING", "SWORD",
  "SWORE", "SWORN",
  "TABLE", "TAKEN", "TASTE", "TEACH", "TEASE", "TEETH", "TEMPO", "TENSE",
  "TERMS", "THEFT", "THEME", "THERE", "THICK", "THIEF", "THING", "THINK",
  "THIRD", "THORN", "THOSE", "THREE", "THREW", "THROW", "THUMB", "TIDAL",
  "TIGER", "TIGHT", "TIMER", "TIRED", "TITLE", "TODAY", "TOKEN", "TOPIC",
  "TOTAL", "TOUCH", "TOUGH", "TOWEL", "TOWER", "TOXIC", "TRACE", "TRACK",
  "TRADE", "TRAIL", "TRAIN", "TRAIT", "TRASH", "TREAT", "TREND", "TRIAL",
  "TRIBE", "TRICK", "TRIED", "TROOP", "TRUCK", "TRULY", "TRUMP", "TRUNK",
  "TRUST", "TRUTH", "TUMOR", "TUNED", "TWICE", "TWIST",
  "ULTRA", "UNCLE", "UNDER", "UNION", "UNITE", "UNITY", "UNTIL", "UPPER",
  "UPSET", "URBAN", "USAGE", "USUAL", "UTTER",
  "VAGUE", "VALID", "VALUE", "VALVE", "VAULT", "VERSE", "VIDEO", "VIGOR",
  "VIOLA", "VIRUS", "VISIT", "VISTA", "VITAL", "VIVID", "VOCAL", "VOICE",
  "VOTER",
  "WAGON", "WASTE", "WATCH", "WATER", "WEARY", "WEAVE", "WEDGE", "WEIGH",
  "WEIRD", "WHALE", "WHEAT", "WHEEL", "WHERE", "WHICH", "WHILE", "WHIRL",
  "WHITE", "WHOLE", "WHOSE", "WIDEN", "WIDTH", "WITCH", "WOMAN", "WORLD",
  "WORRY", "WORSE", "WORST", "WORTH", "WOULD", "WOUND", "WRATH", "WRITE",
  "WRONG", "WROTE",
  "YACHT", "YIELD", "YOUNG", "YOUTH",
  "ZEBRA",
];

function runTest() {
  console.log("=== Crossword Solver Test ===\n");

  const wordsByLength = new Map<number, string[]>([
    [3, WORDS_3],
    [4, WORDS_4],
    [5, WORDS_5],
  ]);

  console.log(`Word bank: ${WORDS_3.length} 3-letter, ${WORDS_4.length} 4-letter, ${WORDS_5.length} 5-letter\n`);

  let passed = 0;
  let failed = 0;

  for (const tpl of TEMPLATES_5x5) {
    const startTime = performance.now();
    const result = solve(tpl.template, wordsByLength, { timeoutMs: 5000 });
    const elapsed = (performance.now() - startTime).toFixed(1);

    if (result) {
      // Verify grid: all crossings match
      const slots = extractSlots(tpl.template);
      const intersections = findIntersections(slots);
      let valid = true;

      for (const ix of intersections) {
        const slotA = slots.find((s) => s.id === ix.slotA)!;
        const slotB = slots.find((s) => s.id === ix.slotB)!;
        const wordA = result.assignments.get(ix.slotA)!;
        const wordB = result.assignments.get(ix.slotB)!;

        if (wordA[ix.posA] !== wordB[ix.posB]) {
          console.log(`  CROSSING MISMATCH: ${slotA.direction} #${slotA.number} pos ${ix.posA} (${wordA[ix.posA]}) != ${slotB.direction} #${slotB.number} pos ${ix.posB} (${wordB[ix.posB]})`);
          valid = false;
        }
      }

      // Check no duplicate words
      const words = [...result.assignments.values()];
      const unique = new Set(words);
      if (unique.size !== words.length) {
        console.log("  DUPLICATE WORDS FOUND");
        valid = false;
      }

      if (valid) {
        console.log(`PASS  ${tpl.id.padEnd(12)} ${elapsed}ms  score=${result.score}  words=${words.length}`);
        // Print grid
        for (const row of result.grid) {
          console.log("      " + row.map((c) => (c === "#" ? "." : c)).join(" "));
        }
        console.log();
        passed++;
      } else {
        console.log(`FAIL  ${tpl.id} — grid validation failed`);
        failed++;
      }
    } else {
      console.log(`FAIL  ${tpl.id} — solver returned null (${elapsed}ms)`);
      failed++;
    }
  }

  console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
  process.exit(failed > 0 ? 1 : 0);
}

runTest();
