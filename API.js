// --- api.js : Dedicated Data Fetching & Processing ---

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

// Helper formatting functions
const formatNum = (num) => parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatInt = (num) => parseInt(num).toLocaleString('en-IN');

async function loadActivePortfolio() {
    const tbody = document.getElementById('active-portfolio-body');
    if (!tbody) return; 

    // --- UX UPGRADE: WAKE UP MESSAGE ---
    tbody.innerHTML = `<tr><td colspan="6" class="loading-text">
        <span style="color: #3b82f6;">Connecting to Cloud Data...</span><br>
        <span style="font-size: 0.8em; color: #94a3b8; margin-top: 5px; display: inline-block;">
            (If the server was asleep, this may take up to 50 seconds to boot up)
        </span>
    </td></tr>`;
    
    try {
        // Fetch Portfolio and Cache simultaneously
       
        const [portfolioRes, cacheRes] = await Promise.all([
            fetch(`${API_BASE}/portfolio`),
            fetch(`${API_BASE}/cache`)
        ]);

        const portfolioJson = await portfolioRes.json();
        const cacheJson = await cacheRes.json();

        // 1. Map the Latest Traded Price (LTP) from the cache table
        const ltpMap = {};
        cacheJson.data.forEach(c => {
            ltpMap[c.symbol] = parseFloat(c.ltp || 0); 
        });

        // 2. Calculate Active Holdings & WACC (Average Cost)
        const holdings = {};
        
        portfolioJson.data.forEach(trade => {
            const sym = trade.symbol;
            const qty = parseFloat(trade.qty) || 0;
            const price = parseFloat(trade.price) || 0;
            const type = trade.transaction_type.toUpperCase();
            
            if (!holdings[sym]) {
                holdings[sym] = { qty: 0, total_cost: 0 };
            }

            if (type === 'BUY') {
                holdings[sym].qty += qty;
                holdings[sym].total_cost += (qty * price);
            } else if (type === 'SELL') {
                if (holdings[sym].qty > 0) {
                    const avgPrice = holdings[sym].total_cost / holdings[sym].qty;
                    holdings[sym].qty -= qty;
                    holdings[sym].total_cost -= (qty * avgPrice);
                }
            }
        });

        // 3. Render Table & Calculate Live P&L
        tbody.innerHTML = '';
        let totalPortfolioValue = 0;
        let totalPortfolioCost = 0;
        let activeStocksCount = 0;

        for (const [sym, data] of Object.entries(holdings)) {
            // Only render stocks you currently own (qty > 0)
            if (data.qty > 0) {
                activeStocksCount++;
                const wacc = data.total_cost / data.qty;
                const currentLtp = ltpMap[sym] || 0;
                const currentValue = data.qty * currentLtp;
                const pnl = currentValue - data.total_cost;
                
                totalPortfolioValue += currentValue;
                totalPortfolioCost += data.total_cost;

                const pnlClass = pnl >= 0 ? 'profit' : 'loss';
                const pnlSign = pnl >= 0 ? '+' : '';

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="symbol-badge">${sym}</td>
                    <td class="num">${formatInt(data.qty)}</td>
                    <td class="num">Rs. ${formatNum(wacc)}</td>
                    <td class="num">${currentLtp ? 'Rs. ' + formatNum(currentLtp) : '<span style="color:#94a3b8;font-size:0.8em">N/A</span>'}</td>
                    <td class="num">Rs. ${formatNum(currentValue)}</td>
                    <td class="num ${pnlClass}">${pnlSign} Rs. ${formatNum(pnl)}</td>
                `;
                tbody.appendChild(tr);
            }
        }

        if (activeStocksCount === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="loading-text">No active holdings found in your portfolio.</td></tr>`;
        }

        // 4. Update the Dashboard Summary Header
        const totalPnl = totalPortfolioValue - totalPortfolioCost;
        const totalPnlClass = totalPnl >= 0 ? '#10b981' : '#ef4444';
        const totalPnlSign = totalPnl >= 0 ? '+' : '';
        
        const summaryElement = document.getElementById('portfolio-summary');
        if (summaryElement) {
            summaryElement.innerHTML = `
                Equity: Rs. ${formatNum(totalPortfolioValue)} | 
                <span style="color: ${totalPnlClass}">Unrealized: ${totalPnlSign}Rs. ${formatNum(totalPnl)}</span>
            `;
        }

    } catch (error) {
        console.error("API Fetch Error:", error);
        tbody.innerHTML = `<tr><td colspan="6" class="loading-text" style="color: #ef4444;">⚠️ Failed to load database securely. Check console.</td></tr>`;
    }
}

// Auto-run when the script loads
document.addEventListener('DOMContentLoaded', loadActivePortfolio);
