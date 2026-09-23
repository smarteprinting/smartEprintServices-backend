"use strict";(()=>{var e={};e.id=6449,e.ids=[6449],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},80665:e=>{e.exports=require("dns")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},30689:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>y,requestAsyncStorage:()=>f,routeModule:()=>u,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var o={};r.r(o),r.d(o,{POST:()=>c});var s=r(73278),n=r(45002),i=r(54877),a=r(71309),p=r(56742),l=r(69531);let d=new Set(["Printer Setup & Installation","Printer Troubleshooting & Repair","Computer Support","Network & Wi-Fi Setup","Smart Home Device Assistance","Home Appliance Help","Business Printing Solutions","General Consultation"]);async function c(e){try{let t=await e.text(),r={};if(t)try{r=JSON.parse(t)}catch(e){return a.NextResponse.json({success:!1,message:"Invalid request payload."},{status:400})}let{fullName:o,phone:s,email:n,serviceType:i,description:c,honeypot:u,turnstileToken:f}=r;if(u)return a.NextResponse.json({success:!1,message:"Unable to process this request."},{status:400});if(!await (0,l.Gg)(f,e))return a.NextResponse.json({success:!1,message:"Security verification failed. Please try again."},{status:403});if(!(0,l.oB)(o,100)||!(0,l.a$)(s)||!(0,l.oH)(n)||!(0,l.oB)(i,80)||!d.has(i)||c&&!(0,l.oB)(c,2e3))return a.NextResponse.json({success:!1,message:"Please enter a valid phone number and check your form details."},{status:400});let m=process.env.SMTP_HOST,g=parseInt(process.env.SMTP_PORT,10),x="true"===process.env.SMTP_SECURE,y=process.env.SMTP_USER||process.env.SMTP_FROM,b=process.env.SMTP_PASSWORD,v=process.env.SMTP_TO,h=process.env.SMTP_FROM||y;if(!y||!b)return console.error("SMTP credentials missing. SMTP_USER:",!!y,"SMTP_PASSWORD:",!!b),a.NextResponse.json({success:!1,message:"Email service is not configured properly."},{status:500});console.log(`Attempting SMTP connection to ${m}:${g} (secure: ${x})`);let S=p.createTransport({host:m,port:g,secure:x,auth:{user:y,pass:b},tls:{rejectUnauthorized:!1},connectionTimeout:1e4,greetingTimeout:1e4,socketTimeout:15e3}),P=await S.sendMail({from:`"Smart ePrint Services" <${h}>`,to:v,replyTo:n,subject:`New Appointment Request from ${o}`,html:function({fullName:e,phone:t,email:r,serviceType:o,description:s}){return`
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #024AD8, #0B63F6); padding: 20px; border-radius: 12px 12px 0 0;">
        <h2 style="color: #ffffff; margin: 0; font-size: 22px;">📋 New Appointment Request</h2>
      </div>
      <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Full Name:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${(0,l.Xv)(e)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Phone:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${(0,l.Xv)(t)}
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Email:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              <a href="mailto:${(0,l.Xv)(r)}" style="color: #024AD8;">${(0,l.Xv)(r)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
              <strong style="color: #374151;">Service Type:</strong>
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
              ${(0,l.Xv)(o)}
            </td>
          </tr>
        </table>
        <div style="margin-top: 16px;">
          <strong style="color: #374151;">Description:</strong>
          <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #111827; margin-top: 8px; border: 1px solid #e5e7eb;">
            ${(0,l.Xv)(s||"No description provided.")}
          </p>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          This email was sent from the Smart ePrint Services website appointment form.
        </p>
      </div>
    </div>
  `}({fullName:o,phone:s,email:n,serviceType:i,description:c})});return console.log("Email sent successfully. Message ID:",P.messageId),a.NextResponse.json({success:!0,message:"Appointment request sent successfully! We will contact you shortly."},{status:200})}catch(t){console.error("Error processing appointment email:",t.message),console.error("Error code:",t.code),console.error("Full error:",JSON.stringify(t,Object.getOwnPropertyNames(t)));let e="Unable to send your request right now. Please try again later.";return"EAUTH"===t.code?e="Email authentication failed. Please contact support.":"ESOCKET"===t.code||"ECONNECTION"===t.code?e="Could not connect to the mail server. Please try again later.":("ETIMEDOUT"===t.code||"ECONNREFUSED"===t.code)&&(e="Mail server is unreachable. Please try again later."),a.NextResponse.json({success:!1,message:e},{status:500})}}let u=new s.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/book-appointment/route",pathname:"/api/book-appointment",filename:"route",bundlePath:"app/api/book-appointment/route"},resolvedPagePath:"D:\\next-js\\smartEprintServices\\app\\api\\book-appointment\\route.js",nextConfigOutput:"",userland:o}),{requestAsyncStorage:f,staticGenerationAsyncStorage:m,serverHooks:g}=u,x="/api/book-appointment/route";function y(){return(0,i.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},69531:(e,t,r)=>{r.d(t,{Gg:()=>a,Xv:()=>p,a$:()=>i,oB:()=>s,oH:()=>n});var o=r(1556);function s(e,t){return"string"==typeof e&&e.trim().length>0&&e.length<=t}function n(e){return s(e,254)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())}function i(e){if(!s(e,30))return!1;try{let t=(0,o.S)(e.trim());return!!(t&&t.isValid())}catch{return!1}}async function a(e,t){let r=process.env.TURNSTILE_SECRET_KEY;if(!r||!e||"string"!=typeof e)return!1;try{let o=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({secret:r,response:e,remoteip:t.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"})});if(!o.ok)return!1;let s=await o.json();return!0===s.success}catch{return!1}}function p(e=""){return String(e).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),o=t.X(0,[9379,4833,6742,1556],()=>r(30689));module.exports=o})();