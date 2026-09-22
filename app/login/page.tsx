"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, LogIn, ShieldCheck, Loader2, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      // 1. ดึงรายชื่อผู้ใช้งานทั้งหมดที่บันทึกไว้ในระบบ
      const savedUsers = localStorage.getItem('farmMedUsers');
      let usersList = [];

      if (savedUsers) {
        usersList = JSON.parse(savedUsers);
      } else {
        // ถ้ายังไม่มีข้อมูลเลย ให้สร้างบัญชีตั้งต้นให้ก่อน
        usersList = [
          { id: 1, name: 'ผู้ดูแลระบบ (Admin)', username: 'admin', password: '1234', role: 'ผู้ดูแลระบบ (Admin)', department: 'ส่วนกลาง', status: 'เปิดใช้งาน' },
          { id: 2, name: 'สัตวบาล (พนักงาน)', username: 'staff', password: '1234', role: 'สัตวบาล', department: 'เฟส 1 - ทุกเล้า', status: 'เปิดใช้งาน' },
        ];
        localStorage.setItem('farmMedUsers', JSON.stringify(usersList));
      }

      // 2. ค้นหาบัญชีที่ Username และ Password ตรงกับที่กรอกเข้ามา
      const matchedUser = usersList.find((u: any) => u.username === username && u.password === password);

      if (matchedUser) {
        // 3. ตรวจสอบสถานะว่าโดนระงับการใช้งานหรือไม่
        if (matchedUser.status === 'ระงับการใช้งาน') {
          setError('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
          setIsLoading(false);
          return;
        }

        // 4. แยกสิทธิ์ว่าใครเป็นแอดมิน ใครเป็นพนักงานธรรมดา
        const roleCode = matchedUser.role.includes('Admin') ? 'admin' : 'staff';
        
        // บันทึก Session ลงใน sessionStorage เพื่อไม่ให้แท็บอื่นตีกัน
        sessionStorage.setItem('farmMedSession', JSON.stringify({ 
          username: matchedUser.username, 
          role: roleCode, 
          name: matchedUser.name,
          department: matchedUser.department || 'ไม่ระบุ'
        }));

        // 5. นำทางไปยังหน้าต่างตามสิทธิ์
        if (roleCode === 'admin') {
          router.push('/'); // แอดมินไปหน้า Dashboard
        } else {
          router.push('/request'); // พนักงานไปหน้าเบิกยา
        }
        
      } else {
        // ถ้าหาไม่เจอ แสดงว่าพิมพ์ผิด
        setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
        setIsLoading(false);
      }
    }, 800); 
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl"></div>

      {/* Main Container */}
      <div className="bg-white w-full max-w-5xl min-h-[600px] rounded-[2.5rem] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative z-10 border border-white">
        
        {/* Left Side: Branding (สีฟ้า) - 🌟 ใส่ hidden lg:flex เพื่อซ่อนในหน้าจอมือถือหรือจอย่อ */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-blue-600 to-indigo-800 p-8 sm:p-12 flex-col justify-center text-white relative overflow-hidden">
          
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-4 drop-shadow-sm">FarmMed</h1>
            <p className="text-blue-100/90 font-medium leading-relaxed text-sm">
              ระบบบริหารจัดการคลังยา วัคซีน และเวชภัณฑ์ภายในฟาร์มที่ทันสมัย สะดวก และปลอดภัย
            </p>
          </div>
        </div>

        {/* Right Side: Login Form (ฟอร์มกรอกรหัส) */}
        <div className="lg:w-7/12 p-8 sm:p-12 lg:p-16 flex flex-col justify-center bg-white">
          
          {/* โลโก้สำหรับหน้าจอมือถือ (จะซ่อนในหน้าจอคอม) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
              <ShieldCheck size={24} />
            </div>
            <h1 className="text-3xl font-black text-slate-800">FarmMed</h1>
          </div>

          <h2 className="text-3xl font-black text-slate-800 mb-2">ยินดีต้อนรับกลับมา 👋</h2>
          <p className="text-slate-500 font-medium mb-10">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2.5">ชื่อผู้ใช้งาน (Username)</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none"
                  placeholder="กรอกชื่อผู้ใช้งาน"
                  required
                />
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2.5">รหัสผ่าน (Password)</label>
              <div className="relative group">
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-mono tracking-widest"
                  placeholder="••••••••"
                  required
                />
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in zoom-in duration-300">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center"><X size={12}/></div>
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            >
              {isLoading ? <Loader2 size={22} className="animate-spin" /> : <LogIn size={22} />}
              {isLoading ? 'กำลังตรวจสอบสิทธิ์...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}