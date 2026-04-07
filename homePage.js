// --- NEPSE Terminal v2.1 - Fixed by Gemini 🚀 ---

// 1. Optimized Background Images
const bgImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1280',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1280'
];
document.body.style.backgroundImage = `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url('${bgImages[Math.floor(Math.random()*bgImages.length)]}')`;

// 2. Smooth Analog Clock
function setClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    
    const secHand = document.getElementById('secondHand');
    const minHand = document.getElementById('minuteHand');
    const hourHand = document.getElementById('hourHand');

    if (secHand && minHand && hourHand) {
        secHand.style.transform = `rotate(${s * 6}deg)`;
        minHand.style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
        hourHand.style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
    }
    requestAnimationFrame(setClock);
}
requestAnimationFrame(setClock);

// 3. Market Status Greeting (Nepal Specific: Closed Fri/Sat)
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const day = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    
    const greetingText = document.getElementById('greetingText');
    const greetingSubtext = document.getElementById('greetingSubtext');
    
    if (!greetingText) return;

    let greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    greetingText.innerHTML = `${greet}, <span class="highlight">Analyst</span>.`;

    // NEPSE: Sun (0) to Thu (4) | 11:00 to 15:00
    const isMarketDay = (day >= 1 && day <= 5); 
    const currentTimeInMinutes = (hour * 60) + minute;
    const marketOpenTime = 11 * 60;
    const marketCloseTime = 15 * 60;
    const isMarketHour = (currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime);
    
    let statusHTML;
    if (!isMarketDay) {
        statusHTML = '<span style="color: #ef4444;">○ Weekend (Closed)</span>';
    } else if (isMarketHour) {
        statusHTML = '<span style="color: #10b981; font-weight: bold;">● Market Open</span>';
    } else {
        statusHTML = '<span style="color: #f59e0b;">○ Market Closed</span>';
    }

    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    greetingSubtext.innerHTML = `Today is ${dateString} | ${statusHTML}`;
}

// 4. FIX: Toggle Function for "See More"
window.toggleLinks = function(id, btn) {
    const extraLinks = document.getElementById(id);
    if (extraLinks.style.display === 'none' || extraLinks.style.display === '') {
        extraLinks.style.display = 'block';
        btn.innerHTML = 'See Less ▲';
    } else {
        extraLinks.style.display = 'none';
        btn.innerHTML = 'See More ▼';
    }
};

// 5. Search Ticker Redirect
document.getElementById('tickerSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
    if (ticker.length >= 3) {
        window.open(`https://nepsealpha.com/trading/chart?symbol=${ticker}`, '_blank');
        e.target.reset();
    }
});

// Initialize
updateGreeting();
setInterval(updateGreeting, 60000);
