"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PackageMinus, Pill, Truck, List, BarChart2, Database, Settings, X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) => {
  const pathname = usePathname();
  
  // 🌟 เพิ่ม State ไว้เช็คสิทธิ์ (ค่าเริ่มต้นเป็น admin ป้องกันเมนูหายตอนโหลด)
  const [role, setRole] = useState('admin');

  // 🌟 เปลี่ยนจาก localStorage เป็น sessionStorage ให้สอดคล้องกับหน้า Login
  useEffect(() => {
    const sessionStr = sessionStorage.getItem('farmMedSession');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      setRole(session.role);
    }
  }, []);

  // 🌟 เพิ่ม roles ให้แต่ละเมนู
  const menuItems = [
    { name: 'หน้าหลัก', path: '/', icon: <Home size={20} />, roles: ['admin'] },
    { name: 'อนุมัติ/จ่ายยา', path: '/deduct', icon: <PackageMinus size={20} />, roles: ['admin'] },
    { name: 'เบิกยา', path: '/request', icon: <Pill size={20} />, roles: ['admin', 'staff', 'สัตวบาล', 'พนักงานฟาร์ม'] },
    { name: 'รับยาที่มาใหม่', path: '/receive', icon: <Truck size={20} />, roles: ['admin'] },
    { name: 'รายการทั้งหมด', path: '/inventory', icon: <List size={20} />, roles: ['admin', 'staff', 'สัตวบาล', 'พนักงานฟาร์ม'] },
    { name: 'รายงาน', path: '/report', icon: <BarChart2 size={20} />, roles: ['admin'] },
    { name: 'ข้อมูลยา', path: '/medicine', icon: <Database size={20} />, roles: ['admin'] },
    { name: 'ตั้งค่า', path: '/settings', icon: <Settings size={20} />, roles: ['admin'] },
  ];

  // 🌟 กรองเมนูที่จะแสดงตามสิทธิ์ที่ดึงมา
  const displayMenus = menuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity" onClick={() => setIsOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 flex flex-col flex-shrink-0 w-[260px] h-screen bg-[#1b233a] text-white overflow-hidden transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white lg:hidden z-50">
          <X size={24} />
        </button>

        {/* จุดที่แก้ที่ 1: เพิ่ม relative, z-20, flex-1, overflow-y-auto และ pb-28 เพื่อให้เมนูอยู่เหนือรูปและเลื่อนได้ */}
        <div className="p-4 flex-1 overflow-y-auto relative z-20 pb-28">
          
          <div className="flex items-center gap-3 mb-8 px-2 mt-2">
            <div className="w-10 h-10 bg-pink-200 rounded-full flex items-center justify-center text-xl">🐷</div>
            <div>
              <h1 className="text-xl font-bold tracking-wide">FarmMed</h1>
              <p className="text-[11px] text-gray-400">ระบบบริหารจัดการในฟาร์ม</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {/* 🌟 เปลี่ยนมา map จากตัวแปร displayMenus ที่ผ่านการกรองแล้ว */}
            {displayMenus.map((item, index) => {
              const isActive = pathname === item.path; 
              return (
                <Link
                  href={item.path}
                  key={index}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? 'bg-[#1a56db] text-white font-medium shadow-md' 
                      : 'text-gray-400 hover:bg-[#252f4a] hover:text-white'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* จุดที่แก้ที่ 2: เพิ่ม pointer-events-none ให้คลิกทะลุกรอบข้อความนี้ได้ */}
        <div className="h-40 w-full bg-gradient-to-t from-[#1b233a] via-[#1b233a]/80 to-transparent absolute bottom-0 left-0 flex items-end p-6 z-10 pointer-events-none">
          <div className="text-white">
            <h2 className="text-xl font-bold text-[#c8d45d] drop-shadow-md">สุขภาพดี...</h2>
            <p className="text-sm font-light drop-shadow-md">เริ่มต้นจากการจัดการที่ดี</p>
          </div>
        </div>

      </div>
    </>
  );
};

export default Sidebar;