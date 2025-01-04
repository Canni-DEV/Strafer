import * as THREE from 'three';

export class RocketManager {
    constructor(scene, physicsWorld, inputHandler, player, enemyManager, soundManager) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.inputHandler = inputHandler;
        this.player = player;

        this.rockets = [];
        this.rigidBodyDataMap = new Map();
        this.lastUserIndex = 0;

        this.explosionRadius = 15;
        this.explosionForce = 200;

        this.enemyManager = enemyManager;
        this.soundManager = soundManager;
    }

    init() {
    }

    update(delta) {
        if (this.inputHandler.isKeyDown('shootRocket')) {
            this.soundManager.playSound('shoot', 0.5, false);
            this.shootRocket();
            this.inputHandler.clearShoot();
        }

        this.updateRockets();

        this.checkCollisions();

        this.cleanupRockets();
    }

    shootRocket() {
        const forward = new THREE.Vector3();
        this.player.camera.getWorldDirection(forward);
        forward.normalize();

        const spawnPos = this.player.position.clone().add(forward.clone().multiplyScalar(2));

        const rocketRadius = 0.2;
        const rocketHeight = 1;
        const rocketGeometry = new THREE.CylinderGeometry(rocketRadius, rocketRadius, rocketHeight, 8);
        const rocketMaterial = new THREE.MeshStandardMaterial({ color: 0x258BE8 });
        const rocketMesh = new THREE.Mesh(rocketGeometry, rocketMaterial);
        rocketMesh.position.copy(spawnPos);
        rocketMesh.quaternion.copy(this.player.camera.quaternion);

        const xRotation = new THREE.Quaternion();
        xRotation.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        rocketMesh.quaternion.multiply(xRotation);

        this.scene.add(rocketMesh);

        const shape = new Ammo.btCylinderShape(new Ammo.btVector3(rocketRadius, rocketHeight * 0.5, rocketRadius));
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(spawnPos.x, spawnPos.y, spawnPos.z));

        const q = rocketMesh.quaternion;
        transform.setRotation(new Ammo.btQuaternion(q.x, q.y, q.z, q.w));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const mass = 1;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        const rocketBody = new Ammo.btRigidBody(rbInfo);
        rocketBody.setFriction(1);
        rocketBody.setActivationState(4);

        this.physicsWorld.addRigidBody(rocketBody);

        const launchSpeed = 150;
        const rocketVel = new Ammo.btVector3(forward.x * launchSpeed, forward.y * launchSpeed, forward.z * launchSpeed);
        rocketBody.setLinearVelocity(rocketVel);

        this.rockets.push({ mesh: rocketMesh, body: rocketBody });
        const userIndex = ++this.lastUserIndex;
        rocketBody.setUserIndex(userIndex);
        this.rigidBodyDataMap.set(userIndex, { isRocket: true, threeMesh: rocketMesh });
    }

    updateRockets() {
        const transform = new Ammo.btTransform();
        for (let i = 0; i < this.rockets.length; i++) {
            const { mesh, body } = this.rockets[i];
            const collidedEnemies = this.enemyManager.checkCollisionsWithRocket(mesh.position);
            if (collidedEnemies.length > 0) {
                const userIndex = this.rigidBodyDataMap.get(body.getUserIndex());
                userIndex.toRemove = true;
                collidedEnemies.forEach((enemy) => {
                    this.enemyManager.removeEnemy(enemy);
                });
            }
            const ms = body.getMotionState();
            if (ms) {
                ms.getWorldTransform(transform);
                const p = transform.getOrigin();
                const q = transform.getRotation();
                mesh.position.set(p.x(), p.y(), p.z());
                mesh.quaternion.set(q.x(), q.y(), q.z(), q.w());
            }
        }
    }

    checkCollisions() {
        const dispatcher = this.physicsWorld.getDispatcher();
        const numManifolds = dispatcher.getNumManifolds();

        for (let i = 0; i < numManifolds; i++) {
            const contactManifold = dispatcher.getManifoldByIndexInternal(i);

            const body0 = contactManifold.getBody0();
            const body1 = contactManifold.getBody1();

            const index0 = body0.getUserIndex();
            const index1 = body1.getUserIndex();

            const userData0 = this.rigidBodyDataMap.get(index0);
            const userData1 = this.rigidBodyDataMap.get(index1);

            const isRocket0 = userData0?.isRocket === true;
            const isRocket1 = userData1?.isRocket === true;

            if (!isRocket0 && !isRocket1) continue;

            const numContacts = contactManifold.getNumContacts();
            for (let j = 0; j < numContacts; j++) {
                const pt = contactManifold.getContactPoint(j);

                if (pt.getDistance() < 0.0) {
                    const contactPointWorld = pt.get_m_positionWorldOnA();

                    if (isRocket0) {
                        body0.toRemove = true;
                        userData0.toRemove = true;
                        this.triggerExplosion(contactPointWorld);
                    }
                    if (isRocket1) {
                        body1.toRemove = true;
                        userData1.toRemove = true;
                        this.triggerExplosion(contactPointWorld);
                    }
                    break;
                }
            }
        }
    }

    triggerExplosion(contactPointWorld) {
        const exX = contactPointWorld.x();
        const exY = contactPointWorld.y();
        const exZ = contactPointWorld.z();

        const dx = this.player.position.x - exX;
        const dy = this.player.position.y - exY;
        const dz = this.player.position.z - exZ;

        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (distance < this.explosionRadius) {
            const factor = (this.explosionRadius - distance) / this.explosionRadius;
            const nx = dx / distance;
            const ny = dy / distance;
            const nz = dz / distance;

            const force = this.explosionForce * factor;
            const impulse = new Ammo.btVector3(nx * force, ny * force, nz * force);

            this.player.playerBody.activate(true);
            this.player.playerBody.applyCentralImpulse(impulse);

            Ammo.destroy(impulse);
        }
    }

    cleanupRockets() {
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const { mesh, body } = this.rockets[i];

            const ms = body.getMotionState();
            if (ms) {
                const transform = new Ammo.btTransform();
                ms.getWorldTransform(transform);
                const p = transform.getOrigin();
                const yPos = p.y();
                if (yPos < -50) {
                    body.toRemove = true;
                }
            }

            const userData = this.rigidBodyDataMap.get(body.getUserIndex());

            if (body.toRemove === true || (userData && userData.toRemove === true)) {
                this.physicsWorld.removeRigidBody(body);
                this.scene.remove(mesh);
                this.rockets.splice(i, 1);
                this.rigidBodyDataMap.delete(body.getUserIndex());
            }
        }
    }
}
