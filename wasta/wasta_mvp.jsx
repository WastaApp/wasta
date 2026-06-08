import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const AREAS = ["Downtown Dubai","Dubai Marina","JLT","Al Barsha","Jumeirah","Business Bay","Deira","Bur Dubai","Mirdif","Silicon Oasis","JVC","Sports City","Palm Jumeirah","Al Nahda","Discovery Gardens"];

const CATEGORIES = [
  {id:"ac",icon:"❄️",label:"AC Services",color:"#EBF5FF",tag:"#1565C0",sub:["AC Cleaning","AC Repair","AC Installation","AC Gas Refill","Duct Cleaning","Thermostat Repair"],from:149,desc:"Professional AC maintenance & repair"},
  {id:"clean",icon:"✨",label:"Cleaning",color:"#F5F0FF",tag:"#5B21B6",sub:["Deep Cleaning","Regular Cleaning","Move-in/out Cleaning","Sofa Cleaning","Carpet Cleaning","Window Cleaning","Kitchen Cleaning"],from:99,desc:"Home & office cleaning services"},
  {id:"plumb",icon:"🔧",label:"Plumbing",color:"#EDFAF4",tag:"#065F46",sub:["Leak Repair","Pipe Fitting","Drain Cleaning","Water Heater","Bathroom Fitting","Kitchen Plumbing"],from:120,desc:"Leaks, fixtures & pipe work"},
  {id:"elec",icon:"⚡",label:"Electrical",color:"#FFFBEB",tag:"#92400E",sub:["Wiring","Breaker/Fuse","Light Fitting","Fan Installation","Socket Repair","Electrical Inspection"],from:130,desc:"Wiring, fittings & electrical repairs"},
  {id:"paint",icon:"🖌️",label:"Painting",color:"#FFF0F0",tag:"#991B1B",sub:["Interior Painting","Exterior Painting","Villa Painting","Texture Painting","Wallpaper","Touch-up"],from:199,desc:"Rooms, villas & commercial spaces"},
  {id:"pest",icon:"🛡️",label:"Pest Control",color:"#EDFAF4",tag:"#065F46",sub:["General Pest Control","Cockroach Treatment","Bed Bug Treatment","Termite Control","Rodent Control","Mosquito Control"],from:180,desc:"Safe & effective pest elimination"},
  {id:"carwash",icon:"🚗",label:"Car Wash",color:"#EBF5FF",tag:"#1565C0",sub:["Exterior Wash","Full Valet","Interior Cleaning","Polishing","Ceramic Coating","Engine Cleaning"],from:89,desc:"Mobile car wash at your location"},
  {id:"move",icon:"📦",label:"Moving",color:"#FFF5EB",tag:"#92400E",sub:["Home Moving","Office Moving","Furniture Moving","Storage","Packing Service","Single Item Move"],from:500,desc:"Safe & reliable moving services"},
  {id:"handyman",icon:"🔨",label:"Handyman",color:"#F5F0EB",tag:"#78350F",sub:["Furniture Assembly","TV Mounting","Curtain Fitting","Door Repair","Shelf Installation","General Repairs"],from:99,desc:"General repairs & installations"},
  {id:"beauty",icon:"💆",label:"Beauty & Wellness",color:"#FFF0F7",tag:"#9D174D",sub:["Massage","Facial","Manicure/Pedicure","Haircut at Home","Waxing","Bridal Makeup"],from:150,desc:"Beauty & wellness at your doorstep"},
  {id:"laundry",icon:"👕",label:"Laundry",color:"#F0F7FF",tag:"#1E40AF",sub:["Wash & Fold","Dry Cleaning","Ironing","Curtain Cleaning","Leather Cleaning","Alterations"],from:49,desc:"Pickup & delivery laundry service"},
  {id:"event",icon:"🎉",label:"Event Services",color:"#FFFBEB",tag:"#92400E",sub:["Event Setup","Decoration","Catering Assistance","Photography","Sound System","Cleaning After Event"],from:299,desc:"Complete event support services"},
  {id:"carp",icon:"🪚",label:"Carpentry",color:"#F5F0EB",tag:"#78350F",sub:["Furniture Repair","Custom Furniture","Door Fitting","Kitchen Cabinet","Wardrobe Fitting","Wood Polishing"],from:110,desc:"Woodwork, assembly & repairs"},
  {id:"corporate",icon:"🏢",label:"Corporate",color:"#EEF2FF",tag:"#3730A3",sub:["Office Cleaning","Office Maintenance","Corporate AC","IT Setup","Office Moving","Facility Management"],from:499,desc:"Business & facility services"},
];

const SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"];
const aColors = ["#C9A84C","#5DA5A5","#A55D5D","#5D7AA5","#8A5DA5","#5DA57A"];
const aC = n => aColors[(n||"A").charCodeAt(0)%aColors.length];
const ini = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const getUser = () => { try{return JSON.parse(localStorage.getItem("wasta_u2"));}catch{return null;} };
const saveUser = u => localStorage.setItem("wasta_u2",JSON.stringify(u));
const rmUser = () => localStorage.removeItem("wasta_u2");

const statusMeta = {
  pending:{label:"Pending",bg:"#FFF8E6",color:"#92600A",dot:"#D97706"},
  confirmed:{label:"Confirmed",bg:"#ECFDF5",color:"#065F46",dot:"#10B981"},
  in_progress:{label:"In Progress",bg:"#EEF2FF",color:"#3730A3",dot:"#6366F1"},
  completed:{label:"Completed",bg:"#F0FDF4",color:"#14532D",dot:"#22C55E"},
  cancelled:{label:"Cancelled",bg:"#FEF2F2",color:"#991B1B",dot:"#EF4444"},
};

const F = {fontFamily:"system-ui,-apple-system,'Segoe UI',sans-serif"};

function AuthScreen({onAuth}){
  const [mode,setMode]=useState("login");
  const [f,setF]=useState({name:"",phone:"",email:"",area:"",building:"",flat:""});
  const [err,setErr]=useState(null);
  const [loading,setLoading]=useState(false);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));

  const login=async()=>{
    if(!f.phone.trim()){setErr("Please enter your phone number");return;}
    setLoading(true);setErr(null);
    const{data}=await supabase.from("users").select("*").eq("phone",f.phone.trim()).maybeSingle();
    if(!data){setErr("No account found. Please create one.");setLoading(false);return;}
    saveUser(data);onAuth(data);setLoading(false);
  };

  const register=async()=>{
    if(!f.name.trim()){setErr("Full name required");return;}
    if(!f.phone.trim()){setErr("Phone number required");return;}
    if(!f.area){setErr("Please select your area");return;}
    setLoading(true);setErr(null);
    const{data:ex}=await supabase.from("users").select("id").eq("phone",f.phone.trim()).maybeSingle();
    if(ex){setErr("Phone already registered. Sign in instead.");setLoading(false);return;}
    const{data,error}=await supabase.from("users").insert([{full_name:f.name.trim(),phone:f.phone.trim(),email:f.email.trim()||null,area:f.area,building:f.building.trim()||null,flat_no:f.flat.trim()||null}]).select().single();
    if(error){setErr(error.message);setLoading(false);return;}
    saveUser(data);onAuth(data);setLoading(false);
  };

  const inp={width:"100%",border:"1px solid #E2E8F0",borderRadius:8,padding:"10px 14px",fontSize:14,color:"#1E293B",background:"#fff",boxSizing:"border-box",outline:"none",...F};
  const lbl={display:"block",fontSize:12,fontWeight:600,color:"#64748B",marginBottom:6,...F};

  return(
    <div style={{minHeight:"100vh",background:"#0F172A",display:"flex",...F}}>
      {/* Left panel */}
      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 80px",background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)"}}>
        <div style={{marginBottom:48}}>
          <div style={{fontSize:48,fontWeight:800,color:"#C9A84C",letterSpacing:"0.06em",fontFamily:"Georgia,serif",marginBottom:8}}>WASTA</div>
          <div style={{fontSize:14,color:"#8B6914",letterSpacing:"0.15em",marginBottom:24}}>واسطة · DUBAI</div>
          <div style={{fontSize:28,fontWeight:700,color:"#fff",lineHeight:1.3,marginBottom:16}}>Dubai's most trusted home services marketplace</div>
          <div style={{fontSize:15,color:"#94A3B8",lineHeight:1.7}}>Book verified professionals for AC service, cleaning, plumbing, electrical and 10+ more services — all providers are Emirates ID verified and trade licensed.</div>
        </div>
        <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
          {CATEGORIES.slice(0,8).map(c=>(
            <div key={c.id} style={{background:"rgba(255,255,255,0.05)",borderRadius:10,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:16}}>{c.icon}</span>
              <span style={{fontSize:12,color:"#CBD5E1"}}>{c.label}</span>
            </div>
          ))}
          <div style={{background:"rgba(201,168,76,0.15)",borderRadius:10,padding:"8px 14px"}}>
            <span style={{fontSize:12,color:"#C9A84C",fontWeight:600}}>+6 more services</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div style={{width:480,background:"#fff",display:"flex",flexDirection:"column",justifyContent:"center",padding:"60px 48px"}}>
        <div style={{marginBottom:32}}>
          <div style={{fontSize:24,fontWeight:700,color:"#0F172A",marginBottom:6}}>
            {mode==="login"?"Welcome back":"Create your account"}
          </div>
          <div style={{fontSize:14,color:"#64748B"}}>
            {mode==="login"?"Sign in to book services":"Join thousands of Dubai residents"}
          </div>
        </div>

        <div style={{display:"flex",background:"#F1F5F9",borderRadius:10,padding:4,marginBottom:28,gap:3}}>
          {[["login","Sign in"],["register","Create account"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr(null);}} style={{flex:1,padding:"9px 8px",border:"none",borderRadius:7,background:mode===m?"#fff":"transparent",color:mode===m?"#0F172A":"#64748B",fontSize:13,fontWeight:mode===m?600:400,cursor:"pointer",boxShadow:mode===m?"0 1px 3px rgba(0,0,0,0.1)":"none",...F}}>
              {l}
            </button>
          ))}
        </div>

        {err&&<div style={{background:"#FEF2F2",color:"#991B1B",fontSize:13,padding:"10px 14px",borderRadius:8,marginBottom:16,border:"1px solid #FECACA"}}>{err}</div>}

        {mode==="login"?(
          <div>
            <div style={{marginBottom:18}}>
              <label style={lbl}>WhatsApp / Phone number</label>
              <input value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000" style={inp} onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
            <button onClick={login} disabled={loading} style={{width:"100%",background:loading?"#94A3B8":"#C9A84C",color:"#0F172A",border:"none",borderRadius:9,padding:"12px",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",...F}}>
              {loading?"Signing in…":"Sign in →"}
            </button>
            <div style={{textAlign:"center",marginTop:20,fontSize:13,color:"#64748B"}}>
              Don't have an account? <span style={{color:"#C9A84C",cursor:"pointer",fontWeight:600}} onClick={()=>setMode("register")}>Create account</span>
            </div>
          </div>
        ):(
          <div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
              <div>
                <label style={lbl}>Full name *</label>
                <input value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Ahmed Al-Mansoori" style={inp}/>
              </div>
              <div>
                <label style={lbl}>WhatsApp number *</label>
                <input value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000" style={inp}/>
              </div>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Email address (optional)</label>
              <input value={f.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" style={inp}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={lbl}>Area *</label>
              <select value={f.area} onChange={e=>set("area",e.target.value)} style={{...inp,color:f.area?"#1E293B":"#94A3B8"}}>
                <option value="">Select your area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
              <div>
                <label style={lbl}>Building name</label>
                <input value={f.building} onChange={e=>set("building",e.target.value)} placeholder="Building name" style={inp}/>
              </div>
              <div>
                <label style={lbl}>Flat / Unit no.</label>
                <input value={f.flat} onChange={e=>set("flat",e.target.value)} placeholder="e.g. 204" style={inp}/>
              </div>
            </div>
            <button onClick={register} disabled={loading} style={{width:"100%",background:loading?"#94A3B8":"#0F172A",color:"#fff",border:"none",borderRadius:9,padding:"12px",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",...F,marginBottom:10}}>
              {loading?"Creating account…":"Create account →"}
            </button>
            <div style={{textAlign:"center",fontSize:13,color:"#64748B"}}>
              Have an account? <span style={{color:"#C9A84C",cursor:"pointer",fontWeight:600}} onClick={()=>setMode("login")}>Sign in</span>
            </div>
          </div>
        )}
        <div style={{marginTop:24,paddingTop:20,borderTop:"1px solid #F1F5F9",fontSize:11,color:"#94A3B8",textAlign:"center"}}>
          By continuing you agree to Wasta's Terms of Service & Privacy Policy
        </div>
      </div>
    </div>
  );
}

export default function WastaApp(){
  const [user,setUserState]=useState(getUser());
  const [screen,setScreen]=useState("home");
  const [tab,setTab]=useState("home");
  const [selCat,setSelCat]=useState(null);
  const [selSub,setSelSub]=useState(null);
  const [providers,setProviders]=useState([]);
  const [selProv,setSelProv]=useState(null);
  const [selSlot,setSelSlot]=useState(null);
  const [notes,setNotes]=useState("");
  const [promo,setPromo]=useState("");
  const [bookings,setBookings]=useState([]);
  const [confirmed,setConfirmed]=useState(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState(null);
  const [search,setSearch]=useState("");

  if(!user) return <AuthScreen onAuth={u=>{saveUser(u);setUserState(u);}}/>;

  const cat=CATEGORIES.find(c=>c.id===selCat);
  const serviceLabel=selSub?`${cat?.label} - ${selSub}`:cat?.label;

  useEffect(()=>{
    if(!selCat)return;
    setLoading(true);setError(null);
    supabase.from("providers").select("*").eq("verified",true).eq("status","approved")
      .contains("services",[cat?.label]).order("rating",{ascending:false})
      .then(({data,error:e})=>{setProviders(data||[]);if(e)setError(e.message);setLoading(false);});
  },[selCat]);

  useEffect(()=>{
    if(tab!=="bookings"||!user)return;
    supabase.from("bookings").select("*,providers(first_name,last_name)")
      .eq("customer_phone",user.phone).order("created_at",{ascending:false})
      .then(({data})=>setBookings(data||[]));
  },[tab]);

  const book=async()=>{
    if(!selProv||!selSlot)return;
    setLoading(true);setError(null);
    const[t,ap]=selSlot.split(" ");const[h,m]=t.split(":");
    let hr=parseInt(h);if(ap==="PM"&&hr!==12)hr+=12;if(ap==="AM"&&hr===12)hr=0;
    const slot=new Date();slot.setHours(hr,parseInt(m),0,0);
    const{data,error:e}=await supabase.from("bookings").insert([{
      customer_name:user.full_name,customer_phone:user.phone,customer_email:user.email,customer_area:user.area,
      service:serviceLabel,provider_id:selProv.id,slot_time:slot.toISOString(),
      amount:selProv.rate||cat?.from||149,
      notes:notes+(promo?` | Promo: ${promo}`:""),status:"pending",
    }]).select().single();
    if(e){setError(e.message);setLoading(false);return;}
    setConfirmed({ref:data.ref,service:serviceLabel,pro:`${selProv.first_name} ${selProv.last_name}`,time:selSlot,price:`AED ${selProv.rate||cat?.from||149}`});
    setLoading(false);setScreen("confirmed");
  };

  const reset=()=>{setScreen("home");setSelCat(null);setSelSub(null);setSelProv(null);setSelSlot(null);setNotes("");setPromo("");setConfirmed(null);setProviders([]);setTab("home");setError(null);setSearch("");};
  const logout=()=>{rmUser();setUserState(null);};
  const firstName=user.full_name.split(" ")[0];
  const filteredCats=search?CATEGORIES.filter(c=>c.label.toLowerCase().includes(search.toLowerCase())||c.sub.some(s=>s.toLowerCase().includes(search.toLowerCase()))):CATEGORIES;

  // ── Layout ────────────────────────────────────────────────
  const Layout=({children,sidebar})=>(
    <div style={{display:"flex",minHeight:"100vh",background:"#F8FAFC",...F}}>
      {/* Sidebar */}
      <div style={{width:240,background:"#0F172A",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh"}}>
        <div style={{padding:"24px 20px",borderBottom:"1px solid #1E293B"}}>
          <div style={{fontSize:24,fontWeight:800,color:"#C9A84C",fontFamily:"Georgia,serif",letterSpacing:"0.06em"}}>WASTA</div>
          <div style={{fontSize:10,color:"#8B6914",letterSpacing:"0.15em",marginTop:2}}>واسطة · DUBAI</div>
        </div>
        <div style={{padding:"16px 12px",flex:1,overflowY:"auto"}}>
          {[["🏠","Home","home"],["📋","My Bookings","bookings"],["👤","Profile","profile"]].map(([ico,lbl,t])=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="home")reset();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:8,border:"none",background:tab===t?"rgba(201,168,76,0.15)":"none",color:tab===t?"#C9A84C":"#94A3B8",fontSize:14,fontWeight:tab===t?600:400,cursor:"pointer",marginBottom:2,textAlign:"left",...F}}>
              <span style={{fontSize:18}}>{ico}</span>{lbl}
            </button>
          ))}
          <div style={{marginTop:20,paddingTop:16,borderTop:"1px solid #1E293B"}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.12em",color:"#475569",textTransform:"uppercase",marginBottom:10,paddingLeft:12}}>Services</div>
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>{setSelCat(c.id);setScreen("subcategory");setTab("home");}} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:6,border:"none",background:selCat===c.id&&tab==="home"?"rgba(201,168,76,0.1)":"none",color:selCat===c.id&&tab==="home"?"#C9A84C":"#64748B",fontSize:12,cursor:"pointer",textAlign:"left",...F}}>
                <span style={{fontSize:14}}>{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
        </div>
        {/* User info */}
        <div style={{padding:"16px 20px",borderTop:"1px solid #1E293B",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:34,height:34,borderRadius:8,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#0F172A",flexShrink:0}}>{ini(user.full_name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:600,color:"#E2E8F0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.full_name}</div>
            <div style={{fontSize:11,color:"#64748B"}}>{user.area||"Dubai"}</div>
          </div>
          <button onClick={logout} style={{background:"none",border:"none",cursor:"pointer",color:"#475569",fontSize:16,padding:4}} title="Sign out">⬛</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
        {/* Top bar */}
        <div style={{background:"#fff",borderBottom:"1px solid #E2E8F0",padding:"14px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:12,flex:1,maxWidth:500}}>
            <span style={{color:"#94A3B8",fontSize:16}}>🔍</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search services, e.g. AC cleaning, deep cleaning…"
              style={{border:"none",outline:"none",fontSize:14,color:"#1E293B",flex:1,...F,background:"transparent"}}
              onFocus={()=>{if(screen!=="home"){reset();}}}/>
            {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#94A3B8",cursor:"pointer",fontSize:14}}>✕</button>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{fontSize:13,color:"#64748B"}}>📍 {user.area||"Dubai"}</div>
            <div style={{width:36,height:36,borderRadius:9,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#0F172A"}}>{ini(user.full_name)}</div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {children}
        </div>
      </div>
    </div>
  );

  const SM=({s})=>{const m=statusMeta[s]||statusMeta.pending;return<span style={{display:"inline-flex",alignItems:"center",gap:5,background:m.bg,color:m.color,fontSize:11,fontWeight:600,padding:"3px 10px",borderRadius:20,...F}}><span style={{width:6,height:6,borderRadius:"50%",background:m.dot,display:"inline-block"}}/>{m.label}</span>;};

  // ── Profile ───────────────────────────────────────────────
  if(tab==="profile") return(
    <Layout>
      <div style={{padding:"32px 40px",maxWidth:700}}>
        <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:24}}>My Profile</div>
        <div style={{background:"#0F172A",borderRadius:16,padding:"28px 32px",marginBottom:20,display:"flex",gap:20,alignItems:"center"}}>
          <div style={{width:64,height:64,borderRadius:16,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#0F172A",flexShrink:0}}>{ini(user.full_name)}</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:22,marginBottom:4}}>{user.full_name}</div>
            <div style={{color:"#94A3B8",fontSize:14}}>{user.phone}</div>
            {user.email&&<div style={{color:"#94A3B8",fontSize:13}}>{user.email}</div>}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#94A3B8",marginBottom:14}}>Address details</div>
            {[["Area",user.area||"—"],["Building",user.building||"—"],["Flat / Unit",user.flat_no||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
                <span style={{fontSize:13,color:"#64748B"}}>{k}</span>
                <span style={{fontSize:13,color:"#1E293B",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#94A3B8",marginBottom:14}}>Account info</div>
            {[["Member since",new Date(user.created_at).toLocaleDateString("en-AE",{month:"long",year:"numeric"})],["Account ID",user.id?.slice(0,8)+"…"],["Status","Active ✓"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F1F5F9"}}>
                <span style={{fontSize:13,color:"#64748B"}}>{k}</span>
                <span style={{fontSize:13,color:"#1E293B",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={logout} style={{background:"none",color:"#DC2626",border:"1.5px solid #DC2626",borderRadius:9,padding:"10px 24px",fontWeight:600,fontSize:14,cursor:"pointer",...F}}>Sign out</button>
      </div>
    </Layout>
  );

  // ── Bookings ──────────────────────────────────────────────
  if(tab==="bookings") return(
    <Layout>
      <div style={{padding:"32px 40px"}}>
        <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:24}}>My Bookings</div>
        {bookings.length===0
          ?<div style={{textAlign:"center",padding:"80px 0"}}>
            <div style={{fontSize:56,marginBottom:16}}>📋</div>
            <div style={{fontSize:20,fontWeight:700,color:"#1E293B",marginBottom:8}}>No bookings yet</div>
            <div style={{fontSize:14,color:"#64748B",marginBottom:24}}>Book your first service to get started</div>
            <button onClick={()=>setTab("home")} style={{background:"#C9A84C",color:"#0F172A",border:"none",borderRadius:9,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",...F}}>Browse services</button>
          </div>
          :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
            {bookings.map(b=>(
              <div key={b.id} style={{background:"#fff",borderRadius:14,padding:"20px 22px",border:"1px solid #E2E8F0"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,color:"#0F172A",marginBottom:4}}>{b.service}</div>
                    <div style={{fontSize:13,color:"#64748B"}}>{b.providers?`${b.providers.first_name} ${b.providers.last_name}`:"Provider assigned"}</div>
                  </div>
                  <SM s={b.status}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:12,borderTop:"1px solid #F1F5F9"}}>
                  <div style={{fontSize:12,color:"#94A3B8",fontFamily:"monospace"}}>{b.ref}</div>
                  <div style={{fontSize:18,fontWeight:700,color:"#C9A84C"}}>AED {b.amount}</div>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </Layout>
  );

  // ── Home ──────────────────────────────────────────────────
  if(screen==="home") return(
    <Layout>
      <div style={{padding:"32px 40px"}}>
        {/* Hero */}
        <div style={{background:"linear-gradient(135deg,#0F172A 0%,#1E293B 100%)",borderRadius:20,padding:"32px 40px",marginBottom:32,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{color:"#94A3B8",fontSize:14,marginBottom:6}}>Good morning,</div>
            <div style={{color:"#fff",fontSize:28,fontWeight:700,marginBottom:8}}>{firstName} 👋</div>
            <div style={{color:"#64748B",fontSize:14}}>What service do you need today?</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:13,color:"#C9A84C",fontWeight:600,marginBottom:4}}>📍 {user.area||"Dubai"}</div>
            <div style={{fontSize:12,color:"#475569"}}>{CATEGORIES.length} services available</div>
          </div>
        </div>

        {/* Search results or all services */}
        {search?(
          <div>
            <div style={{fontSize:13,color:"#64748B",marginBottom:16}}>Results for "<strong>{search}</strong>" — {filteredCats.length} services found</div>
            {filteredCats.length===0
              ?<div style={{textAlign:"center",padding:"48px 0",color:"#94A3B8"}}>No services found for "{search}"</div>
              :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:14}}>
                {filteredCats.map(c=>(
                  <div key={c.id} onClick={()=>{setSelCat(c.id);setScreen("subcategory");}}
                    style={{background:c.color,borderRadius:14,padding:"20px",cursor:"pointer",border:"1px solid rgba(0,0,0,0.04)",transition:"transform 0.15s"}}>
                    <div style={{fontSize:32,marginBottom:10}}>{c.icon}</div>
                    <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:3}}>{c.label}</div>
                    <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>{c.desc}</div>
                    <div style={{fontSize:12,color:"#8B6914",fontWeight:700}}>from AED {c.from}</div>
                  </div>
                ))}
              </div>
            }
          </div>
        ):(
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#0F172A",marginBottom:20}}>All Services ({CATEGORIES.length})</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14}}>
              {CATEGORIES.map(c=>(
                <div key={c.id} onClick={()=>{setSelCat(c.id);setScreen("subcategory");}}
                  style={{background:c.color,borderRadius:14,padding:"20px",cursor:"pointer",border:"1px solid rgba(0,0,0,0.04)"}}>
                  <div style={{fontSize:32,marginBottom:10}}>{c.icon}</div>
                  <div style={{fontWeight:700,fontSize:15,color:"#0F172A",marginBottom:3}}>{c.label}</div>
                  <div style={{fontSize:12,color:"#64748B",marginBottom:8}}>{c.desc}</div>
                  <div style={{fontSize:12,color:"#8B6914",fontWeight:700}}>from AED {c.from}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );

  // ── Subcategory ───────────────────────────────────────────
  if(screen==="subcategory") return(
    <Layout>
      <div style={{padding:"32px 40px",maxWidth:900}}>
        <button onClick={()=>setScreen("home")} style={{background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:6,...F}}>← Back to services</button>
        <div style={{background:cat?.color,borderRadius:16,padding:"28px 32px",marginBottom:28,display:"flex",gap:20,alignItems:"center",border:"1px solid rgba(0,0,0,0.04)"}}>
          <div style={{fontSize:48}}>{cat?.icon}</div>
          <div>
            <div style={{fontWeight:700,fontSize:24,color:"#0F172A",marginBottom:4}}>{cat?.label}</div>
            <div style={{fontSize:14,color:"#64748B",marginBottom:8}}>{cat?.desc}</div>
            <span style={{background:"#0F172A",color:"#C9A84C",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20}}>from AED {cat?.from}</span>
          </div>
        </div>
        <div style={{fontSize:16,fontWeight:700,color:"#0F172A",marginBottom:16}}>Select a specific service</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12,marginBottom:16}}>
          {cat?.sub.map(s=>(
            <div key={s} onClick={()=>{setSelSub(s);setScreen("providers");}}
              style={{background:"#fff",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",border:"1px solid #E2E8F0",transition:"border-color 0.15s"}}>
              <div>
                <div style={{fontWeight:600,fontSize:15,color:"#0F172A",marginBottom:2}}>{s}</div>
                <div style={{fontSize:12,color:"#94A3B8"}}>{cat?.label}</div>
              </div>
              <span style={{color:"#C9A84C",fontSize:18,fontWeight:700}}>→</span>
            </div>
          ))}
        </div>
        <div onClick={()=>{setSelSub(null);setScreen("providers");}}
          style={{background:"#0F172A",borderRadius:12,padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
          <div>
            <div style={{fontWeight:600,fontSize:15,color:"#C9A84C",marginBottom:2}}>Browse all {cat?.label} providers</div>
            <div style={{fontSize:12,color:"#64748B"}}>See all available professionals in your area</div>
          </div>
          <span style={{color:"#C9A84C",fontSize:18,fontWeight:700}}>→</span>
        </div>
      </div>
    </Layout>
  );

  // ── Providers ─────────────────────────────────────────────
  if(screen==="providers") return(
    <Layout>
      <div style={{padding:"32px 40px"}}>
        <button onClick={()=>setScreen("subcategory")} style={{background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:6,...F}}>← Back to {cat?.label}</button>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:4}}>{selSub||cat?.label} Providers</div>
            <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#ECFDF5",color:"#065F46",fontSize:12,fontWeight:600,padding:"4px 12px",borderRadius:20}}>✅ All providers Emirates ID verified & trade licensed</div>
          </div>
          {selProv&&(
            <button onClick={()=>setScreen("schedule")}
              style={{background:"#C9A84C",color:"#0F172A",border:"none",borderRadius:9,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",...F}}>
              Continue with {selProv.first_name} →
            </button>
          )}
        </div>
        {error&&<div style={{background:"#FEF2F2",color:"#991B1B",fontSize:13,padding:"10px 16px",borderRadius:8,marginBottom:16}}>{error}</div>}
        {loading
          ?<div style={{textAlign:"center",padding:"64px 0",color:"#94A3B8",fontSize:15}}>Finding providers near you…</div>
          :providers.length===0
            ?<div style={{textAlign:"center",padding:"80px 0"}}>
              <div style={{fontSize:52,marginBottom:16}}>{cat?.icon}</div>
              <div style={{fontSize:20,fontWeight:700,color:"#1E293B",marginBottom:8}}>No providers available yet</div>
              <div style={{fontSize:14,color:"#64748B",marginBottom:24}}>We're onboarding verified {cat?.label} professionals. Check back soon.</div>
              <button onClick={()=>setScreen("subcategory")} style={{background:"#0F172A",color:"#fff",border:"none",borderRadius:9,padding:"10px 24px",fontWeight:600,fontSize:13,cursor:"pointer",...F}}>← Browse other services</button>
            </div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
              {providers.map(p=>(
                <div key={p.id} onClick={()=>setSelProv(p)}
                  style={{background:"#fff",borderRadius:14,padding:"20px 22px",border:`2px solid ${selProv?.id===p.id?"#C9A84C":"#E2E8F0"}`,cursor:"pointer",transition:"border-color 0.15s",boxShadow:selProv?.id===p.id?"0 0 0 4px rgba(201,168,76,0.1)":"none"}}>
                  <div style={{display:"flex",gap:14,marginBottom:14}}>
                    <div style={{width:52,height:52,borderRadius:12,background:aC(p.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:"#0F172A",flexShrink:0}}>{ini(`${p.first_name} ${p.last_name}`)}</div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:16,color:"#0F172A",marginBottom:3}}>{p.first_name} {p.last_name}</div>
                      <div style={{fontSize:13,color:"#64748B"}}>{p.experience||"Experienced"} · {p.area}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontWeight:700,color:"#C9A84C",fontSize:20}}>AED {p.rate}</div>
                      <div style={{fontSize:11,color:"#94A3B8"}}>per call</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:12,borderTop:"1px solid #F1F5F9"}}>
                    {p.verified&&<span style={{background:"#ECFDF5",color:"#065F46",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>✓ Verified</span>}
                    {p.insurance&&<span style={{background:"#EFF6FF",color:"#1D4ED8",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>🛡 Insured</span>}
                    {(p.rating||0)>=4.8&&<span style={{background:"#FFFBEB",color:"#92400E",fontSize:10,fontWeight:700,padding:"2px 9px",borderRadius:20}}>⭐ Top rated</span>}
                    <span style={{fontSize:11,color:"#94A3B8",marginLeft:"auto"}}>{p.review_count||0} reviews</span>
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </Layout>
  );

  // ── Schedule ──────────────────────────────────────────────
  if(screen==="schedule") return(
    <Layout>
      <div style={{padding:"32px 40px",maxWidth:800}}>
        <button onClick={()=>setScreen("providers")} style={{background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:6,...F}}>← Back to providers</button>
        <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:24}}>Schedule your appointment</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
          <div>
            <div style={{background:"#0F172A",borderRadius:14,padding:"20px 24px",marginBottom:20,display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:48,height:48,borderRadius:12,background:aC(selProv.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,color:"#0F172A",flexShrink:0}}>{ini(`${selProv.first_name} ${selProv.last_name}`)}</div>
              <div>
                <div style={{color:"#fff",fontWeight:700,fontSize:16}}>{selProv.first_name} {selProv.last_name}</div>
                <div style={{color:"#64748B",fontSize:13}}>AED {selProv.rate} · {selProv.area}</div>
              </div>
            </div>
            <div style={{background:cat?.color,borderRadius:12,padding:"14px 18px",marginBottom:20,border:"1px solid rgba(0,0,0,0.04)"}}>
              <div style={{fontSize:14,fontWeight:600,color:"#0F172A"}}>{selSub||cat?.label}</div>
              <div style={{fontSize:12,color:"#64748B",marginTop:2}}>{cat?.desc}</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:12}}>Notes for the professional</div>
            <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any special instructions, access details, or specific requirements…"
              style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px 14px",fontSize:13,color:"#1E293B",background:"#fff",resize:"vertical",minHeight:100,boxSizing:"border-box",outline:"none",...F,marginBottom:16}}/>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:10}}>Promo code (optional)</div>
            <input value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} placeholder="Enter promo code"
              style={{width:"100%",border:"1px solid #E2E8F0",borderRadius:10,padding:"11px 14px",fontSize:13,color:"#1E293B",background:"#fff",boxSizing:"border-box",outline:"none",...F,letterSpacing:"0.08em"}}/>
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:14}}>Available time slots — Today</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:24}}>
              {SLOTS.map(t=>(
                <button key={t} onClick={()=>setSelSlot(t)}
                  style={{padding:"12px 8px",borderRadius:10,border:`2px solid ${selSlot===t?"#C9A84C":"#E2E8F0"}`,background:selSlot===t?"#FFF8E6":"#fff",color:selSlot===t?"#8B6914":"#64748B",fontWeight:selSlot===t?700:400,fontSize:13,cursor:"pointer",...F}}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={()=>setScreen("review")} disabled={!selSlot}
              style={{width:"100%",background:selSlot?"#C9A84C":"#E2E8F0",color:selSlot?"#0F172A":"#94A3B8",border:"none",borderRadius:10,padding:"14px",fontWeight:700,fontSize:15,cursor:selSlot?"pointer":"not-allowed",...F}}>
              Review booking →
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );

  // ── Review ────────────────────────────────────────────────
  if(screen==="review") return(
    <Layout>
      <div style={{padding:"32px 40px",maxWidth:700}}>
        <button onClick={()=>setScreen("schedule")} style={{background:"none",border:"none",cursor:"pointer",color:"#64748B",fontSize:13,marginBottom:20,display:"flex",alignItems:"center",gap:6,...F}}>← Back to schedule</button>
        <div style={{fontSize:22,fontWeight:700,color:"#0F172A",marginBottom:24}}>Review & confirm booking</div>
        {error&&<div style={{background:"#FEF2F2",color:"#991B1B",fontSize:13,padding:"12px 16px",borderRadius:8,marginBottom:16,border:"1px solid #FECACA"}}>{error}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
          <div style={{background:"#fff",borderRadius:14,padding:"22px 24px",border:"1px solid #E2E8F0"}}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:14}}>Booking summary</div>
            {[["Category",cat?.label],["Service",selSub||"General"],["Provider",`${selProv?.first_name} ${selProv?.last_name}`],["Date","Today"],["Time",selSlot],["Area",user.area||"—"],...(promo?[["Promo code",promo]]:[])].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid #F8FAFC"}}>
                <span style={{fontSize:13,color:"#64748B"}}>{k}</span>
                <span style={{fontSize:13,color:k==="Promo code"?"#065F46":"#0F172A",fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",paddingTop:16,marginTop:4}}>
              <span style={{fontSize:16,fontWeight:700,color:"#0F172A"}}>Total</span>
              <span style={{fontSize:24,fontWeight:700,color:"#C9A84C"}}>AED {selProv?.rate}</span>
            </div>
          </div>
          <div>
            <div style={{background:"#fff",borderRadius:14,padding:"22px 24px",border:"1px solid #E2E8F0",marginBottom:14}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:12}}>Booked for</div>
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <div style={{width:44,height:44,borderRadius:10,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#0F172A",flexShrink:0}}>{ini(user.full_name)}</div>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#0F172A"}}>{user.full_name}</div>
                  <div style={{fontSize:13,color:"#64748B"}}>{user.phone}</div>
                  {user.area&&<div style={{fontSize:12,color:"#94A3B8"}}>{[user.area,user.building,user.flat_no?"Flat "+user.flat_no:null].filter(Boolean).join(", ")}</div>}
                </div>
              </div>
            </div>
            <div style={{background:"#fff",borderRadius:14,padding:"20px 24px",border:"1px solid #E2E8F0"}}>
              <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#94A3B8",marginBottom:12}}>Payment method</div>
              <div style={{display:"flex",gap:8}}>
                {["💳 Card on file","💵 Cash on arrival"].map(m=><span key={m} style={{background:"#F8FAFC",borderRadius:8,padding:"7px 12px",fontSize:13,color:"#64748B",border:"1px solid #E2E8F0"}}>{m}</span>)}
              </div>
            </div>
          </div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <button onClick={book} disabled={loading}
            style={{background:loading?"#94A3B8":"#0F172A",color:"#fff",border:"none",borderRadius:10,padding:"14px 40px",fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",...F}}>
            {loading?"Confirming…":"✓ Confirm booking"}
          </button>
          <button onClick={reset} style={{background:"none",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:10,padding:"14px 24px",fontSize:14,cursor:"pointer",...F}}>Cancel</button>
        </div>
      </div>
    </Layout>
  );

  // ── Confirmed ─────────────────────────────────────────────
  if(screen==="confirmed") return(
    <Layout>
      <div style={{padding:"80px 40px",maxWidth:600,margin:"0 auto",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"#ECFDF5",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40,margin:"0 auto 24px"}}>✅</div>
        <div style={{fontSize:28,fontWeight:700,color:"#0F172A",marginBottom:8}}>Booking confirmed!</div>
        <div style={{fontSize:15,color:"#64748B",marginBottom:32,lineHeight:1.7}}>{selProv?.first_name} will contact you at {user.phone} to confirm the appointment time.</div>
        <div style={{background:"#fff",borderRadius:16,padding:"24px 28px",marginBottom:28,border:"1px solid #E2E8F0",textAlign:"left"}}>
          {[["Reference",confirmed?.ref],["Service",confirmed?.service],["Provider",confirmed?.pro],["Time",confirmed?.time],["Amount",confirmed?.price]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid #F8FAFC"}}>
              <span style={{fontSize:13,color:"#64748B"}}>{k}</span>
              <span style={{fontSize:13,color:"#0F172A",fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <button onClick={reset} style={{background:"#C9A84C",color:"#0F172A",border:"none",borderRadius:10,padding:"12px 28px",fontWeight:700,fontSize:14,cursor:"pointer",...F}}>Book another service</button>
          <button onClick={()=>{reset();setTab("bookings");}} style={{background:"none",color:"#64748B",border:"1px solid #E2E8F0",borderRadius:10,padding:"12px 24px",fontSize:14,cursor:"pointer",...F}}>View my bookings</button>
        </div>
      </div>
    </Layout>
  );

  return null;
}
