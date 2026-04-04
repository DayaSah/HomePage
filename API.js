// --- api.js : Dedicated Data Fetching & Processing ---

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

// Formatting Helpers
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

        // 1. Render Summary Header
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

        // 2. Render Table Rows (Exact 9-Column Alignment)
        tbody.innerHTML = '';

        if (!activeData || activeData.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" class="loading-text">No active holdings found.</td></tr>`;
            return;
        }

        activeData.forEach(stock => {
            // Data Mapping
            const pnlAmt = stock.real_pl_amt || 0;
            const pnlPct = stock.real_pl_pct || 0;
            const isProfit = pnlAmt >= 0;
            const pnlClass = isProfit ? 'profit' : 'loss';
            const pnlSign = isProfit ? '+' : '';
            
            // NEPSE Breakeven Calculation (WACC + Commission/DP/SEBON)
            // Roughly 0.5% extra needed on top of WACC to break even on sell
            const breakeven = stock.wacc * 1.005;

            // Background Opacity Logic for P&L Cell
            let opacity = 0.1;
            const absPct = Math.abs(pnlPct);
            if (absPct > 5) opacity = 0.2;
            if (absPct > 10) opacity = 0.3;
            const bgColor = isProfit ? `rgba(16, 185, 129, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
            const textColor = isProfit ? '#10b981' : '#ef4444';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="symbol-badge">${stock.symbol}</td>
                <td class="num">${formatInt(stock.net_qty)}</td>
                <td class="num">Rs. ${formatNum(stock.wacc)}</td>
                <td class="num" style="color: #64748b; font-size: 0.85rem;">Rs. ${formatNum(breakeven)}</td>
                <td class="num" style="font-weight: bold; color: #f1f5f9;">Rs. ${formatNum(stock.ltp)}</td>
                <td class="num">Rs. ${formatNum(stock.receivable_val)}</td>
                <td class="num" style="background-color: ${bgColor}; color: ${textColor}; font-weight: bold;">
                    ${pnlSign}Rs. ${formatNum(pnlAmt)}
                </td>
                <td class="num ${pnlClass}">${pnlSign}${formatNum(pnlPct)}%</td>
                <td class="num" style="color: #94a3b8;">${formatNum(stock.weight)}%</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("API Error:", error);
        tbody.innerHTML = `<tr><td colspan="9" class="loading-text" style="color: #ef4444;">⚠️ Connection Failed.</td></tr>`;
    }
}

// Action Button Handler
const handleAction = async (btnId, endpoint, successText) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    const original = btn.innerHTML;
    btn.innerHTML = `<span>⏳ Processing...</span>`;
    btn.disabled = true;
    try {
        const res = await fetch(`${API_BASE}/${endpoint}`, { method: 'POST' });
        if (res.ok) {
            btn.innerHTML = `<span>✅ ${successText}</span>`;
            setTimeout(loadActivePortfolio, 3000);
        } else {
            throw new Error();
        }
    } catch (e) {
        btn.innerHTML = `<span>⚠️ Failed</span>`;
    } finally {
        setTimeout(() => { btn.innerHTML = original; btn.disabled = false; }, 4000);
    }
};

// Initial Load and Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadActivePortfolio();
    document.getElementById('refresh-price-btn')?.addEventListener('click', () => handleAction('refresh-price-btn', 'refresh-ltp', 'Prices Updated'));
    document.getElementById('sync-btn')?.addEventListener('click', () => handleAction('sync-btn', 'sync', 'Sync Queued'));
});
