const canvas = document.getElementById('asteroid-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const asteroids = [];
const bullets = [];
const keys = {};
let score = 0;
let fireRate = 200;
let lastShotTime = 0;
let lives = 5;
let isShipHit = false;
let isInvincible = false;
let invincibilityDuration = 3000; // 3 seconds of invincibility

let screenShakeMagnitude = 0;
let screenShakeDuration = 0;
const screenShakeSpeed = 10;
let screenShakeFrameCount = 10;

const explosionFrames = [
    { offsetX: -5, offsetY: -5 },
    { offsetX: 5, offsetY: -5 },
    { offsetX: -5, offsetY: 5 },
    { offsetX: 5, offsetY: 5 },
    { offsetX: -5, offsetY: -5 },
    { offsetX: 5, offsetY: -5 },
    { offsetX: -5, offsetY: 5 },
    { offsetX: 5, offsetY: 5 },
    { offsetX: -5, offsetY: -5 },
    { offsetX: 5, offsetY: -5 },
    { offsetX: -5, offsetY: 5 },
    { offsetX: 5, offsetY: 5 },
];

const explosions = [];

const spaceship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 10,
    angle: Math.PI / 2, // Start with the spaceship facing upward
    velocity: 0,
    acceleration: 0.05,
    rotationSpeed: 0.08, // Increase this value for faster rotation
    friction: 0.99,
};

function updateScreenShake() {
    if (screenShakeDuration > 0) {

        const offsetX = (Math.random() - 0.5) * screenShakeMagnitude;
        const offsetY = (Math.random() - 0.5) * screenShakeMagnitude;

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.save();

        // Translate the canvas context (ctx) to create the screen shake effect
        ctx.translate(offsetX, offsetY);

        screenShakeFrameCount++;
        if (screenShakeFrameCount >= screenShakeSpeed) {
            // Reset the canvas translation after a few frames
            ctx.restore()
            screenShakeFrameCount = 0;
        }

        screenShakeDuration--;

        if (screenShakeDuration === 0) {
            // Ensure the canvas is reset to the original position
            ctx.restore();
        }
    }
}

function createAsteroid() {
    const side = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 (top, right, bottom, left)
    let x, y, dx, dy;

    switch (side) {
        case 0: // Top
            x = Math.random() * canvas.width;
            y = -30;
            dx = (Math.random() - 0.5) * 2;
            dy = Math.random() * 3 + 1;
            break;
        case 1: // Right
            x = canvas.width + 30;
            y = Math.random() * canvas.height;
            dx = -(Math.random() * 3 + 1);
            dy = (Math.random() - 0.5) * 2;
            break;
        case 2: // Bottom
            x = Math.random() * canvas.width;
            y = canvas.height + 30;
            dx = (Math.random() - 0.5) * 2;
            dy = -(Math.random() * 3 + 1);
            break;
        case 3: // Left
            x = -30;
            y = Math.random() * canvas.height;
            dx = Math.random() * 3 + 1;
            dy = (Math.random() - 0.5) * 2;
            break;
    }

    const radius = Math.random() * 70 + 10; // Random radius between 10 and 60
    asteroids.push({ x, y, radius, dx, dy });
}

function drawExplosions() {
    for (let i = 0; i < explosions.length; i++) {
        const explosion = explosions[i];
        const frameIndex = Math.floor(explosion.frameIndex);
        
        if (frameIndex < explosion.frames.length) {
            const frame = explosion.frames[frameIndex];
            const x = explosion.x - frame.offsetX;
            const y = explosion.y - frame.offsetY;
            ctx.fillStyle = 'orange'; // Adjust the color as needed
            ctx.fillRect(x, y, 10, 10); // Draw a simple square as an explosion frame
            explosion.frameIndex += 0.5; // Control the speed of the explosion animation
        } else {
            explosions.splice(i, 1);
            i--;
        }
    }
}


function drawSpaceship() {
    if (isInvincible && Math.floor(Date.now() / 500) % 2 === 0) {
        ctx.strokeStyle = 'red';
    } else {
        ctx.strokeStyle = 'yellowgreen';
    }
    ctx.lineWidth = 2;
    ctx.save();
    ctx.translate(spaceship.x, spaceship.y);
    ctx.rotate(spaceship.angle);
    ctx.beginPath();
    ctx.moveTo(0, -spaceship.radius);
    ctx.lineTo(spaceship.radius, spaceship.radius);
    ctx.lineTo(-spaceship.radius, spaceship.radius);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

function moveSpaceship() {

    spaceship.x += spaceship.velocity * Math.cos(spaceship.angle - Math.PI / 2);
    spaceship.y += spaceship.velocity * Math.sin(spaceship.angle - Math.PI / 2);

    if (spaceship.x < 0) {
        spaceship.x = canvas.width;
    } else if (spaceship.x > canvas.width) {
        spaceship.x = 0;
    }
    if (spaceship.y < 0) {
        spaceship.y = canvas.height;
    } else if (spaceship.y > canvas.height) {
        spaceship.y = 0;
    }
}

function drawBullets() {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;

    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// Modify the createBullet function to set the bullet's starting position correctly
function createBullet() {
    const currentTime = Date.now();

    const timeSinceLastShot = currentTime - lastShotTime;

    if (timeSinceLastShot >= fireRate) {
        lastShotTime = currentTime;
        
        const bulletStartX = spaceship.x + (spaceship.radius * 1.5) * Math.cos(spaceship.angle - Math.PI / 2);
        const bulletStartY = spaceship.y + (spaceship.radius * 1.5) * Math.sin(spaceship.angle - Math.PI / 2);

        const bullet = {
            x: bulletStartX,
            y: bulletStartY,
            radius: 3,
            angle: spaceship.angle,
            speed: 10,
        };
        bullets.push(bullet);
    }
}

// Modify the moveBullets function to update the bullet positions correctly
function moveBullets() {
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.x += Math.cos(bullet.angle - Math.PI / 2) * bullet.speed;
        bullet.y += Math.sin(bullet.angle - Math.PI / 2) * bullet.speed;

        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            bullets.splice(i, 1);
            i--;
        }
    }
}

function checkCollisions() {
    // Check ship-asteroid collisions
    for (let i = 0; i < asteroids.length; i++) {
        const asteroid = asteroids[i];
        const dx = spaceship.x - asteroid.x;
        const dy = spaceship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < spaceship.radius + asteroid.radius) {
            if (isInvincible){
                return;
            } else {
                lives -= 1;
                if (lives === 0) {
                    alert('Game Over!');
                    location.reload();
                }
                isInvincible = true;

                // Record the collision point
                const collisionX = spaceship.x;
                const collisionY = spaceship.y;

                // Create an explosion effect
                explosions.push({ x: collisionX, y: collisionY, frames: explosionFrames, frameIndex: 0 });

                // Trigger the screen shake effect
                screenShakeMagnitude = 20; // Adjust the magnitude as needed
                screenShakeDuration = 10; // Adjust the duration as needed

                // Remove the colliding asteroid
                asteroids.splice(i, 1);

                setTimeout(() => {
                    isShipHit = false;
                    isInvincible = false;
                }, invincibilityDuration);
            }
        }
    }

    for (let i = 0; i < bullets.length; i++) {
        for (let j = 0; j < asteroids.length; j++) {
            const bullet = bullets[i];
            const asteroid = asteroids[j];

            if (asteroid) {
                if (bullet) {
                    const dx = bullet.x - asteroid.x;
                    const dy = bullet.y - asteroid.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < bullet.radius + asteroid.radius) {
                        bullets.splice(i, 1);
                        asteroids.splice(j, 1);
                        i--;
                        j--;

                        // Adjust the minimum asteroid size for splitting
                        const minAsteroidRadius = 10; // Adjust this value as needed

                        if (asteroid.radius > minAsteroidRadius) {
                            const numSplits = Math.floor(Math.random() * 3) + 2;

                            for (let k = 0; k < numSplits; k++) {
                                const newRadius = asteroid.radius / 2;

                                if (newRadius >= minAsteroidRadius) {
                                    const newDx = Math.random() * 4 - 2;
                                    const newDy = Math.random() * 4 - 2;
                                    asteroids.push({
                                        x: asteroid.x,
                                        y: asteroid.y,
                                        radius: newRadius,
                                        dx: newDx,
                                        dy: newDy,
                                    });
                                }
                            }
                        }

                        score += 10;
                    }
                }
            }
        }
    }
}

let isShooting = false;

function update() {
    if (keys[" "] || keys["Spacebar"]) {
        isShooting = true;

        if (isShooting) {
            createBullet();
        }
    }
    if (keys["ArrowLeft"]) {
        spaceship.angle -= spaceship.rotationSpeed;
    }
    if (keys["ArrowRight"]) {
        spaceship.angle += spaceship.rotationSpeed;
    }
    if (keys["ArrowUp"]) {
        // Apply acceleration when "ArrowUp" is pressed
        spaceship.velocity += spaceship.acceleration;
    } else {
        spaceship.velocity *= spaceship.friction;
    }

    moveSpaceship();
    moveBullets();
    checkCollisions();
    updateScreenShake();

    requestAnimationFrame(update);
}

// Add keydown and keyup event listeners
document.addEventListener('keydown', (event) => {
    keys[event.key] = true;
    
    if (event.key === ' ') {
        isShooting = true;
        createBullet();
    }
});

document.addEventListener('keyup', (event) => {
    keys[event.key] = false;

    if (event.key === ' ') {
        isShooting = false;
    }
});

function updateAsteroid(asteroid) {
    asteroid.x += asteroid.dx;
    asteroid.y += asteroid.dy;

    if (asteroid.x - asteroid.radius > canvas.width || asteroid.x + asteroid.radius < 0 ||
        asteroid.y - asteroid.radius > canvas.height || asteroid.y + asteroid.radius < 0) {
        return true; // Indicates the asteroid is out of the canvas
    }

    return false;
}

function updateAsteroids() {
    for (let i = 0; i < asteroids.length; i++) {
        if (updateAsteroid(asteroids[i])) {
            asteroids.splice(i, 1);
            i--;
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawSpaceship();
    drawBullets();
    drawExplosions();
    updateAsteroids();

    for (let i = 0; i < asteroids.length; i++) {
        const asteroid = asteroids[i];
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, asteroid.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.fillStyle = 'yellowgreen';
    ctx.font = "24px Arial";
    ctx.fillText(' Score: ' + score, 20, 20);
    ctx.fillText(' Ships: ', 20, 50);

    // Define a different fill style for the number of lives
    ctx.fillStyle = 'red'; // Change the color to your desired color

    // Draw the number of lives
    ctx.fillText(lives, 20 + ctx.measureText(' Ships: ').width, 50);

    ctx.fillStyle = 'rgba(144, 238, 144, 0.3)'; // Yellowgreen with opacity
    ctx.font = "36px 'Baloo', cursive"; // Larger font size
    ctx.fillText('{ /ejahdev }', canvas.width - 200, canvas.height - 20); // Bottom right corner

}

setInterval(createAsteroid, 1000);
requestAnimationFrame(update);
setInterval(draw, 1000 / 60);
