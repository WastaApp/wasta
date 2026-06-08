import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const AREAS = ["Downtown Dubai","Dubai Marina","JLT","Al Barsha","Jumeirah","Business Bay","Deira","Bur Dubai","Mirdif","Silicon Oasis","JVC","Sports City","Palm Jumeirah","Al Nahda","Discovery Gardens"];

const CATEGORIES = [
  {
    id:"ac", icon:"❄️", label:"AC Services", color:"#EBF5FF",
    sub:["AC Cleaning","AC Repair","AC Installation","AC Gas Refill","Duct Cleaning","Thermostat Repair"],
    from:149, desc:"Professional AC maintenance & repair"
  },
  {
    id:"clean", icon:"✨", label:"Cleaning", color:"#F5F0FF",
    sub:["Deep Cleaning","Regular Cleaning","Move-in/out Cleaning","Sofa Cleaning","Carpet Cleaning","Window Cleaning","Kitchen Cleaning"],
    from:99, desc:"Home & office cleaning services"
  },
  {
    id:"plumb", icon:"🔧", label:"Plumbing", color:"#EDFAF4",
    sub:["Leak Repair","Pipe Fitting","Drain Cleaning","Water Heater","Bathroom Fitting","Kitchen Plumbing"],
    from:120, desc:"Leaks, fixtures & pipe work"
  },
  {
    id:"elec", icon:"⚡", label:"Electrical", color:"#FFFBEB",
    sub:["Wiring","Breaker/Fuse","Light Fitting","Fan Installation","Socket Repair","Electrical Inspection"],
    from:130, desc:"Wiring, fittings & electrical repairs"
  },
  {
    id:"paint", icon:"🖌️", label:"Painting", color:"#FFF0F0",
    sub:["Interior Painting","Exterior Painting","Villa Painting","Texture Painting","Wallpaper","Touch-up"],
    from:199, desc:"Rooms, villas & commercial spaces"
  },
  {
    id:"pest", icon:"🛡️", label:"Pest Control", color:"#EDFAF4",
    sub:["General Pest Control","Cockroach Treatment","Bed Bug Treatment","Termite Control","Rodent Control","Mosquito Control"],
    from:180, desc:"Safe & effective pest elimination"
  },
  {
    id:"carwash", icon:"🚗", label:"Car Wash", color:"#EBF5FF",
    sub:["Exterior Wash","Full Valet","Interior Cleaning","Polishing","Ceramic Coating","Engine Cleaning"],
    from:89, desc:"Mobile car wash at your location"
  },
  {
    id:"move", icon:"📦", label:"Moving", color:"#FFF5EB",
    sub:["Home Moving","Office Moving","Furniture Moving","Storage","Packing Service","Single Item Move"],
    from:500, desc:"Safe & reliable moving services"
  },
  {
    id:"handyman", icon:"🔨", label:"Handyman", color:"#F5F0EB",
    sub:["Furniture Assembly","TV Mounting","Curtain Fitting","Door Repair","Shelf Installation","General Repairs"],
    from:99, desc:"General repairs & installations"
  },
  {
    id:"beauty", icon:"💆", label:"Beauty & Wellness", color:"#FFF0F7",
    sub:["Massage","Facial","Manicure/Pedicure","Haircut at Home","Waxing","Bridal Makeup"],
    from:150, desc:"Beauty & wellness at your doorstep"
  },
  {
    id:"laundry", icon:"👕", label:"Laundry", color:"#F0F7FF",
    sub:["Wash & Fold","Dry Cleaning","Ironing","Curtain Cleaning","Leather Cleaning","Alterations"],
    from:49, desc:"Pickup & delivery laundry service"
  },
  {
    id:"event", icon:"🎉", label:"Event Services", color:"#FFFBEB",
    sub:["Event Setup","Decoration","Catering Assistance","Photography","Sound System","Cleaning After Event"],
    from:299, desc:"Complete event support services"
  },
  {
    id:"carp", icon:"🪚", label:"Carpentry", color:"#F5F0EB",
    sub:["Furniture Repair","Custom Furniture","Door Fitting","Kitchen Cabinet","Wardrobe Fitting","Wood Polishing"],
    from:110, desc:"Woodwork, assembly & repairs"
  },
  {
    id:"corporate", icon:"🏢", label:"Corporate", color:"#EEF2FF",
    sub:["Office Cleaning","Office Maintenance","Corporate AC","IT Setup","Office Moving","Facility Management"],
    from:499, desc:"Business & facility services"
  },
];

const SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM","6:00 PM","7:00 PM","8:00 PM"];

const aColors = ["#C9A84C","#5DA5A5","#A55D5D","#5D7AA5","#8A5DA5","#5DA57A"];
const aC = n => aColors[(n||"A").charCodeAt(0)%aColors.length];
const ini = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

const getUser = () => { try{return JSON.parse(localStorage.getItem("wasta_u2"));}catch{return null;} };
const saveUser = u => localStorage.setItem("wasta_u2",JSON.stringify(u));
const rmUser = () => localStorage.removeItem("wasta_u2");

const statusMeta = {
  pending:{label:"Pending",bg:"#FFF8E6",color:"#92600A"},
  confirmed:{label:"Confirmed",bg:"#E6F7F2",color:"#0B6B4A"},
  in_progress:{label:"In progress",bg:"#EEE8FD",color:"#5B3DB5"},
  completed:{label:"Completed",bg:"#E8F5E9",color:"#2E7D32"},
  cancelled:{label:"Cancelled",bg:"#FDECEA",color:"#C62828"},
};

// ── Styles ───────────────────────────────────────────────────
const inp = {width:"100%",border:"1.5px solid #E5E0D8",borderRadius:10,padding:"12px 14px",fontSize:14,color:"#1A1612",background:"#fff",boxSizing:"border-box",outline:"none",fontFamily:"system-ui,sans-serif"};
const lbl = {display:"block",fontSize:11,fontWeight:600,color:"#8A8278",letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:7,fontFamily:"system-ui,sans-serif"};

// ── Auth Screen ───────────────────────────────────────────────
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
    if(!data){setErr("No account found. Please create one first.");setLoading(false);return;}
    saveUser(data);onAuth(data);setLoading(false);
  };

  const register=async()=>{
    if(!f.name.trim()){setErr("Full name is required");return;}
    if(!f.phone.trim()){setErr("Phone number is required");return;}
    if(!f.area){setErr("Please select your area");return;}
    setLoading(true);setErr(null);
    const{data:ex}=await supabase.from("users").select("id").eq("phone",f.phone.trim()).maybeSingle();
    if(ex){setErr("Phone already registered. Please sign in.");setLoading(false);return;}
    const{data,error}=await supabase.from("users").insert([{
      full_name:f.name.trim(),phone:f.phone.trim(),
      email:f.email.trim()||null,area:f.area,
      building:f.building.trim()||null,flat_no:f.flat.trim()||null,
    }]).select().single();
    if(error){setErr(error.message);setLoading(false);return;}
    saveUser(data);onAuth(data);setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#0F0D0B 0%,#1A1612 50%,#2C2420 100%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:"system-ui,sans-serif"}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:42,fontWeight:800,letterSpacing:"0.1em",color:"#C9A84C",fontFamily:"Georgia,serif"}}>WASTA</div>
        <div style={{fontSize:12,color:"#8B6914",letterSpacing:"0.2em",marginTop:4}}>واسطة · DUBAI</div>
        <div style={{fontSize:13,color:"#666",marginTop:8}}>Dubai's verified home services marketplace</div>
      </div>
      <div style={{background:"#fff",borderRadius:20,padding:28,width:"100%",maxWidth:400,boxShadow:"0 32px 80px rgba(0,0,0,0.5)"}}>
        <div style={{display:"flex",background:"#F5F0EB",borderRadius:12,padding:4,marginBottom:24,gap:3}}>
          {[["login","Sign in"],["register","Create account"]].map(([m,l])=>(
            <button key={m} onClick={()=>{setMode(m);setErr(null);}} style={{flex:1,padding:"10px 8px",border:"none",borderRadius:9,background:mode===m?"#fff":"transparent",color:mode===m?"#1A1612":"#8A8278",fontSize:13,fontWeight:mode===m?700:400,cursor:"pointer",boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.12)":"none"}}>
              {l}
            </button>
          ))}
        </div>
        {err&&<div style={{background:"#FDECEA",color:"#C62828",fontSize:12,padding:"10px 14px",borderRadius:10,marginBottom:16}}>{err}</div>}
        {mode==="login"?(
          <div>
            <div style={{marginBottom:20}}>
              <label style={lbl}>WhatsApp number</label>
              <input value={f.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000" style={inp} onKeyDown={e=>e.key==="Enter"&&login()}/>
            </div>
            <button onClick={login} disabled={loading} style={{width:"100%",background:loading?"#ccc":"#C9A84C",color:"#1A1612",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Signing in…":"Sign in →"}
            </button>
            <p style={{textAlign:"center",marginTop:16,fontSize:13,color:"#8A8278"}}>New here? <span style={{color:"#C9A84C",cursor:"pointer",fontWeight:700}} onClick={()=>setMode("register")}>Create account</span></p>
          </div>
        ):(
          <div>
            {[{k:"name",l:"Full name",p:"Ahmed Al-Mansoori",r:true},{k:"phone",l:"WhatsApp number",p:"+971 50 000 0000",r:true},{k:"email",l:"Email (optional)",p:"you@email.com"}].map(({k,l,p,r})=>(
              <div key={k} style={{marginBottom:14}}>
                <label style={lbl}>{l}{r&&<span style={{color:"#E24B4A",marginLeft:3}}>*</span>}</label>
                <input value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={p} style={inp}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={lbl}>Area <span style={{color:"#E24B4A"}}>*</span></label>
              <select value={f.area} onChange={e=>set("area",e.target.value)} style={{...inp,color:f.area?"#1A1612":"#8A8278"}}>
                <option value="">Select your area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:20}}>
              {[{k:"building",l:"Building",p:"Building name"},{k:"flat",l:"Flat no.",p:"204"}].map(({k,l,p})=>(
                <div key={k} style={{flex:1}}>
                  <label style={lbl}>{l}</label>
                  <input value={f[k]} onChange={e=>set(k,e.target.value)} placeholder={p} style={inp}/>
                </div>
              ))}
            </div>
            <button onClick={register} disabled={loading} style={{width:"100%",background:loading?"#ccc":"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer"}}>
              {loading?"Creating account…":"Create account →"}
            </button>
            <p style={{textAlign:"center",marginTop:14,fontSize:13,color:"#8A8278"}}>Have an account? <span style={{color:"#C9A84C",cursor:"pointer",fontWeight:700}} onClick={()=>setMode("login")}>Sign in</span></p>
          </div>
        )}
      </div>
      <p style={{marginTop:20,fontSize:11,color:"#444",textAlign:"center"}}>By continuing you agree to Wasta's Terms of Service & Privacy Policy</p>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
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

  const cat = CATEGORIES.find(c=>c.id===selCat);
  const serviceLabel = selSub ? `${cat?.label} - ${selSub}` : cat?.label;

  useEffect(()=>{
    if(!selCat) return;
    setLoading(true);setError(null);
    supabase.from("providers").select("*").eq("verified",true).eq("status","approved")
      .contains("services",[cat?.label]).order("rating",{ascending:false})
      .then(({data,error:e})=>{setProviders(data||[]);if(e)setError(e.message);setLoading(false);});
  },[selCat]);

  useEffect(()=>{
    if(tab!=="bookings"||!user) return;
    supabase.from("bookings").select("*,providers(first_name,last_name,phone)")
      .eq("customer_phone",user.phone).order("created_at",{ascending:false})
      .then(({data})=>setBookings(data||[]));
  },[tab]);

  const book=async()=>{
    if(!selProv||!selSlot) return;
    setLoading(true);setError(null);
    const[t,ap]=selSlot.split(" ");const[h,m]=t.split(":");
    let hr=parseInt(h);if(ap==="PM"&&hr!==12)hr+=12;if(ap==="AM"&&hr===12)hr=0;
    const slot=new Date();slot.setHours(hr,parseInt(m),0,0);
    const{data,error:e}=await supabase.from("bookings").insert([{
      customer_name:user.full_name,customer_phone:user.phone,
      customer_email:user.email,customer_area:user.area,
      service:serviceLabel,provider_id:selProv.id,
      slot_time:slot.toISOString(),amount:selProv.rate||cat?.from||149,
      notes:notes+(promo?` | Promo: ${promo}`:""),status:"pending",
    }]).select().single();
    if(e){setError(e.message);setLoading(false);return;}
    setConfirmed({ref:data.ref,service:serviceLabel,pro:`${selProv.first_name} ${selProv.last_name}`,time:selSlot,price:`AED ${selProv.rate||cat?.from||149}`});
    setLoading(false);setScreen("confirmed");
  };

  const reset=()=>{
    setScreen("home");setSelCat(null);setSelSub(null);setSelProv(null);
    setSelSlot(null);setNotes("");setPromo("");setConfirmed(null);
    setProviders([]);setTab("home");setError(null);setSearch("");
  };
  const logout=()=>{rmUser();setUserState(null);};
  const firstName=user.full_name.split(" ")[0];

  const filteredCats = search
    ? CATEGORIES.filter(c=>c.label.toLowerCase().includes(search.toLowerCase())||c.sub.some(s=>s.toLowerCase().includes(search.toLowerCase())))
    : CATEGORIES;

  // ── Layout wrappers ───────────────────────────────────────
  const Page=({children,noNav})=>(
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif",background:"#F5F0EB",width:"100%",maxWidth:430,minHeight:"100vh",margin:"0 auto",display:"flex",flexDirection:"column"}}>
      {children}
      {!noNav&&(
        <div style={{background:"#0F0D0B",display:"flex",borderTop:"1px solid #2C2420",position:"sticky",bottom:0,zIndex:10}}>
          {[["🏠","Home","home"],["📋","Bookings","bookings"],["👤","Profile","profile"]].map(([ico,lbl,t])=>(
            <button key={t} onClick={()=>{setTab(t);if(t==="home")reset();}} style={{flex:1,padding:"10px 4px 8px",background:"none",border:"none",cursor:"pointer",color:tab===t?"#C9A84C":"#666",fontSize:10,fontFamily:"system-ui,sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
              <span style={{fontSize:22}}>{ico}</span>
              <span style={{letterSpacing:"0.04em",textTransform:"uppercase"}}>{lbl}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const Hdr=({title,back,light})=>(
    <div style={{background:light?"#fff":"#0F0D0B",padding:"14px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderBottom:light?"1px solid #E5E0D8":"none"}}>
      {back?<button onClick={back} style={{background:"none",border:"none",cursor:"pointer",color:light?"#1A1612":"#C9A84C",fontSize:22,padding:0,lineHeight:1,width:32}}>←</button>:<div style={{width:32}}/>}
      <div style={{textAlign:"center"}}>
        {title
          ?<div style={{fontSize:16,fontWeight:700,color:light?"#1A1612":"#fff"}}>{title}</div>
          :<div style={{fontSize:22,fontWeight:800,color:"#C9A84C",letterSpacing:"0.08em",fontFamily:"Georgia,serif"}}>WASTA</div>}
      </div>
      <div style={{width:32}}/>
    </div>
  );

  const SM=({s})=>{const m=statusMeta[s]||statusMeta.pending;return<span style={{background:m.bg,color:m.color,fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:20,fontFamily:"system-ui,sans-serif"}}>{m.label}</span>;};

  // ── Profile ───────────────────────────────────────────────
  if(tab==="profile") return(
    <Page>
      <Hdr/>
      <div style={{flex:1,overflowY:"auto"}}>
        <div style={{background:"#0F0D0B",padding:"24px 20px 28px"}}>
          <div style={{display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:58,height:58,borderRadius:16,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{ini(user.full_name)}</div>
            <div>
              <div style={{color:"#fff",fontWeight:700,fontSize:20,marginBottom:2}}>{user.full_name}</div>
              <div style={{color:"#8A8278",fontSize:13}}>{user.phone}</div>
              {user.email&&<div style={{color:"#8A8278",fontSize:12}}>{user.email}</div>}
            </div>
          </div>
        </div>
        <div style={{padding:"20px 18px"}}>
          <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Address details</div>
            {[["Area",user.area||"—"],["Building",user.building||"—"],["Flat no.",user.flat_no||"—"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"0.5px solid #EDE8DF"}}>
                <span style={{fontSize:13,color:"#8A8278"}}>{k}</span>
                <span style={{fontSize:13,color:"#1A1612",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:"#fff",borderRadius:16,padding:"16px 18px",marginBottom:14}}>
            <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Account</div>
            {[["Member since",new Date(user.created_at).toLocaleDateString("en-AE",{month:"long",year:"numeric"})],["Account ID",user.id?.slice(0,8)+"…"]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"0.5px solid #EDE8DF"}}>
                <span style={{fontSize:13,color:"#8A8278"}}>{k}</span>
                <span style={{fontSize:13,color:"#1A1612",fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
          <button onClick={logout} style={{width:"100%",background:"none",color:"#C62828",border:"1.5px solid #C62828",borderRadius:12,padding:13,fontWeight:700,fontSize:14,cursor:"pointer"}}>Sign out</button>
        </div>
      </div>
    </Page>
  );

  // ── Bookings ──────────────────────────────────────────────
  if(tab==="bookings") return(
    <Page>
      <Hdr title="My bookings"/>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {bookings.length===0
          ?<div style={{textAlign:"center",padding:"48px 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>📋</div>
            <div style={{fontSize:16,fontWeight:700,color:"#1A1612",marginBottom:6}}>No bookings yet</div>
            <div style={{fontSize:13,color:"#8A8278"}}>Book your first service to get started</div>
            <button onClick={()=>setTab("home")} style={{marginTop:20,background:"#C9A84C",color:"#1A1612",border:"none",borderRadius:12,padding:"12px 24px",fontWeight:700,fontSize:14,cursor:"pointer"}}>Browse services</button>
          </div>
          :bookings.map(b=>(
            <div key={b.id} style={{background:"#fff",borderRadius:16,padding:16,marginBottom:10,border:"1px solid #EDE8DF"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:15,color:"#1A1612",marginBottom:3}}>{b.service}</div>
                  <div style={{fontSize:12,color:"#8A8278"}}>{b.providers?`${b.providers.first_name} ${b.providers.last_name}`:"Provider"}</div>
                </div>
                <SM s={b.status}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,borderTop:"0.5px solid #EDE8DF"}}>
                <div style={{fontSize:11,color:"#8A8278",fontFamily:"monospace"}}>{b.ref}</div>
                <div style={{fontSize:16,fontWeight:700,color:"#C9A84C"}}>AED {b.amount}</div>
              </div>
            </div>
          ))
        }
      </div>
    </Page>
  );

  // ── Home ──────────────────────────────────────────────────
  if(screen==="home") return(
    <Page>
      <div style={{background:"#0F0D0B",padding:"16px 18px 20px",flexShrink:0}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
          <div>
            <div style={{color:"#8A8278",fontSize:12,marginBottom:2}}>Good morning,</div>
            <div style={{color:"#fff",fontSize:22,fontWeight:700}}>{firstName} 👋</div>
          </div>
          <div style={{fontSize:20,fontWeight:800,color:"#C9A84C",fontFamily:"Georgia,serif"}}>WASTA</div>
        </div>
        <div style={{background:"#1A1612",borderRadius:12,padding:"11px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:16}}>🔍</span>
          <input
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={`Search services in ${user.area||"Dubai"}…`}
            style={{background:"none",border:"none",outline:"none",color:"#fff",fontSize:13,flex:1,fontFamily:"system-ui,sans-serif"}}
          />
          {search&&<button onClick={()=>setSearch("")} style={{background:"none",border:"none",color:"#666",cursor:"pointer",fontSize:16}}>✕</button>}
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"16px 16px 8px"}}>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#8A8278",textTransform:"uppercase",marginBottom:12}}>
          {search?`Results for "${search}"`:` All services (${CATEGORIES.length})`}
        </div>
        {filteredCats.length===0
          ?<div style={{textAlign:"center",padding:"32px 0",color:"#8A8278",fontSize:14}}>No services found for "{search}"</div>
          :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {filteredCats.map(c=>(
              <div key={c.id} onClick={()=>{setSelCat(c.id);setScreen("subcategory");}}
                style={{background:c.color,borderRadius:16,padding:"14px 14px",cursor:"pointer",border:"1px solid rgba(0,0,0,0.05)"}}>
                <div style={{fontSize:28,marginBottom:8}}>{c.icon}</div>
                <div style={{fontWeight:700,fontSize:13,color:"#1A1612",marginBottom:2}}>{c.label}</div>
                <div style={{fontSize:10,color:"#8A8278",marginBottom:5}}>{c.desc}</div>
                <div style={{fontSize:11,color:"#8B6914",fontWeight:700}}>from AED {c.from}</div>
              </div>
            ))}
          </div>
        }
      </div>
    </Page>
  );

  // ── Subcategory ───────────────────────────────────────────
  if(screen==="subcategory") return(
    <Page noNav>
      <Hdr title={cat?.label} back={()=>setScreen("home")}/>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:cat?.color,borderRadius:16,padding:"16px",marginBottom:16,display:"flex",gap:14,alignItems:"center"}}>
          <div style={{fontSize:36}}>{cat?.icon}</div>
          <div>
            <div style={{fontWeight:700,fontSize:18,color:"#1A1612"}}>{cat?.label}</div>
            <div style={{fontSize:13,color:"#8A8278",marginTop:2}}>{cat?.desc}</div>
            <div style={{fontSize:12,color:"#8B6914",fontWeight:700,marginTop:4}}>from AED {cat?.from}</div>
          </div>
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Select a service</div>
        {cat?.sub.map(s=>(
          <div key={s} onClick={()=>{setSelSub(s);setScreen("providers");}}
            style={{background:"#fff",borderRadius:14,padding:"14px 16px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer",border:"1px solid #EDE8DF"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:"#1A1612"}}>{s}</div>
              <div style={{fontSize:11,color:"#8A8278",marginTop:2}}>{cat?.label}</div>
            </div>
            <span style={{color:"#C9A84C",fontSize:20}}>→</span>
          </div>
        ))}
        <div style={{marginTop:8}}>
          <div onClick={()=>{setSelSub(null);setScreen("providers");}}
            style={{background:"#0F0D0B",borderRadius:14,padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
            <div>
              <div style={{fontWeight:600,fontSize:14,color:"#C9A84C"}}>Browse all {cat?.label} providers</div>
              <div style={{fontSize:11,color:"#666",marginTop:2}}>See all available professionals</div>
            </div>
            <span style={{color:"#C9A84C",fontSize:20}}>→</span>
          </div>
        </div>
      </div>
    </Page>
  );

  // ── Providers ─────────────────────────────────────────────
  if(screen==="providers") return(
    <Page noNav>
      <Hdr title={selSub||cat?.label} back={()=>setScreen("subcategory")}/>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"#E8F5E9",borderRadius:12,padding:"10px 14px",marginBottom:14,display:"flex",gap:8,alignItems:"center"}}>
          <span>✅</span>
          <span style={{fontSize:12,color:"#2E7D32",fontWeight:600}}>All providers are Emirates ID verified & trade licensed</span>
        </div>
        {error&&<div style={{background:"#FDECEA",color:"#C62828",fontSize:12,padding:"10px 14px",borderRadius:10,marginBottom:12}}>{error}</div>}
        {loading
          ?<div style={{textAlign:"center",padding:"40px 0",color:"#8A8278",fontSize:14}}>Finding providers near you…</div>
          :providers.length===0
            ?<div style={{textAlign:"center",padding:"40px 0"}}>
              <div style={{fontSize:40,marginBottom:10}}>{cat?.icon}</div>
              <div style={{fontWeight:700,fontSize:15,color:"#1A1612",marginBottom:6}}>No providers available yet</div>
              <div style={{fontSize:13,color:"#8A8278",marginBottom:16}}>We're onboarding verified {cat?.label} professionals</div>
              <button onClick={()=>setScreen("subcategory")} style={{background:"#C9A84C",color:"#1A1612",border:"none",borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>← Back to services</button>
            </div>
            :providers.map(p=>(
              <div key={p.id} onClick={()=>setSelProv(p)}
                style={{background:"#fff",borderRadius:16,padding:16,marginBottom:10,border:`2px solid ${selProv?.id===p.id?"#C9A84C":"#EDE8DF"}`,cursor:"pointer"}}>
                <div style={{display:"flex",gap:12}}>
                  <div style={{width:52,height:52,borderRadius:14,background:aC(p.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,color:"#0F0D0B",flexShrink:0}}>{ini(`${p.first_name} ${p.last_name}`)}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4,flexWrap:"wrap"}}>
                      <span style={{fontWeight:700,fontSize:15,color:"#1A1612"}}>{p.first_name} {p.last_name}</span>
                      {(p.rating||0)>=4.8&&<span style={{background:"#FFF8E6",color:"#92600A",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20}}>⭐ Top rated</span>}
                    </div>
                    <div style={{fontSize:12,color:"#8A8278",marginBottom:6}}>{p.experience||"Experienced"} · {p.area}</div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {p.verified&&<span style={{background:"#E8F5E9",color:"#2E7D32",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>✓ Verified</span>}
                      {p.insurance&&<span style={{background:"#EBF5FF",color:"#1565C0",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20}}>🛡 Insured</span>}
                      <span style={{fontSize:11,color:"#8A8278"}}>{p.review_count||0} reviews</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontWeight:700,color:"#C9A84C",fontSize:18}}>AED {p.rate}</div>
                    <div style={{fontSize:10,color:"#8A8278",marginTop:2}}>per call</div>
                  </div>
                </div>
              </div>
            ))
        }
      </div>
      {providers.length>0&&(
        <div style={{padding:"12px 16px",background:"#fff",borderTop:"1px solid #EDE8DF",flexShrink:0}}>
          <button onClick={()=>setScreen("schedule")} disabled={!selProv}
            style={{width:"100%",background:selProv?"#C9A84C":"#D4CCBC",color:selProv?"#1A1612":"#fff",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:selProv?"pointer":"not-allowed"}}>
            Continue{selProv?` with ${selProv.first_name}`:""} →
          </button>
        </div>
      )}
    </Page>
  );

  // ── Schedule ──────────────────────────────────────────────
  if(screen==="schedule") return(
    <Page noNav>
      <Hdr title="Choose a time" back={()=>setScreen("providers")}/>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"#0F0D0B",borderRadius:16,padding:"14px 16px",marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{width:44,height:44,borderRadius:12,background:aC(selProv.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#0F0D0B",flexShrink:0}}>{ini(`${selProv.first_name} ${selProv.last_name}`)}</div>
          <div>
            <div style={{color:"#fff",fontWeight:700,fontSize:15}}>{selProv.first_name} {selProv.last_name}</div>
            <div style={{color:"#8A8278",fontSize:12}}>AED {selProv.rate} · {selProv.area}</div>
          </div>
        </div>
        <div style={{background:cat?.color,borderRadius:12,padding:"10px 14px",marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:600,color:"#1A1612"}}>{selSub||cat?.label}</div>
          <div style={{fontSize:11,color:"#8A8278"}}>{cat?.desc}</div>
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Available time slots</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
          {SLOTS.map(t=>(
            <button key={t} onClick={()=>setSelSlot(t)}
              style={{padding:"12px 8px",borderRadius:12,border:`2px solid ${selSlot===t?"#C9A84C":"#EDE8DF"}`,background:selSlot===t?"#FFF8E6":"#fff",color:selSlot===t?"#8B6914":"#8A8278",fontWeight:selSlot===t?700:400,fontSize:13,cursor:"pointer"}}>
              {t}
            </button>
          ))}
        </div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:10}}>Notes for the professional</div>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)}
          placeholder="Any special instructions or details about the job…"
          style={{width:"100%",border:"1.5px solid #EDE8DF",borderRadius:12,padding:"12px 14px",fontSize:13,color:"#1A1612",background:"#fff",resize:"vertical",minHeight:80,boxSizing:"border-box",outline:"none",marginBottom:14}}/>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:10}}>Promo code (optional)</div>
        <input value={promo} onChange={e=>setPromo(e.target.value.toUpperCase())} placeholder="Enter promo code"
          style={{...inp,marginBottom:4,letterSpacing:"0.1em"}}/>
      </div>
      <div style={{padding:"12px 16px",background:"#fff",borderTop:"1px solid #EDE8DF",flexShrink:0}}>
        <button onClick={()=>setScreen("review")} disabled={!selSlot}
          style={{width:"100%",background:selSlot?"#C9A84C":"#D4CCBC",color:selSlot?"#1A1612":"#fff",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:selSlot?"pointer":"not-allowed"}}>
          Review booking →
        </button>
      </div>
    </Page>
  );

  // ── Review ────────────────────────────────────────────────
  if(screen==="review") return(
    <Page noNav>
      <Hdr title="Review & confirm" back={()=>setScreen("schedule")}/>
      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {error&&<div style={{background:"#FDECEA",color:"#C62828",fontSize:12,padding:"10px 14px",borderRadius:10,marginBottom:12}}>{error}</div>}
        <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:14}}>Booking summary</div>
          {[
            ["Category",cat?.label],
            ["Service",selSub||"General"],
            ["Provider",`${selProv?.first_name} ${selProv?.last_name}`],
            ["Date","Today"],
            ["Time",selSlot],
            ["Your area",user.area||"—"],
            ...(promo?[["Promo code",promo]]:()),
          ].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:"0.5px solid #EDE8DF"}}>
              <span style={{fontSize:13,color:"#8A8278"}}>{k}</span>
              <span style={{fontSize:13,color:k==="Promo code"?"#2D6A4F":"#1A1612",fontWeight:600}}>{v}</span>
            </div>
          ))}
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:14}}>
            <span style={{fontSize:16,fontWeight:700,color:"#1A1612"}}>Total</span>
            <span style={{fontSize:22,fontWeight:700,color:"#C9A84C"}}>AED {selProv?.rate}</span>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:18,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Booked for</div>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:42,height:42,borderRadius:12,background:aC(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#0F0D0B",flexShrink:0}}>{ini(user.full_name)}</div>
            <div>
              <div style={{fontWeight:700,fontSize:15,color:"#1A1612"}}>{user.full_name}</div>
              <div style={{fontSize:12,color:"#8A8278"}}>{user.phone}{user.area?` · ${user.area}`:""}</div>
              {(user.building||user.flat_no)&&<div style={{fontSize:12,color:"#8A8278"}}>{[user.building,user.flat_no].filter(Boolean).join(", Flat ")}</div>}
            </div>
          </div>
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:18}}>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",marginBottom:12}}>Payment method</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["💳 Card on file","💵 Cash on arrival"].map(m=><span key={m} style={{background:"#F5F0EB",borderRadius:8,padding:"6px 12px",fontSize:12,color:"#8A8278"}}>{m}</span>)}
          </div>
        </div>
      </div>
      <div style={{padding:"12px 16px",background:"#fff",borderTop:"1px solid #EDE8DF",flexShrink:0}}>
        <button onClick={book} disabled={loading}
          style={{width:"100%",background:loading?"#ccc":"#2D6A4F",color:"#fff",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:loading?"not-allowed":"pointer",marginBottom:8}}>
          {loading?"Confirming…":"✓ Confirm booking"}
        </button>
        <button onClick={reset} style={{width:"100%",background:"none",color:"#8A8278",border:"none",fontSize:13,cursor:"pointer",padding:6}}>Cancel</button>
      </div>
    </Page>
  );

  // ── Confirmed ─────────────────────────────────────────────
  if(screen==="confirmed") return(
    <Page noNav>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"40px 24px",textAlign:"center"}}>
        <div style={{width:80,height:80,borderRadius:"50%",background:"#E8F5E9",display:"flex",alignItems:"center",justifyContent:"center",fontSize:38,marginBottom:20}}>✅</div>
        <div style={{fontSize:26,fontWeight:700,color:"#1A1612",marginBottom:8}}>You're all booked!</div>
        <div style={{fontSize:14,color:"#8A8278",marginBottom:28,maxWidth:280,lineHeight:1.7}}>
          {selProv?.first_name||"Your provider"} will contact you at {user.phone} to confirm the appointment.
        </div>
        <div style={{background:"#fff",borderRadius:16,padding:"18px 20px",width:"100%",marginBottom:20,border:"1px solid #EDE8DF"}}>
          {[["Reference",confirmed?.ref],["Service",confirmed?.service],["Provider",confirmed?.pro],["Time",confirmed?.time],["Amount",confirmed?.price]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"0.5px solid #EDE8DF"}}>
              <span style={{fontSize:13,color:"#8A8278"}}>{k}</span>
              <span style={{fontSize:13,color:"#1A1612",fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <button onClick={reset} style={{width:"100%",background:"#C9A84C",color:"#1A1612",border:"none",borderRadius:12,padding:14,fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:10}}>
          Book another service
        </button>
        <button onClick={()=>{reset();setTab("bookings");}} style={{width:"100%",background:"none",color:"#8A8278",border:"1px solid #EDE8DF",borderRadius:12,padding:13,fontSize:13,cursor:"pointer"}}>
          View my bookings
        </button>
      </div>
    </Page>
  );

  return null;
}
