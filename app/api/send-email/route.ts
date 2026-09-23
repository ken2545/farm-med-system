import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staffName, medName, quantity, unit, barn } = body;

    // ตั้งค่าคนส่ง (ใช้ Gmail ของระบบ)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // อีเมลคนส่ง
        pass: process.env.GMAIL_PASS, // รหัสผ่านแอป (App Password)
      },
    });

    // ตั้งค่าเนื้อหาอีเมลที่จะส่งไปหาแอดมิน
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL, // อีเมลแอดมินที่ต้องการให้รับแจ้งเตือน
      subject: `🚨 แจ้งเตือน: มีการเบิกยาใหม่จาก ${staffName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; max-width: 500px;">
          <h2 style="color: #1e40af; margin-top: 0;">มีการเบิกยาใหม่ในระบบ FarmMed</h2>
          <p><strong>ผู้เบิก:</strong> ${staffName}</p>
          <p><strong>หน่วยงาน/เล้า:</strong> ${barn}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 15px 0;"/>
          <p><strong>รายการยาที่เบิก:</strong> <span style="color: #b91c1c; font-weight: bold;">${medName}</span></p>
          <p><strong>จำนวน:</strong> ${quantity} ${unit}</p>
          <br/>
          <p>กรุณาเข้าระบบเพื่อตรวจสอบและกดอนุมัติ</p>
          <a href="https://farm-med-system.vercel.app/request" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-weight: bold;">เข้าสู่ระบบ FarmMed</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}