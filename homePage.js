// ==========================================
// --- BACKGROUND RANDOMIZERS ---
// ==========================================

// PERFORMANCE UPDATE: Changed w=500 to w=300 to reduce image file sizes
const sectionImages = [
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1611974717482-58a252ce80be?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=60&w=300',
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=60&w=300'
];
const catBgs = document.querySelectorAll('.cat-bg');
const shuffledImages = sectionImages.sort(() => 0.5 - Math.random());
catBgs.forEach((bg, index) => {
    bg.style.backgroundImage = `url('${shuffledImages[index % shuffledImages.length]}')`;
});

// PERFORMANCE UPDATE: Changed w=2000 to w=1280 
const bgImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1280',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1280',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1280'
];


document.body.style.backgroundImage = `linear-gradient(rgba(15,23,42,0.8), rgba(15,23,42,0.9)), url('${bgImages[Math.floor(Math.random()*bgImages.length)]}')`;

// ==========================================
// --- PREMIUM ANALOG CLOCK LOGIC ---
// ==========================================
const clockFace = document.getElementById('clockFace');
if (clockFace) {
    for (let i = 0; i < 12; i++) {
        const tick = document.createElement('div');
        tick.classList.add('clock-tick');
        if (i % 3 === 0) tick.classList.add('main-tick');
        tick.style.transform = `translateX(-50%) rotate(${i * 30}deg)`;
        clockFace.appendChild(tick);
    }
}

const hourHand = document.getElementById('hourHand');
const minuteHand = document.getElementById('minuteHand');
const secondHand = document.getElementById('secondHand');

function setClock() {
    const currentDate = new Date();
    const secondsRatio = currentDate.getSeconds() / 60;
    const minutesRatio = (secondsRatio + currentDate.getMinutes()) / 60;
    const hoursRatio = (minutesRatio + currentDate.getHours()) / 12;

    if (secondHand) secondHand.style.transform = `rotate(${secondsRatio * 360}deg)`;
    if (minuteHand) minuteHand.style.transform = `rotate(${minutesRatio * 360}deg)`;
    if (hourHand) hourHand.style.transform = `rotate(${hoursRatio * 360}deg)`;
}
setInterval(setClock, 1000);
setClock(); 


// ==========================================
// --- DYNAMIC TERMINAL GREETING ---
// ==========================================
function updateGreeting() {
    const hour = new Date().getHours();
    const greetingText = document.getElementById('greetingText');
    const greetingSubtext = document.getElementById('greetingSubtext');
    
    if (!greetingText || !greetingSubtext) return;

    let greeting = 'Good Evening';
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    }

    greetingText.innerHTML = `${greeting}, <span class="highlight">Analyst</span>.`;
    
    const dateOpts = { weekday: 'long', month: 'long', day: 'numeric' };
    const dateString = new Date().toLocaleDateString('en-US', dateOpts);
    
    greetingSubtext.innerText = `Today is ${dateString}. Market connections are standing by.`;
}
updateGreeting();


// ==========================================
// --- MULTI-TAB TICKER SEARCH ---
// ==========================================
const searchForm = document.getElementById('tickerSearchForm');
const tickerInput = document.getElementById('tickerInput');

if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault(); 
        const ticker = tickerInput.value.trim().toUpperCase();
        if (ticker) {
            window.open(`https://nepsealpha.com/search?q=${ticker}`, '_blank');
            window.open(`https://chukul.com/stock-profile?symbol=${ticker}`, '_blank');
            tickerInput.value = '';
            tickerInput.blur(); // Hides keyboard on mobile after search
        }
    });
}


// ==========================================
// --- UNIVERSAL LINK TOGGLE ---
// ==========================================
function toggleLinks(elementId, btn) {
    const hiddenContainer = document.getElementById(elementId);
    
    if (hiddenContainer.style.display === 'block') {
        hiddenContainer.style.display = 'none';
        btn.innerHTML = 'See More ▼';
    } else {
        hiddenContainer.style.display = 'block';
        btn.innerHTML = 'See Less ▲';
    }
}



