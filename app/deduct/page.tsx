"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import SignatureCanvas from 'react-signature-canvas'; // 🌟 Import เครื่องมือวาดลายเซ็น
import { 
  Info, Bell, FileEdit, CheckSquare, Search, 
  X, CheckCircle2, XCircle, Loader2, Package, UserCheck, 
  AlertTriangle, Calendar, ListChecks, FileText, PenLine, Eraser
} from 'lucide-react';

export default function DeductPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [requests, setRequests] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  // Modal State
  const [selectedGroup, setSelectedGroup] = useState<any[] | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 🌟 สร้างตัวแปรอ้างอิงไปยังกระดานเซ็นชื่อ
  const sigCanvas = useRef<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: reqData } = await supabase
        .from('requests')
        .select('*')
        .eq('status', 'รออนุมัติ')
        .order('id', { ascending: true });
      if (reqData) setRequests(reqData);

      const { data: invData } = await supabase.from('inventory').select('*');
      if (invData) setInventory(invData);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const groupedRequests = requests.reduce((acc, req) => {
    if (!acc[req.doc_no]) acc[req.doc_no] = [];
    acc[req.doc_no].push(req);
    return acc;
  }, {} as Record<string, any[]>);
  
  const uniqueDocs = Object.keys(groupedRequests);

  const handleApprove = async () => {
    if (!selectedGroup || selectedGroup.length === 0) return;

    // 🌟 เช็คว่ามีการเซ็นชื่อหรือยังก่อนกดอนุมัติ
    if (sigCanvas.current?.isEmpty()) {
      showToast('กรุณาเซ็นชื่อเพื่อยืนยันการอนุมัติ!', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      // 🌟 แปลงลายเซ็นบนกระดานให้เป็นโค้ดรูปภาพ (Base64)
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');

      for (const req of selectedGroup) {
        const { data: invData } = await supabase
          .from('inventory')
          .select('*')
          .eq('name', req.med_name)
          .single();

        if (!invData || invData.stock < req.amount) {
          throw new Error(`ไม่สามารถอนุมัติได้! สต๊อกยา '${req.med_name}' มีไม่เพียงพอ`);
        }
      }

      for (const req of selectedGroup) {
        const { data: invData } = await supabase.from('inventory').select('*').eq('name', req.med_name).single();
        const newStock = invData.stock - req.amount;
        const newStatus = newStock === 0 ? 'สต๊อกต่ำ' : (newStock <= 10 ? 'ใกล้หมด' : 'ปกติ');
        
        const { error: invError } = await supabase
          .from('inventory')
          .update({ stock: newStock, status: newStatus })
          .eq('id', invData.id);
        if (invError) throw invError;

        // 🌟 อัปเดตสถานะคำขอ พร้อมกับบันทึกลายเซ็นลงฐานข้อมูล
        const { error: reqError } = await supabase
          .from('requests')
          .update({ status: 'อนุมัติแล้ว', signature: signatureData }) 
          .eq('id', req.id);
        if (reqError) throw reqError;

        const today = new Date();
        const dateStr = today.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
        const timeStr = today.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
        
        await supabase.from('activities').insert([{
          action: 'เบิกยา',
          detail: `${req.med_name} จำนวน ${req.amount} ${req.unit}`,
          user_name: req.requester,
          type: 'deduct',
          date: dateStr,
          time: timeStr
        }]);
      }

      showToast('อนุมัติและจ่ายยาสำเร็จทั้งหมด!', 'success');
      setSelectedGroup(null);
      fetchData(); 
    } catch (err: any) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedGroup) return;
    setIsProcessing(true);
    try {
      const reqIds = selectedGroup.map(req => req.id);
      
      const { error } = await supabase
        .from('requests')
        .update({ status: 'ปฏิเสธ' })
        .in('id', reqIds);
      
      if (error) throw error;
      showToast('ปฏิเสธคำขอเรียบร้อยแล้ว', 'success');
      setSelectedGroup(null);
      fetchData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 4000);
  };

  const isAllStockEnough = selectedGroup?.every(req => {
    const invItem = inventory.find(inv => inv.name === req.med_name);
    return invItem && invItem.stock >= req.amount;
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-blue-600">
                  <CheckSquare size={24} strokeWidth={2.5}/>
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">อนุมัติ / จ่ายยา</h1>
                  <p className="text-sm text-slate-500 font-medium mt-1">จัดการคำขอเบิกยาจากฟาร์มต่างๆ</p>
                </div>
              </div>
              <div className="bg-orange-500 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-orange-500/30 flex items-center gap-2">
                <Bell size={18} /> {uniqueDocs.length} บิลคำขอ
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 flex gap-4 items-start mb-6">
              <div className="text-blue-500 mt-0.5"><Info size={22} /></div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm mb-1">คำแนะนำในการพิจารณาอนุมัติ</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  กรุณาตรวจสอบความถูกต้องของ <span className="font-bold underline text-slate-800">รายการยา</span> และ <span className="font-bold underline text-slate-800">จำนวนที่ขอเบิก</span> ให้ครบถ้วน และลงลายมือชื่อก่อนกดอนุมัติ ระบบจะทำการตัดสต๊อกโดยอัตโนมัติ 
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
              <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/30">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center">
                  <Bell size={16} strokeWidth={3} />
                </div>
                <h3 className="font-extrabold text-slate-800">รายการที่รอการอนุมัติ</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 font-bold text-xs uppercase tracking-wider">
                      <th className="px-6 py-4">เลขที่เอกสาร</th>
                      <th className="px-6 py-4">ผู้ขอเบิก</th>
                      <th className="px-6 py-4">แผนก/ฟาร์ม</th>
                      <th className="px-6 py-4 text-center">รายการยา</th>
                      <th className="px-6 py-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {isLoading ? (
                      <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-bold"><Loader2 className="animate-spin inline mr-2"/>กำลังโหลดข้อมูล...</td></tr>
                    ) : uniqueDocs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-20 text-slate-400">
                          <CheckCircle2 size={48} className="mx-auto text-green-200 mb-3" strokeWidth={1.5} />
                          <p className="font-bold text-lg text-slate-500">ไม่มีคำขอรออนุมัติ</p>
                          <p className="text-xs font-medium mt-1">ยอดเยี่ยม! คุณเคลียร์งานทั้งหมดเรียบร้อยแล้ว</p>
                        </td>
                      </tr>
                    ) : (
                      uniqueDocs.map((docNo) => {
                        const group = groupedRequests[docNo];
                        const firstItem = group[0];

                        return (
                          <tr key={docNo} className="hover:bg-slate-50/80 transition-colors group/row">
                            <td className="px-6 py-5">
                              <div className="font-extrabold text-slate-800 flex items-center gap-2">
                                <FileEdit size={14} className="text-slate-400" /> {docNo}
                              </div>
                              <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{firstItem.request_date}</div>
                            </td>
                            <td className="px-6 py-5 font-bold text-slate-700">{firstItem.requester}</td>
                            <td className="px-6 py-5 text-slate-500 font-medium text-xs">{firstItem.department}</td>
                            <td className="px-6 py-5 text-center">
                              <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg text-xs border border-blue-100">
                                รวมทั้งหมด {group.length} รายการ
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <button 
                                onClick={() => setSelectedGroup(group)}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold shadow-sm"
                              >
                                <FileEdit size={14} /> เปิดตรวจสอบ
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* ================= MODAL: ตรวจสอบและอนุมัติ ================= */}
      {selectedGroup && selectedGroup.length > 0 && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => !isProcessing && setSelectedGroup(null)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[95vh] overflow-hidden">
            
            <div className="p-6 flex justify-between items-center relative flex-shrink-0 border-b border-slate-100">
              <div className="relative z-10">
                <h3 className="font-extrabold text-xl tracking-tight text-slate-800">ตรวจสอบคำขอเบิก</h3>
                <p className="text-slate-500 text-xs mt-1 font-medium flex items-center gap-1.5">
                  <FileText size={12}/> เลขที่: {selectedGroup[0].doc_no}
                </p>
              </div>
              <button onClick={() => setSelectedGroup(null)} disabled={isProcessing} className="relative z-10 text-slate-400 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1"><UserCheck size={14}/> ผู้ขอเบิก</span>
                  <span className="font-bold text-slate-800 block text-sm">{selectedGroup[0].requester}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{selectedGroup[0].department}</span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase mb-1"><Calendar size={14}/> วันที่ทำรายการ</span>
                  <span className="font-bold text-slate-800 block text-sm">{selectedGroup[0].request_date.split(' ')[0]}</span>
                  <span className="text-[11px] text-slate-500 font-medium">{selectedGroup[0].request_date.split(' ')[1]} {selectedGroup[0].request_date.split(' ')[2]}</span>
                </div>
              </div>

              {/* ตารางแสดงรายการยาในบิล */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center gap-2 text-slate-700">
                  <ListChecks size={16} /> <span className="font-extrabold text-sm">รายการยาทั้งหมด ({selectedGroup.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white border-b border-slate-100">
                      <tr className="text-slate-400 font-semibold text-[10px] uppercase tracking-wider">
                        <th className="px-4 py-2.5">ชื่อยา/วัคซีน</th>
                        <th className="px-4 py-2.5 text-center">ขอเบิก</th>
                        <th className="px-4 py-2.5 text-center">คลัง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 bg-white">
                      {selectedGroup.map((req, idx) => {
                        const invItem = inventory.find(inv => inv.name === req.med_name);
                        const currentStock = invItem ? invItem.stock : 0;
                        const isEnough = currentStock >= req.amount;

                        return (
                          <tr key={req.id}>
                            <td className="px-4 py-2.5 font-bold text-slate-800">{req.med_name}</td>
                            <td className="px-4 py-2.5 text-center">
                              <span className="font-black text-blue-600">{req.amount}</span> 
                              <span className="text-[10px] text-slate-500 font-bold ml-1">{req.unit}</span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                isEnough ? 'bg-green-50 text-green-600' : 'bg-red-100 text-red-600 animate-pulse'
                              }`}>
                                {!isEnough && <AlertTriangle size={10}/>}
                                {currentStock}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {!isAllStockEnough && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl flex items-center justify-center gap-2 text-[11px] font-bold border border-red-100">
                  <AlertTriangle size={16} /> ยาบางรายการสต๊อกไม่พอ ไม่สามารถอนุมัติได้
                </div>
              )}

              {/* 🌟 กระดานลายเซ็น (Digital Signature) */}
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <PenLine size={18} className="text-slate-700" />
                  <span className="font-extrabold text-slate-800 text-sm">ลายมือชื่อผู้อนุมัติ</span>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">กรุณาเซ็นชื่อในกรอบด้านล่างเพื่อยืนยันการอนุมัติ</p>
                
                <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 relative overflow-hidden h-36">
                  <SignatureCanvas
                    ref={sigCanvas}
                    penColor="#0f172a"
                    canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                  />
                  <div className="absolute bottom-2 right-2 flex items-center justify-center pointer-events-none opacity-10">
                    <PenLine size={64} />
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button 
                    onClick={() => sigCanvas.current?.clear()}
                    className="text-[11px] font-bold text-red-500 flex items-center gap-1 hover:text-red-600 transition-colors bg-red-50 px-3 py-1.5 rounded-lg"
                  >
                    <Eraser size={14} /> ล้างลายเซ็น
                  </button>
                </div>
              </div>

            </div>

            <div className="p-5 bg-slate-50 flex flex-col sm:flex-row gap-3 flex-shrink-0 border-t border-slate-100">
              <button 
                onClick={handleReject} disabled={isProcessing}
                className="w-full sm:flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                ปฏิเสธ
              </button>
              <button 
                onClick={handleApprove} disabled={isProcessing || !isAllStockEnough}
                className="w-full sm:flex-[2] bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} 
                {isProcessing ? 'กำลังประมวลผล...' : 'อนุมัติ & ตัดสต๊อก'}
              </button>
            </div>

          </div>
        </div>
      )}

      {toast.isOpen && (
        <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className={`text-white px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border ${
            toast.type === 'success' ? 'bg-slate-800 border-slate-700' : 'bg-red-600 border-red-500'
          }`}>
            {toast.type === 'success' ? <CheckCircle2 size={22} className="text-green-400" /> : <XCircle size={22} className="text-white" />}
            <span className="font-bold text-sm tracking-wide">{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}