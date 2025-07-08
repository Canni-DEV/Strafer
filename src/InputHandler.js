export class InputHandler {
    constructor() {
        this.actions = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };

        this.shootHeld = false;
        this.shootPressTime = 0;
        this.justReleased = false;
        this.lastClickDuration = 0;

        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._onMouseDown = this._onMouseDown.bind(this);
        this._onMouseUp = this._onMouseUp.bind(this);
    }

    init() {
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);
        window.addEventListener('mousedown', this._onMouseDown);
        window.addEventListener('mouseup', this._onMouseUp);
    }

    _onKeyDown(event) {
        switch (event.code) {
            case 'KeyW':
                this.actions.forward = true;
                break;
            case 'KeyS':
                this.actions.backward = true;
                break;
            case 'KeyA':
                this.actions.left = true;
                break;
            case 'KeyD':
                this.actions.right = true;
                break;
            case 'Space':
                this.actions.jump = true;
                break;
        }
    }

    _onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
                this.actions.forward = false;
                break;
            case 'KeyS':
                this.actions.backward = false;
                break;
            case 'KeyA':
                this.actions.left = false;
                break;
            case 'KeyD':
                this.actions.right = false;
                break;
            case 'Space':
                this.actions.jump = false;
                break;
        }
    }

    _onMouseDown(event) {
        // 0 = left click, 1 = middle, 2 = right click
        if (event.button === 0) {
            this.shootHeld = true;
            this.shootPressTime = performance.now();
            this.justReleased = false;
        }
        if (event.button === 2) {
            this.actions.jump = true;
        }
    }

    _onMouseUp(event) {
        if (event.button === 0) {
            this.shootHeld = false;
            this.lastClickDuration = performance.now() - this.shootPressTime;
            this.justReleased = true;
        }
        if (event.button === 2) {
            this.actions.jump = false;
        }
    }

    isKeyDown(action) {
        return !!this.actions[action];
    }


    clearJump() {
        this.actions.jump = false;
    }

    clearShoot() {
        this.shootHeld = false;
        this.justReleased = false;
    }

    isShootHeld() {
        return this.shootHeld;
    }

    consumeShootRelease() {
        if (this.justReleased) {
            this.justReleased = false;
            return this.lastClickDuration;
        }
        return null;
    }
}
