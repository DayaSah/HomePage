// --- api.js : Precision NEPSE Mapping ---

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

// Formatters for Currency and Integers
const formatNum = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
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

        // 1. Dashboard Summary Logic
        if (summaryElement && summary) {
            const isProfit = summary.actual_net_profit >= 0;
            const pnlColor = isProfit ? '#10b981' : '#ef4444';
            const sign = isProfit ? '+' : '';
            
            summaryElement.innerHTML = `
                <span style="color: #94a3b8; margin-right: 15px;">Invested: Rs. ${formatNum(summary.total_invested)}</span>
                <span style="color: #e2e8f0; margin-right: 15px; font-weight: bold;">Value: Rs. ${formatNum(summary.net_liquid_value)}</span>
                <span style="color: ${pnlColor}; font-weight: bold;">
                    Unrealized: ${sign}Rs. ${formatNum(summary.actual_net_profit)} (${sign}${formatNum(summary.overall_net_gain_pct)}%)
                </span>
            `;
        }

        // 2. Table Row Generation (9-Column Grid)
        tbody.innerHTML = '';

        if (!activeData || activeData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading-text">No active holdings found.</td></tr>`;
            return;
        }

        activeData.forEach(stock => {
            // Mapping the 10 JSON keys to 9 Table Columns
            const isProfit = stock.real_pl_amt >= 0;
            const pnlClass = isProfit ? 'profit' : 'loss';
            const pnlSign = isProfit ? '+' : '';
            
            // Calculate an accurate Breakeven: (Total Cost / Qty) + tiny buffer for exit taxes
            // Or use WACC * 1.005 as a standard NEPSE estimate
            const breakeven = (stock.total_cost / stock.net_qty) * 1.006;

            // Visual Dynamics
            let opacity = 0.15;
            if (Math.abs(stock.real_pl_pct) > 8) opacity = 0.3;
            const bgColor = isProfit ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
            const textColor = isProfit ? '#10b981' : '#ef4444';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="symbol-badge">${stock.symbol}</td>
                <td class="num">${formatInt(stock.net_qty)}</td>
                <td class="num">Rs. ${formatNum(stock.wacc)}</td>
                <td class="num" style="color: #64748b; font-size: 0.8rem;">Rs. ${formatNum(breakeven)}</td>
                <td class="num" style="font-weight: bold; color: #3b82f6;">Rs. ${formatNum(stock.ltp)}</td>
                <td class="num">Rs. ${formatNum(stock.receivable_val)}</td>
                <td class="num" style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold;">
                    ${pnlSign}Rs. ${formatNum(stock.real_pl_amt)}
                </td>
                <td class="num ${pnlClass}">${pnlSign}${formatNum(stock.real_pl_pct)}%</td>
                <td class="num" style="color: #94a3b8;">${formatNum(stock.weight)}%</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Critical API Error:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="loading-text" style="color: #ef4444;">⚠️ Connection Lost. Check API status.</td></tr>`;
    }
}

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadActivePortfolio();
    
    const setupBtn = (id, endpoint, msg) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', async () => {
            const oldText = btn.innerHTML;
            btn.innerHTML = `<span>⏳ Working...</span>`;
            btn.disabled = true;
            try {
                const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST' });
                if (res.ok) {
                    btn.innerHTML = `<span>✅ ${msg}</span>`;
                    setTimeout(loadActivePortfolio, 2500);
                }
            } catch (e) {
                btn.innerHTML = `<span>⚠️ Error</span>`;
            } finally {
                setTimeout(() => { btn.innerHTML = oldText; btn.disabled = false; }, 4000);
            }
        });
    };

    setupBtn('refresh-price-btn', 'refresh-ltp', 'Prices Synced');
    setupBtn('sync-btn', 'sync', 'History Updated');
});
