// Obstáculos e pickups (rochas, barricadas, óleo, nitro)

function createRockObstacle() {
    const size = 0.85 + Math.random() * 0.35;
    const geom = new THREE.IcosahedronGeometry(size, 1);
    
    const posAttr = geom.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);
        const noise = 0.8 + Math.random() * 0.4;
        posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.castShadow = true;
    mesh.position.y = size * 0.7;
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

    mesh.userData = { type: 'rock', radius: size * 0.75 };
    return mesh;
}

function createBarricadeObstacle() {
    const group = new THREE.Group();
    const barGeom = new THREE.BoxGeometry(2.2, 0.5, 0.2);
    const barMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.4 });
    const bar = new THREE.Mesh(barGeom, barMat);
    bar.position.y = 0.6;
    bar.castShadow = true;
    group.add(bar);

    const stripeGeom = new THREE.BoxGeometry(0.3, 0.52, 0.22);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    for (let x = -0.8; x <= 0.8; x += 0.6) {
        const stripe = new THREE.Mesh(stripeGeom, stripeMat);
        stripe.position.set(x, 0.6, 0);
        group.add(stripe);
    }

    group.userData = { type: 'barricade', radius: 0.95 };
    return group;
}

function createOilSlickObstacle() {
    const geom = new THREE.CircleGeometry(1.2, 16);
    const mat = new THREE.MeshStandardMaterial({ 
        color: 0x020617, roughness: 0.05, metalness: 0.9, transparent: true, opacity: 0.85
    });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;

    mesh.userData = { type: 'oil', radius: 0.9 };
    return mesh;
}

function createNitroPickup() {
    const group = new THREE.Group();
    const geom = new THREE.OctahedronGeometry(0.4, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, wireframe: true });
    const mesh = new THREE.Mesh(geom, mat);
    mesh.position.y = 0.65;
    group.add(mesh);

    const innerGeom = new THREE.SphereGeometry(0.2, 12, 12);
    const innerMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff });
    const inner = new THREE.Mesh(innerGeom, innerMat);
    inner.position.y = 0.65;
    group.add(inner);

    group.userData = { type: 'nitro', radius: 0.8 };
    return group;
}
