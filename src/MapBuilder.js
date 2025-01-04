import * as THREE from 'three';

export class MapBuilder {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.gridTexture = this._createGridTexture();
        this.platforms = []
    }

    createMap() {
        // Base
        this.createCirclePlatform(0, 0, 0, 50, 1, 0x808080);
        //Spiral
        this.createSpiralPlatform(30, 2, 65, 1, 1);
        this.createSpiralPlatform(30, 2, 65, -1, 1);
        this.createSpiralPlatform(30, 2, 65, 1, 1, 60);
        this.createSpiralPlatform(30, 2, 65, -1, 1, 60);
        //Circular
        this.createCircularPlatform(66, 200, -1, 1, 1);
        //Jump
        this.createJumpSequencePlatform(10, 60, 1, 0, 8, 1);
        this.createJumpSequencePlatform(10, -60, 1, 0, 8, 1, -1);
    }

    createBoxPlatform(x, y, z, sx, sy, sz, color) {
        const floorGeometry = new THREE.BoxGeometry(sx, sy, sz);

        const divisions = 8;
        const desiredCellSize = 2;

        const platformTexture = this.gridTexture.clone();
        platformTexture.wrapS = THREE.RepeatWrapping;
        platformTexture.wrapT = THREE.RepeatWrapping;
        platformTexture.repeat.set(
            sx / (divisions * desiredCellSize),
            sz / (divisions * desiredCellSize)
        );
        platformTexture.needsUpdate = true;

        const floorMaterial = new THREE.MeshStandardMaterial({ map: platformTexture });
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.position.set(x, y + sy / 2, z);
        this.scene.add(floorMesh);
        this.platforms.push(floorMesh);
        const shape = new Ammo.btBoxShape(new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5));
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y + sy / 2, z));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new Ammo.btVector3(0, 0, 0));
        const body = new Ammo.btRigidBody(rbInfo);
        body.setFriction(1);
        body.setActivationState(4);
        this.physicsWorld.addRigidBody(body);
    }

    createCirclePlatform(x, y, z, r, sy, color) {
        const floorGeometry = new THREE.CylinderGeometry(r, r, sy, 32);

        const divisions = 8;
        const desiredCellSize = 2;
        const platformTexture = this.gridTexture.clone();
        platformTexture.wrapS = THREE.RepeatWrapping;
        platformTexture.wrapT = THREE.RepeatWrapping;
        platformTexture.repeat.set(
            (2 * r) / (divisions * desiredCellSize),
            (2 * r) / (divisions * desiredCellSize)
        );
        platformTexture.needsUpdate = true;

        const floorMaterial = new THREE.MeshStandardMaterial({ map: platformTexture });
        const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
        floorMesh.position.set(x, y + sy / 2, z);
        this.scene.add(floorMesh);
        this.platforms.push(floorMesh);
        const shape = new Ammo.btCylinderShape(new Ammo.btVector3(r, sy * 0.5, r));
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(x, y + sy / 2, z));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new Ammo.btVector3(0, 0, 0));
        const body = new Ammo.btRigidBody(rbInfo);
        body.setFriction(1);
        body.setActivationState(4);
        this.physicsWorld.addRigidBody(body);
    }

    createSpiralPlatform(platformCount, heightIncrement, radius, angleDirection = 1, radiusDirection = 1, baseHeight = 0) {
        const angleIncrement = (2 * Math.PI) / platformCount;
        for (let i = 1; i < platformCount; i++) {
            const angle = i * angleIncrement;
            const x = radius * (radiusDirection * Math.cos(angleDirection * angle));
            const z = radius * (radiusDirection * Math.sin(angleDirection * angle));
            const y = baseHeight + (i * heightIncrement);

            const color = (i % 2 === 0) ? 0x00ff00 : 0xff0000;
            this.createBoxPlatform(x, y, z, 10, 1, 10, color);
        }
    }

    createCircularPlatform(platformCount, radius, angleDirection = 1, radiusDirection = 1, baseHeight = 0) {
        const angleIncrement = (2 * Math.PI) / platformCount;
        for (let i = 1; i < platformCount; i++) {
            const angle = i * angleIncrement;
            const x = radius * (radiusDirection * Math.cos(angleDirection * angle));
            const z = radius * (radiusDirection * Math.sin(angleDirection * angle));
            const y = baseHeight;

            const color = (i % 2 === 0) ? 0x00ff00 : 0xff0000;
            this.createBoxPlatform(x, y, z, 10, 1, 5, color);
        }
    }

    createJumpSequencePlatform(horizontalCount, startX, startY, startZ, _baseGap = 8, _gapIncrement = 1, _direction = 1) {
        let currentX = startX;
        let baseGap = _baseGap;
        let gapIncrement = _gapIncrement;

        for (let j = 0; j < horizontalCount; j++) {
            this.createBoxPlatform(currentX, startY, startZ, 5, 1, 10, 0x808080);
            baseGap += gapIncrement;
            currentX += baseGap * _direction;
        }
    }

    _createGridTexture() {
        const size = 256;
        const divisions = 8;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;

        const step = size / divisions;
        for (let i = 0; i <= divisions; i++) {
            const x = i * step;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, size);
            ctx.stroke();
        }

        for (let j = 0; j <= divisions; j++) {
            const y = j * step;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(size, y);
            ctx.stroke();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.anisotropy = 16;
        return texture;
    }
}
