"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, ChevronDown, LogOut, Settings, ShieldAlert, User as UserIcon } from 'lucide-react';

// กำหนด Type ของ Props ที่รับเข้ามา
interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // State เก็บข้อมูลผู้ใช้ที่ล็อกอินอยู่
  const [currentUser, setCurrentUser] = useState<any>(null);

  // 1. โหลดข้อมูลผู้ใช้จาก sessionStorage และเชื่อมกับ farmMedUsers เพื่อให้อัปเดตสดๆ
  useEffect(() => {
    const userStr = sessionStorage.getItem('farmMedSession');
    if (userStr) {
      const session = JSON.parse(userStr);
      
      // 🌟 ดึงข้อมูลล่าสุดจากรายชื่อผู้ใช้ทั้งหมด (farmMedUsers) เพื่อให้เฟส/เล้าอัปเดตตามทันที
      const savedUsers = localStorage.getItem('farmMedUsers');
      let currentDept = session.department;
      
      if (savedUsers) {
        const usersList = JSON.parse(savedUsers);
        const matchedUser = usersList.find((u: any) => u.name === session.name || u.username === session.username);
        if (matchedUser && matchedUser.department) {
          currentDept = matchedUser.department;
        }
      }

      setCurrentUser({
        name: session.name,
        role: session.role === 'admin' ? 'Admin / ผู้จัดการ' : (currentDept || 'สัตวบาล'),
        isAdmin: session.role === 'admin'
      });
    } else {
      // ถ้าไม่มีคนล็อกอิน ให้โชว์ค่า Default
      setCurrentUser({ 
        name: 'ผู้ดูแลระบบ', 
        role: 'Admin / ผู้จัดการ',
        isAdmin: true
      });
    }
  }, []);

  // 2. ฟังก์ชันปิด Dropdown เมื่อคลิกที่อื่นบนหน้าจอ
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. ฟังก์ชันออกจากระบบ
  const handleLogout = () => {
    sessionStorage.removeItem('farmMedSession');
    router.push('/login');
  };

  // เช็คว่าเป็น Admin หรือไม่ เพื่อโชว์ไอคอนโล่ตามรูป
  const isAdmin = currentUser?.isAdmin;

  return (
    <header className="bg-white h-20 border-b border-slate-100 flex items-center justify-between px-4 sm:px-8 z-20 flex-shrink-0">
      
      {/* ฝั่งซ้าย: ปุ่มเมนูสำหรับมือถือ */}
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors lg:hidden">
          <Menu size={24} />
        </button>
      </div>

      {/* ฝั่งขวา: แจ้งเตือน & โปรไฟล์ผู้ใช้ */}
      <div className="flex items-center gap-3 sm:gap-6">
        
        {/* ปุ่มกระดิ่งแจ้งเตือน */}
        <button className="relative p-2.5 text-slate-400 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-colors">
          <Bell size={20} />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>

        {/* ================= Dropdown โปรไฟล์ผู้ใช้ ================= */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 pr-3 rounded-2xl transition-colors text-left"
          >
            {/* รูป Avatar (เปลี่ยนตามสิทธิ์) */}
            <div className={`w-11 h-11 rounded-full flex items-center justify-center border-2 border-slate-50 shadow-sm transition-transform hover:scale-105 ${
              isAdmin ? 'bg-[#1a233a] text-yellow-400' : 'bg-blue-600 text-white'
            }`}>
              {isAdmin ? <ShieldAlert size={20} strokeWidth={2.5} /> : <UserIcon size={20} strokeWidth={2.5} />}
            </div>

            {/* ชื่อและตำแหน่ง */}
            <div className="hidden sm:block">
              <p className="text-sm font-extrabold text-slate-800 leading-tight">{currentUser?.name}</p>
              <p className="text-[11px] font-bold text-blue-600 mt-0.5">{currentUser?.role}</p>
            </div>

            {/* ลูกศรชี้ลง */}
            <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 hidden sm:block ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* เมนูที่เด้งลงมา (Dropdown Menu) */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
              
              {/* โชว์ชื่อในมือถือ (เพราะมือถือซ่อนชื่อด้านบนไว้) */}
              <div className="p-4 border-b border-slate-50 bg-slate-50/50 sm:hidden">
                 <p className="text-sm font-extrabold text-slate-800">{currentUser?.name}</p>
                 <p className="text-[11px] font-bold text-blue-600 mt-0.5">{currentUser?.role}</p>
              </div>

              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left group">
                  <Settings size={18} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
                  ตั้งค่าบัญชี
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-left mt-1 group"
                >
                  <LogOut size={18} className="text-red-400 group-hover:text-red-600 transition-colors" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}