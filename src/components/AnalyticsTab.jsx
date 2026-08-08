import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon, BarChart3, Percent, Layers, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { formatINR } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'];

export default function AnalyticsTab({ transactions }) {
  const expenses = transactions.filter(t => t.type !== 'income');
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  
  const savingsRate = totalIncome > 0 ? Math.max(0, ((netSavings / totalIncome) * 100)).toFixed(1) : '0.0';
  const expenseRatio = totalIncome > 0 ? Math.min(100, ((totalExpense / totalIncome) * 100)).toFixed(1) : '0.0';

  // Category Breakdown for Pie Chart & Table
  const categoryDataRaw = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  const categoryData = Object.keys(categoryDataRaw).map((key, index) => {
    const amount = categoryDataRaw[key];
    const percentage = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0.0';
    const count = expenses.filter(t => t.category === key).length;
    return {
      name: key,
      value: amount,
      percentage: parseFloat(percentage),
      count,
      color: COLORS[index % COLORS.length]
    };
  }).sort((a, b) => b.value - a.value);

  const comparisonData = [
    { name: 'Income', amount: totalIncome, fill: '#10b981' },
    { name: 'Expense', amount: totalExpense, fill: '#f43f5e' }
  ];

  return (
    <div className="space-y-8">
      
      {/* Percentage KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Savings Rate */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Savings Rate</p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-amount">{savingsRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">of income saved</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Expense Ratio */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Expense Ratio</p>
            <h3 className="text-2xl font-extrabold text-rose-400 font-amount">{expenseRatio}%</h3>
            <p className="text-xs text-slate-500 mt-1">of income spent</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Top Category Share */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Top Category Share</p>
            <h3 className="text-2xl font-extrabold text-purple-400 font-amount">
              {categoryData.length > 0 ? `${categoryData[0].percentage}%` : '0%'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate max-w-[120px]">
              {categoryData.length > 0 ? categoryData[0].name : 'No expenses'}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
            <Percent className="w-6 h-6" />
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-[#111827] hover:bg-[#151E32] rounded-2xl p-5 shadow-xl border border-slate-800/80 transition-all flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Net Savings</p>
            <h3 className={`text-2xl font-extrabold font-amount ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatINR(netSavings)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">this month</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
            <Wallet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Breakdown */}
        <div className="bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            Spending Distribution
          </h2>
          
          {categoryData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No expenses recorded this month
            </div>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => formatINR(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    wrapperStyle={{ paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Income vs Expense Bar Chart */}
        <div className="bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-700/50">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Income vs Expenses
          </h2>
          
          {(totalIncome === 0 && totalExpense === 0) ? (
            <div className="h-64 flex items-center justify-center text-slate-500">
              No data for this month
            </div>
          ) : (
            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} />
                  <YAxis stroke="#94a3b8" tick={{fill: '#94a3b8'}} axisLine={false} tickLine={false} tickFormatter={(val) => formatINR(val)} />
                  <Tooltip 
                    cursor={{fill: '#334155'}}
                    formatter={(value) => formatINR(value)}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={60} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* Percentage Breakdown Table */}
      <div className="bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-700/50 overflow-hidden">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          Category Analysis & Percentage Share
        </h2>

        {categoryData.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            No expenses found for table analysis.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Transactions</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">% Share</th>
                  <th className="py-3 px-4 min-w-[180px]">Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-sm font-medium">
                {categoryData.map((cat) => (
                  <tr key={cat.name} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4 flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                      <span className="font-semibold text-slate-200">{cat.name}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400">{cat.count} txns</td>
                    <td className="py-4 px-4 font-bold text-slate-100">{formatINR(cat.value)}</td>
                    <td className="py-4 px-4 font-bold text-emerald-400">{cat.percentage}%</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ width: `${Math.max(cat.percentage, 2)}%`, backgroundColor: cat.color }} 
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
