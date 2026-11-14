import { format } from 'date-fns';
import { formatINR } from './utils';

/**
 * Generates an Executive PDF Statement formatted for standard A4 paper.
 * Opens in a clean printable window ready for instant Save-As-PDF or printing.
 */
export function generateExecutivePdfStatement({
  user = {},
  currentDate = new Date(),
  transactions = [],
  accounts = [],
  accountBalances = {},
  totalIncome = 0,
  totalExpense = 0,
  netBalance = 0
}) {
  const periodLabel = format(currentDate, 'MMMM yyyy');
  const generatedAt = format(new Date(), 'dd MMMM yyyy, hh:mm a');
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Account Holder';
  const userEmail = user?.email || 'N/A';

  // Compute Category Distribution
  const categoryMap = {};
  transactions.forEach(t => {
    if (t.type === 'expense' && !t.isTransfer) {
      const cat = t.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + (Number(t.amount) || 0);
    }
  });

  const categoryList = Object.entries(categoryMap)
    .map(([cat, amount]) => ({
      category: cat,
      amount,
      percentage: totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : 0
    }))
    .sort((a, b) => b.amount - a.amount);

  const savingsRate = totalIncome > 0 
    ? Math.max(0, (((totalIncome - totalExpense) / totalIncome) * 100)).toFixed(1) 
    : 0;

  // Build clean HTML print window
  const printContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>ExpenseTracker Executive Statement - ${periodLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 16mm 16mm 16mm 16mm;
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 11pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .font-mono {
      font-family: 'JetBrains Mono', monospace;
    }

    .header-bar {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .brand-title {
      font-size: 20pt;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }

    .brand-sub {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
      margin-top: 2px;
    }

    .doc-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 4px 10px;
      border-radius: 4px;
      margin-bottom: 6px;
    }

    .meta-box {
      text-align: right;
      font-size: 9pt;
      color: #475569;
    }

    /* Executive KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }

    .kpi-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 12px;
    }

    .kpi-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #64748b;
      margin-bottom: 4px;
    }

    .kpi-value {
      font-size: 14pt;
      font-weight: 800;
      font-family: 'JetBrains Mono', monospace;
      color: #0f172a;
    }

    .kpi-sub {
      font-size: 7.5pt;
      color: #94a3b8;
      margin-top: 2px;
    }

    .text-emerald { color: #059669; }
    .text-rose { color: #e11d48; }
    .text-indigo { color: #4f46e5; }

    /* Section Styles */
    .section-title {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #1e293b;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-tag {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      margin-bottom: 16px;
    }

    th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 7.5pt;
      padding: 8px 10px;
      border: 1px solid #e2e8f0;
      text-align: left;
    }

    th.text-right, td.text-right {
      text-align: right;
    }

    td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }

    tr:nth-child(even) td {
      background: #fafafa;
    }

    .cat-bar-bg {
      background: #e2e8f0;
      border-radius: 4px;
      height: 6px;
      width: 100%;
      overflow: hidden;
      margin-top: 4px;
    }

    .cat-bar-fill {
      background: #0f172a;
      height: 100%;
      border-radius: 4px;
    }

    /* Footer */
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 10px;
      margin-top: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 7.5pt;
      color: #94a3b8;
    }

    @media print {
      body {
        margin: 0;
        background: transparent;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header-bar">
    <div>
      <div class="doc-badge">Executive Financial Statement</div>
      <div class="brand-title">ExpenseTracker</div>
      <div class="brand-sub">Comprehensive Cashflow, Ledger & Asset Position</div>
    </div>
    <div class="meta-box">
      <div><strong>Statement Period:</strong> ${periodLabel}</div>
      <div><strong>Prepared For:</strong> ${userName} (${userEmail})</div>
      <div><strong>Generated On:</strong> ${generatedAt}</div>
    </div>
  </div>

  <!-- Executive KPIs -->
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Inflow</div>
      <div class="kpi-value text-emerald">${formatINR(totalIncome)}</div>
      <div class="kpi-sub">Monthly Earned / Deposited</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Total Outflow</div>
      <div class="kpi-value text-rose">${formatINR(totalExpense)}</div>
      <div class="kpi-sub">Operating & Discretionary</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Net Surplus / Savings</div>
      <div class="kpi-value ${netBalance >= 0 ? 'text-emerald' : 'text-rose'}">${formatINR(netBalance)}</div>
      <div class="kpi-sub">${savingsRate}% Savings Rate</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Bank Accounts</div>
      <div class="kpi-value text-indigo">${accounts.length}</div>
      <div class="kpi-sub">Active Liquid Nodes</div>
    </div>
  </div>

  <!-- Accounts Position Table -->
  <div class="section-title">
    <span>Liquid Bank Balances</span>
    <span class="section-tag">${accounts.length} Accounts Reconciled</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Account Name</th>
        <th>Type</th>
        <th class="text-right">Opening Balance</th>
        <th class="text-right">Current Available Balance</th>
      </tr>
    </thead>
    <tbody>
      ${accounts.map(acc => {
        const bal = accountBalances[acc.id] ?? (Number(acc.openingBalance) || 0);
        return `
          <tr>
            <td><strong>${acc.name}</strong> ${acc.isDefault ? '<span style="font-size:7pt; background:#e0f2fe; color:#0369a1; padding:1px 5px; border-radius:3px;">PRIMARY</span>' : ''}</td>
            <td style="text-transform: capitalize;">${acc.type}</td>
            <td class="text-right font-mono">${formatINR(Number(acc.openingBalance) || 0)}</td>
            <td class="text-right font-mono"><strong>${formatINR(bal)}</strong></td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Category Distribution -->
  ${categoryList.length > 0 ? `
    <div class="section-title">
      <span>Top Spending Categories</span>
      <span class="section-tag">${categoryList.length} Categories</span>
    </div>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th style="width: 35%;">Proportion</th>
          <th class="text-right">Share (%)</th>
          <th class="text-right">Total Spent</th>
        </tr>
      </thead>
      <tbody>
        ${categoryList.slice(0, 7).map(item => `
          <tr>
            <td><strong>${item.category}</strong></td>
            <td>
              <div class="cat-bar-bg">
                <div class="cat-bar-fill" style="width: ${item.percentage}%;"></div>
              </div>
            </td>
            <td class="text-right font-mono">${item.percentage}%</td>
            <td class="text-right font-mono"><strong>${formatINR(item.amount)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : ''}

  <!-- Itemized Transaction Ledger -->
  <div class="section-title">
    <span>Itemized Transaction Ledger</span>
    <span class="section-tag">${transactions.length} Records</span>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width: 12%;">Date</th>
        <th style="width: 38%;">Description</th>
        <th style="width: 20%;">Category</th>
        <th style="width: 15%;">Bank / Wallet</th>
        <th class="text-right" style="width: 15%;">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactions.length === 0 ? `
        <tr><td colspan="5" style="text-align:center; padding:14px; color:#94a3b8;">No transactions found for this period.</td></tr>
      ` : transactions.map(t => {
        const isInc = t.type === 'income';
        const isTrf = t.type === 'transfer' || t.isTransfer;
        const color = isInc ? '#059669' : isTrf ? '#4f46e5' : '#e11d48';
        const sign = isInc ? '+' : isTrf ? '↔' : '-';

        return `
          <tr>
            <td class="font-mono">${t.date || '-'}</td>
            <td><strong>${t.description || (isTrf ? 'Account Transfer' : 'Expense')}</strong></td>
            <td>${t.category || (isTrf ? 'Transfer' : 'General')}</td>
            <td>${t.accountName || (isTrf ? `${t.fromAccountName || 'Bank'} → ${t.toAccountName || 'Bank'}` : 'Primary')}</td>
            <td class="text-right font-mono" style="color: ${color}; font-weight: 700;">
              ${sign} ${formatINR(t.amount)}
            </td>
          </tr>
        `;
      }).join('')}
    </tbody>
  </table>

  <!-- Confidentiality Footer -->
  <div class="footer">
    <span>CONFIDENTIAL & PROPRIETARY — Generated via ExpenseTracker Intelligence Suite</span>
    <span>Page 1 of 1 • Valid for Financial Planning</span>
  </div>

  <script>
    window.addEventListener('load', () => {
      setTimeout(() => {
        window.print();
      }, 400);
    });
  </script>
</body>
</html>
  `;

  // Open clean printable window
  const printWindow = window.open('', '_blank', 'width=900,height=800');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
  } else {
    alert('Please allow popups for this site to generate the Executive PDF Statement.');
  }
}
