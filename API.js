// --- api.js : 10-Column Precision Terminal ---

const API_BASE = 'https://nepse-diary-api.onrender.com/api';

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
        const json = await response.json();
        const activeData = json.data;
        const summary = json.summary;

        // 1. Summary Header
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

        // 2. Table Body (10 Columns)
        tbody.innerHTML = '';
        activeData.forEach(stock => {
    const isProfit = stock.real_pl_amt >= 0;
    const pnlClass = isProfit ? 'profit' : 'loss';
    const pnlSign = isProfit ? '+' : '';
    
    // Accurate Breakeven Calculation
    const breakeven = (stock.total_cost + stock.exit_charges_inclusive_tax) / stock.net_qty;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="symbol-badge">${stock.symbol}</td>
        <td class="num">${formatInt(stock.net_qty)}</td>
        <td class="num">Rs. ${formatNum(stock.wacc)}</td>
        <td class="num" style="color: #64748b; font-size: 0.8rem;">Rs. ${formatNum(breakeven)}</td>
        <td class="num" style="font-weight: bold; color: #3b82f6;">Rs. ${formatNum(stock.ltp)}</td>
        
        <td class="num" style="color: #94a3b8;">Rs. ${formatNum(stock.total_cost)}</td>
        
        <td class="num">Rs. ${formatNum(stock.receivable_val)}</td>
        
        <td class="num" style="font-weight: bold; color: ${isProfit ? '#10b981' : '#ef4444'};">
            ${pnlSign}Rs. ${formatNum(stock.real_pl_amt)}
        </td>
        
        <td class="num ${pnlClass}">${pnlSign}${formatNum(stock.real_pl_pct)}%</td>
        
        <td class="num" style="color: #64748b;">${formatNum(stock.weight)}%</td>
    `;
    tbody.appendChild(tr);
});

    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="10" class="loading-text">⚠️ API Error</td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', loadActivePortfolio);
