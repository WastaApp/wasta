import { useState, useRef } from "react";
import { supabase } from "./supabaseClient";

const C = {
  gold:"#C9A84C",goldLight:"#F5E6B8",goldDark:"#8B6914",ink:"#1A1612",
  cream:"#FAF7F2",sand:"#EDE8DF",sandDark:"#D4CCBC",muted:"#7A7166",
  green:"#2D6A4F",greenBg:"#D8F3DC",red:"#A33C2D",redBg:"#FDECEA",
  blue:"#1A4F8B",blueBg:"#E1ECFB",
};

const SERVICES=["AC service","Plumbing","Electrical","Deep cleaning","Moving","Painting","Carpentry","Pest control","Handyman","Landscaping"];
const AREAS=["Downtown Dubai","Dubai Marina","JLT","Al Barsha","Jumeirah","Business Bay","Deira","Bur Dubai","Mirdif","Silicon Oasis","JVC","Sports City","Palm Jumeirah","Al Nahda","Discovery Gardens"];
const STEPS=[{id:"personal",icon:"👤"},{id:"trade",icon:"🔧"},{id:"docs",icon:"📄"},{id:"availability",icon:"🗓"},{id:"review",icon:"✓"}];
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS=["8am–12pm","12pm–4pm","4pm–8pm"];

const initForm={firstName:"",lastName:"",phone:"",email:"",nationality:"",area:"",bio:"",services:[],otherAreas:[],experience:"",rate:"",emiratesId:"",tradeLicense:"",insurance:false,availability:{},agreeTerms:false};

async function uploadDoc(providerId, docType, file) {
  const ext = file.name.split(".").pop();
  const path = `providers/${providerId}/${docType}.${ext}`;
  const { error } = await supabase.storage.from("wasta-docs").upload(path, file, { upsert: true });
  if (error) throw error;
  await supabase.from("provider_docs").insert([{provider_id:providerId,doc_type:docType,file_path:path}]);
  return path;
}

function Field({label,required,children,error}){
  return (
    <div style={{marginBottom:16}}>
      <label style={{display:"block",fontFamily:"sans-serif",fontSize:12,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6}}>
        {label}{required&&<span style={{color:C.red,marginLeft:3}}>*</span>}
      </label>
      {children}
      {error&&<div style={{fontFamily:"sans-serif",fontSize:11,color:C.red,marginTop:4}}>{error}</div>}
    </div>
  );
}
function Input({value,onChange,placeholder,type="text"}){
  return <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{width:"100%",border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"10px 12px",fontFamily:"sans-serif",fontSize:13,color:C.ink,background:"#fff",boxSizing:"border-box",outline:"none"}}/>;
}
function Sel({value,onChange,children}){
  return <select value={value} onChange={onChange} style={{width:"100%",border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"10px 12px",fontFamily:"sans-serif",fontSize:13,color:value?C.ink:C.muted,background:"#fff",boxSizing:"border-box",outline:"none"}}>{children}</select>;
}
function Chip({label,selected,onClick}){
  return <div onClick={onClick} style={{display:"inline-flex",alignItems:"center",padding:"7px 13px",borderRadius:20,border:`1.5px solid ${selected?C.gold:C.sandDark}`,background:selected?C.goldLight:"#fff",color:selected?C.goldDark:C.muted,fontFamily:"sans-serif",fontSize:12,fontWeight:selected?700:400,cursor:"pointer",margin:"4px 4px 4px 0",userSelect:"none"}}>{selected&&<span style={{marginRight:5,fontSize:10}}>✓</span>}{label}</div>;
}
function UploadBox({label,file,onFile}){
  const ref=useRef();
  return (
    <div onClick={()=>ref.current.click()} style={{border:`1.5px dashed ${file?C.gold:C.sandDark}`,borderRadius:10,padding:"18px 16px",textAlign:"center",cursor:"pointer",background:file?C.goldLight:"#faf9f7"}}>
      <input ref={ref} type="file" accept="image/*,.pdf" style={{display:"none"}} onChange={e=>onFile(e.target.files[0])}/>
      {file
        ?<div><div style={{fontSize:20,marginBottom:4}}>📎</div><div style={{fontFamily:"sans-serif",fontSize:12,color:C.goldDark,fontWeight:700}}>{file.name}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,marginTop:2}}>Tap to replace</div></div>
        :<div><div style={{fontSize:24,marginBottom:6}}>⬆</div><div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{label}</div><div style={{fontFamily:"sans-serif",fontSize:11,color:C.sandDark,marginTop:3}}>JPG, PNG or PDF · max 5MB</div></div>
      }
    </div>
  );
}

export default function ProviderOnboarding(){
  const [step,setStep]=useState(0);
  const [form,setForm]=useState(initForm);
  const [files,setFiles]=useState({emiratesId:null,tradeLicense:null,photo:null});
  const [errors,setErrors]=useState({});
  const [loading,setLoading]=useState(false);
  const [submitted,setSubmitted]=useState(false);
  const [submitError,setSubmitError]=useState(null);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleArr=(k,v)=>setForm(f=>({...f,[k]:f[k].includes(v)?f[k].filter(x=>x!==v):[...f[k],v]}));
  const toggleAvail=(day,slot)=>setForm(f=>{const a={...f.availability};if(!a[day])a[day]=[];a[day]=a[day].includes(slot)?a[day].filter(s=>s!==slot):[...a[day],slot];return{...f,availability:a};});

  const validate=()=>{
    const e={};
    if(step===0){if(!form.firstName.trim())e.firstName="Required";if(!form.lastName.trim())e.lastName="Required";if(!form.phone.trim())e.phone="Required";if(!form.email.trim())e.email="Required";if(!form.area)e.area="Required";}
    if(step===1){if(!form.services.length)e.services="Select at least one";if(!form.experience)e.experience="Required";if(!form.rate.trim())e.rate="Required";}
    if(step===2){if(!form.emiratesId.trim())e.emiratesId="Required";if(!files.emiratesId)e.emiratesIdFile="Upload required";if(!form.tradeLicense.trim())e.tradeLicense="Required";}
    if(step===3){if(!Object.values(form.availability).some(s=>s.length>0))e.availability="Select at least one slot";}
    if(step===4){if(!form.agreeTerms)e.agreeTerms="Required";}
    setErrors(e);return Object.keys(e).length===0;
  };

  const next=()=>{if(validate())setStep(s=>Math.min(s+1,STEPS.length-1));};
  const back=()=>{setErrors({});setStep(s=>Math.max(s-1,0));};

  const submit=async()=>{
    if(!validate())return;
    setLoading(true);setSubmitError(null);
    try{
      // Check duplicate
      const {data:existing}=await supabase.from("providers").select("id").or(`phone.eq.${form.phone},email.eq.${form.email}`).maybeSingle();
      if(existing){setErrors({phone:"Phone or email already registered"});setLoading(false);return;}

      // Insert provider
      const {data:provider,error:pErr}=await supabase.from("providers").insert([{
        first_name:form.firstName,last_name:form.lastName,phone:form.phone,email:form.email,
        nationality:form.nationality,area:form.area,other_areas:form.otherAreas,bio:form.bio,
        services:form.services,experience:form.experience,rate:parseFloat(form.rate),
        emirates_id:form.emiratesId,trade_license:form.tradeLicense,insurance:form.insurance,
        availability:form.availability,status:"pending",verified:false,
      }]).select().single();
      if(pErr)throw pErr;

      // Upload docs in parallel
      const uploads=[];
      if(files.emiratesId) uploads.push(uploadDoc(provider.id,"emirates_id",files.emiratesId));
      if(files.tradeLicense) uploads.push(uploadDoc(provider.id,"trade_license",files.tradeLicense));
      if(files.photo) uploads.push(
        uploadDoc(provider.id,"photo",files.photo).then(async path=>{
          const {data:{publicUrl}}=supabase.storage.from("wasta-docs").getPublicUrl(path);
          await supabase.from("providers").update({photo_url:publicUrl}).eq("id",provider.id);
        })
      );
      await Promise.all(uploads);
      setSubmitted(true);
    } catch(err){
      setSubmitError(err.message);
    } finally{
      setLoading(false);
    }
  };

  const S={
    wrap:{fontFamily:"'Georgia','Times New Roman',serif",background:C.cream,minHeight:"100vh"},
    topbar:{background:C.ink,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"},
    inner:{maxWidth:600,margin:"0 auto",padding:"32px 24px"},
    card:{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:14,padding:"28px 28px 24px"},
    goldBtn:{background:loading?C.sandDark:C.gold,color:C.ink,border:"none",borderRadius:9,padding:"12px 24px",fontFamily:"sans-serif",fontWeight:700,fontSize:14,cursor:loading?"not-allowed":"pointer"},
    outBtn:{background:"none",color:C.muted,border:`1px solid ${C.sandDark}`,borderRadius:9,padding:"12px 24px",fontFamily:"sans-serif",fontWeight:600,fontSize:13,cursor:"pointer"},
    h3:{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.12em",color:C.muted,textTransform:"uppercase",margin:"20px 0 12px",fontWeight:600},
    reviewRow:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`0.5px solid ${C.sand}`},
  };

  const titles=["Personal information","Trade & skills","Verification documents","Your availability","Review & submit"];
  const subtitles=["Tell us about yourself","What services do you offer?","Upload your ID and license","When are you available?","Almost done — one last check"];

  if(submitted) return(
    <div style={S.wrap}>
      <div style={S.topbar}><div style={{color:C.gold,fontSize:18,fontWeight:700,letterSpacing:"0.06em"}}>WASTA</div></div>
      <div style={{...S.inner,textAlign:"center",paddingTop:60}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:C.greenBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 20px"}}>✓</div>
        <div style={{fontSize:24,fontWeight:700,color:C.ink,marginBottom:8}}>Application submitted!</div>
        <div style={{fontFamily:"sans-serif",fontSize:14,color:C.muted,marginBottom:4}}>Welcome, {form.firstName}. We'll review your documents within 24–48 hours.</div>
        <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,marginBottom:32}}>You'll receive a WhatsApp confirmation at {form.phone} once approved.</div>
        <div style={{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:12,padding:"20px 24px",maxWidth:360,margin:"0 auto",textAlign:"left"}}>
          <div style={{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",marginBottom:12}}>What happens next</div>
          {[["1","Document review","Our team verifies your Emirates ID and trade license"],["2","Background check","Takes 24–48 hrs"],["3","Onboarding call","Quick 15-min call to set you up"],["4","Go live","Start receiving bookings on Wasta"]].map(([n,t,d])=>(
            <div key={n} style={{display:"flex",gap:12,marginBottom:14,alignItems:"flex-start"}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.ink,flexShrink:0}}>{n}</div>
              <div><div style={{fontFamily:"sans-serif",fontSize:13,fontWeight:700,color:C.ink}}>{t}</div><div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return(
    <div style={S.wrap}>
      <div style={S.topbar}>
        <div style={{color:C.gold,fontSize:18,fontWeight:700,letterSpacing:"0.06em"}}>WASTA</div>
        <div style={{color:C.muted,fontFamily:"sans-serif",fontSize:12}}>Provider onboarding</div>
      </div>
      <div style={S.inner}>
        {/* Step dots */}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:24}}>
          {STEPS.map((s,i)=>(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:i<=step?28:24,height:i<=step?28:24,borderRadius:"50%",background:i<step?C.green:i===step?C.gold:C.sand,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<step?12:10,fontWeight:700,color:i<step?"#fff":i===step?C.ink:C.muted,fontFamily:"sans-serif"}}>
                {i<step?"✓":s.icon}
              </div>
              {i<STEPS.length-1&&<div style={{width:24,height:1.5,background:i<step?C.green:C.sandDark}}/>}
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{background:C.sand,borderRadius:4,height:4,marginBottom:28,overflow:"hidden"}}>
          <div style={{width:Math.round((step/(STEPS.length-1))*100)+"%",height:"100%",background:C.gold,borderRadius:4}}/>
        </div>
        <div style={{marginBottom:6,fontFamily:"sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.1em",textTransform:"uppercase"}}>Step {step+1} of {STEPS.length}</div>
        <div style={{fontSize:22,fontWeight:700,color:C.ink,marginBottom:4}}>{titles[step]}</div>
        <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,marginBottom:24}}>{subtitles[step]}</div>
        {submitError&&<div style={{background:C.redBg,color:C.red,fontFamily:"sans-serif",fontSize:12,padding:"10px 14px",borderRadius:8,marginBottom:16}}>{submitError}</div>}

        <div style={S.card}>
          {step===0&&(
            <div>
              <div style={{display:"flex",gap:14}}>
                <div style={{flex:1}}><Field label="First name" required error={errors.firstName}><Input value={form.firstName} onChange={e=>set("firstName",e.target.value)} placeholder="e.g. Karim"/></Field></div>
                <div style={{flex:1}}><Field label="Last name" required error={errors.lastName}><Input value={form.lastName} onChange={e=>set("lastName",e.target.value)} placeholder="e.g. Al-Hassan"/></Field></div>
              </div>
              <Field label="WhatsApp / phone" required error={errors.phone}><Input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000"/></Field>
              <Field label="Email address" required error={errors.email}><Input value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" type="email"/></Field>
              <Field label="Nationality"><Input value={form.nationality} onChange={e=>set("nationality",e.target.value)} placeholder="e.g. Egyptian"/></Field>
              <Field label="Primary area" required error={errors.area}>
                <Sel value={form.area} onChange={e=>set("area",e.target.value)}>
                  <option value="">Select your area…</option>
                  {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
                </Sel>
              </Field>
              <Field label="Short bio (optional)">
                <textarea value={form.bio} onChange={e=>set("bio",e.target.value)} placeholder="Tell customers about yourself…" style={{width:"100%",border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"10px 12px",fontFamily:"sans-serif",fontSize:13,color:C.ink,background:"#fff",boxSizing:"border-box",resize:"vertical",minHeight:70,outline:"none"}}/>
              </Field>
            </div>
          )}
          {step===1&&(
            <div>
              <Field label="Services you offer" required error={errors.services}><div>{SERVICES.map(s=><Chip key={s} label={s} selected={form.services.includes(s)} onClick={()=>toggleArr("services",s)}/>)}</div></Field>
              <Field label="Also cover these areas (optional)"><div>{AREAS.filter(a=>a!==form.area).map(a=><Chip key={a} label={a} selected={form.otherAreas.includes(a)} onClick={()=>toggleArr("otherAreas",a)}/>)}</div></Field>
              <Field label="Years of experience" required error={errors.experience}>
                <Sel value={form.experience} onChange={e=>set("experience",e.target.value)}>
                  <option value="">Select…</option>
                  {["Less than 1 year","1–2 years","3–5 years","6–10 years","10+ years"].map(e=><option key={e} value={e}>{e}</option>)}
                </Sel>
              </Field>
              <Field label="Minimum call-out rate (AED)" required error={errors.rate}><Input value={form.rate} onChange={e=>set("rate",e.target.value)} placeholder="e.g. 120" type="number"/></Field>
            </div>
          )}
          {step===2&&(
            <div>
              <Field label="Emirates ID number" required error={errors.emiratesId}><Input value={form.emiratesId} onChange={e=>set("emiratesId",e.target.value)} placeholder="784-XXXX-XXXXXXX-X"/></Field>
              <Field label="Emirates ID scan" required error={errors.emiratesIdFile}><UploadBox label="Upload Emirates ID (front & back)" file={files.emiratesId} onFile={f=>setFiles(fs=>({...fs,emiratesId:f}))}/></Field>
              <Field label="Trade license number" required error={errors.tradeLicense}><Input value={form.tradeLicense} onChange={e=>set("tradeLicense",e.target.value)} placeholder="DED-XXXXXXXX"/></Field>
              <Field label="Trade license document"><UploadBox label="Upload trade license" file={files.tradeLicense} onFile={f=>setFiles(fs=>({...fs,tradeLicense:f}))}/></Field>
              <Field label="Profile photo"><UploadBox label="Upload a clear headshot" file={files.photo} onFile={f=>setFiles(fs=>({...fs,photo:f}))}/></Field>
              <div style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",background:C.blueBg,borderRadius:8,marginTop:4}}>
                <input type="checkbox" checked={form.insurance} onChange={e=>set("insurance",e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
                <span style={{fontFamily:"sans-serif",fontSize:13,color:C.blue}}>I have public liability insurance (optional but recommended)</span>
              </div>
            </div>
          )}
          {step===3&&(
            <div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,marginBottom:18}}>Select your typical available days and time slots.</div>
              {errors.availability&&<div style={{fontFamily:"sans-serif",fontSize:12,color:C.red,marginBottom:12}}>{errors.availability}</div>}
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:360}}>
                  <thead><tr><th style={{width:48}}/>{SLOTS.map(s=><th key={s} style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,fontWeight:600,padding:"6px 8px",textAlign:"center"}}>{s}</th>)}</tr></thead>
                  <tbody>{DAYS.map(day=><tr key={day}><td style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600,paddingRight:8}}>{day}</td>{SLOTS.map(slot=>{const active=(form.availability[day]||[]).includes(slot);return<td key={slot} style={{padding:"4px 6px",textAlign:"center"}}><div onClick={()=>toggleAvail(day,slot)} style={{padding:"9px 4px",borderRadius:7,border:`1.5px solid ${active?C.gold:C.sandDark}`,background:active?C.goldLight:"#fff",cursor:"pointer",fontSize:11,fontFamily:"sans-serif",fontWeight:active?700:400,color:active?C.goldDark:C.muted,textAlign:"center",userSelect:"none"}}>{active?"✓":"+"}</div></td>;})}</tr>)}</tbody>
                </table>
              </div>
            </div>
          )}
          {step===4&&(
            <div>
              <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,marginBottom:20}}>Please review before submitting.</div>
              {[{title:"Personal",rows:[["Name",`${form.firstName} ${form.lastName}`],["Phone",form.phone],["Email",form.email],["Area",form.area]]},{title:"Trade",rows:[["Services",form.services.join(", ")||"—"],["Experience",form.experience||"—"],["Rate",`AED ${form.rate}/call`]]},{title:"Documents",rows:[["Emirates ID",form.emiratesId],["Trade license",form.tradeLicense],["ID scan",files.emiratesId?.name||"—"],["Insurance",form.insurance?"Yes":"No"]]}].map(({title,rows})=>(
                <div key={title} style={{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:10,padding:"14px 18px",marginBottom:12}}>
                  <div style={S.h3}>{title}</div>
                  {rows.map(([k,v])=>(
                    <div key={k} style={S.reviewRow}>
                      <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
                      <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600,maxWidth:"60%",textAlign:"right"}}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={{display:"flex",alignItems:"flex-start",gap:10,padding:"14px",background:C.sand,borderRadius:8,marginTop:4}}>
                <input type="checkbox" checked={form.agreeTerms} onChange={e=>set("agreeTerms",e.target.checked)} style={{width:16,height:16,marginTop:1,cursor:"pointer",flexShrink:0}}/>
                <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>I confirm all information is accurate and I agree to Wasta's provider terms, including the 15–20% commission on completed bookings.</span>
              </div>
              {errors.agreeTerms&&<div style={{fontFamily:"sans-serif",fontSize:11,color:C.red,marginTop:6}}>{errors.agreeTerms}</div>}
            </div>
          )}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
          {step>0?<button style={S.outBtn} onClick={back}>← Back</button>:<div/>}
          {step<STEPS.length-1
            ?<button style={S.goldBtn} onClick={next}>Continue →</button>
            :<button style={{...S.goldBtn,background:loading?C.sandDark:C.green,color:"#fff"}} disabled={loading} onClick={submit}>{loading?"Submitting…":"Submit application"}</button>
          }
        </div>
      </div>
    </div>
  );
}
