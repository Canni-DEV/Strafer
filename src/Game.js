import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { PhysicsWorld } from './PhysicsWorld.js';
import { GameRenderer } from './GameRenderer.js';
import { Player } from './Player.js';
import { RocketManager } from './RocketManager.js';
import { MapBuilder } from './MapBuilder.js';
import { InputHandler } from './InputHandler.js';
import { UI } from './UI.js';
import { EnemyManager } from './EnemyManager.js';
import { SoundManager } from './SoundManager.js';
import { ItemManager } from './ItemManager.js';


export class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        this.physicsWorld = null;
        this.player = null;
        this.rocketManager = null;
        this.mapBuilder = null;
        this.inputHandler = null;
        this.ui = null;

        this.enemyManager = null;

        this.lastTime = performance.now();
        this.elapsedTime = 0;
        this.playing = false;
        this.firstFrame = true;
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000417);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.rotateY(Math.PI / 2);
        const container = document.getElementById("game_container");
        this.gameRenderer = new GameRenderer(this.scene, this.camera, container);

        this.controls = new PointerLockControls(this.camera, container);
        document.addEventListener('click', () => {
            if(!this.playing){
                let animatedElement = document.querySelector('.banner h1');
                animatedElement.classList.add('animate-text');
                animatedElement.addEventListener("animationend", () => {
                    animatedElement.remove();
                    document.querySelector(".banner canvas").style.mixBlendMode = "normal";
                });
                document.getElementById("crosshair").style.visibility = "visible";
                this.start();
            }
            this.controls.lock();
        });

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        this.inputHandler = new InputHandler();
        this.inputHandler.init();

        const playerConfig = {
            position: new THREE.Vector3(0, 128, 0),
            gravity: 26,
            jumpForce: 12,
            friction: 6,
            airControl: 1,
            groundSettings: { MaxSpeed: 7, Acceleration: 14, Deceleration: 10 },
            airSettings: { MaxSpeed: 7, Acceleration: 2, Deceleration: 2 },
            strafeSettings: { MaxSpeed: 1, Acceleration: 50, Deceleration: 50 },
        };

        this.physicsWorld = new PhysicsWorld();
        this.physicsWorld.init(playerConfig.gravity);

        this.soundManager = new SoundManager(this.camera);
        this.soundManager.loadAllSounds(() => {
        });

        this.mapBuilder = new MapBuilder(this.scene, this.physicsWorld);
        this.mapBuilder.createMap();

        this.player = new Player(this.physicsWorld, this.camera, playerConfig, this.soundManager);    

        this.enemyManager = new EnemyManager(this.scene, this.player, this.soundManager, this.mapBuilder);

        this.rocketManager = new RocketManager(this.scene, this.physicsWorld, this.inputHandler, this.player, this.enemyManager, this.soundManager);
        const positions = [
            new THREE.Vector3(60, 5, 0),
            new THREE.Vector3(-65, 35, 0),
            new THREE.Vector3(65, 60, 0),
            new THREE.Vector3(-65, 100, 0),
            new THREE.Vector3(65, 120, 0),
            new THREE.Vector3(-178, 4, 0),
            new THREE.Vector3(178, 4, 0),
        ];
        this.itemManager = new ItemManager(this.scene, this.player, this.soundManager, positions);
     
        this.ui = new UI();
        this.ui.init();  
        this.animate();   
    }

    start() {
        this.playing = true;
    }

    animate() {
        const time = performance.now();
        const delta = (time - this.lastTime) / 1000;
        this.lastTime = time;
        this.elapsedTime += delta;      
        if(this.playing || this.firstFrame){
            this.physicsWorld.stepSimulation(delta);
            this.player.update(delta, this.inputHandler);
            this.rocketManager.update(delta);
            this.enemyManager.update(delta, this.elapsedTime);
            this.itemManager.update(delta);
            this.ui.updateStats();
            this.firstFrame = false;
        }       
        this.gameRenderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}
