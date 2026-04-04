// --- api.js : Dedicated Data Fetching & Processing ---

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

// Helper formatting functions
const formatNum = (num) => {
    if (num === undefined || num === null) return "0.00";
    return parseFloat(num).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
const formatInt = (num) => parseInt(num || 0).toLocaleString('en-IN');

async function loadActivePortfolio() {
    const tbody = document.getElementById('active-portfolio-body');
    const summaryElement = document.getElementById('portfolio-summary');
    if (!tbody) return; 
    
    try {
        const response = await fetch(`${API_BASE}/active_portfolio`);
        
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const json = await response.json();
        const activeData = json.data;
        const summary = json.summary;

        // 1. Render the Summary Header (Using Actual Net Profit)
        if (summaryElement && summary) {
            const isProfit = summary.actual_net_profit >= 0;
            const totalPnlClass = isProfit ? '#10b981' : '#ef4444';
            const totalPnlSign = isProfit ? '+' : '';
            
            summaryElement.innerHTML = `
                <span style="color: #94a3b8; margin-right: 15px;">Invested: Rs. ${formatNum(summary.total_invested)}</span>
                <span style="color: #e2e8f0; margin-right: 15px; font-weight: bold;">Net Value: Rs. ${formatNum(summary.net_liquid_value)}</span>
                <span style="color: ${totalPnlClass}; font-weight: bold;">
                    Net P/L: ${totalPnlSign}Rs. ${formatNum(summary.actual_net_profit)} (${totalPnlSign}${formatNum(summary.overall_net_gain_pct)}%)
                </span>
            `;
        }

        // 2. Render the Table Rows
        tbody.innerHTML = '';

        if (!activeData || activeData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading-text">No active holdings found.</td></tr>`;
            return;
        }

        activeData.forEach(stock => {
            // MAPPING: Use real_pl_amt and real_pl_pct from your JSON
            const pnlAmt = stock.real_pl_amt;
            const pnlPct = stock.real_pl_pct;
            const isProfit = pnlAmt >= 0;
            const pnlClass = isProfit ? 'profit' : 'loss';
            const pnlSign = isProfit ? '+' : '';
            
            // Dynamic Opacity logic
            let opacity = 0.9;
            const absPct = Math.abs(pnlPct);
            if (absPct <= 2) opacity = 0.4;
            else if (absPct <= 10) opacity = 0.7;
            
            const bgColor = isProfit ? `rgba(16, 185, 129, ${opacity * 0.2})` : `rgba(239, 68, 68, ${opacity * 0.2})`;
            const textColor = isProfit ? '#10b981' : '#ef4444';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="symbol-badge">${stock.symbol}</td>
                <td class="num">${formatInt(stock.net_qty)}</td>
                <td class="num">Rs. ${formatNum(stock.wacc)}</td>
                <td class="num" style="font-weight: bold;">Rs. ${formatNum(stock.ltp)}</td>
                <td class="num">Rs. ${formatNum(stock.total_cost)}</td>
                <td class="num" style="color: #94a3b8;">Rs. ${formatNum(stock.receivable_val)}</td>
                <td class="num" style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold;">
                    ${pnlSign}Rs. ${formatNum(pnlAmt)}
                </td>
                <td class="num ${pnlClass}">${pnlSign}${formatNum(pnlPct)}%</td>
                <td class="num" style="color: #cbd5e1;">${formatNum(stock.weight)}%</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("API Fetch Error:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="loading-text" style="color: #ef4444;">⚠️ Connection Error. Ensure Backend is Awake.</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', loadActivePortfolio);

// --- Price Refresh Logic ---
const refreshPriceBtn = document.getElementById('refresh-price-btn');
if (refreshPriceBtn) {
    refreshPriceBtn.addEventListener('click', async () => {
        const original = refreshPriceBtn.innerHTML;
        refreshPriceBtn.innerHTML = `<span>⏳ Requesting...</span>`;
        refreshPriceBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/refresh-ltp`, { method: 'POST' });
            if (response.ok) {
                refreshPriceBtn.innerHTML = `<span>✅ GitHub Triggered</span>`;
                // Refresh table after 5s to allow GitHub to work
                setTimeout(loadActivePortfolio, 5000);
            }
        } catch (e) {
            refreshPriceBtn.innerHTML = `<span>⚠️ Error</span>`;
        } finally {
            setTimeout(() => { refreshPriceBtn.innerHTML = original; refreshPriceBtn.disabled = false; }, 3000);
        }
    });
}
