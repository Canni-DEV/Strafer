import Stats from 'three/addons/libs/stats.module.js';

export class UI {
    constructor() {
        this.stats = null;
        this.crosshairElement = null;
        this.speedElement = null;
        this.timeElement = null;
    }

    init() {
        this.stats = new Stats();
        this.stats.showPanel(0);
        this.stats.dom.id = 'stats';
        //document.body.appendChild(this.stats.dom);

        this.crosshairElement = document.getElementById('crosshair');
        this.speedElement = document.getElementById('speed');
        this.timeElement = document.getElementById('time');
    }

    updateStats() {
        if (this.stats) {
            this.stats.update();
        }
    }

    showCrosshair(show = true) {
        if (this.crosshairElement) {
            this.crosshairElement.style.display = show ? 'block' : 'none';
        }
    }

    showSpeed(show = true) {
        if (this.speedElement) {
            this.speedElement.style.display = show ? 'block' : 'none';
        }
    }

    showTime(show = true) {
        if (this.timeElement) {
            this.timeElement.style.display = show ? 'block' : 'none';
        }
    }
}
