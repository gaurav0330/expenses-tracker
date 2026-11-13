import { useState } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Sector
} from 'recharts';
import { 
  PieChart as PieChartIcon, BarChart3, Percent, Layers, 
  TrendingUp, TrendingDown, Wallet, Sparkles, ArrowUpRight, ArrowDownRight, Tag
} from 'lucide-react';
import { formatINR } from '../lib/utils';

// Premium Theme Color Palette
const COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Bright Blue
  '#8b5cf6', // Purple/Violet
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#14b8a6', // Teal
  '#64748b'  // Slate
];

// Active shape renderer for interactive Donut chart slice hover
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value, percentage } = props;

  return (
    <g>
      <text x={cx} y={cy - 12} textAnchor="middle" fill="#94a3b8" className="text-xs font-semibold uppercase tracking-wider">
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#f8fafc" className="text-lg font-extrabold font-amount">
        {formatINR(value)}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill={fill} className="text-xs font-bold">
        {percentage}% share
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        cornerRadius={6}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={fill}
        opacity={0.35}
      />
    </g>
  );
};

// Custom Glassmorphic Tooltip for Bar Chart
const CustomBarTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isIncome = data.name === 'Income';
    return (
      <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-1">
        <p className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
          <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-400' : 'bg-rose-400'}`} />
          {data.name} Total
        </p>
        <p className={`text-lg font-extrabold font-amount ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatINR(data.amount)}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Tooltip for Category Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#0f172a] p-3.5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-1">
        <p className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
          {data.name}
        </p>
        <p className="text-lg font-extrabold text-white font-amount">
          {formatINR(data.value)}
        </p>
        <p className="text-xs text-slate-400 font-medium">
          {data.percentage}% of total expenses ({data.count} txns)
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsTab({ transactions }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Internal bank-to-bank transfers are excluded from expenses & income analytics
  const expenses = transactions.filter(t => t.type === 'expense');
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
    { name: 'Income', amount: totalIncome, fill: 'url(#incomeGrad)' },
    { name: 'Expense', amount: totalExpense, fill: 'url(#expenseGrad)' }
  ];

  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  return (
    <div className="space-y-8">
      
      {/* Percentage KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Savings Rate Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] hover:to-[#1e293b]/90 rounded-2xl p-5 shadow-xl border border-slate-800/80 hover:border-emerald-500/30 transition-all flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Savings Rate
            </p>
            <h3 className="text-2xl font-extrabold text-emerald-400 font-amount">{savingsRate}%</h3>
            <p className="text-xs text-slate-500 mt-1">of monthly income saved</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        {/* Expense Ratio Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] hover:to-[#1e293b]/90 rounded-2xl p-5 shadow-xl border border-slate-800/80 hover:border-rose-500/30 transition-all flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
              Expense Ratio
            </p>
            <h3 className="text-2xl font-extrabold text-rose-400 font-amount">{expenseRatio}%</h3>
            <p className="text-xs text-slate-500 mt-1">of monthly income spent</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl group-hover:scale-110 transition-transform">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        {/* Top Category Share Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] hover:to-[#1e293b]/90 rounded-2xl p-5 shadow-xl border border-slate-800/80 hover:border-purple-500/30 transition-all flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-purple-400" />
              Top Category Share
            </p>
            <h3 className="text-2xl font-extrabold text-purple-400 font-amount">
              {categoryData.length > 0 ? `${categoryData[0].percentage}%` : '0%'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 truncate max-w-[120px] font-semibold">
              {categoryData.length > 0 ? categoryData[0].name : 'No expenses'}
            </p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        {/* Net Savings Card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1e293b] hover:to-[#1e293b]/90 rounded-2xl p-5 shadow-xl border border-slate-800/80 hover:border-cyan-500/30 transition-all flex items-center justify-between group">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-cyan-400" />
              Net Savings
            </p>
            <h3 className={`text-2xl font-extrabold font-amount ${netSavings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatINR(netSavings)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">net surplus this month</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Category Spending Donut Chart */}
        <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <PieChartIcon className="w-5 h-5 text-purple-400" />
              Spending Distribution
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
              {categoryData.length} Categories
            </span>
          </div>
          
          {categoryData.length === 0 ? (
            <div className="h-72 flex items-center justify-center text-slate-500 text-sm font-medium">
              No expense transactions recorded for this period
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-72 w-full relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      activeIndex={activeIndex}
                      activeShape={renderActiveShape}
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                      onMouseEnter={onPieEnter}
                    >
                      {categoryData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          className="transition-all duration-300 cursor-pointer hover:opacity-90"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Interactive Color Legend */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-slate-800/80">
                {categoryData.map((item, idx) => (
                  <button
                    key={item.name}
                    onClick={() => setActiveIndex(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      activeIndex === idx 
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-md scale-105' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                    <span className="text-[10px] text-slate-500 font-amount">({item.percentage}%)</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Income vs Expense Gradient Bar Chart */}
        <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              Income vs Expenses Breakdown
            </h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              Cashflow Comparison
            </span>
          </div>
          
          {(totalIncome === 0 && totalExpense === 0) ? (
            <div className="h-72 flex items-center justify-center text-slate-500 text-sm font-medium">
              No cashflow data available for this month
            </div>
          ) : (
            <div className="h-72 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                      <stop offset="100%" stopColor="#e11d48" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    tick={{ fill: '#64748b', fontSize: 11 }} 
                    axisLine={false} 
                    tickLine={false} 
                    tickFormatter={(val) => `₹${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} 
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)', radius: 12 }}
                    content={<CustomBarTooltip />}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[12, 12, 0, 0]} 
                    maxBarSize={70} 
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                  />
                </BarChart>
              </ResponsiveContainer>

              {/* Cashflow Summary Footer Pill */}
              <div className="flex items-center justify-around bg-slate-900/80 p-3 rounded-2xl border border-slate-800/80 mt-2 text-xs font-semibold">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-slate-400">Income:</span>
                  <span className="text-emerald-400 font-bold font-amount">{formatINR(totalIncome)}</span>
                </div>
                <div className="h-4 w-px bg-slate-800" />
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="text-slate-400">Expense:</span>
                  <span className="text-rose-400 font-bold font-amount">{formatINR(totalExpense)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Percentage Breakdown Analysis Table */}
      <div className="bg-[#111827] rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-800/80 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <Layers className="w-5 h-5 text-emerald-400" />
            Category Expense Breakdown & Distribution
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Sorted by highest total expenditure
          </span>
        </div>

        {categoryData.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm font-medium">
            No expenses found for detailed category analysis.
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Txns</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">% Share</th>
                  <th className="py-3 px-4 min-w-[200px]">Visual Distribution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-medium">
                {categoryData.map((cat, idx) => (
                  <tr 
                    key={cat.name} 
                    onClick={() => setActiveIndex(idx)}
                    className={`group hover:bg-slate-900/80 transition-colors cursor-pointer ${
                      activeIndex === idx ? 'bg-slate-900/60' : ''
                    }`}
                  >
                    <td className="py-4 px-4 flex items-center gap-3">
                      <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: cat.color }} />
                      <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{cat.name}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-xs font-semibold">{cat.count} txns</td>
                    <td className="py-4 px-4 font-extrabold text-slate-100 font-amount">{formatINR(cat.value)}</td>
                    <td className="py-4 px-4 font-extrabold text-emerald-400 font-amount">{cat.percentage}%</td>
                    <td className="py-4 px-4">
                      <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
                        <div 
                          className="h-full rounded-full transition-all duration-500" 
                          style={{ 
                            width: `${Math.max(cat.percentage, 3)}%`, 
                            backgroundColor: cat.color,
                            boxShadow: `0 0 10px ${cat.color}40`
                          }} 
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
