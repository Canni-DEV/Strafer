import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

export class EnemyManager {
    constructor(scene, player,soundManager, mapBuilder) {
        this.scene = scene;
        this.player = player;

        this.enemies = [];
        this.spawnInterval = 5;
        this.lastSpawnTime = 0;
        this.maxEnemies = 1;

        this.enemySpeed = 10;
        this.enemyTurnSpeed = 2;
        this.enemiesKilled = 1;
        this.level = 1;
        this.soundManager = soundManager;
        this.mapBuilder = mapBuilder;
       
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
        if (elapsedTime - this.lastSpawnTime > this.spawnInterval && this.enemies.length < this.maxEnemies) {
            if (this.enemiesKilled % 5 == 0 && this.level != this.enemiesKilled) {
                this.level = this.enemiesKilled;
                if (this.spawnInterval > 1)
                    this.spawnInterval--;
                if (this.maxEnemies < 100)
                    this.maxEnemies++;
                if (this.enemiesKilled % 10 == 0) {
                    if (this.enemySpeed < 20)
                        this.enemySpeed++;
                    if (this.enemyTurnSpeed < 5)
                        this.enemyTurnSpeed += 0.2;
                }
            }
            this.spawnEnemy();
            this.lastSpawnTime = elapsedTime;
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(delta);
            if (enemy.mesh.position.y < -1) {
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

    spawnEnemy() {
        const spawnPosition = new THREE.Vector3(
            Math.random() * 150 - 75,
            150,
            Math.random() * 150 - 75
        );
        const newEnemy = new Enemy(
            this.scene,
            this.player,
            spawnPosition,
            this.enemySpeed,
            this.enemyTurnSpeed,
            this.enemies,
            [],//this.mapBuilder.platforms,
            this.soundManager.listener,
            this.soundManager.positionalSounds['humBuffer'],
            this.skullMesh.clone()
        );
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
        this.enemiesKilled++;
    }

    clearEnemies() {
        for (const enemy of this.enemies) {
            enemy.dispose();
        }
        this.enemies = [];
    }
}
