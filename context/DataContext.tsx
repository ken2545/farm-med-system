"use client";

import React, { createContext, useContext, useState } from 'react';

// 1. สร้าง Context
const DataContext = createContext<any>(null);

// 2. สร้าง Provider เพื่อกระจายข้อมูลให้ทุกหน้า
export function DataProvider({ children }: { children: React.ReactNode }) {
  
  // ข้อมูลสต๊อกยาส่วนกลาง
  const [inventory, setInventory] = useState([
    { id: 1, name: 'Amoxycillin 15%', type: 'ยาปฏิชีวนะ', unit: 'ขวด', amount: 12, status: 'ปกติ' },
    { id: 2, name: 'Tylosin 200', type: 'ยาปฏิชีวนะ', unit: 'กรัม', amount: 8, status: 'ปกติ' },
    { id: 3, name: 'วัคซีน PRRS', type: 'วัคซีน', unit: 'โดส', amount: 3, status: 'ใกล้หมด' },
    { id: 4, name: 'วิตามินรวม', type: 'วิตามิน', unit: 'ขวด', amount: 20, status: 'ปกติ' },
  ]);

  // ข้อมูลประวัติล่าสุด
  const [activities, setActivities] = useState([
    { id: 1, type: 'remove', action: 'ตัดสต๊อกยา', detail: 'Amoxycillin 15% (2 ขวด)', date: '17 ส.ค. 2568', time: '09:15 น.', user: 'สมชาย ใจดี' },
    { id: 2, type: 'request', action: 'เบิกยา', detail: 'Tylosin 200 (1 กรัม)', date: '17 ส.ค. 2568', time: '08:42 น.', user: 'สมชาย ใจดี' },
  ]);

  // ============================================
  // ฟังก์ชันสำหรับ "ตัดสต๊อกยา" ให้ทำงานได้จริง
  // ============================================
  const handleDeductStock = (medicineId: number, deductAmount: number, note: string) => {
    // 1. อัปเดตจำนวนยาที่เหลือในสต๊อก
    setInventory(prev => prev.map(item => {
      if (item.id === medicineId) {
        const newAmount = item.amount - deductAmount;
        return { ...item, amount: newAmount, status: newAmount <= 5 ? 'ใกล้หมด' : 'ปกติ' };
      }
      return item;
    }));

    // 2. ค้นหาชื่อยาที่เพิ่งตัดไป เพื่อเอาไปบันทึกประวัติ
    const targetMed = inventory.find(i => i.id === medicineId);
    
    if (targetMed) {
      // 3. เพิ่มรายการลงในประวัติล่าสุด (ดันขึ้นบนสุด)
      const newActivity = {
        id: Date.now(),
        type: 'remove',
        action: 'ตัดสต๊อกยา',
        detail: `${targetMed.name} (${deductAmount} ${targetMed.unit})`,
        date: new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
        user: 'สมชาย ใจดี' // ชื่อคนล็อกอินจำลอง
      };
      setActivities(prev => [newActivity, ...prev]);
    }
  };

  return (
    <DataContext.Provider value={{ inventory, activities, handleDeductStock }}>
      {children}
    </DataContext.Provider>
  );
}

// 3. สร้าง Hook เอาไว้ดึงข้อมูลไปใช้หน้าอื่นๆ
export const useData = () => useContext(DataContext);