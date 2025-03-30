// Game Configuration
const config = {
    weather: 'clear',
    difficulty: 'easy',
    witchInterval: 60000, // 1 minute
    difficulties: {
        easy: { 
            spawnRate: 1000, 
            speed: 1, 
            penalty: 0.5,
            maxSpeed: 4 
        },
        medium: { 
            spawnRate: 800, 
            speed: 1.5, 
            penalty: 0.75,
            maxSpeed: 5 
        },
        hard: { 
            spawnRate: 600, 
            speed: 2, 
            penalty: 1,
            maxSpeed: 6 
        }
    },
    fruitTypes: [
        { name: 'Apple', points: 10, emoji: '🍎', color: '#FF5252' },
        { name: 'Banana', points: 15, emoji: '🍌', color: '#FFD740' },
        { name: 'Cherry', points: 20, emoji: '🍒', color: '#E91E63' },
        { name: 'Strawberry', points: 25, emoji: '🍓', color: '#FF4081' },
        { name: 'Orange', points: 30, emoji: '🍊', color: '#FF9800' }
    ],
    instructions: [
        "Pop {fruit} Only!",
        "Only Click {fruit}!",
        "Target: {fruit}!"
    ]
};

// Game State
const state = {
    score: 0,
    active: false,
    fruits: [],
    clouds: [],
    targetFruit: null,
    weatherEffects: [],
    isMobile: false,
    spawnInterval: null,
    animationFrame: null,
    witchTimer: null,
    targetChangeInterval: null
};

// DOM Elements
const elements = {
    container: document.getElementById('game-container'),
    ui: document.getElementById('ui-container'),
    score: document.getElementById('score-display'),
    instruction: document.getElementById('instruction-display'),
    screens: {
        start: document.getElementById('start-screen'),
        options: document.getElementById('options-screen')
    },
    buttons: {
        start: document.getElementById('start-button'),
        options: document.getElementById('options-button'),
        saveOptions: document.getElementById('save-options'),
        home: document.getElementById('home-button')
    },
    controls: {
        left: document.getElementById('left-btn'),
        right: document.getElementById('right-btn')
    },
    selects: {
        weather: document.getElementById('weather-select')
    },
    difficultyBtns: document.querySelectorAll('.difficulty-btn'),
    witch: document.getElementById('witch')
};

// Initialize Game
function init() {
    checkMobile();
    setupEventListeners();
}

function checkMobile() {
    state.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (state.isMobile) {
        document.body.classList.add('mobile');
    }
}

function setupEventListeners() {
    // Button Events
    elements.buttons.start.addEventListener('click', startGame);
    elements.buttons.options.addEventListener('click', showOptions);
    elements.buttons.saveOptions.addEventListener('click', saveOptions);
    elements.buttons.home.addEventListener('click', returnToHome);
    
    // Difficulty Buttons
    elements.difficultyBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            elements.difficultyBtns.forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
            config.difficulty = this.dataset.level;
        });
    });
    
    // Mobile Controls
    if (state.isMobile) {
        elements.controls.left.addEventListener('touchstart', (e) => {
            e.preventDefault();
            simulateTap(window.innerWidth * 0.25, window.innerHeight * 0.75);
        });
        
        elements.controls.right.addEventListener('touchstart', (e) => {
            e.preventDefault();
            simulateTap(window.innerWidth * 0.75, window.innerHeight * 0.75);
        });
        
        elements.container.addEventListener('touchstart', handleFruitTap, { passive: false });
    } else {
        elements.container.addEventListener('click', handleFruitClick);
    }
}

// Vibration function
function vibrateDevice() {
    if (state.isMobile && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
    }
}

// Witch Functions
function startWitchTimer() {
    // Clear existing timer if any
    if (state.witchTimer) {
        clearTimeout(state.witchTimer);
    }
    
    // Set new timer
    state.witchTimer = setTimeout(() => {
        animateWitch();
        startWitchTimer(); // Restart the timer
    }, config.witchInterval);
}

function animateWitch() {
    if (!elements.witch || !state.active) return;
    
    // Randomize the flight path
    const startY = 30 + Math.random() * 30;
    const midY = 50 + Math.random() * 30;
    
    // Reset animation
    elements.witch.style.display = 'block';
    elements.witch.style.animation = 'none';
    elements.witch.offsetHeight; // Trigger reflow
    
    // Apply new animation
    elements.witch.style.animation = `flyAcross ${10 + Math.random() * 5}s linear forwards`;
    
    // Hide after animation completes
    setTimeout(() => {
        if (elements.witch) {
            elements.witch.style.display = 'none';
        }
    }, 15000);
}

// Game Functions
function startGame() {
    resetGame();
    elements.screens.start.style.display = 'none';
    elements.screens.options.style.display = 'none';
    state.active = true;
    createClouds();
    createWeatherEffects();
    startWitchTimer();
    startInfiniteGame();
}

function resetGame() {
    state.score = 0;
    updateUI();
    clearAllFruits();
    clearWeatherEffects();
    
    // Clear intervals and animations
    if (state.spawnInterval) {
        clearInterval(state.spawnInterval);
        state.spawnInterval = null;
    }
    if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);
        state.animationFrame = null;
    }
    if (state.witchTimer) {
        clearTimeout(state.witchTimer);
        state.witchTimer = null;
    }
    if (state.targetChangeInterval) {
        clearInterval(state.targetChangeInterval);
        state.targetChangeInterval = null;
    }
    
    // Hide witch
    if (elements.witch) {
        elements.witch.style.display = 'none';
    }
}

function startInfiniteGame() {
    updateUI();
    clearAllFruits();
    
    // Set initial target fruit
    changeTargetFruit();
    
    // Start spawning fruits
    const settings = config.difficulties[config.difficulty];
    state.spawnInterval = setInterval(() => {
        spawnFruit();
    }, settings.spawnRate);
    
    // Change target fruit periodically
    state.targetChangeInterval = setInterval(() => {
        changeTargetFruit();
    }, 10000); // Change every 10 seconds
}

function changeTargetFruit() {
    if (!state.active) return;
    
    state.targetFruit = config.fruitTypes[Math.floor(Math.random() * config.fruitTypes.length)];
    
    // Set instruction
    const randomInstruction = config.instructions[Math.floor(Math.random() * config.instructions.length)];
    elements.instruction.textContent = randomInstruction.replace('{fruit}', state.targetFruit.name);
    
    // Flash the instruction
    elements.instruction.style.transform = 'translateX(-50%) translateZ(50px) scale(1.2)';
    setTimeout(() => {
        elements.instruction.style.transform = 'translateX(-50%) translateZ(50px)';
    }, 300);
}

function returnToHome() {
    resetGame();
    elements.screens.start.style.display = 'flex';
    elements.screens.options.style.display = 'none';
}

function showOptions() {
    elements.screens.start.style.display = 'none';
    elements.screens.options.style.display = 'flex';
    state.active = false;
    if (state.spawnInterval) {
        clearInterval(state.spawnInterval);
        state.spawnInterval = null;
    }
    if (state.witchTimer) {
        clearTimeout(state.witchTimer);
        state.witchTimer = null;
    }
    if (state.targetChangeInterval) {
        clearInterval(state.targetChangeInterval);
        state.targetChangeInterval = null;
    }
    clearWeatherEffects();
}

function saveOptions() {
    config.weather = elements.selects.weather.value;
    elements.screens.options.style.display = 'none';
    startGame();
}

// Game Elements
function createClouds() {
    clearClouds();
    
    const cloudCount = 5;
    for (let i = 0; i < cloudCount; i++) {
        const cloud = document.createElement('div');
        cloud.className = 'cloud';
        cloud.style.left = `${(i * (window.innerWidth / cloudCount)) + (Math.random() * 100 - 50)}px`;
        cloud.style.top = `${20 + Math.random() * 30}px`;
        elements.container.appendChild(cloud);
        state.clouds.push(cloud);
    }
}

function createWeatherEffects() {
    clearWeatherEffects();
    
    if (config.weather === 'clear') return;
    
    const effect = document.createElement('div');
    effect.className = `weather-effect ${config.weather}`;
    elements.container.appendChild(effect);
    state.weatherEffects.push(effect);
    
    if (config.weather === 'storm') {
        createLightning();
    }
}

function createLightning() {
    const lightning = document.createElement('div');
    lightning.className = 'lightning';
    elements.container.appendChild(lightning);
    state.weatherEffects.push(lightning);
    
    function flash() {
        if (!state.active) return;
        
        lightning.style.opacity = '0.8';
        setTimeout(() => {
            lightning.style.opacity = '0';
            
            // Random next flash
            if (Math.random() > 0.7) {
                setTimeout(flash, 100 + Math.random() * 300);
            } else {
                setTimeout(flash, 1000 + Math.random() * 3000);
            }
        }, 100);
    }
    
    flash();
}

function spawnFruit() {
    if (!state.active || state.clouds.length === 0) return;
    
    const fruitType = config.fruitTypes[Math.floor(Math.random() * config.fruitTypes.length)];
    const fruit = document.createElement('div');
    fruit.className = 'fruit';
    fruit.textContent = fruitType.emoji;
    fruit.style.color = fruitType.color;
    
    const cloud = state.clouds[Math.floor(Math.random() * state.clouds.length)];
    const cloudRect = cloud.getBoundingClientRect();
    
    const x = cloudRect.left + (Math.random() * cloudRect.width);
    const y = cloudRect.bottom;
    
    fruit.style.left = `${x}px`;
    fruit.style.top = `${y}px`;
    
    const settings = config.difficulties[config.difficulty];
    const fruitData = {
        element: fruit,
        type: fruitType,
        x: x,
        y: y,
        speed: (2 + Math.random() * 3) * settings.speed
    };
    
    elements.container.appendChild(fruit);
    state.fruits.push(fruitData);
    
    animateFruit(fruitData);
}

function animateFruit(fruit) {
    if (!state.active) return;
    
    // Limit maximum speed based on difficulty
    const maxSpeed = config.difficulties[config.difficulty].maxSpeed;
    const effectiveSpeed = Math.min(fruit.speed, maxSpeed);
    
    fruit.y += effectiveSpeed;
    fruit.element.style.top = `${fruit.y}px`;
    
    if (fruit.y > window.innerHeight) {
        removeFruit(fruit);
    } else {
        state.animationFrame = requestAnimationFrame(() => animateFruit(fruit));
    }
}

// Interaction
function handleFruitClick(e) {
    checkFruitHit(e.clientX, e.clientY);
}

function handleFruitTap(e) {
    e.preventDefault();
    const touch = e.touches[0];
    checkFruitHit(touch.clientX, touch.clientY);
}

function simulateTap(x, y) {
    checkFruitHit(x, y);
}

function checkFruitHit(x, y) {
    if (!state.active) return;
    
    for (let i = state.fruits.length - 1; i >= 0; i--) {
        const fruit = state.fruits[i];
        const rect = fruit.element.getBoundingClientRect();
        
        if (x >= rect.left && x <= rect.right && 
            y >= rect.top && y <= rect.bottom) {
            blastFruit(fruit);
            return;
        }
    }
}

function blastFruit(fruit) {
    const isCorrect = fruit.type.name === state.targetFruit.name;
    const settings = config.difficulties[config.difficulty];
    let points = isCorrect ? fruit.type.points : -Math.floor(fruit.type.points * settings.penalty);
    
    fruit.element.classList.add(isCorrect ? 'blast' : 'wrong');
    showFeedback(
        isCorrect ? `+${points}` : `${points}`,
        fruit.x, fruit.y,
        isCorrect ? 'positive' : 'negative'
    );
    
    // Vibrate on wrong fruit
    if (!isCorrect) {
        vibrateDevice();
    }
    
    state.score = Math.max(0, state.score + points); // Prevent negative score
    updateUI();
    
    setTimeout(() => removeFruit(fruit), 600);
}

function showFeedback(text, x, y, type) {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = text;
    feedback.style.left = `${x}px`;
    feedback.style.top = `${y}px`;
    elements.container.appendChild(feedback);
    
    setTimeout(() => feedback.remove(), 1000);
}

// Cleanup
function removeFruit(fruit) {
    const index = state.fruits.indexOf(fruit);
    if (index !== -1) {
        state.fruits.splice(index, 1);
        if (fruit.element.parentNode) {
            fruit.element.remove();
        }
    }
}

function clearAllFruits() {
    state.fruits.forEach(fruit => {
        if (fruit.element.parentNode) {
            fruit.element.remove();
        }
    });
    state.fruits = [];
}

function clearClouds() {
    state.clouds.forEach(cloud => cloud.remove());
    state.clouds = [];
}

function clearWeatherEffects() {
    state.weatherEffects.forEach(effect => effect.remove());
    state.weatherEffects = [];
}

// UI
function updateUI() {
    elements.score.textContent = `Score: ${state.score}`;
}

// Start the game
init();