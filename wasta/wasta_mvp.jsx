import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

const C = {
  gold:"#C9A84C",goldLight:"#F5E6B8",goldDark:"#8B6914",ink:"#1A1612",
  cream:"#FAF7F2",sand:"#EDE8DF",sandDark:"#D4CCBC",muted:"#7A7166",
  green:"#2D6A4F",greenBg:"#D8F3DC",red:"#A33C2D",redBg:"#FDECEA",
};

const AREAS = ["Downtown Dubai","Dubai Marina","JLT","Al Barsha","Jumeirah","Business Bay","Deira","Bur Dubai","Mirdif","Silicon Oasis","JVC","Sports City","Palm Jumeirah","Al Nahda","Discovery Gardens"];

const services = [
  {id:"ac",icon:"❄",label:"AC service",sub:"Cleaning & repair",price:"from AED 149"},
  {id:"plumb",icon:"🔧",label:"Plumbing",sub:"Leaks, fixtures",price:"from AED 120"},
  {id:"elec",icon:"⚡",label:"Electrical",sub:"Wiring, breakers",price:"from AED 130"},
  {id:"clean",icon:"✨",label:"Deep cleaning",sub:"Full home",price:"from AED 250"},
  {id:"move",icon:"📦",label:"Moving",sub:"Packing & transport",price:"from AED 500"},
  {id:"paint",icon:"🖌",label:"Painting",sub:"Rooms & villa",price:"from AED 199"},
  {id:"carp",icon:"🪚",label:"Carpentry",sub:"Assembly & repair",price:"from AED 110"},
  {id:"pest",icon:"🛡",label:"Pest control",sub:"All pests",price:"from AED 180"},
];

const timeSlots = ["8:00 AM","10:00 AM","12:00 PM","2:00 PM","4:00 PM","6:00 PM"];
const avatarColors = ["#C9A84C","#5DA5A5","#A55D5D","#5D7AA5","#8A5DA5","#5DA57A","#A5845D"];
const aColor = name => avatarColors[(name||"A").charCodeAt(0) % avatarColors.length];
const initials = name => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const starsStr = r => "★".repeat(Math.floor(r||0))+(r%1>=0.5?"½":"")+"☆".repeat(5-Math.floor(r||0)-(r%1>=0.5?1:0));

const S = {
  wrap:{fontFamily:"'Georgia','Times New Roman',serif",background:C.cream,width:"100%",maxWidth:420,minHeight:"100vh",margin:"0 auto",display:"flex",flexDirection:"column"},
  hdr:{background:C.ink,padding:"14px 20px 12px",display:"flex",alignItems:"center",justifyContent:"space-between"},
  body:{flex:1,overflowY:"auto",paddingBottom:72},
  navWrap:{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:420,background:C.ink,display:"flex",borderTop:"1px solid #333"},
  navB:(a)=>({flex:1,padding:"10px 4px 8px",background:"none",border:"none",cursor:"pointer",color:a?C.gold:C.muted,fontSize:10,fontFamily:"sans-serif",display:"flex",flexDirection:"column",alignItems:"center",gap:3}),
  card:{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:10,padding:"12px 14px",marginBottom:9,cursor:"pointer"},
  goldBtn:{background:C.gold,color:C.ink,border:"none",borderRadius:9,padding:"13px",fontFamily:"sans-serif",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"},
  outBtn:{background:"none",color:C.gold,border:`1.5px solid ${C.gold}`,borderRadius:9,padding:"12px",fontFamily:"sans-serif",fontWeight:600,fontSize:13,cursor:"pointer",width:"100%"},
  back:{background:"none",border:"none",cursor:"pointer",color:C.goldLight,fontSize:20,padding:0},
  h2:{fontSize:11,fontFamily:"sans-serif",letterSpacing:"0.12em",color:C.muted,textTransform:"uppercase",margin:"0 0 10px",fontWeight:500},
  input:{width:"100%",border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"11px 12px",fontFamily:"sans-serif",fontSize:13,color:C.ink,background:"#fff",boxSizing:"border-box",outline:"none"},
  label:{display:"block",fontFamily:"sans-serif",fontSize:11,color:C.muted,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:6},
  avt:(nm)=>({width:42,height:42,borderRadius:"50%",background:aColor(nm||"A"),display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"sans-serif",fontWeight:700,fontSize:12,color:C.ink,flexShrink:0}),
};

// ── User stored in localStorage for MVP ──────────────────────
const getStoredUser = () => { try { return JSON.parse(localStorage.getItem("wasta_user")); } catch { return null; } };
const storeUser = (u) => localStorage.setItem("wasta_user", JSON.stringify(u));
const clearUser = () => localStorage.removeItem("wasta_user");

// ── Login / Register Screen ───────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login"); // login | register
  const [form, setForm] = useState({ fullName:"", phone:"", email:"", area:"", building:"", flatNo:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleLogin = async () => {
    if(!form.phone.trim()) { setError("Enter your phone number"); return; }
    setLoading(true); setError(null);
    const { data } = await supabase.from("users").select("*").eq("phone", form.phone.trim()).maybeSingle();
    if(!data) { setError("Phone not registered. Please sign up first."); setLoading(false); return; }
    storeUser(data);
    onAuth(data);
    setLoading(false);
  };

  const handleRegister = async () => {
    if(!form.fullName.trim()) { setError("Enter your full name"); return; }
    if(!form.phone.trim()) { setError("Enter your phone number"); return; }
    if(!form.area) { setError("Select your area"); return; }
    setLoading(true); setError(null);
    // Check duplicate
    const { data: existing } = await supabase.from("users").select("id").eq("phone", form.phone.trim()).maybeSingle();
    if(existing) { setError("Phone already registered. Please log in."); setLoading(false); return; }
    const { data, error: err } = await supabase.from("users").insert([{
      full_name: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim()||null,
      area: form.area,
      building: form.building.trim()||null,
      flat_no: form.flatNo.trim()||null,
    }]).select().single();
    if(err) { setError(err.message); setLoading(false); return; }
    storeUser(data);
    onAuth(data);
    setLoading(false);
  };

  return (
    <div style={{...S.wrap,justifyContent:"center"}}>
      <div style={{padding:"32px 24px"}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{color:C.gold,fontSize:28,fontWeight:700,letterSpacing:"0.06em",marginBottom:4}}>WASTA</div>
          <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted}}>واسطة · Dubai's trusted service marketplace</div>
        </div>

        <div style={{display:"flex",background:C.sand,borderRadius:10,padding:4,marginBottom:24}}>
          {[["login","Sign in"],["register","Create account"]].map(([m,lbl])=>(
            <button key={m} onClick={()=>{setMode(m);setError(null);}} style={{flex:1,padding:"9px",border:"none",borderRadius:8,background:mode===m?"#fff":"none",color:mode===m?C.ink:C.muted,fontFamily:"sans-serif",fontSize:13,fontWeight:mode===m?700:400,cursor:"pointer",boxShadow:mode===m?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>
              {lbl}
            </button>
          ))}
        </div>

        {error && <div style={{background:C.redBg,color:C.red,fontFamily:"sans-serif",fontSize:12,padding:"10px 14px",borderRadius:8,marginBottom:16}}>{error}</div>}

        {mode === "login" ? (
          <div>
            <div style={{marginBottom:16}}>
              <label style={S.label}>WhatsApp / phone number</label>
              <input style={S.input} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000"/>
            </div>
            <button style={{...S.goldBtn,opacity:loading?0.6:1}} disabled={loading} onClick={handleLogin}>
              {loading?"Signing in…":"Sign in →"}
            </button>
            <div style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:12,color:C.muted}}>
              Don't have an account? <span style={{color:C.gold,cursor:"pointer",fontWeight:700}} onClick={()=>setMode("register")}>Sign up</span>
            </div>
          </div>
        ) : (
          <div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Full name *</label>
              <input style={S.input} value={form.fullName} onChange={e=>set("fullName",e.target.value)} placeholder="e.g. Ahmed Al-Mansoori"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>WhatsApp / phone *</label>
              <input style={S.input} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+971 50 000 0000"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Email (optional)</label>
              <input style={S.input} value={form.email} onChange={e=>set("email",e.target.value)} placeholder="you@email.com" type="email"/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={S.label}>Area *</label>
              <select style={{...S.input,color:form.area?C.ink:C.muted}} value={form.area} onChange={e=>set("area",e.target.value)}>
                <option value="">Select your area…</option>
                {AREAS.map(a=><option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <div style={{flex:1}}>
                <label style={S.label}>Building (optional)</label>
                <input style={S.input} value={form.building} onChange={e=>set("building",e.target.value)} placeholder="Building name"/>
              </div>
              <div style={{flex:1}}>
                <label style={S.label}>Flat no. (optional)</label>
                <input style={S.input} value={form.flatNo} onChange={e=>set("flatNo",e.target.value)} placeholder="e.g. 204"/>
              </div>
            </div>
            <button style={{...S.goldBtn,opacity:loading?0.6:1}} disabled={loading} onClick={handleRegister}>
              {loading?"Creating account…":"Create account →"}
            </button>
            <div style={{textAlign:"center",marginTop:14,fontFamily:"sans-serif",fontSize:12,color:C.muted}}>
              Already registered? <span style={{color:C.gold,cursor:"pointer",fontWeight:700}} onClick={()=>setMode("login")}>Sign in</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Profile Screen ────────────────────────────────────────────
function ProfileScreen({ user, onLogout }) {
  return (
    <div style={{padding:"20px 18px"}}>
      <div style={{...S.card,cursor:"default",display:"flex",gap:14,alignItems:"center",marginBottom:16}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:aColor(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.ink,flexShrink:0}}>
          {initials(user.full_name)}
        </div>
        <div>
          <div style={{fontWeight:700,fontSize:16,color:C.ink}}>{user.full_name}</div>
          <div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{user.phone}</div>
          {user.email&&<div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{user.email}</div>}
        </div>
      </div>

      <div style={S.h2}>Address</div>
      <div style={{...S.card,cursor:"default"}}>
        {[["Area",user.area||"—"],["Building",user.building||"—"],["Flat",user.flat_no||"—"]].map(([k,v])=>(
          <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`0.5px solid ${C.sand}`}}>
            <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
            <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600}}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{marginTop:16}}>
        <button style={{...S.outBtn,color:C.red,borderColor:C.red}} onClick={onLogout}>Sign out</button>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function WastaApp() {
  const [user, setUser] = useState(getStoredUser());
  const [screen, setScreen] = useState("home");
  const [selectedService, setSelectedService] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState("");
  const [myBookings, setMyBookings] = useState([]);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("home");

  if(!user) return <AuthScreen onAuth={u=>setUser(u)} />;

  const svc = services.find(s=>s.id===selectedService);

  useEffect(() => {
    if(!selectedService) return;
    const svcLabel = services.find(s=>s.id===selectedService)?.label;
    if(!svcLabel) return;
    setLoading(true); setError(null);
    supabase.from("providers").select("*").eq("verified",true).eq("status","approved").contains("services",[svcLabel]).order("rating",{ascending:false})
      .then(({data,error})=>{ if(error) setError(error.message); else setProviders(data||[]); setLoading(false); });
  }, [selectedService]);

  useEffect(() => {
    if(tab!=="bookings"||!user) return;
    supabase.from("bookings").select("*, providers(first_name,last_name)").eq("customer_phone",user.phone).order("created_at",{ascending:false})
      .then(({data})=>setMyBookings(data||[]));
  }, [tab]);

  const confirmBooking = async () => {
    if(!selectedProvider||!selectedSlot) return;
    setLoading(true); setError(null);
    const [time,ampm]=selectedSlot.split(" ");
    const [h,m]=time.split(":");
    let hour=parseInt(h);
    if(ampm==="PM"&&hour!==12) hour+=12;
    if(ampm==="AM"&&hour===12) hour=0;
    const slot=new Date(); slot.setHours(hour,parseInt(m),0,0);

    const {data,error:err}=await supabase.from("bookings").insert([{
      customer_name: user.full_name,
      customer_phone: user.phone,
      customer_email: user.email,
      customer_area: user.area,
      service: svc?.label,
      provider_id: selectedProvider.id,
      slot_time: slot.toISOString(),
      amount: selectedProvider.rate||149,
      notes,
      status:"pending",
    }]).select().single();

    if(err){ setError(err.message); setLoading(false); return; }
    setConfirmedBooking({ref:data.ref,service:svc?.label,pro:`${selectedProvider.first_name} ${selectedProvider.last_name}`,time:selectedSlot,price:`AED ${selectedProvider.rate||149}`,status:"pending"});
    setLoading(false);
    setScreen("confirmed");
  };

  const reset = () => { setScreen("home");setSelectedService(null);setSelectedProvider(null);setSelectedSlot(null);setNotes("");setConfirmedBooking(null);setProviders([]);setTab("home");setError(null); };
  const logout = () => { clearUser(); setUser(null); reset(); };

  const Hdr = ({title,back}) => (
    <div style={S.hdr}>
      {back?<button style={S.back} onClick={back}>←</button>:<div style={{width:22}}/>}
      <div style={{textAlign:"center"}}>
        {title
          ?<div style={{color:C.gold,fontSize:15,fontWeight:700,letterSpacing:"0.04em"}}>{title}</div>
          :<><div style={{color:C.gold,fontSize:19,fontWeight:700,letterSpacing:"0.06em"}}>WASTA</div>
            <div style={{color:"#8B6914",fontSize:9,letterSpacing:"0.12em",fontFamily:"sans-serif"}}>واسطة · Dubai</div></>}
      </div>
      <div style={{width:22}}/>
    </div>
  );

  const Nav = () => (
    <nav style={S.navWrap}>
      {[["🏠","Home","home"],["📋","Bookings","bookings"],["👤","Profile","profile"]].map(([ico,lbl,t])=>(
        <button key={t} style={S.navB(tab===t)} onClick={()=>{setTab(t);if(t==="home")reset();}}>
          <span style={{fontSize:18}}>{ico}</span><span>{lbl}</span>
        </button>
      ))}
    </nav>
  );

  const ErrorBanner = () => error?<div style={{background:C.redBg,color:C.red,fontFamily:"sans-serif",fontSize:12,padding:"8px 14px",margin:"0 18px 10px",borderRadius:8}}>{error}</div>:null;

  // Profile tab
  if(tab==="profile") return (
    <div style={S.wrap}>
      <Hdr title="My profile"/>
      <div style={S.body}><ProfileScreen user={user} onLogout={logout}/></div>
      <Nav/>
    </div>
  );

  // Bookings tab
  if(tab==="bookings") return (
    <div style={S.wrap}>
      <Hdr title="My bookings"/>
      <div style={S.body}>
        <div style={{padding:"16px 18px 0"}}>
          {myBookings.length===0
            ?<div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,padding:"20px 0",textAlign:"center"}}>No bookings yet — book your first service!</div>
            :myBookings.map(b=>(
              <div key={b.id} style={{...S.card,cursor:"default"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,color:C.ink,marginBottom:2}}>{b.service}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted}}>{b.providers?`${b.providers.first_name} ${b.providers.last_name}`:"—"}</div>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,marginTop:2}}>{b.ref}</div>
                  </div>
                  <div style={{fontFamily:"sans-serif",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,
                    background:b.status==="confirmed"?"#D8F3DC":b.status==="completed"?"#EDE8DF":b.status==="cancelled"?"#FDECEA":"#FDF0D5",
                    color:b.status==="confirmed"?"#2D6A4F":b.status==="completed"?"#7A7166":b.status==="cancelled"?"#A33C2D":"#8B5E14"}}>
                    {b.status}
                  </div>
                </div>
                <div style={{marginTop:6,fontFamily:"sans-serif",fontSize:11,color:C.gold,fontWeight:700}}>AED {b.amount}</div>
              </div>
            ))
          }
        </div>
      </div>
      <Nav/>
    </div>
  );

  if(screen==="home") return (
    <div style={S.wrap}>
      <Hdr/>
      <div style={S.body}>
        <div style={{background:C.ink,padding:"0 20px 20px"}}>
          <div style={{color:"#7A7166",fontFamily:"sans-serif",fontSize:12,marginBottom:3}}>Good morning, {user.full_name.split(" ")[0]}</div>
          <div style={{color:"#fff",fontSize:20,fontWeight:700,marginBottom:14}}>What do you need today?</div>
          <div style={{display:"flex",alignItems:"center",gap:9,background:"#2a2520",borderRadius:9,padding:"9px 13px"}}>
            <span style={{fontSize:15}}>🔍</span>
            <span style={{color:C.muted,fontFamily:"sans-serif",fontSize:13}}>Search services…</span>
          </div>
        </div>
        <div style={{padding:"18px 18px 0"}}>
          <div style={S.h2}>Services</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9}}>
            {services.map(s=>(
              <div key={s.id} style={{...S.card,display:"flex",flexDirection:"column",gap:5}}
                onClick={()=>{setSelectedService(s.id);setScreen("providers");}}>
                <div style={{fontSize:26}}>{s.icon}</div>
                <div style={{fontWeight:700,fontSize:14,color:C.ink}}>{s.label}</div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted}}>{s.sub}</div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:C.gold,fontWeight:700}}>{s.price}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Nav/>
    </div>
  );

  if(screen==="providers") return (
    <div style={S.wrap}>
      <Hdr title={svc?.label} back={()=>setScreen("home")}/>
      <div style={S.body}>
        <div style={{background:C.ink,padding:"10px 18px 14px"}}>
          <div style={{color:"#7A7166",fontFamily:"sans-serif",fontSize:11}}>All providers are Emirates ID verified & trade licensed</div>
        </div>
        <div style={{padding:"14px 18px 0"}}>
          <ErrorBanner/>
          {loading
            ?<div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,padding:20,textAlign:"center"}}>Loading providers…</div>
            :providers.length===0
              ?<div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,padding:20,textAlign:"center"}}>No verified providers available yet for this service.</div>
              :providers.map(p=>(
                <div key={p.id} style={{...S.card,border:selectedProvider?.id===p.id?`2px solid ${C.gold}`:`1px solid ${C.sandDark}`}}
                  onClick={()=>setSelectedProvider(p)}>
                  <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
                    <div style={S.avt(p.first_name)}>{initials(`${p.first_name} ${p.last_name}`)}</div>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap",marginBottom:1}}>
                        <span style={{fontWeight:700,fontSize:14,color:C.ink}}>{p.first_name} {p.last_name}</span>
                        {(p.rating||0)>=4.8&&<span style={{background:C.goldLight,color:C.goldDark,fontSize:9,fontFamily:"sans-serif",fontWeight:700,padding:"1px 7px",borderRadius:20}}>Top rated</span>}
                      </div>
                      <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,marginBottom:3}}>{p.experience} · {p.area}</div>
                      <div style={{display:"flex",gap:7,alignItems:"center"}}>
                        {p.verified&&<span style={{background:"#D8F3DC",color:"#2D6A4F",fontSize:9,fontFamily:"sans-serif",fontWeight:700,padding:"2px 7px",borderRadius:20}}>✓ Verified</span>}
                        <span style={{fontFamily:"sans-serif",fontSize:10,color:C.muted}}>{starsStr(p.rating||0)} ({p.review_count||0})</span>
                      </div>
                    </div>
                    <div style={{textAlign:"right",flexShrink:0}}>
                      <div style={{fontFamily:"sans-serif",fontWeight:700,color:C.gold,fontSize:13}}>AED {p.rate}</div>
                    </div>
                  </div>
                </div>
              ))
          }
          <button style={{...S.goldBtn,opacity:selectedProvider?1:0.4,marginTop:4}} disabled={!selectedProvider} onClick={()=>setScreen("schedule")}>
            Continue →
          </button>
        </div>
      </div>
    </div>
  );

  if(screen==="schedule") return (
    <div style={S.wrap}>
      <Hdr title="Schedule" back={()=>setScreen("providers")}/>
      <div style={S.body}>
        <div style={{padding:"14px 18px 0"}}>
          <div style={{...S.card,display:"flex",gap:10,alignItems:"center",cursor:"default"}}>
            <div style={S.avt(selectedProvider.first_name)}>{initials(`${selectedProvider.first_name} ${selectedProvider.last_name}`)}</div>
            <div>
              <div style={{fontWeight:700,color:C.ink}}>{selectedProvider.first_name} {selectedProvider.last_name}</div>
              <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted}}>{selectedProvider.area}</div>
            </div>
          </div>
          <div style={{...S.h2,marginTop:14}}>Pick a time slot</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:16}}>
            {timeSlots.map(t=>(
              <button key={t} onClick={()=>setSelectedSlot(t)}
                style={{padding:"9px 8px",borderRadius:7,border:`1.5px solid ${selectedSlot===t?C.gold:C.sandDark}`,background:selectedSlot===t?C.gold:"#fff",color:selectedSlot===t?C.ink:C.muted,fontFamily:"sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                {t}
              </button>
            ))}
          </div>
          <div style={{...S.h2,marginTop:4}}>Notes for the pro</div>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="E.g. AC unit is on the roof, bring ladder…"
            style={{width:"100%",border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"9px 11px",fontFamily:"sans-serif",fontSize:12,color:C.ink,background:"#fff",resize:"vertical",minHeight:70,boxSizing:"border-box",marginBottom:14}}/>
          <button style={{...S.goldBtn,opacity:selectedSlot?1:0.4}} disabled={!selectedSlot} onClick={()=>setScreen("review")}>
            Review booking →
          </button>
        </div>
      </div>
    </div>
  );

  if(screen==="review") return (
    <div style={S.wrap}>
      <Hdr title="Review & confirm" back={()=>setScreen("schedule")}/>
      <div style={S.body}>
        <div style={{padding:"14px 18px 0"}}>
          <ErrorBanner/>
          <div style={{...S.card,cursor:"default"}}>
            <div style={S.h2}>Booking summary</div>
            {[["Service",svc?.label],["Provider",`${selectedProvider?.first_name} ${selectedProvider?.last_name}`],["Time slot",selectedSlot],["Your area",user.area]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`0.5px solid ${C.sand}`}}>
                <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
                <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600}}>{v}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0"}}>
              <span style={{fontFamily:"sans-serif",fontSize:14,fontWeight:700,color:C.ink}}>Total</span>
              <span style={{fontFamily:"sans-serif",fontSize:17,fontWeight:700,color:C.gold}}>AED {selectedProvider?.rate}</span>
            </div>
          </div>
          <div style={{...S.card,cursor:"default",marginTop:8}}>
            <div style={S.h2}>Booking for</div>
            <div style={{fontFamily:"sans-serif",fontSize:13,color:C.ink,fontWeight:600}}>{user.full_name}</div>
            <div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{user.phone}</div>
          </div>
          <div style={{marginTop:14}}>
            <button style={{...S.goldBtn,opacity:loading?0.6:1}} disabled={loading} onClick={confirmBooking}>
              {loading?"Confirming…":"Confirm booking"}
            </button>
          </div>
          <div style={{marginTop:9}}><button style={S.outBtn} onClick={reset}>Cancel</button></div>
        </div>
      </div>
    </div>
  );

  if(screen==="confirmed") return (
    <div style={S.wrap}>
      <Hdr/>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"40px 22px"}}>
        <div style={{width:66,height:66,borderRadius:"50%",background:C.greenBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:32,marginBottom:18}}>✓</div>
        <div style={{fontSize:22,fontWeight:700,color:C.ink,marginBottom:5,textAlign:"center"}}>Booking confirmed!</div>
        <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted,textAlign:"center",marginBottom:24}}>Saved to your Wasta account. You'll be contacted shortly.</div>
        <div style={{...S.card,width:"100%",boxSizing:"border-box",cursor:"default"}}>
          {[["Reference",confirmedBooking?.ref],["Service",confirmedBooking?.service],["Pro",confirmedBooking?.pro],["Slot",confirmedBooking?.time],["Amount",confirmedBooking?.price]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`0.5px solid ${C.sand}`}}>
              <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
              <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600}}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{width:"100%",marginTop:22}}>
          <button style={S.goldBtn} onClick={reset}>Book another service</button>
        </div>
      </div>
    </div>
  );

  return null;
}
