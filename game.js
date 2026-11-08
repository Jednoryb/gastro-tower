const SETTINGS = {
    floatingJoystick: true,
    devMode: true, // Wymusza działanie narzędzi Dev Menu
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

// 2. SCENA TRYBU STORY (Meta na szczycie Gdańska 19)
class Story extends Phaser.Scene {
    constructor() { super('Story'); }

    preload() {
        this.load.spritesheet('player', 'assets/player_anim.png', { frameWidth: 120, frameHeight: 120 });
    }

    create() {
        this.highestFloor = 0;
        this.isDead = false;
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
        
        // Włączenie rysowania hitboxów na żądanie (Tryb Dev)
        if (SETTINGS.showHitboxes) {
            this.physics.world.createDebugGraphic();
        }

        setupComboSystem(this);
 
    }

    update(time, delta) {
        if (this.gameWon || this.isDead) return;
        handlePlayerMovement(this);
        updateCameraAndScores(this, false); 
        handleCombo(this, delta); // NOWOŚĆ
        if (typeof updateTelemetry === 'function') updateTelemetry(this);
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
        this.isDead = false;
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

        // Włączenie rysowania hitboxów na żądanie (Tryb Dev)
        if (SETTINGS.showHitboxes) {
            this.physics.world.createDebugGraphic();
        }

        setupComboSystem(this);
    }

    update(time, delta) {
        if (this.isDead) return;
        handlePlayerMovement(this);
        updateCameraAndScores(this, true); 
        
        while (this.cameras.main.scrollY < this.nextPlatformY + 640) {
            this.generatePlatform();
        }
        
        handleCombo(this, delta); // NOWOŚĆ
        if (typeof updateTelemetry === 'function') updateTelemetry(this);
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

    if (scene.textures.exists('player')) {
        scene.player = scene.physics.add.sprite(180, 500, 'player');
        
        // Dopasowanie wizualne i naprawa hitboxa
        scene.player.setDisplaySize(80, 80); 
        scene.player.body.setSize(50, 70); 
        scene.player.body.setOffset(35, 50);
        
        // --- PEŁNA INICJALIZACJA ANIMACJI ---
        if (!scene.anims.exists('idle')) {
            scene.anims.create({
                key: 'idle',
                frames: scene.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
                frameRate: 4,
                repeat: -1 
            });
        }
        if (!scene.anims.exists('prepare')) {
            scene.anims.create({
                key: 'prepare',
                frames: scene.anims.generateFrameNumbers('player', { start: 2, end: 3 }), 
                frameRate: 10,
                repeat: 0 
            });
        }
        if (!scene.anims.exists('run')) {
            scene.anims.create({
                key: 'run',
                frames: scene.anims.generateFrameNumbers('player', { start: 4, end: 6 }), 
                frameRate: 12,
                repeat: -1
            });
        }
        if (!scene.anims.exists('jump')) {
            scene.anims.create({
                key: 'jump',
                frames: scene.anims.generateFrameNumbers('player', { start: 7, end: 8 }), 
                frameRate: 8,
                repeat: -1
            });
        }
        if (!scene.anims.exists('fall')) {
            scene.anims.create({
                key: 'fall',
                frames: [{ key: 'player', frame: 9 }], 
                frameRate: 1,
                repeat: 0
            });
        }

        scene.player.play('idle'); 
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

    // --- ROZWIJANE MENU DEWELOPERSKIE ---
    if (SETTINGS.devMode) {
        // Kontener menu
        let devContainer = scene.add.container(config.width - 150, 40).setScrollFactor(0).setDepth(100);
        let menuBg = scene.add.rectangle(0, 0, 140, 110, 0x000000, 0.8).setOrigin(0, 0);
        devContainer.add(menuBg);
        
        let title = scene.add.text(5, 5, '🛠 DEV MENU', { fontSize: '14px', fill: '#f1c40f', fontStyle: 'bold' });
        devContainer.add(title);

        // Przycisk koła zębatego
        let btnToggle = scene.add.text(config.width - 35, 10, '⚙️', { fontSize: '24px' }).setScrollFactor(0).setInteractive().setDepth(101);
        devContainer.setVisible(false);
        
        btnToggle.on('pointerdown', () => {
            devContainer.setVisible(!devContainer.visible);
        });

        const getHitboxText = () => SETTINGS.showHitboxes ? '[X] Hitboxy' : '[ ] Hitboxy';
        let btnHitboxes = scene.add.text(5, 30, getHitboxText(), { fontSize: '12px', fill: '#fff' }).setInteractive();
        btnHitboxes.on('pointerdown', () => {
            SETTINGS.showHitboxes = !SETTINGS.showHitboxes;
            btnHitboxes.setText(getHitboxText());
            
            if (SETTINGS.showHitboxes) {
                if (!scene.physics.world.debugGraphic) scene.physics.world.createDebugGraphic();
                scene.physics.world.drawDebug = true;
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
            scene.cameras.main.scrollY = scene.player.y - config.height / 2; 
        });
        devContainer.add(btnDevUp);

        scene.devStatsText = scene.add.text(10, 50, '', { fontSize: '12px', fill: '#00ff00', backgroundColor: '#000000aa', padding: 5 }).setScrollFactor(0).setDepth(99);
        scene.devStatsText.setVisible(SETTINGS.showStats);
        
        if (SETTINGS.showHitboxes) {
            scene.physics.world.createDebugGraphic();
            scene.physics.world.drawDebug = true;
        }
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
    if (scene.isDead) return; 

    let moving = false;
    let isJumpPressed = scene.cursors.up.isDown || scene.mobileKeys.up;

    // 1. Ruch na boki
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

    // 2. INICJACJA SKOKU (zależna od pędu)
    if (isJumpPressed && scene.player.body.touching.down) {
        // Pobieramy absolutną prędkość poziomą (od 0 do max 600)
        let speedX = Math.abs(scene.player.body.velocity.x);
        
        // Baza to -750 (zwykły skok z miejsca na 1-2 piętra). 
        // Dodajemy bonus za rozpęd (np. przy max prędkości 600 * 0.6 = +360 siły).
        // Max siła skoku wyniesie wtedy ok. -1110.
        let jumpPower = -750 - (speedX * 0.6); 
        
        scene.player.body.setVelocityY(jumpPower);
    }

    // 3. KONTROLA WYSOKOŚCI SKOKU (Variable Jump)
    // Jeśli gracz leci w górę (Y < 0), ale puścił już przycisk/ekran, płynnie ucinamy pęd
    if (!isJumpPressed && scene.player.body.velocity.y < 0) {
        scene.player.body.setVelocityY(scene.player.body.velocity.y * 0.9); 
    }

    // --- LOGIKA ANIMACJI ---
    if (scene.textures.exists('player')) {
        let currentAnim = scene.player.anims.currentAnim?.key;

        if (!scene.player.body.touching.down) {
            if (currentAnim !== 'jump') scene.player.play('jump');
        } 
        else if (moving) {
            if (currentAnim === 'idle') {
                scene.player.play('prepare');
            } else if (currentAnim === 'prepare' && scene.player.anims.getProgress() === 1) {
                scene.player.play('run');
            } else if (currentAnim !== 'prepare' && currentAnim !== 'run') {
                scene.player.play('run'); 
            }
        } 
        else {
            if (currentAnim !== 'idle') {
                scene.player.play('idle');
            }
        }
    }
    updateTelemetry(scene);
}

function updateCameraAndScores(scene, isEndless) {
    // Jeśli gracz już zginął, nie wykonujemy reszty logiki kamery i punktacji
    if (scene.isDead) return;

    let currentFloor = Math.max(0, Math.floor((630 - scene.player.y) / 120));
    
    if (currentFloor > scene.highestFloor) {
        scene.highestFloor = currentFloor;
        if (isEndless) {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor);
        } else {
            scene.scoreText.setText('Piętro: ' + scene.highestFloor + ' / ' + scene.targetFloor);
            
            // Warunek wygranej w trybie Story
            if (scene.highestFloor >= scene.targetFloor && !scene.gameWon) {
                scene.gameWon = true;
                scene.add.text(180, scene.cameras.main.scrollY + 320, 'WYGRANA!\nWitamy na Gdańskiej 19', { fontSize: '28px', fill: '#2ecc71', align: 'center', backgroundColor: '#000' }).setOrigin(0.5);
                setTimeout(() => scene.scene.start('Menu'), 3000); // Powrót do menu po 3 sekundach
            }
        }
    }

    let targetCameraY = scene.player.y - config.height / 2;
    if (targetCameraY < scene.cameras.main.scrollY) {
        scene.cameras.main.scrollY = targetCameraY;
    }

    // Warunek przegranej
    if (scene.player.y > scene.cameras.main.scrollY + config.height + 32) {
        scene.isDead = true; 
        
        scene.player.body.checkCollision.none = true;
        scene.player.body.setCollideWorldBounds(false);
        
        // Zmiana animacji na rozklapaną klatkę nr 10
        if (scene.textures.exists('player')) {
            scene.player.play('fall');
        }

        scene.player.body.setVelocityY(-1200);
        scene.player.body.setAccelerationX(0);
        scene.player.body.setVelocityX(0);

        setTimeout(() => {
            scene.cameras.main.scrollY = 0; 
            scene.scene.start('Menu');
        }, 2000); 
    }
}

function updateTelemetry(scene) {
    if (!SETTINGS.devMode || !scene.devStatsText) return;
    
    if (!SETTINGS.showStats) {
        scene.devStatsText.setVisible(false);
        return;
    }
    
    scene.devStatsText.setVisible(true);

    let currentSpeedX = Math.abs(scene.player.body.velocity.x).toFixed(0);

    // Rejestrowanie wysokości bieżącego skoku
    if (!scene.player.body.touching.down && scene.player.body.velocity.y < 0) {
        if (scene.player.jumpStartY === undefined) {
            scene.player.jumpStartY = scene.player.y;
            scene.player.jumpStartXSpeed = currentSpeedX;
        }
        scene.player.currentJumpHeight = scene.player.jumpStartY - scene.player.y;
    } else if (scene.player.body.touching.down) {
        scene.player.jumpStartY = undefined; 
    }

    let lastHeight = (scene.player.currentJumpHeight || 0).toFixed(0);
    let lastSpeed = (scene.player.jumpStartXSpeed || 0);

    scene.devStatsText.setText(
        `PREDKOSC X: ${currentSpeedX} / 600 px/s\n` +
        `OSTATNI SKOK: ${lastHeight} px\n` +
        `(Pęd przy wybiciu: ${lastSpeed})`
    );
}

// --- SYSTEM COMBO ---

function setupComboSystem(scene) {
    scene.comboCount = 0;
    scene.comboTimer = 0;
    scene.maxComboTime = 2000; // 2 sekundy na kontynuację combo
    scene.lastLandedFloor = 0;
    scene.player.wasTouchingDown = true;
    
    // Tekst wyświetlający aktualne combo na środku ekranu
    scene.comboText = scene.add.text(180, 150, '', {
        fontSize: '36px', fill: '#f1c40f', fontStyle: 'bold', align: 'center', stroke: '#000', strokeThickness: 5
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0).setDepth(100);
}

function handleCombo(scene, delta) {
    // Obliczamy na którym piętrze fizycznie znajduje się gracz
    let currentFloor = Math.max(0, Math.floor((630 - scene.player.y) / 120));

    // Moment lądowania na platformie
    if (scene.player.body.touching.down) {
        if (!scene.player.wasTouchingDown) { // Właśnie wylądował
            let floorsJumped = currentFloor - scene.lastLandedFloor;

            // Inicjacja lub kontynuacja combo (skok o min. 2 piętra)
            if (floorsJumped >= 2) {
                scene.comboCount += floorsJumped;
                scene.comboTimer = scene.maxComboTime;
                
                scene.comboText.setText('COMBO x' + scene.comboCount + '!');
                scene.comboText.setAlpha(1);
                scene.comboText.y = 150;
                
                // Efekt "pop" (powiększenia) przy uderzeniu
                scene.tweens.add({
                    targets: scene.comboText,
                    scale: { from: 1.5, to: 1 },
                    duration: 200,
                    ease: 'Back.easeOut'
                });
            } 
            // Jeśli gracz podskoczył tylko o 1 piętro lub spadł, a miał aktywne combo - kończymy je
            else if ((floorsJumped <= 1) && scene.comboCount > 0) {
                cashInCombo(scene);
            }
            
            scene.lastLandedFloor = currentFloor;
        }
    }
    scene.player.wasTouchingDown = scene.player.body.touching.down;

    // Odliczanie czasu combo
    if (scene.comboCount > 0) {
        scene.comboTimer -= delta;
        
        // Cieniowanie tekstu pokazujące uciekający czas
        scene.comboText.setAlpha(scene.comboTimer / scene.maxComboTime);
        
        if (scene.comboTimer <= 0) {
            cashInCombo(scene);
        }
    }
}

function cashInCombo(scene) {
    if (scene.comboCount > 0) {
        // Punktacja rodem z Icy Tower (kwadrat ilości pięter)
        let points = scene.comboCount * scene.comboCount; 
        
        scene.comboText.setText('+' + points + ' PKT!');
        scene.comboText.setAlpha(1);
        
        // Animacja unoszącego się i znikającego napisu z punktami
        scene.tweens.add({
            targets: scene.comboText,
            y: scene.comboText.y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power1'
        });
        
        // Docelowo tutaj dodasz zmienną globalnego wyniku: scene.score += points
        scene.comboCount = 0;
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