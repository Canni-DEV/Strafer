import * as THREE from 'three';
import { Skull } from './Skull.js';
import { Spider } from './Spider.js';
import { Worm } from './Worm.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class EnemyManager {
    constructor(scene, player,soundManager, mapBuilder) {
        this.scene = scene;
        this.player = player;

        this.enemies = [];
        this.enemySpeed = 10;
        this.enemyTurnSpeed = 2;
        this.soundManager = soundManager;
        this.mapBuilder = mapBuilder;

        this.spawnTimeline = [
            { time: 1, type: 'Skull', count: 1 },
            { time: 5, type: 'Skull', count: 2 },
            { time: 10, type: 'Skull', count: 10 },
            { time: 30, type: 'Spider', count: 5 },
            { time: 45, type: 'Worm', count: 2 }
        ];
        this.nextSpawnIndex = 0;
       
        this.loadSkullMesh().then((obj) => {
            this.skullMesh = obj;
        });
    }

    async loadSkullMesh() {
        var OBJFile = './assets/skull/skull.obj';
        var MTLFile = './assets/skull/skull.mtl';
        var JPGFile = './assets/skull/skull.jpg';
        const loader = new MTLLoader();
        const obj = await new Promise((resolve, reject) => {
            loader.load(MTLFile, function (materials) {
                materials.preload();
                new OBJLoader()
                    .setMaterials(materials)
                    .load(OBJFile, function (object) {
                        var texture = new THREE.TextureLoader().load(JPGFile);
                        object.traverse(function (child) {  
                            if (child instanceof THREE.Mesh) {
                                child.material.map = texture;
                                child.scale.set(0.075,0.075,0.075);
                                child.position.set(0,0,-1);
                            }
                        });
                        resolve(object);
                    });
            });
        });
        return obj;
    }

    update(delta, elapsedTime) {
        while (this.nextSpawnIndex < this.spawnTimeline.length && elapsedTime >= this.spawnTimeline[this.nextSpawnIndex].time) {
            const evt = this.spawnTimeline[this.nextSpawnIndex];
            for (let i = 0; i < evt.count; i++) {
                this.spawnEnemy(evt.type);
            }
            this.nextSpawnIndex++;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (enemy.update.length === 2) {
                enemy.update(delta, elapsedTime);
            } else {
                enemy.update(delta);
            }
            if (enemy.mesh && enemy.mesh.position && enemy.mesh.position.y < -1) {
                this.removeEnemyIndex(i);
            }
        }
    }

    checkCollisionsWithRocket(rocketPosition) {
        const collidedEnemies = [];
        this.enemies.forEach((enemy) => {
            const distance = enemy.mesh.position.distanceTo(rocketPosition);
            if (distance < 1.5) {
                collidedEnemies.push(enemy);
            }
        });
        return collidedEnemies;
    }

    spawnEnemy(type = 'Skull') {
        const spawnPosition = new THREE.Vector3(
            Math.random() * 100 - 50,
            type === 'Spider' ? 2 : 150,
            Math.random() * 100 - 50
        );
        let newEnemy;
        if (type === 'Spider') {
            newEnemy = new Spider(this.scene, this.player, spawnPosition, this.enemySpeed * 1.5);
        } else if (type === 'Worm') {
            newEnemy = new Worm(this.scene, this.player, spawnPosition, 6, this.enemySpeed * 0.8);
        } else {
            newEnemy = new Skull(
                this.scene,
                this.player,
                spawnPosition,
                this.enemySpeed,
                this.enemyTurnSpeed,
                this.enemies,
                [],
                this.soundManager.listener,
                this.soundManager.positionalSounds['humBuffer'],
                this.skullMesh.clone()
            );
        }
        this.enemies.push(newEnemy);
    }

    removeEnemyIndex(index) {
        const enemy = this.enemies[index];
        enemy.dispose();
        this.enemies.splice(index, 1);
    }

    removeEnemy(enemy) {
        this.enemies = this.enemies.filter((e) => e !== enemy);
        enemy.dispose();
    }

    clearEnemies() {
        for (const enemy of this.enemies) {
            enemy.dispose();
        }
        this.enemies = [];
    }
}
