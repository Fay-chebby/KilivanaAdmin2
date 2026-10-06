// Run from your project root:  node fix-orders-templates.js
// Updates three order templates to your real Order model (buyerId, paymentStatus, productName, quantity, unitPrice, createdAt).
const fs = require('fs');
const path = require('path');

const root = process.argv[2] || '.';
const dir = path.join(root, 'src', 'app', 'features', 'orders', 'components');

const edits = {
  'order-action-dialog/order-action-dialog.html': [
    [/\{\{\s*order\(\)\.buyer\.name\s*\}\}/g, 'the buyer'],
    [/\{\{\s*order\(\)\.farmer\.name\s*\}\}/g, 'the farmer'],
    [/order\(\)\.payment\.status/g, 'order().paymentStatus'],
  ],
  'order-items-table/order-items-table.html': [
    [/track i\.name/g, 'track i.id'],
    [/\{\{\s*i\.name\s*\}\}/g, '{{ i.productName }}'],
    [/Supplied by \{\{\s*order\(\)\.farmer\.name\s*\}\}/g, 'Seller #{{ i.sellerId }}'],
    [/\bi\.qty\b/g, 'i.quantity'],
    [/\bi\.unitPriceKes\b/g, 'i.unitPrice'],
  ],
  'order-timeline/order-timeline.html': [
    [/when\(e\.at\)/g, 'when(e.createdAt)'],
    [/^[ \t]*<span class="actor">\{\{\s*e\.actor\s*\}\}<\/span>[ \t]*\r?\n/gm, ''],
  ],
};

let failed = false;
for (const [file, rules] of Object.entries(edits)) {
  const full = path.join(dir, file);
  if (!fs.existsSync(full)) {
    console.log(`MISSING   ${full}`);
    failed = true;
    continue;
  }
  const before = fs.readFileSync(full, 'utf8');
  let after = before;
  for (const [find, replace] of rules) after = after.replace(find, replace);
  if (after === before) {
    console.log(`unchanged ${file} (already fixed?)`);
    continue;
  }
  fs.writeFileSync(full + '.bak', before); // keeps your original next to it
  fs.writeFileSync(full, after);
  console.log(`fixed     ${file}   (backup: ${path.basename(full)}.bak)`);
}
process.exit(failed ? 1 : 0);
