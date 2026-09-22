"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // 🌟 Import Supabase เพื่อดึงข้อมูลยา
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Building2, Users, Layers, Pill, Bell, HardDrive, 
  User, CheckCircle2, ChevronRight, X, Save, Plus, 
  ToggleLeft, ToggleRight, DownloadCloud, Edit, Trash2, ArrowLeft, Key, Lock, MapPin, Home, Calculator, ChevronDown
} from 'lucide-react';

export default function SettingsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '' });
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // ข้อมูลฟาร์ม
  const [farmInfo, setFarmInfo] = useState({ 
    name: 'ฟาร์มสุกรพันธุ์สุขใจ', 
    address: '123 ม.4 ต.หนองสุกร อ.เมือง จ.นครปฐม', 
    phone: '081-234-5678' 
  });
  
  // State เก็บข้อมูลผู้ใช้งานที่กำลังล็อกอินอยู่ปัจจุบัน
  const [currentUser, setCurrentUser] = useState({
    name: 'กำลังโหลด...',
    role: 'กำลังโหลด...',
    department: 'กำลังโหลด...'
  });

  // 🌟 State สำหรับเก็บรายชื่อยาที่ดึงจากคลัง
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

  useEffect(() => {
    // 1. โหลดข้อมูลฟาร์ม
    const savedFarmName = localStorage.getItem('farmName');
    const savedFarmAddress = localStorage.getItem('farmAddress');
    const savedFarmPhone = localStorage.getItem('farmPhone');
    if (savedFarmName || savedFarmAddress || savedFarmPhone) {
      setFarmInfo(prev => ({ 
        ...prev, 
        name: savedFarmName || prev.name,
        address: savedFarmAddress || prev.address,
        phone: savedFarmPhone || prev.phone
      }));
    }

    // 2. โหลดข้อมูล Session และเปรียบเทียบหาข้อมูลล่าสุด
    const sessionStr = sessionStorage.getItem('farmMedSession');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      const savedUsers = localStorage.getItem('farmMedUsers');
      
      let displayData = {
        name: session.name || 'ผู้ใช้งาน',
        role: session.role === 'admin' ? 'Admin / ผู้จัดการ' : (session.role || 'สัตวบาล'),
        department: session.department || 'พนักงานฟาร์ม'
      };
      
      // ดึงข้อมูลล่าสุดจาก farmMedUsers มาบังคับอัปเดต Session
      if (savedUsers) {
        const usersList = JSON.parse(savedUsers);
        const matchedUser = usersList.find((u: any) => u.username === session.username);
        if (matchedUser) {
          displayData = {
            name: matchedUser.name,
            role: matchedUser.role === 'ผู้ดูแลระบบ (Admin)' ? 'Admin / ผู้จัดการ' : matchedUser.role,
            department: matchedUser.department || matchedUser.role
          };
          
          // ซิงค์ข้อมูลล่าสุดกลับเข้า Session
          sessionStorage.setItem('farmMedSession', JSON.stringify({
            ...session,
            name: matchedUser.name,
            role: matchedUser.role.includes('Admin') ? 'admin' : 'staff',
            department: matchedUser.department || matchedUser.role
          }));
        }
      }

      setCurrentUser(displayData);
    } else {
      setCurrentUser({
        name: 'ผู้ดูแลระบบ',
        role: 'Admin / ผู้จัดการ',
        department: 'ส่วนกลาง'
      });
    }

    // 🌟 3. ดึงข้อมูลรายชื่อยาจากตาราง Inventory ใน Supabase
    const fetchInventory = async () => {
      try {
        const { data } = await supabase.from('inventory').select('name, unit').order('name');
        if (data) {
          setInventoryItems(data);
        }
      } catch (error) {
        console.error('Error fetching inventory:', error);
      }
    };
    fetchInventory();

  }, []);

  const defaultFormulas = [
    { id: 1, target: 'แม่', name: 'OXYTOCIN', calcType: 'ratePerHead', rate: 2, packSize: 50, unit: 'ขวด' },
    { id: 2, target: 'แม่', name: 'AX-3', calcType: 'ratePerHead', rate: 900, packSize: 20000, unit: 'ถุง' },
    { id: 3, target: 'แม่', name: 'มาโบซิล 10%', calcType: 'ratePerHead', rate: 5, packSize: 100, unit: 'ขวด' },
    { id: 4, target: 'ลูก', name: 'ก๊อกบุท', calcType: 'headsPerPack', rate: 125, packSize: 1, unit: 'ขวด' },
    { id: 5, target: 'ลูก', name: 'ธาตุเหล็ก', calcType: 'ratePerHead', rate: 1, packSize: 100, unit: 'ขวด' },
    { id: 6, target: 'ลูก', name: 'ซีฟติโอเฟอร์', calcType: 'ratePerHead', rate: 0.5, packSize: 100, unit: 'ขวด' },
  ];
  const [medFormulas, setMedFormulas] = useState<any[]>([]);

  useEffect(() => {
    const savedFormulas = localStorage.getItem('farmMedFormulas');
    if (savedFormulas) {
      setMedFormulas(JSON.parse(savedFormulas));
    } else {
      setMedFormulas(defaultFormulas);
    }
  }, []);

  const [notifSettings, setNotifSettings] = useState({ line: true, email: false, lowStock: true, newRequest: true });
  
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'นายสมชาย ใจดี', username: 'somchai_ad', password: '••••••', role: 'ผู้ดูแลระบบ (Admin)', department: 'ส่วนกลาง', status: 'เปิดใช้งาน' },
    { id: 2, name: 'นพดล ศรีสุข', username: 'nopadol_vt', password: '••••••', role: 'สัตวบาล', department: 'เฟส 1 - ทุกเล้า', status: 'เปิดใช้งาน' },
    { id: 3, name: 'ธนกฤต มั่นคง', username: 'thanakrit_fm', password: '••••••', role: 'พนักงานฟาร์ม', department: 'เฟส 2 - เล้า Finisher', status: 'ระงับการใช้งาน' },
  ]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('farmMedUsers');
    if (savedUsers) {
      try {
        setUsersList(JSON.parse(savedUsers));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const [userView, setUserView] = useState<'list' | 'form'>('list');
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
  const [userForm, setUserForm] = useState({ 
    name: '', 
    username: '', 
    password: '', 
    role: 'สัตวบาล', 
    phase: '', 
    barn: '', 
    status: 'เปิดใช้งาน' 
  });

  const handleOpenAddUser = () => {
    setEditingUserId(null);
    setUserForm({ name: '', username: '', password: '', role: 'สัตวบาล', phase: '', barn: '', status: 'เปิดใช้งาน' });
    setUserView('form');
  };

  const handleOpenEditUser = (user: any) => {
    setEditingUserId(user.id);

    let pPhase = user.phase || '';
    let pBarn = user.barn || '';

    if (!pPhase && user.department) {
      if (user.department === 'ส่วนกลาง') {
        pPhase = 'ส่วนกลาง';
      } else {
        const parts = user.department.split(' - ');
        pPhase = parts[0] || '';
        pBarn = parts[1] || 'ทุกเล้า';
      }
    }

    setUserForm({ 
      name: user.name, 
      username: user.username || '', 
      password: user.password || '', 
      role: user.role, 
      phase: pPhase, 
      barn: pBarn, 
      status: user.status 
    });
    setUserView('form');
  };

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.phase) {
      setToast({ isOpen: true, message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, Username และ เฟส)' });
      setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
      return;
    }

    const finalDepartment = userForm.phase === 'ส่วนกลาง'
      ? 'ส่วนกลาง'
      : `${userForm.phase}${userForm.barn && userForm.barn !== 'ทุกเล้า' ? ` - ${userForm.barn}` : ' - ทุกเล้า'}`;

    const dataToSave = { 
      ...userForm, 
      department: finalDepartment 
    };

    let updatedUsers;
    if (editingUserId) {
      updatedUsers = usersList.map(u => u.id === editingUserId ? { ...u, ...dataToSave } : u);
      setToast({ isOpen: true, message: 'อัปเดตข้อมูลผู้ใช้สำเร็จ!' });

      const sessionStr = sessionStorage.getItem('farmMedSession');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        const originalUser = usersList.find(u => u.id === editingUserId);
        
        if (originalUser && originalUser.username === session.username) {
          sessionStorage.setItem('farmMedSession', JSON.stringify({
            ...session,
            username: dataToSave.username,
            name: dataToSave.name,
            role: dataToSave.role.includes('Admin') ? 'admin' : 'staff',
            department: dataToSave.department
          }));

          setCurrentUser({
            name: dataToSave.name,
            role: dataToSave.role === 'ผู้ดูแลระบบ (Admin)' ? 'Admin / ผู้จัดการ' : dataToSave.role,
            department: dataToSave.department
          });

          window.dispatchEvent(new Event('sessionUpdated'));
        }
      }

    } else {
      updatedUsers = [...usersList, { id: Date.now(), ...dataToSave }];
      setToast({ isOpen: true, message: 'เพิ่มผู้ใช้ใหม่สำเร็จ!' });
    }

    setUsersList(updatedUsers);
    localStorage.setItem('farmMedUsers', JSON.stringify(updatedUsers));
    
    setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
    setUserView('list');
  };

  const handleDeleteUser = () => {
    if(confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานรายนี้?')) {
      const updatedUsers = usersList.filter(u => u.id !== editingUserId);
      setUsersList(updatedUsers);
      localStorage.setItem('farmMedUsers', JSON.stringify(updatedUsers));
      setUserView('list');
      setToast({ isOpen: true, message: 'ลบผู้ใช้งานสำเร็จ!' });
      setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
    }
  };

  const addFormula = () => {
    setMedFormulas([...medFormulas, { id: Date.now(), target: 'แม่', name: '', calcType: 'ratePerHead', rate: 1, packSize: 100, unit: 'ขวด' }]);
  };

  const removeFormula = (id: number) => {
    setMedFormulas(medFormulas.filter(f => f.id !== id));
  };

  const updateFormula = (id: number, field: string, value: any) => {
    setMedFormulas(medFormulas.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const settingMenus = [
    { id: 1, title: 'ข้อมูลฟาร์ม', desc: 'ตั้งค่าข้อมูลฟาร์มและสถานที่', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50', hover: 'hover:border-blue-200 hover:shadow-blue-500/10' },
    { id: 2, title: 'ผู้ใช้งาน', desc: 'จัดการผู้ใช้ในระบบ', icon: Users, color: 'text-green-500', bg: 'bg-green-50', hover: 'hover:border-green-200 hover:shadow-green-500/10' },
    { id: 3, title: 'ประเภทสัตว์', desc: 'ประเภทสุกร/กลุ่ม', icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50', hover: 'hover:border-orange-200 hover:shadow-orange-500/10' },
    { id: 4, title: 'ประเภทการใช้ยา', desc: 'ตั้งค่าสูตรคำนวณยา (Farrowing)', icon: Pill, color: 'text-purple-500', bg: 'bg-purple-50', hover: 'hover:border-purple-200 hover:shadow-purple-500/10' },
    { id: 5, title: 'แจ้งเตือน', desc: 'ตั้งค่าการแจ้งเตือน', icon: Bell, color: 'text-red-500', bg: 'bg-red-50', hover: 'hover:border-red-200 hover:shadow-red-500/10' },
    { id: 6, title: 'สำรองข้อมูล', desc: 'สำรอง/กู้คืนข้อมูล', icon: HardDrive, color: 'text-teal-500', bg: 'bg-teal-50', hover: 'hover:border-teal-200 hover:shadow-teal-500/10' },
  ];

  const handleSave = () => {
    if (activeModal === 'ข้อมูลฟาร์ม') {
      localStorage.setItem('farmName', farmInfo.name);
      localStorage.setItem('farmAddress', farmInfo.address);
      localStorage.setItem('farmPhone', farmInfo.phone);
    } else if (activeModal === 'ประเภทการใช้ยา') {
      localStorage.setItem('farmMedFormulas', JSON.stringify(medFormulas));
    }
    setActiveModal(null);
    setUserView('list');
    setToast({ isOpen: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว!' });
    setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
  };

  const handleBackup = () => {
    setToast({ isOpen: true, message: 'กำลังดาวน์โหลดไฟล์สำรองข้อมูล (Backup.sql)...' });
    setTimeout(() => {
      setActiveModal(null);
      setToast({ isOpen: true, message: 'สำรองข้อมูลสำเร็จ!' });
      setTimeout(() => setToast({ isOpen: false, message: '' }), 3000);
    }, 2000);
  };

  const closeModal = () => {
    setActiveModal(null);
    setUserView('list');
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">การตั้งค่าระบบ</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">จัดการข้อมูลพื้นฐานและตั้งค่าการทำงานของระบบ</p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            
            <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {settingMenus.map((menu) => {
                const Icon = menu.icon;
                return (
                  <button 
                    key={menu.id}
                    onClick={() => setActiveModal(menu.title)}
                    className={`bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 text-left transition-all duration-300 transform hover:-translate-y-1 group ${menu.hover}`}
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${menu.bg} ${menu.color}`}>
                      <Icon size={28} strokeWidth={2} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-800 text-lg mb-1 group-hover:text-blue-700 transition-colors">{menu.title}</h3>
                      <p className="text-sm text-slate-500 font-medium">{menu.desc}</p>
                    </div>
                    <div className="text-slate-300 opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                      <ChevronRight size={24} />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="xl:col-span-4 flex flex-col gap-6">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
                <div className="flex items-center gap-4 mb-8 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30 border-4 border-blue-50 flex-shrink-0">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-slate-800 leading-tight">{currentUser.name}</h3>
                    <p className="text-sm font-medium text-blue-600 mt-0.5">{currentUser.role}</p>
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <span className="text-sm font-semibold text-slate-400">ชื่อ-สกุล</span>
                    <span className="text-sm font-bold text-slate-800">{currentUser.name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <span className="text-sm font-semibold text-slate-400">ตำแหน่ง</span>
                    <span className="text-sm font-bold text-slate-800">{currentUser.role}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-50 pb-4">
                    <span className="text-sm font-semibold text-slate-400">หน่วยงาน/เล้า</span>
                    <span className="text-sm font-bold text-slate-800">{currentUser.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-400">ฟาร์มที่ดูแล</span>
                    <span className="text-sm font-bold text-slate-800">{farmInfo.name}</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1a233a] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg shadow-slate-800/20 relative overflow-hidden flex-1 min-h-[220px]">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full border-[20px] border-white"></div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full border-[20px] border-white"></div>
                </div>
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-pink-200 rounded-full flex items-center justify-center mb-4 mx-auto shadow-inner border-[3px] border-pink-300/50">
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="#fbcfe8" stroke="#be185d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 17h1a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-1M5 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
                      <path d="M5 9a7 7 0 0 1 14 0v6a7 7 0 0 1-14 0V9z" />
                      <path d="M14 14v1" />
                      <path d="M10 14v1" />
                      <path d="M8 9h.01" />
                      <path d="M16 9h.01" />
                    </svg>
                  </div>
                  <h2 className="text-white font-black text-2xl mb-2 tracking-wide">FarmMed</h2>
                  <p className="text-slate-400 text-xs sm:text-sm font-medium leading-relaxed max-w-[200px] mx-auto">
                    ระบบเบิกจ่ายยาและจัดการสต๊อกยา<br/>ภายในฟาร์มสุกร
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================= MODAL การตั้งค่าย่อย ================= */}
      {activeModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          
          <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${activeModal === 'ประเภทการใช้ยา' ? 'max-w-5xl' : 'max-w-2xl'} relative z-10 animate-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[90vh]`}>
            
            <div className="flex-shrink-0 flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white rounded-t-[2rem]">
              <h3 className="font-extrabold text-xl text-slate-800 tracking-tight flex items-center gap-3">
                {activeModal === 'ผู้ใช้งาน' && userView === 'form' ? (
                  <>
                    <button onClick={() => setUserView('list')} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors">
                      <ArrowLeft size={20}/>
                    </button>
                    {editingUserId ? 'แก้ไขข้อมูลผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}
                  </>
                ) : (
                  <>
                    {settingMenus.find(m => m.title === activeModal)?.icon && (() => {
                      const Icon = settingMenus.find(m => m.title === activeModal)!.icon;
                      return <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Icon size={24}/></div>;
                    })()}
                    ตั้งค่า{activeModal}
                  </>
                )}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
              
              {activeModal === 'ข้อมูลฟาร์ม' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2">ชื่อฟาร์ม (แสดงในเอกสาร)</label>
                    <input 
                      type="text" value={farmInfo.name} onChange={(e)=>setFarmInfo({...farmInfo, name: e.target.value})} 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all outline-none shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2">ที่อยู่ฟาร์ม</label>
                    <textarea 
                      rows={3} value={farmInfo.address} onChange={(e)=>setFarmInfo({...farmInfo, address: e.target.value})} 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 resize-none transition-all outline-none shadow-sm leading-relaxed" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2">เบอร์โทรศัพท์ติดต่อ</label>
                    <input 
                      type="text" value={farmInfo.phone} onChange={(e)=>setFarmInfo({...farmInfo, phone: e.target.value})} 
                      className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 transition-all outline-none shadow-sm tracking-wider" 
                    />
                  </div>
                </div>
              )}

              {activeModal === 'ผู้ใช้งาน' && (
                <>
                  {userView === 'list' ? (
                    <div>
                      <div className="flex justify-between items-center mb-5">
                        <p className="text-sm font-bold text-slate-600">รายชื่อผู้มีสิทธิ์ใช้งานระบบ</p>
                        <button onClick={handleOpenAddUser} className="flex items-center gap-1.5 bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-200 transition-colors shadow-sm">
                          <Plus size={16} strokeWidth={3} /> เพิ่มผู้ใช้
                        </button>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                        {usersList.map(user => (
                          <div key={user.id} className="flex justify-between items-center p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-bold">@{user.username}</span>
                              </div>
                              <p className="text-xs font-medium text-slate-400 mt-0.5">{user.role} • <span className="text-slate-600 font-bold">{user.department}</span></p>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className={`px-3 py-1 rounded-md text-[11px] font-bold tracking-wide ${user.status==='เปิดใช้งาน'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                                {user.status}
                              </span>
                              <button onClick={() => handleOpenEditUser(user)} className="text-slate-400 hover:text-blue-600 transition-colors p-1.5 bg-slate-50 hover:bg-blue-50 rounded-lg border border-slate-200 hover:border-blue-200">
                                <Edit size={16}/>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-extrabold text-slate-700 mb-2">ชื่อ - นามสกุล</label>
                        <input 
                          type="text" value={userForm.name} onChange={(e)=>setUserForm({...userForm, name: e.target.value})} 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 outline-none shadow-sm" 
                          placeholder="เช่น นายสมชาย ใจดี"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Key size={15} className="text-blue-500"/> Username (ใช้ล็อกอิน)
                          </label>
                          <input 
                            type="text" value={userForm.username} onChange={(e)=>setUserForm({...userForm, username: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-blue-700 font-mono font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 outline-none shadow-sm" 
                            placeholder="เช่น somchai_01"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Lock size={15} className="text-blue-500"/> รหัสผ่านใหม่
                          </label>
                          <input 
                            type="password" value={userForm.password} onChange={(e)=>setUserForm({...userForm, password: e.target.value})} 
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25 outline-none shadow-sm" 
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-extrabold text-slate-700 mb-2">ตำแหน่ง / สิทธิ์การใช้งาน</label>
                        <select 
                          value={userForm.role} onChange={(e)=>setUserForm({...userForm, role: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 outline-none shadow-sm"
                        >
                          <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin)</option>
                          <option value="สัตวบาล">สัตวบาล</option>
                          <option value="พนักงานฟาร์ม">พนักงานฟาร์ม</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                            <MapPin size={15} className="text-blue-500"/> เฟสการผลิต (Phase)
                          </label>
                          <select 
                            value={userForm.phase} 
                            onChange={(e) => {
                              const newPhase = e.target.value;
                              setUserForm({...userForm, phase: newPhase, barn: newPhase === 'ส่วนกลาง' ? '' : userForm.barn});
                            }}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 outline-none shadow-sm"
                          >
                            <option value="">-- เลือกเฟส --</option>
                            <option value="เฟส 1">เฟส 1</option>
                            <option value="เฟส 2">เฟส 2</option>
                            <option value="เฟส 3">เฟส 3</option>
                            <option value="ส่วนกลาง">ส่วนกลาง / ออฟฟิศ</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Home size={15} className="text-blue-500"/> ประเภทเล้า (Barn)
                          </label>
                          <select 
                            value={userForm.barn} 
                            onChange={(e)=>setUserForm({...userForm, barn: e.target.value})}
                            disabled={userForm.phase === 'ส่วนกลาง'}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 outline-none shadow-sm disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">-- เลือกเล้า --</option>
                            <option value="ทุกเล้า">ดูแลทุกเล้า</option>
                            <option value="เล้า Boar">เล้า Boar (พ่อพันธุ์)</option>
                            <option value="เล้า GDU">เล้า GDU (สาวทดแทน)</option>
                            <option value="เล้า Mating">เล้า Mating (ผสมพันธุ์)</option>
                            <option value="เล้า Gestation">เล้า Gestation (อุ้มท้อง)</option>
                            <option value="เล้า Farrowing">เล้า Farrowing (คลอด)</option>
                            <option value="เล้า Nurse">เล้า Nurse (อนุบาล)</option>
                            <option value="เล้า Finisher">เล้า Finisher (ขุน)</option>
                            <option value="เล้า Isolate">เล้า Isolate (กักโรค/แยกเลี้ยง)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-extrabold text-slate-700 mb-2">สถานะการใช้งาน</label>
                        <select 
                          value={userForm.status} onChange={(e)=>setUserForm({...userForm, status: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 outline-none shadow-sm"
                        >
                          <option value="เปิดใช้งาน">🟢 เปิดใช้งาน</option>
                          <option value="ระงับการใช้งาน">🔴 ระงับการใช้งาน</option>
                        </select>
                      </div>

                      {editingUserId && (
                        <div className="pt-3 border-t border-slate-200 text-center">
                          <button onClick={handleDeleteUser} className="inline-flex items-center gap-2 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors">
                            <Trash2 size={15} /> ลบผู้ใช้งานนี้
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* 🌟 ส่วนที่แก้ไขเรื่องการดึงยาจากคลังมาแสดงในตัวเลือก */}
              {activeModal === 'ประเภทการใช้ยา' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-lg flex items-center gap-2"><Calculator size={20} className="text-blue-500"/> สูตรคำนวณยาชุด (Farrowing)</h4>
                      <p className="text-xs text-slate-500 mt-1 font-medium">สูตรเหล่านี้จะถูกใช้เพื่อคำนวณจำนวนยาอัตโนมัติในหน้าเบิกยา</p>
                    </div>
                    <button onClick={addFormula} className="bg-blue-100 text-blue-700 px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-200 flex items-center gap-1.5 shadow-sm transition-colors">
                      <Plus size={16} strokeWidth={3}/> เพิ่มยาใหม่
                    </button>
                  </div>

                  <div className="hidden lg:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <div className="col-span-2">เป้าหมาย</div>
                    <div className="col-span-3">ชื่อยา/วัคซีน</div>
                    <div className="col-span-2">รูปแบบการคำนวณ</div>
                    <div className="col-span-2">เรท (ต่อตัว/บรรจุภัณฑ์)</div>
                    <div className="col-span-2">ขนาดบรรจุ (ขวด/ถุง)</div>
                    <div className="col-span-1 text-center">ลบ</div>
                  </div>

                  <div className="space-y-3">
                    {medFormulas.map((med) => (
                      <div key={med.id} className="grid grid-cols-1 lg:grid-cols-12 gap-3 p-5 lg:p-3 bg-white border border-slate-200 rounded-2xl items-center shadow-sm hover:border-blue-300 transition-colors">
                        
                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">เป้าหมาย</label>
                          <select value={med.target} onChange={(e) => updateFormula(med.id, 'target', e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 border border-slate-200 outline-none focus:border-blue-500">
                            <option value="แม่">แม่สุกร</option>
                            <option value="ลูก">ลูกสุกร</option>
                          </select>
                        </div>
                        
                        {/* 🌟 ช่องเลือกชื่อยา (แบบ Dropdown) แก้ปัญหาข้อมูลไม่ขึ้น */}
                        <div className="lg:col-span-3">
                          <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">ชื่อยา/วัคซีน</label>
                          <div className="relative">
                            <select 
                              value={med.name || ""} 
                              onChange={(e) => {
                                const val = e.target.value;
                                const matchedItem = inventoryItems.find(inv => inv.name === val);
                                
                                // 🌟 อัปเดตทั้ง 'ชื่อ' และ 'หน่วย' พร้อมกัน ป้องกัน State ทับกัน
                                setMedFormulas(prev => prev.map(f => 
                                  f.id === med.id 
                                    ? { ...f, name: val, unit: matchedItem?.unit || f.unit } 
                                    : f
                                ));
                              }} 
                              className="w-full p-2.5 pr-8 bg-slate-50 rounded-xl text-sm font-bold text-blue-700 border border-slate-200 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                            >
                              <option value="" disabled>-- เลือกยาจากคลัง --</option>
                              {inventoryItems.map((item, idx) => (
                                <option key={idx} value={item.name}>{item.name}</option>
                              ))}
                            </select>
                            {/* ไอคอนลูกศรชี้ลงสำหรับ Dropdown */}
                            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">รูปแบบการคำนวณ</label>
                          <select value={med.calcType} onChange={(e) => updateFormula(med.id, 'calcType', e.target.value)} className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 outline-none focus:border-blue-500">
                            <option value="ratePerHead">ปริมาณที่ใช้ / 1 ตัว</option>
                            <option value="headsPerPack">1 ชิ้นใช้ได้ (กี่ตัว)</option>
                          </select>
                        </div>

                        <div className="lg:col-span-2">
                          <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">เรท</label>
                          <input type="number" min="0" step="0.1" value={med.rate} onChange={(e) => updateFormula(med.id, 'rate', parseFloat(e.target.value) || 0)} placeholder="จำนวน" className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-800 border border-slate-200 outline-none text-center focus:border-blue-500" />
                        </div>

                        <div className="lg:col-span-2 flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">ขนาดบรรจุ</label>
                            <input type="number" min="1" value={med.packSize} onChange={(e) => updateFormula(med.id, 'packSize', parseFloat(e.target.value) || 1)} disabled={med.calcType === 'headsPerPack'} className="w-full p-2.5 bg-slate-50 rounded-xl text-sm font-bold text-slate-800 border border-slate-200 outline-none text-center disabled:opacity-50 disabled:bg-slate-100 focus:border-blue-500" title="เช่น ขวด 100cc ใส่ 100" />
                          </div>
                          <div className="w-20">
                            <label className="text-xs font-bold text-slate-500 mb-1 block lg:hidden">หน่วย</label>
                            <input type="text" value={med.unit} onChange={(e) => updateFormula(med.id, 'unit', e.target.value)} placeholder="ขวด" className="w-full p-2.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 border border-slate-200 outline-none text-center focus:border-blue-500" />
                          </div>
                        </div>

                        <div className="lg:col-span-1 text-center mt-3 lg:mt-0">
                          <button onClick={() => removeFormula(med.id)} className="p-2.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-colors w-full lg:w-auto flex justify-center items-center gap-2">
                            <Trash2 size={18} /> <span className="text-xs font-bold lg:hidden">ลบรายการนี้</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeModal === 'แจ้งเตือน' && (
                <div className="space-y-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">แจ้งเตือนผ่าน Line Notify</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">ส่งข้อความเข้ากลุ่มไลน์เมื่อมีการเบิกยา</p>
                    </div>
                    <button onClick={()=>setNotifSettings({...notifSettings, line: !notifSettings.line})}>
                      {notifSettings.line ? <ToggleRight size={40} className="text-green-500"/> : <ToggleLeft size={40} className="text-slate-300"/>}
                    </button>
                  </div>
                </div>
              )}

              {activeModal === 'สำรองข้อมูล' && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-teal-100">
                    <DownloadCloud size={36} strokeWidth={2.5} />
                  </div>
                  <h3 className="font-extrabold text-xl text-slate-800 mb-2">สำรองฐานข้อมูล (Database Backup)</h3>
                  <p className="text-sm font-medium text-slate-500 mb-8 max-w-sm mx-auto">ดาวน์โหลดข้อมูลทั้งหมดในระบบออกมาเป็นไฟล์ .sql เพื่อป้องกันข้อมูลสูญหาย</p>
                  <button onClick={handleBackup} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 px-8 rounded-2xl shadow-lg shadow-teal-500/30 transition-all flex items-center gap-2.5 mx-auto">
                    <HardDrive size={20} /> ดาวน์โหลดไฟล์สำรอง
                  </button>
                </div>
              )}

            </div>

            {activeModal !== 'สำรองข้อมูล' && (
              <div className="flex-shrink-0 p-6 border-t border-slate-100 bg-white rounded-b-[2rem] flex gap-3">
                {activeModal === 'ผู้ใช้งาน' && userView === 'form' ? (
                  <>
                    <button onClick={() => setUserView('list')} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm">
                      ยกเลิก
                    </button>
                    <button onClick={handleSaveUser} className="flex-[2] bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2">
                      <Save size={18} /> บันทึกข้อมูลผู้ใช้
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={closeModal} className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm">
                      ปิดหน้าต่าง
                    </button>
                    <button onClick={handleSave} className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                      <Save size={18} /> บันทึกการตั้งค่าทั้งหมด
                    </button>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isOpen && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-800 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700">
            <CheckCircle2 size={22} className="text-green-400" />
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}