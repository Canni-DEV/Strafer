import * as THREE from 'three';

export class Item {
    constructor(scene, position, model, {
        soundManager = null,
        humKey = 'itemHum',
        pickupKey = 'itemPickup',
        moveAmplitude = 0.5,
        moveSpeed = 1
    } = {}) {
        this.scene = scene;
        this.position = position.clone();
        this.moveAmplitude = moveAmplitude;
        this.moveSpeed = moveSpeed;
        this.startY = position.y;

        this.object3D = new THREE.Group();
        this.object3D.position.copy(this.position);

        this.model = model.clone();
        this.object3D.add(this.model);

        this.boundingRadius = 3.0; 
        this.scene.add(this.object3D);

        this.soundManager = soundManager;
        this.humKey = humKey;
        this.pickupKey = pickupKey;
        this.humSound = null;

        if (this.soundManager) {
            this.humSound = new THREE.PositionalAudio(this.soundManager.listener);
            this.humSound.setBuffer(this.soundManager.positionalSounds[this.humKey]);
            this.humSound.setRefDistance(5); 
            this.humSound.setLoop(true);
            this.humSound.setVolume(0.5);       
            this.object3D.add(this.humSound);
            this.humSound.play();               
        }

        this.isCollected = false; 
    }

    update(delta, playerPosition) {
        if (this.isCollected) return;

        const time = performance.now() * 0.001 * this.moveSpeed;
        const offsetY = Math.sin(time) * this.moveAmplitude;
        this.object3D.position.y = this.startY + offsetY;

        const dist = playerPosition.distanceTo(this.object3D.position);
        if (dist < this.boundingRadius) {
            this._onPickup();
        }
    }

    _onPickup() {
        this.isCollected = true;

        if (this.soundManager) {
            this.soundManager.playSound(this.pickupKey, 0.2, false);
        }

        if (this.humSound && this.humSound.isPlaying) {
            this.humSound.stop();
        }

        this.scene.remove(this.object3D);
    }

    dispose() {
        if (!this.isCollected) {
            this.scene.remove(this.object3D);
        }
        if (this.humSound && this.humSound.isPlaying) {
            this.humSound.stop();
        }
    }
}
