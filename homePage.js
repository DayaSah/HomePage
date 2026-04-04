// --- NEPSE Terminal v2.1 - Developed by Jagdish Sah 🌹 ---

// Optimized Background Images
const bgImages = [
    'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=1280',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1280'
];
document.body.style.backgroundImage = `linear-gradient(rgba(15,23,42,0.85), rgba(15,23,42,0.95)), url('${bgImages[Math.floor(Math.random()*bgImages.length)]}')`;

// Smooth Analog Clock using requestAnimationFrame
function setClock() {
    const now = new Date();
    const h = now.getHours(), m = now.getMinutes(), s = now.getSeconds();
    
    if (document.getElementById('secondHand')) {
        document.getElementById('secondHand').style.transform = `rotate(${s * 6}deg)`;
        document.getElementById('minuteHand').style.transform = `rotate(${m * 6 + s * 0.1}deg)`;
        document.getElementById('hourHand').style.transform = `rotate(${(h % 12) * 30 + m * 0.5}deg)`;
    }
    requestAnimationFrame(setClock);
}
requestAnimationFrame(setClock);

// Smart Market Status Greeting
function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay(); // 5 = Friday, 6 = Saturday
    const greetingText = document.getElementById('greetingText');
    const greetingSubtext = document.getElementById('greetingSubtext');
    
    if (!greetingText) return;

    let greet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    greetingText.innerHTML = `${greet}, <span class="highlight">Analyst</span>.`;

    const isMarketDay = (day !== 5 && day !== 6);
    const isMarketHour = (hour >= 11 && hour < 15);
    
    let statusHTML;
    if (!isMarketDay) {
        statusHTML = '<span style="color: #64748b;">○ Weekend (Closed)</span>';
    } else if (isMarketHour) {
        statusHTML = '<span style="color: #10b981; font-weight: bold;">● Market Open</span>';
    } else {
        statusHTML = '<span style="color: #f59e0b;">○ Market Closed</span>';
    }

    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    greetingSubtext.innerHTML = `Today is ${dateString} | ${statusHTML}`;
}
updateGreeting();
setInterval(updateGreeting, 60000);

// Search Ticker Redirect
document.getElementById('tickerSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const ticker = document.getElementById('tickerInput').value.trim().toUpperCase();
    if (ticker.length >= 3) {
        window.open(`https://nepsealpha.com/trading/chart?symbol=${ticker}`, '_blank');
        e.target.reset();
    }
});
