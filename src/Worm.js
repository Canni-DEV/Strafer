import * as THREE from 'three';

export class Worm {
    constructor(scene, player, spawnPosition, segments = 6, speed = 5) {
        this.scene = scene;
        this.player = player;
        this.speed = speed;
        this.segments = [];
        for (let i = 0; i < segments; i++) {
            const mesh = new THREE.Mesh(
                new THREE.SphereGeometry(0.6, 8, 8),
                new THREE.MeshStandardMaterial({ color: 0xaa5522 })
            );
            mesh.position.copy(spawnPosition).add(new THREE.Vector3(0, 0, -i));
            this.scene.add(mesh);
            this.segments.push(mesh);
        }
        this.mesh = this.segments[0];
        this.timeOffset = Math.random() * Math.PI * 2;
    }

    update(delta, elapsedTime) {
        const head = this.segments[0];
        const dir = this.player.position.clone().sub(head.position).normalize();
        head.position.add(dir.multiplyScalar(this.speed * delta));
        head.position.y = Math.sin(elapsedTime * 2 + this.timeOffset) * 2;
        for (let i = 1; i < this.segments.length; i++) {
            const prev = this.segments[i - 1];
            const seg = this.segments[i];
            const followDir = prev.position.clone().sub(seg.position);
            const dist = followDir.length();
            if (dist > 1) {
                seg.position.add(followDir.normalize().multiplyScalar(this.speed * delta));
            }
        }
        if (head.position.distanceTo(this.player.position) < 1.5) console.log('GAME OVER');
    }

    dispose() {
        this.segments.forEach(s => this.scene.remove(s));
    }
}
