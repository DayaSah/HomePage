// --- api.js : Dedicated Data Fetching & Processing ---

// IMPORTANT: Replace this with your actual Render API URL
const API_BASE = 'https://nepse-diary-api.onrender.com/api';

// Helper formatting functions
const formatNum = (num) => parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInt = (num) => parseInt(num).toLocaleString('en-IN');

async function loadActivePortfolio() {
    const tbody = document.getElementById('active-portfolio-body');
    const summaryElement = document.getElementById('portfolio-summary');
    if (!tbody) return; 
    
    try {
        // Fetch the perfectly calculated data from your new backend endpoint
        const response = await fetch(`${API_BASE}/active_portfolio`);
        
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const json = await response.json();
        const activeData = json.data;
        const summary = json.summary;

        // 1. Render the Summary Header
        if (summaryElement && summary) {
            const totalPnlClass = summary.total_unrealized_pl >= 0 ? '#10b981' : '#ef4444';
            const totalPnlSign = summary.total_unrealized_pl >= 0 ? '+' : '';
            
            summaryElement.innerHTML = `
                <span style="color: #94a3b8; margin-right: 10px;">Invested: Rs. ${formatNum(summary.total_invested)}</span>
                <span style="color: #e2e8f0; margin-right: 10px; font-weight: bold;">Value: Rs. ${formatNum(summary.total_current_value)}</span>
                <span style="color: ${totalPnlClass}; font-weight: bold;">
                    Unrealized: ${totalPnlSign}Rs. ${formatNum(summary.total_unrealized_pl)} (${totalPnlSign}${formatNum(summary.total_pl_pct)}%)
                </span>
            `;
        }

        // 2. Render the Table Rows
        tbody.innerHTML = '';

        if (!activeData || activeData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading-text">No active holdings found in your portfolio.</td></tr>`;
            return;
        }

        activeData.forEach(stock => {
            const isProfit = stock.pl_amt >= 0;
            const pnlClass = isProfit ? 'profit' : 'loss';
            const pnlSign = isProfit ? '+' : '';
            
            // Subtle color intensity based on P/L %
            let opacity = 0.9;
            const absPct = Math.abs(stock.pl_pct);
            if (absPct <= 2) opacity = 0.4;
            else if (absPct <= 5) opacity = 0.6;
            else if (absPct <= 15) opacity = 0.8;
            
            const bgColor = isProfit ? `rgba(16, 185, 129, ${opacity * 0.3})` : `rgba(239, 68, 68, ${opacity * 0.3})`;
            const textColor = isProfit ? '#10b981' : '#ef4444';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="symbol-badge">${stock.symbol}</td>
                <td class="num">${formatInt(stock.net_qty)}</td>
                <td class="num">Rs. ${formatNum(stock.wacc)}</td>
                <td class="num" style="color: #94a3b8;">Rs. ${formatNum(stock.breakeven)}</td>
                <td class="num" style="font-weight: bold;">Rs. ${formatNum(stock.ltp)}</td>
                <td class="num">Rs. ${formatNum(stock.current_val)}</td>
                <td class="num" style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold;">
                    ${pnlSign}Rs. ${formatNum(stock.pl_amt)}
                </td>
                <td class="num ${pnlClass}">${pnlSign}${formatNum(stock.pl_pct)}%</td>
                <td class="num" style="color: #cbd5e1;">${formatNum(stock.weight)}%</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("API Fetch Error:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="loading-text" style="color: #ef4444;">⚠️ Failed to load data securely. Is your Render API live?</td></tr>`;
        if (summaryElement) summaryElement.innerHTML = `<span style="color: #ef4444;">Connection Error</span>`;
    }
}

// Auto-run when the script loads
document.addEventListener('DOMContentLoaded', loadActivePortfolio);

// --- Manual Sync Trigger (Single, Clean Event Listener) ---
document.getElementById('sync-btn').addEventListener('click', async () => {
    const btn = document.getElementById('sync-btn');
    const originalContent = btn.innerHTML;
    
    // 1. UI Feedback: Show it's loading instantly
    btn.innerHTML = `<span style="color: #10b981;">🔄 Triggering GitHub...</span>`;
    btn.disabled = true;
    btn.style.borderColor = '#10b981';

    try {
        // 2. Ping your FastAPI backend. The Backend handles the PAT and talks to GitHub.
        const response = await fetch(`${API_BASE}/sync`, { method: 'POST' });
        
        if (response.ok) {
            // 3. Show success briefly
            btn.innerHTML = `<span style="color: #10b981;">✅ Sync Started!</span>`;
            
            // 4. GitHub Actions usually take 30-60 seconds to boot up, scrape, and save to Neon.
            // We set a 45-second delay here before reloading the frontend table.
            setTimeout(() => {
                loadActivePortfolio();
            }, 45000); 
            
        } else {
            throw new Error("Backend failed to trigger GitHub Action.");
        }
    } catch (error) {
        console.error("Sync Error:", error);
        btn.innerHTML = `<span style="color: #ef4444;">⚠️ Sync Failed</span>`;
        btn.style.borderColor = '#ef4444';
    } finally {
        // 5. Reset button UI after 5 seconds so the user isn't stuck staring at it
        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            btn.style.borderColor = 'rgba(34, 211, 238, 0.3)';
        }, 5000);
    }
});
