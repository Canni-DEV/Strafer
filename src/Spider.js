import * as THREE from 'three';

export class Spider {
    constructor(scene, player, spawnPosition, speed = 12) {
        this.scene = scene;
        this.player = player;
        this.speed = speed;
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        this.mesh.position.copy(spawnPosition);
        this.scene.add(this.mesh);
    }

    update(delta) {
        const dir = this.player.position.clone().sub(this.mesh.position);
        dir.y = 0;
        const distance = dir.length();
        if (distance < 1.5) console.log('GAME OVER');
        if (distance > 0.001) dir.normalize();
        this.mesh.position.add(dir.multiplyScalar(this.speed * delta));
    }

    dispose() {
        this.scene.remove(this.mesh);
    }
}
