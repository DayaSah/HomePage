// js/supabase.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export async function fetchFileContent(filePath) {
    try {
        // We use the REST API to select the content from the app_Files table where path matches
        const url = `${SUPABASE_URL}/rest/v1/app_Files?path=eq.${encodeURIComponent(filePath)}&select=content`;
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error("Failed to fetch from Supabase");

        const data = await response.json();
        
        // If file exists, return the CSV string from the 'content' column
        if (data && data.length > 0) {
            return data[0].content; 
        } else {
            throw new Error("File path not found in database.");
        }
    } catch (error) {
        console.error("Supabase Fetch Error:", error);
        return null;
    }
}
