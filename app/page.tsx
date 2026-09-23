"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 🌟 เพิ่ม import useRouter
import { supabase } from '../lib/supabase'; // ตรวจสอบ path ให้ตรงกับโปรเจกต์ของคุณ
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { 
  Pill, Package, ClipboardEdit, Truck, 
  ArrowRight, ArrowDownLeft, ArrowUpRight, Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter(); // 🌟 เรียกใช้งาน router
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // States สำหรับเก็บข้อมูลสถิติและตาราง
  const [stats, setStats] = useState({
    totalMeds: 0,
    lowStock: 0,
    pendingRequests: 0,
    recentReceives: 0
  });
  const [inventorySnapshot, setInventorySnapshot] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // 🌟 ระบบดักจับการล็อกอิน (Auth Guard)
  useEffect(() => {
    const session = sessionStorage.getItem('farmMedSession');
    if (!session) {
      router.push('/login'); // ถ้าไม่มีเซสชัน ให้เด้งไปหน้า login ทันที
    }
  }, [router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // 1. ดึงข้อมูลสต๊อกยาทั้งหมด
        const { data: invData } = await supabase.from('inventory').select('*');
        let total = 0;
        let low = 0;
        if (invData) {
          total = invData.length;
          // นับยาที่สต๊อก <= 10 หรือสถานะไม่ใช่ปกติ
          low = invData.filter(item => item.stock <= 10 || item.status !== 'ปกติ').length;
          // โชว์แค่ 5 รายการแรกในตาราง
          setInventorySnapshot(invData.slice(0, 5));
        }

        // 2. ดึงจำนวนคำขอที่รออนุมัติ
        const { data: reqData } = await supabase.from('requests').select('*').eq('status', 'รออนุมัติ');
        const pending = reqData ? reqData.length : 0;

        // 3. ดึงประวัติกิจกรรมล่าสุด
        const { data: actData } = await supabase.from('activities').select('*').order('id', { ascending: false });
        let receives = 0;
        if (actData) {
          // นับจำนวนครั้งที่มีการรับยาเข้า
          receives = actData.filter(act => act.action === 'รับยาเข้าคลัง').length;
          // โชว์กิจกรรมล่าสุด 5 รายการ
          setRecentActivities(actData.slice(0, 5));
        }

        // อัปเดตตัวเลขการ์ดสถิติ
        setStats({
          totalMeds: total,
          lowStock: low,
          pendingRequests: pending,
          recentReceives: receives
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // เช็คก่อนว่ามีเซสชันถึงจะดึงข้อมูล เพื่อป้องกัน Error กรณีโดนเตะไปหน้า Login
    if (sessionStorage.getItem('farmMedSession')) {
      fetchDashboardData();
    }
  }, []);

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">ภายในฟาร์มสุกร</h1>
                <p className="text-sm font-medium text-slate-500 mt-2 bg-white px-4 py-1.5 rounded-full inline-block border border-slate-100 shadow-sm">
                  " ควบคุมสต๊อก เบิกยาได้ง่าย ใช้ภายในฟาร์ม "
                </p>
              </div>
              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-xl border border-green-100 shadow-sm">
                <CheckCircle2 size={18} className="text-green-500" />
                <span className="font-bold text-sm">ยาสัตว์ปลอดภัย <span className="font-normal opacity-80">ฟาร์มแข็งแรง</span></span>
              </div>
            </div>

            {/* 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-blue-600 font-bold text-sm mb-1">รายการยาทั้งหมด</p>
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.totalMeds}</h3>}
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Pill size={24} />
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-green-600 font-bold text-sm mb-1">ยาใกล้หมดสต๊อก</p>
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.lowStock}</h3>}
                </div>
                <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-500">
                  <Package size={24} />
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-orange-600 font-bold text-sm mb-1">รออนุมัติเบิกยา</p>
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.pendingRequests}</h3>}
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                  <ClipboardEdit size={24} />
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-purple-600 font-bold text-sm mb-1">รับยาที่มาใหม่</p>
                  {isLoading ? <Loader2 className="animate-spin text-slate-300" size={24}/> : <h3 className="text-3xl font-black text-slate-800">{stats.recentReceives}</h3>}
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                  <Truck size={24} />
                </div>
              </div>
            </div>

            {/* Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Table: สต๊อกยาคงเหลือ */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <Package className="text-slate-400" size={20}/> สต๊อกยาคงเหลือ
                  </h3>
                  <Link href="/medicine" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight size={16}/>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50/50">
                      <tr className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                        <th className="py-4 px-6 text-center w-16">ลำดับ</th>
                        <th className="py-4 px-6">ชื่อยา / วัคซีน</th>
                        <th className="py-4 px-6 text-center">หน่วย</th>
                        <th className="py-4 px-6 text-right">คงเหลือ</th>
                        <th className="py-4 px-6 text-center">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                         <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-bold"><Loader2 className="animate-spin inline mr-2"/>กำลังโหลด...</td></tr>
                      ) : inventorySnapshot.length === 0 ? (
                         <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-bold">ไม่มีข้อมูลในคลัง</td></tr>
                      ) : (
                        inventorySnapshot.map((item, index) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-4 px-6 text-center font-bold text-slate-400">{index + 1}</td>
                            <td className="py-4 px-6 font-extrabold text-slate-800">{item.name}</td>
                            <td className="py-4 px-6 text-center font-medium text-slate-500">{item.unit}</td>
                            <td className="py-4 px-6 text-right font-black text-blue-600 text-base">{item.stock}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                item.stock > 10 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {item.stock > 0 && item.stock <= 10 ? 'ใกล้หมด' : item.stock === 0 ? 'สต๊อกต่ำ' : 'ปกติ'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right List: รายการล่าสุด */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2">
                    <ClipboardEdit className="text-slate-400" size={20}/> รายการล่าสุด
                  </h3>
                  <Link href="/request" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    ดูทั้งหมด <ArrowRight size={16}/>
                  </Link>
                </div>
                
                <div className="p-2 flex-1 overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-300" size={32}/></div>
                  ) : recentActivities.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 font-bold text-sm">ยังไม่มีกิจกรรมล่าสุด</div>
                  ) : (
                    <div className="space-y-1">
                      {recentActivities.map((act) => (
                        <div key={act.id} className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                          <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            act.type === 'add' ? 'bg-green-100 text-green-600' : 
                            act.action.includes('ตัด') ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                          }`}>
                            {act.type === 'add' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-slate-800 text-sm truncate">{act.action} {act.detail.split(' จำนวน')[0]}</p>
                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 truncate">
                              <span className="font-bold text-slate-600">{act.user_name}</span> 
                              <span>•</span> 
                              {act.date} {act.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

// Dummy component สำหรับ CheckCircle2 ตรง Header
function CheckCircle2({ size, className }: { size: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
      <polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
  );
}