export class PhysicsWorld {
    constructor() {
        this.collisionConfiguration = null;
        this.dispatcher = null;
        this.overlappingPairCache = null;
        this.solver = null;
        this.physicsWorld = null;
    }

    init(gravity = 26) {
        // Configuración estándar para Ammo.js
        this.collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(this.collisionConfiguration);
        this.overlappingPairCache = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.dispatcher,
            this.overlappingPairCache,
            this.solver,
            this.collisionConfiguration
        );
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -gravity, 0));
    }

    stepSimulation(delta, maxSubSteps = 5) {
        if (!this.physicsWorld) return;
        this.physicsWorld.stepSimulation(delta, maxSubSteps);
    }

    addRigidBody(body) {
        if (!this.physicsWorld) return;
        this.physicsWorld.addRigidBody(body);
    }

    removeRigidBody(body) {
        if (!this.physicsWorld) return;
        this.physicsWorld.removeRigidBody(body);
    }

    getWorld() {
        return this.physicsWorld;
    }

    getDispatcher() {
        return this.dispatcher;
    }

    // Si necesitas funciones adicionales, como detección de colisiones personalizadas,
    // o mapeo de cuerpos a datos externos, puedes agregarlas aquí.
}
