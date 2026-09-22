"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Search, Eye, Download, FileText, CheckCircle2, 
  XCircle, Calendar, UserCheck, Package, Printer, X, Loader2,
  MinusCircle, Send, Pill, Calculator, ListChecks, Clock, Plus, Trash2, ChevronDown
} from 'lucide-react';

export default function RequestPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'history'>('request');
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });

  const [inventory, setInventory] = useState<any[]>([]);
  const [requestsHistory, setRequestsHistory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [medFormulas, setMedFormulas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [requestMode, setRequestMode] = useState<'single' | 'set'>('single');
  
  // 🌟 เติม <any> เพื่อแก้ Error ของ Vercel
  const [requestForm, setRequestForm] = useState<any>({
    requester: '', department: '', date: new Date().toISOString().split('T')[0]
  });
  const [requestItems, setRequestItems] = useState<any[]>([{ medName: '', amount: 1 }]);
  const [setForm, setSetForm] = useState<any>({ sowCount: 0, pigletCount: 0 });
  const [calculatedItems, setCalculatedItems] = useState<any[]>([]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const sessionStr = sessionStorage.getItem('farmMedSession');
      let sessionUser = null;
      if (sessionStr) {
        sessionUser = JSON.parse(sessionStr);
        setCurrentUser(sessionUser);
      }

      const { data: invData } = await supabase.from('inventory').select('*').order('name', { ascending: true });
      if (invData) setInventory(invData);

      const { data: reqData } = await supabase.from('requests').select('*').order('id', { ascending: false });
      if (reqData) setRequestsHistory(reqData);

      const savedUsers = localStorage.getItem('farmMedUsers');
      let allUsers = [];
      if (savedUsers) {
        allUsers = JSON.parse(savedUsers);
        setUsers(allUsers);
      }

      const savedFormulas = localStorage.getItem('farmMedFormulas');
      if (savedFormulas) {
        setMedFormulas(JSON.parse(savedFormulas));
      } else {
        setMedFormulas([
          { id: 1, target: 'แม่', name: 'OXYTOCIN', calcType: 'ratePerHead', rate: 2, packSize: 50, unit: 'ขวด' },
          { id: 2, target: 'ลูก', name: 'ก๊อกบุท', calcType: 'headsPerPack', rate: 125, packSize: 1, unit: 'ขวด' }
        ]);
      }

      if (sessionUser && sessionUser.role !== 'admin') {
        const matchedUser = allUsers.find((u: any) => u.name === sessionUser.name);
        setRequestForm((prev: any) => ({
          ...prev,
          requester: sessionUser.name,
          department: matchedUser ? (matchedUser.department || matchedUser.role) : 'พนักงานฟาร์ม'
        }));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSelectRequester = (value: string) => {
    const matchedUser = users.find(u => u.name === value);
    const newDept = matchedUser ? (matchedUser.department || matchedUser.role) : requestForm.department;
    setRequestForm((prev: any) => ({ ...prev, requester: value, department: newDept }));
    if (!newDept.toLowerCase().includes('far') && !newDept.includes('คลอด')) {
      setRequestMode('single');
    }
  };

  const addRequestItem = () => {
    setRequestItems([...requestItems, { medName: '', amount: 1 }]);
  };

  const removeRequestItem = (index: number) => {
    if (requestItems.length > 1) {
      setRequestItems(requestItems.filter((_, idx) => idx !== index));
    }
  };

  // 🌟 ปรับแก้ field ให้เป็น string เพื่อแก้ Error TS2322
  const updateRequestItem = (index: number, field: string, value: any) => {
    const newItems = [...requestItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setRequestItems(newItems);
  };

  useEffect(() => {
    if (requestMode === 'set') {
      const sows = setForm.sowCount || 0;
      const piglets = setForm.pigletCount || 0;
      const items: any[] = [];

      medFormulas.forEach(med => {
        let calculatedPacks = 0; // ประกาศตัวแปรรับค่าก่อนเพื่อแก้ Error

        if (med.target === 'แม่' && sows > 0) {
          if (med.calcType === 'ratePerHead') {
            calculatedPacks = (sows * (med.rate || 1)) / (med.packSize || 1);
          } else {
            calculatedPacks = sows / (med.rate || 1);
          }
          items.push({ name: med.name, calc: calculatedPacks, amount: Math.ceil(calculatedPacks) || 1, unit: med.unit, type: 'แม่' });
        } else if (med.target === 'ลูก' && piglets > 0) {
          if (med.calcType === 'headsPerPack') {
            calculatedPacks = piglets / (med.rate || 1);
          } else {
            calculatedPacks = (piglets * (med.rate || 1)) / (med.packSize || 1);
          }
          items.push({ name: med.name, calc: calculatedPacks, amount: Math.ceil(calculatedPacks) || 1, unit: med.unit, type: 'ลูก' });
        }
      });
      setCalculatedItems(items);
    }
  }, [setForm.sowCount, setForm.pigletCount, requestMode, medFormulas]);

  const updateCalculatedAmount = (index: number, newAmount: number) => {
    const newItems = [...calculatedItems];
    newItems[index] = { ...newItems[index], amount: newAmount };
    setCalculatedItems(newItems);
  };

  const handleSaveRequest = async () => {
    if (!requestForm.requester) {
      showToast('กรุณาระบุผู้ขอเบิก!', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const today = new Date(requestForm.date);
      const dateStr = today.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
      const timeStr = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.';
      const dateTimeStr = `${dateStr} ${timeStr}`;
      
      const docNo = `REQ-${(new Date().getFullYear() + 543).toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 🌟 เติม : any[] เพื่อแก้ Error Implicit Any
      let insertData: any[] = [];

      if (requestMode === 'single') {
        const validItems = requestItems.filter(item => item.medName.trim() !== '');
        
        if (validItems.length === 0) throw new Error('กรุณาระบุรายการยาอย่างน้อย 1 รายการ!');

        for (const item of validItems) {
          if (item.amount < 1) throw new Error(`จำนวนเบิกของยา ${item.medName} ต้องมากกว่า 0!`);
          
          const medItem = inventory.find(inv => inv.name === item.medName);
          if (!medItem) throw new Error(`ไม่พบรายการยา '${item.medName}' ในคลัง!`);
          if (medItem.stock < item.amount) throw new Error(`สต๊อก '${medItem.name}' ไม่พอ! (เหลือ ${medItem.stock} ${medItem.unit})`);

          insertData.push({
            doc_no: docNo,
            requester: requestForm.requester,
            department: requestForm.department || 'พนักงานฟาร์ม',
            med_name: item.medName,
            amount: item.amount,
            unit: medItem.unit,
            status: 'รออนุมัติ',
            request_date: dateTimeStr
          });
        }
      } else {
        if (calculatedItems.length === 0) throw new Error('กรุณาระบุจำนวนสุกรเพื่อคำนวณยา!');

        for (const item of calculatedItems) {
          const medItem = inventory.find(inv => inv.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
          if (!medItem) throw new Error(`ไม่พบยาที่มีชื่อคล้าย '${item.name}' ในคลัง!`);
          if (medItem.stock < item.amount) throw new Error(`สต๊อก '${medItem.name}' ไม่พอ! (เหลือ ${medItem.stock} ${medItem.unit})`);
          
          insertData.push({
            doc_no: docNo,
            requester: requestForm.requester,
            department: requestForm.department,
            med_name: item.name,
            amount: item.amount,
            unit: medItem.unit,
            status: 'รออนุมัติ',
            request_date: dateTimeStr
          });
        }
      }

      const { error: insertError } = await supabase.from('requests').insert(insertData);
      if (insertError) throw insertError;

      showToast('ส่งคำขอเบิกยาสำเร็จ! (สถานะ: รออนุมัติ)', 'success');
      
      setRequestForm({ requester: '', department: '', date: new Date().toISOString().split('T')[0] });
      setRequestItems([{ medName: '', amount: 1 }]);
      setSetForm({ sowCount: 0, pigletCount: 0 });
      setCalculatedItems([]);
      await fetchData();
      setTimeout(() => setActiveTab('history'), 800);

    } catch (err: any) {
      console.error(err);
      showToast(`เกิดข้อผิดพลาด: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => setToast({ isOpen: false, message: '', type: 'success' }), 3500);
  };

  const formattedHistory = requestsHistory.map(req => {
    const dateParts = req.request_date ? req.request_date.split(' ') : [];
    const dDate = dateParts.length > 3 ? dateParts.slice(0, 3).join(' ') : req.request_date;
    const dTime = dateParts.length > 3 ? dateParts.slice(3).join(' ') : '';

    return {
      ...req,
      docNo: req.doc_no,
      medName: req.med_name,
      amount: req.amount,
      unit: req.unit || '',
      requester: req.requester,
      department: req.department || 'ฝ่ายปฏิบัติการ',
      status: req.status || 'รออนุมัติ',
      approver: req.status === 'อนุมัติแล้ว' ? 'Admin (ผู้จัดการ)' : 'รอผู้จัดการพิจารณา',
      date: dDate,
      time: dTime
    };
  });

  const [searchTerm, setSearchTerm] = useState('');
  
  const userFilteredHistory = currentUser?.role === 'admin' 
    ? formattedHistory 
    : formattedHistory.filter(record => record.requester === currentUser?.name);

  const filteredHistory = userFilteredHistory.filter(record => 
    record.docNo?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    record.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.medName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueDocs = Array.from(new Set(filteredHistory.map(item => item.docNo)));

  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [downloadModal, setDownloadModal] = useState({ isOpen: false, record: null as any, status: 'idle' });
  const [progress, setProgress] = useState(0);

  const getGroupedItems = (docNo: string) => {
    return formattedHistory.filter(item => item.docNo === docNo);
  };

  const handleDownload = (record: any) => {
    setDownloadModal({ isOpen: true, record: record, status: 'downloading' });
    setProgress(0);

    const groupedItems = getGroupedItems(record.docNo);
    const currentFarmName = localStorage.getItem('farmName') || 'ฟาร์มสุกรพันธุ์สุขใจ';
    const currentFarmAddress = localStorage.getItem('farmAddress') || '123 ม.4 ต.หนองสุกร อ.เมือง จ.นครปฐม';

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) { clearInterval(interval); return 85; }
        return prev + 15;
      });
    }, 200);

    const pdfContent = document.createElement('div');
    pdfContent.style.padding = '40px';
    pdfContent.style.fontFamily = '"Prompt", "Sarabun", sans-serif';
    pdfContent.style.color = '#1e293b';
    
    let itemsHtml = '';
    groupedItems.forEach((item, index) => {
      itemsHtml += `
        <tr>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8;">${item.medName}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; font-size: 16px;">${item.amount}</td>
          <td style="padding: 12px 15px; border: 1px solid #e2e8f0; text-align: center;">${item.unit}</td>
        </tr>
      `;
    });

    pdfContent.innerHTML = `
      <div style="text-align: center; margin-bottom: 40px;">
        <h1 style="color: #1e3a8a; font-size: 28px; margin: 0; padding: 0;">ใบสรุปการเบิกจ่ายยา</h1>
        <p style="color: #334155; font-size: 18px; margin: 10px 0 4px 0; font-weight: bold;">${currentFarmName}</p>
        <p style="color: #64748b; font-size: 13px; margin: 0;">ที่อยู่: ${currentFarmAddress}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
        <tr>
          <td style="padding: 15px; border: 1px solid #e2e8f0; background-color: #f8fafc; width: 30%; font-weight: bold;">เลขที่เอกสาร</td>
          <td style="padding: 15px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8; font-size: 18px;">${record.docNo}</td>
        </tr>
        <tr>
          <td style="padding: 15px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">วันที่ทำรายการ</td>
          <td style="padding: 15px; border: 1px solid #e2e8f0;">${record.date} ${record.time}</td>
        </tr>
      </table>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">ข้อมูลผู้ขอเบิก</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 30%; color: #64748b;">ชื่อ-นามสกุล</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${record.requester}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">หน่วยงาน/ฟาร์ม</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${record.department}</td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">รายละเอียดรายการยา</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f1f5f9;">
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; width: 10%;">ลำดับ</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: left;">ชื่อยา / วัคซีน</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; width: 20%;">จำนวน</th>
              <th style="padding: 12px; border: 1px solid #e2e8f0; text-align: center; width: 15%;">หน่วย</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 40px;">
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-left: 4px solid ${record.status === 'อนุมัติแล้ว' ? '#10b981' : '#ef4444'}; padding-left: 10px;">สถานะการดำเนินการ</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 30%; color: #64748b;">ผลการพิจารณา</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 16px; color: ${record.status === 'อนุมัติแล้ว' ? '#16a34a' : '#dc2626'};">${record.status}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">ดำเนินการโดย</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${record.approver}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 50px; color: #94a3b8; font-size: 14px;">
        <p>เอกสารฉบับนี้ถูกสร้างโดยระบบอัตโนมัติ (FarmMed System)</p>
      </div>
    `;

    const generatePDF = () => {
      const opt = {
        margin:       10,
        filename:     `เอกสารเบิกยา_${record.docNo}.pdf`,
        image:        { type: 'jpeg', quality: 1 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      (window as any).html2pdf().set(opt).from(pdfContent).save().then(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => {
          setDownloadModal(prev => ({ ...prev, status: 'success' }));
        }, 500);
      });
    };

    if (typeof window !== 'undefined' && !(window as any).html2pdf) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
      script.onload = () => generatePDF();
      document.body.appendChild(script);
    } else {
      generatePDF();
    }
  };

  const isFarrowingBarn = requestForm.department?.toLowerCase().includes('far') || requestForm.department?.includes('คลอด');

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 relative z-10">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-600">
                <MinusCircle size={24} strokeWidth={2.5}/>
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ระบบเบิกยา & ประวัติ</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">ส่งคำขอเบิกยา ตรวจสอบสถานะ และพิมพ์เอกสารย้อนหลัง</p>
              </div>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-2xl inline-flex shadow-inner">
              <button 
                onClick={() => setActiveTab('request')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'request' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <Send size={18} /> ฟอร์มส่งคำขอ
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'
                }`}
              >
                <FileText size={18} /> สถานะคำขอ
              </button>
            </div>
          </div>

          {activeTab === 'request' && (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 sm:p-8 animate-in fade-in duration-500 max-w-4xl mx-auto mt-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                    <UserCheck size={16} className="text-blue-500"/> ผู้ขอเบิก (พนักงาน/สัตวบาล) <span className="text-red-500">*</span>
                  </label>
                  <input 
                    list="users-list"
                    type="text" 
                    value={requestForm.requester || ''} 
                    placeholder="-- เลือกผู้ขอเบิก --"
                    onChange={(e) => handleSelectRequester(e.target.value)}
                    disabled={currentUser?.role !== 'admin'} 
                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800 font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none disabled:opacity-70" 
                  />
                  <datalist id="users-list">
                    {users.map((u: any) => (
                      <option key={u.id} value={u.name} />
                    ))}
                  </datalist>
                  <p className="text-xs text-slate-400 font-medium mt-2 flex items-center gap-1">
                    แผนก/ฟาร์ม: <span className="text-blue-600 font-bold">{requestForm.department || '-'}</span>
                  </p>
                </div>

                {isFarrowingBarn && (
                  <div className="md:col-span-2 bg-blue-50/50 border border-blue-100 p-2 rounded-2xl flex gap-2">
                    <button 
                      onClick={() => setRequestMode('single')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${requestMode === 'single' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                      <Pill size={18}/> เบิกยาปกติ (ทีละรายการ)
                    </button>
                    <button 
                      onClick={() => setRequestMode('set')}
                      className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${requestMode === 'set' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                    >
                      <Calculator size={18}/> เบิกยาแบบชุด (แม่และลูก)
                    </button>
                  </div>
                )}

                {requestMode === 'single' && (
                  <div className="md:col-span-2 space-y-4 bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                    <div className="flex justify-between items-center mb-2 border-b border-slate-200 pb-4">
                      <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                        <Pill size={18} className="text-blue-500"/> รายการยาที่ต้องการเบิก
                      </h4>
                      <button 
                        onClick={addRequestItem}
                        className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-200 flex items-center gap-1.5 shadow-sm transition-colors"
                      >
                        <Plus size={16} strokeWidth={3}/> เพิ่มรายการ
                      </button>
                    </div>

                    <div className="space-y-3">
                      {requestItems.map((item, index) => (
                        <div key={index} className="flex gap-3 items-start relative group">
                          <div className="flex-1">
                            <label className="block text-xs font-bold text-slate-500 mb-1">ชื่อยา/วัคซีน</label>
                            <div className="relative">
                              <select 
                                value={item.medName || ""} 
                                onChange={(e) => updateRequestItem(index, 'medName', e.target.value)}
                                className="w-full px-4 py-3 pr-10 rounded-xl border border-slate-200 bg-white text-blue-700 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none cursor-pointer" 
                              >
                                <option value="" disabled>-- เลือกยาจากคลัง --</option>
                                {inventory.filter(med => med.stock > 0).map(med => (
                                  <option key={med.id} value={med.name}>
                                    {med.name} (คงเหลือ: {med.stock} {med.unit})
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>

                          <div className="w-28 sm:w-32">
                            <label className="block text-xs font-bold text-slate-500 mb-1 text-center">จำนวน</label>
                            <input 
                              type="number" min="1" value={item.amount || 1}
                              onChange={(e) => updateRequestItem(index, 'amount', parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none text-center" 
                            />
                          </div>

                          {requestItems.length > 1 && (
                            <div className="pt-5">
                              <button 
                                onClick={() => removeRequestItem(index)}
                                className="p-3 text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                                title="ลบรายการนี้"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-200">
                      <label className="block text-sm font-extrabold text-slate-700 mb-2 flex items-center gap-1.5">
                        <Calendar size={16} className="text-blue-500"/> วันที่ทำรายการ <span className="text-red-500">*</span>
                      </label>
                      <input 
                        type="date" value={requestForm.date || ''}
                        onChange={(e) => setRequestForm((prev: any) => ({ ...prev, date: e.target.value }))}
                        className="w-full md:w-1/2 px-4 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-900 font-bold focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" 
                      />
                    </div>
                  </div>
                )}

                {requestMode === 'set' && (
                  <>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 md:col-span-2">
                      <div className="flex items-center gap-2 mb-4 text-slate-700 font-extrabold text-sm">
                        <ListChecks size={18} className="text-blue-500"/> กรอกจำนวนสุกรเพื่อคำนวณยา
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">จำนวนแม่ (ตัว)</label>
                          <input 
                            type="number" min="0" value={setForm.sowCount || ''} placeholder="0"
                            onChange={(e) => setSetForm((prev: any) => ({ ...prev, sowCount: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-center text-blue-700 focus:border-blue-500 outline-none" 
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">จำนวนลูก (ตัว)</label>
                          <input 
                            type="number" min="0" value={setForm.pigletCount || ''} placeholder="0"
                            onChange={(e) => setSetForm((prev: any) => ({ ...prev, pigletCount: parseInt(e.target.value) || 0 }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 font-bold text-center text-pink-600 focus:border-pink-500 outline-none" 
                          />
                        </div>
                      </div>
                    </div>

                    {calculatedItems.length > 0 && (
                      <div className="md:col-span-2 border border-slate-100 rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-100">
                            <tr className="text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                              <th className="py-3 px-4">รายการยา (คำนวณอัตโนมัติ)</th>
                              <th className="py-3 px-4 text-center">STD</th>
                              <th className="py-3 px-4 text-center w-32">จำนวนที่ส่งเบิก</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {calculatedItems.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                    {item.name} 
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${item.type==='แม่'?'bg-blue-100 text-blue-600':'bg-pink-100 text-pink-600'}`}>{item.type}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-center text-xs font-medium text-slate-400">
                                  {item.calc.toFixed(2)}
                                </td>
                                <td className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <input 
                                      type="number" min="1" value={item.amount || 1}
                                      onChange={(e) => updateCalculatedAmount(idx, parseInt(e.target.value) || 1)}
                                      className="w-16 px-2 py-1.5 rounded border border-slate-200 text-center font-bold text-slate-700 outline-none focus:border-blue-500"
                                    />
                                    <span className="text-xs text-slate-500 font-bold">{item.unit}</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

              </div>

              <div className="flex justify-end pt-6 border-t border-slate-100">
                <button 
                  onClick={handleSaveRequest} disabled={isSaving || (requestMode === 'set' && calculatedItems.length === 0)}
                  className="w-full sm:w-auto px-10 py-4 rounded-2xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} 
                  {isSaving ? 'กำลังส่งคำขอ...' : 'ส่งคำขอเบิกยา'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col animate-in fade-in duration-500">
              
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50">
                <div className="relative flex-1 max-w-md">
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="ค้นหา เลขที่เอกสาร / ผู้ขอเบิก / ชื่อยา..." 
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition-all" 
                  />
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>

              <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto relative">
                <table className="w-full text-left text-sm min-w-[900px]">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr className="border-b border-gray-100 text-slate-400 font-semibold text-xs bg-white uppercase tracking-wider">
                      <th className="px-6 py-4">เลขที่เอกสาร</th>
                      <th className="px-6 py-4">ข้อมูลผู้เบิก</th>
                      <th className="px-6 py-4 text-center">วันที่ทำรายการ</th>
                      <th className="px-6 py-4 text-center">สถานะ</th>
                      <th className="px-6 py-4 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {isLoading ? (
                      <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-bold"><Loader2 className="animate-spin inline mr-2"/>กำลังโหลดข้อมูล...</td></tr>
                    ) : uniqueDocs.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-16 text-slate-400 font-bold">ไม่พบคำขอเบิกยา</td></tr>
                    ) : (
                      uniqueDocs.map((docNo: any) => {
                        const itemsInDoc = filteredHistory.filter(item => item.docNo === docNo);
                        const firstItem = itemsInDoc[0];
                        
                        return (
                          <tr key={docNo} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-5">
                              <div className="font-bold text-slate-800">{docNo}</div>
                              <div className="text-xs text-blue-600 mt-0.5 font-bold bg-blue-50 px-2 py-0.5 rounded-md inline-block">เบิกทั้งหมด {itemsInDoc.length} รายการ</div>
                            </td>
                            <td className="px-6 py-5">
                              <div className="font-bold text-slate-700">{firstItem.requester}</div>
                              <div className="text-xs text-slate-500 mt-0.5 font-medium">{firstItem.department}</div>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className="text-slate-600 font-medium">{firstItem.date} {firstItem.time}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                                firstItem.status === 'อนุมัติแล้ว' ? 'bg-green-100/80 text-green-700 border border-green-200' : 
                                firstItem.status === 'รออนุมัติ' ? 'bg-orange-100/80 text-orange-700 border border-orange-200' :
                                'bg-red-100/80 text-red-700 border border-red-200'
                              }`}>
                                {firstItem.status === 'อนุมัติแล้ว' ? <CheckCircle2 size={14}/> : firstItem.status === 'รออนุมัติ' ? <Clock size={14}/> : <XCircle size={14}/>}
                                {firstItem.status}
                              </span>
                            </td>
                            <td className="px-6 py-5 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => setSelectedRecord(firstItem)}
                                  className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-lg transition-colors border border-blue-100 shadow-sm"
                                  title="ดูรายละเอียดเอกสาร"
                                >
                                  <Eye size={18} />
                                </button>
                                {firstItem.status === 'อนุมัติแล้ว' && (
                                  <button 
                                    onClick={() => handleDownload(firstItem)}
                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors border border-indigo-100 shadow-sm"
                                    title="ดาวน์โหลด PDF"
                                  >
                                    <Download size={18} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {selectedRecord && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setSelectedRecord(null)}></div>
          
          <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] w-full max-w-3xl relative z-10 animate-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[90vh]">
            
            <div className="flex-shrink-0 flex justify-between items-center px-8 py-5 border-b border-gray-100 bg-white rounded-t-[2rem]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 text-slate-600 flex items-center justify-center shadow-sm">
                  <FileText size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">รายละเอียดคำขอเบิกยา</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-medium">สถานะ:</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      selectedRecord.status === 'อนุมัติแล้ว' ? 'bg-green-100 text-green-700' : 
                      selectedRecord.status === 'รออนุมัติ' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedRecord.status}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center mb-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">เลขที่เอกสาร</span>
                  <span className="font-black text-lg text-slate-800">{selectedRecord.docNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5 justify-end">
                    <Calendar size={14} /> วันที่ทำรายการ
                  </span>
                  <span className="font-bold text-sm text-slate-700">{selectedRecord.date} {selectedRecord.time}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center gap-1.5">
                  <UserCheck size={14} /> ผู้ขอเบิก
                </span>
                <span className="font-bold text-slate-800 text-base block">{selectedRecord.requester}</span>
                <div className="text-xs text-slate-500 mt-1 font-medium">{selectedRecord.department}</div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm mb-6 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                  <Package size={16} className="text-blue-500"/> 
                  <span className="font-extrabold text-sm text-slate-700">รายการยาที่เบิก</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-5 py-3 w-16 text-center">ลำดับ</th>
                      <th className="px-5 py-3">ชื่อยา / วัคซีน</th>
                      <th className="px-5 py-3 text-center w-24">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {getGroupedItems(selectedRecord.docNo).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-5 py-3 font-bold text-[#1a56db]">{item.medName}</td>
                        <td className="px-5 py-3 text-center">
                          <span className="font-bold text-slate-800">{item.amount}</span> 
                          <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-5">สถานะการพิจารณา</h4>
                
                <div className={`inline-flex items-center gap-3 px-5 py-3 rounded-2xl border-2 border-dashed ${
                  selectedRecord.status === 'อนุมัติแล้ว' ? 'bg-green-50/50 border-green-200 text-green-700' : 
                  selectedRecord.status === 'รออนุมัติ' ? 'bg-orange-50/50 border-orange-200 text-orange-700' :
                  'bg-red-50/50 border-red-200 text-red-700'
                }`}>
                  {selectedRecord.status === 'อนุมัติแล้ว' ? <CheckCircle2 size={24} strokeWidth={2.5}/> : 
                   selectedRecord.status === 'รออนุมัติ' ? <Clock size={24} strokeWidth={2.5}/> :
                   <XCircle size={24} strokeWidth={2.5}/>}
                  <div className="text-left">
                    <div className="font-bold text-sm">
                      {selectedRecord.status === 'อนุมัติแล้ว' ? 'อนุมัติจ่ายยาและตัดสต๊อกเรียบร้อย' : 
                       selectedRecord.status === 'รออนุมัติ' ? 'คำขอกำลังรอการอนุมัติจากผู้จัดการ' :
                       'คำขอนี้ถูกปฏิเสธ'}
                    </div>
                    <div className="text-[11px] opacity-80 mt-0.5 font-medium">ดำเนินการโดย: {selectedRecord.approver}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 p-6 border-t border-slate-100 bg-white rounded-b-[2rem] flex gap-3">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 py-3.5 rounded-2xl font-bold text-sm transition-colors"
              >
                ปิดหน้าต่าง
              </button>
              {selectedRecord.status === 'อนุมัติแล้ว' && (
                <button 
                  onClick={() => handleDownload(selectedRecord)}
                  className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
                >
                  <Printer size={18} /> ดาวน์โหลดเอกสาร (PDF)
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {downloadModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => downloadModal.status === 'success' && setDownloadModal(prev => ({ ...prev, isOpen: false }))}></div>
          
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-sm relative z-10 animate-in zoom-in-95 duration-200 text-center flex flex-col items-center">
            
            {downloadModal.status === 'downloading' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5 border-[6px] border-white shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <Loader2 size={36} className="text-blue-500 animate-spin" strokeWidth={2.5}/>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">กำลังสร้างไฟล์ PDF...</h3>
                <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
                  ระบบกำลังสร้างข้อมูลเอกสาร<br/>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md mt-1 inline-block">{downloadModal.record?.docNo}</span>
                </p>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-400">{progress}%</span>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5 border-[6px] border-white shadow-[0_0_20px_rgba(34,197,94,0.2)] animate-in zoom-in">
                  <CheckCircle2 size={40} className="text-green-500" strokeWidth={2.5}/>
                </div>
                <h3 className="text-xl font-extrabold text-green-600 mb-2">ดาวน์โหลดสำเร็จ!</h3>
                <p className="text-slate-500 text-xs mb-8 font-medium leading-relaxed">
                  ไฟล์ <span className="font-bold text-slate-700">เอกสารเบิกยา_{downloadModal.record?.docNo}.pdf</span><br/>
                  ถูกบันทึกลงในเครื่องของคุณเรียบร้อยแล้ว
                </p>
                <button 
                  onClick={() => setDownloadModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
              </>
            )}

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