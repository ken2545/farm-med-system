"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Search, Save, CheckCircle2, 
  Download, Calendar, 
  AlertTriangle, Layers, Package, Pill, PackagePlus, ClipboardList, Loader2
} from 'lucide-react';

export default function ReceivePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [activeTab, setActiveTab] = useState<'receive' | 'report'>('receive');

  const [inventoryReport, setInventoryReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });
      
      if (!error && data) {
        setInventoryReport(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const uniqueMedicines = Array.from(new Set(inventoryReport.map(item => item.name)));

  const [receiveForm, setReceiveForm] = useState({
    medName: '',          
    lotNo: '',            
    amount: 1,            
    unit: 'ขวด',          
    expiryDate: '',       
    receiveDate: new Date().toISOString().split('T')[0], 
  });

  const handleSelectMainMedicine = (value: string) => {
    const matchedMed = inventoryReport.find(inv => inv.name === value);
    setReceiveForm(prev => ({
      ...prev,
      medName: value,
      unit: matchedMed ? matchedMed.unit : prev.unit
    }));
  };

  const handleSaveReceive = async () => {
    if (!receiveForm.medName || !receiveForm.lotNo || !receiveForm.expiryDate) {
      showToast('กรุณากรอกชื่อยา, เลขล็อต และวันหมดอายุให้ครบถ้วน!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 🌟 อัปเดตใหม่: ค้นหาด้วย "ชื่อยา" อย่างเดียว ถ้ายาชื่อตรงกันให้บวกสต๊อกทับเลย
      const existingMed = inventoryReport.find(
        inv => inv.name === receiveForm.medName
      );

      if (existingMed) {
        // บวกจำนวนสต๊อกเพิ่ม และอัปเดตล็อตเป็นล็อตล่าสุด
        const newStock = existingMed.stock + Number(receiveForm.amount);
        const newStatus = newStock === 0 ? 'สต๊อกต่ำ' : (newStock <= 10 ? 'ใกล้หมด' : 'ปกติ');

        const { error } = await supabase
          .from('inventory')
          .update({ 
            stock: newStock, 
            lot: receiveForm.lotNo, 
            expiry: receiveForm.expiryDate, 
            status: newStatus 
          })
          .eq('id', existingMed.id);
        
        if (error) {
          showToast(`อัปเดตข้อมูลพลาด: ${error.message}`, 'error');
          setIsSaving(false);
          return;
        }
      } else {
        // ถ้าเป็นยาชื่อใหม่ที่ไม่เคยมีในระบบ ให้สร้างรายการใหม่
        const existingCategory = inventoryReport.find(inv => inv.name === receiveForm.medName)?.category || 'ยารักษาโรค/วิตามิน';
        const { error } = await supabase
          .from('inventory')
          .insert([{
            name: receiveForm.medName,
            category: existingCategory,
            lot: receiveForm.lotNo,
            stock: Number(receiveForm.amount),
            unit: receiveForm.unit,
            expiry: receiveForm.expiryDate,
            status: Number(receiveForm.amount) > 10 ? 'ปกติ' : 'ใกล้หมด'
          }]);
        
        if (error) {
          showToast(`บันทึกพลาด: ${error.message}`, 'error');
          setIsSaving(false);
          return;
        }
      }

      const today = new Date(receiveForm.receiveDate);
      const dateStr = today.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      
      const { error: actError } = await supabase.from('activities').insert([{
        action: 'รับยาเข้าคลัง',
        detail: `${receiveForm.medName} จำนวน ${receiveForm.amount} ${receiveForm.unit}`,
        user_name: 'แอดมิน ฟาร์ม',
        type: 'add',
        date: dateStr,
        time: timeStr
      }]);

      if (actError) console.warn("ไม่สามารถบันทึกประวัติกิจกรรมได้:", actError.message);

      showToast('บันทึกรับเข้าและอัปเดตสต๊อกสำเร็จ!', 'success');
      
      setReceiveForm(prev => ({ ...prev, medName: '', lotNo: '', amount: 1, expiryDate: '' }));
      await fetchInventory();
      setTimeout(() => setActiveTab('report'), 800);

    } catch (err: any) {
      console.error(err);
      showToast(`Error ระบบ: ${err.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้'}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 5000);
  };

  const filteredInventory = inventoryReport.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (item.lot && item.lot.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          
          <div className="max-w-7xl mx-auto space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                  <PackagePlus size={24} strokeWidth={2.5}/>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">รับยาที่มาใหม่ & สต๊อก</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">จัดการนำเข้ายาและตรวจสอบรายการยาทั้งหมดในคลัง</p>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl inline-flex shadow-inner">
                <button 
                  onClick={() => setActiveTab('receive')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === 'receive' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
                  }`}
                >
                  <Layers size={18} /> ฟอร์มรับเข้า
                </button>
                <button 
                  onClick={() => setActiveTab('report')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === 'report' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
                  }`}
                >
                  <ClipboardList size={18} /> ตารางสต๊อก
                </button>
              </div>
            </div>

            {activeTab === 'receive' && (
              <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-500">
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Pill size={16} className="text-blue-500"/> ชื่อยา / วัคซีน <span className="text-red-500">*</span>
                    </label>
                    <input 
                      list="main-med-list"
                      type="text" 
                      value={receiveForm.medName} 
                      placeholder="-- พิมพ์ค้นหา หรือคลิกเพื่อเลือกจากคลัง --"
                      onChange={(e) => handleSelectMainMedicine(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-blue-700 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" 
                    />
                    <datalist id="main-med-list">
                      {uniqueMedicines.map((med: any) => (
                        <option key={med} value={med} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar size={16} className="text-blue-500"/> วันที่รับ <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" value={receiveForm.receiveDate} onChange={(e) => setReceiveForm({...receiveForm, receiveDate: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Layers size={16} className="text-blue-500"/> ล็อต (Lot No.) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" value={receiveForm.lotNo} placeholder="ระบุเลขล็อต"
                      onChange={(e) => setReceiveForm({...receiveForm, lotNo: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none uppercase" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Package size={16} className="text-blue-500"/> จำนวนรับเข้า <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="number" min="1" value={receiveForm.amount}
                        onChange={(e) => setReceiveForm({...receiveForm, amount: parseInt(e.target.value) || 1})}
                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-center" 
                      />
                      <select 
                        value={receiveForm.unit} onChange={(e) => setReceiveForm({...receiveForm, unit: e.target.value})}
                        className="px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 outline-none"
                      >
                        <option value="ขวด">ขวด</option>
                        <option value="โดส">โดส</option>
                        <option value="กรัม">กรัม</option>
                        <option value="ซอง">ซอง</option>
                        <option value="แกลลอน">แกลลอน</option>
                        <option value="ถัง">ถัง</option>
                        <option value="กก.">กก.</option>
                        <option value="อัน">อัน</option>
                        <option value="ลิตร">ลิตร</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                      <Calendar size={16} className="text-blue-500"/> วันหมดอายุ <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="date" value={receiveForm.expiryDate}
                      onChange={(e) => setReceiveForm({...receiveForm, expiryDate: e.target.value})}
                      className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" 
                    />
                  </div>

                </div>

                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                  <button 
                    onClick={() => setReceiveForm({ medName: '', lotNo: '', amount: 1, unit: 'ขวด', expiryDate: '', receiveDate: new Date().toISOString().split('T')[0] })}
                    className="px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    ล้างฟอร์ม
                  </button>
                  <button 
                    onClick={handleSaveReceive} disabled={isSaving}
                    className="px-8 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} 
                    {isSaving ? 'กำลังบันทึก...' : 'บันทึกรับเข้าสต๊อก'}
                  </button>
                </div>

              </div>
            )}

            {activeTab === 'report' && (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
                
                <div className="p-5 border-b border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="relative w-full max-w-md">
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="ค้นหาชื่อยา หรือเลขล็อต..." 
                      className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm font-bold text-slate-800 transition-all" 
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  </div>
                  
                  <button 
                    onClick={() => showToast('เตรียมไฟล์ Excel...', 'success')}
                    className="flex w-full sm:w-auto items-center justify-center gap-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors border border-emerald-100 shadow-sm"
                  >
                    <Download size={18} /> ส่งออกรายงาน
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative">
                  <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                    <thead className="bg-white sticky top-0 z-10 shadow-sm">
                      <tr className="text-slate-400 font-extrabold uppercase tracking-wider text-xs border-b border-slate-100">
                        <th className="py-4 px-6">ชื่อยา / วัคซีน</th>
                        <th className="py-4 px-6">หมวดหมู่</th>
                        <th className="py-4 px-6 text-center">ล็อตล่าสุด (Lot)</th>
                        <th className="py-4 px-6 text-right">คงเหลือ</th>
                        <th className="py-4 px-6 text-center">สถานะ</th>
                        <th className="py-4 px-6 text-right">วันหมดอายุ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoading ? (
                        <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-bold"><Loader2 className="animate-spin inline mr-2"/>กำลังโหลดข้อมูล...</td></tr>
                      ) : filteredInventory.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-16 text-slate-400 font-bold">ไม่พบข้อมูลในสต๊อก</td></tr>
                      ) : (
                        filteredInventory.map((item: any) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6 font-extrabold text-blue-700">{item.name}</td>
                            <td className="py-4 px-6 text-slate-500 font-medium">{item.category}</td>
                            <td className="py-4 px-6 text-center">
                              <span className="bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                                {item.lot || '-'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right">
                              <span className="font-black text-lg text-slate-800">{item.stock}</span>
                              <span className="text-xs text-slate-500 ml-1 font-bold">{item.unit}</span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 min-w-[80px] justify-center ${
                                item.status === 'ปกติ' || item.stock > 10
                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                                : 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
                              }`}>
                                {item.stock > 0 && item.stock <= 10 ? 'ใกล้หมด' : item.stock === 0 ? 'สต๊อกต่ำ' : 'ปกติ'}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-right font-medium text-slate-500">
                              {item.expiry || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      {toast.isOpen && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-slate-800 border-slate-700' : 'bg-red-600 border-red-500'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={22} className="text-green-400" /> : <AlertTriangle size={22} className="text-white" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}