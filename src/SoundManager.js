import * as THREE from 'three';

export class SoundManager {
    constructor(camera, assetsPath = 'assets/sounds/') {
        this.camera = camera;
        this.assetsPath = assetsPath;

        this.listener = new THREE.AudioListener();
        this.camera.add(this.listener);

        this.audioLoader = new THREE.AudioLoader();

        this.sounds = {};            
        this.positionalSounds = {};  
        this.music = null;          

        this.soundFiles = {
            // Sonidos no posicionales
            walk: 'boot1.wav',
            jump: 'jump1.wav',
            shoot: 'hyprbf1a.wav',
            taunt: "taunt.wav",
            // Sonidos posicionales
            flyRocketBuffer: 'rockfly.wav',
            humBuffer: 'rg_hum.wav',
        };
    }

    loadAllSounds(onLoadComplete = () => { }) {
        const promises = [];

        // Cargar cada archivo
        for (const key in this.soundFiles) {
            const fileName = this.soundFiles[key];
            const isPositional = (key === 'flyRocketBuffer' || key === 'humBuffer');

            const promise = new Promise((resolve, reject) => {
                this.audioLoader.load(
                    this.assetsPath + fileName,
                    (buffer) => {
                        if (isPositional) {
                            const sound = new THREE.PositionalAudio(this.listener);
                            sound.setBuffer(buffer);
                            sound.setRefDistance(20);
                            this.positionalSounds[key] = buffer;
                        } else {
                            const sound = new THREE.Audio(this.listener);
                            sound.setBuffer(buffer);
                            this.sounds[key] = sound;
                        }
                        resolve();
                    },
                    undefined,
                    (err) => reject(err)
                );
            });

            promises.push(promise);
        }

        Promise.all(promises).then(() => {
            onLoadComplete();
        }).catch((err) => {
            console.error('Error cargando sonidos:', err);
        });
    }

    loadAndPlayMusic(fileName, volume = 0.5, loop = true) {
        this.audioLoader.load(
            this.assetsPath + fileName,
            (buffer) => {
                this.music = new THREE.Audio(this.listener);
                this.music.setBuffer(buffer);
                this.music.setLoop(loop);
                this.music.setVolume(volume);
                this.music.play();
            },
            undefined,
            (err) => console.error('Error cargando música:', err)
        );
    }

    playSound(key, volume = 1, loop = false) {
        const sound = this.sounds[key];
        if (!sound) {
            console.warn(`No se encontró el sonido no posicional con key: ${key}`);
            return;
        }
        sound.setVolume(volume);
        if(sound.isPlaying){
            sound.stop();
        }
        sound.setLoop(loop);
        sound.play();
    }

    stopSound(key) {
        const sound = this.sounds[key];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    playPositionalSound(key, position, volume = 1, loop = false) {
        const sound = this.positionalSounds[key];
        if (!sound) {
            console.warn(`No se encontró el sonido posicional con key: ${key}`);
            return;
        }
        if (!sound.parent) {
            const soundObject = new THREE.Object3D();
            soundObject.add(sound);
            this.scene.add(soundObject);
        }
        sound.setVolume(volume);
        sound.setLoop(loop);

        sound.position.copy(position);
        sound.play();
    }

    stopPositionalSound(key) {
        const sound = this.positionalSounds[key];
        if (sound && sound.isPlaying) {
            sound.stop();
        }
    }

    stopMusic() {
        if (this.music && this.music.isPlaying) {
            this.music.stop();
        }
    }
}
