"use strict";(()=>{var e={};e.id=386,e.ids=[386],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},61282:e=>{e.exports=require("child_process")},84770:e=>{e.exports=require("crypto")},80665:e=>{e.exports=require("dns")},17702:e=>{e.exports=require("events")},92048:e=>{e.exports=require("fs")},32615:e=>{e.exports=require("http")},35240:e=>{e.exports=require("https")},98216:e=>{e.exports=require("net")},19801:e=>{e.exports=require("os")},55315:e=>{e.exports=require("path")},76162:e=>{e.exports=require("stream")},82452:e=>{e.exports=require("tls")},17360:e=>{e.exports=require("url")},21764:e=>{e.exports=require("util")},71568:e=>{e.exports=require("zlib")},65018:(e,t,r)=>{r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>d,routeModule:()=>u,serverHooks:()=>m,staticGenerationAsyncStorage:()=>f});var s={};r.r(s),r.d(s,{POST:()=>l});var o=r(73278),n=r(45002),a=r(54877),i=r(71309),c=r(56742),p=r(69531);async function l(e){try{let t=await e.text(),r={};if(t)try{r=JSON.parse(t)}catch(e){return i.NextResponse.json({success:!1,message:"Invalid request payload."},{status:400})}let{fullName:s,email:o,message:n,honeypot:a,turnstileToken:l}=r;if(a)return i.NextResponse.json({success:!1,message:"Unable to process this request."},{status:400});if(!await (0,p.Gg)(l,e))return i.NextResponse.json({success:!1,message:"Security verification failed. Please try again."},{status:403});if(!(0,p.oB)(s,100)||!(0,p.oH)(o)||!(0,p.oB)(n,4e3))return i.NextResponse.json({success:!1,message:"Please check your form details and try again."},{status:400});let u=process.env.SMTP_HOST,d=parseInt(process.env.SMTP_PORT,10),f="true"===process.env.SMTP_SECURE,m=process.env.SMTP_USER||process.env.SMTP_FROM,g=process.env.SMTP_PASSWORD,x=process.env.SMTP_TO,y=process.env.SMTP_FROM||m;if(!m||!g)return console.error("SMTP credentials missing."),i.NextResponse.json({success:!1,message:"Email service is not configured properly."},{status:500});let v=c.createTransport({host:u,port:d,secure:f,auth:{user:m,pass:g},tls:{rejectUnauthorized:!1},connectionTimeout:1e4,greetingTimeout:1e4,socketTimeout:15e3}),h={from:`"Smart ePrint Services" <${y}>`,to:x,replyTo:o,subject:`New Contact Form Submission from ${s}`,html:`
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #024AD8, #0B63F6); padding: 20px; border-radius: 12px 12px 0 0;">
            <h2 style="color: #ffffff; margin: 0; font-size: 22px;">✉️ New Contact Form Submission</h2>
          </div>
          <div style="background-color: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <strong style="color: #374151;">Name:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
                  ${(0,p.Xv)(s)}
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
                  <strong style="color: #374151;">Email:</strong>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0; color: #111827;">
                  <a href="mailto:${(0,p.Xv)(o)}" style="color: #024AD8;">${(0,p.Xv)(o)}</a>
                </td>
              </tr>
            </table>
            <div style="margin-top: 16px;">
              <strong style="color: #374151;">Message:</strong>
              <p style="background-color: #f9fafb; padding: 15px; border-radius: 8px; color: #111827; margin-top: 8px; border: 1px solid #e5e7eb;">
                ${(0,p.Xv)(n)}
              </p>
            </div>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
              This email was sent from the Smart ePrint Services website contact form.
            </p>
          </div>
        </div>
      `};return await v.sendMail(h),console.log("Contact form email sent successfully."),i.NextResponse.json({success:!0,message:"Message sent successfully!"},{status:200})}catch(t){console.error("Error sending contact form email:",t.message),console.error("Error code:",t.code);let e="Failed to send message. Please try again later.";return"EAUTH"===t.code?e="Email authentication failed. Please contact support.":("ESOCKET"===t.code||"ECONNECTION"===t.code)&&(e="Could not connect to the mail server. Please try again later."),i.NextResponse.json({success:!1,message:e},{status:500})}}let u=new o.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/contact/route",pathname:"/api/contact",filename:"route",bundlePath:"app/api/contact/route"},resolvedPagePath:"D:\\next-js\\smartEprintServices\\app\\api\\contact\\route.js",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:f,serverHooks:m}=u,g="/api/contact/route";function x(){return(0,a.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:f})}},69531:(e,t,r)=>{r.d(t,{Gg:()=>i,Xv:()=>c,a$:()=>a,oB:()=>o,oH:()=>n});var s=r(1556);function o(e,t){return"string"==typeof e&&e.trim().length>0&&e.length<=t}function n(e){return o(e,254)&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())}function a(e){if(!o(e,30))return!1;try{let t=(0,s.S)(e.trim());return!!(t&&t.isValid())}catch{return!1}}async function i(e,t){let r=process.env.TURNSTILE_SECRET_KEY;if(!r||!e||"string"!=typeof e)return!1;try{let s=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({secret:r,response:e,remoteip:t.headers.get("x-forwarded-for")?.split(",")[0]?.trim()||"unknown"})});if(!s.ok)return!1;let o=await s.json();return!0===o.success}catch{return!1}}function c(e=""){return String(e).replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[9379,4833,6742,1556],()=>r(65018));module.exports=s})();