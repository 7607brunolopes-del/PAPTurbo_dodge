// Dados da garagem, configuração e estado global do jogo

// --- GARAGE & VEHICLE INVENTORY DATA ---
const GARAGE_VEHICLES = {
    car_sport: {
        id: 'car_sport',
        name: 'GT DESPORTIVO',
        type: 'car',
        color: 0xff0055,
        speedMult: 1.0,
        handlingMult: 1.0,
        nitroMult: 1.0,
        speedDisplay: '180 KM/H',
        handlingDisplay: 'NORMAL',
        nitroDisplay: '100%'
    },
    car_cyber: {
        id: 'car_cyber',
        name: 'CYBER GT 3000',
        type: 'car',
        color: 0x00f3ff,
        speedMult: 1.35,
        handlingMult: 1.2,
        nitroMult: 1.4,
        speedDisplay: '230 KM/H',
        handlingDisplay: 'RÁPIDO',
        nitroDisplay: '140%'
    },
    car_truck: {
        id: 'car_truck',
        name: 'MONSTER 4X4',
        type: 'truck',
        color: 0x00ff66,
        speedMult: 0.9,
        handlingMult: 0.8,
        nitroMult: 1.5,
        speedDisplay: '160 KM/H',
        handlingDisplay: 'PESADO',
        nitroDisplay: '150%'
    },
    bike_sport: {
        id: 'bike_sport',
        name: 'SUPERBIKE 1000CC',
        type: 'bike',
        color: 0xff0055,
        speedMult: 1.1,
        handlingMult: 1.4,
        nitroMult: 1.1,
        speedDisplay: '200 KM/H',
        handlingDisplay: 'ULTRA ÁGIL',
        nitroDisplay: '115%'
    },
    bike_chopper: {
        id: 'bike_chopper',
        name: 'CHOPPER CUSTOM 1200',
        type: 'bike',
        color: 0xffb700,
        speedMult: 0.95,
        handlingMult: 0.9,
        nitroMult: 1.2,
        speedDisplay: '170 KM/H',
        handlingDisplay: 'ESTÁVEL',
        nitroDisplay: '120%'
    },
    bike_futuristic: {
        id: 'bike_futuristic',
        name: 'TRON NEON BIKE',
        type: 'bike',
        color: 0xa855f7,
        speedMult: 1.25,
        handlingMult: 1.3,
        nitroMult: 1.3,
        speedDisplay: '220 KM/H',
        handlingDisplay: 'PRECISO',
        nitroDisplay: '130%'
    }
};

// --- GAME CONFIG & STATE ---
const CONFIG = {
    roadWidth: 14,
    laneCount: 3,
    cameraOffset: new THREE.Vector3(0, 3.4, 7.8),
    cameraLookOffset: new THREE.Vector3(0, 1.2, -5),
    difficulties: {
        facil: { name: 'Fácil', speed: 28, spawnInterval: 1.3, multiplier: 1.0, obstacleSpeed: 0 },
        medio: { name: 'Médio', speed: 42, spawnInterval: 0.95, multiplier: 1.5, obstacleSpeed: 0 },
        dificil: { name: 'Difícil', speed: 58, spawnInterval: 0.68, multiplier: 2.5, obstacleSpeed: 3 },
        extremo: { name: 'Extremo', speed: 78, spawnInterval: 0.42, multiplier: 4.0, obstacleSpeed: 8, storm: true }
    }
};

let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
let selectedVehicleId = 'car_sport';
let selectedDifficulty = 'medio';
let steeringSensitivity = 2.5;

let score = 0;
let distance = 0;
let currentSpeed = 0;
let targetSpeed = 0;
let nitroAmount = 100;
let isBoosting = false;
let highScore = parseInt(localStorage.getItem('turbo_dodge_3d_highscore') || '0');

// Input state
const keys = { left: false, right: false, accelerate: false, brake: false, boost: false };

// Three.js Core Variables
let scene, camera, renderer, clock;
let playerGroup, playerBody, wheelsMesh = [], riderMesh = null;
let roadTiles = [], mountainMeshLeft, mountainMeshRight;
let obstacles = [], pickups = [];
let particlesSystem, particleGeom;
let dirLight, ambientLight, stormLightningTimer = 0;
let playerX = 0, playerSpeedX = 0, playerTilt = 0, playerPitch = 0;
let cameraShake = 0;
let spawnTimer = 0;
let sharedRoadTexture = null;
