"use client";

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import { 
  Search, Users, UserCheck, FileText, Calendar, 
  Package, CheckCircle2, ChevronRight, X, Printer, Download, Loader2 
} from 'lucide-react';

export default function InventoryPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [requesters, setRequesters] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // 🌟 ฟังก์ชันดึงข้อมูลพนักงานจริง และประวัติการเบิกจริงจาก Supabase
  useEffect(() => {
    const loadUsersAndHistory = async () => {
      setIsLoadingData(true);
      try {
        // 1. ดึงข้อมูลรายการคำขอที่อนุมัติแล้วจากตาราง requests โดยตรงเพื่อให้มี doc_no และรายการยาชัดเจน
        const { data: reqData, error } = await supabase
          .from('requests')
          .select('*')
          .eq('status', 'อนุมัติแล้ว')
          .order('id', { ascending: false });
          
        let approvedRequests: any[] = [];
        if (reqData && !error) {
          approvedRequests = reqData;
        }

        // 2. ดึงรายชื่อพนักงาน "ตัวจริง" จากระบบตั้งค่า LocalStorage
        const savedUsers = localStorage.getItem('farmMedUsers');
        if (savedUsers) {
          const parsedUsers = JSON.parse(savedUsers);
          const colors = ['bg-blue-600', 'bg-emerald-600', 'bg-indigo-600', 'bg-purple-600', 'bg-pink-600', 'bg-orange-600', 'bg-teal-600'];
          
          // นำพนักงานจริง มาจับคู่กับประวัติการเบิกของตัวเอง
          const formattedUsers = parsedUsers.map((u: any, index: number) => {
            
            // หาคำขอทั้งหมดของพนักงานคนนี้
            const userRequests = approvedRequests.filter(req => req.requester === u.name);
            
            // 🌟 จัดกลุ่มคำขอตามเลขที่เอกสาร (doc_no)
            const groupedDocs = userRequests.reduce((acc, req) => {
              if (!acc[req.doc_no]) {
                const dateParts = req.request_date ? req.request_date.split(' ') : [];
                const dDate = dateParts.length > 3 ? dateParts.slice(0, 3).join(' ') : req.request_date;
                const dTime = dateParts.length > 3 ? dateParts.slice(3).join(' ') : '';
                
                acc[req.doc_no] = {
                  docNo: req.doc_no,
                  date: dDate,
                  time: dTime,
                  status: 'อนุมัติแล้ว',
                  approver: 'Admin (ผู้จัดการ)',
                  items: []
                };
              }
              acc[req.doc_no].items.push({
                medName: req.med_name,
                amount: req.amount,
                unit: req.unit
              });
              return acc;
            }, {} as Record<string, any>);

            // แปลง Object ที่จัดกลุ่มแล้ว กลับมาเป็น Array ของบิล
            const userHistory = Object.values(groupedDocs).sort((a: any, b: any) => 
               b.docNo.localeCompare(a.docNo) // เรียงจากบิลใหม่ไปเก่า
            );

            return {
              id: u.id || index,
              name: u.name,
              role: u.department ? `${u.role} (${u.department})` : u.role,
              totalWithdrawals: userHistory.length,
              lastDate: userHistory.length > 0 ? (userHistory[0] as any).date : '-',
              avatarBg: colors[index % colors.length],
              history: userHistory
            };
          });

          setRequesters(formattedUsers);
        } else {
          setRequesters([]); // ถ้ายังไม่มีพนักงานเลย
        }
      } catch (error) {
        console.error('Error loading real data:', error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUsersAndHistory();
  }, []);

  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [downloadModal, setDownloadModal] = useState({ isOpen: false, status: 'idle' });
  const [progress, setProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequesters = requesters.filter((req: any) => 
    req.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDownloadPDF = (bill: any, userName: string, userRole: string) => {
    setDownloadModal({ isOpen: true, status: 'downloading' });
    setProgress(0);

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
    
    // 🌟 สร้างแถวตารางสำหรับรายการยาทุกตัวในบิลนี้
    let itemsHtml = '';
    bill.items.forEach((item: any, index: number) => {
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
          <td style="padding: 15px; border: 1px solid #e2e8f0; font-weight: bold; color: #1d4ed8; font-size: 18px;">${bill.docNo}</td>
        </tr>
        <tr>
          <td style="padding: 15px; border: 1px solid #e2e8f0; background-color: #f8fafc; font-weight: bold;">วันที่ทำรายการ</td>
          <td style="padding: 15px; border: 1px solid #e2e8f0;">${bill.date} ${bill.time}</td>
        </tr>
      </table>

      <div style="margin-bottom: 30px;">
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-left: 4px solid #3b82f6; padding-left: 10px;">ข้อมูลผู้ขอเบิก</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 30%; color: #64748b;">ชื่อ-นามสกุล</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${userName}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">หน่วยงาน/ตำแหน่ง</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${userRole}</td>
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
        <h3 style="font-size: 18px; color: #0f172a; margin-bottom: 15px; border-left: 4px solid ${bill.status === 'อนุมัติแล้ว' ? '#10b981' : '#ef4444'}; padding-left: 10px;">สถานะการดำเนินการ</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; width: 30%; color: #64748b;">ผลการพิจารณา</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; font-size: 16px; color: ${bill.status === 'อนุมัติแล้ว' ? '#16a34a' : '#dc2626'};">${bill.status}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b;">ผู้อนุมัติ</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">${bill.approver}</td>
          </tr>
        </table>
      </div>
      <div style="text-align: center; margin-top: 50px; color: #94a3b8; font-size: 14px;">
        <p>เอกสารฉบับนี้ถูกสร้างโดยระบบอัตโนมัติ (FarmMed System)</p>
      </div>
    `;

    const generatePDF = () => {
      const opt = {
        margin: 10, filename: `ใบเบิกยา_${bill.docNo}.pdf`, image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      (window as any).html2pdf().set(opt).from(pdfContent).save().then(() => {
        clearInterval(interval);
        setProgress(100);
        setTimeout(() => setDownloadModal({ isOpen: true, status: 'success' }), 500);
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

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden relative font-sans">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-blue-600">
                <Users size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">ประวัติการเบิกยาแยกตามบุคคล</h1>
                <p className="text-sm text-slate-500 font-medium mt-1">คลิกที่รายชื่อเพื่อตรวจสอบประวัติการเบิกบิลยาและรายการยาทั้งหมด</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาชื่อผู้เบิก / หน่วยงาน..." 
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 font-bold text-slate-800 transition-all shadow-sm" 
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>
          </div>

          {/* ตารางแสดงการ์ดพนักงาน */}
          {isLoadingData ? (
             <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40}/></div>
          ) : filteredRequesters.length === 0 ? (
             <div className="text-center py-20 text-slate-400 font-bold bg-white rounded-3xl border border-slate-100">ยังไม่มีรายชื่อพนักงานในระบบ (เพิ่มได้ที่หน้าตั้งค่า)</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequesters.map((user: any) => (
                <div 
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer group transform hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div>
                    <div className="flex items-center gap-4 mb-5">
                      <div className={`w-14 h-14 rounded-2xl ${user.avatarBg} flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        {user.name.substring(0, 2)}
                      </div>
                      <div className="overflow-hidden">
                        <h3 className="font-extrabold text-lg text-slate-800 truncate group-hover:text-blue-600 transition-colors">{user.name}</h3>
                        <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">{user.role}</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 mb-4 border border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">บิลที่เคยเบิกทั้งหมด</span>
                        <span className="font-black text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">{user.totalWithdrawals} บิล</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">เบิกครั้งล่าสุด</span>
                        <span className="font-bold text-slate-600">{user.lastDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-bold text-sm">
                    <span className="flex items-center gap-1.5"><FileText size={16}/> ดูประวัติการเบิกยา</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <ChevronRight size={18} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ================= MODAL 1: ประวัติการเบิก ================= */}
      {selectedUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setSelectedUser(null)}></div>
          
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl relative z-10 animate-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[90vh]">
            
            <div className="flex-shrink-0 flex justify-between items-center px-8 py-6 border-b border-gray-100 bg-white rounded-t-[2.5rem]">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl ${selectedUser.avatarBg} text-white font-bold flex items-center justify-center shadow-md`}>
                  <UserCheck size={24} />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-slate-800 tracking-tight">{selectedUser.name}</h3>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">{selectedUser.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-700 p-2.5 rounded-full hover:bg-slate-100 transition-colors">
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">ประวัติและรายการบิลยาที่เคยเบิก</h4>

              {selectedUser.history.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Package size={40} className="mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-500 font-bold">ผู้ใช้งานนี้ยังไม่มีประวัติการเบิกยาในระบบ</p>
                </div>
              ) : (
                selectedUser.history.map((bill: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-blue-200 transition-all">
                    <div className="space-y-1.5 w-full sm:w-auto flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-800 text-sm">{bill.docNo}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-100 text-green-700`}>
                          {bill.status}
                        </span>
                      </div>
                      
                      {/* 🌟 แสดงจำนวนรายการยารวมในบิล แทนที่จะโชว์แค่ยาตัวแรก */}
                      <div className="text-sm font-extrabold text-blue-600 flex items-center gap-1.5">
                        <Package size={14}/> เบิกยาจำนวน <span className="underline decoration-blue-300">{bill.items.length}</span> รายการ
                      </div>
                      
                      <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Calendar size={12}/> {bill.date} {bill.time}
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedBill({ ...bill, user: selectedUser })}
                      className="w-full sm:w-auto px-5 py-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Printer size={14}/> ดูใบเบิก
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex-shrink-0 p-6 border-t border-slate-100 bg-white rounded-b-[2.5rem]">
              <button 
                onClick={() => setSelectedUser(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-colors shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2: รายละเอียดใบเบิก (ตารางรวมยาหลายรายการ) ================= */}
      {selectedBill && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedBill(null)}></div>
          
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-lg relative z-10 animate-in zoom-in-95 duration-200 border border-white/50 flex flex-col max-h-[90vh]">
            
            <div className="flex justify-between items-center pb-5 border-b border-slate-100 mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText size={20}/>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">รายละเอียดใบเบิกยา</h3>
                  <p className="text-xs text-slate-400 font-bold">{selectedBill.docNo}</p>
                </div>
              </div>
              <button onClick={() => setSelectedBill(null)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 mb-8 flex-1 overflow-y-auto pr-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-400">สถานะเอกสาร</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-lg bg-green-100 text-green-700`}>
                  {selectedBill.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">วันที่ทำรายการ</span>
                  <span className="text-xs font-bold text-slate-700">{selectedBill.date} {selectedBill.time}</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 block mb-1">ผู้อนุมัติ</span>
                  <span className="text-xs font-bold text-slate-700">{selectedBill.approver}</span>
                </div>
              </div>

              {/* 🌟 ตารางแสดงรายการยาในบิล */}
              <div className="bg-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden">
                <div className="bg-blue-50 p-3 border-b border-blue-100">
                  <span className="text-[11px] font-extrabold text-blue-600 uppercase tracking-wider">รายการยาที่เบิกทั้งหมด ({selectedBill.items.length})</span>
                </div>
                <table className="w-full text-left text-sm">
                  <thead className="bg-white border-b border-slate-100">
                    <tr className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                      <th className="px-4 py-2 text-center w-12">ลำดับ</th>
                      <th className="px-4 py-2">ชื่อยา/วัคซีน</th>
                      <th className="px-4 py-2 text-center">จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 bg-white">
                    {selectedBill.items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-2.5 text-center font-bold text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2.5 font-bold text-blue-700">{item.medName}</td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="font-bold text-slate-800">{item.amount}</span> 
                          <span className="text-[10px] text-slate-500 font-bold ml-1">{item.unit}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <button onClick={() => setSelectedBill(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-colors">
                ปิดหน้าต่าง
              </button>
              <button 
                onClick={() => handleDownloadPDF(selectedBill, selectedBill.user.name, selectedBill.user.role)}
                className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
              >
                <Download size={18} /> ดาวน์โหลด PDF
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 3: สถานะการดาวน์โหลด ================= */}
      {downloadModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => downloadModal.status === 'success' && setDownloadModal(prev => ({ ...prev, isOpen: false }))}></div>
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full max-w-sm relative z-10 text-center flex flex-col items-center">
            {downloadModal.status === 'downloading' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-5 border-[6px] border-white shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                  <Loader2 size={36} className="text-blue-500 animate-spin" strokeWidth={2.5}/>
                </div>
                <h3 className="text-xl font-extrabold text-slate-800 mb-2">กำลังสร้างไฟล์ PDF...</h3>
                <p className="text-slate-500 text-xs mb-6 font-medium">ระบบกำลังจัดทำเอกสารใบเบิกย้อนหลัง</p>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-slate-400">{progress}%</span>
              </>
            ) : (
              <>
                <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-5 border-[6px] border-white shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                  <CheckCircle2 size={40} className="text-green-500" strokeWidth={2.5}/>
                </div>
                <h3 className="text-xl font-extrabold text-green-600 mb-2">ดาวน์โหลดสำเร็จ!</h3>
                <p className="text-slate-500 text-xs mb-8 font-medium">ไฟล์ PDF ถูกบันทึกลงในเครื่องของคุณเรียบร้อยแล้ว</p>
                <button onClick={() => setDownloadModal(prev => ({ ...prev, isOpen: false }))} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-2xl font-bold text-sm transition-colors">
                  ปิดหน้าต่าง
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}