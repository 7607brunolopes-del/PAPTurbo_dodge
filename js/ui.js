// Interface: eventos, garagem, menus, pausa, áudio, ecrã inteiro

function setupEventListeners() {
    window.addEventListener('keydown', e => {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = true;
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = true;
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.accelerate = true;
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.brake = true;
        if (e.code === 'Space') keys.boost = true;
        if (e.key === 'f' || e.key === 'F') toggleFullscreen();
        if (e.key === 'p' || e.key === 'P') togglePause();
    });

    window.addEventListener('keyup', e => {
        if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') keys.left = false;
        if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') keys.right = false;
        if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') keys.accelerate = false;
        if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') keys.brake = false;
        if (e.code === 'Space') keys.boost = false;
    });

    // Mobile Touch UI
    const btnLeft = document.getElementById('touch-left');
    const btnRight = document.getElementById('touch-right');
    const btnBoost = document.getElementById('touch-boost');

    btnLeft.addEventListener('touchstart', (e) => { e.preventDefault(); keys.left = true; });
    btnLeft.addEventListener('touchend', (e) => { e.preventDefault(); keys.left = false; });
    btnRight.addEventListener('touchstart', (e) => { e.preventDefault(); keys.right = true; });
    btnRight.addEventListener('touchend', (e) => { e.preventDefault(); keys.right = false; });
    btnBoost.addEventListener('touchstart', (e) => { e.preventDefault(); keys.boost = true; });
    btnBoost.addEventListener('touchend', (e) => { e.preventDefault(); keys.boost = false; });
}

function selectGarageVehicle(vId) {
    selectedVehicleId = vId;
    const veh = GARAGE_VEHICLES[vId];

    // Update UI Active cards
    document.querySelectorAll('#menu-overlay .glass-card').forEach(card => card.classList.remove('active'));
    const activeCard = document.getElementById(`card-${vId}`);
    if (activeCard) activeCard.classList.add('active');

    // Update Name & Stats
    document.getElementById('selected-vehicle-name').innerText = veh.name;
    document.getElementById('stat-speed-val').innerText = veh.speedDisplay;
    document.getElementById('stat-speed-bar').style.width = `${(veh.speedMult / 1.4) * 100}%`;
    
    document.getElementById('stat-handling-val').innerText = veh.handlingDisplay;
    document.getElementById('stat-handling-bar').style.width = `${(veh.handlingMult / 1.5) * 100}%`;
    
    document.getElementById('stat-nitro-val').innerText = veh.nitroDisplay;
    document.getElementById('stat-nitro-bar').style.width = `${(veh.nitroMult / 1.5) * 100}%`;

    // If in menu, update preview model in scene
    if (gameState === 'MENU') {
        spawnPlayerVehicle(selectedVehicleId);
    }
}

function updateSensitivity(val) {
    steeringSensitivity = parseFloat(val);
    document.getElementById('sens-val-display').innerText = `${steeringSensitivity.toFixed(1)}x`;
    document.getElementById('pause-sens-display').innerText = `${steeringSensitivity.toFixed(1)}x`;
    document.getElementById('sens-slider').value = steeringSensitivity;
    document.getElementById('pause-sens-slider').value = steeringSensitivity;
}

function setDifficulty(diff) {
    selectedDifficulty = diff;
    document.querySelectorAll('.diff-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`diff-${diff}`).classList.add('active');
}

function launchGame() {
    sounds.init();
    sounds.startEngineSound();

    // Clear previous meshes
    obstacles.forEach(o => scene.remove(o));
    pickups.forEach(p => scene.remove(p));
    obstacles = [];
    pickups = [];

    // Spawn selected vehicle
    spawnPlayerVehicle(selectedVehicleId);
    const veh = GARAGE_VEHICLES[selectedVehicleId];

    // Reset parameters
    const diff = CONFIG.difficulties[selectedDifficulty];
    targetSpeed = diff.speed * veh.speedMult;
    currentSpeed = targetSpeed * 0.5;
    score = 0;
    distance = 0;
    playerX = 0;
    playerSpeedX = 0;
    playerTilt = 0;
    playerPitch = 0;
    nitroAmount = 100 * veh.nitroMult;
    spawnTimer = 0;

    // Extremo mode visual settings
    if (diff.storm) {
        scene.fog.color.setHex(0x020617);
        scene.fog.density = 0.035;
        ambientLight.color.setHex(0x3b82f6);
        ambientLight.intensity = 0.3;
    } else {
        scene.fog.color.setHex(0x05070a);
        scene.fog.density = 0.012;
        ambientLight.color.setHex(0xcce0ff);
        ambientLight.intensity = 0.6;
    }

    // UI view state
    document.getElementById('menu-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('hud-overlay').classList.remove('hidden');

    gameState = 'PLAYING';
}

function togglePause() {
    if (gameState !== 'PLAYING' && gameState !== 'PAUSED') return;

    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        sounds.stopEngineSound();
        document.getElementById('pause-overlay').classList.remove('hidden');
    } else {
        gameState = 'PLAYING';
        sounds.startEngineSound();
        document.getElementById('pause-overlay').classList.add('hidden');
    }
}

function toggleAudio() {
    sounds.isMuted = !sounds.isMuted;
    const btn = document.getElementById('sound-btn');
    btn.innerHTML = sounds.isMuted ? 
        '<i class="fa-solid fa-volume-xmark text-lg text-red-400"></i>' : 
        '<i class="fa-solid fa-volume-high text-lg"></i>';
    if (sounds.isMuted) sounds.stopEngineSound();
    else if (gameState === 'PLAYING') sounds.startEngineSound();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
}

function returnToMenu() {
    gameState = 'MENU';
    sounds.stopEngineSound();
    document.getElementById('hud-overlay').classList.add('hidden');
    document.getElementById('pause-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.add('hidden');
    document.getElementById('menu-overlay').classList.remove('hidden');

    // Reset position for preview
    spawnPlayerVehicle(selectedVehicleId);
    if (playerGroup) {
        playerGroup.position.set(0, 0, 0);
        playerGroup.rotation.set(0, 0, 0);
    }
}
