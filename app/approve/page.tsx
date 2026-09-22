"use client";

import React from 'react';
import { 
  Home, FileText, CheckSquare, History, Package, PieChart, Users, LogOut, 
  Info, Bell, Smile, Pill 
} from 'lucide-react';

export default function AdminApprovalPage() {
  return (
    <div className="flex h-screen bg-[#f8fafc] font-sans">
      
      {/* ================= แถบเมนูด้านซ้าย (Sidebar ธีมสีเข้ม) ================= */}
      <aside className="w-[260px] bg-[#1e293b] text-gray-300 flex flex-col shadow-xl z-20 hidden md:flex">
        
        {/* โลโก้ */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md">
            <Pill size={20} />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">ระบบเบิกจ่ายยา</h1>
            <p className="text-blue-400 text-xs">ฟาร์มสุขใจ</p>
          </div>
        </div>

        {/* โปรไฟล์ผู้ดูแลระบบ */}
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            AD
          </div>
          <div>
            <h2 className="text-white font-bold text-sm">ADMIN</h2>
            <p className="text-xs text-gray-400">ผู้ดูแลระบบ</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] text-green-400">Online</span>
            </div>
          </div>
        </div>

        {/* เมนูนำทาง */}
        <nav className="flex-1 px-4 mt-4 space-y-1 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Home size={18} /> แดชบอร์ด
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <FileText size={18} /> คำขอเบิกยา
          </a>
          
          {/* เมนูที่กำลัง Active (สีน้ำเงิน) */}
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg bg-blue-600 text-white font-medium shadow-md">
            <CheckSquare size={18} /> อนุมัติ/จ่ายยา
          </a>
          
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <History size={18} /> ประวัติการเบิกจ่าย
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Package size={18} /> คลังยาและสต๊อก
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <PieChart size={18} /> รายงาน
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg hover:bg-slate-800 hover:text-white transition-colors">
            <Users size={18} /> จัดการผู้ใช้
          </a>
        </nav>

        {/* ปุ่มออกจากระบบ */}
        <div className="p-4 mb-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-sm rounded-lg text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
            <LogOut size={18} /> ออกจากระบบ
          </a>
        </div>
      </aside>

      {/* ================= พื้นที่เนื้อหาหลัก (Main Content) ================= */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f8fafc]">
        
        {/* แถบหัวเรื่องด้านบน */}
        <header className="bg-white px-8 py-5 border-b border-gray-200 shadow-sm z-10 flex items-center gap-3">
          <h2 className="text-xl font-bold text-gray-800">อนุมัติ / จ่ายยา</h2>
          <span className="bg-orange-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            0
          </span>
        </header>

        {/* พื้นที่เนื้อหาที่เลื่อนได้ */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {/* กล่องคำแนะนำ (Info Box) */}
          <div className="bg-[#eff6ff] border border-blue-100 rounded-xl p-5 mb-8 flex gap-4 items-start shadow-sm">
            <div className="text-blue-500 mt-0.5 bg-blue-100 rounded-full p-1">
              <Info size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-blue-800 font-bold mb-1.5 text-sm">คำแนะนำในการพิจารณาอนุมัติ</h3>
              <p className="text-blue-600 text-sm leading-relaxed">
                กรุณาตรวจสอบความถูกต้องของ <span className="font-bold">"รายการยา"</span> และ <span className="font-bold">"ลายมือชื่อผู้ขอเบิก"</span> ให้ครบถ้วนทุกครั้งก่อนเซ็นอนุมัติ หากพบว่าเอกสารไม่สมบูรณ์หรือสต๊อกยาไม่เพียงพอ ท่านสามารถกดปุ่ม <span className="text-red-500 font-bold">ปฏิเสธ</span> ได้ทันที
              </p>
            </div>
          </div>

          {/* ตารางรายการที่รออนุมัติ */}
          <div className="bg-white border border-orange-100 rounded-xl shadow-sm overflow-hidden">
            
            {/* หัวตาราง */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-orange-50/30">
              <Bell size={18} className="text-orange-500" fill="currentColor" />
              <h3 className="text-orange-600 font-bold text-sm">รายการที่รอการอนุมัติ</h3>
            </div>
            
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-gray-500">
                  <th className="px-6 py-4 font-medium">เลขที่เอกสาร</th>
                  <th className="px-6 py-4 font-medium text-center">ผู้ขอเบิก</th>
                  <th className="px-6 py-4 font-medium text-center">แผนก/ฟาร์ม</th>
                  <th className="px-6 py-4 font-medium text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody>
                {/* สถานะไม่มีข้อมูล (Empty State) */}
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Smile size={56} className="mb-4 text-gray-300" strokeWidth={1.5} />
                      <p className="text-sm font-medium">ไม่มีรายการรอดำเนินการ</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </main>

    </div>
  );
}