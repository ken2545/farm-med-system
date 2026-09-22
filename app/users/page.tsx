"use client";

import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Users, Plus, Edit, Trash2, ArrowLeft, Save, 
  CheckCircle2, XCircle, Search, Key, Lock, MapPin, Home, ShieldCheck
} from 'lucide-react';

export default function UsersPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

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
  const [searchTerm, setSearchTerm] = useState('');
  
  const [userForm, setUserForm] = useState({ 
    name: '', username: '', password: '', role: 'สัตวบาล', phase: '', barn: '', status: 'เปิดใช้งาน' 
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
      name: user.name, username: user.username || '', password: user.password || '', 
      role: user.role, phase: pPhase, barn: pBarn, status: user.status 
    });
    setUserView('form');
  };

  const handleSaveUser = () => {
    if (!userForm.name.trim() || !userForm.username.trim() || !userForm.phase) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อ, Username และ เฟส)', 'error');
      return;
    }

    const finalDepartment = userForm.phase === 'ส่วนกลาง'
      ? 'ส่วนกลาง'
      : `${userForm.phase}${userForm.barn && userForm.barn !== 'ทุกเล้า' ? ` - ${userForm.barn}` : ' - ทุกเล้า'}`;

    const dataToSave = { ...userForm, department: finalDepartment };

    let updatedUsers;
    if (editingUserId) {
      updatedUsers = usersList.map(u => u.id === editingUserId ? { ...u, ...dataToSave } : u);
      showToast('อัปเดตข้อมูลผู้ใช้สำเร็จ!', 'success');
    } else {
      updatedUsers = [...usersList, { id: Date.now(), ...dataToSave }];
      showToast('เพิ่มผู้ใช้ใหม่สำเร็จ!', 'success');
    }

    setUsersList(updatedUsers);
    localStorage.setItem('farmMedUsers', JSON.stringify(updatedUsers));
    setUserView('list');
  };

  const handleDeleteUser = () => {
    if(confirm('คุณแน่ใจหรือไม่ที่จะลบผู้ใช้งานรายนี้?')) {
      const updatedUsers = usersList.filter(u => u.id !== editingUserId);
      setUsersList(updatedUsers);
      localStorage.setItem('farmMedUsers', JSON.stringify(updatedUsers));
      setUserView('list');
      showToast('ลบผู้ใช้งานสำเร็จ!', 'success');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3000);
  };

  const filteredUsers = usersList.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                <Users size={24} strokeWidth={2.5}/>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">จัดการผู้ใช้งาน</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">เพิ่ม แก้ไข และกำหนดสิทธิ์พนักงานในฟาร์ม</p>
              </div>
            </div>

            {userView === 'list' && (
              <button 
                onClick={handleOpenAddUser}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
              >
                <Plus size={18} strokeWidth={3} /> เพิ่มผู้ใช้งาน
              </button>
            )}
          </div>

          <div className="max-w-5xl mx-auto">
            {userView === 'list' ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-300">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full max-w-md">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อ, Username หรือ แผนก..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all" 
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                  <div className="text-sm font-bold text-slate-500">
                    ทั้งหมด <span className="text-blue-600">{filteredUsers.length}</span> บัญชี
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                    <thead className="bg-white">
                      <tr className="text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                        <th className="px-6 py-4">ผู้ใช้งาน (Username)</th>
                        <th className="px-6 py-4">ตำแหน่ง / สิทธิ์</th>
                        <th className="px-6 py-4">แผนก / ฟาร์ม</th>
                        <th className="px-6 py-4 text-center">สถานะ</th>
                        <th className="px-6 py-4 text-right">การจัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-bold">ไม่พบผู้ใช้งานที่ค้นหา</td></tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.role.includes('Admin') ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                  {user.name.substring(0, 1)}
                                </div>
                                <div>
                                  <p className="font-extrabold text-slate-800 text-sm">{user.name}</p>
                                  <p className="text-xs text-slate-400 font-mono font-bold mt-0.5">@{user.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${user.role.includes('Admin') ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-slate-100 text-slate-600'}`}>
                                {user.role.includes('Admin') && <ShieldCheck size={14}/>} {user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 font-bold text-slate-600 text-xs">
                              {user.department}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[11px] font-bold tracking-wide ${user.status==='เปิดใช้งาน'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                                {user.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => handleOpenEditUser(user)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold shadow-sm">
                                <Edit size={14} /> แก้ไขข้อมูล
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                  <button onClick={() => setUserView('list')} className="flex items-center gap-2 text-slate-400 hover:text-slate-700 font-bold text-sm px-4 py-2 rounded-xl hover:bg-slate-50 transition-colors">
                    <ArrowLeft size={18}/> ย้อนกลับ
                  </button>
                  <h3 className="font-extrabold text-xl text-slate-800">
                    {editingUserId ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}
                  </h3>
                  <div className="w-24"></div> {/* Spacer for centering */}
                </div>

                <div className="p-6 sm:p-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">ชื่อ - นามสกุล <span className="text-red-500">*</span></label>
                      <input 
                        type="text" value={userForm.name} onChange={(e)=>setUserForm({...userForm, name: e.target.value})} 
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition-all" 
                        placeholder="เช่น นายสมชาย ใจดี"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Key size={16} className="text-blue-500"/> Username (ใช้ล็อกอิน) <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="text" value={userForm.username} onChange={(e)=>setUserForm({...userForm, username: e.target.value})} 
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-blue-700 font-mono font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition-all" 
                        placeholder="เช่น somchai_01"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Lock size={16} className="text-blue-500"/> รหัสผ่านใหม่ <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="password" value={userForm.password} onChange={(e)=>setUserForm({...userForm, password: e.target.value})} 
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none shadow-sm transition-all tracking-widest" 
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="md:col-span-2 border-t border-slate-100 my-2"></div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">ตำแหน่ง / สิทธิ์การใช้งาน <span className="text-red-500">*</span></label>
                      <select 
                        value={userForm.role} onChange={(e)=>setUserForm({...userForm, role: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none shadow-sm transition-all"
                      >
                        <option value="ผู้ดูแลระบบ (Admin)">ผู้ดูแลระบบ (Admin) - เข้าถึงได้ทุกเมนู</option>
                        <option value="สัตวบาล">สัตวบาล - เข้าถึงเมนูเบิกยาและคลัง</option>
                        <option value="พนักงานฟาร์ม">พนักงานฟาร์ม - เข้าถึงเมนูเบิกยา</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                        <MapPin size={16} className="text-blue-500"/> เฟสการผลิต (Phase) <span className="text-red-500">*</span>
                      </label>
                      <select 
                        value={userForm.phase} 
                        onChange={(e) => {
                          const newPhase = e.target.value;
                          setUserForm({...userForm, phase: newPhase, barn: newPhase === 'ส่วนกลาง' ? '' : userForm.barn});
                        }}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none shadow-sm transition-all"
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
                        <Home size={16} className="text-blue-500"/> ประเภทเล้า (Barn)
                      </label>
                      <select 
                        value={userForm.barn} 
                        onChange={(e)=>setUserForm({...userForm, barn: e.target.value})}
                        disabled={userForm.phase === 'ส่วนกลาง'}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none shadow-sm transition-all disabled:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
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

                    <div className="md:col-span-2">
                      <label className="block text-sm font-extrabold text-slate-700 mb-2">สถานะการใช้งาน</label>
                      <select 
                        value={userForm.status} onChange={(e)=>setUserForm({...userForm, status: e.target.value})}
                        className="w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none shadow-sm transition-all"
                      >
                        <option value="เปิดใช้งาน">🟢 เปิดใช้งาน (ล็อกอินเข้าระบบได้)</option>
                        <option value="ระงับการใช้งาน">🔴 ระงับการใช้งาน (ล็อกอินไม่ได้)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4">
                  {editingUserId ? (
                    <button onClick={handleDeleteUser} className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-red-500 font-bold bg-white border border-red-100 hover:bg-red-50 hover:border-red-200 transition-colors flex items-center justify-center gap-2">
                      <Trash2 size={18}/> ลบผู้ใช้นี้
                    </button>
                  ) : <div></div>}
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={() => setUserView('list')} className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                      ยกเลิก
                    </button>
                    <button onClick={handleSaveUser} className="flex-1 sm:flex-none px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all">
                      <Save size={18}/> {editingUserId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้งาน'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast Notification */}
      {toast.isOpen && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border ${toast.type === 'success' ? 'bg-slate-800 text-white border-slate-700' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={22} className="text-green-400" /> : <XCircle size={22} />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}