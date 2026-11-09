// Veículo do jogador e partículas de escape

function spawnPlayerVehicle(vId) {
    if (playerGroup) scene.remove(playerGroup);
    wheelsMesh = [];
    riderMesh = null;

    const veh = GARAGE_VEHICLES[vId];
    playerGroup = new THREE.Group();

    if (veh.type === 'car' || veh.type === 'truck') {
        // Car / Truck Body Chassis
        const isTruck = veh.type === 'truck';
        const bodyWidth = isTruck ? 2.2 : 1.8;
        const bodyHeight = isTruck ? 1.0 : 0.65;
        const bodyLength = isTruck ? 4.2 : 3.8;

        const bodyGeom = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyLength);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: veh.color, 
            metalness: 0.85, 
            roughness: 0.15 
        });
        playerBody = new THREE.Mesh(bodyGeom, bodyMat);
        playerBody.position.y = isTruck ? 0.9 : 0.5;
        playerBody.castShadow = true;
        playerGroup.add(playerBody);

        // Cabin Glass
        const cabinGeom = new THREE.BoxGeometry(bodyWidth * 0.8, isTruck ? 0.7 : 0.5, bodyLength * 0.45);
        const cabinMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1, metalness: 0.9 });
        const cabin = new THREE.Mesh(cabinGeom, cabinMat);
        cabin.position.set(0, playerBody.position.y + (isTruck ? 0.8 : 0.45), -0.2);
        cabin.castShadow = true;
        playerGroup.add(cabin);

        // Headlights
        const hlGeom = new THREE.BoxGeometry(0.35, 0.12, 0.1);
        const hlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const hlLeft = new THREE.Mesh(hlGeom, hlMat);
        hlLeft.position.set(-bodyWidth*0.35, playerBody.position.y, -bodyLength/2 - 0.01);
        playerGroup.add(hlLeft);

        const hlRight = new THREE.Mesh(hlGeom, hlMat);
        hlRight.position.set(bodyWidth*0.35, playerBody.position.y, -bodyLength/2 - 0.01);
        playerGroup.add(hlRight);

        // Wheels
        const wheelRadius = isTruck ? 0.6 : 0.35;
        const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, isTruck ? 0.45 : 0.3, 20);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });

        const wX = bodyWidth/2 + (isTruck ? 0.15 : 0.05);
        const wY = wheelRadius;
        const wZ = bodyLength/3;

        const wheelPositions = [
            [-wX, wY, -wZ], [wX, wY, -wZ],
            [-wX, wY, wZ],  [wX, wY, wZ]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeom, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(...pos);
            wheel.castShadow = true;
            playerGroup.add(wheel);
            wheelsMesh.push(wheel);
        });

    } else {
        // Bikes (Superbike, Chopper, Neon)
        const isChopper = vId === 'bike_chopper';
        const isFuturistic = vId === 'bike_futuristic';

        const frameGeom = new THREE.BoxGeometry(0.6, 0.7, 2.2);
        const frameMat = new THREE.MeshStandardMaterial({ color: veh.color, metalness: 0.8, roughness: 0.2 });
        playerBody = new THREE.Mesh(frameGeom, frameMat);
        playerBody.position.y = 0.6;
        playerBody.castShadow = true;
        playerGroup.add(playerBody);

        // Handlebars
        const barGeom = new THREE.BoxGeometry(isChopper ? 1.4 : 1.1, 0.08, 0.08);
        const barMat = new THREE.MeshStandardMaterial({ color: isChopper ? 0xffb700 : 0x94a3b8, metalness: 0.9 });
        const bar = new THREE.Mesh(barGeom, barMat);
        bar.position.set(0, isChopper ? 1.15 : 0.9, -0.6);
        playerGroup.add(bar);

        // Wheels (Front & Rear)
        const wheelRadius = 0.45;
        const wheelGeom = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 20);
        const wheelMat = new THREE.MeshStandardMaterial({ color: isFuturistic ? veh.color : 0x0f172a, roughness: 0.4 });

        const frontWheel = new THREE.Mesh(wheelGeom, wheelMat);
        frontWheel.rotation.z = Math.PI / 2;
        frontWheel.position.set(0, 0.45, -0.95);
        frontWheel.castShadow = true;
        playerGroup.add(frontWheel);
        wheelsMesh.push(frontWheel);

        const rearWheel = new THREE.Mesh(wheelGeom, wheelMat);
        rearWheel.rotation.z = Math.PI / 2;
        rearWheel.position.set(0, 0.45, 0.95);
        rearWheel.castShadow = true;
        playerGroup.add(rearWheel);
        wheelsMesh.push(rearWheel);

        // Rider Figure
        riderMesh = new THREE.Group();
        const torsoGeom = new THREE.BoxGeometry(0.5, 0.6, 0.4);
        const riderMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
        const torso = new THREE.Mesh(torsoGeom, riderMat);
        torso.position.set(0, 1.1, 0.1);
        torso.rotation.x = -Math.PI / 8;
        riderMesh.add(torso);

        const helmetGeom = new THREE.SphereGeometry(0.24, 16, 16);
        const helmetMat = new THREE.MeshStandardMaterial({ color: veh.color, metalness: 0.8, roughness: 0.2 });
        const helmet = new THREE.Mesh(helmetGeom, helmetMat);
        helmet.position.set(0, 1.5, -0.1);
        riderMesh.add(helmet);

        playerGroup.add(riderMesh);
    }

    scene.add(playerGroup);
}

function createExhaustParticles() {
    const count = 70;
    particleGeom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) positions[i] = 0;

    particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0x00f3ff,
        size: 0.3,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending
    });

    particlesSystem = new THREE.Points(particleGeom, particleMat);
    scene.add(particlesSystem);
}
