// Loop principal: game over, spawns, lógica, HUD, render, resize

function gameOver() {
    gameState = 'GAMEOVER';
    sounds.stopEngineSound();
    sounds.playCrash();

    // Flash effect
    const flash = document.getElementById('flash-overlay');
    flash.style.opacity = '0.85';
    setTimeout(() => flash.style.opacity = '0', 150);

    cameraShake = 1.2;

    const isNewRecord = score > highScore;
    if (isNewRecord) {
        highScore = score;
        localStorage.setItem('turbo_dodge_3d_highscore', highScore.toString());
        document.getElementById('high-score-display').innerText = `${highScore} PTS`;
    }

    document.getElementById('go-score').innerText = Math.floor(score);
    document.getElementById('go-distance').innerText = `${Math.floor(distance)}m`;
    document.getElementById('go-difficulty').innerText = CONFIG.difficulties[selectedDifficulty].name;
    document.getElementById('go-vehicle').innerText = GARAGE_VEHICLES[selectedVehicleId].name;
    
    const badge = document.getElementById('new-record-badge');
    if (isNewRecord) badge.classList.remove('hidden');
    else badge.classList.add('hidden');

    document.getElementById('hud-overlay').classList.add('hidden');
    document.getElementById('gameover-overlay').classList.remove('hidden');
}

function spawnObstaclesAndPickups(delta) {
    const diff = CONFIG.difficulties[selectedDifficulty];
    spawnTimer += delta;

    if (spawnTimer >= diff.spawnInterval) {
        spawnTimer = 0;

        const laneWidth = CONFIG.roadWidth / CONFIG.laneCount;
        const lane = Math.floor(Math.random() * CONFIG.laneCount);
        const xPos = -CONFIG.roadWidth / 2 + laneWidth / 2 + lane * laneWidth;

        if (Math.random() < 0.8) {
            const r = Math.random();
            let obs;
            if (r < 0.4) obs = createRockObstacle();
            else if (r < 0.75) obs = createBarricadeObstacle();
            else obs = createOilSlickObstacle();

            obs.position.x = xPos;
            obs.position.z = -120;
            scene.add(obs);
            obstacles.push(obs);
        } else {
            const pickup = createNitroPickup();
            pickup.position.x = xPos;
            pickup.position.z = -120;
            scene.add(pickup);
            pickups.push(pickup);
        }
    }
}

function updateGame(delta) {
    const diff = CONFIG.difficulties[selectedDifficulty];
    const veh = GARAGE_VEHICLES[selectedVehicleId];

    // Boosting state
    isBoosting = keys.boost && nitroAmount > 0;
    const boostMultiplier = isBoosting ? 1.45 : 1.0;
    
    // Manual acceleration & braking modifiers
    let speedControlMult = 1.0;
    if (keys.accelerate) speedControlMult += 0.2;
    if (keys.brake) speedControlMult -= 0.35;

    if (isBoosting) {
        nitroAmount = Math.max(0, nitroAmount - delta * 35);
    } else {
        nitroAmount = Math.min(100 * veh.nitroMult, nitroAmount + delta * 12);
    }

    // Speed calculation
    const baseTarget = diff.speed * veh.speedMult * boostMultiplier * speedControlMult;
    currentSpeed += (baseTarget - currentSpeed) * delta * 3.0;

    sounds.updateEnginePitch(currentSpeed / 100);

    // Stats update
    distance += (currentSpeed * delta);
    score += (currentSpeed * delta * diff.multiplier * (isBoosting ? 1.5 : 1.0));

    // HIGH-RESPONSIVENESS STEERING WITH VEHICLE HANDLING STATS
    const accelX = 45.0 * steeringSensitivity * veh.handlingMult;
    
    if (keys.left) playerSpeedX -= accelX * delta;
    if (keys.right) playerSpeedX += accelX * delta;

    playerSpeedX *= 0.82; 
    playerX += playerSpeedX * delta;

    // Clamping
    const limit = (CONFIG.roadWidth / 2) - 1.2;
    if (playerX < -limit) { playerX = -limit; playerSpeedX = 0; }
    if (playerX > limit) { playerX = limit; playerSpeedX = 0; }

    // Dynamic Roll (Tilt) & Pitch (Acceleration / Braking)
    const targetTilt = -playerSpeedX * 0.08;
    playerTilt += (targetTilt - playerTilt) * 0.22;

    const targetPitch = (keys.accelerate ? -0.05 : 0) + (keys.brake ? 0.08 : 0);
    playerPitch += (targetPitch - playerPitch) * 0.2;

    if (playerGroup) {
        playerGroup.position.x = playerX;
        playerGroup.rotation.z = playerTilt;
        playerGroup.rotation.x = playerPitch;
        playerGroup.rotation.y = -playerSpeedX * 0.02;

        // Wheel rotation animation
        wheelsMesh.forEach(w => w.rotation.x += currentSpeed * delta * 0.2);

        if (riderMesh) {
            riderMesh.rotation.z = playerTilt * 0.6;
        }
    }

    // Road & Parallax Scenery Movement
    roadTiles.forEach(tile => {
        tile.position.z += currentSpeed * delta;
        if (tile.position.z > 20) {
            tile.position.z -= 60 * roadTiles.length;
        }
    });

    if (mountainMeshLeft && mountainMeshRight) {
        mountainMeshLeft.position.z += currentSpeed * delta * 0.15;
        mountainMeshRight.position.z += currentSpeed * delta * 0.15;
        if (mountainMeshLeft.position.z > 50) mountainMeshLeft.position.z = 0;
        if (mountainMeshRight.position.z > 50) mountainMeshRight.position.z = 0;
    }

    // Obstacles logic & collision
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        obs.position.z += (currentSpeed + diff.obstacleSpeed) * delta;

        if (obs.userData.type === 'rock') {
            obs.rotation.x += delta;
        }

        const dx = playerX - obs.position.x;
        const dz = 0 - obs.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < obs.userData.radius + 0.55) {
            if (obs.userData.type === 'oil') {
                playerSpeedX += (Math.random() > 0.5 ? 22 : -22);
                sounds.playSlick();
                scene.remove(obs);
                obstacles.splice(i, 1);
                continue;
            } else {
                gameOver();
                return;
            }
        }

        if (obs.position.z > 15) {
            scene.remove(obs);
            obstacles.splice(i, 1);
        }
    }

    // Pickups logic
    for (let i = pickups.length - 1; i >= 0; i--) {
        const p = pickups[i];
        p.position.z += currentSpeed * delta;
        p.rotation.y += delta * 3;

        const dx = playerX - p.position.x;
        const dz = 0 - p.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);

        if (dist < p.userData.radius + 0.6) {
            nitroAmount = Math.min(100 * veh.nitroMult, nitroAmount + 40);
            score += 150;
            sounds.playPickup();
            scene.remove(p);
            pickups.splice(i, 1);
            continue;
        }

        if (p.position.z > 15) {
            scene.remove(p);
            pickups.splice(i, 1);
        }
    }

    // Particles animation
    if (particlesSystem && playerGroup) {
        const pos = particleGeom.attributes.position.array;
        for (let i = (pos.length / 3) - 1; i > 0; i--) {
            pos[i * 3] = pos[(i - 1) * 3];
            pos[i * 3 + 1] = pos[(i - 1) * 3 + 1];
            pos[i * 3 + 2] = pos[(i - 1) * 3 + 2] + currentSpeed * delta;
        }
        pos[0] = playerX + (Math.random() * 0.2 - 0.1);
        pos[1] = 0.3;
        pos[2] = 1.8;
        particleGeom.attributes.position.needsUpdate = true;
    }

    // Storm Lightning on Extremo Mode
    if (diff.storm) {
        stormLightningTimer += delta;
        if (stormLightningTimer > 3.0 + Math.random() * 4.0) {
            stormLightningTimer = 0;
            ambientLight.intensity = 2.5;
            setTimeout(() => ambientLight.intensity = 0.3, 80);
        }
    }

    // Spring Camera & FOV stretch
    const targetFov = isBoosting ? 72 : 60;
    camera.fov += (targetFov - camera.fov) * delta * 4.0;
    camera.updateProjectionMatrix();

    // Camera follow with spring lerp
    camera.position.x += (playerX * 0.45 - camera.position.x) * delta * 6.0;
    camera.lookAt(playerX * 0.3, CONFIG.cameraLookOffset.y, CONFIG.cameraLookOffset.z);

    if (cameraShake > 0) {
        camera.position.x += (Math.random() - 0.5) * cameraShake;
        camera.position.y += (Math.random() - 0.5) * cameraShake;
        cameraShake = Math.max(0, cameraShake - delta * 3.0);
    }

    spawnObstaclesAndPickups(delta);
    updateHUD();
}

function updateHUD() {
    const speedKmh = Math.floor(currentSpeed * 2.8);
    document.getElementById('hud-speed').innerText = speedKmh;

    const speedoBar = document.getElementById('speedo-bar');
    const maxSpeed = 240;
    const pct = Math.min(1, speedKmh / maxSpeed);
    const offset = 283 - (283 * pct);
    speedoBar.style.strokeDashoffset = offset;

    const vignette = document.getElementById('speed-vignette');
    if (isBoosting) vignette.classList.add('boosting');
    else vignette.classList.remove('boosting');

    document.getElementById('hud-score').innerText = Math.floor(score);
    document.getElementById('hud-multiplier').innerText = `${CONFIG.difficulties[selectedDifficulty].multiplier.toFixed(1)}x`;
    document.getElementById('hud-distance').innerText = `${Math.floor(distance)}m`;

    const veh = GARAGE_VEHICLES[selectedVehicleId];
    const nitroPct = (nitroAmount / (100 * veh.nitroMult)) * 100;
    document.getElementById('hud-nitro-bar').style.width = `${nitroPct}%`;
    document.getElementById('hud-nitro-text').innerText = `${Math.floor(nitroPct)}%`;
}

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.1);

    if (gameState === 'PLAYING') {
        updateGame(delta);
    } else if (gameState === 'MENU' && playerGroup) {
        // Garage 360 preview spin
        playerGroup.rotation.y += delta * 0.6;
    }

    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
