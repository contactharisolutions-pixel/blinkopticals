const fs = require('fs');
const path = 'public/admin/js/erp-views.js';
let lines = fs.readFileSync(path, 'utf8').split('\n');

console.log('Total lines before:', lines.length);

// Find the actual insertion point: the line after rxo-lens-selected closing </div>
// That's the line that says '                </div>' closing rxo-lens-selected,
// which should be around line 11650.
// Find it precisely:
let insertAt = -1;
for (let i = 11600; i < 11700; i++) {
    if (lines[i] && lines[i].includes('rxo-lens-stock') && lines[i].includes('font-weight:600')) {
        // Next two lines should be </div></div> then we insert
        insertAt = i + 2; // after the closing </div></div>
        break;
    }
}

if (insertAt === -1) {
    console.error('Could not find insertion point!');
    process.exit(1);
}

console.log('Inserting after line:', insertAt + 1);
console.log('Line at insertAt:', lines[insertAt]);

// The RIGHT column + payment section + closing backtick
const RIGHT_COLUMN = `
                <!-- PAYMENT -->
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin:14px 0 8px;">Payment</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                    <div>
                        <label style="font-size:0.75rem;font-weight:700;">Advance Amount (₹)</label>
                        <input type="number" class="filter-input" style="width:100%" id="rxo-advance" value="0" placeholder="0" oninput="rxoCalcTotal()">
                    </div>
                    <div>
                        <label style="font-size:0.75rem;font-weight:700;">Payment Mode</label>
                        <select class="filter-input" style="width:100%" id="rxo-pay-mode">
                            \${payMethods.map(m=>\`<option>\${m}</option>\`).join('')}
                        </select>
                    </div>
                </div>
                <div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:12px;padding:12px;margin-top:8px;">
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
                        <div><div style="font-size:0.7rem;opacity:.8;">Frame</div><div id="rxo-total-frame" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Lens</div><div id="rxo-total-lens" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Total</div><div id="rxo-total-amt" style="font-size:1.1rem;font-weight:900;">₹0</div></div>
                        <div><div style="font-size:0.7rem;opacity:.8;">Balance Due</div><div id="rxo-balance" style="font-size:1.1rem;font-weight:900;color:#fcd34d;">₹0</div></div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Prescription -->
            <div>
                <div style="font-size:0.7rem;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">Prescription (Rx)</div>
                <table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                    <thead>
                        <tr style="background:#f8fafc;">
                            <th style="padding:8px;text-align:left;">Eye</th>
                            <th style="padding:8px;">SPH</th><th style="padding:8px;">CYL</th>
                            <th style="padding:8px;">AXIS</th><th style="padding:8px;">ADD</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding:8px;font-weight:700;">Right (OD)</td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-sph" placeholder="0.00"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-cyl" placeholder="0.00"></td>
                            <td><input type="number" class="filter-input" style="width:70px" id="rxo-r-axis" placeholder="0"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-r-add" placeholder="0.00"></td>
                        </tr>
                        <tr>
                            <td style="padding:8px;font-weight:700;">Left (OS)</td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-sph" placeholder="0.00"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-cyl" placeholder="0.00"></td>
                            <td><input type="number" class="filter-input" style="width:70px" id="rxo-l-axis" placeholder="0"></td>
                            <td><input type="number" step="0.25" class="filter-input" style="width:70px" id="rxo-l-add" placeholder="0.00"></td>
                        </tr>
                    </tbody>
                </table>
                <div style="margin-top:12px;">
                    <label style="font-size:0.75rem;font-weight:700;">Rx Presets</label>
                    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('distance')">Distance</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('reading')">Reading</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('progressive')">Progressive</button>
                        <button type="button" class="btn btn-outline btn-sm" onclick="rxoPreset('clear')">Clear</button>
                    </div>
                </div>
                <div style="margin-top:14px;">
                    <label style="font-size:0.75rem;font-weight:700;">Special Notes / Instructions</label>
                    <textarea class="filter-input" style="width:100%;height:70px;resize:none;" id="rxo-notes" placeholder="e.g. AR coating, UV protection..."></textarea>
                </div>
                <div style="margin-top:12px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:12px;">
                    <div style="font-size:0.72rem;color:#0369a1;font-weight:700;margin-bottom:6px;">👤 Customer</div>
                    <div style="font-weight:700;">\${window.posCustomer?.name || 'No customer selected'}</div>
                    <div style="font-size:0.8rem;color:#666;">\${window.posCustomer?.mobile || ''}</div>
                </div>
                <div style="margin-top:12px;">
                    <label style="font-size:0.75rem;font-weight:700;">Expected Delivery Date</label>
                    <input type="date" class="filter-input" style="width:100%" id="rxo-delivery-date">
                </div>
                <button class="btn btn-primary w-100" style="margin-top:16px;padding:14px;font-size:1rem;" onclick="submitPosOrderOptical()">
                    🔬 Confirm Order & Record Payment
                </button>
            </div>

        </div>\`, { wide: true });

    setTimeout(rxoCalcTotal, 100);
};
`;

const newLines = RIGHT_COLUMN.split('\n');
lines.splice(insertAt, 0, ...newLines);

console.log('Total lines after insert:', lines.length);
fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('Done. File written.');
