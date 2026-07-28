import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatINR } from '../lib/utils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f43f5e', '#64748b'];

export default function AnalyticsTab({ transactions }) {
  const expenses = transactions.filter(t => t.type !== 'income');
  
  // Category Breakdown for Pie Chart
  const categoryDataRaw = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {});
  
  const categoryData = Object.keys(categoryDataRaw).map(key => ({
    name: key,
    value: categoryDataRaw[key]
  })).sort((a, b) => b.value - a.value);

  // Income vs Expense for Bar Chart
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
  
  const comparisonData = [
    { name: 'Income', amount: totalIncome, fill: '#10b981' },
    { name: 'Expense', amount: totalExpense, fill: '#f43f5e' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* Category Breakdown */}
      <div className="bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-700/50">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <PieChartIcon className="w-5 h-5 text-purple-400" />
          Spending by Category
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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

      {/* Income vs Expense */}
      <div className="bg-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl border border-slate-700/50">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center text-blue-400 font-bold">VS</div>
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
  );
}
