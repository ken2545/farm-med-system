"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Search, Plus, Edit, Trash2, AlertCircle, X, Save, CheckCircle2, Loader2 
} from 'lucide-react';

export default function MedicinePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // State สำหรับ Modal เพิ่ม/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    category: 'ยารักษาโรค/วิตามิน',
    unit: 'ขวด',
    stock: 0,
    status: 'ปกติ'
  });

  // 1. ฟังก์ชันดึงข้อมูลจาก Supabase
  const fetchMedicines = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('id', { ascending: true }); // เรียงตาม ID หรือจะแก้เป็น 'name' ก็ได้
      
      if (!error && data) {
        setMedicines(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // ระบบค้นหา
  const filteredMedicines = medicines.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 2. ฟังก์ชันเปิด Modal
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, name: '', category: 'ยารักษาโรค/วิตามิน', unit: 'ขวด', stock: 0, status: 'ปกติ' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setModalMode('edit');
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  // 3. ฟังก์ชันบันทึกข้อมูล (เพิ่ม/แก้ไข)
  const handleSave = async () => {
    if (!formData.name) {
      showToast('กรุณากรอกชื่อยา/วัคซีน', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      // อัปเดตสถานะอัตโนมัติ (ถ้าสต๊อก < 10 ให้เป็น 'สต๊อกต่ำ' ถ้ามากกว่าให้เป็น 'ปกติ')
      const currentStatus = formData.stock < 10 ? 'สต๊อกต่ำ' : 'ปกติ';

      if (modalMode === 'add') {
        // 🌟 แก้ไข: ลบ lot และ expiry ออก เพราะในตารางไม่มีคอลัมน์นี้
        const { error } = await supabase.from('inventory').insert([{
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          stock: formData.stock,
          status: currentStatus
        }]);
        if (error) throw error;
        showToast('เพิ่มรายการยาสำเร็จ!', 'success');
      } else {
        const { error } = await supabase.from('inventory').update({
          name: formData.name,
          category: formData.category,
          unit: formData.unit,
          stock: formData.stock,
          status: currentStatus
        }).eq('id', formData.id);
        if (error) throw error;
        showToast('แก้ไขข้อมูลสำเร็จ!', 'success');
      }

      setIsModalOpen(false);
      fetchMedicines(); // โหลดข้อมูลใหม่
    } catch (err) {
      console.error(err);
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // 4. ฟังก์ชันลบข้อมูล
  const handleDelete = async (id: number, name: string) => {
    if (confirm(`คุณแน่ใจหรือไม่ที่จะลบ "${name}" ออกจากระบบ?`)) {
      try {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (error) throw error;
        showToast('ลบรายการสำเร็จ!', 'success');
        fetchMedicines();
      } catch (err) {
        console.error(err);
        showToast('เกิดข้อผิดพลาดในการลบ', 'error');
      }
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3000);
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ข้อมูลยา / วัคซีน</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">จัดการข้อมูลยา วัคซีน และอุปกรณ์ทั้งหมดในระบบ</p>
              </div>
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-[#1a56db] hover:bg-[#1546b5] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm shadow-blue-500/30"
              >
                <Plus size={18} /> เพิ่มยา
              </button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
              
              <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/30">
                <div className="relative w-full max-w-md">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหาชื่อยา หรือประเภท..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm font-bold text-slate-800 transition-all" 
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                </div>
                <div className="text-sm font-bold text-slate-500">
                  ทั้งหมด <span className="text-blue-600">{filteredMedicines.length}</span> รายการ
                </div>
              </div>

              <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative">
                <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-xs border-b border-slate-100">
                      <th className="py-4 px-6 w-20 text-center">ลำดับ</th>
                      <th className="py-4 px-6">ชื่อยา/วัคซีน</th>
                      <th className="py-4 px-6">ประเภท</th>
                      <th className="py-4 px-6 text-center">หน่วย</th>
                      <th className="py-4 px-6 text-right">คงเหลือ</th>
                      <th className="py-4 px-6 text-center">สถานะ</th>
                      <th className="py-4 px-6 text-center w-28">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-bold"><Loader2 className="animate-spin inline mr-2"/>กำลังโหลดข้อมูล...</td></tr>
                    ) : filteredMedicines.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-16 text-slate-400 font-bold">ไม่พบข้อมูลที่ค้นหา</td></tr>
                    ) : (
                      filteredMedicines.map((item: any, index: number) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="py-4 px-6 text-center text-slate-400 font-bold">{index + 1}</td>
                          <td className="py-4 px-6 font-extrabold text-slate-800">{item.name}</td>
                          <td className="py-4 px-6 text-slate-600 font-medium">{item.category}</td>
                          <td className="py-4 px-6 text-center text-slate-500 font-bold">{item.unit}</td>
                          <td className="py-4 px-6 text-right font-black text-lg text-slate-800">{item.stock}</td>
                          <td className="py-4 px-6 text-center">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center justify-center min-w-[80px] ${
                              item.status === 'ปกติ' || item.stock > 10
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                              {item.stock > 0 && item.stock <= 10 ? 'ใกล้หมด' : item.stock === 0 ? 'สต๊อกต่ำ' : 'ปกติ'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditModal(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100">
                                <Edit size={16}/>
                              </button>
                              <button onClick={() => handleDelete(item.id, item.name)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                                <Trash2 size={16}/>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ================= MODAL: เพิ่ม/แก้ไข ข้อมูลยา ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative z-10 animate-in zoom-in-95 duration-200 border border-white/50 overflow-hidden flex flex-col">
            
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-extrabold text-xl text-slate-800">
                {modalMode === 'add' ? 'เพิ่มรายการใหม่' : 'แก้ไขข้อมูลยา'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-200 transition-colors disabled:opacity-50">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ชื่อยา/วัคซีน <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="เช่น Amoxycillin 15%"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">ประเภทหมวดหมู่</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                >
                  <option value="ยารักษาโรค/วิตามิน">ยารักษาโรค/วิตามิน</option>
                  <option value="วัคซีน">วัคซีน</option>
                  <option value="สารเคมี/น้ำยาฆ่าเชื้อ">สารเคมี/น้ำยาฆ่าเชื้อ</option>
                  <option value="เวชภัณฑ์และอุปกรณ์">เวชภัณฑ์และอุปกรณ์</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">หน่วยนับ</label>
                  <input 
                    type="text" 
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="เช่น ขวด, ซอง"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">สต๊อกเริ่มต้น (ปรับแก้ได้)</label>
                  <input 
                    type="number" 
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-md shadow-blue-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.isOpen && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-slate-800 border-slate-700' : 'bg-red-600 border-red-500'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={22} className="text-green-400" /> : <AlertCircle size={22} className="text-white" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}