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

// --- NEW: Manual Price Refresh Logic ---
const refreshPriceBtn = document.getElementById('refresh-price-btn');

if (refreshPriceBtn) {
    refreshPriceBtn.addEventListener('click', async () => {
        const originalContent = refreshPriceBtn.innerHTML;
        refreshPriceBtn.innerHTML = `<span>⏳ Updating...</span>`;
        refreshPriceBtn.disabled = true;

        try {
            // This calls your new /refresh-ltp endpoint in FastAPI
            const response = await fetch(`${API_BASE}/refresh-ltp`, { method: 'POST' });
            
            if (response.ok) {
                refreshPriceBtn.innerHTML = `<span>✅ Prices Updated!</span>`;
                // Wait 2 seconds for the background task to start, then reload table
                setTimeout(() => {
                    loadActivePortfolio();
                }, 2000);
            } else {
                throw new Error("Price refresh failed");
            }
        } catch (error) {
            console.error("Refresh Error:", error);
            refreshPriceBtn.innerHTML = `<span style="color: #ef4444;">⚠️ Error</span>`;
        } finally {
            setTimeout(() => {
                refreshPriceBtn.innerHTML = originalContent;
                refreshPriceBtn.disabled = false;
            }, 3000);
        }
    });
}

// --- UPDATED: GitHub Sync Logic (Cleanup) ---
// Note: I renamed the label to "Sync Trades" to avoid confusion with "Live Price"
const syncBtn = document.getElementById('sync-btn');
if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
        const originalContent = syncBtn.innerHTML;
        syncBtn.innerHTML = `<span>🔄 Scouring GitHub...</span>`;
        syncBtn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/sync`, { method: 'POST' });
            if (response.ok) {
                syncBtn.innerHTML = `<span>✅ Sync Queued</span>`;
                // GitHub takes longer (scraping + db save), so wait 30s
                setTimeout(() => { loadActivePortfolio(); }, 30000);
            }
        } catch (error) {
            syncBtn.innerHTML = `<span>⚠️ Failed</span>`;
        } finally {
            setTimeout(() => {
                syncBtn.innerHTML = originalContent;
                syncBtn.disabled = false;
            }, 5000);
        }
    });
}
