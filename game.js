const SETTINGS = {
    floatingJoystick: true,
    devMode: false
};

// 1. SCENA MENU GŁÓWNEGO
class Menu extends Phaser.Scene {
    constructor() { super('Menu'); }

    create() {
        this.add.text(180, 130, 'GASTRO\nMACHINA', { fontSize: '40px', fill: '#ffffff', fontStyle: 'bold', align: 'center' }).setOrigin(0.5);

        let btnStory = this.add.text(180, 260, 'Tryb Story (Koniec na szczycie)', { fontSize: '18px', fill: '#f1c40f', backgroundColor: '#333', padding: 10 }).setOrigin(0.5).setInteractive();
        btnStory.on('pointerdown', () => this.scene.start('Story'));

        let btnEndless = this.add.text(180, 330, 'Neverending Story', { fontSize: '18px', fill: '#e74c3c', backgroundColor: '#333', padding: 10 }).setOrigin(0.5).setInteractive();
        btnEndless.on('pointerdown', () => this.scene.start('Endless'));

        const getCheckboxText = (state) => state ? '[X] Pływający joystick' : '[  ] Pływający joystick';
        let toggleText = this.add.text(180, 420, getCheckboxText(SETTINGS.floatingJoystick), { fontSize: '16px', fill: '#2ecc71', backgroundColor: '#222', padding: 8 }).setOrigin(0.5).setInteractive();
        toggleText.on('pointerdown', () => {
            SETTINGS.floatingJoystick = !SETTINGS.floatingJoystick;
            toggleText.setText(getCheckboxText(SETTINGS.floatingJoystick));
        });

        const getDevText = (state) => state ? '[X] Tryb Deweloperski (Testy)' : '[  ] Tryb Deweloperski (Testy)';
        let devToggle = this.add.text(180, 470, getDevText(SETTINGS.devMode), { fontSize: '16px', fill: '#e67e22', backgroundColor: '#222', padding: 8 }).setOrigin(0.5).setInteractive();
        devToggle.on('pointerdown', () => {
            SETTINGS.devMode = !SETTINGS.devMode;
            devToggle.setText(getDevText(SETTINGS.devMode));
        });
    }
}

// 2. SCENA TRYBU STORY (Meta na szczycie Gdańska 19)
class Story extends Phaser.Scene {
    constructor() { super('Story'); }

    preload() {
        // Ładujemy grafikę Twojego bohatera
        this.load.image('player', 'assets/player.png');
    }

    create() {
        this.highestFloor = 0;
        this.targetFloor = 100; // Np. 100 pięter do szczytu Gdańska 19
        this.gameWon = false;

        setupBackgroundLayers(this);

        this.platforms = this.physics.add.staticGroup();

        // Podłoga startowa
        let floorRect = this.add.rectangle(180, 630, 360, 20, 0x2ecc71);
        this.platforms.add(floorRect);
        
        for (let i = 1; i <= this.targetFloor; i++) {
            let y = 630 - (i * 120);

            // Co 50 pięter pełna platforma od brzegu do brzegu
            if (i % 50 === 0) {
                let fullPlat = this.add.rectangle(180, y, 360, 24, 0x9b59b6);
                this.platforms.add(fullPlat);
                fullPlat.body.checkCollision.down = false;
                fullPlat.body.checkCollision.left = false;
                fullPlat.body.checkCollision.right = false;

                let label = (i === this.targetFloor) ? 'SZCZYT GDAŃSKA 19!' : `PIĘTRO ${i} - NOWA ERA`;
                this.add.text(180, y - 25, label, { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
            } else {
                let width = Phaser.Math.Between(80, 160);
                let x = Phaser.Math.Between(width / 2 + 20, 360 - (width / 2) - 20); // Margines na ściany wieży
                let plat = this.add.rectangle(x, y, width, 20, 0xf1c40f);
                this.platforms.add(plat);
                plat.body.checkCollision.down = false;
                plat.body.checkCollision.left = false;
                plat.body.checkCollision.right = false;
            }
        }

        setupPlayerAndPhysics(this);
        this.scoreText = this.add.text(20, 20, 'Piętro: 0 / ' + this.targetFloor, { fontSize: '20px', fill: '#ffffff' }).setScrollFactor(0);
    }

    update() {
        if (this.gameWon) return;
        handlePlayerMovement(this);
        updateCameraAndScores(this, false); 
        updateParallax(this);
    }
}

// 3. SCENA TRYBU NIESKOŃCZONEGO
class Endless extends Phaser.Scene {
    constructor() { super('Endless'); }

    preload() {
        this.load.image('player', 'assets/player.png');
    }

    create() {
        this.highestFloor = 0;
        this.currentFloorIndex = 0;
        this.nextPlatformY = 630 - 120; 

        setupBackgroundLayers(this);

        this.platforms = this.physics.add.staticGroup();

        let floorRect = this.add.rectangle(180, 630, 360, 20, 0x2ecc71);
        this.platforms.add(floorRect);

        for (let i = 1; i < 12; i++) {
            this.generatePlatform();
        }

        setupPlayerAndPhysics(this);
        this.scoreText = this.add.text(20, 20, 'Piętro: 0', { fontSize: '24px', fill: '#ffffff' }).setScrollFactor(0);
    }

    update() {
        handlePlayerMovement(this);
        updateCameraAndScores(this, true); 

        while (this.cameras.main.scrollY < this.nextPlatformY + 640) {
            this.generatePlatform();
        }

        updateParallax(this);
    }

    generatePlatform() {
        this.currentFloorIndex++;
        let y = this.nextPlatformY;

        // Co 50 pięter pełna platforma od brzegu do brzegu
        if (this.currentFloorIndex % 50 === 0) {
            let fullPlat = this.add.rectangle(180, y, 360, 24, 0x9b59b6);
            this.platforms.add(fullPlat);
            fullPlat.body.checkCollision.down = false;
            fullPlat.body.checkCollision.left = false;
            fullPlat.body.checkCollision.right = false;

            this.add.text(180, y - 25, `PIĘTRO ${this.currentFloorIndex} - NOWA ERA`, { fontSize: '16px', fill: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
        } else {
            let width = Phaser.Math.Between(80, 160);
            let x = Phaser.Math.Between(width / 2 + 20, 360 - (width / 2) - 20);
            let plat = this.add.rectangle(x, y, width, 20, 0xe67e22);
            this.platforms.add(plat);
            plat.body.checkCollision.down = false;
            plat.body.checkCollision.left = false;
            plat.body.checkCollision.right = false;
        }

        this.nextPlatformY -= 120; 
    }
}

// --- WARSTWY TŁA I PARALAKSA ---

function setupBackgroundLayers(scene) {
    // Odległe tło (przesuwa się powoli: factor 0.3)
    // Na razie prosta siatka/kolor pod grafikę docelową
    scene.bgFar = scene.add.rectangle(180, 320, 360, 640, 0x1a252f).setScrollFactor(0);

    // Przednia warstwa: boki wieży (lewa i prawa ściana) podążające z graczem
    scene.wallLeft = scene.add.rectangle(10, 320, 20, 640, 0x2c3e50).setScrollFactor(0);
    scene.wallRight = scene.add.rectangle(350, 320, 20, 640, 0x2c3e50).setScrollFactor(0);
}

function updateParallax(scene) {
    // Gdy podepniemy docelowe tekstury kaflowe (TileSprite), tutaj będziemy sterować ich przesunięciem:
    // np. scene.bgFar.tilePositionY = scene.cameras.main.scrollY * 0.3;
}

// --- FUNKCJE FIZYKI I GRACZA ---

function setupPlayerAndPhysics(scene) {
    scene.physics.world.setBounds(0, -2000000, 360, 2000000 + 640);
    scene.cameras.main.setBounds(0, -2000000, 360, 2000000 + 640);

    // Sprawdzamy czy załadowano grafikę player.png; jeśli nie, tworzymy awaryjny prostokąt
    if (scene.textures.exists('player')) {
        scene.player = scene.physics.add.sprite(180, 500, 'player');
        // Dopasowanie rozmiaru wyświetlania do ok. 40x40 jeśli sprite ma inne wymiary
        scene.player.setDisplaySize(40, 40);
    } else {
        let playerRect = scene.add.rectangle(180, 500, 32, 32, 0xe74c3c);
        scene.player = scene.physics.add.existing(playerRect);
    }
    
    scene.player.body.setBounce(1, 0); 
    scene.player.body.setCollideWorldBounds(true);
    scene.player.body.setMaxVelocity(600, 1200); 
    scene.player.body.setDragX(1000); 

    scene.physics.add.collider(scene.player, scene.platforms);

    scene.cursors = scene.input.keyboard.createCursorKeys();
    scene.mobileKeys = { joyX: 0, up: false };
    createMobileControls(scene);

    if (SETTINGS.devMode) {
        let btnDevUp = scene.add.text(350, 10, '🚀 +10 PIĘTER', { 
            fontSize: '16px', fill: '#ffffff', backgroundColor: '#c0392b', padding: 8, fontStyle: 'bold' 
        }).setOrigin(1, 0).setScrollFactor(0).setInteractive();
        
        btnDevUp.on('pointerdown', () => {
            scene.player.y -= 1200; 
            scene.player.body.setVelocityY(-400); 
            scene.cameras.main.scrollY = scene.player.y - config.height / 2; 
        });
    }
}

function createMobileControls(scene) {
    scene.input.addPointer(2);

    let btnJump = scene.add.circle(300, 570, 40, 0xffffff, 0.3).setScrollFactor(0).setInteractive();
    let txtJump = scene.add.text(300, 570, 'UP', { fontSize: '20px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5).setScrollFactor(0);

    btnJump.on('pointerdown', () => scene.mobileKeys.up = true);
    btnJump.on('pointerup', () => scene.mobileKeys.up = false);
    btnJump.on('pointerout', () => scene.mobileKeys.up = false);

    let startBaseX = 80;  
    let currentBaseX = startBaseX; 
    let joyBaseY = 570;
    let maxDist = 40; 

    let joyBase = scene.add.circle(currentBaseX, joyBaseY, 50, 0xffffff, 0.2).setScrollFactor(0);
    let joyThumb = scene.add.circle(currentBaseX, joyBaseY, 25, 0xffffff, 0.5).setScrollFactor(0).setInteractive();
    
    scene.input.setDraggable(joyThumb);

    scene.input.on('drag', function (pointer, gameObject) {
        if (gameObject !== joyThumb) return;
        
        if (SETTINGS.floatingJoystick) {
            let diffX = pointer.x - currentBaseX;
            if (diffX > maxDist) currentBaseX = pointer.x - maxDist;
            else if (diffX < -maxDist) currentBaseX = pointer.x + maxDist;
            joyBase.x = currentBaseX;
            let deltaX = pointer.x - currentBaseX;
            joyThumb.x = currentBaseX + deltaX;
        } else {
            let deltaX = pointer.x - startBaseX;
            deltaX = Phaser.Math.Clamp(deltaX, -maxDist, maxDist); 
            currentBaseX = startBaseX;
            joyThumb.x = startBaseX + deltaX;
        }

        joyThumb.y = joyBaseY; 
        scene.mobileKeys.joyX = (joyThumb.x - currentBaseX) / maxDist;
    });

    scene.input.on('dragend', function (pointer, gameObject) {
        if (gameObject !== joyThumb) return;
        currentBaseX = startBaseX; 
        joyBase.x = startBaseX;    
        joyThumb.x = startBaseX;   
        joyThumb.y = joyBaseY;
        scene.mobileKeys.joyX = 0;
    });
}

function handlePlayerMovement(scene) {
    if (scene.cursors.left.isDown || scene.mobileKeys.joyX < -0.2) {
        scene.player.body.setAccelerationX(-1500);
        if (scene.player.setFlipX) scene.player.setFlipX(true); // Obrót postaci w lewo
    } else if (scene.cursors.right.isDown || scene.mobileKeys.joyX > 0.2) {
        scene.player.body.setAccelerationX(1500);
        if (scene.player.setFlipX) scene.player.setFlipX(false); // Obrót postaci w prawo
    } else {
        scene.player.body.setAccelerationX(0);
    }

    if ((scene.cursors.up.isDown || scene.mobileKeys.up) && scene.player.body.touching.down) {
        scene.player.body.setVelocityY(-900);
    }
}

function updateCameraAndScores(scene, isEndless) {
    let currentFloor = Math.max(0, Math.floor((630 - scene.player.y) / 120));
    
    if (currentFloor > scene.highestFloor) {
        scene.highestFloor = currentFloor;
        if (isEndless) {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor);
        } else {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor + ' / ' + scene.targetFloor);
            
            if (scene.highestFloor >= scene.targetFloor && !scene.gameWon) {
                scene.gameWon = true;
                scene.add.text(180, scene.cameras.main.scrollY + 320, 'WYGRANA!\nWitamy na Gdańskiej 19', { fontSize: '28px', fill: '#2ecc71', align: 'center', backgroundColor: '#000' }).setOrigin(0.5);
                setTimeout(() => scene.scene.start('Menu'), 3000); 
            }
        }
    }

    let targetCameraY = scene.player.y - config.height / 2;
    if (targetCameraY < scene.cameras.main.scrollY) {
        scene.cameras.main.scrollY = targetCameraY;
    }

    if (scene.player.y > scene.cameras.main.scrollY + config.height + 32) {
        scene.cameras.main.scrollY = 0; 
        scene.scene.start('Menu'); 
    }
}

const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    backgroundColor: '#111111',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1600 },
            debug: false 
        }
    },
    scene: [Menu, Story, Endless] 
};

const game = new Phaser.Game(config);