import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// ============================================================================
// 1. ARCHAEOLOGICAL CONSTANTS, 6 SECTIONS & 12 CURATED CRA ROOM DISCOVERIES
// ============================================================================
const CHACO_LAT_DEG = 36.0605;
const CHACO_LAT_RAD = THREE.MathUtils.degToRad(CHACO_LAT_DEG);

const SEASON_DECLINATIONS = {
  summer: 23.44,
  equinox: 0.0,
  winter: -23.44,
  lunar: -28.6,
  night: -12.0,
};

const PHASE_MAP = {
  stage1: ['Stage_I_Old_Bonito_AD850_935'],
  stage2: ['Stage_I_Old_Bonito_AD850_935', 'Stage_II_North_4Story_Spine_AD1040_1060'],
  stage3: [
    'Stage_I_Old_Bonito_AD850_935',
    'Stage_II_North_4Story_Spine_AD1040_1060',
    'Stage_III_Wings_And_Kivas_AD1060_1085',
  ],
  stage4: [
    'Stage_I_Old_Bonito_AD850_935',
    'Stage_II_North_4Story_Spine_AD1040_1060',
    'Stage_III_Wings_And_Kivas_AD1060_1085',
    'Stage_IV_South_Arc_And_Plaza_AD1085_1115',
  ],
};

const SITE_LABELS = {
  pueblo_bonito: 'Pueblo Bonito',
  chetro_ketl: 'Chetro Ketl',
  pueblo_del_arroyo: 'Pueblo del Arroyo',
  casa_rinconada: 'Casa Rinconada',
  fajada_butte: 'Fajada Butte',
};

// 6 Curated Architectural Sections for the Guided Walkthrough
const WALKTHROUGH_SECTIONS = [
  {
    id: 'overview',
    num: 'I',
    shortTitle: 'Wide Overview',
    fullTitle: 'SECTION I • 3D ARCHITECTURAL RECONSTRUCTION (0.5m LIDAR & ARCHAEOLOGICAL SURVEY)',
    heroTitle: 'Pueblo Bonito Great House & Chacra Mesa Escarpment',
    heroDesc:
      'Spanning <strong>~175 m (162–175 m) × 98 m</strong> with <strong>433 georeferenced polygons</strong> (403 active ground/recessed features + 30 buried sub-court features; ~800 total multi-story rooms rising up to a reconstructed 4 stories / ~9.8–14.0 m) and <strong>35+ ceremonial kivas</strong> flanking open East and West Courts, this 3D interpretive reconstruction extrudes the 0.5m airborne LiDAR (OpenTopography OT.042019.6342.1), HABS No. NM-30 (LOC Item nm0107), and NPS measured surveys.',
    camPos: [-24.0, 62.0, 106.0],
    target: [0.0, 3.5, -8.0],
    season: 'equinox',
    hour: 16.85,
    phase: 'all',
    roomIds: [],
  },
  {
    id: 'old_bonito',
    num: 'II',
    shortTitle: 'Old Bonito Core',
    fullTitle: 'SECTION II • OLD BONITO NUCLEUS (STAGE I: AD 850–935+)',
    heroTitle: 'The 9th-Century Crescent, Mortuary Crypt & Ritual Repositories',
    heroDesc:
      'Built of Type I tabular sandstone slabs (c. AD 850–935), the northwestern Old Bonito arc contains Room 33 (14 burials dated AD 800–1130, 9/9 sequenced sharing mtDNA haplotype B2y1, >56,000 turquoise items; Kennett et al. 2017), Room 28 (~174 whole ceramic vessels including ~111–112 Chacoan cylinder jars—roughly 99 concentrated on a raised storage shelf—plus bowls and pitchers burned during an AD ~1100 termination event; absorbed Theobroma cacao theobromine residue; Pepper 1920; Crown & Hurst 2009), Room 32 (375+ ceremonial staffs), and Room 38 (14 scarlet macaw skeletons—12 associated with and embedded in a thick deposit of bird guano and 2 in subfloor hollows—plus a turquoise-inlaid black jet frog; macaw use ca. AD 900–1040, closely related haplotypes within the Haplo6 clade; Watson et al. 2015; George et al. 2018).',
    camPos: [-16.0, 22.0, -2.0],
    target: [-28.0, 4.0, -33.0],
    season: 'equinox',
    hour: 16.85,
    phase: 'all',
    roomIds: ['pueblo_bonito_380', 'pueblo_bonito_240', 'pueblo_bonito_377', 'pueblo_bonito_8', 'pueblo_bonito_352'],
  },
  {
    id: 'kivas',
    num: 'III',
    shortTitle: 'Great Kivas & Plaza',
    fullTitle: 'SECTION III • GREAT KIVA A & OPEN DUAL COURTS (APPROX. AD 1075–1115)',
    heroTitle: 'Recessed Sanctuaries, Subfloor Vaults & Cardinal Plaza',
    heroDesc:
      'Divided by a North–South wall into open East and West Courts, Pueblo Bonito’s plazas include Great Kiva A (built approx. AD 1075–1115)—entered by a formal northern stairway and surrounded by a concentric masonry bench and 34 wall niches (found open and empty when excavated), with a reconstructed timber roof (~9 ft 7 in ceiling height) supported by four large square rubble-filled masonry columns, a raised central firebox, and paired subfloor masonry vaults. Turquoise and shell dedicatory deposits are documented from ceremonial and architectural contexts at Pueblo Bonito.',
    camPos: [-8.3, 18.5, 40.0],
    target: [-8.3, 1.2, 21.4],
    season: 'equinox',
    hour: 16.6,
    phase: 'all',
    roomIds: ['pueblo_bonito_159'],
  },
  {
    id: 'east_wing',
    num: 'IV',
    shortTitle: 'East Wing & Solstice',
    fullTitle: 'SECTION IV • CLASSIC EAST WING, CRAFT SECTOR & SOLAR OBSERVATORIES (AD 1050–1110)',
    heroTitle: 'Room 249 Macaw Aviary, Room 168 Lapidary & Craft Area & Solstice Windows',
    heroDesc:
      'Built in core-and-veneer sandstone masonry, the East and Southeast Wings include Room 249 (3 Scarlet Macaw skeletons, perches, adobe bowls & guano floor; Judd 1954), nearby Section No. 1 rooms (Rooms 174–177, 225–226) documented in HABS No. NM-30 (LOC Item nm0107, Sheet 5 T-door on Room 226 & corner doorway in Room 225), Room 168 (part of the southeastern lapidary and craft activity area alongside Rooms 170 and 173), and Rooms 225 & 228 (~120° ESE Winter Solstice sunrise corner windows; Reyman 1976).',
    camPos: [28.0, 17.5, 25.0],
    target: [50.99, 1.85, 10.36],
    season: 'equinox',
    hour: 16.8,
    phase: 'all',
    roomIds: ['pueblo_bonito_257', 'pueblo_bonito_231', 'pueblo_bonito_9'],
  },
  {
    id: 'west_spine',
    num: 'V',
    shortTitle: 'Western Burials & Rockfall',
    fullTitle: 'SECTION V • WESTERN BURIAL CLUSTER & 1941 THREATENING ROCK COLLAPSE',
    heroTitle: 'Room 326 Western Burial Cluster Chamber & 1941 Threatening Rock Talus',
    heroDesc:
      'In one of Pueblo Bonito’s earliest western architectural blocks (approx. AD 860–935 construction, modified during later occupation), Room 326 formed part of the Western Burial Cluster (Rooms 320, 326, 329, 330); later osteological reassessment identified 12 individuals (11 adults—10 females, 1 male—and 1 infant; older inventories reported 11). Along the northeastern cliff, the ~30,000-ton Threatening Rock monolith collapsed on January 22, 1941.',
    camPos: [-30.0, 22.0, 18.0],
    target: [-58.9, 3.5, 0.5],
    season: 'summer',
    hour: 17.1,
    phase: 'all',
    roomIds: ['pueblo_bonito_406', 'landmark_threatening_rock'],
  },
  {
    id: 'greater_chaco',
    num: 'VI',
    shortTitle: 'West Court & Kiva Q',
    fullTitle: 'SECTION VI • WEST COURT PLAZA, GREAT KIVA Q & 4-STORY SPINE',
    heroTitle: 'Great Kiva Q, The Open West Court & Reconstructed Four-Story Northern Spine',
    heroDesc:
      'West of the North–South dividing wall, the open West Court plaza centers on Great Kiva Q (Classic Bonito Phase, probably mid-11th century and predating Great Kiva A), equipped with four large wooden roof-support posts seated in circular masonry settings (visually and structurally distinct from the four square masonry columns of Great Kiva A), paired rectangular subfloor vaults, and a reconstructed southern entry stairway/antechamber, rising northward to the reconstructed 4-story Northern Spine (Room 14/85).',
    camPos: [-23.15, 18.0, 8.0],
    target: [-23.15, -1.5, -11.68],
    season: 'equinox',
    hour: 16.7,
    phase: 'all',
    roomIds: ['pueblo_bonito_170', 'pueblo_bonito_22'],
  },
];

// 12 Fact-Checked Archaeological Room Discoveries with Unobstructed Interior Overlook Vantages & Concise Factual Key Points
// Note: Room dimensions are omitted from both hover and side UI; only fact-checked Era Eyebrow + Title sections are shown on hover.
const CRA_DISCOVERIES = [
  {
    id: 'pueblo_bonito_380',
    index: 1,
    sectionId: 'old_bonito',
    chipLabel: '01 • Rm 33 Crypt',
    shortPin: 'Rm 33 • Elite Crypt',
    beaconLabel: 'Room 33: Matrilineal Crypt (14 Burials • 9/9 B2y1 mtDNA)',
    beaconPos: [-32.77, 7.6, -32.43],
    walkPos: [-32.45, 11.6, -28.6],
    walkTarget: [-32.77, 4.35, -32.43],
    camPos: [-32.45, 11.6, -28.6],
    target: [-32.77, 4.35, -32.43],
    closeCamPos: [-32.68, 7.85, -31.05],
    closeTarget: [-32.77, 4.32, -32.50],
    tinyEra: 'STAGE I OLD BONITO CORE • AD 850–935 (BURIALS AD 800–1130)',
    tinyTitle: 'ROOM 33 — MATRILINEAL MORTUARY CRYPT',
    tinyDesc:
      'Ground-story chamber beneath reconstructed Upper Room 58. Held 14 burials (AD 800–1130), >56,000 turquoise items, and 9/9 sequenced individuals sharing identical mtDNA haplotype B2y1.',
    keyPoints: [
      'Architecture & Reconstruction: Ground-story Type I tabular sandstone chamber beneath Upper Room 58. The upper story, ceiling vigas, and hand-hewn pine plank floor divide shown in the 3D model are interpretive reconstructions based on Pepper’s 1896 excavation records (Pepper 1909, 1920).',
      'Stratigraphy & Offerings (Pepper 1909, 1920): Below the pine plank floor lay Burial 14 (AD 800–850; >11,200 turquoise & >3,300 shell ornaments, abalone, conch trumpet) and Burial 13 (>5,800 turquoise pieces); above the floor lay 12 burials (>56,000 total turquoise items, wooden flutes, mosaic basket).',
      'Archaeogenomics (Kennett et al. 2017, Nat. Commun. 8:14115): Complete mtDNA genomes from 9 individuals were 100% identical (haplotype B2y1); nuclear SNPs from 6 individuals confirmed mother–daughter and grandmother–grandson kin across ~330 years (AD 800–1130).',
    ],
    artType: 'crypt_33',
    artCaption: 'Pepper (1909, 1920 AMNH) & Kennett et al. (2017): Room 33 (14 Burials, >56,000 Turquoise Items, 9/9 B2y1 mtDNA)',
    photo: './renders/archival/pd_room33_flutes.jpg',
    photoCap: 'Public Domain (Pepper 1920, AMNH Vol. 27): Carved Wooden Flutes Excavated from Room 33',
    structures3D: [
      'Reconstructed hand-hewn Ponderosa pine plank floor divide (Pepper 1909)',
      'Reconstructed 4 corner vertical pine roof-support posts & ceiling vigas (Pepper 1909)',
      'Narrow south interior doorway connecting to Room 32 (reconstructed frame)',
    ],
    archivalMedia: [
      {
        tab: 'Room 33 Flutes (1920)',
        src: './renders/archival/pd_room33_flutes.jpg',
        badge: 'PUBLIC DOMAIN (PEPPER 1920)',
        caption: 'Carved wooden flutes • Room 33 (Pepper 1920, AMNH Vol. 27)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan of Pueblo Bonito (Lekson 1984)',
      },
      {
        tab: 'HABS NM-30 Key Plan',
        src: './renders/archival/pd_habs_sheet0_master_key.jpg',
        badge: 'HABS NM-30 (LOC nm0107)',
        caption: 'HABS No. NM-30 Title Sheet: Master Key Plan (LOC Item nm0107, 1940)',
      },
      {
        tab: '0.5m LiDAR Breakdown',
        src: './renders/lidar_data_and_foliage_breakdown.jpg',
        badge: '0.5m AIRBORNE LIDAR',
        caption: '0.5m OpenTopography LiDAR DEM & DSM (OT.042019.6342.1)',
      },
    ],
  },
  {
    id: 'pueblo_bonito_240',
    index: 2,
    sectionId: 'old_bonito',
    chipLabel: '02 • Rm 28 Cacao',
    shortPin: 'Rm 28 • Cacao Jars',
    beaconLabel: 'Room 28: ~174 Ceramic Vessels (~111–112 Cylinder Jars) & Cacao Residue',
    beaconPos: [-24.41, 7.6, -30.66],
    walkPos: [-24.41, 12.6, -26.2],
    walkTarget: [-24.41, 4.05, -30.66],
    camPos: [-24.41, 12.6, -26.2],
    target: [-24.41, 4.05, -30.66],
    closeCamPos: [-24.15, 8.25, -28.55],
    closeTarget: [-24.41, 4.05, -30.80],
    tinyEra: 'OLD BONITO CONSTRUCTION • LATE 11TH–EARLY 12TH CENTURY CACHE DEPOSIT',
    tinyTitle: 'ROOM 28 — CYLINDER JAR CACHE & CACAO RESIDUE',
    tinyDesc:
      'Originally part of the early Old Bonito northern arc and later remodeled and subdivided. Excavations recovered ~174 whole ceramic vessels, including ~111–112 Chacoan cylinder jars (roughly 99 concentrated on a raised storage shelf) alongside bowls and pitchers; chemical residue analysis detected Theobroma cacao theobromine.',
    keyPoints: [
      'Architecture: Originally part of the early Old Bonito northern arc and later remodeled and subdivided, with an added upper story. The 3D highlight treats the remodeled Room 28 complex consistently across both compartments.',
      'Ceramic Cache: Excavations recovered approximately 174 whole ceramic vessels from Room 28, including ~111–112 Chacoan cylinder jars (with roughly 99 concentrated together on a raised storage shelf/area), alongside ceramic bowls and pitchers, all heavily burned during a termination event around AD 1100.',
      'Cacao Evidence: Chemical residue analysis tested five cylinder jar sherds from Pueblo Bonito and detected theobromine—the biomarker for Theobroma cacao—in three of them, demonstrating preparation or consumption of cacao beverages reached via Mesoamerican exchange.',
    ],
    artType: 'cacao_28',
    artCaption: 'Pepper (1920) & Crown & Hurst (2009 PNAS): ~174 Ceramic Vessels (~111–112 Cylinder Jars, ~99 on Storage Shelf) & Absorbed Theobromine Residue',
    photo: './renders/archival/pd_usgs_1877_room_interior.jpg',
    photoCap: '1877 U.S. Geological Survey (W.H. Jackson): Intact Chacoan Room Interior & Vigas',
    structures3D: [
      'Later subdivision partition wall within the longer original Old Bonito room (interpretive reconstruction)',
      'Enfilade interior doorway with tabular sandstone lintel (reconstructed)',
      'Reconstructed raised storage shelf & charred 2nd-story floor vigas',
    ],
    archivalMedia: [
      {
        tab: '1877 USGS Room Plate',
        src: './renders/archival/pd_usgs_1877_room_interior.jpg',
        badge: 'PD-USGOV-USGS (1877)',
        caption: '1877 USGS room interior & vigas (W.H. Jackson, 10th Annual Report)',
      },
      {
        tab: 'NPS Banded Masonry',
        src: './renders/archival/pd_nps_banded_masonry_doorway.jpg',
        badge: 'PD-USGOV-NPS (1929)',
        caption: 'Northern arc core-and-veneer masonry & viga sockets (NPS, 1929)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan showing Old Bonito northern arc (Lekson 1984)',
      },
      {
        tab: 'LiDAR DSM Scan',
        src: './renders/hud_stage2_lidar_dsm_full.jpg',
        badge: '0.5m LIDAR DSM',
        caption: '0.5m airborne LiDAR Digital Surface Model (OTSDEM.042019.6342.1)',
      },
    ],
  },
  {
    id: 'pueblo_bonito_8',
    index: 3,
    sectionId: 'old_bonito',
    chipLabel: '03 • Rm 32 Staffs',
    shortPin: 'Rm 32 • 375+ Staffs',
    beaconLabel: 'Room 32: Antechamber • 375+ Wooden Staffs & Mosaic Basket',
    beaconPos: [-30.77, 7.6, -33.03],
    walkPos: [-30.65, 11.6, -29.2],
    walkTarget: [-30.77, 4.45, -33.03],
    camPos: [-30.65, 11.6, -29.2],
    target: [-30.77, 4.45, -33.03],
    closeCamPos: [-30.72, 7.95, -31.45],
    closeTarget: [-30.77, 4.42, -33.10],
    tinyEra: 'STAGE I OLD BONITO CORE • TREE-RING DATED AD 862–919',
    tinyTitle: 'ROOM 32 — CEREMONIAL STAFFS ANTECHAMBER',
    tinyDesc:
      'Antechamber immediately south of Room 33 providing the sole interior doorway into the Room 33 crypt; yielded 375+ carved wooden staffs (pahos), 81 reed arrows, and a turquoise-mosaic cylinder basket.',
    keyPoints: [
      'Access & Context: Positioned immediately south of Room 33, providing the sole interior doorway into the Room 33 mortuary crypt.',
      'Dendrochronology & Architecture: Built of Type I uncoursed tabular sandstone slabs with a stepped interior masonry ledge; ceiling poles yielded tree-ring dates of AD 862–919 (Windes & Ford 1996). Upper story and roof viga arrangement are interpretive reconstructions.',
      'Excavated Assemblage (Pepper 1896 / 1920, pp. 127–162): Contained 375+ carved wooden ceremonial staffs (pahos) stacked in the NW corner, a quiver of 81 reed arrows, turquoise-and-Spondylus mosaic baskets, and 25+ Red Mesa Black-on-white vessels.',
    ],
    artType: 'staffs_32',
    artCaption: 'Pepper (1920 AMNH Vol. 27): Room 32 — 375+ Wooden Staffs, 81 Reed Arrows & Mosaic Basket',
    photo: './renders/archival/pd_nps_sandstone_walls.jpg',
    photoCap: 'NPS Public Domain: Pine Lintel Doorways & Coursed Sandstone Masonry',
    structures3D: [
      'North interior doorway sill & lintel leading into Room 33 Crypt (reconstructed)',
      'Stepped Type I masonry wall bench/ledge (interpretive reconstruction after Pepper 1920, HEE Photo 120)',
      'Reconstructed Ponderosa pine ceiling poles (tree-ring dated AD 862–919; Windes & Ford 1996)',
    ],
    archivalMedia: [
      {
        tab: 'NPS Doorway & Lintel',
        src: './renders/archival/pd_nps_sandstone_walls.jpg',
        badge: 'PD-USGOV-NPS',
        caption: 'Pine doorway lintels & sandstone masonry (NPS)',
      },
      {
        tab: '1877 USGS Room Plate',
        src: './renders/archival/pd_usgs_1877_room_interior.jpg',
        badge: 'PD-USGOV-USGS (1877)',
        caption: '1877 USGS intact Old Bonito room interior & ceiling timbers (W.H. Jackson)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan (Lekson 1984)',
      },
      {
        tab: 'LiDAR Stage I–II Scan',
        src: './renders/hud_stage4_phase1_2_masonry.jpg',
        badge: '0.5m LIDAR + 3D STAGE I–II',
        caption: 'Stage I–II masonry on 0.5m LiDAR DEM',
      },
    ],
  },
  {
    id: 'pueblo_bonito_352',
    index: 4,
    sectionId: 'old_bonito',
    chipLabel: '04 • Rm 38 Macaws',
    shortPin: 'Rm 38 • 14 Macaws',
    beaconLabel: 'Room 38: Macaw-Keeping Room & Ritual Deposit (14 Scarlet Macaws • Haplo6 Clade)',
    beaconPos: [-12.33, 7.6, -39.94],
    walkPos: [-12.33, 12.8, -32.8],
    walkTarget: [-12.33, 3.60, -39.94],
    camPos: [-12.33, 12.8, -32.8],
    target: [-12.33, 3.60, -39.94],
    closeCamPos: [-12.33, 7.85, -36.85],
    closeTarget: [-12.33, 3.55, -40.10],
    tinyEra: 'OLD BONITO CORE • MACAW USE CA. AD 900–1040',
    tinyTitle: 'ROOM 38 — MACAW-KEEPING ROOM & RITUAL DEPOSIT',
    tinyDesc:
      'Early Old Bonito room where excavations recovered 14 scarlet macaw skeletons—12 associated with and embedded in a thick deposit of bird guano and 2 in subfloor hollows—plus a turquoise-inlaid black jet frog (macaw acquisition mostly AD 900–1040; closely related haplotypes within the Haplo6 clade).',
    keyPoints: [
      'Architecture: Early Old Bonito room within the northern roomblock. Reconstructed vents, doors, perches, and upper-story details shown in the 3D model are interpretive.',
      'Macaw Remains: Excavations recovered 14 scarlet macaw skeletons—12 associated with and embedded in a thick deposit of compacted bird guano (strong evidence that living macaws were kept in the room) and 2 intentionally placed in subfloor pits/hollows—along with a turquoise-inlaid black jet frog.',
      'Chronology & Genetics: Radiocarbon and ancient-DNA studies show that macaw acquisition at Pueblo Bonito occurred mostly between AD 900 and 1040, and sequenced Chaco macaws fall within the same broader mitochondrial clade (Haplo6) with low diversity across closely related haplotypes, consistent with a restricted founder/breeding population.',
    ],
    artType: 'macaw_38',
    artCaption: 'Pepper (1920), Watson et al. (2015) & George et al. (2018): 14 Scarlet Macaws (12 in Thick Guano Deposit, 2 in Subfloor Pits; AD 900–1040; Haplo6 Clade) & Turquoise-Inlaid Black Jet Frog',
    photo: './renders/archival/pd_nps_masonry_preservation.jpg',
    photoCap: 'NPS 1930s Public Domain: Northern Roomblocks Below Cliff House Sandstone Cliff',
    structures3D: [
      'North masonry wall & reconstructed vents/perches (interpretive reconstruction)',
      'Reconstructed east wall doorway & plastered floor ledge (interpretive reconstruction)',
      'Two subfloor pits (2 macaws) & thick bird-guano floor deposit (12 macaws)',
    ],
    archivalMedia: [
      {
        tab: 'Northern Roomblock (NPS)',
        src: './renders/archival/pd_nps_masonry_preservation.jpg',
        badge: 'PD-USGOV-NPS (1930s)',
        caption: 'Northern roomblocks below Cliff House Sandstone cliff (NPS, 1930s)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan of Pueblo Bonito (Lekson 1984)',
      },
      {
        tab: '1877 USGS Ground Plan',
        src: './renders/pd_usgs_1877_bonito_plan.jpg',
        badge: 'PD-USGOV-USGS (1877)',
        caption: '1877 USGS ground plan of Pueblo Bonito (W.H. Jackson)',
      },
      {
        tab: 'LiDAR Stage I–II Scan',
        src: './renders/hud_stage4_phase1_2_masonry.jpg',
        badge: '0.5m LIDAR + STAGE I–II',
        caption: 'Stage I–II Old Bonito northern crescent on 0.5m LiDAR DEM',
      },
    ],
  },
  {
    id: 'pueblo_bonito_159',
    index: 5,
    sectionId: 'kivas',
    chipLabel: '05 • Great Kiva A',
    shortPin: 'Great Kiva A',
    beaconLabel: 'Great Kiva A: East Court Great Kiva (4 Square Rubble-Filled Masonry Columns & 34 Niches)',
    beaconPos: [-8.33, 2.5, 21.39],
    walkPos: [-8.33, 8.8, 34.2],
    walkTarget: [-8.33, -1.6, 21.39],
    camPos: [-8.33, 8.8, 34.2],
    target: [-8.33, -1.5, 21.39],
    closeCamPos: [-8.33, 4.4, 28.2],
    closeTarget: [-8.33, -1.7, 21.39],
    tinyEra: 'LATE 11TH–EARLY 12TH CENTURY • APPROX. AD 1075–1115',
    tinyTitle: 'GREAT KIVA A — EAST COURT GREAT KIVA',
    tinyDesc:
      'Recessed East Court Great Kiva (built approx. AD 1075–1115) entered by a formal northern stairway and surrounded by a concentric masonry bench and 34 open wall niches; four large square rubble-filled masonry columns supported the reconstructed timber roof (~9 ft 7 in).',
    keyPoints: [
      'Architecture & Chronology: Built during Pueblo Bonito’s late 11th to early 12th century expansion (approx. AD 1075–1115, with use and remodeling continuing into the later 12th century). Entered by a formal northern stairway and surrounded by a concentric masonry bench and 34 wall niches (which were reported open and empty when excavated).',
      'Roof Support & Floor Features: Four large square rubble-filled masonry columns supported the reconstructed timber roof (~9 ft 7 in ceiling height), flanking a raised central firebox and paired subfloor masonry vaults (sometimes interpreted as foot drums, though their exact function remains uncertain).',
      'Ceremonial Offerings Context: While Great Kiva A’s 34 wall niches were found open and empty upon excavation, turquoise, shell, and mineral offerings are documented from dedicatory architectural and ceremonial contexts at Pueblo Bonito.',
    ],
    artType: 'kiva_a',
    artCaption: 'Judd (1954, 1964 NMNH) & NPS (1980, p. 11): Great Kiva A (Approx. AD 1075–1115 • 4 Square Rubble-Filled Masonry Columns, 34 Open Wall Niches & Paired Subfloor Vaults)',
    photo: './renders/archival/pd_nps_great_kiva.jpg',
    photoCap: 'NPS Public Domain: Great Kiva A Subfloor Masonry Vaults, Central Firebox & 34 Wall Niches',
    structures3D: [
      '4 large square rubble-filled masonry columns supporting reconstructed timber roof (~9 ft 7 in reconstructed ceiling height)',
      'Raised central firebox & paired subfloor masonry vaults',
      'Concentric masonry bench, 34 open wall niches & formal northern stairway',
    ],
    archivalMedia: [
      {
        tab: 'NPS Great Kiva Photo',
        src: './renders/archival/pd_nps_great_kiva.jpg',
        badge: 'PD-USGOV-NPS',
        caption: 'Great Kiva A subfloor masonry vaults, firebox & bench niches (NPS)',
      },
      {
        tab: '3D Kiva & LiDAR Scan',
        src: './renders/render_kiva_a.jpg',
        badge: '3D DIGITAL TWIN',
        caption: '3D Great Kiva A interpretive architectural reconstruction',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan showing Great Kiva A in the East Court (Lekson 1984)',
      },
      {
        tab: '0.5m LiDAR Hillshade',
        src: './renders/hud_stage3_lidar_clay_hillshade.jpg',
        badge: '0.5m AIRBORNE LIDAR',
        caption: '0.5m LiDAR bare-earth kiva depressions (OTSDEM.042019.6342.1)',
      },
    ],
  },
  {
    id: 'pueblo_bonito_257',
    index: 6,
    sectionId: 'east_wing',
    chipLabel: '06 • Rm 249 Aviary',
    shortPin: 'Rm 249 • 3 Macaws',
    beaconLabel: 'Room 249: 3 Scarlet Macaw Skeletons, Perches & Guano Floor',
    beaconPos: [50.98, 4.1, 10.43],
    walkPos: [46.8, 5.2, 12.6],
    walkTarget: [50.98, 1.85, 10.43],
    camPos: [46.8, 5.8, 12.6],
    target: [50.98, 1.85, 10.43],
    closeCamPos: [48.2, 4.2, 11.8],
    closeTarget: [50.98, 1.80, 10.43],
    tinyEra: 'STAGE III CLASSIC BONITO • APPROX. AD 1050–1085',
    tinyTitle: 'ROOM 249 — MACAW AVIARY & EAST WING CHAMBER',
    tinyDesc:
      'Excavated by Judd (1954): yielded 3 Scarlet Macaw skeletons, wooden wall perches, adobe bowls & thick guano floor; near HABS NM-30 Section 1 T-doorways.',
    keyPoints: [
      'Aviary Evidence (Judd 1954): Yielded 3 Scarlet Macaw (Ara macao) skeletons, a thick floor layer of compacted avian guano, adobe food/water bowls, and wooden perches set into the masonry walls. Reconstructed multi-story wall height and roof vigas are interpretive.',
      'Collections & Genetics (Watson et al. 2015; George et al. 2018, PNAS): Pueblo Bonito has produced approximately 35 macaws plus 2 thick-billed parrots in recent reassessments. Sequenced Chaco macaws fall within the same broader mitochondrial clade (Haplo6) with low diversity across closely related haplotypes, consistent with a restricted founder/breeding population.',
      'East Wing Doors & HABS No. NM-30 (LOC Item nm0107): Built in Type III banded core-and-veneer masonry (approx. AD 1050–1085). Nearby in East Wing Section No. 1 (Rooms 174–177, 225–226), HABS No. NM-30 Sheet 5 documents the measured T-Door on the West Wall of Room 226.',
    ],
    artType: 'tdoor_249',
    artCaption: 'Judd (1954 NMNH) & HABS No. NM-30 Sheet 5 (LOC nm0107): Room 249 Aviary (3 Macaws) & East Wing T-Doorway',
    photo: './renders/bonito_doorways.jpg',
    photoCap: 'NPS Public Domain: East Wing Aligned Enfilade Doorways & Type III Banded Masonry',
    structures3D: [
      'East Wing T-shaped doorway profile (reconstructed after HABS No. NM-30 Sheet 5, Room 226 West Wall)',
      'Reconstructed multi-pole Ponderosa pine doorway lintel & sandstone sill',
      'Reconstructed wooden wall perches & ceiling vigas in Room 249 (Judd 1954)',
    ],
    archivalMedia: [
      {
        tab: 'Aligned Doorways (NPS)',
        src: './renders/bonito_doorways.jpg',
        badge: 'PD-USGOV-NPS',
        caption: 'East Wing aligned enfilade doorways (NPS)',
      },
      {
        tab: 'HABS NM-30 Sheet 5',
        src: './renders/archival/pd_habs_sheet5_elevations.jpg',
        badge: 'HABS NM-30 (LOC nm0107)',
        caption: 'HABS No. NM-30 Sheet 5: Rm 226 T-Door, Rm 225 Corner Door & Rm 177 Window (LOC nm0107)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan (Lekson 1984)',
      },
      {
        tab: '3D Enfilade & LiDAR',
        src: './renders/render_doorways.jpg',
        badge: '3D DIGITAL TWIN',
        caption: '3D East Wing T-shaped & enfilade doorways',
      },
    ],
  },
  {
    id: 'pueblo_bonito_231',
    index: 7,
    sectionId: 'east_wing',
    chipLabel: '07 • Rm 168 Craft',
    shortPin: 'Rm 168 • Lapidary & Craft',
    beaconLabel: 'Room 168: Southeastern Lapidary & Craft Activity Area',
    beaconPos: [30.86, 4.2, 39.87],
    walkPos: [30.86, 6.8, 45.2],
    walkTarget: [30.86, 0.35, 39.87],
    camPos: [30.86, 6.8, 45.2],
    target: [30.86, 0.35, 39.87],
    closeCamPos: [30.86, 4.8, 42.4],
    closeTarget: [30.86, 0.25, 39.87],
    tinyEra: 'STAGE III–IV • APPROX. AD 1050–1105',
    tinyTitle: 'ROOM 168 — LAPIDARY & CRAFT ACTIVITY',
    tinyDesc:
      'Southeastern sector room associated with lapidary and craft activity. Rooms 168, 170, and 173 produced ground- and flaked-stone tools, mineral materials, and turquoise-related evidence.',
    keyPoints: [
      'Architecture: Part of the later southeastern roomblock expansion, constructed with core-and-veneer sandstone masonry. The room is reconstructed as a single-story space; exact original roof height and interior arrangement are uncertain.',
      'Artifacts & Activity: Room 168 belongs to an area that included evidence for lapidary and craft activity. Rooms 168, 170, and 173 produced ground- and flaked-stone tools, mineral materials, and turquoise-related evidence.',
      'Archaeological Record: No secure evidence currently supports identifying Room 168 specifically as a copper-bell or shell-trumpet repository.',
    ],
    artType: 'lapidary_168',
    artCaption: 'Southeastern Sector (Rooms 168, 170 & 173): Ground- and Flaked-Stone Tools, Mineral Materials & Turquoise-Related Lapidary Activity',
    photo: './renders/archival/pd_nps_southeast_kivas_cliff.jpg',
    photoCap: 'NPS 1930s Public Domain: Southeastern Roomblocks & Kivas from Cliff Overlook',
    structures3D: [
      'Southeastern roomblock core-and-veneer sandstone walls (reconstructed single-story space; exact original roof height uncertain)',
      'Aligned interior doorway frame with sandstone sill & pine lintel (interpretive reconstruction)',
      'Reconstructed interior work surface & ceiling vigas (interpretive reconstruction)',
    ],
    archivalMedia: [
      {
        tab: 'NPS Southeast Wing',
        src: './renders/archival/pd_nps_southeast_kivas_cliff.jpg',
        badge: 'PD-USGOV-NPS (1930s)',
        caption: 'Southeast kivas & roomblocks from cliff overlook (NPS, 1930s)',
      },
      {
        tab: 'HABS NM-30 Sheet 6',
        src: './renders/archival/pd_habs_sheet6_kiva_details.jpg',
        badge: 'HABS NM-30 (LOC nm0107)',
        caption: 'HABS No. NM-30 Sheet 6: Section 2 1st-Floor Plan Rms 178–179, 235–242 & Kiva D (LOC nm0107)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan (Lekson 1984)',
      },
      {
        tab: 'LiDAR Stage III–IV Scan',
        src: './renders/hud_stage5_phase3_4_wings_kivas.jpg',
        badge: '0.5m LIDAR + STAGE III–IV',
        caption: 'Stage III–IV wings on 0.5m LiDAR DEM',
      },
    ],
  },
  {
    id: 'pueblo_bonito_9',
    index: 8,
    sectionId: 'east_wing',
    chipLabel: '08 • Rm 228 Solstice',
    shortPin: 'Rm 228 • Solstice Window',
    beaconLabel: 'Room 228 (with Room 225): ~120° ESE Winter Solstice Sunrise Corner Windows',
    beaconPos: [52.53, 4.5, 33.72],
    walkPos: [56.2, 9.4, 37.8],
    walkTarget: [52.53, 4.15, 33.72],
    camPos: [56.2, 9.4, 37.8],
    target: [52.53, 4.15, 33.72],
    closeCamPos: [54.6, 7.6, 36.1],
    closeTarget: [52.53, 4.10, 33.72],
    tinyEra: 'STAGE III–IV • APPROX. AD 1065–1110',
    tinyTitle: 'ROOM 228 — WINTER SOLSTICE CORNER WINDOW',
    tinyDesc:
      'Rooms 228 & 225 in the southeastern sector feature exterior corner windows oriented at ~120° ESE toward the Winter Solstice sunrise (Reyman 1976).',
    keyPoints: [
      'Solar Alignment (Reyman 1976, Science 193(4257):1037–1038): Both Rooms 225 and 228 in the southeastern sector have exterior corner windows oriented at azimuth ~120° ESE; field observations confirmed that at Winter Solstice sunrise (Dec 21), a narrow beam of sunlight enters and illuminates the opposite interior wall/corner.',
      'Architecture & Reconstruction: Constructed in Type III/IV core-and-veneer sandstone masonry; upper wall elevations, ceiling height, and roof timbers shown in the 3D model are interpretive reconstructions.',
      'HABS No. NM-30 Documentation (LOC Item nm0107): HABS No. NM-30 Section No. 1 (Sheets 1–5, 1940) records measured plans of Rooms 174–177 and 225–226, including the Corner Doorway in the NE Corner of Room 225 on Sheet 5.',
    ],
    artType: 'solstice_228',
    artCaption: 'Reyman (1976 Science 193:1037–1038): Rooms 225 & 228 ~120° ESE Winter Solstice Sunrise Corner Windows',
    photo: './renders/archival/pd_nps_corner_doorway.jpg',
    photoCap: 'NPS 1929 Public Domain: Diagonal Corner Aperture in Southeastern Rooms',
    structures3D: [
      '~120° ESE exterior corner window aperture with stone sill & pine lintel (Reyman 1976)',
      'Opposite interior west wall target surface illuminated at Winter Solstice sunrise (reconstructed)',
      'Type III/IV core-and-veneer walls (reconstructed 2-story elevation)',
    ],
    archivalMedia: [
      {
        tab: 'NPS Corner Aperture',
        src: './renders/archival/pd_nps_corner_doorway.jpg',
        badge: 'PD-USGOV-NPS (1929)',
        caption: 'Southeastern corner aperture (NPS, 1929)',
      },
      {
        tab: 'HABS NM-30 Sheet 5',
        src: './renders/archival/pd_habs_sheet5_elevations.jpg',
        badge: 'HABS NM-30 (LOC nm0107)',
        caption: 'HABS No. NM-30 Sheet 5: Corner Doorway in NE Corner of Room 225 & Rm 226 T-Door (LOC nm0107)',
      },
      {
        tab: 'HABS NM-30 Sheet 2',
        src: './renders/archival/pd_habs_sheet2_plan.jpg',
        badge: 'HABS NM-30 (LOC nm0107)',
        caption: 'HABS No. NM-30 Sheet 2: Section 1 Plan Rms 174–177, 225–226 (LOC nm0107)',
      },
      {
        tab: '0.5m LiDAR Sweep',
        src: './renders/hud_stage1_lidar_sweep.jpg',
        badge: '0.5m LIDAR POINT CLOUD',
        caption: '0.5m airborne LiDAR elevation sweep',
      },
    ],
  },
  {
    id: 'pueblo_bonito_406',
    index: 9,
    sectionId: 'west_spine',
    chipLabel: '09 • Rm 326 Burials',
    shortPin: 'Rm 326 • Western Burials',
    beaconLabel: 'Room 326: Western Burial Cluster Chamber (Early Block AD 860–935 • 12 Individuals)',
    beaconPos: [-58.80, 6.4, 0.52],
    walkPos: [-53.8, 9.6, 3.4],
    walkTarget: [-58.80, 3.60, 0.52],
    camPos: [-53.8, 9.6, 3.4],
    target: [-58.80, 3.60, 0.52],
    closeCamPos: [-55.6, 7.8, 2.2],
    closeTarget: [-58.80, 3.55, 0.52],
    tinyEra: 'OLD BONITO ARCHITECTURAL BLOCK • APPROX. AD 860–935 CONSTRUCTION',
    tinyTitle: 'ROOM 326 — WESTERN BURIAL CLUSTER CHAMBER',
    tinyDesc:
      'Belongs to one of Pueblo Bonito’s earliest western architectural blocks (approx. AD 860–935) and modified during later occupation. Reassessment identified 12 individuals (11 adults [10 females, 1 male] and 1 infant; older inventories reported 11).',
    keyPoints: [
      'Architecture: Belongs to one of Pueblo Bonito’s earliest western architectural blocks (approx. AD 860–935 construction) and was modified during later occupation. Early Pueblo Bonito masonry with later alterations, including sealed openings and changes connecting Room 326 with neighboring rooms (reconstructed wall height and roof are interpretive).',
      'Mortuary Use: Later reassessment of the human remains associated with Room 326 identified 12 individuals: 11 adults and one infant. The adults include 10 females and one male.',
      'Excavation Inventories & Cluster: Older excavation inventories reported 11 individuals, which accounts for differences in published burial counts. Room 326 formed part of the larger western burial cluster that also included Rooms 320, 329, and 330.',
    ],
    artType: 'burial_326',
    artCaption: 'Judd (1954 NMNH), Akins (1986) & Reassessment: Room 326 (Early Block AD 860–935; Later Mortuary Use: 12 Individuals [10♀, 1♂, 1 Infant])',
    photo: './renders/archival/pd_nps_large_kiva_archival.jpg',
    photoCap: 'NPS 1930s Public Domain: Western Roomblocks & Kivas of Pueblo Bonito',
    structures3D: [
      'Early Old Bonito western architectural block masonry with later alterations (reconstructed 2-story height)',
      'Later sealed openings & reused metate step connecting Room 326 with neighboring Room 320 (interpretive reconstruction)',
      'Western Burial Cluster context (Rooms 320, 326, 329, 330; later mortuary use)',
    ],
    archivalMedia: [
      {
        tab: 'Western Wing (NPS)',
        src: './renders/archival/pd_nps_large_kiva_archival.jpg',
        badge: 'PD-USGOV-NPS (1930s)',
        caption: 'Western roomblocks & kivas (NPS, 1930s)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan showing Western Burial Cluster Rooms 320, 326, 329, 330 (Lekson 1984)',
      },
      {
        tab: '1877 USGS Ground Plan',
        src: './renders/pd_usgs_1877_bonito_plan.jpg',
        badge: 'PD-USGOV-USGS (1877)',
        caption: '1877 USGS ground plan of Pueblo Bonito western & northern arc (W.H. Jackson)',
      },
      {
        tab: '0.5m LiDAR Breakdown',
        src: './renders/lidar_data_and_foliage_breakdown.jpg',
        badge: '0.5m AIRBORNE LIDAR',
        caption: '0.5m LiDAR DEM & DSM breakdown',
      },
    ],
  },
  {
    id: 'landmark_threatening_rock',
    index: 10,
    sectionId: 'west_spine',
    chipLabel: '10 • 1941 Rockfall',
    shortPin: '1941 Rockfall',
    beaconLabel: '1941 Threatening Rock Collapse (~30,000 Tons)',
    beaconPos: [38.0, 15.0, -42.0],
    walkPos: [60.0, 14.0, -18.0],
    walkTarget: [35.0, 7.5, -42.0],
    camPos: [66.0, 22.0, -12.0],
    target: [28.0, 8.5, -42.0],
    closeCamPos: [48.0, 13.5, -26.0],
    closeTarget: [34.0, 7.5, -42.0],
    tinyEra: '11TH-CENTURY RETAINING TERRACE • COLLAPSED JAN 22, 1941',
    tinyTitle: 'THREATENING ROCK (TSÉ BÍYAH ANIIʼÁHÍ)',
    tinyDesc:
      'Detached ~30,000-ton sandstone monolith braced by an 11th-century Chacoan terrace; collapsed Jan 22, 1941 across the northeastern outer wall.',
    keyPoints: [
      'Geological Setting: Detached Upper Cretaceous Cliff House Sandstone monolith (Tsé Bíyah Aniiʼáhí, "Rock Braced Underneath") that stood immediately behind the northeastern arc of Pueblo Bonito.',
      'Prehistoric Engineering (Judd 1959, Antiquity 33:135–137): In the 11th century, Chacoan builders constructed an earth-and-masonry retaining terrace reinforced with upright ponderosa pine logs beneath the undercut base of the cliff (modeled terrace and adjacent 4-story wall height are reconstructed).',
      '1941 Collapse (Schumm & Chorley 1964, USGS Prof. Paper 454-H): On January 22, 1941 at 3:10 PM, after winter frost-wedging and erosion of its Menefee Formation shale pedestal, the monolith toppled, destroying part of the outer northern wall and crushing ~65 rooms.',
    ],
    artType: 'rockfall_1941',
    artCaption: 'Judd (1959) & Schumm & Chorley (1964 USGS): Threatening Rock Monolith & Jan 22, 1941 Collapse',
    photo: './renders/archival/pd_nps_north_canyon_overview.jpg',
    photoCap: 'NPS 1929 Public Domain: Threatening Rock Towering Behind Pueblo Bonito (Pre-1941)',
    structures3D: [
      'Reconstructed Chacoan masonry-and-pine retaining terrace under cliff base (Frans Blom 1924 Plan; Judd 1959)',
      'Jan 22, 1941 sandstone boulder talus cone (modeled from LiDAR & NPS survey)',
      'Adjacent reconstructed 4-story Type II/III core-and-veneer Northern Spine',
    ],
    archivalMedia: [
      {
        tab: '1929 NPS Pre-Collapse View',
        src: './renders/archival/pd_nps_north_canyon_overview.jpg',
        badge: 'PD-USGOV-NPS (1929)',
        caption: 'Threatening Rock towering behind Pueblo Bonito before 1941 collapse (NPS, 1929)',
      },
      {
        tab: '3D Cliff & Talus Scan',
        src: './renders/render_cliff.jpg',
        badge: '0.5m LIDAR + 3D TALUS',
        caption: '3D cliff & Jan 22, 1941 rockfall talus model',
      },
      {
        tab: '1877 USGS Restoration',
        src: './renders/archival/pd_usgs_1877_restoration.jpg',
        badge: 'PD-USGOV-USGS (1877)',
        caption: '1877 USGS architectural restoration of Pueblo Bonito (W.H. Jackson)',
      },
      {
        tab: '0.5m LiDAR DSM Relief',
        src: './renders/hud_stage2_lidar_dsm_full.jpg',
        badge: '0.5m LIDAR DSM',
        caption: '0.5m LiDAR DSM rockfall relief (OTSDEM.042019.6342.1)',
      },
    ],
  },
  {
    id: 'pueblo_bonito_170',
    index: 11,
    sectionId: 'greater_chaco',
    chipLabel: '11 • Great Kiva Q',
    shortPin: 'Great Kiva Q',
    beaconLabel: 'Great Kiva Q: West Court Great Kiva (4 Large Wooden Roof Posts in Circular Masonry Settings)',
    beaconPos: [-23.15, 3.8, -11.68],
    walkPos: [-23.15, 9.8, 3.5],
    walkTarget: [-23.15, -1.8, -11.68],
    camPos: [-23.15, 11.5, 5.5],
    target: [-23.15, -1.6, -11.68],
    closeCamPos: [-23.15, 5.8, -2.5],
    closeTarget: [-23.15, -2.1, -11.68],
    tinyEra: 'CLASSIC BONITO PHASE • PROBABLY MID-11TH CENTURY',
    tinyTitle: 'GREAT KIVA Q — WEST COURT GREAT KIVA',
    tinyDesc:
      'Recessed circular Great Kiva in the West Court (probably mid-11th century, predating Great Kiva A) with an encircling masonry bench, central firebox, paired rectangular subfloor vaults, and 4 large wooden roof-support posts seated in circular masonry settings.',
    keyPoints: [
      'Chronology & Architecture: Great Kiva Q appears to predate Great Kiva A and probably belongs to an earlier major Pueblo Bonito construction phase around the mid-11th century (precise construction date uncertain). Recessed into the West Court with an encircling masonry bench, central firebox, paired rectangular subfloor vaults, and a reconstructed southern entry stairway/antechamber.',
      'Roof Support: Great Kiva Q used four large wooden roof-support posts seated in circular masonry settings—visually and structurally distinct from the four square masonry columns of Great Kiva A.',
      'Reconstruction Note: The full roof timbering, upper wall height, and southern stairway appearance shown in the model are interpretive reconstructions.',
    ],
    artType: 'chetro_kiva',
    artCaption: 'Judd (1964 NMNH) & NPS Survey: Great Kiva Q (Mid-11th Century • 4 Wooden Roof Posts in Circular Masonry Settings & Paired Subfloor Vaults)',
    photo: './renders/render_aerial.jpg',
    photoCap: 'Pueblo Bonito 3D Reconstruction & 0.5m LiDAR Survey: Open West Court & Great Kiva Q',
    structures3D: [
      '4 large wooden roof-support posts seated in circular masonry settings (reconstructed; distinct from Great Kiva A square masonry columns)',
      'Paired rectangular subfloor vaults, central firebox & encircling masonry bench',
      'Reconstructed southern entry stairway/antechamber (full roof timbering & upper wall height are interpretive reconstructions)',
    ],
    archivalMedia: [
      {
        tab: 'West Court & Kiva Q',
        src: './renders/render_aerial.jpg',
        badge: '0.5m LIDAR DIGITAL TWIN',
        caption: 'Open West Court & Great Kiva Q (3D / 0.5m LiDAR)',
      },
      {
        tab: 'Western Kivas (NPS)',
        src: './renders/archival/pd_nps_large_kiva_archival.jpg',
        badge: 'PD-USGOV-NPS (1930s)',
        caption: 'Western roomblocks & West Court kivas (NPS, 1930s)',
      },
      {
        tab: 'NPS Master Plan',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        badge: 'PD-USGOV-NPS (1984)',
        caption: 'NPS measured site plan showing Great Kiva Q in West Court (Lekson 1984)',
      },
      {
        tab: '0.5m LiDAR Excavation',
        src: './renders/hud_stage3_lidar_clay_hillshade.jpg',
        badge: '0.5m AIRBORNE LIDAR',
        caption: '0.5m LiDAR bare-earth kiva depressions (OTSDEM.042019.6342.1)',
      },
    ],
  },
  {
    id: 'pueblo_bonito_22',
    index: 12,
    sectionId: 'greater_chaco',
    chipLabel: '12 • Rm 14 Spine',
    shortPin: 'Rm 14 • 4-Story Spine',
    beaconLabel: 'Room 14 / 85: Reconstructed Four-Story Northern Spine',
    beaconPos: [6.53, 9.6, -36.46],
    walkPos: [6.53, 15.5, -21.0],
    walkTarget: [6.53, 4.8, -36.46],
    camPos: [6.53, 17.5, -19.0],
    target: [6.53, 4.8, -36.46],
    closeCamPos: [6.53, 11.2, -28.5],
    closeTarget: [6.53, 4.5, -36.46],
    tinyEra: 'STAGE I–III • APPROX. AD 860–1085',
    tinyTitle: 'ROOM 14 / 85 — RECONSTRUCTED 4-STORY NORTHERN SPINE',
    tinyDesc:
      'Rising to a reconstructed 4 stories along the northern arc beneath the Cliff House Sandstone cliff, stepping down in amphitheater tiers toward the plazas.',
    keyPoints: [
      'Multi-Stage Masonry (Lekson 1984; Windes & Ford 1996): Stage I lower courses (approx. AD 860–935) overlain by thick Type II/III core-and-veneer walls (approx. AD 1040–1085) along the outer northern spine.',
      'Interpretive Reconstruction: The full four-story elevation, upper-floor arrangements, and roof height shown in the 3D model are interpretive reconstructions based on basal wall thickness and surviving beam-seat evidence.',
      'Timber Provenance (Douglass 1929; Guiterman et al. 2016, PNAS 113(5):1186–1190): Spanned by Ponderosa pine and Spruce/Fir ceiling vigas harvested in the Chuska and San Mateo mountains and transported via long-distance overland timber procurement.',
    ],
    artType: 'sundagger_297',
    artCaption: 'Douglass (1929), Lekson (1984) & Guiterman et al. (2016): Room 14/85 Reconstructed Four-Story Northern Spine',
    photo: './renders/render_cliff.jpg',
    photoCap: 'Four-Story Northern Arc & Cliff House Sandstone Escarpment (0.5m LiDAR & NPS Survey)',
    structures3D: [
      'Reconstructed 4-story (approx. 9.8 m) core-and-veneer outer northern wall',
      'Reconstructed terraced amphitheater roomblocks stepping down toward the plaza',
      'Reconstructed Ponderosa pine primary ceiling vigas and secondary latilla roof decks',
    ],
    archivalMedia: [
      {
        tab: '4-Story Northern Arc',
        src: './renders/render_cliff.jpg',
        badge: '3D ARCHITECTURAL MODEL',
        caption: 'Reconstructed 4-story northern spine & Cliff House Sandstone cliff (3D model)',
      },
      {
        tab: 'Northern Roomblock (NPS)',
        src: './renders/archival/pd_nps_masonry_preservation.jpg',
        badge: 'PD-USGOV-NPS (1930s)',
        caption: 'Northern roomblocks below Cliff House Sandstone cliff (NPS, 1930s)',
      },
      {
        tab: 'NPS Banded Masonry',
        src: './renders/archival/pd_nps_banded_masonry_doorway.jpg',
        badge: 'PD-USGOV-NPS (1929)',
        caption: 'Multi-story core-and-veneer masonry & viga sockets in northern arc (NPS, 1929)',
      },
      {
        tab: '0.5m LiDAR Sweep',
        src: './renders/hud_stage1_lidar_sweep.jpg',
        badge: '0.5m LIDAR SURVEY',
        caption: '0.5m airborne LiDAR elevation sweep (OT.042019.6342.1)',
      },
    ],
  },
];

// ============================================================================
// 2. 10-CHAPTER EDITORIAL SCROLL STORY DATA (Preserved for Tour & Query Modes)
// ============================================================================
const STORY_CHAPTERS = [
  {
    index: 1,
    era: 'AD 850–1150 • Tsé Bił Ndzisgaii',
    title: '3D Architectural Reconstruction of Pueblo Bonito',
    body: 'Set beneath a 30-meter Upper Cretaceous Cliff House Sandstone escarpment in northwestern New Mexico, Pueblo Bonito was the largest Great House in Chaco Canyon. This 3D interpretive reconstruction extrudes the 433 georeferenced room, kiva, and landmark polygons from HABS No. NM-30 (LOC Item nm0107) and NPS surveys atop the 0.5m airborne LiDAR terrain.',
    factTitle: 'ARCHIVAL PRECISION & INTERPRETIVE RECONSTRUCTION',
    factText: 'Aligned with the North–South meridian and East–West southern wall, Pueblo Bonito spans ~175 m (162–175 m) × 98 m with 433 georeferenced polygons (403 active + 30 buried sub-court features; ~800 total multi-story rooms rising up to a reconstructed 4 stories) and 35+ kivas.',
    camPos: [-22.0, 64.0, 108.0],
    target: [0.0, 3.5, -8.0],
    season: 'equinox',
    hour: 16.85,
    phase: 'all',
    discoveryId: null,
  },
  {
    index: 2,
    era: 'CHAPTER 2 • Stage I: AD 850–935 (Burials AD 800–1130)',
    title: 'Room 33: Matrilineal Mortuary Crypt',
    body: 'Construction began c. AD 850 with a crescent of Type I tabular sandstone slabs. In 1896, George H. Pepper excavated Room 33—uncovering 14 individuals buried above and below a pine plank floor across ~330 years (AD 800–1130).',
    factTitle: 'ANCIENT GENOMICS (9/9 SEQUENCED: B2y1) & >56,000 TURQUOISE ITEMS',
    factText: 'Burial 14 (>11,200 turquoise & >3,300 shell ornaments, AD 800–850) and Burial 13 (>5,800 turquoise pieces) lay below the plank floor (>56,000 turquoise items in Room 33 total). Complete mtDNA genomes from 9 individuals were 100% identical (haplotype B2y1; Kennett et al. 2017).',
    camPos: [-32.4, 11.2, -26.2],
    target: [-32.39, 2.7, -32.60],
    season: 'equinox',
    hour: 16.85,
    phase: 'stage1',
    discoveryId: 'pueblo_bonito_380',
  },
  {
    index: 3,
    era: 'CHAPTER 3 • Old Bonito Construction & Late 11th–Early 12th Century Cache Deposit',
    title: 'Rooms 28 & 32: Cylinder Jar Cache & Cacao Residue',
    body: 'Originally part of the early Old Bonito northern arc and later remodeled and subdivided with an added upper story, excavations in Room 28 recovered approximately 174 whole ceramic vessels, including ~111–112 Chacoan cylinder jars (with roughly 99 concentrated together on a raised storage shelf/area) alongside bowls and pitchers, burned during a termination event around AD 1100.',
    factTitle: 'CHEMICAL THEOBROMINE ANALYSIS (CROWN & HURST 2009, PNAS)',
    factText: 'Chemical residue analysis tested five cylinder jar sherds from Pueblo Bonito and detected theobromine—the biomarker for Theobroma cacao—in three of them, demonstrating preparation or consumption of cacao beverages reached via Mesoamerican exchange.',
    camPos: [-24.4, 11.4, -23.8],
    target: [-24.43, 2.7, -30.70],
    season: 'equinox',
    hour: 16.75,
    phase: 'all',
    discoveryId: 'pueblo_bonito_240',
  },
  {
    index: 4,
    era: 'CHAPTER 4 • Old Bonito Core (Macaw Use ca. AD 900–1040)',
    title: 'Room 38: Macaw-Keeping Room & Ritual Deposit',
    body: 'In Room 38, excavations recovered 14 scarlet macaw skeletons—12 associated with and embedded in a thick deposit of compacted bird guano (indicating live birds were kept in the room) and 2 intentionally placed in subfloor hollows—along with a turquoise-inlaid black jet frog.',
    factTitle: 'CHRONOLOGY & GENETICS (WATSON ET AL. 2015; GEORGE ET AL. 2018)',
    factText: 'Radiocarbon and ancient-DNA studies show that macaw acquisition at Pueblo Bonito occurred mostly between AD 900 and 1040, and sequenced Chaco macaws fall within the same broader mitochondrial clade (Haplo6) with low diversity across closely related haplotypes, consistent with a restricted founder/breeding population.',
    camPos: [-12.8, 12.2, -31.5],
    target: [-13.6, 2.7, -39.90],
    season: 'summer',
    hour: 16.9,
    phase: 'all',
    discoveryId: 'pueblo_bonito_352',
  },
  {
    index: 5,
    era: 'CHAPTER 5 • Stage II–III & January 22, 1941 Collapse',
    title: 'The Reconstructed 4-Story Northern Spine & 1941 Threatening Rock',
    body: 'Between AD 1040 and 1085, Chacoan builders raised the Northern Spine (interpretively reconstructed to 4 stories) using core-and-veneer masonry and timber beams carried >75 km from the Chuska and San Mateo mountains (Guiterman et al. 2016).',
    factTitle: 'THREATENING ROCK (TSÉ BÍYAH ANIIʼÁHÍ) — JAN 22, 1941',
    factText: 'Chacoan builders braced a detached ~30,000-ton sandstone monolith behind the NE wall with a stone-and-pine terrace. On Jan 22, 1941, it collapsed across the northeastern outer wall, crushing ~65 rooms.',
    camPos: [72.0, 28.0, -8.0],
    target: [20.0, 8.5, -42.0],
    season: 'summer',
    hour: 17.0,
    phase: 'stage2',
    discoveryId: 'landmark_threatening_rock',
  },
  {
    index: 6,
    era: 'CHAPTER 6 • Stage III–IV: Approx. AD 1050–1110',
    title: 'Room 249 Aviary, Room 168 Lapidary Area & Solstice Windows',
    body: 'During Classic Bonito expansion, builders constructed the East Wing in Type III banded veneer. Room 249 yielded 3 Scarlet Macaw skeletons, wooden wall perches, adobe bowls, and a thick guano floor (Judd 1954).',
    factTitle: 'HABS NO. NM-30 (LOC ITEM NM0107), ROOM 168 CRAFT ACTIVITY & SOLSTICE WINDOWS',
    factText: 'Nearby in East Wing Section No. 1, HABS No. NM-30 Sheet 5 documents the Room 226 T-door and Room 225 corner doorway; Rooms 168, 170, and 173 in the southeastern sector produced ground- and flaked-stone tools, mineral materials, and turquoise-related craft evidence, and Rooms 225 & 228 feature ~120° ESE Winter Solstice sunrise corner windows (Reyman 1976).',
    camPos: [46.8, 5.8, 12.6],
    target: [50.98, 1.85, 10.43],
    season: 'winter',
    hour: 7.8,
    phase: 'stage3',
    discoveryId: 'pueblo_bonito_257',
  },
  {
    index: 7,
    era: 'CHAPTER 7 • Late 11th–Early 12th Century (Approx. AD 1075–1115)',
    title: 'Great Kiva A: East Court Great Kiva',
    body: 'Recessed into the East Court and entered by a formal northern stairway, Great Kiva A (built approx. AD 1075–1115) was surrounded by a concentric masonry bench and 34 wall niches (reported open and empty when excavated). Four large square rubble-filled masonry columns supported the reconstructed timber roof (~9 ft 7 in ceiling height), flanking a raised central firebox and paired subfloor masonry vaults.',
    factTitle: 'CEREMONIAL ARCHITECTURE & DEDICATORY DEPOSITS',
    factText: 'While Great Kiva A’s 34 wall niches were found open and empty upon excavation, turquoise, shell, and mineral offerings are documented from dedicatory architectural and ceremonial contexts at Pueblo Bonito.',
    camPos: [-8.33, 8.8, 34.2],
    target: [-8.33, -1.6, 21.39],
    season: 'equinox',
    hour: 16.7,
    phase: 'all',
    discoveryId: 'pueblo_bonito_159',
  },
  {
    index: 8,
    era: 'CHAPTER 8 • Classic Bonito Phase (Probably Mid-11th Century)',
    title: 'Great Kiva Q: West Court Great Kiva',
    body: 'Appearing to predate Great Kiva A (probably mid-11th century), Great Kiva Q is recessed into the West Court with an encircling masonry bench, central firebox, paired rectangular subfloor vaults, and a reconstructed southern entry stairway/antechamber, using four large wooden roof-support posts seated in circular masonry settings—visually and structurally distinct from the four square masonry columns of Great Kiva A.',
    factTitle: 'INTERPRETIVE RECONSTRUCTION NOTE',
    factText: 'The full roof timbering, upper wall height, and southern stairway appearance shown in the model for Great Kiva Q are interpretive reconstructions.',
    camPos: [-23.15, 11.5, 7.5],
    target: [-23.15, -1.6, -11.68],
    season: 'equinox',
    hour: 16.8,
    phase: 'all',
    discoveryId: 'pueblo_bonito_170',
  },
  {
    index: 9,
    era: 'CHAPTER 9 • Cardinal & Solar Geometry',
    title: 'Room 14 / 85: Reconstructed Four-Story Northern Spine',
    body: 'Along the northern arc directly beneath the Cliff House Sandstone cliff, Room 14/85 anchored the northern spine (interpretively reconstructed to 4 stories / ~9.8 m), stepping down in amphitheater tiers toward the North–South dividing wall and East–West southern wall.',
    factTitle: 'CARDINAL MERIDIAN & EQUINOX ARCHITECTURE',
    factText: 'Pueblo Bonito combines a North–South bisecting plaza wall with a straight East–West southern closing wall, organizing the D-shaped Great House into dual courts.',
    camPos: [6.53, 17.5, -19.0],
    target: [6.53, 4.8, -36.46],
    season: 'summer',
    hour: 16.9,
    phase: 'all',
    discoveryId: 'pueblo_bonito_22',
  },
  {
    index: 10,
    era: 'CHAPTER 10 • Interactive Exploration',
    title: 'Dark Sky Kiva Fires & Free 3D Exploration',
    body: 'As night falls over the high desert (1,885 m elevation), ceremonial fires glow within the kivas and plazas. Hover over any room in Pueblo Bonito to inspect its archaeological record or scroll to walk through the chambers.',
    factTitle: 'RECORD YOUR OWN WALKTHROUGH VIDEO',
    factText: 'Click 🎥 Record in the top bar at any time to capture and download an HD WebM video tour of Chaco Canyon directly from your browser.',
    camPos: [0.0, 52.0, 86.0],
    target: [-4.0, 2.0, -12.0],
    season: 'night',
    hour: 21.5,
    phase: 'all',
    discoveryId: null,
  },
];

// ============================================================================
// 3. APPLICATION STATE & THREE.JS SCENE GLOBALS
// ============================================================================
let chacoData = null;
const featureById = new Map();
const featuresByName = new Map();
const discoveryById = new Map(CRA_DISCOVERIES.map((d) => [d.id, d]));
// Map Room 28 west compartment polygon (pueblo_bonito_377) to the unified Room 28 discovery record
if (discoveryById.has('pueblo_bonito_240')) {
  discoveryById.set('pueblo_bonito_377', discoveryById.get('pueblo_bonito_240'));
}
const sectionById = new Map(WALKTHROUGH_SECTIONS.map((s) => [s.id, s]));
const visitedDiscoveries = new Set(['pueblo_bonito_380', 'pueblo_bonito_159']);

let scene, camera, renderer, labelRenderer, controls, composer, bloomPass, gradePass;
let sky, sunLight, hemiLight, ambientLight, cliffBounceLight, roomInspectLight, roomOverheadSpot;
let alignmentGroup, fireLightsGroup, selectionHighlightGroup, discoveryMarkersGroup, roomInteriorsGroup, dustParticles;
let gltfModel = null;
let terrainMesh = null;
let cliffMesh = null;

// World-Space Room Footprint & Focus Mask Textures for Hyperrealistic Room Spotlighting & Non-Monochrome Differentiation
const PB_TEX_MIN_X = -105.0;
const PB_TEX_MAX_X = 105.0;
const PB_TEX_MIN_Z = -85.0;
const PB_TEX_MAX_Z = 85.0;
const PB_TEX_SPAN_X = PB_TEX_MAX_X - PB_TEX_MIN_X;
const PB_TEX_SPAN_Z = PB_TEX_MAX_Z - PB_TEX_MIN_Z;

let roomDataCanvas = null;
let roomDataTexture = null;
let focusMaskCanvas = null;
let focusMaskCtx = null;
let focusMaskTexture = null;

const sharedRoomShaderUniforms = {
  uRoomDataMap: { value: null },
  uFocusMaskMap: { value: null },
  uDimAmount: { value: 0.0 },
  uActiveCenterRadius: { value: new THREE.Vector4(0, 0, 0, 0) },
  uHoverCenterRadius: { value: new THREE.Vector4(0, 0, 0, 0) },
};
let targetDimAmount = 0.0;
let currentDimAmount = 0.0;
let hoveredFeature = null;

const pickableMeshes = [];
const meshToFeature = new Map();
const phaseCollections = new Map();
const roofTimberMeshes = [];
let threateningRockMesh = null;
const cssLabels = [];
const discoveryBeaconEls = new Map();

// Experience Mode & Section State ('orbit' starts with the full-screen wide orbit shot!)
let currentMode = 'orbit'; // 'orbit' | 'guided' | 'walk' | 'story'
let currentSectionId = 'overview';
let activeChapterIndex = 0;
let userOverridingStoryCamera = false;
let storyCameraOverrideTimer = null;

// Smooth Camera Tweening & First-Person Walk State
let camTween = null;
const walkKeys = {
  w: false,
  a: false,
  s: false,
  d: false,
  turnLeft: false,
  turnRight: false,
  shift: false,
};
let walkYaw = 0.08;
let walkPitch = -0.06;
let walkElevationOffset = 1.8;
let smoothedWalkY = 4.2;
let isDraggingLook = false;
let prevPointer = { x: 0, y: 0 };
let lastFrameTime = performance.now();

// Guided Walkthrough State
let guidedWalkActive = false;
let guidedWalkIndex = 0;
let guidedWalkPauseUntil = 0;
let lastProximityDiscId = null;
let proximityToastTimer = null;

// Clean Scroll-Driven Walk-In & Room Navigation State
let targetScrollProgress = 0.0;
let smoothScrollProgress = 0.0;
let userFreeNavigating = false;
let lookYawOffset = 0.0;
let lookPitchOffset = 0.0;
let activeSideNoteRoomId = null;

const SCROLL_WALK_WAYPOINTS = [
  { s: 0.0, pos: [-6.0, 58.0, 118.0], look: [0.0, 4.0, -8.0], roomId: null },
  { s: 0.08, pos: [1.5, 22.0, 64.0], look: [-3.0, 4.2, -16.0], roomId: null },
  { s: 0.16, pos: [2.0, 10.5, 38.0], look: [-8.3, -1.0, 21.4], roomId: null },
  { s: 0.25, pos: [-8.33, 8.8, 34.2], look: [-8.33, -1.6, 21.39], roomId: 'pueblo_bonito_159' },
  { s: 0.34, pos: [30.86, 7.6, 46.5], look: [30.86, 0.35, 39.87], roomId: 'pueblo_bonito_231' },
  { s: 0.43, pos: [46.8, 5.8, 12.6], look: [50.98, 1.85, 10.43], roomId: 'pueblo_bonito_257' },
  { s: 0.52, pos: [56.8, 12.2, 38.5], look: [52.53, 4.15, 33.72], roomId: 'pueblo_bonito_9' },
  { s: 0.62, pos: [-12.33, 12.2, -34.0], look: [-12.33, 3.60, -39.94], roomId: 'pueblo_bonito_352' },
  { s: 0.71, pos: [-24.41, 12.6, -26.8], look: [-24.41, 4.05, -30.66], roomId: 'pueblo_bonito_240' },
  { s: 0.81, pos: [-30.65, 11.5, -30.2], look: [-30.77, 4.45, -33.03], roomId: 'pueblo_bonito_8' },
  { s: 0.90, pos: [-32.45, 11.4, -29.6], look: [-32.77, 4.35, -32.43], roomId: 'pueblo_bonito_380' },
  { s: 1.00, pos: [-53.2, 12.2, 3.8], look: [-58.80, 3.60, 0.52], roomId: 'pueblo_bonito_406' },
];

// Downward Raycaster for Terrain Following
const downRaycaster = new THREE.Raycaster();
const downOrigin = new THREE.Vector3();
const downDir = new THREE.Vector3(0, -1, 0);

// Solar State — Default to Golden Hour (16.35 = 16:21, ~23° sun altitude) for hyperrealistic raking shadows
let currentSeason = 'equinox';
let currentHour = 16.35;
let currentSunDir = new THREE.Vector3(-0.75, 0.40, 0.52);
let currentSunAzDeg = 252.0;
let currentSunAltDeg = 23.0;
let activeCelestialAlignment = null;
let celestialSweepActive = false;
let isCompassScrubbing = false;
let roomCompassGroup = null;
let solsticeBeamGroup = null;
let solsticeBeamOuterMesh = null;
let solsticeBeamCoreMesh = null;
let solsticeWallPatchMesh = null;
let solsticeFloorPatchMesh = null;
let solsticeWindowLight = null;
const sightlinePulses = [];
const sightlineLinesByKey = new Map();
let currentMinimapSite = 'pueblo_bonito';
let selectedFeature = null;
let pmremGenerator = null;

// Walkthrough Video Recorder State
let mediaRecorder = null;
let recordedChunks = [];
let isRecordingWalkthrough = false;
let autoTourActive = false;
let autoTourStartTime = 0;

// ============================================================================
// 4. HYPERREALISTIC FILMIC POST-PROCESS SHADER (RUNS AFTER OUTPUT PASS IN sRGB)
// ============================================================================
const DesertFilmicGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uSunScreenPos: { value: new THREE.Vector2(0.2, 0.8) },
    uSunVisible: { value: 1.0 },
    uIsNight: { value: 0.0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform vec2 uSunScreenPos;
    uniform float uSunVisible;
    uniform float uIsNight;
    varying vec2 vUv;

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 col = texel.rgb;

      // Subtle atmospheric golden sun-scatter glow when sun is in/near view
      float sunDist = distance(vUv, uSunScreenPos);
      float sunGlow = exp(-sunDist * 3.0) * 0.08 * uSunVisible * (1.0 - uIsNight);
      col += vec3(1.0, 0.84, 0.58) * sunGlow;

      // Balanced AgX-inspired warm highlight & cool-slate shadow split-toning
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      vec3 shadowTone = mix(vec3(0.95, 0.97, 1.03), vec3(0.88, 0.93, 1.08), uIsNight);
      vec3 highlightTone = mix(vec3(1.03, 0.99, 0.93), vec3(1.02, 0.96, 0.88), uIsNight);
      col *= mix(shadowTone, highlightTone, smoothstep(0.15, 0.82, luma));

      // Gentle filmic contrast without crushing darks
      vec3 sCurve = smoothstep(0.0, 1.0, col);
      col = mix(col, sCurve, 0.14);

      // Subtle optical vignette at screen edges
      vec2 centered = vUv - 0.5;
      float vig = 1.0 - dot(centered, centered) * 0.24;
      col *= clamp(vig, 0.82, 1.0);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), texel.a);
    }
  `,
};

// ============================================================================
// 5. INITIALIZATION
// ============================================================================
async function init() {
  const statusEl = document.getElementById('loading-status-text');
  const progressBar = document.getElementById('loading-progress-bar');
  const isAutomatedCapture =
    window.location.search.includes('record_tour=1') ||
    window.location.search.includes('view=');

  if (isAutomatedCapture) {
    fetch('/__hold_vt__').catch(() => {});
  }

  try {
    if (progressBar) progressBar.style.width = '22%';

    const resp = await fetch('./chaco_data.json?v=20261005factchecked');
    chacoData = await resp.json();
    indexChacoFeatures(chacoData);

    if (progressBar) progressBar.style.width = '42%';
    initThreeScene();
    buildSectionsNavDOM();
    buildScrollStoryDOM();
    buildDiscoveryChipsDOM();
    populateSearchDatalist();
    populateSourcesModal();
    drawSunDaggerCanvas('summer');

    buildWorldRoomDataTextures();

    if (progressBar) progressBar.style.width = '68%';
    for (const disc of CRA_DISCOVERIES) {
      if (Array.isArray(disc.archivalMedia) && disc.archivalMedia[0] && disc.archivalMedia[0].src) {
        const preImg = new Image();
        preImg.src = disc.archivalMedia[0].src;
      }
    }
    const loadHeartbeat = setInterval(() => {}, 40);
    await loadChacoGLB(progressBar, statusEl);
    clearInterval(loadHeartbeat);

    buildAccurateRoomInteriors();
    buildSolarAlignmentVectors();
    alignmentGroup.visible = true;
    buildNightKivaFires();
    build3DLabelsAndDiscoveryBeacons();

    initCelestialCompass();
    initAspectRatioSwitcher();
    updateSolarLighting(currentSeason, currentHour);

    // Start in Clean Wide View of the Model with Big Centered CHACO CANYON Title!
    setExperienceMode('orbit', false);
    selectSection('overview', false);
    targetScrollProgress = 0.0;
    smoothScrollProgress = 0.0;
    userFreeNavigating = false;
    camera.position.set(-6.0, 58.0, 118.0);
    controls.target.set(0.0, 4.0, -8.0);
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.update();
    hideRoomSideNote();
    updateCenterTitleOverlay(0.0);

    drawMinimap();
    bindUIEvents();
    applyUrlQueryState();

    if (window.location.search.includes('view=') || window.location.search.includes('align=')) {
      currentDimAmount = targetDimAmount;
      sharedRoomShaderUniforms.uDimAmount.value = currentDimAmount;
      const sideNoteEl = document.getElementById('room-side-note');
      const gsBarEl = document.getElementById('guided-stops-bar');
      if (sideNoteEl) sideNoteEl.style.transition = 'none';
      if (gsBarEl) gsBarEl.style.transition = 'none';
    }

    if (progressBar) progressBar.style.width = '100%';
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('fade-out');
      if (
        isAutomatedCapture ||
        window.location.search.includes('view=') ||
        window.location.search.includes('align=')
      ) {
        overlay.style.display = 'none';
      } else {
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 450);
      }
    }

    onWindowResize();
    updateCelestialCompassFrame(performance.now(), 0.016);
    updateSunShadowFrustum();
    updateLabelFrustumVisibility();
    renderScenePipeline();

    if (window.location.search.includes('record_tour=1')) {
      await runDeterministicTourCapture();
      return;
    }

    lastFrameTime = performance.now();
    requestAnimationFrame(animate);

    if (window.location.search.includes('view=') || window.location.search.includes('align=')) {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      updateCelestialCompassFrame(performance.now(), 0.016);
      updateSunShadowFrustum();
      updateLabelFrustumVisibility();
      renderScenePipeline();
      fetch('/__done__', { method: 'POST', body: 'ok' }).catch(() => {});
    } else {
      // Background preload archival images so room clicks are instantaneous
      setTimeout(() => {
        for (const disc of CRA_DISCOVERIES) {
          if (Array.isArray(disc.archivalMedia)) {
            for (const m of disc.archivalMedia) {
              if (m && m.src) {
                const preImg = new Image();
                preImg.src = m.src;
              }
            }
          }
        }
      }, 1200);
    }
  } catch (err) {
    console.error('Initialization error:', err);
    if (statusEl) statusEl.textContent = `Error loading experience: ${err.message}`;
    if (isAutomatedCapture) {
      fetch('/__done__', { method: 'POST', body: `error:${err.message}` }).catch(() => {});
    }
  }
}

function applyUrlQueryState() {
  const params = new URLSearchParams(window.location.search);
  const alignParam = params.get('align');
  if (alignParam) {
    activateCelestialAlignment(alignParam);
    if (camTween) {
      camera.position.copy(camTween.endPos);
      controls.target.copy(camTween.endTarget);
      controls.update();
      camTween = null;
    }
    currentDimAmount = targetDimAmount;
    sharedRoomShaderUniforms.uDimAmount.value = currentDimAmount;
    return;
  }
  const view = params.get('view');
  if (!view) return;

  controls.autoRotate = false;
  const autoRotBtn = document.getElementById('btn-toggle-autorotate');
  if (autoRotBtn) autoRotBtn.classList.remove('active');
  const isCloseZoom = params.get('zoom') === 'close' || params.get('zoom') === 'inside';

  const focusRoomByIdImmediate = (roomId, scrollVal = 0.75) => {
    targetScrollProgress = scrollVal;
    smoothScrollProgress = scrollVal;
    updateCenterTitleOverlay(scrollVal);
    userFreeNavigating = false;
    controls.enabled = true;
    const disc = discoveryById.get(roomId);
    const feat = featureById.get(roomId);
    if (feat) {
      visitedDiscoveries.add(roomId);
      highlightFeatureIn3D(feat);
      populateInspectorDossier(feat, false);
      showRoomSideNote(feat);
      if (isCloseZoom && disc && disc.closeCamPos && disc.closeTarget) {
        camera.position.set(...disc.closeCamPos);
        controls.target.set(...disc.closeTarget);
        controls.update();
      } else if (disc && disc.walkPos && disc.walkTarget) {
        camera.position.set(...disc.walkPos);
        controls.target.set(...disc.walkTarget);
        controls.update();
      } else if (isCloseZoom && (feat.category === 'kiva' || feat.category === 'great_kiva')) {
        const wx = feat.cx || 0;
        const wz = -(feat.cy || 0);
        camera.position.set(wx + 0.8, 1.35, wz + 2.8);
        controls.target.set(wx - 0.6, -1.1, wz - 1.6);
        controls.update();
      } else {
        const wx = feat.cx || 0;
        const wz = -(feat.cy || 0);
        camera.position.set(wx, 11.2, wz + 6.5);
        controls.target.set(wx, 2.2, wz);
        controls.update();
      }
      selectedRoomBaseDist = camera.position.distanceTo(controls.target);
      currentDimAmount = targetDimAmount;
      sharedRoomShaderUniforms.uDimAmount.value = currentDimAmount;
    }
  };

  const activateChapterAtTop = (idx) => {
    setExperienceMode('orbit', false);
    userOverridingStoryCamera = true;
    activeChapterIndex = idx;
    targetScrollProgress = idx === 0 ? 0.0 : 0.25;
    smoothScrollProgress = targetScrollProgress;
    updateCenterTitleOverlay(smoothScrollProgress);
    const fillEl = document.getElementById('scroll-progress-fill');
    if (fillEl) {
      fillEl.style.width = `${((idx / Math.max(1, STORY_CHAPTERS.length - 1)) * 100).toFixed(1)}%`;
    }
    const ch = STORY_CHAPTERS[idx];
    if (ch) {
      camera.position.set(...ch.camPos);
      controls.target.set(...ch.target);
      controls.update();
      updateSolarLighting(ch.season, ch.hour);
      applyPhaseFilter(ch.phase);
      if (ch.discoveryId && params.get('dossier') !== '0') {
        visitedDiscoveries.add(ch.discoveryId);
        const feat = featureById.get(ch.discoveryId);
        if (feat) {
          highlightFeatureIn3D(feat);
          populateInspectorDossier(feat, true);
          showRoomSideNote(feat);
        }
      } else {
        hideRoomSideNote();
      }
    }
  };

  if (view.startsWith('chapter')) {
    const chNum = parseInt(view.replace('chapter', ''), 10);
    const idx = THREE.MathUtils.clamp((chNum || 1) - 1, 0, STORY_CHAPTERS.length - 1);
    activateChapterAtTop(idx);
  } else if (view.startsWith('section_')) {
    const secId = view.replace('section_', '');
    const sec = sectionById.get(secId);
    if (sec) {
      targetScrollProgress = secId === 'overview' ? 0.0 : 0.25;
      smoothScrollProgress = targetScrollProgress;
      updateCenterTitleOverlay(smoothScrollProgress);
      setExperienceMode(secId === 'overview' ? 'orbit' : 'guided', false);
      selectSection(secId, false);
      if (sec.roomIds.length > 0) {
        focusRoomByIdImmediate(sec.roomIds[0], 0.55);
      } else {
        camera.position.set(-6.0, 58.0, 118.0);
        controls.target.set(0.0, 4.0, -8.0);
        controls.update();
        hideRoomSideNote();
      }
    }
  } else if (view === 'map') {
    document.getElementById('map-drawer').classList.remove('hidden');
    document.getElementById('btn-open-map').classList.add('active');
    drawMinimap();
  } else if (view === 'explore' || view === 'orbit') {
    targetScrollProgress = 0.0;
    smoothScrollProgress = 0.0;
    updateCenterTitleOverlay(0.0);
    hideRoomSideNote();
    camera.position.set(-6.0, 58.0, 118.0);
    controls.target.set(0.0, 4.0, -8.0);
    controls.update();
  } else if (view === 'wide') {
    targetScrollProgress = 0.18;
    smoothScrollProgress = 0.18;
    updateCenterTitleOverlay(0.18);
    hideRoomSideNote();
    targetDimAmount = 0.0;
    currentDimAmount = 0.0;
    sharedRoomShaderUniforms.uDimAmount.value = 0.0;
    userFreeNavigating = false;
    controls.enabled = true;
    camera.position.set(12.0, 62.0, 108.0);
    controls.target.set(-6.0, 2.0, -14.0);
    controls.update();
  } else if (view === 'walkin') {
    targetScrollProgress = 0.16;
    smoothScrollProgress = 0.16;
    updateCenterTitleOverlay(0.16);
    hideRoomSideNote();
    camera.position.set(2.0, 10.5, 38.0);
    controls.target.set(-8.3, -1.0, 21.4);
    controls.update();
  } else if (view === 'guided' || view === 'room_33') {
    focusRoomByIdImmediate('pueblo_bonito_380', 0.90);
  } else if (view === 'room_28') {
    focusRoomByIdImmediate('pueblo_bonito_240', 0.71);
  } else if (view === 'room_32') {
    focusRoomByIdImmediate('pueblo_bonito_8', 0.81);
  } else if (view === 'room_38') {
    focusRoomByIdImmediate('pueblo_bonito_352', 0.62);
  } else if (view === 'walk' || view === 'kiva_a') {
    focusRoomByIdImmediate('pueblo_bonito_159', 0.25);
  } else if (view === 'room_249') {
    focusRoomByIdImmediate('pueblo_bonito_257', 0.43);
  } else if (view === 'room_168') {
    focusRoomByIdImmediate('pueblo_bonito_231', 0.34);
  } else if (view === 'room_228') {
    focusRoomByIdImmediate('pueblo_bonito_9', 0.52);
  } else if (view === 'room_326') {
    focusRoomByIdImmediate('pueblo_bonito_406', 1.00);
  } else if (view === 'hover_demo') {
    targetScrollProgress = 0.18;
    smoothScrollProgress = 0.18;
    updateCenterTitleOverlay(0.18);
    hideRoomSideNote();
    userFreeNavigating = false;
    controls.enabled = true;
    camera.position.set(-22.0, 25.0, -4.0);
    controls.target.set(-24.41, 3.8, -30.66);
    controls.update();
    const feat = featureById.get('pueblo_bonito_240');
    if (feat) {
      setHoveredFeature(feat, window.innerWidth * 0.49, window.innerHeight * 0.45);
    }
  } else if (view === 'night') {
    activateChapterAtTop(9);
  } else if (view === 'atlas') {
    document.getElementById('atlas-modal').classList.remove('hidden');
  } else if (featureById.has(view)) {
    focusRoomByIdImmediate(view, 0.50);
  }
}

function indexChacoFeatures(data) {
  if (!data || !Array.isArray(data.features)) return;
  for (const feat of data.features) {
    featureById.set(feat.id, feat);
    const normName = (feat.name || '').trim().toLowerCase();
    if (normName && !featuresByName.has(normName)) {
      featuresByName.set(normName, feat);
    }
  }
}

// ============================================================================
// 5B. WORLD-SPACE ROOM FOOTPRINT & FOCUS MASK TEXTURES (1024x1024)
// ============================================================================
function worldToRoomTexPx(wx, wz, size = 1024) {
  const u = (wx - PB_TEX_MIN_X) / PB_TEX_SPAN_X;
  const v = (wz - PB_TEX_MIN_Z) / PB_TEX_SPAN_Z;
  return [u * size, v * size];
}

function hashString01(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function buildWorldRoomDataTextures() {
  const size = 1024;
  roomDataCanvas = document.createElement('canvas');
  roomDataCanvas.width = size;
  roomDataCanvas.height = size;
  const ctx = roomDataCanvas.getContext('2d');

  // Base neutral black (no room polygon)
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, size, size);

  if (chacoData && Array.isArray(chacoData.features)) {
    // Pass 1: Fill & collar every Pueblo Bonito room and kiva polygon
    // R = per-room deterministic stone tone hash (45..235)
    // G = construction stage & structure encoding:
    //     Stage I Old Bonito = 60, Stage II North 4-Story = 115, Stage III Wings = 170, Stage IV South = 215, Kiva = 245
    // B = interior floor mask (220 inside room floor, 0 on walls/plaza)
    for (const f of chacoData.features) {
      if (f.site !== 'pueblo_bonito' || f.subcourt || !Array.isArray(f.polygon) || f.polygon.length < 3) {
        continue;
      }
      const rVal = Math.round(45 + hashString01(f.id || f.name || 'rm') * 190);
      let gVal = 170;
      const ph = f.phase || '';
      if (f.category === 'kiva' || f.category === 'great_kiva') {
        gVal = 245;
      } else if (ph.includes('Stage I ') || ph.startsWith('Stage I:')) {
        gVal = 60;
      } else if (ph.includes('Stage II')) {
        gVal = 115;
      } else if (ph.includes('Stage IV')) {
        gVal = 215;
      }

      ctx.beginPath();
      f.polygon.forEach(([px, py], idx) => {
        const [cx, cy] = worldToRoomTexPx(px, -py, size);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();

      // Expand stroke slightly so bounding walls inherit their room's stone hash & stage
      ctx.lineJoin = 'round';
      ctx.lineWidth = 6.0;
      ctx.strokeStyle = `rgb(${rVal}, ${gVal}, 40)`;
      ctx.stroke();

      ctx.fillStyle = `rgb(${rVal}, ${gVal}, 220)`;
      ctx.fill();
    }

    // Pass 2: Draw crisp dark partition-wall mortar lines between rooms (B = 15)
    for (const f of chacoData.features) {
      if (f.site !== 'pueblo_bonito' || f.subcourt || !Array.isArray(f.polygon) || f.polygon.length < 3) {
        continue;
      }
      const rVal = Math.round(45 + hashString01(f.id || f.name || 'rm') * 190);
      let gVal = 170;
      const ph = f.phase || '';
      if (f.category === 'kiva' || f.category === 'great_kiva') gVal = 245;
      else if (ph.includes('Stage I ') || ph.startsWith('Stage I:')) gVal = 60;
      else if (ph.includes('Stage II')) gVal = 115;
      else if (ph.includes('Stage IV')) gVal = 215;

      ctx.beginPath();
      f.polygon.forEach(([px, py], idx) => {
        const [cx, cy] = worldToRoomTexPx(px, -py, size);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.lineWidth = 2.2;
      ctx.strokeStyle = `rgb(${rVal}, ${gVal}, 15)`;
      ctx.stroke();
    }
  }

  roomDataTexture = new THREE.CanvasTexture(roomDataCanvas);
  roomDataTexture.flipY = false;
  roomDataTexture.wrapS = THREE.ClampToEdgeWrapping;
  roomDataTexture.wrapT = THREE.ClampToEdgeWrapping;
  roomDataTexture.minFilter = THREE.LinearFilter;
  roomDataTexture.magFilter = THREE.LinearFilter;
  roomDataTexture.needsUpdate = true;

  focusMaskCanvas = document.createElement('canvas');
  focusMaskCanvas.width = size;
  focusMaskCanvas.height = size;
  focusMaskCtx = focusMaskCanvas.getContext('2d');
  focusMaskCtx.fillStyle = 'rgb(0, 0, 0)';
  focusMaskCtx.fillRect(0, 0, size, size);

  focusMaskTexture = new THREE.CanvasTexture(focusMaskCanvas);
  focusMaskTexture.flipY = false;
  focusMaskTexture.wrapS = THREE.ClampToEdgeWrapping;
  focusMaskTexture.wrapT = THREE.ClampToEdgeWrapping;
  focusMaskTexture.minFilter = THREE.LinearFilter;
  focusMaskTexture.magFilter = THREE.LinearFilter;
  focusMaskTexture.needsUpdate = true;

  sharedRoomShaderUniforms.uRoomDataMap.value = roomDataTexture;
  sharedRoomShaderUniforms.uFocusMaskMap.value = focusMaskTexture;
}

function updateFocusMaskTexture() {
  if (!focusMaskCtx || !focusMaskTexture) return;
  const size = focusMaskCanvas.width;
  const ctx = focusMaskCtx;

  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgb(0, 0, 0)';
  ctx.fillRect(0, 0, size, size);

  // Additive blending with tight feathering so the 4 bounding 3D walls of the room illuminate without bleeding into adjacent rooms
  ctx.globalCompositeOperation = 'lighter';
  ctx.filter = 'blur(3px)';

  const drawFeatMask = (feat, rCollar, gCollar, rFill, gFill) => {
    if (!feat) return;
    if (Array.isArray(feat.polygon) && feat.polygon.length >= 3) {
      ctx.beginPath();
      feat.polygon.forEach(([px, py], idx) => {
        const [cx, cy] = worldToRoomTexPx(px, -py, size);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();

      // Wall collar (~0.6m = 6px) so the 4 bounding 3D masonry walls of the room brighten cleanly
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = 6.0;
      ctx.strokeStyle = `rgb(${rCollar}, ${gCollar}, 0)`;
      ctx.stroke();

      // Interior room floor fill
      ctx.fillStyle = `rgb(${rFill}, ${gFill}, 0)`;
      ctx.fill();
    } else if (feat.cx !== undefined && feat.cy !== undefined) {
      const [cx, cy] = worldToRoomTexPx(feat.cx, -feat.cy, size);
      const radPx = ((feat.radius_m || 6.0) / PB_TEX_SPAN_X) * size;
      ctx.beginPath();
      ctx.arc(cx, cy, radPx + 4.0, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${rFill}, ${gFill}, 0)`;
      ctx.fill();
    }
  };

  const drawFeatureWithLinkedPartitions = (feat, rCollar, gCollar, rFill, gFill) => {
    if (!feat) return;
    drawFeatMask(feat, rCollar, gCollar, rFill, gFill);
    // Room 28 changed substantially over time (originally a longer Old Bonito room before partitioning/remodeling):
    // highlight both modern survey polygons (pueblo_bonito_240 + pueblo_bonito_377) together.
    if (feat.id === 'pueblo_bonito_240') {
      drawFeatMask(featureById.get('pueblo_bonito_377'), rCollar, gCollar, rFill, gFill);
    } else if (feat.id === 'pueblo_bonito_377') {
      drawFeatMask(featureById.get('pueblo_bonito_240'), rCollar, gCollar, rFill, gFill);
    } else if (feat.id === 'pueblo_bonito_132') {
      drawFeatMask(featureById.get('pueblo_bonito_131'), rCollar, gCollar, rFill, gFill);
    }
  };

  if (selectedFeature) {
    drawFeatureWithLinkedPartitions(selectedFeature, 240, 0, 255, 0);
    const isRoom28 =
      selectedFeature.id === 'pueblo_bonito_240' || selectedFeature.id === 'pueblo_bonito_377';
    const wx = isRoom28 ? -25.8 : selectedFeature.cx || 0;
    const wz = isRoom28 ? -31.0 : -(selectedFeature.cy || 0);
    const rad = isRoom28
      ? 5.4
      : selectedFeature.radius_m
      ? selectedFeature.radius_m + 1.4
      : Math.max(3.0, Math.hypot(selectedFeature.width_m || 4.0, selectedFeature.depth_m || 4.0) * 0.55);
    const isOutlier =
      Math.abs(wx) > 85.0 || wz < -65.0 || wz > 65.0 ? 2.0 : 1.0;
    sharedRoomShaderUniforms.uActiveCenterRadius.value.set(wx, wz, rad, isOutlier);
  } else {
    sharedRoomShaderUniforms.uActiveCenterRadius.value.set(0, 0, 0, 0.0);
  }

  if (hoveredFeature) {
    drawFeatureWithLinkedPartitions(hoveredFeature, 0, 240, 0, 255);
    const isRoom28 =
      hoveredFeature.id === 'pueblo_bonito_240' || hoveredFeature.id === 'pueblo_bonito_377';
    const wx = isRoom28 ? -25.8 : hoveredFeature.cx || 0;
    const wz = isRoom28 ? -31.0 : -(hoveredFeature.cy || 0);
    const rad = isRoom28
      ? 5.6
      : hoveredFeature.radius_m
      ? hoveredFeature.radius_m + 1.6
      : Math.max(3.2, Math.hypot(hoveredFeature.width_m || 4.2, hoveredFeature.depth_m || 4.2) * 0.58);
    const isOutlier =
      Math.abs(wx) > 85.0 || wz < -65.0 || wz > 65.0 ? 2.0 : 1.0;
    sharedRoomShaderUniforms.uHoverCenterRadius.value.set(wx, wz, rad, isOutlier);
  } else {
    sharedRoomShaderUniforms.uHoverCenterRadius.value.set(0, 0, 0, 0.0);
  }

  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';
  focusMaskTexture.needsUpdate = true;
}

// ============================================================================
// 6. THREE.JS SCENE, HYPERREALISTIC LIGHTING RIG & POST-PROCESSING PIPELINE
// ============================================================================
function getViewportSize() {
  const stageEl = document.getElementById('viewport-stage');
  const w = stageEl && stageEl.clientWidth > 0 ? stageEl.clientWidth : window.innerWidth;
  const h = stageEl && stageEl.clientHeight > 0 ? stageEl.clientHeight : window.innerHeight;
  const width = Math.max(240, w);
  const height = Math.max(240, h);
  document.body.dataset.aspectLayout = width / height < 0.98 ? 'portrait' : 'landscape';
  return { width, height };
}

function computeResponsiveCameraFov(aspect) {
  const baseFovDeg = 44.0;
  if (aspect >= 1.25) return baseFovDeg;
  // Preserve horizontal FOV in 9:16 portrait iframes (aspect ~0.5625) so the entire D-shaped ruin fits left-to-right
  const baseHalfRad = THREE.MathUtils.degToRad(baseFovDeg * 0.5);
  const scale = THREE.MathUtils.clamp(1.28 / Math.max(0.45, aspect), 1.0, 1.85);
  const newFovDeg = THREE.MathUtils.radToDeg(2.0 * Math.atan(Math.tan(baseHalfRad) * scale));
  return THREE.MathUtils.clamp(newFovDeg, baseFovDeg, 68.0);
}

function initThreeScene() {
  const container = document.getElementById('canvas-container');
  const { width, height } = getViewportSize();
  const aspect = width / height;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x5882b4);
  // Subtle warm high-desert horizon haze
  scene.fog = new THREE.FogExp2(0xd4b08c, 0.00042);

  camera = new THREE.PerspectiveCamera(computeResponsiveCameraFov(aspect), aspect, 0.65, 3600);
  camera.position.set(-6.0, 58.0, 118.0);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(width, height);
  labelRenderer.domElement.style.position = 'absolute';
  labelRenderer.domElement.style.top = '0';
  labelRenderer.domElement.style.left = '0';
  labelRenderer.domElement.style.pointerEvents = 'none';
  labelRenderer.domElement.style.zIndex = '15';
  labelRenderer.domElement.style.overflow = 'hidden';
  container.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0.0, 4.0, -8.0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.maxPolarAngle = Math.PI * 0.494;
  controls.minDistance = 0.75;
  controls.maxDistance = 950.0;
  controls.enableZoom = true;
  controls.zoomSpeed = 1.15;
  if ('zoomToCursor' in controls) {
    controls.zoomToCursor = true;
  }
  controls.enableRotate = true;
  controls.rotateSpeed = 0.85;
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0.36;

  controls.addEventListener('start', () => {
    camTween = null;
    if (controls.autoRotate) {
      controls.autoRotate = false;
      const autoBtn = document.getElementById('btn-toggle-autorotate');
      if (autoBtn) autoBtn.classList.remove('active');
    }
    if (guidedWalkActive) stopGuidedWalk();
    if (currentMode === 'story' && !autoTourActive) {
      userOverridingStoryCamera = true;
      clearTimeout(storyCameraOverrideTimer);
    }
  });

  // Physical Sky Dome (scaled within camera.far so the sky is always crisp cerulean-to-gold!)
  sky = new Sky();
  sky.scale.setScalar(2600);
  scene.add(sky);
  const skyUniforms = sky.material.uniforms;
  skyUniforms['turbidity'].value = 2.8;
  skyUniforms['rayleigh'].value = 1.45;
  skyUniforms['mieCoefficient'].value = 0.0042;
  skyUniforms['mieDirectionalG'].value = 0.80;

  // Primary High-Desert Directional Sun Light (4096px High-Contrast Shadow Map)
  sunLight = new THREE.DirectionalLight(0xffe0b2, 3.6);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 750;
  const d = 112;
  sunLight.shadow.camera.left = -d;
  sunLight.shadow.camera.right = d;
  sunLight.shadow.camera.top = d;
  sunLight.shadow.camera.bottom = -d;
  sunLight.shadow.bias = -0.00045;
  sunLight.shadow.normalBias = 0.045;
  scene.add(sunLight);
  scene.add(sunLight.target);

  // Calibrated Sky-to-Canyon Hemisphere Fill (cerulean sky fill vs warm sandy ochre bounce)
  hemiLight = new THREE.HemisphereLight(0x7eb0e2, 0x9c7248, 0.78);
  scene.add(hemiLight);

  // Warm sandstone bounce off the 35m Chacra Mesa cliff
  cliffBounceLight = new THREE.DirectionalLight(0xe5a46c, 0.45);
  cliffBounceLight.position.set(0, 55, -135);
  cliffBounceLight.castShadow = false;
  scene.add(cliffBounceLight);

  // Soft base ambient so shadowed kiva benches and masonry remain legible with rich depth
  ambientLight = new THREE.AmbientLight(0x4a3b2c, 0.38);
  scene.add(ambientLight);

  // Interactive Warm Room Interior Fill Light & Overhead Conservation Spotlight (illuminates entered room)
  roomInspectLight = new THREE.PointLight(0xffcf96, 0.0, 24.0, 1.35);
  roomInspectLight.position.set(-32.4, 4.5, -32.6);
  scene.add(roomInspectLight);

  roomOverheadSpot = new THREE.SpotLight(0xffe6c2, 0.0, 48.0, Math.PI * 0.26, 0.55, 1.2);
  roomOverheadSpot.position.set(-32.4, 20.0, -32.6);
  roomOverheadSpot.castShadow = false;
  scene.add(roomOverheadSpot);
  scene.add(roomOverheadSpot.target);

  alignmentGroup = new THREE.Group();
  scene.add(alignmentGroup);

  fireLightsGroup = new THREE.Group();
  scene.add(fireLightsGroup);

  selectionHighlightGroup = new THREE.Group();
  scene.add(selectionHighlightGroup);

  discoveryMarkersGroup = new THREE.Group();
  scene.add(discoveryMarkersGroup);

  roomInteriorsGroup = new THREE.Group();
  scene.add(roomInteriorsGroup);

  // Post-Processing Pipeline: RenderPass -> BloomPass -> OutputPass -> FilmicGradePass
  composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(width, height);

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.08, 0.35, 0.92);
  composer.addPass(bloomPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  gradePass = new ShaderPass(DesertFilmicGradeShader);
  composer.addPass(gradePass);

  window.addEventListener('resize', onWindowResize);
}

const _sunProj = new THREE.Vector3();
function renderScenePipeline() {
  if (!renderer || !scene || !camera) return;

  if (gradePass && sunLight) {
    _sunProj.copy(camera.position).addScaledVector(currentSunDir, 500.0);
    _sunProj.project(camera);
    const inFront = _sunProj.z >= -1.0 && _sunProj.z <= 1.0 ? 1.0 : 0.0;
    gradePass.uniforms.uSunScreenPos.value.set(
      _sunProj.x * 0.5 + 0.5,
      _sunProj.y * 0.5 + 0.5
    );
    gradePass.uniforms.uSunVisible.value = inFront;
  }

  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
  if (labelRenderer) {
    labelRenderer.render(scene, camera);
  }
}

// ============================================================================
// 7. LOAD GLB & INJECT HYPERREALISTIC NON-MONOCHROME SANDSTONE + ROOM FOCUS SHADER
// ============================================================================
function getNodeTypeId(nodeName = '', matName = '') {
  const n = nodeName;
  const nl = n.toLowerCase();
  const m = matName.toLowerCase();
  if (m.includes('canyon_floor') || (nl.includes('terrain') && !m.includes('cliff'))) return 1.0;
  if (n === 'Chacra_Mesa_Cliff_And_Fajada_Butte' || m.includes('cliff')) return 2.0;
  if (n.includes('Threatening_Rock')) return 3.0;
  if (n.includes('Phase1_OldBonito')) return 4.0;
  if (n.includes('Phase2_NorthArc')) return 5.0;
  if (n.includes('Phase3_EastWing') || n.includes('Phase3_WestWing')) return 6.0;
  if (n.includes('Phase4_') || n.includes('Chetro_Ketl') || n.includes('Pueblo_Del_Arroyo')) return 7.0;
  if (n.includes('PB_Kiva_Masonry') || n.includes('Casa_Rinconada')) return 8.0;
  if (n.includes('PB_Kiva_Benches')) return 9.0;
  if (n.includes('PB_Room_Floors')) return 10.0;
  if (n.includes('PB_Timber_') || m.includes('timber')) return 11.0;
  return 6.0;
}

function enhanceMaterialWithDesertShader(mat, nodeName, matName) {
  if (mat.userData.desertShaderInjected) return;
  mat.userData.desertShaderInjected = true;

  const nodeTypeId = getNodeTypeId(nodeName, matName);
  mat.userData.nodeTypeId = nodeTypeId;

  // Differentiate base PBR roughness, color & deterministic depth polygonOffset per architectural element (zero z-fighting!)
  mat.side = THREE.FrontSide;
  mat.shadowSide = THREE.FrontSide;
  mat.polygonOffset = true;

  if (nodeTypeId === 1.0) {
    // Canyon floor + escarpment base
    mat.color.setRGB(0.95, 0.91, 0.84);
    mat.roughness = 0.96;
    mat.metalness = 0.01;
    mat.polygonOffsetFactor = 2.0;
    mat.polygonOffsetUnits = 4.0;
  } else if (nodeTypeId === 2.0) {
    // Chacra Mesa Cliff House Sandstone & Fajada Butte
    mat.color.setRGB(1.02, 0.90, 0.76);
    mat.roughness = 0.89;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = 1.5;
    mat.polygonOffsetUnits = 3.0;
  } else if (nodeTypeId === 3.0) {
    // 1941 Threatening Rock talus
    mat.color.setRGB(0.86, 0.72, 0.58);
    mat.roughness = 0.92;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = -0.3;
    mat.polygonOffsetUnits = -1.0;
  } else if (nodeTypeId === 4.0) {
    // Stage I Old Bonito (AD 850–935) — Weathered dark sienna-umber Type I tabular sandstone
    mat.color.setRGB(0.76, 0.56, 0.42);
    mat.roughness = 0.93;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = -0.2;
    mat.polygonOffsetUnits = -0.5;
  } else if (nodeTypeId === 5.0) {
    // Stage II North 4-Story Spine (AD 1040–1060) — Deep russet-ochre Type II core-and-veneer
    mat.color.setRGB(0.90, 0.69, 0.52);
    mat.roughness = 0.88;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = -0.4;
    mat.polygonOffsetUnits = -1.0;
  } else if (nodeTypeId === 6.0) {
    // Stage III East & West Wings (AD 1060–1085) — Warm golden-tan Type III banded ashlar & dark spalls
    mat.color.setRGB(1.00, 0.82, 0.66);
    mat.roughness = 0.85;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = nodeName.includes('WestWing') ? -0.5 : -0.6;
    mat.polygonOffsetUnits = nodeName.includes('WestWing') ? -1.2 : -1.5;
  } else if (nodeTypeId === 7.0) {
    // Stage IV South Arc, Meridian & Downtown Great Houses (AD 1085–1115) — Light buff Type IV tabular ashlar
    mat.color.setRGB(1.04, 0.88, 0.72);
    mat.roughness = 0.86;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = -0.8;
    mat.polygonOffsetUnits = -2.0;
  } else if (nodeTypeId === 8.0) {
    // Subterranean Kiva Masonry Walls — Fire-warmed reddish terracotta-sandstone
    mat.color.setRGB(0.84, 0.57, 0.40);
    mat.roughness = 0.90;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = 0.3;
    mat.polygonOffsetUnits = 0.8;
  } else if (nodeTypeId === 9.0) {
    // Kiva Benches & Foot-Drum Vaults — Burnished adobe plaster
    mat.color.setRGB(0.74, 0.58, 0.44);
    mat.roughness = 0.91;
    mat.metalness = 0.01;
    mat.polygonOffsetFactor = -0.7;
    mat.polygonOffsetUnits = -1.8;
  } else if (nodeTypeId === 10.0) {
    // Room Interior Packed-Earth / Caliche-Clay Floors — Dark earthen floor contrast so room boundaries pop!
    mat.color.setRGB(0.56, 0.44, 0.34);
    mat.roughness = 0.96;
    mat.metalness = 0.01;
    mat.polygonOffsetFactor = 0.6;
    mat.polygonOffsetUnits = 1.5;
  } else if (nodeTypeId === 11.0) {
    // Ponderosa Pine Vigas & Latillas — Aged dark mountain timber
    mat.color.setRGB(0.46, 0.32, 0.21);
    mat.roughness = 0.88;
    mat.metalness = 0.02;
    mat.polygonOffsetFactor = -1.2;
    mat.polygonOffsetUnits = -3.0;
  }

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uNodeTypeId = { value: nodeTypeId };
    shader.uniforms.uRoomDataMap = sharedRoomShaderUniforms.uRoomDataMap;
    shader.uniforms.uFocusMaskMap = sharedRoomShaderUniforms.uFocusMaskMap;
    shader.uniforms.uDimAmount = sharedRoomShaderUniforms.uDimAmount;
    shader.uniforms.uActiveCenterRadius = sharedRoomShaderUniforms.uActiveCenterRadius;
    shader.uniforms.uHoverCenterRadius = sharedRoomShaderUniforms.uHoverCenterRadius;

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
         varying vec3 vDesertWorldPos;
         varying vec3 vDesertWorldNormal;`
      )
      .replace(
        '#include <worldpos_vertex>',
        `#include <worldpos_vertex>
         vDesertWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
         vDesertWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
         uniform float uNodeTypeId;
         uniform sampler2D uRoomDataMap;
         uniform sampler2D uFocusMaskMap;
         uniform float uDimAmount;
         uniform vec4 uActiveCenterRadius;
         uniform vec4 uHoverCenterRadius;
         varying vec3 vDesertWorldPos;
         varying vec3 vDesertWorldNormal;

         float desertHash(vec3 p) {
           p = fract(p * 0.3183099 + 0.1);
           p *= 17.0;
           return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
         }
         float desertNoise2D(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           f = f * f * (3.0 - 2.0 * f);
           float a = desertHash(vec3(i, 0.0));
           float b = desertHash(vec3(i + vec2(1.0, 0.0), 0.0));
           float c = desertHash(vec3(i + vec2(0.0, 1.0), 0.0));
           float d = desertHash(vec3(i + vec2(1.0, 1.0), 0.0));
           return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
         }`
      )
      .replace(
        '#include <dithering_fragment>',
        `
         // Sample georeferenced Pueblo Bonito room data & blurred 3D room focus mask in world space
         vec2 pbUv = vec2(
           (vDesertWorldPos.x - (${PB_TEX_MIN_X.toFixed(1)})) / ${PB_TEX_SPAN_X.toFixed(1)},
           (vDesertWorldPos.z - (${PB_TEX_MIN_Z.toFixed(1)})) / ${PB_TEX_SPAN_Z.toFixed(1)}
         );
         bool inPbBounds = pbUv.x >= 0.0 && pbUv.x <= 1.0 && pbUv.y >= 0.0 && pbUv.y <= 1.0;
         vec4 roomData = inPbBounds ? texture2D(uRoomDataMap, pbUv) : vec4(0.0);
         vec4 focusSample = inPbBounds ? texture2D(uFocusMaskMap, pbUv) : vec4(0.0);

         // Radial fallback ONLY for outlying Downtown Chaco / Fajada Butte landmarks outside Pueblo Bonito UV bounds
         float radialActive = 0.0;
         if (uActiveCenterRadius.w > 1.5) {
           float dAct = length(vDesertWorldPos.xz - uActiveCenterRadius.xy);
           radialActive = 1.0 - smoothstep(uActiveCenterRadius.z * 0.72, uActiveCenterRadius.z + 2.2, dAct);
         }
         float radialHover = 0.0;
         if (uHoverCenterRadius.w > 1.5) {
           float dHov = length(vDesertWorldPos.xz - uHoverCenterRadius.xy);
           radialHover = 1.0 - smoothstep(uHoverCenterRadius.z * 0.72, uHoverCenterRadius.z + 2.0, dHov);
         }

         float activeMask = inPbBounds ? smoothstep(0.28, 0.85, focusSample.r) : radialActive;
         float hoverMask = inPbBounds ? smoothstep(0.28, 0.85, focusSample.g) : radialHover;

         // Prevent high cliff escarpment (>16m) from claiming room floor masks
         if (vDesertWorldPos.y > 16.5 && uActiveCenterRadius.z < 18.0) {
           activeMask = 0.0;
           hoverMask = 0.0;
         }

         // ------------------------------------------------------------------
         // A. GEOLOGICAL & ECOLOGICAL DIFFERENTIATION (TERRAIN vs CLIFF vs PLAZA)
         // ------------------------------------------------------------------
         if (uNodeTypeId > 0.5 && uNodeTypeId < 2.5) {
           bool isEscarpment = (uNodeTypeId > 1.5) || (vDesertWorldPos.y > 2.45);
           if (isEscarpment) {
             // 35m Chacra Mesa Cliff House Sandstone Escarpment & Fajada Butte
             float bed1 = sin(vDesertWorldPos.y * 1.85 + desertNoise2D(vDesertWorldPos.xz * 0.04) * 2.2);
             float bed2 = sin(vDesertWorldPos.y * 6.4 + vDesertWorldPos.x * 0.08);
             vec3 cliffGold = vec3(0.92, 0.71, 0.49);
             vec3 cliffOchre = vec3(0.76, 0.53, 0.35);
             vec3 cliffRecess = vec3(0.42, 0.29, 0.20);
             vec3 cliffTone = mix(cliffOchre, cliffGold, smoothstep(-0.6, 0.7, bed1));
             cliffTone = mix(cliffTone, cliffRecess, smoothstep(0.65, 0.98, -bed2) * 0.45);

             // Dark manganese-iron desert varnish streaks dripping down vertical cliff faces
             float varnishStreak = desertNoise2D(vec2(vDesertWorldPos.x * 0.38, vDesertWorldPos.y * 0.06));
             float verticalFace = 1.0 - abs(vDesertWorldNormal.y);
             float varnishMask = smoothstep(0.54, 0.82, varnishStreak) * verticalFace * smoothstep(4.5, 22.0, vDesertWorldPos.y);
             cliffTone = mix(cliffTone, vec3(0.24, 0.18, 0.15), varnishMask * 0.62);

             gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * cliffTone * 1.22, 0.82);
           } else {
             // High-Desert Canyon Floor: Plaza Courts vs Sagebrush Scrub & Chaco Wash
             float distToPlaza = length((vDesertWorldPos.xz - vec2(-2.0, 12.0)) * vec2(0.82, 1.18));
             float inPlazaCourt = (1.0 - smoothstep(46.0, 68.0, distToPlaza)) * step(-36.0, vDesertWorldPos.z) * step(vDesertWorldPos.z, 48.0);

             float scrubPatch = desertNoise2D(vDesertWorldPos.xz * 0.16);
             float fineScrub = desertNoise2D(vDesertWorldPos.xz * 0.95);
             float washChannel = exp(-pow((vDesertWorldPos.z - 125.0 + sin(vDesertWorldPos.x * 0.018) * 18.0) * 0.045, 2.0));

             // Gray-olive big sagebrush (Artemisia tridentata) & rabbitbrush vs alkali desert silt
             vec3 alkaliEarth = vec3(0.76, 0.65, 0.52);
             vec3 sagebrushOlive = vec3(0.45, 0.48, 0.36);
             vec3 dryGrassGold = vec3(0.66, 0.58, 0.43);
             vec3 exteriorFloor = mix(alkaliEarth, dryGrassGold, smoothstep(0.3, 0.7, scrubPatch));
             float shrubClump = smoothstep(0.46, 0.76, scrubPatch * 0.65 + fineScrub * 0.35);
             exteriorFloor = mix(exteriorFloor, sagebrushOlive, shrubClump * 0.72);
             exteriorFloor = mix(exteriorFloor, vec3(0.62, 0.53, 0.43), washChannel * 0.55);

             // Sun-baked compacted caliche & swept sand inside East & West Courts
             vec3 plazaCaliche = mix(vec3(0.84, 0.71, 0.56), vec3(0.74, 0.61, 0.47), fineScrub * 0.45);
             vec3 floorTarget = mix(exteriorFloor, plazaCaliche, inPlazaCourt);

             // Smoothly darken packed earth inside room footprints on the terrain mesh
             floorTarget *= mix(1.0, 0.64, smoothstep(0.35, 0.65, roomData.b));
             gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * floorTarget * 1.24, 0.85);
           }
         }

         // ------------------------------------------------------------------
         // B. ARCHITECTURAL MASONRY & ROOM-BY-ROOM VARIATION (NO MONOCHROME, ZERO ALIASING!)
         // ------------------------------------------------------------------
         float yFw = fwidth(vDesertWorldPos.y);
         float courseAtten = 1.0 - smoothstep(0.018, 0.075, yFw);

         if (uNodeTypeId >= 3.5 && uNodeTypeId <= 10.5) {
           // Per-room stone quarry & weathering variation from baked CRA polygon map (smoothly blended)
           float roomHash = roomData.r;
           float roomHashBlend = smoothstep(0.02, 0.16, roomHash);
           vec3 warmQuarry = vec3(1.07, 0.97, 0.88);
           vec3 coolUmberQuarry = vec3(0.89, 0.94, 1.02);
           vec3 roomTint = mix(coolUmberQuarry, warmQuarry, roomHash);
           float brightnessVar = 0.88 + roomHash * 0.24;
           gl_FragColor.rgb *= mix(vec3(1.0), roomTint * brightnessVar, roomHashBlend);

           // Partition wall-line mortar shadow on horizontal wall caps & floors (never on vertical wall faces!)
           float horizMask = smoothstep(0.45, 0.85, abs(vDesertWorldNormal.y));
           float mortarBand = smoothstep(0.015, 0.045, roomData.b) * (1.0 - smoothstep(0.085, 0.14, roomData.b));
           gl_FragColor.rgb *= mix(1.0, 0.85, mortarBand * horizMask);

           // Type III Banded Ashlar & Chink Spall coursing on Classic Bonito wings (fwidth anti-aliased)
           if (uNodeTypeId > 5.5 && uNodeTypeId < 6.5) {
             float spallBand = sin(vDesertWorldPos.y * 26.0 + vDesertWorldPos.x * 0.25);
             float spallDark = smoothstep(0.55, 0.92, spallBand);
             gl_FragColor.rgb *= mix(1.0, mix(1.04, 0.78, spallDark * 0.55), courseAtten);
           }

           // Old Bonito Type I tabular slab mortar joints & lichen patina (fwidth anti-aliased)
           if (uNodeTypeId > 3.5 && uNodeTypeId < 4.5) {
             float slabCourse = sin(vDesertWorldPos.y * 19.0 + desertNoise2D(vDesertWorldPos.xz * 1.8) * 1.5);
             gl_FragColor.rgb *= mix(1.0, mix(0.84, 1.05, smoothstep(-0.5, 0.6, slabCourse)), courseAtten);
           }

           // Subterranean Kiva hearth soot & plaster warmth near floor
           if (uNodeTypeId > 7.5 && uNodeTypeId < 9.5) {
             float kivaDepth = smoothstep(-2.4, 1.2, vDesertWorldPos.y);
             gl_FragColor.rgb *= mix(vec3(0.76, 0.64, 0.55), vec3(1.04, 0.96, 0.88), kivaDepth);
           }

           // Dark packed-earth interior room floors (PB_Room_Floors_And_Roofs)
           if (uNodeTypeId > 9.5 && uNodeTypeId < 10.5) {
             float earthernGrain = desertNoise2D(vDesertWorldPos.xz * 2.4);
             gl_FragColor.rgb *= mix(0.72, 0.94, earthernGrain);
           }
         }

         // ------------------------------------------------------------------
         // C. GROUND / CAVITY AMBIENT OCCLUSION & FILTERED SANDSTONE GRAIN
         // ------------------------------------------------------------------
         float hAboveGround = vDesertWorldPos.y;
         float groundContactAO = smoothstep(-2.2, 2.6, hAboveGround);
         float cavityFactor = mix(0.76, 1.0, groundContactAO);
         float strataWave = sin(vDesertWorldPos.y * 2.4 + vDesertWorldPos.x * 0.04) * 0.028;
         float grainFw = length(fwidth(vDesertWorldPos.xz));
         float grainAtten = 1.0 - smoothstep(0.03, 0.14, grainFw);
         float smoothGrain = (desertNoise2D(vDesertWorldPos.xz * 7.5 + vec2(vDesertWorldPos.y * 5.3, -vDesertWorldPos.y * 3.7)) - 0.5) * 0.032 * grainAtten;
         gl_FragColor.rgb *= clamp(cavityFactor + strataWave + smoothGrain, 0.66, 1.10);

         // ------------------------------------------------------------------
         // D. DRAMATIC ROOM FOCUS SPOTLIGHT & HOVER HIGHLIGHT
         //    Clicking a room darkens the surrounding ruin and illuminates the
         //    selected room; zooming out smoothly restores full daylight (uDimAmount -> 0).
         // ------------------------------------------------------------------
         if (uDimAmount > 0.001) {
           float outsideDim = mix(1.0, 0.16, uDimAmount);
           vec3 dimmedBg = gl_FragColor.rgb * outsideDim;

           // Focused room is brightly illuminated while preserving sandstone mortar detail
           vec3 litActiveRoom = gl_FragColor.rgb * (1.0 + 0.52 * uDimAmount) * vec3(1.10, 1.03, 0.93);
           gl_FragColor.rgb = mix(dimmedBg, litActiveRoom, clamp(activeMask, 0.0, 1.0));
         }

         // Hovering any room highlights its 3D walls and floor with warm sandstone light
         if (hoverMask > 0.01) {
           gl_FragColor.rgb *= (1.0 + hoverMask * 0.45) * mix(vec3(1.0), vec3(1.10, 1.03, 0.92), hoverMask);
         }

         #include <dithering_fragment>
        `
      );
  };
}

const CHACO_REMOTE_GLB_URL =
  'https://www.gstatic.com/aistudio/starter-apps/chaco-canyon/chaco_canyon.glb';

function loadChacoGLB(progressBar, statusEl, attempt = 1) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    const glbUrl = attempt === 2 ? CHACO_REMOTE_GLB_URL : './chaco_canyon.glb';
    loader.load(
      glbUrl,
      (gltf) => {
        gltfModel = gltf.scene;
        const maxAniso = renderer.capabilities.getMaxAnisotropy();

        gltfModel.traverse((node) => {
          if (node.isMesh) {
            node.castShadow = true;
            node.receiveShadow = true;
            pickableMeshes.push(node);

            const nName = node.name || '';
            const lowerName = nName.toLowerCase();

            // Clone material per mesh node so shared GLB materials (e.g. Mat_Chaco_Masonry_TypeIII,
            // Mat_Kiva_Plaster, Mat_Canyon_Floor) get distinct per-node shaders & colors!
            if (Array.isArray(node.material)) {
              node.material = node.material.map((m) => (m ? m.clone() : m));
            } else if (node.material) {
              node.material = node.material.clone();
            }

            const mats = Array.isArray(node.material) ? node.material : [node.material];
            for (const mat of mats) {
              if (!mat) continue;
              for (const texProp of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
                if (mat[texProp]) {
                  mat[texProp].anisotropy = maxAniso;
                  mat[texProp].needsUpdate = true;
                }
              }
              if (mat.normalMap && mat.normalScale) {
                const mName = (mat.name || '').toLowerCase();
                const strength = mName.includes('cliff')
                  ? 2.45
                  : mName.includes('masonry')
                  ? 2.35
                  : 1.75;
                mat.normalScale.set(strength, strength);
              }
              mat.envMapIntensity = 0.12;
              enhanceMaterialWithDesertShader(mat, nName, mat.name || '');
              mat.needsUpdate = true;
            }

            const primaryMatName = ((mats[0] && mats[0].name) || '').toLowerCase();
            if (
              nName === 'Chaco_Canyon_Terrain' ||
              primaryMatName.includes('canyon_floor') ||
              (lowerName.includes('terrain') && !primaryMatName.includes('cliff'))
            ) {
              terrainMesh = node;
            } else if (
              nName === 'Chacra_Mesa_Cliff_And_Fajada_Butte' ||
              (lowerName.includes('terrain') && primaryMatName.includes('cliff'))
            ) {
              cliffMesh = node;
            }

            if (nName.includes('Roof') || nName.includes('Viga') || nName.includes('Timber')) {
              roofTimberMeshes.push(node);
            }
            if (nName.includes('Threatening_Rock')) {
              threateningRockMesh = node;
            }

            // Map each GLB architectural mesh to its true dendrochronological construction stage
            const isLandscape =
              lowerName.includes('terrain') ||
              lowerName.includes('cliff') ||
              lowerName.includes('butte') ||
              lowerName.includes('threatening_rock');

            if (!isLandscape) {
              let stageCol = 'Stage_III_Wings_And_Kivas_AD1060_1085';
              if (nName.includes('Phase1_OldBonito')) {
                stageCol = 'Stage_I_Old_Bonito_AD850_935';
              } else if (nName.includes('Phase2_NorthArc')) {
                stageCol = 'Stage_II_North_4Story_Spine_AD1040_1060';
              } else if (
                nName.includes('Phase3_') ||
                nName.includes('PB_Kiva_') ||
                nName.includes('PB_Room_Floors') ||
                nName.includes('PB_Timber_')
              ) {
                stageCol = 'Stage_III_Wings_And_Kivas_AD1060_1085';
              } else if (
                nName.includes('Phase4_') ||
                nName.includes('Chetro_Ketl') ||
                nName.includes('Pueblo_Del_Arroyo') ||
                nName.includes('Casa_Rinconada')
              ) {
                stageCol = 'Stage_IV_South_Arc_And_Plaza_AD1085_1115';
              }
              if (!phaseCollections.has(stageCol)) phaseCollections.set(stageCol, []);
              phaseCollections.get(stageCol).push(node);
            }
          }
        });

        scene.add(gltfModel);
        resolve();
      },
      (xhr) => {
        if (xhr.total > 0) {
          const pct = Math.min(96, Math.round(68 + (xhr.loaded / xhr.total) * 28));
          if (progressBar) progressBar.style.width = `${pct}%`;
        }
      },
      (err) => {
        if (attempt < 3) {
          setTimeout(() => {
            loadChacoGLB(progressBar, statusEl, attempt + 1).then(resolve, reject);
          }, 300);
        } else {
          reject(err);
        }
      }
    );
  });
}

// ============================================================================
// 8. GEOREFERENCED POLYGON PICKING & TERRAIN SAMPLING
// ============================================================================
function pointInPolygon(x, y, poly) {
  if (!poly || poly.length < 3) return false;
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0],
      yi = poly[i][1];
    const xj = poly[j][0],
      yj = poly[j][1];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function findFeatureAtWorldPoint(worldX, worldZ, meshName = '') {
  if (meshName.includes('Threatening_Rock')) {
    return featureById.get('landmark_threatening_rock');
  }
  if (meshName.includes('Casa_Rinconada')) {
    return featureById.get('landmark_casa_rinconada');
  }
  if (meshName.includes('Fajada_Butte') && worldZ > 110 && worldX > 180) {
    return featureById.get('landmark_fajada_butte');
  }

  const planX = worldX;
  const planY = -worldZ;

  if (!chacoData || !chacoData.features) return null;

  // 1. Exact point-in-polygon or kiva radius containment FIRST (so every single CRA room & kiva is accurately pickable!)
  for (const f of chacoData.features) {
    if (f.subcourt) continue;
    if (f.polygon && pointInPolygon(planX, planY, f.polygon)) {
      return f;
    }
    if ((f.category === 'kiva' || f.category === 'great_kiva') && f.radius_m) {
      const d = Math.hypot((f.cx || 0) - planX, (f.cy || 0) - planY);
      if (d <= f.radius_m + 0.6) return f;
    }
  }

  // 2. Check if on a bounding wall within 3.2m of a CRA Discovery room
  let closestDiscFeat = null;
  let closestDiscDist = 3.2;
  for (const disc of CRA_DISCOVERIES) {
    const f = featureById.get(disc.id);
    if (!f) continue;
    const d = Math.hypot((f.cx || 0) - planX, (f.cy || 0) - planY);
    if (d < closestDiscDist) {
      closestDiscDist = d;
      closestDiscFeat = f;
    }
  }
  if (closestDiscFeat) return closestDiscFeat;

  // 3. Fallback: closest room/kiva center within 5.5m (only when clicking/hovering near masonry walls)
  if (meshName !== 'Chaco_Canyon_Terrain' && !meshName.toLowerCase().includes('terrain')) {
    let bestFeat = null;
    let bestDist = 5.5;
    for (const f of chacoData.features) {
      if (f.subcourt) continue;
      const d = Math.hypot((f.cx || 0) - planX, (f.cy || 0) - planY);
      if (d < bestDist) {
        bestDist = d;
        bestFeat = f;
      }
    }
    return bestFeat;
  }
  return null;
}

function sampleGroundElevation(worldX, worldZ) {
  const targets = [];
  if (terrainMesh) targets.push(terrainMesh);
  if (cliffMesh && (worldZ < -38 || (worldX > 180 && worldZ > 110))) {
    targets.push(cliffMesh);
  }
  if (targets.length === 0) return 0.0;

  downOrigin.set(worldX, 140.0, worldZ);
  downRaycaster.set(downOrigin, downDir);
  const hits = downRaycaster.intersectObjects(targets, false);
  if (hits.length > 0) {
    return hits[0].point.y;
  }
  return 0.0;
}

function computeSmartWalkEyeY(worldX, worldZ) {
  const groundY = sampleGroundElevation(worldX, worldZ);
  let baseEyeY = groundY + walkElevationOffset;

  if (chacoData && chacoData.features && walkElevationOffset < 8.0) {
    const planX = worldX;
    const planY = -worldZ;
    for (const f of chacoData.features) {
      if (f.category === 'room' && f.polygon) {
        const dx = (f.cx || 0) - planX;
        const dy = (f.cy || 0) - planY;
        if (dx * dx + dy * dy < 144.0 && pointInPolygon(planX, planY, f.polygon)) {
          const roofHeight = Math.min(8.5, (f.height_m || 4.2) + 1.35);
          baseEyeY = Math.max(baseEyeY, groundY + roofHeight);
          break;
        }
      }
    }
  }
  return baseEyeY;
}

// ============================================================================
// 9. SOLAR SIGHTLINES, NIGHT FIRES, GOLDEN DUST & 3D DISCOVERY BEACONS
// ============================================================================
function buildSolarAlignmentVectors() {
  alignmentGroup.clear();
  sightlinePulses.length = 0;
  sightlineLinesByKey.clear();

  // Two Perpendicular Cardinal Axes of Pueblo Bonito's D-Shaped Footprint (NASA EO-5678):
  // 1. North–South Perpendicular Bisector (Central Dividing Wall pointing True North)
  // 2. East–West Southern Wall Axis (Straight Southern Facade aligned to Equinox sunrise/sunset)
  const cardinalAxes = [
    {
      key: 'meridian_noon',
      pts: [
        new THREE.Vector3(-11.5, 1.8, -82.0),
        new THREE.Vector3(-11.5, 1.8, 78.0),
      ],
      color: 0xffe46b,
    },
    {
      key: 'equinox_wall',
      pts: [
        new THREE.Vector3(88.0, 2.0, 38.0),
        new THREE.Vector3(-88.0, 2.0, 38.0),
      ],
      color: 0xf8d040,
    },
  ];

  for (const s of cardinalAxes) {
    const geom = new THREE.BufferGeometry().setFromPoints(s.pts);
    const mat = new THREE.LineDashedMaterial({
      color: s.color,
      dashSize: 3.2,
      gapSize: 1.8,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    line.userData.alignKey = s.key;
    alignmentGroup.add(line);
    sightlineLinesByKey.set(s.key, line);
  }

  // Keep roomCompassGroup empty and hidden so rooms stay clean and grounded
  roomCompassGroup = new THREE.Group();
  roomCompassGroup.visible = false;
  scene.add(roomCompassGroup);
}

function buildNightKivaFires() {
  fireLightsGroup.clear();
  // Exact 3D masonry firebox coordinates inside 8 real standing Pueblo Bonito kivas (verified against PB_Kiva_Masonry_Walls in chaco_canyon.glb)
  // Seated directly on the top surface of each subterranean kiva firebox so hearth embers never float or drift outside the kiva walls!
  const kivaHearths = [
    { name: 'Great Kiva A', x: -8.33, emberY: -2.20, lightY: -0.85, z: 22.02, r: 0.56 },
    { name: 'Great Kiva Q', x: -23.15, emberY: -2.20, lightY: -0.85, z: -12.69, r: 0.52 },
    { name: 'Kiva L', x: 24.79, emberY: -1.55, lightY: -0.55, z: -4.29, r: 0.36 },
    { name: 'Kiva G', x: 39.39, emberY: -1.55, lightY: -0.55, z: -3.15, r: 0.36 },
    { name: 'Kiva D', x: 61.07, emberY: -1.55, lightY: -0.55, z: 25.86, r: 0.38 },
    { name: 'Kiva R', x: -34.35, emberY: -1.80, lightY: -0.65, z: -18.43, r: 0.38 },
    { name: 'Kiva B', x: -6.83, emberY: -1.80, lightY: -0.65, z: 39.47, r: 0.36 },
    { name: 'Kiva 16', x: -17.21, emberY: -1.80, lightY: -0.65, z: -24.81, r: 0.38 },
  ];

  for (const h of kivaHearths) {
    const pLight = new THREE.PointLight(0xff7728, 0, 42, 1.45);
    pLight.position.set(h.x, h.lightY, h.z);
    pLight.userData.baseY = h.lightY;
    pLight.userData.phase = Math.random() * Math.PI * 2;
    fireLightsGroup.add(pLight);

    // Hearth ember bed seated directly inside the masonry firebox on the kiva floor
    const emberGeo = new THREE.CylinderGeometry(h.r, h.r * 1.15, 0.24, 16);
    const emberMat = new THREE.MeshBasicMaterial({ color: 0xff8a2b });
    const emberMesh = new THREE.Mesh(emberGeo, emberMat);
    emberMesh.position.set(h.x, h.emberY, h.z);
    fireLightsGroup.add(emberMesh);

    const coreGeo = new THREE.SphereGeometry(h.r * 0.65, 12, 10);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffd175 });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.scale.set(1.0, 0.55, 1.0);
    coreMesh.position.set(h.x, h.emberY + 0.12, h.z);
    fireLightsGroup.add(coreMesh);
  }
  fireLightsGroup.visible = false;
}

function buildDesertDustParticles() {
  const count = 550;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 190.0;
    positions[i * 3 + 1] = 1.2 + Math.random() * 24.0;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 140.0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xffdca8,
    size: 0.42,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  dustParticles = new THREE.Points(geo, mat);
  scene.add(dustParticles);
}

function buildAccurateRoomInteriors() {
  if (!roomInteriorsGroup) return;
  roomInteriorsGroup.clear();

  // Procedural coursed sandstone canvas texture so interior partition walls, benches & jambs match the GLB masonry
  const stoneCanvas = document.createElement('canvas');
  stoneCanvas.width = 256;
  stoneCanvas.height = 256;
  const sCtx = stoneCanvas.getContext('2d');
  sCtx.fillStyle = '#9c714a';
  sCtx.fillRect(0, 0, 256, 256);
  const rowH = 16;
  for (let y = 0; y < 256; y += rowH) {
    const isThinChink = (y / rowH) % 3 === 1;
    const h = isThinChink ? 8 : rowH - 2;
    const offset = ((y / rowH) % 2) * 28;
    for (let x = -32; x < 256; x += 56) {
      const shade = 0.88 + (((x * 17 + y * 31) & 15) / 15) * 0.22;
      const r = Math.round(186 * shade);
      const g = Math.round(138 * shade);
      const b = Math.round(94 * shade);
      sCtx.fillStyle = `rgb(${r},${g},${b})`;
      sCtx.fillRect(x + offset + 1, y + 1, 53, h);
    }
  }
  const stoneTex = new THREE.CanvasTexture(stoneCanvas);
  stoneTex.wrapS = THREE.RepeatWrapping;
  stoneTex.wrapT = THREE.RepeatWrapping;
  stoneTex.repeat.set(2, 2);
  stoneTex.colorSpace = THREE.SRGBColorSpace;

  // Procedural Ponderosa pine plank & beam grain texture
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 128;
  woodCanvas.height = 128;
  const wCtx = woodCanvas.getContext('2d');
  wCtx.fillStyle = '#6e492b';
  wCtx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 64; i++) {
    wCtx.fillStyle = i % 2 === 0 ? 'rgba(42, 24, 12, 0.22)' : 'rgba(138, 96, 58, 0.16)';
    wCtx.fillRect(0, i * 2, 128, 1);
  }
  const woodTex = new THREE.CanvasTexture(woodCanvas);
  woodTex.wrapS = THREE.RepeatWrapping;
  woodTex.wrapT = THREE.RepeatWrapping;
  woodTex.colorSpace = THREE.SRGBColorSpace;

  const earthenFloorMat = new THREE.MeshStandardMaterial({
    color: 0x684d36,
    roughness: 0.96,
    metalness: 0.01,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1.0,
    polygonOffsetUnits: -2.0,
  });
  const pinePlankMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xc89666,
    roughness: 0.86,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -3.0,
  });
  const agedWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x9e724a,
    roughness: 0.90,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -3.0,
  });
  const charredWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0x3b2e25,
    roughness: 0.94,
    metalness: 0.01,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -3.0,
  });
  const masonryStoneMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0xd8b48e,
    roughness: 0.88,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1.4,
    polygonOffsetUnits: -2.8,
  });
  const darkMasonryMat = new THREE.MeshStandardMaterial({
    map: stoneTex,
    color: 0xb08963,
    roughness: 0.92,
    metalness: 0.02,
    polygonOffset: true,
    polygonOffsetFactor: -1.6,
    polygonOffsetUnits: -3.2,
  });
  const recessVoidMat = new THREE.MeshStandardMaterial({
    color: 0x120d09,
    roughness: 0.98,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -4.0,
  });
  const hearthAshMat = new THREE.MeshStandardMaterial({
    color: 0x3b322c,
    roughness: 0.96,
    metalness: 0.01,
    polygonOffset: true,
    polygonOffsetFactor: -2.0,
    polygonOffsetUnits: -4.0,
  });

  // Helper: build exact CRA polygon packed-earth floor slab at yFloor (inset 6% so edges never poke through vertical room walls)
  const addExcavatedPolygonFloor = (roomId, yFloor) => {
    const feat = featureById.get(roomId);
    if (!feat || !Array.isArray(feat.polygon) || feat.polygon.length < 3) return;
    const rcx = feat.cx || 0;
    const rcy = feat.cy || 0;
    const shape = new THREE.Shape();
    feat.polygon.forEach(([px, py], idx) => {
      const ix = rcx + (px - rcx) * 0.94;
      const iy = rcy + (py - rcy) * 0.94;
      if (idx === 0) shape.moveTo(ix, iy);
      else shape.lineTo(ix, iy);
    });
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, earthenFloorMat);
    mesh.position.y = yFloor;
    mesh.receiveShadow = true;
    roomInteriorsGroup.add(mesh);
  };

  // Helper: build a documented doorway frame (stone jambs, threshold sill, multi-pole pine lintel & dark recess)
  const createDoorwayStructure = (width = 0.56, height = 0.95, depth = 0.36, isTShaped = false) => {
    const doorGrp = new THREE.Group();
    if (!isTShaped) {
      const voidBox = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth * 0.7), recessVoidMat);
      voidBox.position.set(0, height * 0.5, 0);
      doorGrp.add(voidBox);

      for (const sx of [-1, 1]) {
        const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, height, depth), masonryStoneMat);
        jamb.position.set(sx * (width * 0.5 + 0.07), height * 0.5, 0);
        jamb.castShadow = true;
        doorGrp.add(jamb);
      }
      const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.32, 0.08, depth + 0.08), darkMasonryMat);
      sill.position.set(0, 0.04, 0);
      doorGrp.add(sill);

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, 0.11, depth + 0.06), pinePlankMat);
      lintel.position.set(0, height + 0.055, 0);
      lintel.castShadow = true;
      doorGrp.add(lintel);
    } else {
      // HABS No. NM-30 (LOC nm0107) T-Shaped Doorway: narrower lower jamb (0.52m), wider upper shoulders (0.88m)
      const lowerH = height * 0.46;
      const upperH = height * 0.54;
      const lowerW = width * 0.62;
      const upperW = width;

      const lowerVoid = new THREE.Mesh(new THREE.BoxGeometry(lowerW, lowerH, depth * 0.7), recessVoidMat);
      lowerVoid.position.set(0, lowerH * 0.5, 0);
      doorGrp.add(lowerVoid);

      const upperVoid = new THREE.Mesh(new THREE.BoxGeometry(upperW, upperH, depth * 0.7), recessVoidMat);
      upperVoid.position.set(0, lowerH + upperH * 0.5, 0);
      doorGrp.add(upperVoid);

      for (const sx of [-1, 1]) {
        const lowerShoulder = new THREE.Mesh(
          new THREE.BoxGeometry((upperW - lowerW) * 0.5 + 0.14, lowerH, depth),
          masonryStoneMat
        );
        lowerShoulder.position.set(sx * (lowerW * 0.5 + ((upperW - lowerW) * 0.25 + 0.07)), lowerH * 0.5, 0);
        lowerShoulder.castShadow = true;
        doorGrp.add(lowerShoulder);

        const upperJamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, upperH, depth), masonryStoneMat);
        upperJamb.position.set(sx * (upperW * 0.5 + 0.07), lowerH + upperH * 0.5, 0);
        upperJamb.castShadow = true;
        doorGrp.add(upperJamb);
      }

      const sill = new THREE.Mesh(new THREE.BoxGeometry(lowerW + 0.36, 0.08, depth + 0.08), darkMasonryMat);
      sill.position.set(0, 0.04, 0);
      doorGrp.add(sill);

      // Multi-pole Ponderosa pine lintel across top of T-doorway
      for (let p = -1; p <= 1; p++) {
        const pole = new THREE.Mesh(
          new THREE.CylinderGeometry(0.045, 0.045, upperW + 0.48, 10),
          pinePlankMat
        );
        pole.rotation.z = Math.PI * 0.5;
        pole.position.set(0, height + 0.05, p * 0.09);
        pole.castShadow = true;
        doorGrp.add(pole);
      }
    }
    return doorGrp;
  };

  // 1. ROOM 33 (pueblo_bonito_380): [-32.77, 4.30, -32.43], 2.0m x 1.8m Type I Crypt
  //    Documented architectural structures (Pepper 1909):
  //    - Hand-hewn Ponderosa pine plank floor divide separating Upper & Sub-Floor burial strata
  //    - 4 vertical corner Ponderosa pine roof-support posts (NE, NW, SE, SW corners)
  //    - Narrow south interior doorway frame & stone lintel connecting to Room 32
  //    - Socketed Ponderosa pine roof vigas
  {
    addExcavatedPolygonFloor('pueblo_bonito_380', 4.28);
    const g = new THREE.Group();
    g.position.set(-32.77, 4.30, -32.43);
    g.rotation.y = -0.38;

    // Hand-hewn Ponderosa pine plank floor level (Pepper 1909)
    for (let i = -2; i <= 2; i++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.05, 1.38), pinePlankMat);
      plank.position.set(i * 0.25, 0.03, 0);
      plank.receiveShadow = true;
      plank.castShadow = true;
      g.add(plank);
    }

    // 4 vertical corner Ponderosa pine posts documented by Pepper (1909) in Room 33
    for (const [px, pz] of [[-0.68, -0.62], [0.68, -0.62], [-0.68, 0.62], [0.68, 0.62]]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.075, 1.65, 10), agedWoodMat);
      post.position.set(px, 0.82, pz);
      post.castShadow = true;
      g.add(post);
    }

    // Narrow south entry doorway frame from Room 32
    const southDoor = createDoorwayStructure(0.50, 0.82, 0.30, false);
    southDoor.position.set(0.0, 0.0, 0.78);
    g.add(southDoor);

    // Exposed Ponderosa pine ceiling vigas across top of chamber
    for (const vz of [-0.45, 0.0, 0.45]) {
      const viga = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 1.68, 10), pinePlankMat);
      viga.rotation.z = Math.PI * 0.5;
      viga.position.set(0, 1.58, vz);
      viga.castShadow = true;
      g.add(viga);
    }
    roomInteriorsGroup.add(g);
  }

  // 2. ROOM 28 (pueblo_bonito_240 + pueblo_bonito_377: originally part of a longer Old Bonito room before partitioning/remodeling)
  //    Documented architectural structures (Pepper 1920; HEE Photos 108, 109, 184):
  //    - Later transverse masonry partition wall dividing the earlier longer Old Bonito chamber
  //    - Enfilade doorway with tabular sandstone lintel (visible in 1896 HEE Photo 108)
  //    - Reconstructed charred Ponderosa pine 2nd-story floor vigas from terminal fire
  {
    addExcavatedPolygonFloor('pueblo_bonito_240', 3.93);
    addExcavatedPolygonFloor('pueblo_bonito_377', 3.93);
    const g = new THREE.Group();
    g.position.set(-24.41, 3.95, -30.66);
    g.rotation.y = -0.36;

    // Later transverse masonry partition wall dividing the remodeled Room 28 space (AMNH HEE Photo 184)
    const partWall = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.65, 2.15), masonryStoneMat);
    partWall.position.set(-1.35, 0.82, 0.0);
    partWall.castShadow = true;
    partWall.receiveShadow = true;
    g.add(partWall);

    // Enfilade doorway with stone lintel in NE wall (HEE Photo 108)
    const neDoor = createDoorwayStructure(0.58, 1.05, 0.34, false);
    neDoor.position.set(0.65, 0.0, -0.88);
    g.add(neDoor);

    // Interpretive reconstructed low masonry bench along north wall
    const northBench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.32, 0.42), darkMasonryMat);
    northBench.position.set(0.25, 0.16, -0.72);
    northBench.receiveShadow = true;
    g.add(northBench);

    // Reconstructed charred Ponderosa pine 2nd-story floor vigas recorded by Pepper (1896)
    for (const vx of [-0.85, -0.15, 0.55, 1.25]) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.15, 10), charredWoodMat);
      beam.rotation.x = Math.PI * 0.5;
      beam.position.set(vx, 1.48, 0.0);
      beam.castShadow = true;
      g.add(beam);
    }
    roomInteriorsGroup.add(g);
  }

  // 3. ROOM 32 (pueblo_bonito_8): [-30.77, 4.40, -33.03]
  //    Documented architectural structures (HEE Photo 120):
  //    - Stepped masonry floor ledge / bench along west & north wall
  //    - North doorway threshold & stone lintel leading into Room 33
  //    - Reconstructed socketed Ponderosa pine roof viga beams
  {
    addExcavatedPolygonFloor('pueblo_bonito_8', 4.38);
    const g = new THREE.Group();
    g.position.set(-30.77, 4.40, -33.03);
    g.rotation.y = -0.36;

    // Stepped masonry bench along west wall (visible in 1896 HEE Photo 120)
    const westBench = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 1.65), masonryStoneMat);
    westBench.position.set(-0.68, 0.19, 0.0);
    westBench.castShadow = true;
    westBench.receiveShadow = true;
    g.add(westBench);

    // North doorway frame connecting to Room 33
    const northDoor = createDoorwayStructure(0.52, 0.88, 0.32, false);
    northDoor.position.set(-0.22, 0.0, -0.78);
    g.add(northDoor);

    // Reconstructed socketed Ponderosa pine roof vigas
    for (const vz of [-0.42, 0.28]) {
      const viga = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.75, 10), agedWoodMat);
      viga.rotation.z = Math.PI * 0.5;
      viga.position.set(0, 1.45, vz);
      viga.castShadow = true;
      g.add(viga);
    }
    roomInteriorsGroup.add(g);
  }

  // 4. ROOM 38 (pueblo_bonito_352): [-12.33, 3.45, -39.94]
  //    Interpretive interior reconstruction of the Room 38 macaw context (Pepper 1920):
  //    - 14 scarlet macaw skeletons recovered (12 in room fill, 2 in subfloor pits)
  {
    addExcavatedPolygonFloor('pueblo_bonito_352', 3.43);
    const g = new THREE.Group();
    g.position.set(-12.33, 3.45, -39.94);

    // Interpretive reconstructed plastered aviary wall bench along north wall
    const aviaryLedge = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.36, 0.44), darkMasonryMat);
    aviaryLedge.position.set(0.0, 0.18, -0.76);
    aviaryLedge.receiveShadow = true;
    g.add(aviaryLedge);

    // Interpretive reconstructed upper wall vent apertures on North Wall
    for (const [vx, vw] of [[-0.58, 0.46], [0.58, 0.64]]) {
      const ventFrame = createDoorwayStructure(vw, 0.58, 0.28, false);
      ventFrame.position.set(vx, 1.05, -0.88);
      g.add(ventFrame);
    }

    // Interpretive reconstructed East wall doorway
    const eastDoor = createDoorwayStructure(0.64, 0.92, 0.30, false);
    eastDoor.rotation.y = Math.PI * 0.5;
    eastDoor.position.set(1.18, 0.0, 0.0);
    g.add(eastDoor);

    // Two sub-floor pits where 2 of the 14 scarlet macaws were buried (Pepper 1920)
    for (const px of [-0.48, 0.48]) {
      const pitRim = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.12, 0.58), masonryStoneMat);
      pitRim.position.set(px, 0.06, 0.22);
      g.add(pitRim);
      const pitCenter = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.14, 0.40), hearthAshMat);
      pitCenter.position.set(px, 0.065, 0.22);
      g.add(pitCenter);
    }
    roomInteriorsGroup.add(g);
  }

  // 5. GREAT KIVA A (pueblo_bonito_159): chaco_canyon.glb already includes the 4 large square
  //    rubble-filled masonry columns, paired sub-floor vaults, central firebox,
  //    southern deflector wall, double concentric masonry bench, and northern antechamber stairway.

  // 6. ROOM 249 (pueblo_bonito_257): [50.98, 1.65, 10.43]
  //    Interpretive interior reconstruction of the macaw-keeping room (Judd 1954)
  {
    addExcavatedPolygonFloor('pueblo_bonito_257', 1.63);
    const g = new THREE.Group();
    g.position.set(50.98, 1.65, 10.43);

    // Interpretive reconstructed T-shaped doorway profile
    const tDoor = createDoorwayStructure(0.92, 1.48, 0.38, true);
    tDoor.rotation.y = Math.PI * 0.5;
    tDoor.position.set(-0.92, 0.0, 0.0);
    g.add(tDoor);

    // Reconstructed socketed pine ceiling/perch beams documented by Judd (1954)
    for (const pz of [-0.48, 0.38]) {
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.95, 10), pinePlankMat);
      beam.rotation.z = Math.PI * 0.5;
      beam.position.set(0, 1.32, pz);
      beam.castShadow = true;
      g.add(beam);
    }
    roomInteriorsGroup.add(g);
  }

  // 7. ROOM 168 (pueblo_bonito_231): [30.86, 0.26, 39.87]
  //    Southeastern Lapidary & Craft Activity Sector (Interpretive Interior Reconstruction)
  {
    addExcavatedPolygonFloor('pueblo_bonito_231', 0.26);
    const g = new THREE.Group();
    g.position.set(30.86, 0.26, 39.87);

    const enfiladeDoor = createDoorwayStructure(0.62, 1.12, 0.36, false);
    enfiladeDoor.position.set(0.0, 0.0, -0.85);
    g.add(enfiladeDoor);

    const storageBench = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.34, 0.44), darkMasonryMat);
    storageBench.position.set(0.0, 0.17, 0.55);
    storageBench.receiveShadow = true;
    g.add(storageBench);

    roomInteriorsGroup.add(g);
  }

  // 8. ROOM 228 (pueblo_bonito_9): [52.53, 3.92, 33.72]
  //    Documented 120° ESE Diagonal Corner Solstice Window (Reyman 1976 Science)
  {
    addExcavatedPolygonFloor('pueblo_bonito_9', 3.92);
    const g = new THREE.Group();
    g.position.set(52.53, 3.92, 33.72);

    // 120° ESE diagonal corner window aperture frame in southeastern corner
    const cornerWindow = createDoorwayStructure(0.46, 0.58, 0.42, false);
    cornerWindow.rotation.y = -Math.PI * 0.33; // 120° ESE azimuth
    cornerWindow.position.set(0.78, 0.68, 0.68);
    g.add(cornerWindow);

    // Opposite interior west wall target slab where the Winter Solstice sunrise beam lands
    const targetSlab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.85, 0.85), masonryStoneMat);
    targetSlab.position.set(-0.85, 0.55, -0.35);
    g.add(targetSlab);

    // 3D Volumetric Winter Solstice Sunrise Beam & Moving Target Wall Projection
    solsticeBeamGroup = new THREE.Group();
    const winPos = new THREE.Vector3(0.68, 0.70, 0.58);
    const wallHitPos = new THREE.Vector3(-0.78, 0.55, -0.35);
    const beamVec = new THREE.Vector3().subVectors(wallHitPos, winPos);
    const beamLen = beamVec.length();
    const beamMid = new THREE.Vector3().addVectors(winPos, wallHitPos).multiplyScalar(0.5);
    const beamQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      beamVec.clone().normalize()
    );

    solsticeBeamOuterMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.08, beamLen, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffcf48,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    solsticeBeamOuterMesh.position.copy(beamMid);
    solsticeBeamOuterMesh.quaternion.copy(beamQuat);
    solsticeBeamGroup.add(solsticeBeamOuterMesh);

    solsticeBeamCoreMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.038, beamLen, 16, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xfff3b0,
        transparent: true,
        opacity: 0.46,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    solsticeBeamCoreMesh.position.copy(beamMid);
    solsticeBeamCoreMesh.quaternion.copy(beamQuat);
    solsticeBeamGroup.add(solsticeBeamCoreMesh);

    solsticeWallPatchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24, 0.34),
      new THREE.MeshBasicMaterial({
        color: 0xffe885,
        transparent: true,
        opacity: 0.82,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    solsticeWallPatchMesh.position.set(-0.77, 0.55, -0.35);
    solsticeWallPatchMesh.rotation.y = Math.PI / 2;
    solsticeBeamGroup.add(solsticeWallPatchMesh);

    solsticeFloorPatchMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.22, 1.35),
      new THREE.MeshBasicMaterial({
        color: 0xffcb45,
        transparent: true,
        opacity: 0.22,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    solsticeFloorPatchMesh.rotation.x = -Math.PI / 2;
    solsticeFloorPatchMesh.rotation.z = -Math.PI * 0.33;
    solsticeFloorPatchMesh.position.set(-0.05, 0.03, 0.12);
    solsticeBeamGroup.add(solsticeFloorPatchMesh);

    solsticeWindowLight = new THREE.PointLight(0xffcf55, 2.4, 5.5, 1.4);
    solsticeWindowLight.position.set(-0.35, 0.65, -0.10);
    solsticeBeamGroup.add(solsticeWindowLight);

    g.add(solsticeBeamGroup);
    roomInteriorsGroup.add(g);
  }

  // 9. ROOM 326 (pueblo_bonito_406): [-58.80, 3.50, 0.52]
  //    Old Bonito Architectural Block (~AD 860–935 construction) with later mortuary modifications
  {
    addExcavatedPolygonFloor('pueblo_bonito_406', 3.48);
    const g = new THREE.Group();
    g.position.set(-58.80, 3.50, 0.52);

    // Doorway threshold & stone plug between Room 320 and Room 326 (NAA Photo 0935)
    const clusterDoor = createDoorwayStructure(0.58, 0.96, 0.36, false);
    clusterDoor.position.set(0.0, 0.0, -0.82);
    g.add(clusterDoor);

    // Metate stone step & flat sandstone paving slabs across floor (matching NAA 0935)
    const metateStep = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.16, 0.36), masonryStoneMat);
    metateStep.position.set(0.0, 0.08, -0.45);
    metateStep.castShadow = true;
    g.add(metateStep);

    for (const [sx, sz, sw, sd, rot] of [
      [-0.42, -0.15, 0.55, 0.42, 0.12],
      [0.38, -0.08, 0.52, 0.46, -0.08],
      [-0.25, 0.42, 0.64, 0.48, 0.05],
      [0.42, 0.48, 0.58, 0.44, -0.14],
    ]) {
      const slab = new THREE.Mesh(new THREE.BoxGeometry(sw, 0.05, sd), darkMasonryMat);
      slab.rotation.y = rot;
      slab.position.set(sx, 0.025, sz);
      slab.receiveShadow = true;
      g.add(slab);
    }
    roomInteriorsGroup.add(g);
  }

  // 10. GREAT KIVA Q (pueblo_bonito_170): [-23.15, -2.80, -11.68]
  //     Show four LARGE WOODEN ROOF-SUPPORT POSTS seated in its circular masonry settings
  //     (distinct from the massive square rubble-filled masonry columns of Great Kiva A).
  {
    const kivaQPostsGroup = new THREE.Group();
    const kivaQCollarCenters = [
      [-25.11, -13.64],
      [-25.11, -9.72],
      [-21.19, -13.64],
      [-21.19, -9.72],
    ];
    for (const [px, pz] of kivaQCollarCenters) {
      // Large cylindrical Ponderosa pine roof-support post (reconstructed height to kiva rim)
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.43, 2.95, 24),
        agedWoodMat
      );
      post.position.set(px, -1.28, pz);
      post.castShadow = true;
      post.receiveShadow = true;
      kivaQPostsGroup.add(post);

      // Stone seating collar cap ring at the base of the wooden post
      const seatingCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.55, 0.58, 0.12, 24),
        darkMasonryMat
      );
      seatingCap.position.set(px, -2.30, pz);
      seatingCap.receiveShadow = true;
      kivaQPostsGroup.add(seatingCap);
    }
    roomInteriorsGroup.add(kivaQPostsGroup);
  }

  // 11. KIVA O (pueblo_bonito_131): [13.86, -0.35, -7.00]
  //     Because Kiva O remains largely unexcavated, avoid showing a detailed excavated floor/hearth
  //     as if archaeologically verified; cover the lower generic floor with unexcavated earthen fill.
  {
    const kivaOUnexcavatedGroup = new THREE.Group();
    const earthenFill = new THREE.Mesh(
      new THREE.CylinderGeometry(4.46, 4.35, 1.38, 36),
      earthenFloorMat
    );
    earthenFill.position.set(13.86, -0.90, -7.0);
    earthenFill.receiveShadow = true;
    kivaOUnexcavatedGroup.add(earthenFill);

    const upperFillMound = new THREE.Mesh(
      new THREE.CylinderGeometry(3.35, 4.25, 0.26, 32),
      earthenFloorMat
    );
    upperFillMound.position.set(13.86, -0.14, -7.0);
    upperFillMound.receiveShadow = true;
    kivaOUnexcavatedGroup.add(upperFillMound);

    roomInteriorsGroup.add(kivaOUnexcavatedGroup);
  }
}

function build3DLabelsAndDiscoveryBeacons() {
  discoveryMarkersGroup.clear();

  // 1. Major Site Landmarks
  const siteHeaders = [
    { text: 'PUEBLO BONITO (~800 ROOMS)', pos: [0, 22.0, -44], featId: 'pueblo_bonito_159' },
  ];

  for (const sh of siteHeaders) {
    const el = document.createElement('div');
    el.className = 'label-3d label-site';
    el.textContent = sh.text;
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDiscoveryOrFeatureById(sh.featId, true);
    });
    const labelObj = new CSS2DObject(el);
    labelObj.position.set(...sh.pos);
    labelObj.userData.isSiteHeader = true;
    scene.add(labelObj);
    cssLabels.push(labelObj);
  }

  // 2. 12 Curated Archival Room Plaques
  for (const disc of CRA_DISCOVERIES) {
    const feat = featureById.get(disc.id);
    const el = document.createElement('div');
    el.className = 'label-3d discovery-beacon';
    if (visitedDiscoveries.has(disc.id)) el.classList.add('visited');
    el.textContent = disc.shortPin;
    el.title = disc.beaconLabel;
    el.addEventListener('pointerenter', (e) => {
      if (feat) setHoveredFeature(feat, e.clientX, e.clientY);
    });
    el.addEventListener('pointerleave', () => {
      setHoveredFeature(null);
    });
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      if (guidedWalkActive) stopGuidedWalk();
      selectDiscoveryOrFeatureById(disc.id, true);
    });

    const labelObj = new CSS2DObject(el);
    labelObj.position.set(...disc.beaconPos);
    labelObj.userData.discoveryId = disc.id;
    scene.add(labelObj);
    cssLabels.push(labelObj);
    discoveryBeaconEls.set(disc.id, el);
  }

  // 2B. Kiva O Interpretive Interior Reconstruction Badge (Visible in 3D when inspecting Kiva O)
  {
    const kivaOEl = document.createElement('div');
    kivaOEl.className = 'label-3d label-interpretive-kiva';
    kivaOEl.textContent = 'KIVA O • INTERPRETIVE INTERIOR RECONSTRUCTION';
    kivaOEl.title = 'Kiva O remains largely unexcavated; modeled interior features are interpretive.';
    kivaOEl.addEventListener('click', (e) => {
      e.stopPropagation();
      selectDiscoveryOrFeatureById('pueblo_bonito_131', true);
    });
    const kivaOLabelObj = new CSS2DObject(kivaOEl);
    kivaOLabelObj.position.set(13.86, 1.35, -7.0);
    kivaOLabelObj.userData.isInterpretiveKivaLabel = true;
    scene.add(kivaOLabelObj);
    cssLabels.push(kivaOLabelObj);
  }

  // 3. Documented 3D Architectural Structure Callout Labels
  const structureDetailLabels = [
    // Room 33 (with Upper Room 58)
    { roomId: 'pueblo_bonito_380', text: 'Reconstructed Pine Plank Floor (Pepper 1909)', pos: [-32.77, 4.45, -32.43] },
    { roomId: 'pueblo_bonito_380', text: 'South Entry Doorway from Room 32 (Reconstructed)', pos: [-32.48, 5.15, -31.70] },
    { roomId: 'pueblo_bonito_380', text: 'Upper Room 58 (Reconstructed 2nd-Story Chamber)', pos: [-33.35, 6.15, -32.95] },
    // Room 28
    { roomId: 'pueblo_bonito_240', text: 'Remodeled Room 28 Partition Wall (Interpretive Reconstruction)', pos: [-25.65, 5.45, -30.18] },
    { roomId: 'pueblo_bonito_240', text: 'Enfilade Doorway Lintel (HEE Photo 108)', pos: [-23.52, 5.15, -31.25] },
    { roomId: 'pueblo_bonito_240', text: 'Reconstructed Charred 2nd-Story Viga Beams (Pepper 1920)', pos: [-24.10, 5.55, -30.50] },
    // Room 32
    { roomId: 'pueblo_bonito_8', text: 'Stepped Masonry Wall Ledge (HEE Photo 120)', pos: [-31.42, 4.85, -32.80] },
    { roomId: 'pueblo_bonito_8', text: 'North Doorway Threshold to Room 33 (Reconstructed)', pos: [-30.68, 5.30, -33.75] },
    // Room 38
    { roomId: 'pueblo_bonito_352', text: 'North Wall & Upper Vents (Interpretive Reconstruction)', pos: [-12.33, 5.15, -40.82] },
    { roomId: 'pueblo_bonito_352', text: 'Subfloor Macaw Pits (2 of 14 Macaws; Interpretive Reconstruction)', pos: [-12.33, 3.65, -39.72] },
    // Great Kiva A
    { roomId: 'pueblo_bonito_159', text: '4 Square Rubble-Filled Masonry Columns (NPS #4)', pos: [-5.88, -0.45, 18.94] },
    { roomId: 'pueblo_bonito_159', text: 'Subfloor Masonry Vaults (NPS #3)', pos: [-10.58, -1.65, 21.54] },
    { roomId: 'pueblo_bonito_159', text: 'Raised Central Firebox & Deflector (NPS #7–8)', pos: [-8.33, -1.45, 22.15] },
    { roomId: 'pueblo_bonito_159', text: 'North Antechamber Stairway (NPS #1)', pos: [-8.33, -0.55, 15.60] },
    { roomId: 'pueblo_bonito_159', text: '34 Wall Niches & Concentric Bench (NPS #2, #6)', pos: [-14.15, -1.15, 21.04] },
    // Room 249
    { roomId: 'pueblo_bonito_257', text: 'East Wing Doorway (Interpretive Reconstruction)', pos: [50.06, 2.85, 10.43] },
    { roomId: 'pueblo_bonito_257', text: 'Reconstructed Wooden Wall Perches & Vigas (Judd 1954)', pos: [50.98, 3.15, 10.43] },
    // Room 168
    { roomId: 'pueblo_bonito_231', text: 'Reconstructed Interior Doorway (Interpretive)', pos: [30.86, 1.35, 39.02] },
    { roomId: 'pueblo_bonito_231', text: 'Southeastern Craft / Lapidary Sector Floor (Reconstructed)', pos: [30.86, 0.45, 40.42] },
    // Room 228
    { roomId: 'pueblo_bonito_9', text: '~120° ESE Corner Solstice Window (Reyman 1976)', pos: [53.31, 4.85, 34.40] },
    { roomId: 'pueblo_bonito_9', text: 'Winter Solstice Sunrise Beam Target Wall (Reconstructed)', pos: [51.68, 4.55, 33.37] },
    // Room 326
    { roomId: 'pueblo_bonito_406', text: 'Stone Floor Slabs & Metate Step (NAA 1924)', pos: [-58.80, 3.72, 0.25] },
    { roomId: 'pueblo_bonito_406', text: 'Room 320 / 326 Doorway (Interpretive Reconstruction)', pos: [-58.80, 4.55, -0.30] },
    // Great Kiva Q
    { roomId: 'pueblo_bonito_170', text: '4 Large Wooden Roof-Support Posts in Circular Collars (Reconstructed)', pos: [-21.16, -1.25, -9.72] },
    { roomId: 'pueblo_bonito_170', text: 'Subfloor Masonry Vaults (Possible Foot Drums)', pos: [-25.04, -2.05, -11.93] },
    { roomId: 'pueblo_bonito_170', text: 'Southern Entry Stairway (Reconstructed)', pos: [-23.15, -0.55, -6.85] },
    // Room 14 / 85
    { roomId: 'pueblo_bonito_22', text: 'Reconstructed 4-Story Northern Wall (Approximate)', pos: [6.53, 8.8, -36.46] },
    { roomId: 'pueblo_bonito_22', text: 'Reconstructed Ponderosa Pine Ceiling Vigas', pos: [6.53, 5.2, -35.5] },
  ];

  for (const sdl of structureDetailLabels) {
    const el = document.createElement('div');
    el.className = 'label-3d label-structure-detail';
    el.textContent = sdl.text;
    const labelObj = new CSS2DObject(el);
    labelObj.position.set(...sdl.pos);
    labelObj.userData.isStructureDetail = true;
    labelObj.userData.parentRoomId = sdl.roomId;
    scene.add(labelObj);
    cssLabels.push(labelObj);
  }
}

// ============================================================================
// 10. BUILD 6 ARCHITECTURAL SECTIONS NAV & 12 ROOM CHIPS DOM
// ============================================================================
function buildSectionsNavDOM() {
  const container = document.getElementById('sections-pills-container');
  if (!container) return;
  container.innerHTML = '';

  for (const sec of WALKTHROUGH_SECTIONS) {
    const btn = document.createElement('button');
    btn.className = `section-tab-btn ${sec.id === currentSectionId ? 'active' : ''}`;
    btn.dataset.sectionId = sec.id;
    btn.title = sec.fullTitle;
    btn.innerHTML = `<span class="sec-num">${sec.num}.</span><span>${sec.shortTitle}</span>`;
    btn.addEventListener('click', () => {
      if (guidedWalkActive) stopGuidedWalk();
      selectSection(sec.id, true);
    });
    container.appendChild(btn);
  }
}

function selectSection(sectionId, animateCamera = true) {
  const sec = sectionById.get(sectionId);
  if (!sec) return;
  currentSectionId = sectionId;
  document.body.dataset.section = sectionId;

  document.querySelectorAll('.section-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.sectionId === sectionId);
  });

  const secBadge = document.getElementById('active-section-badge');
  if (secBadge) {
    secBadge.textContent = sec.fullTitle;
  }

  // Highlight room chips that belong to the active section
  const activeRoomSet = new Set(sec.roomIds);
  document.querySelectorAll('[data-disc-chip-id]').forEach((chip) => {
    chip.classList.toggle('in-active-section', activeRoomSet.has(chip.dataset.discChipId));
  });

  const heroCard = document.getElementById('overview-hero-card');
  const drawer = document.getElementById('inspector-drawer');
  const reopenBtn = document.getElementById('btn-reopen-dossier');

  if (sectionId === 'overview') {
    if (heroCard) {
      document.getElementById('hero-section-title').textContent = sec.heroTitle;
      document.getElementById('hero-section-desc').innerHTML = sec.heroDesc;
      heroCard.classList.remove('minimized');
    }
    if (drawer) drawer.classList.add('collapsed-in-overview');
    if (reopenBtn) reopenBtn.classList.remove('hidden');

    if (animateCamera) {
      setExperienceMode('orbit', false);
      hideRoomSideNote();
      controls.autoRotate = false;
      const autoBtn = document.getElementById('btn-toggle-autorotate');
      if (autoBtn) autoBtn.classList.remove('active');
      flyToPosition(sec.camPos, sec.target, 1100, false);
    }
  } else {
    if (heroCard) heroCard.classList.add('minimized');
    if (drawer) drawer.classList.remove('collapsed-in-overview');
    if (reopenBtn) reopenBtn.classList.add('hidden');

    if (animateCamera) {
      controls.autoRotate = false;
      const autoBtn = document.getElementById('btn-toggle-autorotate');
      if (autoBtn) autoBtn.classList.remove('active');

      if (currentMode === 'orbit') {
        setExperienceMode('guided', false);
      }
      if (sec.roomIds.length > 0) {
        selectDiscoveryOrFeatureById(sec.roomIds[0], true);
      } else {
        flyToPosition(sec.camPos, sec.target, 1000, false);
      }
    }
  }
}

function buildScrollStoryDOM() {
  const container = document.getElementById('story-chapters-container');
  const dotsNav = document.getElementById('chapter-dots');
  if (!container || !dotsNav) return;
  container.innerHTML = '';
  dotsNav.innerHTML = '';

  STORY_CHAPTERS.forEach((ch, idx) => {
    const section = document.createElement('section');
    section.className = `story-chapter ${idx === 0 ? 'active' : ''}`;
    section.dataset.chapterIndex = idx;
    section.id = `story-chapter-${ch.index}`;
    section.innerHTML = `
      <article class="story-card">
        <h2>${ch.title}</h2>
        <p>${ch.body}</p>
      </article>
    `;
    container.appendChild(section);
  });
}

function buildDiscoveryChipsDOM() {
  const grid = document.getElementById('discovery-chips-grid');
  if (grid) {
    grid.innerHTML = '';
    for (const disc of CRA_DISCOVERIES) {
      const btn = document.createElement('button');
      btn.className = 'disc-chip';
      btn.dataset.discChipId = disc.id;
      btn.dataset.sectionId = disc.sectionId;
      if (visitedDiscoveries.has(disc.id)) btn.classList.add('visited');
      btn.title = `${disc.beaconLabel} — Click to fly camera to this room`;
      btn.innerHTML = `
        <span class="disc-chip-label">${disc.chipLabel}</span>
        <span class="disc-chip-dot"></span>
      `;
      btn.addEventListener('click', () => {
        if (guidedWalkActive) stopGuidedWalk();
        selectDiscoveryOrFeatureById(disc.id, true);
      });
      grid.appendChild(btn);
    }
  }

  const gsChips = document.getElementById('guided-stops-chips');
  if (gsChips) {
    gsChips.innerHTML = '';
    for (const disc of CRA_DISCOVERIES) {
      const chip = document.createElement('button');
      chip.className = 'gs-stop-chip';
      chip.dataset.discChipId = disc.id;
      chip.title = `${disc.beaconLabel} — Click to inspect room & archival records`;
      chip.textContent = disc.shortPin || disc.chipLabel;
      chip.addEventListener('click', () => {
        if (guidedWalkActive) stopGuidedWalk();
        selectDiscoveryOrFeatureById(disc.id, true);
      });
      gsChips.appendChild(chip);
    }
  }

  updateDiscoveryCounterBadge();
}

function updateDiscoveryCounterBadge() {
  const badge = document.getElementById('discovery-counter-badge');
  if (badge) {
    badge.textContent = `${visitedDiscoveries.size} / ${CRA_DISCOVERIES.length}`;
  }
  document.querySelectorAll('[data-disc-chip-id]').forEach((el) => {
    const id = el.dataset.discChipId;
    el.classList.toggle('visited', visitedDiscoveries.has(id));
    el.classList.toggle('active', Boolean(selectedFeature && selectedFeature.id === id));
  });
  for (const [id, beaconEl] of discoveryBeaconEls.entries()) {
    const disc = discoveryById.get(id);
    const isSelected = selectedFeature && selectedFeature.id === id;
    beaconEl.classList.toggle('visited', visitedDiscoveries.has(id));
    beaconEl.classList.toggle('active-beacon', Boolean(isSelected));
    if (disc) {
      beaconEl.textContent = isSelected ? disc.beaconLabel : disc.shortPin;
    }
  }
}

// ============================================================================
// 11. HYPERREALISTIC SOLAR & LUNAR STANDSTILL ARCHAEOASTRONOMY LIGHTING ENGINE
// ============================================================================
// Seasonal Solar Observatory Parameters at Chaco Canyon (36.0605°N)
const SEASON_OBSERVATORY_BOUNDS = {
  equinox: {
    sunriseHour: 6.0,
    noonHour: 12.0,
    sunsetHour: 18.0,
    riseAz: 90.0,
    setAz: 270.0,
    riseNode: [93.0, 60.0],
    setNode: [27.0, 60.0],
  },
  summer: {
    sunriseHour: 4.8,
    noonHour: 12.0,
    sunsetHour: 19.2,
    riseAz: 60.5,
    setAz: 299.5,
    riseNode: [88.73, 43.75],
    setNode: [31.27, 43.75],
  },
  winter: {
    sunriseHour: 7.2,
    noonHour: 12.0,
    sunsetHour: 16.8,
    riseAz: 119.5,
    setAz: 240.5,
    riseNode: [88.73, 76.25],
    setNode: [31.27, 76.25],
  },
};

function computeSolarAzAlt(season, hour) {
  const isLunarMode = season === 'lunar';
  const decDeg = SEASON_DECLINATIONS[season] ?? 0.0;
  const decRad = THREE.MathUtils.degToRad(decDeg);
  const effectiveHour = isLunarMode && hour >= 18.5 ? hour - 14.2 : hour;
  const hourAngleRad = THREE.MathUtils.degToRad((effectiveHour - 12.0) * 15.0);

  const sinAlt =
    Math.sin(CHACO_LAT_RAD) * Math.sin(decRad) +
    Math.cos(CHACO_LAT_RAD) * Math.cos(decRad) * Math.cos(hourAngleRad);
  const altRad = Math.asin(THREE.MathUtils.clamp(sinAlt, -1, 1));
  const altDeg = THREE.MathUtils.radToDeg(altRad);

  const cosAz =
    (Math.sin(decRad) - Math.sin(altRad) * Math.sin(CHACO_LAT_RAD)) /
    Math.max(0.0001, Math.cos(altRad) * Math.cos(CHACO_LAT_RAD));
  let azRad = Math.acos(THREE.MathUtils.clamp(cosAz, -1, 1));
  if (hourAngleRad > 0) azRad = 2 * Math.PI - azRad;
  const azDeg = THREE.MathUtils.radToDeg(azRad);

  return { azDeg, azRad, altDeg, altRad };
}

function hourFromSeasonAzimuth(seasonKey, targetAzDeg) {
  const bounds = SEASON_OBSERVATORY_BOUNDS[seasonKey] || SEASON_OBSERVATORY_BOUNDS.equinox;
  // Normalize angle relative to South (180°): negative = morning East, positive = afternoon West
  const relFromSouth = ((targetAzDeg - 180 + 540) % 360) - 180;
  const minRel = bounds.riseAz - 180; // -90° Equinox, -119.5° Summer, -60.5° Winter
  const maxRel = bounds.setAz - 180;  // +90° Equinox, +119.5° Summer, +60.5° Winter
  const clampedRel = THREE.MathUtils.clamp(relFromSouth, minRel, maxRel);

  // Gentle magnetic snap to Sunrise, Solar Noon (180° S), and Sunset anchor dots
  if (clampedRel <= minRel + 5.0) return bounds.sunriseHour;
  if (clampedRel >= maxRel - 5.0) return bounds.sunsetHour;
  if (Math.abs(clampedRel) <= 5.0) return bounds.noonHour;

  const clampedTargetAz = 180 + clampedRel;

  // Monotonic binary search between sunriseHour and sunsetHour so the sun orb locks 1:1 to cursor angle
  let lo = bounds.sunriseHour;
  let hi = bounds.sunsetHour;
  for (let i = 0; i < 12; i++) {
    const mid = 0.5 * (lo + hi);
    const { azDeg } = computeSolarAzAlt(seasonKey, mid);
    if (azDeg < clampedTargetAz) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return 0.5 * (lo + hi);
}

function updateSolarLighting(season, hour) {
  currentSeason = season;
  currentHour = parseFloat(hour);

  const timeSlider = document.getElementById('time-slider');
  if (timeSlider) timeSlider.value = currentHour;

  const isLunarMode = season === 'lunar';
  const { azDeg, azRad, altDeg, altRad } = computeSolarAzAlt(season, currentHour);
  const isNight = isLunarMode || season === 'night' || altDeg < -0.6;

  currentSunAzDeg = azDeg;
  currentSunAltDeg = altDeg;

  const hrs = Math.floor(currentHour);
  const mins = Math.round((currentHour - hrs) * 60);
  const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  const seasonLabel =
    season === 'summer'
      ? 'Summer Solstice'
      : season === 'winter'
      ? 'Winter Solstice'
      : season === 'lunar'
      ? 'Major Lunar Standstill'
      : season === 'night'
      ? 'Dark Sky Night'
      : currentHour >= 16.0 && currentHour < 17.8
      ? 'Golden Hour'
      : 'Equinox';

  const miniReadout = document.getElementById('solar-mini-readout');
  if (miniReadout) miniReadout.textContent = `${timeStr} • ${seasonLabel}`;

  const fullReadout = document.getElementById('solar-readout');
  if (fullReadout) {
    fullReadout.textContent = isNight
      ? `${timeStr} • ${isLunarMode ? `Lunar Standstill Az ${Math.round(azDeg)}°` : 'Dark Sky Sanctuary'}`
      : `${timeStr} • Alt ${Math.max(0, Math.round(altDeg))}° Az ${Math.round(azDeg)}°`;
  }

  if (gradePass) {
    gradePass.uniforms.uIsNight.value = isNight ? 1.0 : 0.0;
  }

  // Allow low-horizon raking angles (~5.0° minimum) so solstice/equinox sunrises cast long architectural shadows
  const clampedAlt = Math.max(0.088, isNight ? Math.max(0.22, Math.abs(altRad)) : altRad);
  currentSunDir
    .set(
      Math.cos(clampedAlt) * Math.sin(azRad),
      Math.sin(clampedAlt),
      -Math.cos(clampedAlt) * Math.cos(azRad)
    )
    .normalize();

  const dist = 340;
  const tx = sunLight && sunLight.target ? sunLight.target.position.x : 0;
  const tz = sunLight && sunLight.target ? sunLight.target.position.z : 0;
  if (sunLight) {
    sunLight.position.set(
      tx + currentSunDir.x * dist,
      currentSunDir.y * dist,
      tz + currentSunDir.z * dist
    );
  }

  if (isNight) {
    sunLight.intensity = isLunarMode ? 1.45 : 0.35;
    sunLight.color.setHex(isLunarMode ? 0x8ac4ff : 0x6b8fd4);
    hemiLight.intensity = isLunarMode ? 0.44 : 0.34;
    hemiLight.color.setHex(isLunarMode ? 0x3b65b0 : 0x2d4e8e);
    hemiLight.groundColor.setHex(0x26180f);
    cliffBounceLight.intensity = isLunarMode ? 0.22 : 0.14;
    ambientLight.intensity = isLunarMode ? 0.22 : 0.15;
    scene.fog.color.setHex(0x090d1a);
    scene.background.setHex(0x070a14);
    scene.environment = null;
    if (renderer) renderer.toneMappingExposure = isLunarMode ? 1.08 : 1.02;
    if (bloomPass) bloomPass.strength = 0.24;
    sky.visible = false;
    if (dustParticles) dustParticles.visible = false;
    fireLightsGroup.visible = true;
    for (const child of fireLightsGroup.children) {
      if (child.isPointLight) child.intensity = 16.0;
    }
  } else {
    sky.visible = true;
    if (dustParticles) dustParticles.visible = true;
    if (renderer) renderer.toneMappingExposure = 1.08;
    if (bloomPass) bloomPass.strength = 0.08;

    sky.material.uniforms['sunPosition'].value.copy(currentSunDir).multiplyScalar(dist);
    if (pmremGenerator) {
      scene.environment = pmremGenerator.fromScene(sky).texture;
    }

    // Golden-hour / sunrise raking sunlight transitioning to bright high-desert sun
    const lowSunFactor = THREE.MathUtils.clamp((altDeg - 6) / 36, 0, 1);
    const sunColor = new THREE.Color().lerpColors(
      new THREE.Color(0xffcf82),
      new THREE.Color(0xfff5e4),
      lowSunFactor
    );
    sunLight.color.copy(sunColor);
    sunLight.intensity = THREE.MathUtils.lerp(3.8, 4.1, lowSunFactor);

    hemiLight.color.setHex(0x90bce6);
    hemiLight.groundColor.setHex(0xab7c52);
    hemiLight.intensity = THREE.MathUtils.lerp(0.74, 0.88, lowSunFactor);
    cliffBounceLight.intensity = THREE.MathUtils.lerp(0.48, 0.36, lowSunFactor);
    ambientLight.intensity = 0.34;

    const fogCol = new THREE.Color().lerpColors(
      new THREE.Color(0xd8a878),
      new THREE.Color(0xe4ccb0),
      lowSunFactor
    );
    scene.fog.color.copy(fogCol);
    scene.background.copy(fogCol);
    fireLightsGroup.visible = false;
  }

  updateRoom228SolsticeBeam(season, currentHour, azDeg, altDeg, isNight, isLunarMode);
  updateCelestialCompassVisuals(azDeg, isNight, isLunarMode);
  update3DRoomCompassRing(azDeg, isNight, isLunarMode);
}

function updateRoom228SolsticeBeam(season, hour, azDeg, altDeg, isNight, isLunarMode) {
  if (!solsticeBeamGroup) return;

  // Room 228's corner window is oriented at ~120° ESE (morning sun / rising lunar standstill)
  const azDiffFrom120 = (((azDeg - 120 + 540) % 360) - 180);
  const absAzDiff = Math.abs(azDiffFrom120);
  const isInRoom228 = Boolean(selectedFeature && selectedFeature.id === 'pueblo_bonito_9');

  // Beam is strongest when azimuth is within ±42° of the 120° ESE corner window (or when inspecting Room 228)
  const azAlignmentFactor = THREE.MathUtils.clamp(1.0 - absAzDiff / 48.0, 0, 1);
  const lowHorizonBoost = THREE.MathUtils.clamp(1.15 - Math.max(0, altDeg - 5) / 48.0, 0.25, 1.0);
  const baseStrength = Math.max(
    isInRoom228 ? 0.45 : 0.15,
    azAlignmentFactor * lowHorizonBoost * (season === 'winter' ? 1.18 : 0.95)
  );

  solsticeBeamGroup.visible = true;

  // Dynamically sweep the interior west target wall hit point as sun/moon azimuth & altitude change
  const winPos = new THREE.Vector3(0.68, 0.70, 0.58);
  const lateralShiftZ = THREE.MathUtils.clamp(azDiffFrom120 * 0.016, -0.32, 0.32);
  const verticalShiftY = THREE.MathUtils.clamp((18.0 - Math.max(4.0, altDeg)) * 0.014, -0.20, 0.20);
  const wallHitPos = new THREE.Vector3(-0.77, 0.52 + verticalShiftY, -0.35 + lateralShiftZ);

  const beamVec = new THREE.Vector3().subVectors(wallHitPos, winPos);
  const beamLen = beamVec.length();
  const beamMid = new THREE.Vector3().addVectors(winPos, wallHitPos).multiplyScalar(0.5);
  const beamQuat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    beamVec.clone().normalize()
  );

  const beamColorHex = isLunarMode || isNight ? 0x80c8ff : 0xffcf48;
  const coreColorHex = isLunarMode || isNight ? 0xd4f0ff : 0xfff4b8;

  if (solsticeBeamOuterMesh) {
    solsticeBeamOuterMesh.position.copy(beamMid);
    solsticeBeamOuterMesh.quaternion.copy(beamQuat);
    solsticeBeamOuterMesh.scale.set(1, beamLen / 1.75, 1);
    solsticeBeamOuterMesh.material.color.setHex(beamColorHex);
    solsticeBeamOuterMesh.material.opacity = 0.28 * baseStrength;
  }
  if (solsticeBeamCoreMesh) {
    solsticeBeamCoreMesh.position.copy(beamMid);
    solsticeBeamCoreMesh.quaternion.copy(beamQuat);
    solsticeBeamCoreMesh.scale.set(1, beamLen / 1.75, 1);
    solsticeBeamCoreMesh.material.color.setHex(coreColorHex);
    solsticeBeamCoreMesh.material.opacity = 0.52 * baseStrength;
  }
  if (solsticeWallPatchMesh) {
    solsticeWallPatchMesh.position.copy(wallHitPos);
    solsticeWallPatchMesh.material.color.setHex(coreColorHex);
    solsticeWallPatchMesh.material.opacity = 0.85 * baseStrength;
  }
  if (solsticeFloorPatchMesh) {
    solsticeFloorPatchMesh.material.color.setHex(beamColorHex);
    solsticeFloorPatchMesh.material.opacity = 0.22 * baseStrength;
    solsticeFloorPatchMesh.rotation.z = -Math.PI * 0.33 - THREE.MathUtils.degToRad(azDiffFrom120 * 0.45);
  }
  if (solsticeWindowLight) {
    solsticeWindowLight.position.set(
      wallHitPos.x + 0.35,
      wallHitPos.y + 0.08,
      wallHitPos.z + 0.2
    );
    solsticeWindowLight.color.setHex(beamColorHex);
    solsticeWindowLight.intensity = 2.8 * baseStrength;
  }
}

function update3DRoomCompassRing() {
  if (roomCompassGroup) {
    roomCompassGroup.visible = false;
  }
}

function updateCelestialCompassVisuals(azDeg, isNight, isLunarMode) {
  const compassEl = document.getElementById('celestial-compass');
  if (!compassEl) return;

  compassEl.classList.toggle('lunar-mode', Boolean(isNight || isLunarMode));
  compassEl.classList.toggle('sweep-active', Boolean(celestialSweepActive));

  const activeSeasonKey =
    currentSeason === 'summer' || currentSeason === 'winter' ? currentSeason : 'equinox';
  compassEl.dataset.activeSeason = activeSeasonKey;
  const bounds = SEASON_OBSERVATORY_BOUNDS[activeSeasonKey] || SEASON_OBSERVATORY_BOUNDS.equinox;

  const azRad = THREE.MathUtils.degToRad(azDeg);
  const orbitR = 33.0;
  const orbX = 60.0 + orbitR * Math.sin(azRad);
  const orbY = 60.0 - orbitR * Math.cos(azRad);

  const orbEl = document.getElementById('compass-sun-orb');
  if (orbEl) {
    orbEl.setAttribute('transform', `translate(${orbX.toFixed(2)}, ${orbY.toFixed(2)})`);
  }
  const rayEl = document.getElementById('compass-celestial-ray');
  if (rayEl) {
    rayEl.setAttribute('x2', orbX.toFixed(2));
    rayEl.setAttribute('y2', orbY.toFixed(2));
  }

  // 1. Highlight active season pill & active seasonal sky arc on the dial
  compassEl.querySelectorAll('.compass-season-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.season === activeSeasonKey);
  });
  compassEl.querySelectorAll('.compass-season-arc').forEach((arc) => {
    arc.classList.toggle('active', arc.dataset.seasonArc === activeSeasonKey);
  });

  // 2. Position Sunrise & Sunset horizon anchor dots at the active season's exact horizon azimuths
  const riseNodeEl = document.getElementById('compass-node-sunrise');
  const noonNodeEl = document.getElementById('compass-node-noon');
  const setNodeEl = document.getElementById('compass-node-sunset');
  if (riseNodeEl) {
    riseNodeEl.setAttribute('cx', bounds.riseNode[0].toFixed(2));
    riseNodeEl.setAttribute('cy', bounds.riseNode[1].toFixed(2));
  }
  if (setNodeEl) {
    setNodeEl.setAttribute('cx', bounds.setNode[0].toFixed(2));
    setNodeEl.setAttribute('cy', bounds.setNode[1].toFixed(2));
  }

  const isAtSunrise = Math.abs(azDeg - bounds.riseAz) <= 8.0;
  const isAtNoon = Math.abs(azDeg - 180.0) <= 8.0;
  const isAtSunset = Math.abs(azDeg - bounds.setAz) <= 8.0;

  if (riseNodeEl) riseNodeEl.classList.toggle('active', isAtSunrise);
  if (noonNodeEl) noonNodeEl.classList.toggle('active', isAtNoon);
  if (setNodeEl) setNodeEl.classList.toggle('active', isAtSunset);

  // 3. Highlight the N–S Central Wall or E–W Southern Wall chord ONLY when the sun truly aligns with them
  const isNoonMeridian = Math.abs(azDeg - 180.0) <= 9.0;
  const isEastWestWall = Math.abs(azDeg - 90.0) <= 9.0 || Math.abs(azDeg - 270.0) <= 9.0;

  const nsChord = document.getElementById('compass-ns-axis');
  if (nsChord) nsChord.classList.toggle('active', isNoonMeridian);

  const ewChord = document.getElementById('compass-ew-axis');
  if (ewChord) ewChord.classList.toggle('active', isEastWestWall);

  // 4. Update concise, factually exact readout below the season pills
  const readoutEl = document.getElementById('compass-sun-readout');
  if (readoutEl) {
    const azRounded = Math.round(azDeg);
    let wallNote = '';
    if (isNoonMeridian) {
      wallNote = `180° S · N–S Wall Noon`;
    } else if (Math.abs(azDeg - 90.0) <= 9.0) {
      wallNote = `90° E · E–W Wall Sunrise`;
    } else if (Math.abs(azDeg - 270.0) <= 9.0) {
      wallNote = `270° W · E–W Wall Sunset`;
    } else if (activeSeasonKey === 'winter' && isAtSunrise) {
      wallNote = `120° ESE · Winter Sunrise`;
    } else if (activeSeasonKey === 'winter' && isAtSunset) {
      wallNote = `240° WSW · Winter Sunset`;
    } else if (activeSeasonKey === 'summer' && isAtSunrise) {
      wallNote = `60° ENE · Summer Sunrise`;
    } else if (activeSeasonKey === 'summer' && isAtSunset) {
      wallNote = `300° WNW · Summer Sunset`;
    } else {
      const hrs = Math.floor(currentHour);
      const mins = Math.round((currentHour - hrs) * 60);
      const timeStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
      wallNote = `${timeStr} · Az ${azRounded}°`;
    }
    readoutEl.textContent = wallNote;
  }

  // 5. Update 3D N–S and E–W cardinal axis line opacities
  for (const [key, line] of sightlineLinesByKey.entries()) {
    const isAct =
      (key === 'meridian_noon' && isNoonMeridian) ||
      (key === 'equinox_wall' && isEastWestWall);
    line.material.opacity = isAct ? 0.85 : 0.32;
  }
}

function updateSunShadowFrustum() {
  if (!sunLight || !sunLight.target) return;
  const focusX = THREE.MathUtils.clamp(controls.target.x, -290, 290);
  const focusZ = THREE.MathUtils.clamp(controls.target.z, -120, 220);
  sunLight.target.position.set(focusX, 0, focusZ);
  sunLight.target.updateMatrixWorld();

  const dist = 340;
  sunLight.position.set(
    focusX + currentSunDir.x * dist,
    currentSunDir.y * dist,
    focusZ + currentSunDir.z * dist
  );

  // Tight shadow frustum when inside Pueblo Bonito for ultra-sharp masonry & timber shadows
  const camDist = camera.position.distanceTo(controls.target);
  const targetHalfExtent = camDist < 45 ? 68 : camDist < 140 ? 108 : 165;
  if (Math.abs(sunLight.shadow.camera.right - targetHalfExtent) > 5) {
    sunLight.shadow.camera.left = -targetHalfExtent;
    sunLight.shadow.camera.right = targetHalfExtent;
    sunLight.shadow.camera.top = targetHalfExtent;
    sunLight.shadow.camera.bottom = -targetHalfExtent;
    sunLight.shadow.camera.updateProjectionMatrix();
  }
}

function applyPhaseFilter(phaseKey) {
  document.querySelectorAll('.phase-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.phase === phaseKey);
  });

  if (phaseKey === 'all' || !PHASE_MAP[phaseKey]) {
    for (const [, nodes] of phaseCollections.entries()) {
      for (const n of nodes) n.visible = true;
    }
    return;
  }

  const allowed = new Set(PHASE_MAP[phaseKey]);
  for (const [colName, nodes] of phaseCollections.entries()) {
    const vis = allowed.has(colName);
    for (const n of nodes) n.visible = vis;
  }
}

// ============================================================================
// 12. CLEAN SCROLL-IN TITLE, HOVER CALLOUT, ARCHIVAL DOSSIER & ROOM NAVIGATION
// ============================================================================
function updateCenterTitleOverlay(progress) {
  const el = document.getElementById('center-title-overlay');
  if (el) {
    const introT = THREE.MathUtils.clamp(progress / 0.14, 0.0, 1.0);
    const translateY = -introT * 260.0;
    const opacity = THREE.MathUtils.clamp(1.0 - introT * 1.45, 0.0, 1.0);
    el.style.transform = `translate3d(0, ${translateY.toFixed(1)}px, 0)`;
    el.style.opacity = opacity.toFixed(3);
    el.style.visibility = opacity <= 0.005 ? 'hidden' : 'visible';
  }
  const gsBar = document.getElementById('guided-stops-bar');
  if (gsBar) {
    gsBar.classList.remove('hidden');
    gsBar.classList.add('visible');
  }
}

function formatExactFootprint(feat) {
  if (!feat) return '—';
  if (feat.footprint_label) {
    return feat.footprint_label;
  }
  if (feat.radius_m) {
    const diam = (feat.radius_m * 2).toFixed(1);
    const area = feat.area_m2 ? ` (${feat.area_m2.toFixed(1)} m²)` : '';
    return `Ø ${diam} m${area}`;
  }
  if (feat.width_m && feat.depth_m) {
    if (feat.irregular && feat.area_m2) {
      return `max ${feat.width_m.toFixed(1)} × ${feat.depth_m.toFixed(1)} m (${feat.area_m2.toFixed(1)} m² irregular plan)`;
    }
    const area = feat.area_m2 ? ` (${feat.area_m2.toFixed(1)} m²)` : '';
    return `${feat.width_m.toFixed(1)} × ${feat.depth_m.toFixed(1)} m${area}`;
  }
  if (feat.area_m2) return `${feat.area_m2.toFixed(1)} m²`;
  return 'Georeferenced Landmark';
}

function getFallbackArchivalMediaForFeature(feat) {
  const cat = (feat.category || '').toLowerCase();
  const z = -(feat.cy || 0);
  const x = feat.cx || 0;
  if (cat === 'kiva' || cat === 'great_kiva') {
    return [
      {
        tab: 'NPS Kiva Photo',
        badge: 'PD-USGOV-NPS',
        src: './renders/archival/pd_nps_great_kiva.jpg',
        caption: 'Recessed kiva masonry & bench (NPS)',
      },
      {
        tab: 'NPS Master Plan',
        badge: 'PD-USGOV-NPS (1984)',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        caption: 'NPS measured site plan of Pueblo Bonito (Lekson 1984)',
      },
      {
        tab: '0.5m LiDAR Breakdown',
        badge: '0.5m AIRBORNE LIDAR',
        src: './renders/lidar_data_and_foliage_breakdown.jpg',
        caption: '0.5m OpenTopography LiDAR DEM & DSM',
      },
    ];
  }
  if (z < -18.0) {
    return [
      {
        tab: 'Northern Roomblock (NPS)',
        badge: 'PD-USGOV-NPS (1930s)',
        src: './renders/archival/pd_nps_masonry_preservation.jpg',
        caption: 'Northern roomblocks below Cliff House Sandstone cliff (NPS, 1930s)',
      },
      {
        tab: 'NPS Banded Masonry',
        badge: 'PD-USGOV-NPS (1929)',
        src: './renders/archival/pd_nps_banded_masonry_doorway.jpg',
        caption: 'Northern arc core-and-veneer masonry & vigas (NPS, 1929)',
      },
      {
        tab: 'NPS Master Plan',
        badge: 'PD-USGOV-NPS (1984)',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        caption: 'NPS measured site plan of Pueblo Bonito (Lekson 1984)',
      },
    ];
  }
  if (x < -15.0) {
    return [
      {
        tab: 'NPS Western Wing',
        badge: 'PD-USGOV-NPS (1930s)',
        src: './renders/archival/pd_nps_large_kiva_archival.jpg',
        caption: 'Western roomblocks & kivas (NPS, 1930s)',
      },
      {
        tab: 'NPS Master Plan',
        badge: 'PD-USGOV-NPS (1984)',
        src: './renders/pd_nps_pueblo_bonito_plan.jpg',
        caption: 'NPS measured site plan of Pueblo Bonito (Lekson 1984)',
      },
      {
        tab: '0.5m LiDAR Breakdown',
        badge: '0.5m AIRBORNE LIDAR',
        src: './renders/lidar_data_and_foliage_breakdown.jpg',
        caption: '0.5m OpenTopography LiDAR DEM & DSM',
      },
    ];
  }
  return [
    {
      tab: 'NPS Sandstone Masonry',
      badge: 'PD-USGOV-NPS',
      src: './renders/archival/pd_nps_sandstone_walls.jpg',
      caption: 'Sandstone walls & pine lintels (NPS)',
    },
    {
      tab: 'NPS Master Plan',
      badge: 'PD-USGOV-NPS (1984)',
      src: './renders/pd_nps_pueblo_bonito_plan.jpg',
      caption: 'NPS measured site plan (Lekson 1984)',
    },
    {
      tab: '0.5m LiDAR Sweep',
      badge: '0.5m LIDAR POINT CLOUD',
      src: './renders/hud_stage1_lidar_sweep.jpg',
      caption: '0.5m airborne LiDAR elevation sweep',
    },
  ];
}

function getFactCheckedHoverHeader(feat, disc) {
  const eyebrow =
    (disc && disc.tinyEra) ||
    feat.tinyEra ||
    (feat.phase ? feat.phase.toUpperCase() : 'PUEBLO BONITO • APPROX. AD 850–1130');
  const rawTitle =
    (disc && disc.tinyTitle) ||
    feat.tinyTitle ||
    feat.title ||
    feat.name ||
    feat.id ||
    'CHACOAN CHAMBER';
  return {
    eyebrow,
    title: String(rawTitle).toUpperCase(),
  };
}

function getFactualKeyPointsForFeature(feat, disc) {
  if (disc && Array.isArray(disc.keyPoints) && disc.keyPoints.length > 0) {
    return disc.keyPoints;
  }
  if (Array.isArray(feat.keyPoints) && feat.keyPoints.length > 0) {
    return feat.keyPoints;
  }

  const name = feat.name || feat.id || 'Structure';
  const cat = (feat.category || 'room').toLowerCase();
  const phase = feat.phase || 'Classic Bonito Phase';
  const masonry = feat.masonryType || feat.masonry || 'Core-and-Veneer Sandstone';
  const dendro = feat.dendroDates || 'Sector phase estimate (Windes & Ford 1996)';
  const stories = feat.stories || 1;
  const isSubcourt = Boolean(feat.subcourt);

  // 1. Georeferenced GIS Footprint (no dimensions)
  const footprintSentence = isSubcourt
    ? `${name} is a sealed sub-court ${cat.replace('_', ' ')} foundation polygon demolished and paved over during later courtyard leveling (Judd 1964; Lekson 1984).`
    : `${name} is a georeferenced ${cat.replace('_', ' ')} footprint digitized from the NPS (Lekson 1984) and HABS No. NM-30 (LOC Control No. nm0107) architectural surveys.`;

  // 2. Architectural Sector, Masonry Classification & Interpretive Reconstructed Elevation
  const architectureSentence = `Classified in ${phase} with ${masonry}; ${dendro}. Modeled to an estimated ${stories} ${
    stories === 1 ? 'story' : 'stories'
  } (INTERPRETIVE RECONSTRUCTION: exact original roof height, upper-story elevation, and interior arrangement are approximate rather than directly preserved; Lekson 1984).`;

  // 3. Published Archival / Excavation Status
  const customArtifacts =
    typeof feat.artifacts === 'string' &&
    feat.artifacts.trim().length > 0 &&
    !feat.artifacts.startsWith('Room-specific artifact inventory') &&
    !feat.artifacts.startsWith('Kiva-specific artifact inventory')
      ? feat.artifacts.trim()
      : Array.isArray(feat.artifacts) && feat.artifacts.length > 0
      ? feat.artifacts.join(' ')
      : null;

  const recordSentence =
    customArtifacts ||
    (cat === 'kiva' || cat === 'kiva_enclosure'
      ? 'Where specific kiva interiors remain unexcavated or only partially documented, modeled interior benches, pilasters, and floor features represent an interpretive reconstruction (Judd 1964; Lekson 1984).'
      : 'Room-level artifact inventory not individually itemized in this dataset; see AMNH Hyde Expedition (Pepper 1920), Smithsonian NMNH (Judd 1954), and Chaco Research Archive (CRA) room records.');

  return [footprintSentence, architectureSentence, recordSentence];
}

function getFallbackStructures3DForFeature(feat) {
  const stories = feat.stories || 1;
  const cat = (feat.category || 'room').toLowerCase();
  if (cat === 'kiva' || cat === 'kiva_enclosure' || cat === 'great_kiva') {
    return [
      {
        name: 'Recessed or Roomblock-Enclosed Circular Chamber',
        spec: 'Extruded from georeferenced 0.5m LiDAR & NPS kiva footprint (Reconstructed Depth Approximate)',
      },
      {
        name: 'Encircling Coursed Sandstone Bench (Interpretive Reconstruction)',
        spec: 'Modeled interior masonry bench ring & roof pilaster supports (Interpretive Where Unexcavated)',
      },
      {
        name: 'Modeled Hearth & Sub-Floor Ventilator (Interpretive Reconstruction)',
        spec: 'Based on general Chacoan kiva architecture from NPS (Judd 1964) & HABS No. NM-30 surveys',
      },
    ];
  }
  return [
    {
      name: 'Georeferenced Room Footprint',
      spec: `2D polygon from NPS (Lekson 1984) & HABS No. NM-30 (LOC nm0107) survey (${feat.name || feat.id})`,
    },
    {
      name: `Est. ${stories}-Story Core-and-Veneer Sandstone Walls (Reconstructed)`,
      spec: `${feat.masonryType || feat.masonry || 'Type I–IV coursed sandstone'} • ${feat.phase || 'Classic Bonito Phase'} (Approximate Height)`,
    },
    {
      name: 'Reconstructed Timber Viga Sockets & Earthen Floor (Interpretive)',
      spec: `Phase dating: ${feat.dendroDates || 'Sector phase estimate (Lekson 1984; Windes & Ford 1996)'}`,
    },
  ];
}

function setHoveredFeature(feat, clientX = 0, clientY = 0) {
  const prevId = hoveredFeature ? hoveredFeature.id : null;
  const nextId = feat ? feat.id : null;
  hoveredFeature = feat || null;

  if (prevId !== nextId) {
    updateFocusMaskTexture();
    if (renderer && renderer.domElement) {
      renderer.domElement.style.cursor = feat ? 'pointer' : '';
    }
  }

  const tagEl = document.getElementById('room-hover-tag');
  if (!tagEl) return;

  if (!feat) {
    tagEl.classList.add('hidden');
    return;
  }

  const disc = discoveryById.get(feat.id);
  const { eyebrow, title } = getFactCheckedHoverHeader(feat, disc);
  const eyebrowEl = document.getElementById('hover-tag-eyebrow');
  const titleEl = document.getElementById('hover-tag-title');

  if (eyebrowEl) {
    eyebrowEl.textContent = eyebrow;
  }
  if (titleEl) {
    titleEl.textContent = title;
  }

  const stageEl = document.getElementById('viewport-stage');
  const rect = stageEl ? stageEl.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const maxX = Math.max(16, rect.width - 285);
  const maxY = Math.max(16, rect.height - 86);
  const tx = Math.min(maxX, Math.max(12, localX + 16));
  const ty = Math.min(maxY, Math.max(12, localY - 18));
  tagEl.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
  tagEl.classList.remove('hidden');
}

let activeSideMediaList = [];
let activeSideMediaIndex = 0;

function renderActiveSideMedia() {
  if (!activeSideMediaList.length) return;
  const item = activeSideMediaList[activeSideMediaIndex] || activeSideMediaList[0];
  const imgEl = document.getElementById('rs-archival-img');
  const capEl = document.getElementById('rs-archival-caption');
  const countEl = document.getElementById('rs-media-counter');
  const prevBtn = document.getElementById('btn-media-prev');
  const nextBtn = document.getElementById('btn-media-next');

  if (imgEl && item) {
    imgEl.src = item.src;
    imgEl.alt = item.caption || item.tab || 'Archival & LiDAR Record';
  }
  if (capEl && item) {
    capEl.textContent = item.caption || item.tab || '';
  }
  if (countEl) {
    countEl.textContent = `${activeSideMediaIndex + 1} / ${activeSideMediaList.length}`;
  }
  const showArrows = activeSideMediaList.length > 1;
  if (prevBtn) prevBtn.style.display = showArrows ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = showArrows ? 'flex' : 'none';
}

function stepSideMedia(delta) {
  if (activeSideMediaList.length <= 1) return;
  activeSideMediaIndex =
    (activeSideMediaIndex + delta + activeSideMediaList.length) % activeSideMediaList.length;
  renderActiveSideMedia();
}

function showRoomSideNote(feat) {
  const noteEl = document.getElementById('room-side-note');
  if (!noteEl || !feat) return;
  noteEl.classList.remove('hidden');

  const disc = discoveryById.get(feat.id);
  const { eyebrow, title } = getFactCheckedHoverHeader(feat, disc);
  const eyebrowEl = document.getElementById('room-side-eyebrow');
  const titleEl = document.getElementById('room-side-title');
  const keyPointsEl = document.getElementById('room-side-keypoints');
  const stopIndEl = document.getElementById('rs-stop-indicator');

  if (eyebrowEl) {
    eyebrowEl.textContent = eyebrow;
  }
  if (titleEl) {
    titleEl.textContent = title;
  }
  if (keyPointsEl) {
    const points = getFactualKeyPointsForFeature(feat, disc);
    keyPointsEl.innerHTML = '';
    for (const pt of points) {
      const li = document.createElement('li');
      li.textContent = pt;
      keyPointsEl.appendChild(li);
    }
  }
  if (stopIndEl) {
    stopIndEl.textContent = disc
      ? `${disc.index} / ${CRA_DISCOVERIES.length}`
      : `${feat.name || feat.id}`;
  }

  activeSideMediaList =
    disc && Array.isArray(disc.archivalMedia) && disc.archivalMedia.length > 0
      ? disc.archivalMedia
      : getFallbackArchivalMediaForFeature(feat);
  activeSideMediaIndex = 0;
  renderActiveSideMedia();

  activeSideNoteRoomId = feat.id;
  targetDimAmount = 1.0;
  updateFocusMaskTexture();
  updateDiscoveryCounterBadge();
  noteEl.classList.remove('hidden');

  const compassEl = document.getElementById('celestial-compass');
  if (feat.id === 'pueblo_bonito_9') {
    activeCelestialAlignment = 'winter_window';
    if (compassEl) compassEl.classList.add('room-aligned');
    updateSolarLighting('winter', 7.35);
  } else if (feat.id === 'pueblo_bonito_159' || feat.id === 'pueblo_bonito_170') {
    activeCelestialAlignment = 'meridian_noon';
    if (compassEl) compassEl.classList.add('room-aligned');
    updateSolarLighting(currentSeason === 'night' ? 'lunar' : currentSeason, currentHour);
  } else if (feat.id === 'pueblo_bonito_22') {
    activeCelestialAlignment = 'summer_spine';
    if (compassEl) compassEl.classList.add('room-aligned');
    updateSolarLighting('summer', 6.25);
  } else {
    if (compassEl) compassEl.classList.remove('room-aligned');
    update3DRoomCompassRing(
      currentSunAzDeg,
      currentSeason === 'night' || currentSeason === 'lunar',
      currentSeason === 'lunar'
    );
  }
}

function hideRoomSideNote() {
  const noteEl = document.getElementById('room-side-note');
  if (noteEl) {
    noteEl.classList.add('hidden');
  }
  activeSideNoteRoomId = null;
  selectedFeature = null;
  targetDimAmount = 0.0;
  updateFocusMaskTexture();
  if (selectionHighlightGroup) selectionHighlightGroup.clear();
  if (roomInspectLight) roomInspectLight.intensity = 0.0;
  if (roomOverheadSpot) roomOverheadSpot.intensity = 0.0;
  if (roomCompassGroup) roomCompassGroup.visible = false;
  const compassEl = document.getElementById('celestial-compass');
  if (compassEl) compassEl.classList.remove('room-aligned');
  updateDiscoveryCounterBadge();
}

function zoomInsideSelectedRoom() {
  const feat =
    selectedFeature || featureById.get(activeSideNoteRoomId) || featureById.get('pueblo_bonito_380');
  if (!feat) return;
  if (guidedWalkActive) stopGuidedWalk();

  userFreeNavigating = false;
  if (currentMode === 'walk') setExperienceMode('guided', false);
  controls.enabled = true;

  if (targetScrollProgress < 0.16) {
    targetScrollProgress = 0.22;
    smoothScrollProgress = 0.22;
    updateCenterTitleOverlay(0.22);
  }

  const disc = discoveryById.get(feat.id);
  highlightFeatureIn3D(feat);
  targetDimAmount = 1.0;

  if (disc && disc.closeCamPos && disc.closeTarget) {
    flyToPosition(disc.closeCamPos, disc.closeTarget, 750, false);
    return;
  }

  const tx = feat.cx || 0;
  const tz = -(feat.cy || 0);
  const isNorthArc = tz < -18.0;
  const floorY =
    feat.category === 'kiva' || feat.category === 'great_kiva' ? -1.4 : isNorthArc ? 4.1 : 0.6;
  const toPlazaX = -tx;
  const toPlazaZ = 14.0 - tz;
  const len = Math.max(0.01, Math.hypot(toPlazaX, toPlazaZ));
  const offsetDist = feat.radius_m ? Math.max(2.5, feat.radius_m * 0.65) : 2.6;
  const camX = tx + (toPlazaX / len) * offsetDist;
  const camZ = tz + (toPlazaZ / len) * offsetDist;
  const camY = floorY + (feat.radius_m ? 4.2 : 3.4);
  flyToPosition([camX, camY, camZ], [tx, floorY + 0.35, tz], 750, false);
}

function zoomToWideRuinView() {
  if (guidedWalkActive) stopGuidedWalk();
  userFreeNavigating = false;
  if (currentMode === 'walk') setExperienceMode('orbit', false);
  controls.enabled = true;

  if (targetScrollProgress < 0.16) {
    targetScrollProgress = 0.18;
    smoothScrollProgress = 0.18;
    updateCenterTitleOverlay(0.18);
  }

  // Restore full 100% daylight brightness across the entire ruin & canyon!
  targetDimAmount = 0.0;
  if (roomInspectLight) roomInspectLight.intensity = 0.0;
  if (roomOverheadSpot) roomOverheadSpot.intensity = 0.0;

  flyToPosition([12.0, 62.0, 108.0], [-6.0, 2.0, -14.0], 900, false);
}

function zoomCameraByFactor(factor) {
  if (!camera || !controls) return;
  if (guidedWalkActive) stopGuidedWalk();
  userFreeNavigating = false;
  if (currentMode === 'walk') setExperienceMode('orbit', false);
  controls.enabled = true;

  if (targetScrollProgress < 0.16) {
    targetScrollProgress = 0.18;
    smoothScrollProgress = 0.18;
    updateCenterTitleOverlay(0.18);
  }

  const offset = camera.position.clone().sub(controls.target);
  const curDist = Math.max(0.8, offset.length());
  const nextDist = THREE.MathUtils.clamp(curDist * factor, 1.1, 450.0);
  offset.normalize().multiplyScalar(nextDist);
  const nextPos = controls.target.clone().add(offset);
  nextPos.y = Math.max(1.2, nextPos.y);

  if (nextDist > 26.0) {
    targetDimAmount = 0.0;
  }

  flyToPosition(
    [nextPos.x, nextPos.y, nextPos.z],
    [controls.target.x, controls.target.y, controls.target.z],
    380,
    false
  );
}

function updateScrollWalkExperience(progress) {
  updateCenterTitleOverlay(progress);

  // Interpolate camera from high overview (0.0) into the flexible plaza overlook (0.14)
  const wps = SCROLL_WALK_WAYPOINTS;
  let segIdx = 0;
  for (let i = 0; i < wps.length - 1; i++) {
    if (progress >= wps[i].s && progress <= wps[i + 1].s) {
      segIdx = i;
      break;
    }
  }
  if (progress >= wps[wps.length - 1].s) {
    segIdx = wps.length - 2;
  }

  const wpA = wps[segIdx];
  const wpB = wps[segIdx + 1];
  const span = Math.max(0.0001, wpB.s - wpA.s);
  const rawT = THREE.MathUtils.clamp((progress - wpA.s) / span, 0, 1);
  const easeT = rawT * rawT * (3.0 - 2.0 * rawT);

  const px = THREE.MathUtils.lerp(wpA.pos[0], wpB.pos[0], easeT);
  const py = THREE.MathUtils.lerp(wpA.pos[1], wpB.pos[1], easeT);
  const pz = THREE.MathUtils.lerp(wpA.pos[2], wpB.pos[2], easeT);

  const lx = THREE.MathUtils.lerp(wpA.look[0], wpB.look[0], easeT);
  const ly = THREE.MathUtils.lerp(wpA.look[1], wpB.look[1], easeT);
  const lz = THREE.MathUtils.lerp(wpA.look[2], wpB.look[2], easeT);

  camera.position.set(px, py, pz);
  controls.target.set(lx, ly, lz);
  camera.lookAt(controls.target);

  const dx = lx - px;
  const dy = ly - py;
  const dz = lz - pz;
  const horiz = Math.max(0.001, Math.hypot(dx, dz));
  walkYaw = Math.atan2(-dx, -dz);
  walkPitch = THREE.MathUtils.clamp(Math.atan2(dy, horiz), -1.0, 1.0);
  smoothedWalkY = py;
}

function setWalkPose(posArr, lookTargetArr) {
  camera.position.set(posArr[0], posArr[1], posArr[2]);
  smoothedWalkY = posArr[1];
  const groundY = sampleGroundElevation(posArr[0], posArr[2]);
  walkElevationOffset = Math.max(1.8, posArr[1] - groundY);
  const dx = lookTargetArr[0] - posArr[0];
  const dy = lookTargetArr[1] - posArr[1];
  const dz = lookTargetArr[2] - posArr[2];
  const horizDist = Math.max(0.001, Math.hypot(dx, dz));
  walkYaw = Math.atan2(-dx, -dz);
  walkPitch = THREE.MathUtils.clamp(Math.atan2(dy, horizDist), -1.0, 1.0);
  updateWalkCameraLook();
  updateWalkElevationLabel();
}

function updateWalkElevationLabel() {
  const lbl = document.getElementById('walk-elev-label');
  if (!lbl) return;
  const h = camera ? camera.position.y : walkElevationOffset;
  if (h > 25.0) {
    lbl.textContent = `Mesa Rim ${h.toFixed(1)}m`;
  } else if (h > 10.0) {
    lbl.textContent = `Overlook ${h.toFixed(1)}m`;
  } else if (h > 4.6) {
    lbl.textContent = `Terrace ${h.toFixed(1)}m`;
  } else {
    lbl.textContent = `Plaza ${h.toFixed(1)}m`;
  }
}

function showProximityToast(message) {
  const toast = document.getElementById('proximity-toast');
  const textEl = document.getElementById('proximity-toast-text');
  if (!toast || !textEl) return;
  textEl.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(proximityToastTimer);
  proximityToastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, 3200);
}

let selectedRoomBaseDist = 12.0;

function selectDiscoveryOrFeatureById(id, moveCamera = true, forceMode = null) {
  const feat = featureById.get(id);
  if (!feat) return;

  controls.autoRotate = false;
  const autoBtn = document.getElementById('btn-toggle-autorotate');
  if (autoBtn) autoBtn.classList.remove('active');

  const disc = discoveryById.get(id);
  if (disc) {
    visitedDiscoveries.add(id);
    lastProximityDiscId = id;
  }

  // Ensure the big centered title scrolls away
  if (targetScrollProgress < 0.16) {
    targetScrollProgress = 0.22;
    smoothScrollProgress = 0.22;
  }
  updateCenterTitleOverlay(targetScrollProgress);

  highlightFeatureIn3D(feat);
  populateInspectorDossier(feat, false);
  showRoomSideNote(feat);

  if (moveCamera) {
    const useWalkMode = forceMode === 'walk';
    userFreeNavigating = useWalkMode;
    controls.enabled = !useWalkMode;
    lookYawOffset = 0.0;
    lookPitchOffset = 0.0;

    const cPos = (disc && (disc.walkPos || disc.closeCamPos)) || null;
    const cTgt = (disc && (disc.walkTarget || disc.closeTarget)) || null;
    if (cPos && cTgt) {
      selectedRoomBaseDist = Math.hypot(
        cPos[0] - cTgt[0],
        cPos[1] - cTgt[1],
        cPos[2] - cTgt[2]
      );
      flyToPosition(cPos, cTgt, 820, useWalkMode);
    } else {
      const tx = feat.cx || 0;
      const tz = -(feat.cy || 0);
      const isNorthArc = tz < -18.0;
      const floorY =
        feat.category === 'kiva' || feat.category === 'great_kiva' ? -1.6 : isNorthArc ? 3.5 : 0.4;
      const wallTopY = Math.max(floorY + 3.2, (feat.height_m || 4.0) + (isNorthArc ? 2.5 : 0.2));
      const camY = wallTopY + 5.2;
      const toPlazaX = -tx;
      const toPlazaZ = 14.0 - tz;
      const len = Math.max(0.01, Math.hypot(toPlazaX, toPlazaZ));
      const offsetDist = feat.radius_m ? feat.radius_m + 5.5 : 5.8;
      const camX = tx + (toPlazaX / len) * offsetDist;
      const camZ = tz + (toPlazaZ / len) * offsetDist;
      selectedRoomBaseDist = Math.hypot(camX - tx, camY - (floorY + 0.3), camZ - tz);
      flyToPosition([camX, camY, camZ], [tx, floorY + 0.3, tz], 820, useWalkMode);
    }
  }
}

function highlightFeatureIn3D(feat) {
  selectedFeature = feat;
  selectionHighlightGroup.clear();

  const x = feat.cx || 0;
  const z = -(feat.cy || 0);
  const isNorthArc = z < -18.0;
  const floorY =
    feat.category === 'kiva' || feat.category === 'great_kiva'
      ? -1.4
      : isNorthArc
      ? 4.1
      : 0.6;

  // Position warm interior conservation lighting strictly inside the selected room
  if (roomInspectLight) {
    roomInspectLight.position.set(x, floorY + 1.8, z);
    roomInspectLight.distance = feat.radius_m ? feat.radius_m + 2.5 : 5.5;
    roomInspectLight.intensity = 1.4;
  }
  if (roomOverheadSpot && roomOverheadSpot.target) {
    roomOverheadSpot.position.set(x, floorY + 10.0, z + 0.5);
    roomOverheadSpot.target.position.set(x, floorY, z);
    roomOverheadSpot.target.updateMatrixWorld();
    roomOverheadSpot.intensity = 0.0;
  }

  targetDimAmount = 1.0;
  updateFocusMaskTexture();
  drawMinimap();
}

function populateInspectorDossier(feat, showDrawer = true) {
  selectedFeature = feat;
  const disc = discoveryById.get(feat.id);
  const sec = disc ? sectionById.get(disc.sectionId) : null;
  const isVerifiedRecord = Boolean(feat.isDiscovery || disc);

  const catBadge = document.getElementById('info-category-badge');
  if (catBadge) {
    if (disc) {
      catBadge.textContent = `STOP ${disc.index} OF ${CRA_DISCOVERIES.length} • ${
        sec ? sec.shortTitle.toUpperCase() : 'VERIFIED RECORD'
      }`;
    } else if (isVerifiedRecord) {
      catBadge.textContent = `${(feat.category || 'STRUCTURE').toUpperCase()} • VERIFIED EXCAVATION RECORD`;
    } else {
      catBadge.textContent = `${(feat.category || 'ROOM').toUpperCase()} • GEOREFERENCED FOOTPRINT (SECTOR PHASE)`;
    }
  }
  const coordsBadge = document.getElementById('info-coords-badge');
  if (coordsBadge) {
    coordsBadge.textContent = (feat.category || 'ROOM').toUpperCase().replace('_', ' ');
  }

  document.getElementById('info-title').textContent = feat.title || feat.name || feat.id;
  const sitePretty = SITE_LABELS[feat.site] || feat.site || 'Pueblo Bonito';
  document.getElementById('info-subtitle').textContent = `${sitePretty} • ${
    feat.phase || 'Classic Bonito Phase (AD 1040–1100)'
  }`;
  document.getElementById('info-excavator').textContent = isVerifiedRecord
    ? feat.excavator || 'Documented in Published Archaeological Excavation Record'
    : '2D Footprint: NPS (Lekson 1984) & HABS No. NM-30 (LOC nm0107) • Phase & Elevation: Interpretive Sector Reconstruction (Lekson 1984; Windes & Ford 1996)';

  const lblMasonry = document.getElementById('lbl-masonry');
  const lblDendro = document.getElementById('lbl-dendro');
  const lblDimensions = document.getElementById('lbl-dimensions');
  const lblArea = document.getElementById('lbl-area');
  const lblSummary = document.getElementById('lbl-summary-heading');
  const lblArtifacts = document.getElementById('lbl-artifacts-heading');

  if (lblMasonry) lblMasonry.textContent = isVerifiedRecord ? 'MASONRY' : 'SECTOR MASONRY';
  if (lblDendro) lblDendro.textContent = isVerifiedRecord ? 'TREE-RING / DATING' : 'SECTOR DATING';
  if (lblDimensions) lblDimensions.textContent = 'RECONSTRUCTION STATUS';
  if (lblArea) lblArea.textContent = 'SURVEY RECORD';
  if (lblSummary) {
    lblSummary.textContent = isVerifiedRecord
      ? 'PUBLISHED ARCHAEOLOGICAL RECORD'
      : 'GEOREFERENCED ARCHITECTURAL RECORD';
  }
  if (lblArtifacts) {
    lblArtifacts.textContent = isVerifiedRecord
      ? 'EXCAVATED ARTIFACTS & EVIDENCE'
      : 'ARCHIVAL & EXCAVATION STATUS';
  }

  document.getElementById('info-masonry').textContent =
    feat.masonry || 'Core-and-Veneer Sandstone';
  document.getElementById('info-dendro').textContent =
    feat.dendroDates || 'Sector phase estimate (Windes & Ford 1996)';
  document.getElementById('info-dimensions').textContent = `Est. ${feat.stories || 1} ${
    (feat.stories || 1) === 1 ? 'Story' : 'Stories'
  } (Interpretive Reconstruction / Approximate)`;
  document.getElementById('info-area').textContent = 'NPS (Lekson 1984) & HABS No. NM-30';

  document.getElementById('info-summary').textContent =
    feat.summary ||
    'Georeferenced masonry room or kiva footprint recorded in the NPS (Lekson 1984) and HABS No. NM-30 (LOC Control No. nm0107) architectural surveys.';

  const artifactsText = Array.isArray(feat.artifacts)
    ? feat.artifacts.join(' • ')
    : feat.artifacts ||
      'Room-level artifact inventory not individually itemized in this dataset; see AMNH (Pepper 1920), NMNH (Judd 1954), and Chaco Research Archive (CRA) records.';
  document.getElementById('info-artifacts').textContent = artifactsText;

  const artCanvas = document.getElementById('artifact-preview-canvas');
  const artCaption = document.getElementById('artifact-canvas-caption');
  const photoImg = document.getElementById('info-photo-img');
  const photoCap = document.getElementById('info-photo-cap');

  if (disc) {
    drawArtifactIllustration(artCanvas, disc.artType);
    if (artCaption) artCaption.textContent = `Schematic Diagram — ${disc.artCaption}`;
    if (photoImg) photoImg.src = disc.photo;
    if (photoCap) photoCap.textContent = disc.photoCap;
  } else {
    drawArtifactIllustration(artCanvas, feat.category === 'kiva' ? 'kiva_a' : 'tdoor_249');
    if (artCaption) {
      artCaption.textContent =
        feat.category === 'kiva'
          ? 'Schematic Diagram — Chacoan Recessed Kiva Architecture'
          : 'Schematic Diagram — Core-and-Veneer Sandstone Masonry & Pine Vigas';
    }
    if (photoImg) photoImg.src = './renders/pd_nps_pueblo_bonito_plan.jpg';
    if (photoCap) photoCap.textContent = 'NPS (Lekson 1984) & HABS No. NM-30 (LOC nm0107) Survey ↗';
  }

  updateDiscoveryCounterBadge();

  const drawer = document.getElementById('inspector-drawer');
  const reopenBtn = document.getElementById('btn-reopen-dossier');
  if (showDrawer && drawer) {
    drawer.classList.remove('hidden', 'collapsed-in-overview');
    if (reopenBtn) reopenBtn.classList.add('hidden');
  }
}

function drawArtifactIllustration(canvas, artType) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#120e0a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(229, 169, 101, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 20) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  ctx.save();
  if (artType === 'crypt_33') {
    const cx = w * 0.5;
    const cy = h * 0.44;
    for (let s = 0; s < 4; s++) {
      const rx = 42 + s * 11;
      const ry = 26 + s * 8;
      const beads = 26 + s * 6;
      for (let i = 0; i < beads; i++) {
        const ang = Math.PI * 0.12 + (i / (beads - 1)) * (Math.PI * 0.76);
        const bx = cx + Math.cos(ang) * rx;
        const by = cy + Math.sin(ang) * ry;
        ctx.fillStyle = i % 3 === 0 ? '#27b9a8' : '#4ce6d4';
        ctx.beginPath();
        ctx.arc(bx, by, 3.0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (const px of [cx - 48, cx + 48, cx - 18, cx + 18]) {
      ctx.fillStyle = '#38d6c4';
      ctx.fillRect(px - 6, h - 34, 12, 16);
      ctx.fillStyle = '#0d0a07';
      ctx.beginPath();
      ctx.arc(px, h - 30, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillText('>56,000 TURQUOISE PIECES (9/14 B2y1 mtDNA)', 10, 17);
  } else if (artType === 'kiva_a') {
    // Left: Great Kiva A floorplan schematic with 4 square rubble-filled masonry columns
    const kx = 82;
    const ky = 74;
    ctx.strokeStyle = '#d99b66';
    ctx.fillStyle = 'rgba(185, 133, 84, 0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(kx, ky, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 4 square rubble-filled masonry columns
    const colOffsets = [
      [-15, -15],
      [15, -15],
      [-15, 15],
      [15, 15],
    ];
    for (const [dx, dy] of colOffsets) {
      ctx.fillStyle = '#c89464';
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 1.3;
      ctx.fillRect(kx + dx - 6, ky + dy - 6, 12, 12);
      ctx.strokeRect(kx + dx - 6, ky + dy - 6, 12, 12);
    }
    // Central hearth & floor vault
    ctx.fillStyle = '#ff7733';
    ctx.fillRect(kx - 5, ky + 4, 10, 8);
    ctx.fillStyle = '#d7c7b6';
    ctx.font = '500 8.5px "JetBrains Mono", monospace';
    ctx.fillText('4 MASONRY COLUMNS', 34, 124);

    // Right: Dedicatory ceremonial turquoise offerings at Pueblo Bonito
    const nx = 218;
    const ny = 60;
    for (let s = 0; s < 4; s++) {
      const rx = 22 + s * 7.5;
      const ry = 16 + s * 6.5;
      const beads = 18 + s * 4;
      for (let i = 0; i < beads; i++) {
        const ang = Math.PI * 0.1 + (i / (beads - 1)) * (Math.PI * 0.8);
        const bx = nx + Math.cos(ang) * rx;
        const by = ny + Math.sin(ang) * ry;
        ctx.fillStyle = i % 2 === 0 ? '#27b9a8' : '#4ce6d4';
        ctx.beginPath();
        ctx.arc(bx, by, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#d7c7b6';
    ctx.fillText('DEDICATORY OFFERINGS', 160, 124);

    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillText('4 SQUARE COLUMNS, VAULTS & 34 OPEN NICHES', 12, 17);
  } else if (artType === 'cacao_28') {
    const jars = [
      { x: 68, y: 32, w: 34, h: 86 },
      { x: 130, y: 25, w: 38, h: 93 },
      { x: 196, y: 35, w: 34, h: 83 },
    ];
    for (const j of jars) {
      ctx.fillStyle = '#dfd6c7';
      ctx.strokeStyle = '#2a221b';
      ctx.lineWidth = 1.5;
      ctx.fillRect(j.x, j.y, j.w, j.h);
      ctx.strokeRect(j.x, j.y, j.w, j.h);
      ctx.strokeStyle = '#231d18';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(j.x + 4, j.y + 10, j.w - 8, j.h - 24);
      for (let d = 0; d < j.h - 30; d += 10) {
        ctx.beginPath();
        ctx.moveTo(j.x + 4, j.y + 12 + d);
        ctx.lineTo(j.x + j.w - 4, j.y + 22 + d);
        ctx.stroke();
      }
    }
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.0px "JetBrains Mono", monospace';
    ctx.fillText('~174 VESSELS (~111–112 CYLINDER JARS) • CACAO+', 10, 17);
  } else if (artType === 'macaw_38') {
    // Schematic of Room 38 Macaw Context (Pepper 1920; Watson et al. 2015; George et al. 2018)
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.2px "JetBrains Mono", monospace';
    ctx.fillText('ROOM 38 MACAW CONTEXT (INTERPRETIVE RECONSTRUCTION)', 10, 16);

    // Outer room masonry footprint
    ctx.fillStyle = 'rgba(229, 169, 101, 0.14)';
    ctx.strokeStyle = '#e5a965';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(28, 34);
    ctx.lineTo(206, 34);
    ctx.lineTo(212, 108);
    ctx.lineTo(36, 112);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Interpretive reconstructed ledge along northern wall
    ctx.fillStyle = 'rgba(229, 169, 101, 0.24)';
    ctx.fillRect(31, 37, 172, 10);
    ctx.strokeStyle = 'rgba(255, 211, 153, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.strokeRect(31, 37, 172, 10);

    // Upper North Wall ventilation openings (Interpretive Reconstruction)
    ctx.fillStyle = '#38d6c4';
    ctx.fillRect(68, 31, 20, 6);
    ctx.fillRect(136, 31, 24, 6);
    ctx.fillStyle = '#a8f5ec';
    ctx.font = '600 7.2px "JetBrains Mono", monospace';
    ctx.fillText('NORTH VENTS (RECONSTRUCTED)', 58, 28);

    // East Wall Doorway
    ctx.fillStyle = '#120e0a';
    ctx.fillRect(206, 62, 8, 22);
    ctx.strokeStyle = '#38d6c4';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(206, 62, 6, 22);
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 7.2px "JetBrains Mono", monospace';
    ctx.fillText('EAST DOOR', 216, 72);
    ctx.fillText('(RECONSTR.)', 216, 82);

    // Two subfloor pits where 2 of the 14 macaws were buried (Pepper 1920)
    for (const [px, py, lbl] of [
      [72, 74, 'SUBFLOOR PIT 1'],
      [126, 76, 'SUBFLOOR PIT 2'],
    ]) {
      ctx.fillStyle = 'rgba(229, 57, 45, 0.28)';
      ctx.strokeStyle = '#ff6b5b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px, py, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 7.5px "JetBrains Mono", monospace';
      ctx.fillText('MACAW', px - 13, py + 2.5);
      ctx.fillStyle = '#ffb3a7';
      ctx.font = '500 7px "Inter", sans-serif';
      ctx.fillText(lbl, px - 24, py + 20);
    }

    // Turquoise-inlaid black jet frog findspot & 12 macaw skeletons in thick guano deposit
    ctx.fillStyle = 'rgba(56, 214, 196, 0.26)';
    ctx.strokeStyle = '#38d6c4';
    ctx.lineWidth = 1.5;
    ctx.fillRect(162, 56, 34, 24);
    ctx.strokeRect(162, 56, 34, 24);
    ctx.fillStyle = '#a8f5ec';
    ctx.font = '700 7.5px "JetBrains Mono", monospace';
    ctx.fillText('JET FROG', 165, 67);
    ctx.fillText('+ 12 IN GUANO', 160, 76);

    // Bottom architectural legend
    ctx.fillStyle = '#d7c7b6';
    ctx.font = '500 7.8px "JetBrains Mono", monospace';
    ctx.fillText('14 ARA MACAO (12 IN GUANO, 2 SUBFLOOR) • HAPLO6 CLADE', 8, 128);
  } else if (artType === 'burial_326') {
    // 4-room Western Burial Cluster schematic highlighting Room 326 (12 individuals in reassessment: 11 adults [10♀, 1♂] & 1 infant; older inventories reported 11)
    const rooms = [
      { code: 'RM 320', sub: 'Women/Subadults', x: 26, y: 34, w: 60, h: 36, active: false },
      { code: 'RM 326', sub: '12 Burials: 11 Adults (10♀, 1♂) + 1 Infant', x: 96, y: 30, w: 196, h: 44, active: true },
      { code: 'RM 329', sub: 'Cluster Burial', x: 26, y: 78, w: 60, h: 34, active: false },
      { code: 'RM 330', sub: 'Pepper / Judd', x: 96, y: 80, w: 196, h: 32, active: false },
    ];
    for (const r of rooms) {
      ctx.fillStyle = r.active ? 'rgba(56, 214, 196, 0.22)' : 'rgba(229, 169, 101, 0.12)';
      ctx.strokeStyle = r.active ? '#38d6c4' : 'rgba(229, 169, 101, 0.5)';
      ctx.lineWidth = r.active ? 1.8 : 1.0;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      ctx.fillStyle = r.active ? '#ffffff' : '#ffd399';
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      ctx.fillText(r.code, r.x + 6, r.y + 14);
      ctx.fillStyle = r.active ? '#a8f5ec' : '#c8b8a6';
      ctx.font = '500 8.5px "Inter", sans-serif';
      ctx.fillText(r.sub, r.x + 6, r.y + 28);
    }
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.0px "JetBrains Mono", monospace';
    ctx.fillText('RM 326: 12 INDIVIDUALS (10♀, 1♂, 1 INFANT • OLDER: 11)', 10, 17);
  } else if (artType === 'lapidary_168') {
    // Southeastern Craft / Lapidary Sector Schematic for Room 168
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.2px "JetBrains Mono", monospace';
    ctx.fillText('SOUTHEASTERN LAPIDARY & CRAFT ACTIVITY SECTOR', 12, 17);

    // Sandstone abrading slab
    ctx.fillStyle = '#b98554';
    ctx.strokeStyle = '#e5a965';
    ctx.lineWidth = 2;
    ctx.fillRect(36, 38, 114, 68);
    ctx.strokeRect(36, 38, 114, 68);
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 8px "JetBrains Mono", monospace';
    ctx.fillText('SANDSTONE ABRADING SLAB', 42, 118);

    // Turquoise & shell bead blanks being worked
    const blanks = [
      [182, 52],
      [206, 52],
      [230, 52],
      [194, 78],
      [218, 78],
      [242, 78],
    ];
    for (const [bx, by] of blanks) {
      ctx.fillStyle = '#38d6c4';
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#120e0a';
      ctx.beginPath();
      ctx.arc(bx, by, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#a8f5ec';
    ctx.fillText('LAPIDARY BEAD BLANKS', 168, 118);
  } else if (artType === 'tdoor_249') {
    const ox = Math.round((w - 176) * 0.5);
    ctx.fillStyle = '#b98554';
    ctx.fillRect(ox, 26, 176, 108);
    ctx.fillStyle = '#5c3f28';
    for (let y = 34; y < 130; y += 18) {
      ctx.fillRect(ox, y, 176, 5);
    }
    ctx.fillStyle = '#090705';
    ctx.fillRect(ox + 50, 42, 76, 46);
    ctx.fillRect(ox + 66, 88, 44, 46);
    ctx.fillStyle = '#6e4726';
    ctx.fillRect(ox + 42, 36, 92, 6);
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 9.2px "JetBrains Mono", monospace';
    ctx.fillText('CHACOAN MASONRY & DOORWAY (INTERPRETIVE RECONSTR.)', 10, 18);
  } else if (artType === 'solstice_228' || artType === 'sundagger_297') {
    const cx = w * 0.5;
    const cy = h * 0.56;
    ctx.strokeStyle = '#c8a97e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 11; a += 0.15) {
      const r = a * 1.35;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 214, 102, 0.85)';
    ctx.beginPath();
    ctx.moveTo(cx - 5, 24);
    ctx.lineTo(cx + 5, 24);
    ctx.lineTo(cx + 2, cy + 44);
    ctx.lineTo(cx - 2, cy + 44);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffd399';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText(
      artType === 'solstice_228' ? '120° ESE SOLSTICE CORNER BEAM' : 'FAJADA BUTTE SUN DAGGER',
      14,
      18
    );
  } else {
    ctx.strokeStyle = '#e5a965';
    ctx.fillStyle = 'rgba(229, 169, 101, 0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.54, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#38d6c4';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.54, 18, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.fillText('EXCAVATED ARCHAEOLOGICAL ASSEMBLAGE', 14, 18);
  }
  ctx.restore();
}

// ============================================================================
// 13. 2D GEOREFERENCED CRA FLOORPLAN MINIMAP
// ============================================================================
function drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  if (!canvas || !chacoData) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0c0907';
  ctx.fillRect(0, 0, w, h);

  const siteFeats = chacoData.features.filter(
    (f) =>
      f.site === currentMinimapSite &&
      !f.subcourt &&
      !String(f.id || '').startsWith('landmark_') &&
      f.category !== 'landmark' &&
      f.category !== 'mound' &&
      Array.isArray(f.polygon) &&
      f.polygon.length > 0
  );
  if (siteFeats.length === 0) return;

  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (const f of siteFeats) {
    for (const [px, py] of f.polygon) {
      if (px < minX) minX = px;
      if (px > maxX) maxX = px;
      if (py < minY) minY = py;
      if (py > maxY) maxY = py;
    }
  }

  const pad = 16;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
  const offX = (w - spanX * scale) * 0.5;
  const offY = (h - spanY * scale) * 0.5;

  const toCanvas = (px, py) => [
    offX + (px - minX) * scale,
    h - (offY + (py - minY) * scale),
  ];

  canvas.dataset.minX = minX;
  canvas.dataset.minY = minY;
  canvas.dataset.scale = scale;
  canvas.dataset.offX = offX;
  canvas.dataset.offY = offY;

  for (const f of siteFeats) {
    ctx.beginPath();
    f.polygon.forEach(([px, py], idx) => {
      const [cx, cy] = toCanvas(px, py);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();

    const isSelected =
      selectedFeature &&
      (selectedFeature.id === f.id ||
        (selectedFeature.id === 'pueblo_bonito_240' && f.id === 'pueblo_bonito_377') ||
        (selectedFeature.id === 'pueblo_bonito_377' && f.id === 'pueblo_bonito_240'));
    if (isSelected) {
      ctx.fillStyle = '#38d6c4';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
    } else if (f.category === 'kiva' || f.category === 'great_kiva') {
      ctx.fillStyle = 'rgba(224, 90, 54, 0.62)';
      ctx.strokeStyle = '#ff8b66';
      ctx.lineWidth = 1.0;
    } else if ((f.phase || '').includes('Stage I')) {
      ctx.fillStyle = 'rgba(148, 84, 52, 0.72)';
      ctx.strokeStyle = 'rgba(229, 169, 101, 0.5)';
      ctx.lineWidth = 0.7;
    } else if ((f.stories || 1) >= 4) {
      ctx.fillStyle = 'rgba(218, 144, 78, 0.76)';
      ctx.strokeStyle = 'rgba(255, 215, 160, 0.6)';
      ctx.lineWidth = 0.8;
    } else {
      ctx.fillStyle = 'rgba(184, 148, 104, 0.45)';
      ctx.strokeStyle = 'rgba(229, 169, 101, 0.35)';
      ctx.lineWidth = 0.6;
    }
    ctx.fill();
    ctx.stroke();
  }

  for (const disc of CRA_DISCOVERIES) {
    const f = featureById.get(disc.id);
    if (!f || f.site !== currentMinimapSite || f.category === 'landmark') continue;
    const [cx, cy] = toCanvas(f.cx, f.cy);
    ctx.fillStyle = '#38d6c4';
    ctx.beginPath();
    ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#090705';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  if (camera) {
    const camPlanX = camera.position.x;
    const camPlanY = -camera.position.z;
    if (
      camPlanX >= minX - 25 &&
      camPlanX <= maxX + 25 &&
      camPlanY >= minY - 25 &&
      camPlanY <= maxY + 25
    ) {
      const [ux, uy] = toCanvas(camPlanX, camPlanY);
      const lookAngle = -walkYaw - Math.PI * 0.5;
      ctx.save();
      ctx.fillStyle = 'rgba(255, 235, 59, 0.28)';
      ctx.beginPath();
      ctx.moveTo(ux, uy);
      ctx.arc(ux, uy, 18, lookAngle - 0.45, lookAngle + 0.45);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.arc(ux, uy, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ============================================================================
// 14. WALKTHROUGH VIDEO RECORDER
// ============================================================================
let compositeCanvas = null;
let compositeCtx = null;
let currentTourBanner = null;

function ensureCompositeCanvas() {
  if (!compositeCanvas) {
    compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = 1280;
    compositeCanvas.height = 720;
    compositeCtx = compositeCanvas.getContext('2d');
  }
  return compositeCanvas;
}

function formatSolarHour(hr) {
  const h = Math.floor(hr);
  const m = Math.round((hr - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = (text || '').split(/\s+/);
  let line = '';
  let linesDrawn = 0;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, y);
      line = words[n] + ' ';
      y += lineHeight;
      linesDrawn++;
      if (linesDrawn >= maxLines - 1) {
        const rem = words.slice(n).join(' ');
        ctx.fillText(rem.slice(0, 58) + (rem.length > 58 ? '…' : ''), x, y);
        return y + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y);
    y += lineHeight;
  }
  return y;
}

function renderCompositeWalkthroughFrame(bannerInfo = null) {
  ensureCompositeCanvas();
  const ctx = compositeCtx;
  const w = compositeCanvas.width;
  const h = compositeCanvas.height;

  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(renderer.domElement, 0, 0, w, h);

  camera.updateMatrixWorld();
  ctx.save();
  for (const lbl of cssLabels) {
    if (!lbl.visible || !discoveryMarkersGroup.visible || lbl.element.style.display === 'none') continue;
    _projVec.copy(lbl.position);
    const dist = camera.position.distanceTo(_projVec);
    if (dist > 430) continue;
    _projVec.project(camera);
    if (_projVec.z < -1 || _projVec.z > 1) continue;
    if (Math.abs(_projVec.x) > 0.94 || _projVec.y < -0.88 || _projVec.y > 0.80) continue;

    const sx = (_projVec.x * 0.5 + 0.5) * w;
    const sy = (-_projVec.y * 0.5 + 0.5) * h;
    const text = (lbl.element.textContent || '').trim();
    if (!text) continue;

    const isBeacon = lbl.element.classList.contains('discovery-beacon');
    const isActive = lbl.element.classList.contains('active-beacon');

    ctx.font = isBeacon ? '600 11px "Inter", sans-serif' : '600 10px "Cinzel", serif';
    const tw = ctx.measureText(text).width;
    const pw = tw + 18;
    const ph = isBeacon ? 22 : 20;
    const px = sx - pw * 0.5;
    const py = sy - ph * 0.5;

    roundRectPath(ctx, px, py, pw, ph, ph * 0.5);
    ctx.fillStyle = isActive
      ? 'rgba(18, 48, 46, 0.92)'
      : isBeacon
      ? 'rgba(14, 11, 9, 0.86)'
      : 'rgba(20, 15, 11, 0.80)';
    ctx.fill();
    ctx.lineWidth = isActive ? 1.8 : 1.1;
    ctx.strokeStyle = isActive
      ? '#38d6c4'
      : isBeacon
      ? 'rgba(56, 214, 196, 0.65)'
      : 'rgba(229, 169, 101, 0.55)';
    ctx.stroke();

    ctx.fillStyle = isActive ? '#ffffff' : isBeacon ? '#e8f9f7' : '#f3dfc1';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, px + 9, sy);
  }
  ctx.restore();

  ctx.save();
  roundRectPath(ctx, 16, 12, w - 32, 44, 12);
  ctx.fillStyle = 'rgba(16, 12, 10, 0.86)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(229, 169, 101, 0.32)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#f5d9b0';
  ctx.font = '700 14px "Cinzel", serif';
  ctx.fillText('CHACO CANYON', 32, 31);
  ctx.fillStyle = '#38d6c4';
  ctx.font = '600 10px "JetBrains Mono", monospace';
  ctx.fillText('AD 850–1150 • 3D ARCHITECTURAL RECONSTRUCTION & WALKTHROUGH', 32, 46);

  const info = bannerInfo || currentTourBanner;
  const modeTitle = info ? info.partBadge : `MODE: ${currentMode.toUpperCase()}`;
  ctx.font = '600 11px "JetBrains Mono", monospace';
  const mw = ctx.measureText(modeTitle).width + 24;
  roundRectPath(ctx, w * 0.5 - mw * 0.5, 20, mw, 28, 14);
  ctx.fillStyle = 'rgba(56, 214, 196, 0.16)';
  ctx.fill();
  ctx.strokeStyle = '#38d6c4';
  ctx.stroke();
  ctx.fillStyle = '#e8f9f7';
  ctx.fillText(modeTitle, w * 0.5 - mw * 0.5 + 12, 38);

  const clockStr =
    currentSeason === 'night'
      ? '🌙 DARK SKY NIGHT 21:30'
      : `☀️ ${currentSeason.toUpperCase()} ${formatSolarHour(currentHour)}`;
  ctx.fillStyle = '#ffd399';
  ctx.font = '600 11px "JetBrains Mono", monospace';
  ctx.fillText(clockStr, w - ctx.measureText(clockStr).width - 32, 38);
  ctx.restore();

  if (info && info.showDossier && selectedFeature) {
    ctx.save();
    const dx = w - 356,
      dy = 72,
      dw = 336,
      dh = 370;
    roundRectPath(ctx, dx, dy, dw, dh, 14);
    ctx.fillStyle = 'rgba(15, 12, 10, 0.90)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 214, 196, 0.48)';
    ctx.lineWidth = 1.3;
    ctx.stroke();

    ctx.fillStyle = '#38d6c4';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    const subStr = `${SITE_LABELS[selectedFeature.site] || 'Chaco Canyon'} • ${selectedFeature.phase || 'Classic Bonito'}`;
    ctx.fillText(subStr.slice(0, 48), dx + 16, dy + 24);

    ctx.fillStyle = '#fff4e4';
    ctx.font = '700 14px "Cinzel", serif';
    const titleStr = selectedFeature.title || selectedFeature.name || selectedFeature.id;
    wrapCanvasText(ctx, titleStr, dx + 16, dy + 44, dw - 44, 17, 2);

    const artCanvas = document.getElementById('artifact-preview-canvas');
    if (artCanvas) {
      ctx.drawImage(artCanvas, dx + 16, dy + 68, dw - 32, 128);
      ctx.strokeStyle = 'rgba(229, 169, 101, 0.35)';
      ctx.strokeRect(dx + 16, dy + 68, dw - 32, 128);
    }

    const statsStr = `Area: ${(selectedFeature.area_m2 || 18).toFixed(1)} m²  |  Height: ${(selectedFeature.height_m || 4.2).toFixed(1)} m  |  Stories: ${selectedFeature.stories || 1}`;
    ctx.fillStyle = '#ffd399';
    ctx.font = '600 10.5px "JetBrains Mono", monospace';
    ctx.fillText(statsStr, dx + 16, dy + 214);

    ctx.fillStyle = '#d7c7b6';
    ctx.font = '400 11.5px "Inter", sans-serif';
    const desc =
      selectedFeature.summary ||
      (Array.isArray(selectedFeature.artifacts) ? selectedFeature.artifacts.join(' • ') : '');
    wrapCanvasText(ctx, desc, dx + 16, dy + 234, dw - 40, 15.5, 6);

    ctx.fillStyle = '#38d6c4';
    ctx.font = '600 9.5px "JetBrains Mono", monospace';
    ctx.fillText('SOURCE: NPS / HABS NO. NM-30 (LOC nm0107) / 0.5m LIDAR / AMNH / NMNH', dx + 16, dy + dh - 14);
    ctx.restore();
  }

  if (info && info.showMinimap) {
    drawMinimap();
    const miniCanvas = document.getElementById('minimap-canvas');
    if (miniCanvas) {
      ctx.save();
      const mx = 20,
        my = h - 322,
        mw = 336,
        mh = 242;
      roundRectPath(ctx, mx, my, mw, mh, 14);
      ctx.fillStyle = 'rgba(14, 11, 9, 0.92)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(229, 169, 101, 0.48)';
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.fillStyle = '#ffd399';
      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillText('2D GEOREFERENCED FLOORPLAN (OPEN EAST & WEST COURTS)', mx + 14, my + 20);

      ctx.drawImage(miniCanvas, mx + 12, my + 28, mw - 24, mh - 38);
      ctx.strokeStyle = 'rgba(229, 169, 101, 0.28)';
      ctx.strokeRect(mx + 12, my + 28, mw - 24, mh - 38);
      ctx.restore();
    }
  }

  if (info) {
    ctx.save();
    const bx = 20,
      by = h - 66,
      bw = w - 40,
      bh = 52;
    roundRectPath(ctx, bx, by, bw, bh, 12);
    ctx.fillStyle = 'rgba(12, 9, 7, 0.90)';
    ctx.fill();
    ctx.strokeStyle = info.accentColor || '#38d6c4';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = info.accentColor || '#38d6c4';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.fillText(info.title, bx + 18, by + 21);

    ctx.fillStyle = '#f3e7d8';
    ctx.font = '400 12px "Inter", sans-serif';
    ctx.fillText(info.subtitle, bx + 18, by + 40);

    if (info.telemetry) {
      ctx.fillStyle = '#ffd399';
      ctx.font = '600 11px "JetBrains Mono", monospace';
      const tw = ctx.measureText(info.telemetry).width;
      ctx.fillText(info.telemetry, bx + bw - tw - 18, by + 31);
    }
    ctx.restore();
  }
}

function applyContinuousTourState(progress) {
  const smoothstep = (a, b, x) => {
    const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const lerpVec = (a, b, t) => [
    THREE.MathUtils.lerp(a[0], b[0], t),
    THREE.MathUtils.lerp(a[1], b[1], t),
    THREE.MathUtils.lerp(a[2], b[2], t),
  ];

  discoveryMarkersGroup.visible = true;
  alignmentGroup.visible = true;

  if (progress < 0.11) {
    const t = smoothstep(0.0, 0.11, progress);
    activeChapterIndex = 0;
    applyPhaseFilter('all');
    updateSolarLighting('equinox', THREE.MathUtils.lerp(16.6, 17.0, t));
    const pos = lerpVec([-24.0, 64.0, 108.0], [-18.0, 28.0, 14.0], t);
    const tgt = lerpVec([0.0, 3.5, -8.0], [-28.0, 4.0, -28.0], t);
    camera.position.set(...pos);
    controls.target.set(...tgt);
    currentTourBanner = {
      partBadge: '3D ARCHITECTURAL RECONSTRUCTION (0.5m LIDAR & ARCHAEOLOGICAL SURVEY)',
      title: '01 / PUEBLO BONITO 3D ARCHITECTURAL RECONSTRUCTION (0.5m LIDAR & SURVEY)',
      subtitle: 'Georeferenced D-shaped Great House with open East & West Courts, 35+ kivas & 12 guided rooms',
      telemetry: 'NPS (Lekson 1984) • ~800 Rooms',
      accentColor: '#38d6c4',
      showDossier: false,
    };
  } else if (progress < 0.22) {
    const t = smoothstep(0.11, 0.22, progress);
    activeChapterIndex = 1;
    applyPhaseFilter('stage1');
    updateSolarLighting('equinox', THREE.MathUtils.lerp(16.7, 17.0, t));
    if (!selectedFeature || selectedFeature.id !== 'pueblo_bonito_380') {
      populateInspectorDossier(featureById.get('pueblo_bonito_380'), true);
    }
    const pos = lerpVec([-18.0, 28.0, 14.0], [-14.0, 20.0, -2.0], t);
    const tgt = lerpVec([-28.0, 4.0, -28.0], [-32.4, 3.8, -32.6], t);
    camera.position.set(...pos);
    controls.target.set(...tgt);
    currentTourBanner = {
      partBadge: 'SECTION II • OLD BONITO SACRED CORE',
      title: '02 / ROOM 33 (WITH UPPER ROOM 58) HIGH-STATUS MATRILINEAL CRYPT',
      subtitle: 'At least 14 burials (9 with usable mtDNA all sharing haplotype B2y1), >56,000 turquoise pieces & wooden flutes',
      telemetry: 'AMNH Hyde Expedition • Stage I (AD 850–935)',
      accentColor: '#38d6c4',
      showDossier: true,
    };
  } else if (progress < 0.33) {
    const t = smoothstep(0.22, 0.33, progress);
    const isMacaw = t >= 0.5;
    activeChapterIndex = isMacaw ? 3 : 2;
    applyPhaseFilter('all');
    updateSolarLighting('equinox', THREE.MathUtils.lerp(16.8, 16.5, t));
    const targetId = isMacaw ? 'pueblo_bonito_352' : 'pueblo_bonito_240';
    if (!selectedFeature || selectedFeature.id !== targetId) {
      populateInspectorDossier(featureById.get(targetId), true);
    }
    const pos = lerpVec([-14.0, 20.0, -2.0], [-3.0, 21.0, -8.0], t);
    const tgt = lerpVec([-24.4, 3.8, -30.7], [-14.6, 4.0, -39.9], t);
    camera.position.set(...pos);
    controls.target.set(...tgt);
    currentTourBanner = {
      partBadge: 'SECTION II • MESOAMERICAN TRADE CACHES',
      title: isMacaw
        ? '03B / ROOM 38 — MACAW-KEEPING ROOM & RITUAL DEPOSIT'
        : '03A / ROOM 28 — CYLINDER JAR CACHE & CACAO RESIDUE',
      subtitle: isMacaw
        ? '14 scarlet macaw skeletons (12 in thick guano deposit, 2 in subfloor hollows) & turquoise-inlaid jet frog (Pepper 1920)'
        : '~174 ceramic vessels (~111–112 cylinder jars, ~99 on storage shelf; Pepper 1920) & absorbed theobromine residue (Crown & Hurst 2009)',
      telemetry: isMacaw ? 'Room 38 • 14 Ara macao' : 'Room 28 • Multi-Phase Remodeled Chamber',
      accentColor: '#e5a965',
      showDossier: true,
    };
  } else if (progress < 0.44) {
    const t = smoothstep(0.33, 0.44, progress);
    const isKiva = t >= 0.48;
    activeChapterIndex = isKiva ? 6 : 5;
    applyPhaseFilter('all');
    updateSolarLighting('summer', THREE.MathUtils.lerp(16.6, 17.1, t));
    const targetId = isKiva ? 'pueblo_bonito_159' : 'pueblo_bonito_257';
    if (!selectedFeature || selectedFeature.id !== targetId) {
      populateInspectorDossier(featureById.get(targetId), true);
    }
    const pos = isKiva
      ? lerpVec([16.0, 20.0, 36.0], [-8.3, 17.5, 40.0], (t - 0.48) / 0.52)
      : lerpVec([-3.0, 21.0, -8.0], [28.0, 16.5, 24.0], t / 0.48);
    const tgt = isKiva
      ? lerpVec([20.0, 2.5, 16.0], [-8.3, 1.0, 21.4], (t - 0.48) / 0.52)
      : lerpVec([24.0, 3.8, 4.0], [51.0, 1.85, 10.4], t / 0.48);
    camera.position.set(...pos);
    controls.target.set(...tgt);
    currentTourBanner = {
      partBadge: isKiva ? 'SECTION III • GREAT KIVAS' : 'SECTION IV • EAST WING',
      title: isKiva
        ? '04B / GREAT KIVA A — EAST COURT SANCTUARY (4 SQUARE MASONRY COLUMNS)'
        : '04A / ROOM 249 — MACAW-KEEPING ROOM',
      subtitle: isKiva
        ? 'Recessed East Court sanctuary with 4 square rubble-filled masonry columns, subfloor vaults & 34 wall niches'
        : '3 Ara macao skeletons on packed avian droppings floor with perches & 2 adobe food bowls (Judd 1954)',
      telemetry: isKiva ? 'Smithsonian NMNH • 4 Square Masonry Columns' : 'Smithsonian NMNH (Judd 1954) • Room 249',
      accentColor: '#38d6c4',
      showDossier: true,
    };
  } else if (progress < 0.55) {
    const t = smoothstep(0.44, 0.55, progress);
    const isFloorplanPhase = t < 0.50;
    updateSolarLighting('equinox', 16.85);
    if (isFloorplanPhase) {
      if (!selectedFeature || selectedFeature.id !== 'pueblo_bonito_406') {
        populateInspectorDossier(featureById.get('pueblo_bonito_406'), true);
      }
      const subT = t / 0.50;
      const pos = lerpVec([-32.0, 22.0, 12.0], [-36.0, 18.0, 4.0], subT);
      const tgt = lerpVec([-56.9, 3.5, -16.2], [-56.9, 3.2, -16.2], subT);
      camera.position.set(...pos);
      controls.target.set(...tgt);
      currentTourBanner = {
        partBadge: 'SECTION V • OLD BONITO ARCHITECTURAL BLOCK & 2D FLOORPLAN',
        title: '05A / ROOM 326 — WESTERN BURIAL CLUSTER CHAMBER',
        subtitle: 'Old Bonito room (~AD 860–935) reused for 12 burials in reassessment (10♀, 1♂, 1 infant; older inventories: 11)',
        telemetry: 'Room 326 • 12 Individuals (Older Inventories: 11)',
        accentColor: '#38d6c4',
        showDossier: true,
        showMinimap: true,
      };
    } else {
      const subT = (t - 0.50) / 0.50;
      const pos = lerpVec([16.0, 3.2, 24.0], [-18.0, 5.4, -14.0], subT);
      const tgt = lerpVec([-8.0, 4.0, -18.0], [-28.0, 4.2, -32.0], subT);
      camera.position.set(...pos);
      controls.target.set(...tgt);
      currentTourBanner = {
        partBadge: 'FIRST-PERSON PLAZA & ROOM WALKTHROUGH',
        title: '05B / EYE-LEVEL WALKTHROUGH ACROSS PUEBLO BONITO PLAZA & TERRACES',
        subtitle: 'Walk freely with WASD / Arrows across the open East & West Courts or use the Guided Walkthrough',
        telemetry: 'WASD + Mouse Look • 6 Guided Sections',
        accentColor: '#e5a965',
        showDossier: false,
        showMinimap: false,
      };
    }
  } else if (progress < 0.74) {
    const t = smoothstep(0.55, 0.74, progress);
    updateSolarLighting('equinox', 16.85);
    let phaseKey = 'stage1';
    let stageTitle = 'STAGE I (AD 850–935): OLD BONITO NORTHERN CRESCENT — TYPE I TABULAR MASONRY';
    let stageSub = 'Dendrochronology (Windes & Ford 1996): 1-story crude sandstone slab arc (~100 rooms, Rooms 1–65)';
    let stageStat = 'Stage 1/4 • AD 850–935 • Type I Masonry';
    if (t >= 0.75) {
      phaseKey = 'all';
      stageTitle = 'STAGE IV (AD 1085–1115): SOUTH ARC ENCLOSURE, DIVIDED PLAZA & 35+ KIVAS';
      stageSub = 'Complete D-shaped monumental Great House (~175m [162–175m] × 98m) with Type IV tabular ashlar & meridian wall';
      stageStat = 'Stage 4/4 • AD 1085–1115 • ~800 Rooms';
    } else if (t >= 0.50) {
      phaseKey = 'stage3';
      stageTitle = 'STAGE III (AD 1060–1085): EAST & WEST WINGS + RECESSED GREAT KIVAS';
      stageSub = 'Monumental expansion with Type III banded sandstone veneer and recessed plaza Great Kivas';
      stageStat = 'Stage 3/4 • AD 1060–1085 • Type III Banded Veneer';
    } else if (t >= 0.25) {
      phaseKey = 'stage2';
      stageTitle = 'STAGE II (AD 1040–1060): RECONSTRUCTED 4-STORY NORTHERN SPINE (~14.0M)';
      stageSub = 'Massive multi-story terraced spine erected along the cliff face using Type II core-and-veneer';
      stageStat = 'Stage 2/4 • AD 1040–1060 • Est. 4 Stories (~14.0m)';
    }
    applyPhaseFilter(phaseKey);

    const angle = THREE.MathUtils.lerp(-0.65, 0.65, t);
    const radius = THREE.MathUtils.lerp(108.0, 94.0, t);
    camera.position.set(
      Math.sin(angle) * radius,
      THREE.MathUtils.lerp(62.0, 48.0, t),
      Math.cos(angle) * radius
    );
    controls.target.set(0.0, 3.5, -8.0);

    currentTourBanner = {
      partBadge: '3D ARCHITECTURAL MODEL CHRONOLOGY',
      title: `06 / ${stageTitle}`,
      subtitle: stageSub,
      telemetry: stageStat,
      accentColor: '#38d6c4',
      showDossier: false,
    };
  } else if (progress < 0.88) {
    const t = smoothstep(0.74, 0.88, progress);
    applyPhaseFilter('all');
    const solarHr = THREE.MathUtils.lerp(6.25, 17.45, t);
    updateSolarLighting('summer', solarHr);

    const pos = lerpVec([68.0, 32.0, 44.0], [72.0, 26.0, -10.0], t);
    const tgt = lerpVec([12.0, 5.0, -6.0], [22.0, 8.5, -40.0], t);
    camera.position.set(...pos);
    controls.target.set(...tgt);

    currentTourBanner = {
      partBadge: 'ARCHAEOASTRONOMY & CLIFF GEOMORPHOLOGY',
      title: '07 / SOLAR SHADOW SWEEP (06:15 → 17:25) & 1941 THREATENING ROCK COLLAPSE',
      subtitle: 'True 36.06°N solar azimuth shadow casting across reconstructed 4-story masonry & 30,000-ton Jan 22, 1941 rockfall',
      telemetry: `Lat 36.06°N • Solar Time ${formatSolarHour(solarHr)}`,
      accentColor: '#e5a965',
      showDossier: false,
    };
  } else {
    const t = smoothstep(0.88, 1.0, progress);
    applyPhaseFilter('all');
    updateSolarLighting('night', 21.5);

    const pos = lerpVec([42.0, 52.0, 92.0], [-4.0, 46.0, 80.0], t);
    const tgt = lerpVec([8.0, 3.0, -4.0], [-4.0, 2.0, -12.0], t);
    camera.position.set(...pos);
    controls.target.set(...tgt);

    currentTourBanner = {
      partBadge: 'DARK SKY NIGHT & KIVA HEARTH FIRES',
      title: '08 / CEREMONIAL KIVA HEARTH FIRES UNDER THE CHACO DARK SKY (1,885M)',
      subtitle: 'Recessed firebox embers & point lights anchored inside 8 kiva floors across Pueblo Bonito',
      telemetry: '8 Recessed Kiva Hearths • 21:30 Night Sky',
      accentColor: '#ff8b66',
      showDossier: false,
    };
  }

  controls.update();
}

function toggleWalkthroughVideoRecording() {
  const btn = document.getElementById('btn-record-video');
  const label = document.getElementById('record-btn-label');

  if (isRecordingWalkthrough && mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    return;
  }

  try {
    const compCanvas = ensureCompositeCanvas();
    const stream = compCanvas.captureStream(30);
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
    ];
    const selectedMime = mimeTypes.find((m) => MediaRecorder.isTypeSupported(m)) || '';

    recordedChunks = [];
    mediaRecorder = selectedMime
      ? new MediaRecorder(stream, { mimeType: selectedMime, videoBitsPerSecond: 10_000_000 })
      : new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      isRecordingWalkthrough = false;
      autoTourActive = false;
      currentTourBanner = null;
      btn.classList.remove('recording');
      label.textContent = 'Record';

      const blob = new Blob(recordedChunks, { type: selectedMime || 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'chaco-canyon-3d-walkthrough.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    mediaRecorder.start(200);
    isRecordingWalkthrough = true;
    autoTourActive = true;
    autoTourStartTime = performance.now();
    btn.classList.add('recording');
    label.textContent = '⏹ Stop';
  } catch (err) {
    console.error('Video recording error:', err);
    label.textContent = 'Unavailable';
  }
}

function updateAutoTour(now) {
  const elapsedSec = (now - autoTourStartTime) / 1000;
  const durationSec = 15.0;

  if (elapsedSec >= durationSec) {
    if (isRecordingWalkthrough && mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
    }
    autoTourActive = false;
    currentTourBanner = null;
    return;
  }

  const progress = THREE.MathUtils.clamp(elapsedSec / durationSec, 0, 1);
  applyContinuousTourState(progress);
}

async function runDeterministicTourCapture() {
  const params = new URLSearchParams(window.location.search);
  const totalFrames = parseInt(params.get('frames') || '360', 10);
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'none';

  userOverridingStoryCamera = true;
  ensureCompositeCanvas();

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / Math.max(1, totalFrames - 1);
    const simTimeMs = i * (1000 / 24);

    applyContinuousTourState(progress);
    updateSunShadowFrustum();

    for (const child of discoveryMarkersGroup.children) {
      if (child.isMesh && child.userData.baseY !== undefined) {
        child.rotation.y = simTimeMs * 0.0022;
        child.position.y =
          child.userData.baseY + Math.sin(simTimeMs * 0.004 + child.position.x) * 0.35;
      }
    }

    if (fireLightsGroup.visible) {
      for (const child of fireLightsGroup.children) {
        if (child.isPointLight) {
          child.intensity = 16.0 + Math.sin(simTimeMs * 0.015 + child.userData.phase) * 3.0;
        }
      }
    }

    updateLabelFrustumVisibility();
    renderScenePipeline();
    renderCompositeWalkthroughFrame(currentTourBanner);

    const dataUrl = compositeCanvas.toDataURL('image/jpeg', 0.92);
    try {
      await fetch(`/__frame__?index=${i}`, {
        method: 'POST',
        body: dataUrl,
      });
    } catch (e) {
      console.error('Frame POST error:', e);
    }
  }

  try {
    await fetch('/__done__', { method: 'POST', body: 'ok' });
  } catch (e) {
    // ignore
  }
}

// ============================================================================
// 15. GUIDED WALKTHROUGH ENGINE & PROXIMITY DISCOVERY
// ============================================================================
function toggleGuidedWalk() {
  if (guidedWalkActive) {
    stopGuidedWalk();
  } else {
    startGuidedWalk();
  }
}

function startGuidedWalk() {
  controls.autoRotate = false;
  const autoBtn = document.getElementById('btn-toggle-autorotate');
  if (autoBtn) autoBtn.classList.remove('active');

  if (currentMode === 'orbit') {
    setExperienceMode('guided', false);
  }
  guidedWalkActive = true;
  const btn = document.getElementById('btn-guided-walk');
  const icon = document.getElementById('guided-walk-icon');
  const label = document.getElementById('guided-walk-label');
  if (btn) btn.classList.add('active');
  if (icon) icon.textContent = '⏸';
  if (label) label.textContent = 'Pause Guide';

  const curIdx = CRA_DISCOVERIES.findIndex((d) => selectedFeature && d.id === selectedFeature.id);
  guidedWalkIndex = curIdx >= 0 ? curIdx : 0;
  advanceGuidedWalkStep();
}

function stopGuidedWalk() {
  guidedWalkActive = false;
  const btn = document.getElementById('btn-guided-walk');
  const icon = document.getElementById('guided-walk-icon');
  const label = document.getElementById('guided-walk-label');
  if (btn) btn.classList.remove('active');
  if (icon) icon.textContent = '▶';
  if (label) label.textContent = 'Auto-Guide Tour';
}

function advanceGuidedWalkStep() {
  if (!guidedWalkActive) return;
  const disc = CRA_DISCOVERIES[guidedWalkIndex % CRA_DISCOVERIES.length];
  if (!disc) return;
  selectDiscoveryOrFeatureById(disc.id, false);
  if (currentMode === 'walk') {
    flyToPosition(disc.walkPos, disc.walkTarget, 2400, true);
  } else {
    flyToPosition(disc.camPos, disc.target, 2400, false);
  }
  guidedWalkPauseUntil = performance.now() + 5200;
}

function checkProximityDiscovery() {
  if (camTween || guidedWalkActive) return;

  const camX = camera.position.x;
  const camZ = camera.position.z;
  let closestDisc = null;
  let minDist = 16.5;

  for (const disc of CRA_DISCOVERIES) {
    const feat = featureById.get(disc.id);
    const fx = feat ? feat.cx || disc.beaconPos[0] : disc.beaconPos[0];
    const fz = feat ? -(feat.cy || -disc.beaconPos[2]) : disc.beaconPos[2];
    const dFeat = Math.hypot(camX - fx, camZ - fz);
    const dWalk = disc.walkPos ? Math.hypot(camX - disc.walkPos[0], camZ - disc.walkPos[2]) : 999;
    const d = Math.min(dFeat, dWalk);
    if (d < minDist) {
      minDist = d;
      closestDisc = disc;
    }
  }

  if (closestDisc) {
    if (activeSideNoteRoomId !== closestDisc.id) {
      lastProximityDiscId = closestDisc.id;
      visitedDiscoveries.add(closestDisc.id);
      const feat = featureById.get(closestDisc.id);
      if (feat) {
        highlightFeatureIn3D(feat);
        populateInspectorDossier(feat, false);
        showRoomSideNote(feat);
      }
    }
  } else if (selectedFeature) {
    const sx = selectedFeature.cx || 0;
    const sz = -(selectedFeature.cy || 0);
    if (Math.hypot(camX - sx, camZ - sz) > 19.5) {
      lastProximityDiscId = null;
      hideRoomSideNote();
    }
  }
}

// ============================================================================
// 16. UI EVENTS, MODE SWITCHING, RAYCAST PICKING & WALK CONTROLS
// ============================================================================
function stepDiscovery(delta) {
  if (guidedWalkActive) stopGuidedWalk();
  if (currentMode === 'orbit') setExperienceMode('guided', false);
  const curIdx = CRA_DISCOVERIES.findIndex(
    (d) => selectedFeature && d.id === selectedFeature.id
  );
  const nextIdx = (curIdx + delta + CRA_DISCOVERIES.length) % CRA_DISCOVERIES.length;
  const nextDisc = CRA_DISCOVERIES[nextIdx];
  selectDiscoveryOrFeatureById(nextDisc.id, true);
}

function cycleWalkElevation(dir = 1) {
  const levels = [
    { y: 1.8, label: 'Plaza 1.8m' },
    { y: 5.8, label: 'Terrace 5.8m' },
    { y: 14.5, label: 'Overlook 14.5m' },
    { y: 36.8, label: 'Mesa Rim 36.8m' },
  ];
  let curIdx = levels.findIndex((l) => Math.abs(l.y - walkElevationOffset) < 1.5);
  if (curIdx < 0) curIdx = 0;
  curIdx = (curIdx + dir + levels.length) % levels.length;
  walkElevationOffset = levels[curIdx].y;
  if (currentMode === 'walk') {
    const groundY = sampleGroundElevation(camera.position.x, camera.position.z);
    smoothedWalkY = groundY + walkElevationOffset;
    camera.position.y = smoothedWalkY;
    updateWalkCameraLook();
  }
  const lbl = document.getElementById('walk-elev-label');
  if (lbl) lbl.textContent = levels[curIdx].label;
}

function bindUIEvents() {
  document.querySelectorAll('.mode-btn[data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (guidedWalkActive) stopGuidedWalk();
      setExperienceMode(btn.dataset.mode, true);
    });
  });

  const brandHome = document.getElementById('btn-brand-home');
  if (brandHome) {
    brandHome.addEventListener('click', () => {
      if (guidedWalkActive) stopGuidedWalk();
      selectSection('overview', true);
    });
  }

  const startWalkthroughBtn = document.getElementById('btn-start-walkthrough');
  if (startWalkthroughBtn) {
    startWalkthroughBtn.addEventListener('click', () => {
      setExperienceMode('guided', false);
      selectSection('old_bonito', true);
      startGuidedWalk();
    });
  }

  const enterFreeWalkBtn = document.getElementById('btn-enter-freewalk');
  if (enterFreeWalkBtn) {
    enterFreeWalkBtn.addEventListener('click', () => {
      if (guidedWalkActive) stopGuidedWalk();
      const hero = document.getElementById('overview-hero-card');
      if (hero) hero.classList.add('minimized');
      setExperienceMode('walk', true);
    });
  }

  const guidedBtn = document.getElementById('btn-guided-walk');
  if (guidedBtn) {
    guidedBtn.addEventListener('click', () => {
      toggleGuidedWalk();
    });
  }

  const elevBtn = document.getElementById('btn-cycle-elev');
  if (elevBtn) {
    elevBtn.addEventListener('click', () => {
      cycleWalkElevation(1);
    });
  }

  const autoRotBtn = document.getElementById('btn-toggle-autorotate');
  if (autoRotBtn) {
    autoRotBtn.addEventListener('click', () => {
      if (currentMode === 'walk') setExperienceMode('orbit', false);
      controls.autoRotate = !controls.autoRotate;
      autoRotBtn.classList.toggle('active', controls.autoRotate);
    });
  }

  const resetBtn = document.getElementById('btn-reset-view');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (guidedWalkActive) stopGuidedWalk();
      selectSection('overview', true);
    });
  }

  const fsBtn = document.getElementById('btn-fullscreen-stage');
  if (fsBtn) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
      } else {
        document.exitFullscreen?.().catch(() => {});
      }
    });
  }

  const toggleHudBtn = document.getElementById('btn-toggle-hud');
  if (toggleHudBtn) {
    toggleHudBtn.addEventListener('click', () => {
      document.body.classList.toggle('hud-hidden');
      toggleHudBtn.classList.toggle('active', document.body.classList.contains('hud-hidden'));
    });
  }

  const closeInspectorBtn = document.getElementById('btn-close-inspector');
  const reopenDossierBtn = document.getElementById('btn-reopen-dossier');
  const inspectorDrawer = document.getElementById('inspector-drawer');
  if (closeInspectorBtn && inspectorDrawer) {
    closeInspectorBtn.addEventListener('click', () => {
      inspectorDrawer.classList.add('collapsed-in-overview');
      if (reopenDossierBtn) reopenDossierBtn.classList.remove('hidden');
    });
  }
  if (reopenDossierBtn && inspectorDrawer) {
    reopenDossierBtn.addEventListener('click', () => {
      inspectorDrawer.classList.remove('collapsed-in-overview');
      reopenDossierBtn.classList.add('hidden');
    });
  }

  // On-Screen Walk Pad (supports both mouse hold & touch hold)
  document.querySelectorAll('#onscreen-walk-pad .pad-btn').forEach((btn) => {
    const moveType = btn.dataset.move;
    const setMoveState = (active) => {
      if (active && guidedWalkActive) stopGuidedWalk();
      if (active && currentMode !== 'walk') {
        const hero = document.getElementById('overview-hero-card');
        if (hero) hero.classList.add('minimized');
        setExperienceMode('walk', false);
      }
      if (moveType === 'forward') walkKeys.w = active;
      else if (moveType === 'backward') walkKeys.s = active;
      else if (moveType === 'left') walkKeys.a = active;
      else if (moveType === 'right') walkKeys.d = active;
      else if (moveType === 'turnLeft') walkKeys.turnLeft = active;
      else if (moveType === 'turnRight') walkKeys.turnRight = active;
    };
    btn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      setMoveState(true);
    });
    btn.addEventListener('pointerup', () => setMoveState(false));
    btn.addEventListener('pointerleave', () => setMoveState(false));
    btn.addEventListener('pointercancel', () => setMoveState(false));
  });

  // Visual card tabs (Reconstruction Diagram vs Archival Photo)
  document.querySelectorAll('.vis-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.vis-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      const isPhoto = tab.dataset.vis === 'photo';
      const diagPane = document.getElementById('vis-pane-diagram');
      const photoPane = document.getElementById('vis-pane-photo');
      if (diagPane) diagPane.classList.toggle('hidden', isPhoto);
      if (photoPane) photoPane.classList.toggle('hidden', !isPhoto);
    });
  });

  document.getElementById('btn-discoveries-drawer').addEventListener('click', () => {
    if (inspectorDrawer && inspectorDrawer.classList.contains('collapsed-in-overview')) {
      inspectorDrawer.classList.remove('collapsed-in-overview');
      if (reopenDossierBtn) reopenDossierBtn.classList.add('hidden');
    } else {
      stepDiscovery(1);
    }
  });

  document.getElementById('btn-next-discovery').addEventListener('click', () => {
    stepDiscovery(1);
  });

  const prevAreaBtn = document.getElementById('btn-prev-area');
  if (prevAreaBtn) prevAreaBtn.addEventListener('click', () => stepDiscovery(-1));

  const nextAreaStripBtn = document.getElementById('btn-next-area-strip');
  if (nextAreaStripBtn) nextAreaStripBtn.addEventListener('click', () => stepDiscovery(1));

  document.getElementById('btn-focus-selected').addEventListener('click', () => {
    if (!selectedFeature) return;
    if (guidedWalkActive) stopGuidedWalk();
    setExperienceMode('guided', false);
    selectDiscoveryOrFeatureById(selectedFeature.id, true, 'guided');
  });

  document.getElementById('btn-walk-here').addEventListener('click', () => {
    if (!selectedFeature) return;
    if (guidedWalkActive) stopGuidedWalk();
    setExperienceMode('walk', false);
    selectDiscoveryOrFeatureById(selectedFeature.id, true, 'walk');
  });

  const envBtn = document.getElementById('btn-env-popover');
  const envPopover = document.getElementById('env-popover');
  envBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    envPopover.classList.toggle('hidden');
    envBtn.classList.toggle('active', !envPopover.classList.contains('hidden'));
  });

  document.addEventListener('click', (e) => {
    if (!envPopover.classList.contains('hidden') && !e.target.closest('.popover-wrapper')) {
      envPopover.classList.add('hidden');
      envBtn.classList.remove('active');
    }
  });

  document.getElementById('time-slider').addEventListener('input', (e) => {
    if (currentSeason === 'night') currentSeason = 'equinox';
    updateSolarLighting(currentSeason, parseFloat(e.target.value));
  });

  document.querySelectorAll('.solar-preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.solar-preset-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      updateSolarLighting(btn.dataset.season, parseFloat(btn.dataset.hour));
    });
  });

  document.querySelectorAll('.phase-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyPhaseFilter(btn.dataset.phase);
    });
  });

  document.getElementById('chk-show-labels').addEventListener('change', (e) => {
    const vis = e.target.checked;
    discoveryMarkersGroup.visible = vis;
    for (const lbl of cssLabels) {
      lbl.userData.userEnabled = vis;
      lbl.visible = vis;
    }
  });

  document.getElementById('chk-show-alignments').addEventListener('change', (e) => {
    alignmentGroup.visible = e.target.checked;
  });

  document.getElementById('chk-show-roofs').addEventListener('change', (e) => {
    for (const m of roofTimberMeshes) m.visible = e.target.checked;
  });

  document.getElementById('chk-show-rockfall').addEventListener('change', (e) => {
    if (threateningRockMesh) threateningRockMesh.visible = e.target.checked;
  });

  const mapDrawer = document.getElementById('map-drawer');
  const mapBtn = document.getElementById('btn-open-map');
  mapBtn.addEventListener('click', () => {
    mapDrawer.classList.toggle('hidden');
    mapBtn.classList.toggle('active', !mapDrawer.classList.contains('hidden'));
    if (!mapDrawer.classList.contains('hidden')) drawMinimap();
  });

  document.getElementById('btn-close-map').addEventListener('click', () => {
    mapDrawer.classList.add('hidden');
    mapBtn.classList.remove('active');
  });

  document.querySelectorAll('.mini-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.mini-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      currentMinimapSite = tab.dataset.site;
      drawMinimap();
    });
  });

  document.getElementById('minimap-canvas').addEventListener('click', (e) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const cx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const cy = (e.clientY - rect.top) * (canvas.height / rect.height);

    const minX = parseFloat(canvas.dataset.minX || '0');
    const minY = parseFloat(canvas.dataset.minY || '0');
    const scale = parseFloat(canvas.dataset.scale || '1');
    const offX = parseFloat(canvas.dataset.offX || '0');
    const offY = parseFloat(canvas.dataset.offY || '0');

    const planX = (cx - offX) / scale + minX;
    const planY = (canvas.height - cy - offY) / scale + minY;

    let closest = null;
    let bestD = Infinity;
    for (const f of chacoData.features) {
      if (f.site !== currentMinimapSite || f.subcourt) continue;
      const d = Math.hypot((f.cx || 0) - planX, (f.cy || 0) - planY);
      if (d < bestD) {
        bestD = d;
        closest = f;
      }
    }
    if (closest) {
      if (guidedWalkActive) stopGuidedWalk();
      selectDiscoveryOrFeatureById(closest.id, true);
    }
  });

  const runRoomSearch = () => {
    const q = document.getElementById('room-search-input').value.trim().toLowerCase();
    if (!q) return;
    let match = featureById.get(q) || featuresByName.get(q);
    if (!match && chacoData) {
      match = chacoData.features.find(
        (f) =>
          (f.name && f.name.toLowerCase().includes(q)) ||
          (f.title && f.title.toLowerCase().includes(q)) ||
          (f.id && f.id.toLowerCase().includes(q))
      );
    }
    if (match) {
      if (guidedWalkActive) stopGuidedWalk();
      selectDiscoveryOrFeatureById(match.id, true);
    }
  };
  document.getElementById('btn-room-search').addEventListener('click', runRoomSearch);
  document.getElementById('room-search-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') runRoomSearch();
  });

  const atlasModal = document.getElementById('atlas-modal');
  document.getElementById('btn-open-atlas').addEventListener('click', () => {
    atlasModal.classList.remove('hidden');
  });
  const photoPane = document.getElementById('vis-pane-photo');
  if (photoPane) {
    photoPane.addEventListener('click', () => {
      atlasModal.classList.remove('hidden');
    });
  }
  document.getElementById('btn-close-atlas').addEventListener('click', () => {
    atlasModal.classList.add('hidden');
  });

  document.querySelectorAll('.atlas-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.atlas-tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.atlas-tab-content').forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const targetTab = document.getElementById(btn.dataset.tab);
      if (targetTab) targetTab.classList.add('active');
      if (btn.dataset.tab === 'tab-sundagger') {
        drawSunDaggerCanvas('summer');
      }
    });
  });

  const btnMediaPrev = document.getElementById('btn-media-prev');
  if (btnMediaPrev) {
    btnMediaPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      stepSideMedia(-1);
    });
  }
  const btnMediaNext = document.getElementById('btn-media-next');
  if (btnMediaNext) {
    btnMediaNext.addEventListener('click', (e) => {
      e.stopPropagation();
      stepSideMedia(1);
    });
  }
  const btnSideUnfocus = document.getElementById('btn-side-unfocus');
  if (btnSideUnfocus) {
    btnSideUnfocus.addEventListener('click', () => {
      hideRoomSideNote();
    });
  }
  const btnSidePrev = document.getElementById('btn-side-prev');
  if (btnSidePrev) {
    btnSidePrev.addEventListener('click', () => {
      stepDiscovery(-1);
    });
  }
  const btnSideNext = document.getElementById('btn-side-next');
  if (btnSideNext) {
    btnSideNext.addEventListener('click', () => {
      stepDiscovery(1);
    });
  }
  const btnSideZoomIn = document.getElementById('btn-side-zoom-in');
  if (btnSideZoomIn) {
    btnSideZoomIn.addEventListener('click', () => {
      zoomInsideSelectedRoom();
    });
  }
  const btnSideWideView = document.getElementById('btn-side-wide-view');
  if (btnSideWideView) {
    btnSideWideView.addEventListener('click', () => {
      zoomToWideRuinView();
    });
  }

  // Bottom Guided Stops & Camera Bar buttons
  const btnGsWide = document.getElementById('btn-gs-wide');
  if (btnGsWide) {
    btnGsWide.addEventListener('click', () => {
      zoomToWideRuinView();
    });
  }
  const btnGsZoomIn = document.getElementById('btn-gs-zoom-in');
  if (btnGsZoomIn) {
    btnGsZoomIn.addEventListener('click', () => {
      zoomCameraByFactor(0.62);
    });
  }
  const btnGsZoomOut = document.getElementById('btn-gs-zoom-out');
  if (btnGsZoomOut) {
    btnGsZoomOut.addEventListener('click', () => {
      zoomCameraByFactor(1.55);
    });
  }
  const btnGsPrev = document.getElementById('btn-gs-prev');
  if (btnGsPrev) {
    btnGsPrev.addEventListener('click', () => {
      stepDiscovery(-1);
    });
  }
  const btnGsNext = document.getElementById('btn-gs-next');
  if (btnGsNext) {
    btnGsNext.addEventListener('click', () => {
      stepDiscovery(1);
    });
  }

  // Pointer, Wheel & Touch Controls inside the Full-Screen 3D Viewport
  let downPos = { x: 0, y: 0 };
  let lastHoverCheckTime = 0;
  const hoverRaycaster = new THREE.Raycaster();
  const hoverMouse = new THREE.Vector2();

  renderer.domElement.addEventListener('pointerdown', (e) => {
    downPos = { x: e.clientX, y: e.clientY };
    if (guidedWalkActive) stopGuidedWalk();
    if (camTween) camTween = null;
    if (targetScrollProgress < 0.16) {
      targetScrollProgress = 0.18;
    }

    if (userFreeNavigating || currentMode === 'walk') {
      controls.enabled = false;
      isDraggingLook = true;
      prevPointer = { x: e.clientX, y: e.clientY };
    } else {
      // Keep OrbitControls enabled for flexible 3D orbit, pan, and zoom!
      controls.enabled = true;
      isDraggingLook = false;
    }
  });

  window.addEventListener('pointermove', (e) => {
    if (isDraggingLook && (userFreeNavigating || currentMode === 'walk')) {
      const dx = e.clientX - prevPointer.x;
      const dy = e.clientY - prevPointer.y;
      prevPointer = { x: e.clientX, y: e.clientY };
      walkYaw -= dx * 0.0042;
      walkPitch = THREE.MathUtils.clamp(walkPitch - dy * 0.0038, -1.05, 1.05);
      updateWalkCameraLook();
      return;
    }

    // Live 3D Room & Kiva Hover Detection
    const now = performance.now();
    if (now - lastHoverCheckTime < 28) return;
    lastHoverCheckTime = now;

    if (e.target !== renderer.domElement || pickableMeshes.length === 0) {
      if (hoveredFeature) setHoveredFeature(null);
      return;
    }

    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    hoverMouse.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    hoverRaycaster.setFromCamera(hoverMouse, camera);
    const hits = hoverRaycaster.intersectObjects(pickableMeshes, false);
    if (hits.length === 0) {
      if (hoveredFeature) setHoveredFeature(null);
      renderer.domElement.style.cursor = 'grab';
      return;
    }

    for (const hit of hits) {
      if (hit.object.userData && hit.object.userData.discoveryId) {
        const f = featureById.get(hit.object.userData.discoveryId);
        if (f) {
          setHoveredFeature(f, e.clientX, e.clientY);
          renderer.domElement.style.cursor = 'pointer';
          return;
        }
      }
    }

    const firstHit = hits[0];
    const meshName = firstHit.object.name || '';
    const pt = firstHit.point;
    const matchedFeat = findFeatureAtWorldPoint(pt.x, pt.z, meshName);
    if (matchedFeat) {
      setHoveredFeature(matchedFeat, e.clientX, e.clientY);
      renderer.domElement.style.cursor = 'pointer';
    } else {
      if (hoveredFeature) setHoveredFeature(null);
      renderer.domElement.style.cursor = 'grab';
    }
  });

  window.addEventListener('pointerup', (e) => {
    isDraggingLook = false;
    if (!userFreeNavigating && currentMode !== 'walk') {
      controls.enabled = true;
    }
    const moveDist = Math.hypot(e.clientX - downPos.x, e.clientY - downPos.y);
    if (moveDist < 6 && e.target === renderer.domElement) {
      handleCanvasRaycastClick(e);
    }
  });

  // Scroll Wheel:
  // 1) At launch (targetScrollProgress < 0.14), scrolling down smoothly scrolls the initial
  //    CHACO CANYON title away and glides into the Pueblo Bonito overlook.
  // 2) Once the title has scrolled away (targetScrollProgress >= 0.14), OrbitControls handles
  //    the scroll wheel natively so the user can freely zoom in to inspect 3D room structures
  //    or zoom out to wide canyon views!
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.target && e.target.closest && e.target.closest('#room-side-note, #guided-stops-bar, #atlas-modal')) {
        return;
      }
      if (guidedWalkActive) stopGuidedWalk();

      if (targetScrollProgress < 0.14) {
        e.preventDefault();
        camTween = null;
        const delta = THREE.MathUtils.clamp(Math.abs(e.deltaY) * 0.00045, 0.018, 0.065);
        targetScrollProgress = Math.min(0.16, targetScrollProgress + delta);
        return;
      }

      // If user was in WASD walk mode and uses the scroll wheel, switch back to flexible OrbitControls zoom
      if (userFreeNavigating || currentMode === 'walk') {
        userFreeNavigating = false;
        if (currentMode === 'walk') setExperienceMode('orbit', false);
        controls.enabled = true;
      }
    },
    { capture: true, passive: false }
  );

  // Touch Swipe Support for Initial Title Dismiss
  let touchStartY = 0;
  window.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches && e.touches.length === 1) {
        touchStartY = e.touches[0].clientY;
      }
    },
    { passive: true }
  );
  window.addEventListener(
    'touchmove',
    (e) => {
      if (targetScrollProgress < 0.14 && e.touches && e.touches.length === 1) {
        const curY = e.touches[0].clientY;
        const dy = touchStartY - curY;
        touchStartY = curY;
        if (dy > 2) {
          camTween = null;
          targetScrollProgress = Math.min(0.16, targetScrollProgress + 0.04);
        }
      }
    },
    { passive: true }
  );

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.key === 'Escape') {
      hideRoomSideNote();
      return;
    }

    const k = e.key.toLowerCase();
    if (e.key === '[') {
      stepDiscovery(-1);
      return;
    }
    if (e.key === ']') {
      stepDiscovery(1);
      return;
    }
    if (e.key === '+' || e.key === '=') {
      zoomCameraByFactor(0.68);
      return;
    }
    if (e.key === '-' || e.key === '_') {
      zoomCameraByFactor(1.45);
      return;
    }

    const isArrow =
      e.key === 'ArrowUp' ||
      e.key === 'ArrowDown' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight';
    if (isArrow) e.preventDefault();

    const enterFreeWalkFromKey = () => {
      if (guidedWalkActive) stopGuidedWalk();
      camTween = null;
      if (targetScrollProgress < 0.16) {
        targetScrollProgress = 0.18;
        smoothScrollProgress = 0.18;
        updateCenterTitleOverlay(0.18);
      }
      const dx = controls.target.x - camera.position.x;
      const dy = controls.target.y - camera.position.y;
      const dz = controls.target.z - camera.position.z;
      const horiz = Math.max(0.001, Math.hypot(dx, dz));
      walkYaw = Math.atan2(-dx, -dz);
      walkPitch = THREE.MathUtils.clamp(Math.atan2(dy, horiz), -1.0, 1.0);
      smoothedWalkY = camera.position.y;
      userFreeNavigating = true;
      controls.enabled = false;
    };

    if (k === 'w' || e.key === 'ArrowUp') {
      enterFreeWalkFromKey();
      walkKeys.w = true;
    }
    if (k === 's' || e.key === 'ArrowDown') {
      enterFreeWalkFromKey();
      walkKeys.s = true;
    }
    if (k === 'a') {
      enterFreeWalkFromKey();
      walkKeys.a = true;
    }
    if (k === 'd') {
      enterFreeWalkFromKey();
      walkKeys.d = true;
    }
    if (e.key === 'ArrowLeft') {
      enterFreeWalkFromKey();
      walkKeys.turnLeft = true;
    }
    if (e.key === 'ArrowRight') {
      enterFreeWalkFromKey();
      walkKeys.turnRight = true;
    }
    if (e.key === 'Shift') walkKeys.shift = true;
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || e.key === 'ArrowUp') walkKeys.w = false;
    if (k === 's' || e.key === 'ArrowDown') walkKeys.s = false;
    if (k === 'a') walkKeys.a = false;
    if (k === 'd') walkKeys.d = false;
    if (e.key === 'ArrowLeft') walkKeys.turnLeft = false;
    if (e.key === 'ArrowRight') walkKeys.turnRight = false;
    if (e.key === 'Shift') walkKeys.shift = false;
  });
}

function setExperienceMode(mode, animateTransition = true) {
  currentMode = mode;
  document.body.dataset.mode = mode;
  if (animateTransition && mode === 'walk') {
    userFreeNavigating = true;
  } else if (mode !== 'walk') {
    userFreeNavigating = false;
    if (controls) controls.enabled = true;
  }
}

function updateWalkCameraLook() {
  const dir = new THREE.Vector3(
    -Math.sin(walkYaw) * Math.cos(walkPitch),
    Math.sin(walkPitch),
    -Math.cos(walkYaw) * Math.cos(walkPitch)
  );
  controls.target.copy(camera.position).add(dir.multiplyScalar(12));
  camera.lookAt(controls.target);
}

function handleCanvasRaycastClick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return;

  const mouse = new THREE.Vector2(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const hits = raycaster.intersectObjects(pickableMeshes, false);
  if (hits.length === 0) return;

  for (const hit of hits) {
    if (hit.object.userData && hit.object.userData.discoveryId) {
      if (guidedWalkActive) stopGuidedWalk();
      selectDiscoveryOrFeatureById(hit.object.userData.discoveryId, true);
      return;
    }
  }

  const firstHit = hits[0];
  const meshName = firstHit.object.name || '';
  const pt = firstHit.point;

  const matchedFeat = findFeatureAtWorldPoint(pt.x, pt.z, meshName);
  if (matchedFeat) {
    if (guidedWalkActive) stopGuidedWalk();
    selectDiscoveryOrFeatureById(matchedFeat.id, true);
    return;
  }

  // Clicking on open canyon/plaza ground outside rooms unfocuses any room & restores full 100% brightness
  if (selectedFeature) {
    hideRoomSideNote();
  }
}

function flyToPosition(camPosArr, targetArr, durationMs = 900, keepWalkMode = false) {
  camTween = {
    startPos: camera.position.clone(),
    endPos: new THREE.Vector3(...camPosArr),
    startTarget: controls.target.clone(),
    endTarget: new THREE.Vector3(...targetArr),
    startTime: performance.now(),
    duration: durationMs,
    isWalkTween: Boolean(keepWalkMode),
  };
}

// ============================================================================
// 17. POPULATE SEARCH DATALIST, SOURCES MODAL & SUN DAGGER SIMULATOR
// ============================================================================
function populateSearchDatalist() {
  const dl = document.getElementById('room-datalist');
  if (!dl || !chacoData) return;
  dl.innerHTML = '';

  for (const disc of CRA_DISCOVERIES) {
    const f = featureById.get(disc.id);
    if (!f) continue;
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.label = `${disc.chipLabel} — ${f.title || f.name}`;
    dl.appendChild(opt);
  }

  for (const f of chacoData.features.slice(0, 180)) {
    const opt = document.createElement('option');
    opt.value = f.name;
    opt.label = `${SITE_LABELS[f.site] || f.site} (${f.phase || 'Classic Bonito'})`;
    dl.appendChild(opt);
  }
}

function populateSourcesModal() {
  const container = document.getElementById('sources-container');
  if (!container || !chacoData) return;
  const sources =
    chacoData.sources ||
    (chacoData.metadata && (chacoData.metadata.dataSources || chacoData.metadata.sources)) ||
    [];
  container.innerHTML = '';

  for (const src of sources) {
    const div = document.createElement('div');
    div.className = 'source-item';
    div.innerHTML = `
      <div>
        <strong>${src.title || src.name || 'NPS (Lekson 1984) / HABS No. NM-30 (LOC nm0107) & 0.5m LiDAR Survey'}</strong>
        <span>${src.details || src.focus || src.description || 'Primary Archaeological & Geospatial Dataset'}</span>
      </div>
      <a href="${src.url || 'https://www.loc.gov/pictures/item/nm0107/'}" target="_blank" rel="noopener noreferrer">Open Archive ↗</a>
    `;
    container.appendChild(div);
  }
}

function drawSunDaggerCanvas(mode) {
  const canvas = document.getElementById('sundagger-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#241a13';
  ctx.fillRect(0, 0, w, h);

  const cx = w * 0.56;
  const cy = h * 0.54;
  ctx.strokeStyle = '#d8b78e';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 19; a += 0.14) {
    const r = a * 1.12;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  const sx = w * 0.24;
  const sy = h * 0.36;
  ctx.beginPath();
  for (let a = 0; a < Math.PI * 6; a += 0.16) {
    const r = a * 1.15;
    const x = sx + Math.cos(a) * r;
    const y = sy + Math.sin(a) * r;
    if (a === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 222, 120, 0.88)';
  const drawDagger = (x, yTop, yBot) => {
    ctx.beginPath();
    ctx.moveTo(x, yTop);
    ctx.lineTo(x + 7, (yTop + yBot) * 0.5);
    ctx.lineTo(x, yBot);
    ctx.lineTo(x - 7, (yTop + yBot) * 0.5);
    ctx.closePath();
    ctx.fill();
  };

  if (mode === 'summer') {
    drawDagger(cx, cy - 76, cy + 76);
  } else if (mode === 'winter') {
    drawDagger(cx - 66, cy - 68, cy + 68);
    drawDagger(cx + 66, cy - 68, cy + 68);
  } else if (mode === 'equinox') {
    drawDagger(sx, sy - 34, sy + 34);
    drawDagger(cx + 33, cy - 64, cy + 64);
  } else if (mode === 'lunar') {
    ctx.fillStyle = 'rgba(90, 185, 255, 0.32)';
    ctx.fillRect(cx - 66, 15, 132, h - 30);
    ctx.strokeStyle = '#68d8ff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - 66, 15);
    ctx.lineTo(cx - 66, h - 15);
    ctx.moveTo(cx, 15);
    ctx.lineTo(cx, h - 15);
    ctx.stroke();
  }
}

// ============================================================================
// 18. ANIMATION LOOP & NON-OVERLAPPING 3D PIN FRUSTUM CULLING
// ============================================================================
const _projVec = new THREE.Vector3();

function updateLabelFrustumVisibility() {
  for (const lbl of cssLabels) {
    if (lbl.userData && lbl.userData.isInterpretiveKivaLabel && camera) {
      const isKivaOFocused =
        (selectedFeature &&
          (selectedFeature.id === 'pueblo_bonito_131' || selectedFeature.id === 'pueblo_bonito_132')) ||
        (hoveredFeature &&
          (hoveredFeature.id === 'pueblo_bonito_131' || hoveredFeature.id === 'pueblo_bonito_132'));
      const dist = camera.position.distanceTo(lbl.position);
      _projVec.copy(lbl.position).project(camera);
      const inFront =
        _projVec.z > 0 &&
        _projVec.z < 1 &&
        Math.abs(_projVec.x) < 0.92 &&
        Math.abs(_projVec.y) < 0.92;
      lbl.visible = inFront && (isKivaOFocused || dist < 48.0);
    } else {
      lbl.visible = false;
    }
  }
}

function onWindowResize() {
  if (!camera || !renderer || !labelRenderer) return;
  const { width, height } = getViewportSize();
  const aspect = width / height;
  camera.aspect = aspect;
  camera.fov = computeResponsiveCameraFov(aspect);
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  labelRenderer.setSize(width, height);
  if (composer) composer.setSize(width, height);
}

function setAspectRatioMode(mode) {
  const normalized = mode === '16:9' || mode === '16x9' ? '16:9' : mode === '9:16' || mode === '9x16' ? '9:16' : 'auto';
  document.body.dataset.aspectMode = normalized;
  const btns = document.querySelectorAll('#aspect-ratio-bar .aspect-btn');
  for (const btn of btns) {
    btn.classList.toggle('active', btn.dataset.aspect === normalized);
  }
  onWindowResize();
  setTimeout(onWindowResize, 60);
  setTimeout(onWindowResize, 260);
}

function initAspectRatioSwitcher() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('embed') === '1' || params.get('embed') === 'true') {
    document.body.dataset.embedClean = 'true';
  }
  const initialRatio = params.get('aspect') || params.get('ratio') || 'auto';
  setAspectRatioMode(initialRatio);

  const btns = document.querySelectorAll('#aspect-ratio-bar .aspect-btn');
  for (const btn of btns) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setAspectRatioMode(btn.dataset.aspect || 'auto');
    });
  }

  const stageEl = document.getElementById('viewport-stage');
  if (stageEl && typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(() => {
      onWindowResize();
    });
    ro.observe(stageEl);
  }
}

const _compassCamDir = new THREE.Vector3();

function initCelestialCompass() {
  const compassEl = document.getElementById('celestial-compass');
  const svgEl = document.getElementById('celestial-compass-svg');
  const ticksGroup = document.getElementById('compass-ticks');
  if (!compassEl || !svgEl || !ticksGroup) return;

  // 1. Populate clean geometric degree ticks around outer dial (leaving space at 0/90/180/270 for N/E/S/W letters)
  ticksGroup.innerHTML = '';
  const svgNS = 'http://www.w3.org/2000/svg';
  for (let deg = 0; deg < 360; deg += 10) {
    if (deg % 90 === 0) continue; // N, E, S, W labels occupy the 4 cardinal slots
    const rad = THREE.MathUtils.degToRad(deg);
    const isMajor = deg % 30 === 0;
    const rOut = 52.8;
    const rIn = isMajor ? 48.6 : 50.4;
    const sinA = Math.sin(rad);
    const cosA = -Math.cos(rad);
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', (60 + sinA * rIn).toFixed(2));
    line.setAttribute('y1', (60 + cosA * rIn).toFixed(2));
    line.setAttribute('x2', (60 + sinA * rOut).toFixed(2));
    line.setAttribute('y2', (60 + cosA * rOut).toFixed(2));
    line.setAttribute('class', isMajor ? 'compass-tick-major' : 'compass-tick-minor');
    ticksGroup.appendChild(line);
  }

  // 2. Bind Tiny Info Button ('i') & Popover Card
  const infoBtn = document.getElementById('compass-info-btn');
  const infoPopover = document.getElementById('compass-info-popover');
  const infoClose = document.getElementById('compass-info-close');

  const setInfoOpen = (open) => {
    if (!infoBtn || !infoPopover) return;
    infoPopover.classList.toggle('hidden', !open);
    infoBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  };

  if (infoBtn && infoPopover) {
    infoBtn.addEventListener('pointerdown', (e) => e.stopPropagation());
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isHidden = infoPopover.classList.contains('hidden');
      setInfoOpen(isHidden);
    });
    infoPopover.addEventListener('pointerdown', (e) => e.stopPropagation());
  }
  if (infoClose) {
    infoClose.addEventListener('click', (e) => {
      e.stopPropagation();
      setInfoOpen(false);
    });
  }
  document.addEventListener('pointerdown', (e) => {
    if (infoPopover && !infoPopover.classList.contains('hidden')) {
      if (!e.target.closest('#compass-info-popover') && !e.target.closest('#compass-info-btn')) {
        setInfoOpen(false);
      }
    }
  });

  // 3. Bind Season Switcher Pills: Planting (Equinox), Summer, Winter
  //    Clicking a season snaps directly to its Sunrise horizon alignment (90° E Equinox Wall, 60° NE Summer, 120° SE Winter);
  //    clicking the already-active season cycles Sunrise -> Noon (180° S N-S Wall) -> Sunset.
  compassEl.querySelectorAll('.compass-season-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      celestialSweepActive = false;
      compassEl.classList.remove('sweep-active');
      const targetSeason = btn.dataset.season || 'equinox';
      const bounds = SEASON_OBSERVATORY_BOUNDS[targetSeason] || SEASON_OBSERVATORY_BOUNDS.equinox;
      alignmentGroup.visible = true;

      let targetHour = bounds.sunriseHour;
      if (currentSeason === targetSeason) {
        if (Math.abs(currentHour - bounds.sunriseHour) <= 0.35) {
          targetHour = bounds.noonHour;
        } else if (Math.abs(currentHour - bounds.noonHour) <= 0.35) {
          targetHour = bounds.sunsetHour;
        } else {
          targetHour = bounds.sunriseHour;
        }
      }
      activeCelestialAlignment =
        Math.abs(targetHour - 12.0) <= 0.25
          ? 'meridian_noon'
          : targetSeason === 'equinox'
          ? 'equinox_wall'
          : 'winter_window';
      updateSolarLighting(targetSeason, targetHour);
    });
  });

  // 3b. Bind Observatory Moment Snaps: Sunrise / Noon (N-S Wall) / Sunset
  compassEl.querySelectorAll('.compass-moment-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      celestialSweepActive = false;
      compassEl.classList.remove('sweep-active');
      const activeSeason =
        currentSeason === 'summer' || currentSeason === 'winter' ? currentSeason : 'equinox';
      const bounds = SEASON_OBSERVATORY_BOUNDS[activeSeason] || SEASON_OBSERVATORY_BOUNDS.equinox;
      const moment = btn.dataset.moment || 'sunrise';
      const targetHour =
        moment === 'noon'
          ? bounds.noonHour
          : moment === 'sunset'
          ? bounds.sunsetHour
          : bounds.sunriseHour;
      alignmentGroup.visible = true;
      activeCelestialAlignment =
        moment === 'noon' ? 'meridian_noon' : activeSeason === 'equinox' ? 'equinox_wall' : 'winter_window';
      updateSolarLighting(activeSeason, targetHour);
    });
  });

  // 4. Bind Center D-Shape Footprint to toggle gentle continuous daylight sun sweep along the active season's arc
  const centerBtn = document.getElementById('compass-center-btn');
  if (centerBtn) {
    centerBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });
    centerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      celestialSweepActive = !celestialSweepActive;
      compassEl.classList.toggle('sweep-active', celestialSweepActive);
    });
  }

  // 5. Bind Interactive Circular Scrubbing to drag the Sun 1:1 along the active season's sky arc
  const scrubFromPointerEvent = (e) => {
    const rect = svgEl.getBoundingClientRect();
    const cx = rect.left + rect.width * 0.5;
    const cy = rect.top + rect.height * 0.5;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let screenAngleDeg = THREE.MathUtils.radToDeg(Math.atan2(dx, -dy));
    if (screenAngleDeg < 0) screenAngleDeg += 360;

    // Convert screen angle on the dial to world azimuth by adding current camera yaw
    let camYawDeg = 0;
    if (camera) {
      camera.getWorldDirection(_compassCamDir);
      camYawDeg = THREE.MathUtils.radToDeg(Math.atan2(_compassCamDir.x, -_compassCamDir.z));
      if (camYawDeg < 0) camYawDeg += 360;
    }
    const worldAzDeg = (screenAngleDeg + camYawDeg) % 360;

    const activeSeason =
      currentSeason === 'summer' || currentSeason === 'winter' ? currentSeason : 'equinox';
    const newHour = hourFromSeasonAzimuth(activeSeason, worldAzDeg);

    alignmentGroup.visible = true;
    updateSolarLighting(activeSeason, newHour);
  };

  const startScrub = (e) => {
    if (e.target.closest('#compass-center-btn')) return;
    e.stopPropagation();
    e.preventDefault();
    isCompassScrubbing = true;
    celestialSweepActive = false;
    compassEl.classList.add('scrubbing');
    compassEl.classList.remove('sweep-active');
    scrubFromPointerEvent(e);
  };

  svgEl.addEventListener('pointerdown', startScrub);
  window.addEventListener('pointermove', (e) => {
    if (!isCompassScrubbing) return;
    scrubFromPointerEvent(e);
  });
  window.addEventListener('pointerup', () => {
    if (!isCompassScrubbing) return;
    isCompassScrubbing = false;
    compassEl.classList.remove('scrubbing');
  });
}

function activateCelestialAlignment(alignKey) {
  if (guidedWalkActive) stopGuidedWalk();
  activeCelestialAlignment = alignKey;
  alignmentGroup.visible = true;

  if (alignKey === 'winter_window') {
    updateSolarLighting('winter', SEASON_OBSERVATORY_BOUNDS.winter.sunriseHour);
  } else if (alignKey === 'equinox_wall') {
    updateSolarLighting('equinox', SEASON_OBSERVATORY_BOUNDS.equinox.sunriseHour);
  } else if (alignKey === 'meridian_noon') {
    updateSolarLighting('equinox', 12.0);
  } else if (alignKey === 'summer_spine') {
    updateSolarLighting('summer', SEASON_OBSERVATORY_BOUNDS.summer.sunriseHour);
  }
}

function updateCelestialCompassFrame(now, dt) {
  // 1. Rotate the compass world ring to match current 3D camera horizontal heading,
  //    and counter-rotate N / E / S / W text labels so they always stay upright
  const worldRing = document.getElementById('compass-world-ring');
  if (worldRing && camera) {
    camera.getWorldDirection(_compassCamDir);
    const camYawDeg = THREE.MathUtils.radToDeg(Math.atan2(_compassCamDir.x, -_compassCamDir.z));
    worldRing.setAttribute('transform', `rotate(${(-camYawDeg).toFixed(2)} 60 60)`);
    worldRing.querySelectorAll('.compass-cardinal-text').forEach((txt) => {
      txt.setAttribute('transform', `rotate(${camYawDeg.toFixed(2)})`);
    });
  }

  // 2. Continuous Solar Sweep when center D-shape is clicked (sweeps across active season's sunrise -> sunset arc)
  if (celestialSweepActive && !isCompassScrubbing) {
    const activeSeason =
      currentSeason === 'summer' || currentSeason === 'winter' ? currentSeason : 'equinox';
    const bounds = SEASON_OBSERVATORY_BOUNDS[activeSeason] || SEASON_OBSERVATORY_BOUNDS.equinox;
    let nextHr = currentHour + dt * 1.15;
    if (nextHr > bounds.sunsetHour || nextHr < bounds.sunriseHour) {
      nextHr = bounds.sunriseHour;
    }
    updateSolarLighting(activeSeason, nextHr);
  }
}

function animate(now) {
  requestAnimationFrame(animate);
  const dt = Math.min(0.05, Math.max(0.001, (now - lastFrameTime) / 1000));
  lastFrameTime = now;

  updateCelestialCompassFrame(now, dt);

  // When a room is clicked, the rest of the ruin is darkened and the room is illuminated.
  // When the user zooms out (or pans away), smoothly restore full 100% daylight brightness across the ruin!
  if (selectedFeature && !camTween) {
    const fx = selectedFeature.cx || 0;
    const fz = -(selectedFeature.cy || 0);
    const targetHorizDist = Math.hypot(controls.target.x - fx, controls.target.z - fz);
    const camZoomDist = camera.position.distanceTo(controls.target);
    const undimZoomThreshold = Math.max(18.0, selectedRoomBaseDist * 1.32);
    const reDimZoomThreshold = Math.max(15.5, selectedRoomBaseDist * 1.15);

    if (camZoomDist > undimZoomThreshold || targetHorizDist > 18.0) {
      targetDimAmount = 0.0;
    } else if (camZoomDist <= reDimZoomThreshold && targetHorizDist <= 14.0) {
      targetDimAmount = 1.0;
    }
  }

  // Smoothly interpolate architectural dimming when entering or leaving a room
  currentDimAmount = THREE.MathUtils.lerp(currentDimAmount, targetDimAmount, Math.min(1, dt * 6.5));
  sharedRoomShaderUniforms.uDimAmount.value = currentDimAmount;

  if (autoTourActive) {
    updateAutoTour(now);
  } else if (camTween) {
    const tRaw = (now - camTween.startTime) / camTween.duration;
    if (tRaw >= 1) {
      camera.position.copy(camTween.endPos);
      controls.target.copy(camTween.endTarget);
      if (camTween.isWalkTween) {
        setWalkPose(
          [camTween.endPos.x, camTween.endPos.y, camTween.endPos.z],
          [camTween.endTarget.x, camTween.endTarget.y, camTween.endTarget.z]
        );
        checkProximityDiscovery();
      } else {
        controls.enabled = true;
        controls.update();
      }
      camTween = null;
      drawMinimap();
    } else {
      const ease = 1 - Math.pow(1 - tRaw, 3);
      camera.position.lerpVectors(camTween.startPos, camTween.endPos, ease);
      controls.target.lerpVectors(camTween.startTarget, camTween.endTarget, ease);
      if (camTween.isWalkTween) {
        camera.lookAt(controls.target);
        updateWalkElevationLabel();
      } else {
        controls.update();
      }
    }
  } else if (guidedWalkActive) {
    if (now >= guidedWalkPauseUntil) {
      guidedWalkIndex = (guidedWalkIndex + 1) % CRA_DISCOVERIES.length;
      advanceGuidedWalkStep();
    }
    if (currentMode !== 'walk') {
      controls.update();
    }
  } else if (userFreeNavigating || currentMode === 'walk') {
    let moved = false;
    const turnSpeed = 1.65 * dt;
    if (walkKeys.turnLeft) {
      walkYaw += turnSpeed;
      moved = true;
    }
    if (walkKeys.turnRight) {
      walkYaw -= turnSpeed;
      moved = true;
    }

    const moveSpeed = (walkKeys.shift ? 30.0 : 15.5) * dt;
    const forward = new THREE.Vector3(-Math.sin(walkYaw), 0, -Math.cos(walkYaw));
    const right = new THREE.Vector3(Math.cos(walkYaw), 0, -Math.sin(walkYaw));

    if (walkKeys.w) {
      camera.position.addScaledVector(forward, moveSpeed);
      moved = true;
    }
    if (walkKeys.s) {
      camera.position.addScaledVector(forward, -moveSpeed);
      moved = true;
    }
    if (walkKeys.d) {
      camera.position.addScaledVector(right, moveSpeed);
      moved = true;
    }
    if (walkKeys.a) {
      camera.position.addScaledVector(right, -moveSpeed);
      moved = true;
    }

    if (moved) {
      const targetEyeY = computeSmartWalkEyeY(camera.position.x, camera.position.z);
      smoothedWalkY = THREE.MathUtils.lerp(smoothedWalkY, targetEyeY, Math.min(1, dt * 8.5));
      camera.position.y = smoothedWalkY;
      updateWalkCameraLook();
      updateWalkElevationLabel();
      checkProximityDiscovery();
      drawMinimap();
    } else {
      updateWalkCameraLook();
    }
  } else if (targetScrollProgress < 0.14 || smoothScrollProgress < 0.135) {
    // Smoothly interpolate initial CHACO CANYON title scroll-in
    const diff = targetScrollProgress - smoothScrollProgress;
    if (Math.abs(diff) > 0.00015 || smoothScrollProgress > 0.002) {
      smoothScrollProgress = THREE.MathUtils.lerp(
        smoothScrollProgress,
        targetScrollProgress,
        Math.min(1, dt * 6.8)
      );
      if (smoothScrollProgress < 0.135) {
        updateScrollWalkExperience(smoothScrollProgress);
      } else {
        smoothScrollProgress = targetScrollProgress;
        updateCenterTitleOverlay(smoothScrollProgress);
        controls.enabled = true;
        controls.update();
      }
    } else {
      updateCenterTitleOverlay(smoothScrollProgress);
      controls.enabled = true;
      controls.update();
    }
  } else {
    // Full flexible 3D camera navigation (OrbitControls zoom in/out, orbit, pan)
    updateCenterTitleOverlay(smoothScrollProgress);
    controls.enabled = true;
    controls.update();
  }

  updateSunShadowFrustum();

  // Gentle drift of desert dust particles in sunlight
  if (dustParticles && dustParticles.visible) {
    dustParticles.rotation.y = now * 0.000035;
  }

  // Subtle warm conservation spotlight on the active room interior
  if (roomInspectLight && roomInspectLight.intensity > 0) {
    roomInspectLight.intensity = (2.2 + Math.sin(now * 0.0025) * 0.2) * currentDimAmount;
  }
  if (roomOverheadSpot && roomOverheadSpot.intensity > 0) {
    roomOverheadSpot.intensity = 2.8 * currentDimAmount;
  }

  if (fireLightsGroup.visible) {
    for (const child of fireLightsGroup.children) {
      if (child.isPointLight) {
        child.intensity = 16.0 + Math.sin(now * 0.012 + child.userData.phase) * 3.0;
      }
    }
  }

  updateLabelFrustumVisibility();
  renderScenePipeline();
  if (isRecordingWalkthrough) {
    renderCompositeWalkthroughFrame(currentTourBanner);
  }
}

init();
