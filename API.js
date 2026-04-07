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
        if (!response.ok) throw new Error('Network response was not ok');
        
        const json = await response.json();
        const activeData = json.data;
        const summary = json.summary;

        // 1. Summary Header
        if (summaryElement && summary) {
            const isOverallProfit = summary.actual_net_profit >= 0;
            const pnlColor = isOverallProfit ? '#10b981' : '#ef4444';
            const sign = isOverallProfit ? '+' : '';
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
            const isStockProfit = stock.real_pl_amt >= 0;
            const pnlClass = isStockProfit ? 'profit' : 'loss';
            const pnlSign = isStockProfit ? '+' : '';
            
            // Avoid Division by Zero for Breakeven
            const breakeven = stock.net_qty > 0 
                ? (stock.total_cost + (stock.exit_charges_inclusive_tax || 0)) / stock.net_qty 
                : 0;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="symbol-badge">${stock.symbol}</td>
                <td class="num">${formatInt(stock.net_qty)}</td>
                <td class="num">Rs. ${formatNum(stock.wacc)}</td>
                <td class="num" style="color: #64748b; font-size: 0.8rem;">Rs. ${formatNum(breakeven)}</td>
                <td class="num" style="font-weight: bold; color: #3b82f6;">Rs. ${formatNum(stock.ltp)}</td>
                <td class="num" style="color: #94a3b8;">Rs. ${formatNum(stock.total_cost)}</td>
                <td class="num">Rs. ${formatNum(stock.receivable_val)}</td>
                <td class="num" style="font-weight: bold; color: ${isStockProfit ? '#10b981' : '#ef4444'};">
                    ${pnlSign}Rs. ${formatNum(stock.real_pl_amt)}
                </td>
                <td class="num ${pnlClass}">${pnlSign}${formatNum(stock.real_pl_pct)}%</td>
                <td class="num" style="color: #64748b;">${formatNum(stock.weight)}%</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error("Fetch Error:", error);
        tbody.innerHTML = `<tr><td colspan="10" class="loading-text" style="color: #ef4444;">⚠️ API Error: Check connection to Render</td></tr>`;
    }
}

// Attach listeners to your buttons in index.html
document.addEventListener('DOMContentLoaded', () => {
    loadActivePortfolio();

    // Refresh Price Button (Local UI Refresh)
    document.getElementById('refresh-price-btn')?.addEventListener('click', () => {
        const tbody = document.getElementById('active-portfolio-body');
        tbody.innerHTML = '<tr><td colspan="10" class="loading-text">Updating prices...</td></tr>';
        loadActivePortfolio();
    });

    // Sync Trades Button (Now fires /api/refresh-ltp)
    const syncBtn = document.getElementById('sync-btn');
    syncBtn?.addEventListener('click', async () => {
        try {
            // Visual feedback: Disable button during sync
            syncBtn.disabled = true;
            syncBtn.innerText = "Syncing...";

            const response = await fetch(`${API_BASE}/refresh-ltp`, {
                method: 'POST', // Or 'GET' depending on your backend configuration
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Sync failed');

            const result = await response.json();
            console.log("Sync Success:", result);
            
            // Refresh the UI to show new data
            await loadActivePortfolio();
            alert("Portfolio synced successfully!");

        } catch (error) {
            console.error("Sync Error:", error);
            alert("Failed to sync trades. Please check the console or API status.");
        } finally {
            // Restore button state
            syncBtn.disabled = false;
            syncBtn.innerText = "Sync Trades";
        }
    });
});
