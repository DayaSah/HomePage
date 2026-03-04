// js/app.js
import { fetchFileContent } from './supabase.js';
import { TARGET_CSV_PATH } from './config.js';

// --- 1. Dynamic Background Logic ---
const backgrounds = [
    'https://images.unsplash.com/photo-1611974717482-58a252ce80be?q=80&w=2000', // Finance
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2000', // Tech
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=2000'  // City Night
];
document.body.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${backgrounds[Math.floor(Math.random() * backgrounds.length)]}')`;

// --- 2. Live Clock Logic ---
function updateTime() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour12: false });
}
setInterval(updateTime, 1000);
updateTime();

// --- 3. Parse CSV to JSON Logic ---
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');
    const results = [];
    
    // Read from the bottom to get the most recent rows first
    for (let i = lines.length - 1; i > 0; i--) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        // Handle basic CSV splitting (Warning: simple split, ignores commas inside quotes)
        // For a basic activity_log.csv, this is usually perfectly fine.
        let values = lines[i].split(','); 
        let obj = {};
        
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
        });
        results.push(obj);
    }
    return results;
}

// --- 4. Render Transactions Logic ---
async function loadRecentTransactions() {
    const container = document.getElementById('transactions-container');
    const statusText = document.getElementById('sync-status');
    
    try {
        const csvContent = await fetchFileContent(TARGET_CSV_PATH);
        
        if (!csvContent) {
            statusText.textContent = "Offline / Error connecting to DB";
            statusText.style.color = "var(--danger)";
            return;
        }

        const transactions = parseCSV(csvContent);
        container.innerHTML = ''; // Clear container
        
        // Take the top 6 most recent transactions
        const recentTxs = transactions.slice(0, 6);
        
        recentTxs.forEach(tx => {
            const row = document.createElement('div');
            row.className = 'tx-row';
            
            // Format Amount Color (Green for positive, Red for negative)
            let amt = parseFloat(tx.Amount || 0);
            let colorClass = amt > 0 ? 'text-green' : (amt < 0 ? 'text-red' : '');
            let amtStr = isNaN(amt) ? '-' : (amt > 0 ? `+ Rs. ${amt}` : `- Rs. ${Math.abs(amt)}`);

            // Check if symbol exists, otherwise use category
            let symbolText = tx.Symbol ? tx.Symbol : tx.Category;

            row.innerHTML = `
                <div class="tx-time">${tx.Timestamp || 'Unknown Time'}</div>
                <div class="tx-symbol">${symbolText}</div>
                <div class="tx-action">${tx.Action || ''} - ${tx.Details || ''}</div>
                <div class="tx-amount ${colorClass}">${amtStr}</div>
            `;
            container.appendChild(row);
        });

        statusText.textContent = "Synced Just Now";
        statusText.style.color = "var(--success)";

    } catch (err) {
        console.error(err);
        statusText.textContent = "Failed to parse data";
        statusText.style.color = "var(--danger)";
    }
}

// Load data immediately, and then poll database every 30 seconds
loadRecentTransactions();
setInterval(loadRecentTransactions, 30000);
