import * as THREE from 'three';

export class Enemy {
    constructor(scene, player, spawnPosition, enemySpeed = 5, turnSpeed = 1, enemies = [], platforms = [], audioListener = null, flyBuffer = null, meshSkull = null) {
        this.scene = scene;
        this.player = player;
        this.enemies = enemies;
        this.platforms = platforms;
        this.enemySpeed = enemySpeed;
        this.turnSpeed = turnSpeed;
        this.position = new THREE.Vector3().copy(spawnPosition);

        this.lastDirection = new THREE.Vector3(0, 0, 0);
        this.randomSeed = Math.random() * 10000;
        this.avoidDir = Math.random() < 0.5 ? -1 : 1;
        this.geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
        this.mesh = new THREE.Object3D();
        this.geometry.computeBoundingBox();
        this.mesh.position.copy(this.position);
        meshSkull.setRotationFromAxisAngle( new THREE.Vector3(1, 0, 0), -Math.PI/2);
        if (audioListener && flyBuffer) {
            this.flySound = new THREE.PositionalAudio(audioListener);
            this.flySound.setBuffer(flyBuffer);
            this.flySound.setRefDistance(5); 
            this.flySound.setLoop(true);
            this.flySound.setVolume(0.6);       
            this.mesh.add(this.flySound);
            this.flySound.play();               
        }
        this.mesh.add(meshSkull);
        scene.add(this.mesh);
    }

    update(delta) {
        const enemyPos = this.mesh.position.clone();
        const playerPos = this.player.position.clone();

        const directionToPlayer = playerPos.clone().sub(enemyPos).normalize();
        const distance = playerPos.distanceTo(enemyPos);
        if (distance < 1.5) {
            console.log("GAME OVER");
        }

        const randomOffset = this.getRandomOffset(delta, distance);
        let targetDirection = directionToPlayer.clone().add(randomOffset).normalize();

        const currentDir = this.lastDirection.clone();
        let newDir = currentDir.lerp(targetDirection, this.turnSpeed * delta).normalize();
        const minY = Math.max(2.6, playerPos.y);
        const dirY = playerPos.y - enemyPos.y;

        const clampedDist = THREE.MathUtils.clamp(distance, 10, 20);
        const targetY = THREE.MathUtils.mapLinear(clampedDist, 10, 20, minY, minY + 5);
        const adjustedY = THREE.MathUtils.lerp(enemyPos.y, targetY, 0.01);

        let avoidanceVector = new THREE.Vector3();
        const avoidanceRadius = 2; 
        for (const other of this.enemies) {
            if (other === this) continue;
            const diff = this.mesh.position.clone().sub(other.mesh.position);
            const dist = diff.length();
            if (dist < avoidanceRadius) {
                diff.normalize();
                const force = (avoidanceRadius - dist) * (dirY < 0 ? 0.01 : 1);
                avoidanceVector.add(diff.multiplyScalar(force));
            }
        }

        if (avoidanceVector.length() > 0.1) {
            avoidanceVector.normalize();
            newDir = newDir.clone().lerp(avoidanceVector, 0.3).normalize();
        }

        const moveSpeed = this.enemySpeed * delta;
        const proposedPos = enemyPos.clone();
        proposedPos.x += newDir.x * moveSpeed;
        proposedPos.z += newDir.z * moveSpeed;
        proposedPos.y = adjustedY;

        if (this.checkCollisions(proposedPos)) {
            const sideDir = new THREE.Vector3(newDir.z, 0, -newDir.x); 
            proposedPos.x = enemyPos.x + this.avoidDir * sideDir.x * moveSpeed * 0.8;
            proposedPos.z = enemyPos.z + this.avoidDir * sideDir.z * moveSpeed * 0.8;
            if (this.checkCollisions(proposedPos)) {
                proposedPos.x = enemyPos.x - this.avoidDir * sideDir.x * moveSpeed * 0.8;
                proposedPos.z = enemyPos.z - this.avoidDir * sideDir.z * moveSpeed * 0.8;
            }
        }

        this.mesh.position.copy(proposedPos);

        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), newDir);
        this.mesh.setRotationFromQuaternion(quaternion);
        this.lastDirection.copy(newDir);
    }

    checkCollisions(pos) {
        const originalPos = this.mesh.position.clone();
        this.mesh.position.copy(pos);
        const bbox = this.geometry.boundingBox.clone();
        bbox.applyMatrix4(this.mesh.matrixWorld);

        for (const other of this.enemies) {
            if (other === this) continue;
            const otherBox = other.geometry.boundingBox.clone().applyMatrix4(other.mesh.matrixWorld);
            if (bbox.intersectsBox(otherBox)) {
                this.mesh.position.copy(originalPos);
                return true;
            }
        }

        for (const plat of this.platforms) {
            plat.geometry.computeBoundingBox();
            const platBox = plat.geometry.boundingBox.clone().applyMatrix4(plat.matrixWorld);
            if (bbox.intersectsBox(platBox)) {
                this.mesh.position.copy(originalPos);
                return true;
            }
        }

        this.mesh.position.copy(originalPos);
        return false;
    }

    getRandomOffset(delta, distance) {
        const noiseScale = Math.min(Math.max(distance * 100, 60), 350);
        const time = performance.now() * 0.0001 + (Math.random() * 10000);
        const offsetX = Math.sin(time) * 1.5;
        const offsetZ = Math.cos(time * 1.3) * 1.5;
        return new THREE.Vector3(offsetX, 0, offsetZ).multiplyScalar(noiseScale * delta);
    }

    dispose() {
        if (this.flySound && this.flySound.isPlaying) {
            this.flySound.stop();
        }
        this.scene.remove(this.mesh);
    }
}
