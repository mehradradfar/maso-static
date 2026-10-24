(()=>{(function(){"use strict";let M=window.Maso,{html:p,icon:j,fmt:z,cx:_,dom:e,api:A,fields:y,ui:I}=M,C=3,T=5*1024*1024,U=2e3;async function D(s){if(s.type==="image/gif"||s.type==="image/svg+xml")return s;try{let i=await createImageBitmap(s),c=Math.min(1,U/Math.max(i.width,i.height));if(c===1&&s.size<15e5)return s;let r=document.createElement("canvas");r.width=Math.round(i.width*c),r.height=Math.round(i.height*c),r.getContext("2d").drawImage(i,0,0,r.width,r.height),i.close();let t=await new Promise(n=>r.toBlob(n,"image/jpeg",.85));return!t||t.size>=s.size?s:new File([t],`${s.name.replace(/\.[^.]+$/,"")}.jpg`,{type:"image/jpeg"})}catch{return s}}let q=317,P=s=>p`
    <figure class="relative flex h-[195px] w-[293px] overflow-hidden rounded-[29px] bg-surface-low">
      <div class="relative h-full w-1/2">${I.img(s.before,{cls:"absolute inset-0 size-full object-cover"})}</div>
      <div class="relative h-full w-1/2">${I.img(s.after,{cls:"absolute inset-0 size-full object-cover"})}</div>
      <span aria-hidden="true" class="absolute inset-y-0 left-1/2 w-[2.7px] -translate-x-1/2 bg-black"></span>
      <figcaption>
        <span class="absolute top-[151px] left-[23.5px] rounded-full bg-[rgb(163_68_0/0.8)] px-[14.5px] py-[7px] text-[14.5px] leading-[22px] text-white backdrop-blur-[11px]">طرح مشتری</span>
        <span class="absolute top-[151px] left-[161px] rounded-full bg-primary/90 px-[14.5px] py-[7px] text-[14.5px] leading-[22px] text-white backdrop-blur-[11px]">محصول نهایی</span>
      </figcaption>
    </figure>
  `;async function B(){let s=e.$("#showcase"),{showcase:i}=await A.customOrderContent().catch(()=>({showcase:[]}));if(!i.length)return s.remove();let c=Math.max(1,Math.ceil(1600/(i.length*q))),r=Array.from({length:c},()=>i).flat();e.render(s,p`<div class="no-scrollbar w-full motion-reduce:overflow-x-auto">
        <ul dir="ltr" class="flex w-max animate-[marquee_linear_infinite] hover:[animation-play-state:paused] motion-reduce:animate-none" style="animation-duration:${r.length*6}s">
          ${[...r,...r].map((t,n)=>p`<li ${n>=r.length?p`aria-hidden="true"`:""} class="pe-6">${P(t)}</li>`)}
        </ul>
      </div>`)}e.ready(()=>{B();let s=e.$("#custom-order"),i=e.$("form",s).outerHTML;function c(t){let n=[],g=!1,m=e.$("[data-dropzone]",t),E=e.$("[data-thumbs]",t),k=e.$("[data-pick]",t),v=e.$("input[type=file]",t),R=e.$('[data-field="images"]',t),h=null;function x(a=!1){m.className=_("relative flex min-h-[139px] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-[24px] border bg-surface-low px-4 py-2 transition-[border-color,background-color] duration-300",h?"border-error":a?"border-primary bg-surf-container":"border-black-10"),e.$("#f-images-err",R)?.remove(),h&&R.insertAdjacentHTML("beforeend",String(p`<p id="f-images-err" role="alert" class="mt-1 ps-4 text-10 text-error">${h}</p>`))}function S(){let a=n.length>=C;E.hidden=!n.length,e.render(E,n.map((o,l)=>p`<li class="animate-fade-up relative size-16 overflow-hidden rounded-[16px] bg-surf-container">
              <img src="${o.url}" alt="" class="size-full object-cover" />
              <button
                type="button"
                data-remove="${l}"
                aria-label="${`حذف عکس ${z.digits(l+1)}`}"
                class="absolute end-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white"
              >
                ${j("close",{size:12})}
              </button>
            </li>`)),k.className=_("flex cursor-pointer flex-col items-center gap-5 text-16 text-on-surface-var transition-opacity hover:opacity-70",a&&"pointer-events-none opacity-40",n.length>0&&"flex-row gap-2 pb-2"),e.$("[data-pick-label]",k).textContent=n.length?"افزودن عکس دیگر":"عکس محصول مورد نظر",v.disabled=a}async function O(a){if(!a?.length)return;let o=e.$("svg",k);o.classList.add("animate-pulse");let l=C-n.length,w=Array.from(a).filter(d=>d.type.startsWith("image/")).slice(0,Math.max(0,l)),f=await Promise.all(w.map(D));n=[...n,...f.map(d=>({file:d,url:URL.createObjectURL(d)}))],o.classList.remove("animate-pulse"),h=null,x(),S()}v.addEventListener("change",()=>{let a=Array.from(v.files||[]);v.value="",O(a)}),E.addEventListener("click",a=>{let o=a.target.closest("[data-remove]");if(!o)return;let l=Number(o.dataset.remove);URL.revokeObjectURL(n[l].url),n=n.filter((w,f)=>f!==l),S()}),m.addEventListener("dragover",a=>{a.preventDefault(),x(!0)}),m.addEventListener("dragleave",()=>x()),m.addEventListener("drop",a=>{a.preventDefault(),x(),O(a.dataTransfer.files)}),t.addEventListener("input",a=>{(a.target.name==="name"||a.target.name==="mobile")&&y.setError(e.$(`[data-field="${a.target.name}"]`,t),null)}),t.addEventListener("submit",async a=>{if(a.preventDefault(),g)return;let o=t.elements.namedItem("name").value.trim().slice(0,80),l=t.elements.namedItem("mobile").value.trim().slice(0,20),w=t.elements.namedItem("message").value.trim().slice(0,1500),f=M.text.latinDigits(l).replace(/[\s-]/g,"").replace(/^(\+98|0098)/,"0"),d=n.map(b=>b.file),u={};d.length?d.some(b=>b.size>T)&&(u.images="حجم هر عکس باید کمتر از ۵ مگابایت باشد."):u.images="یک عکس از محصول مورد نظر اضافه کنید.",o.length<3&&(u.name="نام و نام خانوادگی را وارد کنید."),/^09\d{9}$/.test(f)||(u.mobile="شماره همراه معتبر نیست."),h=u.images||null,x(),y.setError(e.$('[data-field="name"]',t),u.name),y.setError(e.$('[data-field="mobile"]',t),u.mobile);let L=e.$("[data-form-error]",t);if(L.hidden=!0,Object.keys(u).length)return;let $=e.$("button[type=submit]",t);g=!0,$.disabled=!0,$.textContent="در حال ارسال…";try{let{requestId:b}=await A.submitCustomOrder({name:o,mobile:f,message:w,images:d});n.forEach(F=>URL.revokeObjectURL(F.url)),r(b)}catch{g=!1,$.disabled=!1,$.textContent="ارسال",L.textContent="ارسال درخواست انجام نشد. لطفا دوباره تلاش کنید.",L.hidden=!1}})}function r(t){e.$("form",s).replaceWith(e.create(p`
          <div class="animate-rise mx-auto flex w-full max-w-[448px] flex-col items-center p-6 pt-7 text-center lg:pt-[50px]">
            <div class="flex flex-col items-center gap-6">
              ${j("resultSuccess")}
              <div class="flex flex-col gap-3">
                <h1 class="text-20 text-on-surface">درخواست شما ثبت شد</h1>
                <p class="text-13 text-ink">کارشناسان ما به زودی با شما در تماس خواهند بود</p>
              </div>
            </div>
            <div class="flex w-full flex-col gap-6 p-6">
              <hr class="border-dotted border-outline" />
              <p class="flex items-center justify-between text-16">
                <span class="text-outline">شماره درخواست</span>
                <span class="text-on-surface">${z.digits(t)}</span>
              </p>
            </div>
            <button
              type="button"
              data-new-request
              class="mt-6 inline-flex h-12 w-full shrink-0 items-center justify-center rounded-full border border-primary px-6 text-16 text-primary transition-[background-color,transform] duration-300 ease-out-expo hover:bg-surface-low active:scale-[0.98]"
            >
              درخواست جدید
            </button>
          </div>
        `)),e.$("#showcase").hidden=!0,e.$("[data-new-request]",s).addEventListener("click",g=>{let m=e.create(i);g.currentTarget.parentElement.replaceWith(m),e.$("#showcase").hidden=!1,c(m)})}c(e.$("form",s))})})();})();
//# sourceMappingURL=custom-order.js.map?v=aad39fdea0
