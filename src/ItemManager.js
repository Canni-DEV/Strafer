import * as THREE from 'three';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { Item } from './Item.js';

export class ItemManager {
    constructor(scene, player, soundManager, positions) {
        this.scene = scene;
        this.player = player;
        this.soundManager = soundManager;

        this.items = [];
        this.itemPositions = []; 
        this.model = null;       
        this.loaded = false;

        this.setItemPositions(positions);

        this.loadItemModel().then((obj) => {
            this.model = obj;
            this.loaded = true;
            this.spawnItems();
        });
    }

    async loadItemModel() {
        const OBJFile = './assets/item/eyeball.obj'; 
        const MTLFile = './assets/item/eyeball.mtl';
        const JPGFile = './assets/item/textures/Eye_D.jpg';

        const loader = new MTLLoader();
        const obj = await new Promise((resolve, reject) => {
            loader.load(MTLFile, function (materials) {
                materials.preload();
                new OBJLoader()
                    .setMaterials(materials)
                    .load(
                        OBJFile,
                        function (object) {
                            const texture = new THREE.TextureLoader().load(JPGFile);
                            object.traverse(function (child) {
                                if (child instanceof THREE.Mesh) {
                                    child.material.map = texture;
                                    child.scale.set(1, 1, 1);
                                }
                            });
                            resolve(object);
                        },
                        undefined,
                        (error) => reject(error)
                    );
            }, undefined, (err) => reject(err));
        });
        return obj;
    }

    setItemPositions(positions) {
        this.itemPositions = positions;
    }

    spawnItems() {
        if (!this.loaded || !this.model) {
            console.warn('Item model not loaded yet!');
            return;
        }
        for (const pos of this.itemPositions) {
            const itemModel = this.model.clone();
            const item = new Item(this.scene, pos, itemModel, {
                soundManager: this.soundManager,
                humKey: 'hum', 
                pickupKey: 'taunt',
                moveAmplitude: 0.5,
                moveSpeed: 1
            });
            this.items.push(item);
        }
    }

    update(delta) {
        const playerPos = this.player.position.clone();
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.update(delta, playerPos);
            if (item.isCollected) {
                this.items.splice(i, 1);
            }
        }
    }

    clearItems() {
        for (const item of this.items) {
            item.dispose();
        }
        this.items = [];
    }
}
