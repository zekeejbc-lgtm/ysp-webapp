const GAS_URL = 'https://script.google.com/macros/s/AKfycbwI4Pmh-r3RtpmqzRlnU-56ByzeWvRD6QKtCyDrKD9YU4jVhvaauN4lkxl2i7Wsl_Ps/exec';
const fs = require('fs');

async function scanDatabase() {
    console.log('Scanning database schema...');
    try {
        const response = await fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'getDatabaseSchema'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            let output = '✅ Database Connection Successful!\n';
            output += '----------------------------------------\n';
            output += 'Found the following sheets and columns:\n\n';

            const sheetNames = Object.keys(data.schema);
            output += `Total Sheets Found: ${sheetNames.length}\n`;
            output += `Sheets: ${sheetNames.join(', ')}\n\n`;

            for (const [sheetName, headers] of Object.entries(data.schema)) {
                output += `📋 SHEET: ${sheetName}\n`;
                if (headers.length > 0) {
                    output += `   Columns (${headers.length}):\n`;
                    headers.forEach((header, index) => {
                        output += `   [${index}] ${header}\n`;
                    });
                } else {
                    output += '   (Empty or No Headers)\n';
                }
                output += '\n';
            }
            output += '----------------------------------------\n';

            fs.writeFileSync('schema_scan_results.txt', output);
            console.log('Scan complete. Results saved to schema_scan_results.txt');
        } else {
            console.error('❌ Error from API:', data.message);
        }
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
    }
}

scanDatabase();
