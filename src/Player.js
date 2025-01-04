import * as THREE from 'three';

export class Player {
    constructor(physicsWorld, camera, config, soundManager) {
        this.physicsWorld = physicsWorld;
        this.camera = camera;
        this.soundManager = soundManager;
        this.position = (config.position || new THREE.Vector3(0, 2, 0)).clone();
        this.gravity = config.gravity || 26;
        this.jumpForce = config.jumpForce || 12;
        this.friction = config.friction || 6;
        this.airControl = config.airControl || 0;

        this.groundSettings = config.groundSettings || { MaxSpeed: 7, Acceleration: 14, Deceleration: 10 };
        this.airSettings = config.airSettings || { MaxSpeed: 7, Acceleration: 2, Deceleration: 2 };
        this.strafeSettings = config.strafeSettings || { MaxSpeed: 1, Acceleration: 50, Deceleration: 50 };

        this.onGround = false;

        this.radius = 0.5;
        this.height = 1.8;
        this.playerBody = null;

        this.transformAux1 = new Ammo.btTransform();

        this._initBody();
    }

    _initBody() {
        const shape = new Ammo.btCapsuleShape(this.radius, this.height - 2 * this.radius);

        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(this.position.x, this.position.y, this.position.z));

        const motionState = new Ammo.btDefaultMotionState(transform);
        const mass = 10;
        const localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);

        const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
        this.playerBody = new Ammo.btRigidBody(rbInfo);

        this.playerBody.setFriction(0);             // Sin fricción (lo controlamos manualmente)
        this.playerBody.setDamping(0, 0);           // Sin damping
        this.playerBody.setAngularFactor(new Ammo.btVector3(0, 0, 0)); // No rotar físicamente
        this.playerBody.setSleepingThresholds(0, 0);
        // STATE ACTIVE_TAG = 1, DISABLE_DEACTIVATION = 4, etc. 
        // 0 es ACTIVE, según Ammo. 
        this.playerBody.setActivationState(1);

        this.physicsWorld.addRigidBody(this.playerBody);
    }

    update(delta, inputHandler) {
        const ms = this.playerBody.getMotionState();
        if (ms) {
            ms.getWorldTransform(this.transformAux1);
            const p = this.transformAux1.getOrigin();
            this.position.set(p.x(), p.y(), p.z());
        }

        this._checkGround();

        const vel = this.playerBody.getLinearVelocity();

        let newVel;
        if (this.onGround) {
            newVel = this._groundMove(delta, vel, inputHandler);
        } else {
            newVel = this._airMove(delta, vel, inputHandler);
        }

        this.playerBody.setLinearVelocity(newVel);
        this.playerBody.activate(true);

        if (this.position.y < -50) {
            this.repositionPlayer();
        }

        this.camera.position.copy(this.position);
    }

    repositionPlayer(startX = 0, startY = 5, startZ = 0) {
        const transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new Ammo.btVector3(startX, startY, startZ));
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));

        this.playerBody.setWorldTransform(transform);
        this.playerBody.getMotionState().setWorldTransform(transform);

        const zeroVel = new Ammo.btVector3(0, 0, 0);
        this.playerBody.setLinearVelocity(zeroVel);
        this.playerBody.setAngularVelocity(zeroVel);
        this.playerBody.activate(true);

        this.position.set(startX, startY, startZ);
    }

    _checkGround() {
        const rayStart = new Ammo.btVector3(this.position.x, this.position.y, this.position.z);
        const rayEnd = new Ammo.btVector3(this.position.x, this.position.y - 2.0, this.position.z);
        const callback = new Ammo.ClosestRayResultCallback(rayStart, rayEnd);

        this.physicsWorld.getWorld().rayTest(rayStart, rayEnd, callback);

        if (callback.hasHit()) {
            const hitPoint = callback.get_m_hitPointWorld();
            const distance = this.position.y - hitPoint.y();
            this.onGround = (distance < 1.5);
        } else {
            this.onGround = false;
        }

        Ammo.destroy(rayStart);
        Ammo.destroy(rayEnd);
        Ammo.destroy(callback);
    }

    _applyFriction(t, delta, vxz) {
        const speed = vxz.length();
        let drop = 0.0;

        if (this.onGround) {
            const control = Math.min(speed, this.groundSettings.Deceleration);
            drop = control * this.friction * t * delta;
        }
        let newSpeed = speed - drop;
        if (newSpeed < 0) newSpeed = 0;
        if (speed > 0) {
            newSpeed /= speed;
        }
        vxz.multiplyScalar(newSpeed);
    }

    _accelerate(vxz, targetDir, targetSpeed, accel, delta) {
        const currentspeed = vxz.dot(targetDir);
        const addspeed = targetSpeed - currentspeed;
        if (addspeed <= 0) return;

        let accelspeed = accel * delta * targetSpeed;
        if (accelspeed > addspeed) {
            accelspeed = addspeed;
        }

        vxz.x += accelspeed * targetDir.x;
        vxz.z += accelspeed * targetDir.z;
    }

    _airControl(vxz, vy, targetDir, targetSpeed, delta, moveZ) {
        if (Math.abs(moveZ) < 0.001 || Math.abs(targetSpeed) < 0.001) return;

        const speed = vxz.length();
        vxz.normalize();

        const dot = vxz.dot(targetDir);
        let k = 32;
        k *= this.airControl * dot * dot * delta;

        if (dot > 0) {
            vxz.x = vxz.x * speed + targetDir.x * k;
            vxz.z = vxz.z * speed + targetDir.z * k;
            vxz.normalize();
        }

        vxz.x *= speed;
        vxz.z *= speed;
    }

    _airMove(delta, vel, input) {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, this.camera.up).normalize();

        const moveX = (input.isKeyDown('left') ? -1 : 0) + (input.isKeyDown('right') ? 1 : 0);
        const moveZ = (input.isKeyDown('forward') ? 1 : 0) + (input.isKeyDown('backward') ? -1 : 0);

        const wishVel = new THREE.Vector3(
            moveX * right.x + moveZ * forward.x,
            0,
            moveX * right.z + moveZ * forward.z
        );

        const vxz = new THREE.Vector3(vel.x(), 0, vel.z());
        const wishdir = wishVel.clone().normalize();
        let wishspeed = wishVel.length() * this.airSettings.MaxSpeed;

        let accel = (vxz.dot(wishdir) < 0) ? this.airSettings.Deceleration : this.airSettings.Acceleration;

        if (moveZ === 0 && moveX !== 0) {
            if (wishspeed > this.strafeSettings.MaxSpeed) {
                wishspeed = this.strafeSettings.MaxSpeed;
            }
            accel = this.strafeSettings.Acceleration;
        }

        this._accelerate(vxz, wishdir, wishspeed, accel, delta);

        if (this.airControl > 0) {
            this._airControl(vxz, vel.y(), wishdir, wishspeed, delta, moveZ);
        }

        return new Ammo.btVector3(vxz.x, vel.y(), vxz.z);
    }

    _groundMove(delta, vel, input) {
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, this.camera.up).normalize();

        const moveX = (input.isKeyDown('left') ? -1 : 0) + (input.isKeyDown('right') ? 1 : 0);
        const moveZ = (input.isKeyDown('forward') ? 1 : 0) + (input.isKeyDown('backward') ? -1 : 0);

        const wishVel = new THREE.Vector3(
            moveX * right.x + moveZ * forward.x,
            0,
            moveX * right.z + moveZ * forward.z
        );

        const vxz = new THREE.Vector3(vel.x(), 0, vel.z());

        this._applyFriction(1.0, delta, vxz);

        const wishdir = wishVel.clone().normalize();
        const wishspeed = wishVel.length() * this.groundSettings.MaxSpeed;

        this._accelerate(vxz, wishdir, wishspeed, this.groundSettings.Acceleration, delta);

        let vy = vel.y();

        if (input.isKeyDown('jump') && this.onGround) {
            vy = this.jumpForce;
            this.soundManager.playSound('jump', 0.7, false);
            input.clearJump();
        }

        return new Ammo.btVector3(vxz.x, vy, vxz.z);
    }
}
