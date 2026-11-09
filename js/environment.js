// Cena 3D: textura do asfalto, montanhas e estrada

/**
 * Generates a high-detail procedural asphalt texture with stone noise, 
 * thick continuous outer border lines, and dashed center lane dividers.
 */
function generateProceduralAsphaltTexture() {
    const width = 1024;
    const height = 2048;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // 1. Dark Granular Asphalt Base Color (#16181c)
    ctx.fillStyle = '#16181c';
    ctx.fillRect(0, 0, width, height);

    // 2. High-Density Realistic Stone Grain / Noise
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
        // Subtle noise pixel variation
        const noise = (Math.random() - 0.5) * 32;
        // Occasional tiny stone specks / light glints
        const isStone = Math.random() < 0.04 ? (Math.random() * 55 + 25) : 0;

        data[i]     = Math.min(255, Math.max(0, data[i] + noise + isStone));         // R
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + isStone));     // G
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + isStone * 1.1));// B
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Thick Continuous White Side Lines (Bermas)
    const margin = 40;
    const outerLineWidth = 36;
    ctx.fillStyle = '#f1f5f9';
    
    // Subtle glow effect on markings
    ctx.shadowColor = 'rgba(255, 255, 255, 0.25)';
    ctx.shadowBlur = 6;

    // Left continuous line
    ctx.fillRect(margin, 0, outerLineWidth, height);
    // Right continuous line
    ctx.fillRect(width - margin - outerLineWidth, 0, outerLineWidth, height);

    // 4. Center Dashed Line Dividers for 3 Lanes
    // Effective road width between margins
    const usableWidth = width - 2 * margin;
    const laneWidth = usableWidth / CONFIG.laneCount;

    const dashWidth = 18;
    const dashHeight = 110;
    const dashGap = 90;

    const lane1X = margin + laneWidth;
    const lane2X = margin + 2 * laneWidth;

    ctx.fillStyle = '#e2e8f0';
    for (let y = 0; y < height; y += dashHeight + dashGap) {
        // Lane 1 divider dash
        ctx.fillRect(lane1X - dashWidth / 2, y, dashWidth, dashHeight);
        // Lane 2 divider dash
        ctx.fillRect(lane2X - dashWidth / 2, y, dashWidth, dashHeight);
    }

    // Create Canvas Texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    // Repeat texture along the road tile Z axis
    texture.repeat.set(1, 4);

    return texture;
}

function init3D() {
    const container = document.getElementById('canvas-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070a);
    scene.fog = new THREE.FogExp2(0x05070a, 0.012);

    // Camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 250);
    camera.position.copy(CONFIG.cameraOffset);
    camera.lookAt(CONFIG.cameraLookOffset);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lighting
    ambientLight = new THREE.AmbientLight(0xcce0ff, 0.6);
    scene.add(ambientLight);

    dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(20, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 120;
    const d = 25;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);

    clock = new THREE.Clock();

    // Generate Procedural High-Res Asphalt Texture with Anisotropy
    sharedRoadTexture = generateProceduralAsphaltTexture();
    const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
    sharedRoadTexture.anisotropy = Math.min(16, maxAnisotropy);

    // Build Scenery, Environment & Particles
    buildBackgroundMountains();
    buildRoadEnvironment();
    createExhaustParticles();

    // Spawn Initial Vehicle Preview
    spawnPlayerVehicle(selectedVehicleId);

    // Handle Resize
    window.addEventListener('resize', onWindowResize);
}

function buildBackgroundMountains() {
    // Realistic Parallax Mountain Silhouettes in distance
    const mountainGeom = new THREE.ConeGeometry(40, 30, 5);
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x0a111f, roughness: 1.0 });

    mountainMeshLeft = new THREE.Group();
    mountainMeshRight = new THREE.Group();

    for (let i = 0; i < 6; i++) {
        const mLeft = new THREE.Mesh(mountainGeom, mountainMat);
        mLeft.position.set(-80 - Math.random() * 40, 10, -80 - i * 35);
        mLeft.scale.set(1 + Math.random(), 1 + Math.random(), 1);
        mountainMeshLeft.add(mLeft);

        const mRight = new THREE.Mesh(mountainGeom, mountainMat);
        mRight.position.set(80 + Math.random() * 40, 10, -80 - i * 35);
        mRight.scale.set(1 + Math.random(), 1 + Math.random(), 1);
        mountainMeshRight.add(mRight);
    }

    scene.add(mountainMeshLeft);
    scene.add(mountainMeshRight);
}

function buildRoadEnvironment() {
    const roadLength = 60;
    const tileCount = 5;

    for (let i = 0; i < tileCount; i++) {
        const tile = new THREE.Group();
        tile.position.z = -i * roadLength;

        // Realistic Granular Asphalt Plane
        const roadGeom = new THREE.PlaneGeometry(CONFIG.roadWidth, roadLength);
        const roadMat = new THREE.MeshStandardMaterial({ 
            map: sharedRoadTexture,
            roughness: 0.85, 
            metalness: 0.1 
        });
        const roadMesh = new THREE.Mesh(roadGeom, roadMat);
        roadMesh.rotation.x = -Math.PI / 2;
        roadMesh.receiveShadow = true;
        tile.add(roadMesh);

        // Red/White Rumble Strips (Berma)
        for (let r = -roadLength / 2; r < roadLength / 2; r += 2) {
            const rumbleGeom = new THREE.BoxGeometry(0.5, 0.05, 1);
            const isRed = (Math.floor(r) % 4 === 0);
            const rumbleMat = new THREE.MeshBasicMaterial({ color: isRed ? 0xff0055 : 0xffffff });
            
            const rumbleLeft = new THREE.Mesh(rumbleGeom, rumbleMat);
            rumbleLeft.position.set(-CONFIG.roadWidth / 2 - 0.25, 0.02, r);
            tile.add(rumbleLeft);

            const rumbleRight = new THREE.Mesh(rumbleGeom, rumbleMat);
            rumbleRight.position.set(CONFIG.roadWidth / 2 + 0.25, 0.02, r);
            tile.add(rumbleRight);
        }

        // Guardrails
        const railGeom = new THREE.BoxGeometry(0.3, 0.8, roadLength);
        const railMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
        
        const leftRail = new THREE.Mesh(railGeom, railMat);
        leftRail.position.set(-CONFIG.roadWidth / 2 - 0.6, 0.4, 0);
        leftRail.castShadow = true;
        tile.add(leftRail);

        const rightRail = new THREE.Mesh(railGeom, railMat);
        rightRail.position.set(CONFIG.roadWidth / 2 + 0.6, 0.4, 0);
        rightRail.castShadow = true;
        tile.add(rightRail);

        // Side Street Lamp Posts
        const lampGroup = new THREE.Group();
        const poleGeom = new THREE.CylinderGeometry(0.12, 0.12, 5.5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.y = 2.75;
        lampGroup.add(pole);

        const bulbGeom = new THREE.SphereGeometry(0.35, 16, 16);
        const bulbMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
        const bulb = new THREE.Mesh(bulbGeom, bulbMat);
        bulb.position.set(0.8, 5.3, 0);
        lampGroup.add(bulb);

        lampGroup.position.set(-CONFIG.roadWidth / 2 - 1.8, 0, -15);
        tile.add(lampGroup);

        scene.add(tile);
        roadTiles.push(tile);
    }
}

