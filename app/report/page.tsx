"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { Activity, DollarSign, Inbox, Package, Loader2 } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function ReportPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับเก็บข้อมูลสถิติ
  const [stats, setStats] = useState({
    totalDeductCount: 0,
    totalValue: 0,
    totalAddCount: 0,
    inStockItems: 0
  });

  const [topItems, setTopItems] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      try {
        // 1. ดึงข้อมูลประวัติกิจกรรม (รับเข้า/เบิกออก)
        const { data: actData } = await supabase.from('activities').select('*');
        // 2. ดึงข้อมูลสต๊อกยาปัจจุบัน
        const { data: invData } = await supabase.from('inventory').select('*');

        if (actData && invData) {
          // --- คำนวณสถิติ Card ด้านบน ---
          const deducts = actData.filter(a => a.type === 'deduct');
          const adds = actData.filter(a => a.type === 'add');
          const inStock = invData.filter(i => i.stock > 0).length;
          
          // คำนวณมูลค่าจำลอง (เนื่องจากฐานข้อมูลยังไม่มีคอลัมน์ราคา เราจึงเอาจำนวนบิล * 250 บาทเป็นค่าเฉลี่ยไปก่อน)
          const mockTotalValue = deducts.length * 250;

          setStats({
            totalDeductCount: deducts.length,
            totalValue: mockTotalValue,
            totalAddCount: adds.length,
            inStockItems: inStock
          });

          // --- คำนวณ Top 5 สินค้าที่ใช้มากที่สุด ---
          const usageMap: Record<string, number> = {};
          deducts.forEach(act => {
            // ดึงชื่อยาและจำนวนออกจาก detail (เช่น "Amoxycillin จำนวน 5 ขวด")
            const match = act.detail.match(/(.+) จำนวน (\d+)/);
            if (match) {
              const name = match[1].trim();
              const amount = parseInt(match[2]);
              usageMap[name] = (usageMap[name] || 0) + amount;
            }
          });

          const sortedTopItems = Object.entries(usageMap)
            .sort((a, b) => b[1] - a[1]) // เรียงจากมากไปน้อย
            .slice(0, 5) // เอาแค่ 5 อันดับแรก
            .map(([name, amount]) => ({ name, amount }));
          
          setTopItems(sortedTopItems);

          // --- คำนวณข้อมูลกราฟ 7 วันล่าสุด ---
          const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            // แปลงเป็นฟอร์แมต "16 ส.ค." เพื่อเทียบกับข้อมูลใน activities
            return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
          });

          const newChartData = last7Days.map(dateLabel => {
            // หายอดเบิกของวันนั้นๆ
            const dayActs = deducts.filter(a => a.date.includes(dateLabel));
            
            let ant = 0; let vac = 0; let vit = 0;
            
            dayActs.forEach(act => {
              const match = act.detail.match(/(.+) จำนวน (\d+)/);
              if (match) {
                const name = match[1].trim();
                const amount = parseInt(match[2]);
                
                // ค้นหาหมวดหมู่ยาจาก inventory
                const invItem = invData.find(i => i.name === name);
                const category = invItem ? invItem.category : '';

                // จัดกลุ่มตามสีของกราฟ
                if (category.includes('วัคซีน')) vac += amount;
                else if (category.includes('ยารักษาโรค') || category.includes('ปฏิชีวนะ')) ant += amount;
                else vit += amount; // พวกวิตามิน สารเคมี และอุปกรณ์
              }
            });

            return {
              name: dateLabel,
              'ยาปฏิชีวนะ': ant,
              'วัคซีน': vac,
              'วิตามิน/อื่นๆ': vit
            };
          });

          setChartData(newChartData);
        }
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Activity size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">ยอดใช้ยารวม</span>
                </div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.totalDeductCount}</h3>}
                  <span className="text-sm font-medium text-slate-400">รายการ</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                    <DollarSign size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">มูลค่าการใช้ยา (ประมาณการ)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.totalValue.toLocaleString()}</h3>}
                  <span className="text-sm font-medium text-slate-400">บาท</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Inbox size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">รับยาเข้าคลัง</span>
                </div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.totalAddCount}</h3>}
                  <span className="text-sm font-medium text-slate-400">รายการ</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                    <Package size={20} />
                  </div>
                  <span className="text-sm font-bold text-slate-500">คงเหลือในสต๊อก</span>
                </div>
                <div className="flex items-baseline gap-2">
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.inStockItems}</h3>}
                  <span className="text-sm font-medium text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            {/* Chart & Table Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Bar Chart (แนวโน้มการใช้ยา) */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="font-extrabold text-slate-800 mb-6">แนวโน้มการใช้ยา (7 วันล่าสุด)</h3>
                <div className="flex-1 w-full h-[300px] min-h-[300px]">
                  {isLoading ? (
                    <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-slate-300" size={40}/></div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px', fontWeight: 'bold' }} />
                        <Bar dataKey="ยาปฏิชีวนะ" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="วัคซีน" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={12} />
                        <Bar dataKey="วิตามิน/อื่นๆ" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Top 5 Items Table */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                <h3 className="font-extrabold text-slate-800 mb-6">สินค้าที่ใช้มากที่สุด</h3>
                <div className="flex-1">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="text-slate-400 font-bold text-xs border-b border-slate-100">
                        <th className="pb-3 w-12 text-center">ลำดับ</th>
                        <th className="pb-3">ชื่อยา</th>
                        <th className="pb-3 text-right">จำนวน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                         <tr><td colSpan={3} className="text-center py-10"><Loader2 className="animate-spin inline text-slate-300" size={24}/></td></tr>
                      ) : topItems.length === 0 ? (
                         <tr><td colSpan={3} className="text-center py-10 text-slate-400 font-bold">ยังไม่มีข้อมูลการเบิกจ่าย</td></tr>
                      ) : (
                        topItems.map((item, index) => (
                          <tr key={index} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 text-center">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                index === 0 ? 'bg-amber-100 text-amber-600' : 
                                index === 1 ? 'bg-slate-100 text-slate-600' : 
                                index === 2 ? 'bg-orange-50 text-orange-600' : 'text-slate-400'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-4 font-bold text-slate-700">{item.name}</td>
                            <td className="py-4 text-right font-black text-blue-600">{item.amount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}