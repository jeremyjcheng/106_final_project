const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let raindrops = [];
let isRaining = true;
let intensityLevel = 1; // 0: light, 1: medium, 2: heavy
const intensities = [100, 200, 350];

class Raindrop {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height - canvas.height;
        this.length = Math.random() * 20 + 10;
        this.angle = 15; 
        this.speed = Math.random() * 3 + 4;
        this.opacity = Math.random() * 0.3 + 0.3;
    }
    
    fall() {
        this.y += this.speed;
        this.x += Math.sin(this.angle * Math.PI / 180) * this.speed;

        if (this.y > canvas.height) {
            this.y = -this.length;
            this.x = Math.random() * canvas.width;
        }
    }
    
    draw() {
        ctx.beginPath();
        const dx = Math.sin(this.angle * Math.PI / 180) * this.length;
        const dy = Math.cos(this.angle * Math.PI / 180) * this.length;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + dx, this.y + dy);
        ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
    }
}

function initRain() {
    raindrops = [];
    const dropCount = intensities[intensityLevel];
    for (let i = 0; i < dropCount; i++) {
        raindrops.push(new Raindrop());
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (isRaining) {
        raindrops.forEach(drop => {
            drop.fall();
            drop.draw();
        });
    }
    
    requestAnimationFrame(animate);
}

function updateRainVisibility() {
    const titleSlide = document.querySelector('.title-slide');
    const canvas = document.getElementById('rainCanvas');
    
    if (titleSlide && titleSlide.classList.contains('active')) {
        canvas.style.display = 'block';
    } else {
        canvas.style.display = 'none';
    }
}

// Check on page load
updateRainVisibility();

// Listen for slide changes
const observer = new MutationObserver(() => {
    updateRainVisibility();
});

// Observe all slides for class changes
document.querySelectorAll('.slide').forEach(slide => {
    observer.observe(slide, { attributes: true, attributeFilter: ['class'] });
});
function toggleRain() {
    isRaining = !isRaining;
}

function changeIntensity() {
    intensityLevel = (intensityLevel + 1) % 3;
    initRain();
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initRain();
});

initRain();
animate();
