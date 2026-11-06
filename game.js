const config = {
    type: Phaser.AUTO,
    width: 360,
    height: 640,
    backgroundColor: '#3498db',
    scale: {
        mode: Phaser.Scale.FIT, // Gra dopasuje się do ekranu telefonu
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 }, // Siła przyciągania w dół
            debug: false // Zmień na true, aby widzieć ramki kolizji (hitboxy)
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

function preload() {
    // Tutaj będziemy ładować obrazki przed startem gry
}

function create() {
    // Tutaj będziemy dodawać obiekty na ekran (platformy, postać)
    this.add.text(20, 20, 'Gdańska 19 czeka!', { fontSize: '20px', fill: '#ffffff' });
}

function update() {
    // Ta funkcja wykonuje się 60 razy na sekundę (pętla gry)
    // Tu zrobimy obsługę ruchu i skoków
}