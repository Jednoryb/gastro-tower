const SETTINGS = {
    floatingJoystick: true,
    devMode: true,
    showHitboxes: false,
    showStats: false
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

// 2. SCENA TRYBU STORY
class Story extends Phaser.Scene {
    constructor() { super('Story'); }

    preload() {
        this.load.spritesheet('player', 'assets/player_anim.png', { frameWidth: 120, frameHeight: 120 });
    }

    create() {
        this.highestFloor = 0;
        this.targetFloor = 40; 
        this.gameWon = false;
        this.isDead = false;

        setupBackgroundLayers(this);
        this.platforms = this.physics.add.staticGroup();
        this.uiCamera.ignore(this.platforms); // UI Camera nie rysuje platform

        let floorRect = this.add.rectangle(180, 480, 360, 20, 0x2ecc71);
        this.platforms.add(floorRect);
        
        for (let i = 1; i <= this.targetFloor; i++) {
            let width = Phaser.Math.Between(80, 160);
            let x = Phaser.Math.Between(width / 2, 360 - (width / 2));
            let y = 480 - (i * 120);

            let plat = this.add.rectangle(x, y, width, 20, 0xf1c40f);
            this.platforms.add(plat);
            plat.body.checkCollision.down = false;
            plat.body.checkCollision.left = false;
            plat.body.checkCollision.right = false;

            if (i === this.targetFloor) {
                plat.fillColor = 0x9b59b6; 
                let winText = this.add.text(x, y - 40, 'GDAŃSKA 19!', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);
                this.uiCamera.ignore(winText);
            }
        }

        setupPlayerAndPhysics(this);
        
        this.scoreText = this.add.text(20, 20, 'Piętro: 0 / ' + this.targetFloor, { fontSize: '20px', fill: '#ffffff' }).setScrollFactor(0);
        this.uiCamera.ignore(this.scoreText); // UI Camera nie dubluje napisu
    }

    update() {
        if (this.gameWon) return;
        handlePlayerMovement(this);
        updateCameraAndScores(this, false); 
    }
}

// 3. SCENA TRYBU NIESKOŃCZONEGO
class Endless extends Phaser.Scene {
    constructor() { super('Endless'); }

    preload() {
        this.load.spritesheet('player', 'assets/player_anim.png', { frameWidth: 120, frameHeight: 120 });
    }

    create() {
        this.highestFloor = 0;
        this.nextPlatformY = 480 - 120; 
        this.isDead = false;

        setupBackgroundLayers(this);
        this.platforms = this.physics.add.staticGroup();
        this.uiCamera.ignore(this.platforms);

        let floorRect = this.add.rectangle(180, 480, 360, 20, 0x2ecc71);
        this.platforms.add(floorRect);

        for (let i = 1; i < 10; i++) {
            this.generatePlatform();
        }

        setupPlayerAndPhysics(this);
        
        this.scoreText = this.add.text(20, 20, 'Piętro: 0', { fontSize: '24px', fill: '#ffffff' }).setScrollFactor(0);
        this.uiCamera.ignore(this.scoreText);
    }

    update() {
        handlePlayerMovement(this);
        updateCameraAndScores(this, true); 

        if (this.cameras.main.scrollY < this.nextPlatformY + 500) {
            this.generatePlatform();
        }
    }

    generatePlatform() {
        let width = Phaser.Math.Between(80, 160);
        let x = Phaser.Math.Between(width / 2, 360 - (width / 2));
        
        let plat = this.add.rectangle(x, this.nextPlatformY, width, 20, 0xe67e22);
        this.platforms.add(plat);
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;

        this.nextPlatformY -= 120; 
    }
}

// --- WARSTWY TŁA I KAMERY (PRAWIDŁOWY SPLIT) ---
function setupBackgroundLayers(scene) {
    // 1. Główna kamera jest sztywno ucięta na 500 pikselach wysokości
    scene.cameras.main.setViewport(0, 0, 360, 500);

    // 2. Tworzymy dedykowaną UI Kamerę dla obszaru Y 500-640
    scene.uiCamera = scene.cameras.add(0, 500, 360, 140);
    scene.uiCamera.scrollY = 500; // Mapowanie współrzędnych świata na ten wycinek
    scene.uiCamera.setBackgroundColor('#181818');

    // Elementy widoczne TYLKO dla kamery gry (ignorowane przez UI Kamerę)
    scene.bgFar = scene.add.rectangle(180, 250, 360, 500, 0x1a252f).setScrollFactor(0);
    scene.wallLeft = scene.add.rectangle(10, 250, 20, 500, 0x2c3e50).setScrollFactor(0);
    scene.wallRight = scene.add.rectangle(350, 250, 20, 500, 0x2c3e50).setScrollFactor(0);
    scene.uiCamera.ignore([scene.bgFar, scene.wallLeft, scene.wallRight]);

    // Elementy UI - znajdują się na Y > 500, więc główna kamera obcięta na 500px i tak ich nie zobaczy
    scene.consoleBezel = scene.add.rectangle(180, 502, 360, 4, 0x555555);
}

// --- FUNKCJE FIZYKI I GRACZA ---
function setupPlayerAndPhysics(scene) {
    scene.physics.world.setBounds(0, -2000000, 360, 2000000 + 500);
    scene.cameras.main.setBounds(0, -2000000, 360, 2000000 + 500);

    if (scene.textures.exists('player')) {
        scene.player = scene.physics.add.sprite(180, 400, 'player');
        
        scene.player.setDisplaySize(80, 80); 
        scene.player.body.setSize(50, 70); 
        scene.player.body.setOffset(35, 50);
        
        if (!scene.anims.exists('idle')) {
            scene.anims.create({ key: 'idle', frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
            scene.anims.create({ key: 'prepare', frames: scene.anims.generateFrameNumbers('player', { start: 2, end: 3 }), frameRate: 10, repeat: 0 });
            scene.anims.create({ key: 'run', frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 6 }), frameRate: 12, repeat: -1 });
            scene.anims.create({ key: 'jump', frames: scene.anims.generateFrameNumbers('player', { start: 7, end: 8 }), frameRate: 8, repeat: -1 });
            scene.anims.create({ key: 'fall', frames: [{ key: 'player', frame: 9 }], frameRate: 1, repeat: 0 });
        }
        scene.player.play('idle'); 
    } else {
        let playerRect = scene.add.rectangle(180, 400, 32, 32, 0xe74c3c);
        scene.player = scene.physics.add.existing(playerRect);
    }
    
    // UI Kamera całkowicie ignoruje postać - nie widać jej gdy spada!
    scene.uiCamera.ignore(scene.player);

    scene.player.body.setBounce(1, 0); 
    scene.player.body.setCollideWorldBounds(true);
    scene.player.body.setMaxVelocity(600, 1200); 
    scene.player.body.setDragX(1000); 

    scene.physics.add.collider(scene.player, scene.platforms);
    scene.cursors = scene.input.keyboard.createCursorKeys();
    
    scene.mobileKeys = { joyX: 0, up: false };
    createMobileControls(scene);

    if (SETTINGS.devMode) {
        let devContainer = scene.add.container(config.width - 150, 40).setScrollFactor(0).setDepth(100);
        let menuBg = scene.add.rectangle(0, 0, 140, 110, 0x000000, 0.8).setOrigin(0, 0);
        devContainer.add(menuBg);
        
        let title = scene.add.text(5, 5, '🛠 DEV MENU', { fontSize: '14px', fill: '#f1c40f', fontStyle: 'bold' });
        devContainer.add(title);

        let btnToggle = scene.add.text(config.width - 35, 10, '⚙️', { fontSize: '24px' }).setScrollFactor(0).setInteractive().setDepth(101);
        devContainer.setVisible(false);
        btnToggle.on('pointerdown', () => devContainer.setVisible(!devContainer.visible));

        const getHitboxText = () => SETTINGS.showHitboxes ? '[X] Hitboxy' : '[ ] Hitboxy';
        let btnHitboxes = scene.add.text(5, 30, getHitboxText(), { fontSize: '12px', fill: '#fff' }).setInteractive();
        btnHitboxes.on('pointerdown', () => {
            SETTINGS.showHitboxes = !SETTINGS.showHitboxes;
            btnHitboxes.setText(getHitboxText());
            
            if (SETTINGS.showHitboxes) {
                if (!scene.physics.world.debugGraphic) scene.physics.world.createDebugGraphic();
                scene.physics.world.drawDebug = true;
                scene.uiCamera.ignore(scene.physics.world.debugGraphic); // Hitboxy znikają z panelu UI
            } else {
                scene.physics.world.drawDebug = false;
                if (scene.physics.world.debugGraphic) scene.physics.world.debugGraphic.clear();
            }
        });
        devContainer.add(btnHitboxes);

        const getStatsText = () => SETTINGS.showStats ? '[X] Telemetria' : '[ ] Telemetria';
        let btnStats = scene.add.text(5, 55, getStatsText(), { fontSize: '12px', fill: '#fff' }).setInteractive();
        btnStats.on('pointerdown', () => {
            SETTINGS.showStats = !SETTINGS.showStats;
            btnStats.setText(getStatsText());
        });
        devContainer.add(btnStats);

        let btnDevUp = scene.add.text(5, 80, '🚀 +10 PIĘTER', { fontSize: '12px', fill: '#fff', backgroundColor: '#c0392b', padding: 4 }).setInteractive();
        btnDevUp.on('pointerdown', () => {
            scene.player.y -= 1200; 
            scene.player.body.setVelocityY(-400); 
            scene.cameras.main.scrollY = scene.player.y - 250; 
        });
        devContainer.add(btnDevUp);

        scene.devStatsText = scene.add.text(10, 50, '', { fontSize: '12px', fill: '#00ff00', backgroundColor: '#000000aa', padding: 5 }).setScrollFactor(0).setDepth(99);
        scene.devStatsText.setVisible(SETTINGS.showStats);
        
        if (SETTINGS.showHitboxes) {
            scene.physics.world.createDebugGraphic();
            scene.physics.world.drawDebug = true;
            scene.uiCamera.ignore(scene.physics.world.debugGraphic);
        }

        scene.uiCamera.ignore([devContainer, btnToggle, scene.devStatsText]);
    }
}

function createMobileControls(scene) {
    // Wersja PC - czysty tekst zamiast przycisków
    if (scene.sys.game.device.os.desktop) {
        scene.add.text(180, 570, 'STEROWANIE PC\n[ ◄ ] [ ► ] - Ruch\n[ ▲ ] - Skok', {
            fontSize: '16px', fill: '#666', align: 'center', fontStyle: 'bold'
        }).setOrigin(0.5);
        return;
    }

    scene.input.addPointer(2);
    let isFloating = SETTINGS.floatingJoystick !== false;

    // Przycisk skoku (Używamy współrzędnych świata)
    let btnJump = scene.add.circle(300, 570, 40, 0xffffff, 0.3).setInteractive();
    let txtJump = scene.add.text(300, 570, 'UP', { fontSize: '20px', fill: '#000', fontStyle: 'bold' }).setOrigin(0.5);

    btnJump.on('pointerdown', () => scene.mobileKeys.up = true);
    btnJump.on('pointerup', () => scene.mobileKeys.up = false);
    btnJump.on('pointerout', () => scene.mobileKeys.up = false);

    // Wirtualny Joystick 
    let startBaseX = 80;  
    let currentBaseX = startBaseX; 
    let joyBaseY = 570;
    let maxDist = 40; 

    let joyBase = scene.add.circle(currentBaseX, joyBaseY, 50, 0xffffff, 0.2);
    let joyThumb = scene.add.circle(currentBaseX, joyBaseY, 25, 0xffffff, 0.5).setInteractive();
    
    scene.input.setDraggable(joyThumb);

    scene.input.on('drag', function (pointer, gameObject) {
        if (gameObject !== joyThumb) return;
        
        if (isFloating) {
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
    if (scene.isDead) return; 

    let moving = false;
    let isJumpPressed = scene.cursors.up.isDown || scene.mobileKeys.up;

    if (scene.cursors.left.isDown || scene.mobileKeys.joyX < -0.2) {
        scene.player.body.setAccelerationX(-1500);
        if (scene.player.setFlipX) scene.player.setFlipX(true);
        moving = true;
    } else if (scene.cursors.right.isDown || scene.mobileKeys.joyX > 0.2) {
        scene.player.body.setAccelerationX(1500);
        if (scene.player.setFlipX) scene.player.setFlipX(false);
        moving = true;
    } else {
        scene.player.body.setAccelerationX(0);
    }

    if (isJumpPressed && scene.player.body.touching.down) {
        let speedX = Math.abs(scene.player.body.velocity.x);
        let jumpPower = -750 - (speedX * 0.6); 
        scene.player.body.setVelocityY(jumpPower);
    }

    if (!isJumpPressed && scene.player.body.velocity.y < 0) {
        scene.player.body.setVelocityY(scene.player.body.velocity.y * 0.9); 
    }

    if (scene.textures.exists('player')) {
        let currentAnim = scene.player.anims.currentAnim?.key;

        if (!scene.player.body.touching.down) {
            if (currentAnim !== 'jump') scene.player.play('jump');
        } else if (moving) {
            if (currentAnim === 'idle') {
                scene.player.play('prepare');
            } else if (currentAnim === 'prepare' && scene.player.anims.getProgress() === 1) {
                scene.player.play('run');
            } else if (currentAnim !== 'prepare' && currentAnim !== 'run') {
                scene.player.play('run'); 
            }
        } else {
            if (currentAnim !== 'idle') {
                scene.player.play('idle');
            }
        }
    }
}

function updateCameraAndScores(scene, isEndless) {
    if (scene.isDead) return;

    let currentFloor = Math.max(0, Math.floor((480 - scene.player.y) / 120));
    
    if (currentFloor > scene.highestFloor) {
        scene.highestFloor = currentFloor;
        if (isEndless) {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor);
        } else {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor + ' / ' + scene.targetFloor);
            
            if (scene.highestFloor >= scene.targetFloor && !scene.gameWon) {
                scene.gameWon = true;
                let winText = scene.add.text(180, scene.cameras.main.scrollY + 250, 'WYGRANA!\nWitamy na Gdańskiej 19', { fontSize: '28px', fill: '#2ecc71', align: 'center', backgroundColor: '#000' }).setOrigin(0.5);
                scene.uiCamera.ignore(winText);
                setTimeout(() => scene.scene.start('Menu'), 3000); 
            }
        }
    }

    let targetCameraY = scene.player.y - 250;
    if (targetCameraY < scene.cameras.main.scrollY) {
        scene.cameras.main.scrollY = targetCameraY;
    }

    // Warunek porażki z animacją na środku ekranu!
    if (scene.player.y > scene.cameras.main.scrollY + 500 + 32) {
        scene.isDead = true; 
        
        scene.player.body.checkCollision.none = true;
        scene.player.body.setCollideWorldBounds(false);
        
        if (scene.textures.exists('player')) scene.player.play('fall');

        scene.player.body.setVelocityY(-1200);
        scene.player.body.setAccelerationX(0);
        scene.player.body.setVelocityX(0);

        setTimeout(() => {
            scene.cameras.main.scrollY = 0; 
            scene.scene.start('Menu');
        }, 2000); 
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