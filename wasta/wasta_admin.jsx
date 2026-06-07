import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const C = {
  gold:"#C9A84C",goldLight:"#F5E6B8",goldDark:"#8B6914",ink:"#1A1612",
  cream:"#FAF7F2",sand:"#EDE8DF",sandDark:"#D4CCBC",muted:"#7A7166",
  green:"#2D6A4F",greenBg:"#D8F3DC",red:"#A33C2D",redBg:"#FDECEA",
  blue:"#1A4F8B",blueBg:"#E1ECFB",amber:"#8B5E14",amberBg:"#FDF0D5",ink2:"#2C2420",
};

const STATUS = {
  pending:{label:"Pending",bg:"#FDF0D5",color:"#8B5E14",dot:"#D4900A"},
  confirmed:{label:"Confirmed",bg:"#E1ECFB",color:"#1A4F8B",dot:"#2563EB"},
  in_progress:{label:"In progress",bg:"#EEE8FD",color:"#5B3DB5",dot:"#7C5CF0"},
  completed:{label:"Completed",bg:"#D8F3DC",color:"#2D6A4F",dot:"#16A34A"},
  cancelled:{label:"Cancelled",bg:"#FDECEA",color:"#A33C2D",dot:"#DC2626"},
};

const TRANSITIONS = {
  pending:["confirmed","cancelled"],confirmed:["in_progress","cancelled"],
  in_progress:["completed"],completed:[],cancelled:[],
};

const fmtDate = d => new Date(d).toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"});
const fmtTime = d => new Date(d).toLocaleTimeString("en-AE",{hour:"2-digit",minute:"2-digit"});
const avatarColors = ["#C9A84C","#5DA5A5","#A55D5D","#5D7AA5","#8A5DA5","#5DA57A","#A5845D"];
const aColor = n => avatarColors[(n||"A").charCodeAt(0) % avatarColors.length];
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

export default function WastaAdmin() {
  const [bookings, setBookings] = useState([]);
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [docUrls, setDocUrls] = useState({});
  const [tab, setTab] = useState("bookings");

  useEffect(() => {
    fetchAll();
    const channel = supabase.channel("admin-live")
      .on("postgres_changes",{event:"*",schema:"public",table:"bookings"},
        payload => {
          if(payload.eventType==="INSERT") setBookings(b=>[payload.new,...b]);
          if(payload.eventType==="UPDATE") setBookings(b=>b.map(x=>x.id===payload.new.id?{...x,...payload.new}:x));
        })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"providers"},
        payload=>setProviders(p=>[payload.new,...p]))
      .subscribe();
    return ()=>supabase.removeChannel(channel);
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [bRes, pRes] = await Promise.all([
      supabase.from("bookings").select("*, providers(first_name,last_name,phone)").order("created_at",{ascending:false}),
      supabase.from("providers").select("*, provider_docs(doc_type,file_path,uploaded_at)").order("created_at",{ascending:false}),
    ]);
    if(bRes.data) setBookings(bRes.data);
    if(pRes.data) setProviders(pRes.data);
    setLoading(false);
  };

  const updateBookingStatus = async (id, newStatus) => {
    const {data,error} = await supabase.from("bookings").update({status:newStatus}).eq("id",id).select().single();
    if(!error){
      setBookings(bs=>bs.map(b=>b.id===id?{...b,...data}:b));
      if(selectedBooking?.id===id) setSelectedBooking(s=>({...s,status:newStatus}));
    }
  };

  const updateProviderStatus = async (id, status, verified) => {
    await supabase.from("providers").update({status,verified}).eq("id",id);
    setProviders(ps=>ps.map(p=>p.id===id?{...p,status,verified}:p));
    if(selectedProvider?.id===id) setSelectedProvider(p=>({...p,status,verified}));
  };

  const openProvider = async (p) => {
    setSelectedProvider(p);
    setDocUrls({});
    if(p.provider_docs?.length) {
      const urls = {};
      for(const doc of p.provider_docs) {
        try {
          const {data} = await supabase.storage.from("wasta-docs").createSignedUrl(doc.file_path, 3600);
          if(data) urls[doc.doc_type] = data.signedUrl;
        } catch(e) { console.log("Doc URL error:", e); }
      }
      setDocUrls(urls);
    }
  };

  const stats = useMemo(()=>({
    total:bookings.length,
    pending:bookings.filter(b=>b.status==="pending").length,
    revenue:bookings.filter(b=>b.status==="completed").reduce((a,b)=>a+Number(b.amount),0),
    today:bookings.filter(b=>new Date(b.created_at).toDateString()===new Date().toDateString()).length,
    pendingProviders:providers.filter(p=>p.status==="pending").length,
  }),[bookings,providers]);

  const filtered = useMemo(()=>bookings.filter(b=>{
    const matchF=filter==="all"||b.status===filter;
    const matchS=!search||(b.ref||"").toLowerCase().includes(search.toLowerCase())||(b.customer_name||"").toLowerCase().includes(search.toLowerCase())||(b.service||"").toLowerCase().includes(search.toLowerCase());
    return matchF&&matchS;
  }),[bookings,filter,search]);

  const selB = selectedBooking ? bookings.find(b=>b.id===selectedBooking.id)||selectedBooking : null;
  const selP = selectedProvider ? providers.find(p=>p.id===selectedProvider.id)||selectedProvider : null;

  const S = {
    wrap:{fontFamily:"'Georgia','Times New Roman',serif",background:"#F5F3EF",minHeight:"100vh",display:"flex",flexDirection:"column"},
    topbar:{background:C.ink,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:52},
    body:{display:"flex",flex:1,minHeight:0},
    sidebar:{width:200,background:C.ink2,padding:"20px 0",flexShrink:0},
    main:{flex:1,padding:24,overflowY:"auto"},
    sideItem:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"10px 20px",cursor:"pointer",background:a?"rgba(201,168,76,0.15)":"none",borderLeft:a?`3px solid ${C.gold}`:"3px solid transparent",color:a?C.gold:C.muted,fontSize:13,fontFamily:"sans-serif",border:"none",width:"100%",textAlign:"left",boxSizing:"border-box"}),
    statCard:{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:10,padding:"16px 18px",flex:1},
    tblHead:{background:C.sand,padding:"10px 14px",fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",fontWeight:600,textAlign:"left",borderBottom:`1px solid ${C.sandDark}`},
    tblRow:(s)=>({background:s?"#FFF9EE":"#fff",borderBottom:`1px solid ${C.sandDark}`,cursor:"pointer"}),
    tblCell:{padding:"10px 14px",fontFamily:"sans-serif",fontSize:13,color:C.ink,verticalAlign:"middle"},
    badge:(s)=>({display:"inline-flex",alignItems:"center",gap:5,background:(STATUS[s]||STATUS.pending).bg,color:(STATUS[s]||STATUS.pending).color,fontSize:11,fontFamily:"sans-serif",fontWeight:700,padding:"3px 9px",borderRadius:20,whiteSpace:"nowrap"}),
    dot:(s)=>({width:6,height:6,borderRadius:"50%",background:(STATUS[s]||STATUS.pending).dot,flexShrink:0}),
    panel:{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:12,padding:"20px"},
    actionBtn:(c,bg)=>({background:bg||C.gold,color:c||C.ink,border:"none",borderRadius:7,padding:"7px 14px",fontFamily:"sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}),
    input:{border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"8px 12px",fontFamily:"sans-serif",fontSize:13,color:C.ink,background:"#fff",outline:"none"},
    chip:{display:"inline-block",background:C.goldLight,color:C.goldDark,fontSize:11,fontFamily:"sans-serif",fontWeight:600,padding:"3px 10px",borderRadius:20,margin:"3px 3px 3px 0"},
    sectionTitle:{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.12em",color:C.muted,textTransform:"uppercase",margin:"16px 0 8px",fontWeight:600},
    reviewRow:{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`0.5px solid ${C.sand}`},
  };

  const NotifBadge = ({count}) => count>0
    ? <span style={{background:C.red,color:"#fff",fontSize:9,fontFamily:"sans-serif",fontWeight:700,borderRadius:20,padding:"1px 6px",marginLeft:6}}>{count}</span>
    : null;

  // ── Provider detail slide-in panel ─────────────────────────
  const ProviderModal = () => {
    if(!selP) return null;
    const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const slots = ["8am–12pm","12pm–4pm","4pm–8pm"];
    const avail = selP.availability || {};
    const hasAvail = Object.values(avail).some(s=>s?.length>0);

    return (
      <div style={{position:"fixed",top:0,left:0,right:0,bottom:0,background:"rgba(0,0,0,0.5)",zIndex:100,display:"flex",alignItems:"flex-start",justifyContent:"flex-end"}}
        onClick={()=>setSelectedProvider(null)}>
        <div style={{background:"#fff",width:500,height:"100vh",display:"flex",flexDirection:"column",boxShadow:"-4px 0 24px rgba(0,0,0,0.15)"}}
          onClick={e=>e.stopPropagation()}>

          {/* Scrollable content */}
          <div style={{flex:1,overflowY:"auto",padding:"24px"}}>

            {/* Header */}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
              <div style={{display:"flex",gap:14,alignItems:"center"}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:aColor(selP.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.ink,flexShrink:0}}>
                  {selP.photo_url
                    ? <img src={selP.photo_url} alt="" style={{width:52,height:52,borderRadius:"50%",objectFit:"cover"}}/>
                    : initials(`${selP.first_name} ${selP.last_name}`)}
                </div>
                <div>
                  <div style={{fontWeight:700,fontSize:20,color:C.ink}}>{selP.first_name} {selP.last_name}</div>
                  <div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted,marginBottom:4}}>{selP.phone} · {selP.email}</div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:4,background:selP.verified?C.greenBg:selP.status==="rejected"?C.redBg:C.amberBg,color:selP.verified?C.green:selP.status==="rejected"?C.red:C.amber,fontSize:11,fontFamily:"sans-serif",fontWeight:700,padding:"2px 9px",borderRadius:20}}>
                    {selP.verified?"✓ Verified":selP.status==="rejected"?"✗ Rejected":"⏳ Pending review"}
                  </span>
                </div>
              </div>
              <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:22,lineHeight:1,flexShrink:0}} onClick={()=>setSelectedProvider(null)}>✕</button>
            </div>

            {/* Personal info */}
            <div style={S.sectionTitle}>Personal info</div>
            <div style={{background:C.cream,borderRadius:10,padding:"12px 16px",marginBottom:4}}>
              {[["Nationality",selP.nationality||"—"],["Primary area",selP.area],["Other areas",(selP.other_areas||[]).join(", ")||"—"],["Applied",fmtDate(selP.created_at)]].map(([k,v])=>(
                <div key={k} style={S.reviewRow}>
                  <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
                  <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                </div>
              ))}
              {selP.bio&&<div style={{marginTop:8,fontFamily:"sans-serif",fontSize:12,color:C.muted,fontStyle:"italic"}}>"{selP.bio}"</div>}
            </div>

            {/* Services */}
            <div style={S.sectionTitle}>Services offered</div>
            <div style={{marginBottom:4}}>
              {(selP.services||[]).map(s=><span key={s} style={S.chip}>{s}</span>)}
            </div>

            {/* Trade details */}
            <div style={S.sectionTitle}>Trade details</div>
            <div style={{background:C.cream,borderRadius:10,padding:"12px 16px",marginBottom:4}}>
              {[["Experience",selP.experience||"—"],["Rate",`AED ${selP.rate}/call`],["Insurance",selP.insurance?"Yes ✓":"No"],["Emirates ID",selP.emirates_id||"—"],["Trade License",selP.trade_license||"—"]].map(([k,v])=>(
                <div key={k} style={S.reviewRow}>
                  <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
                  <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                </div>
              ))}
            </div>

            {/* Availability grid */}
            <div style={S.sectionTitle}>Availability</div>
            {hasAvail ? (
              <div style={{background:C.cream,borderRadius:10,padding:"12px 16px",marginBottom:4,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr>
                      <th style={{width:40}}/>
                      {slots.map(s=><th key={s} style={{fontFamily:"sans-serif",fontSize:10,color:C.muted,fontWeight:600,padding:"4px 6px",textAlign:"center"}}>{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {days.map(day=>(
                      <tr key={day}>
                        <td style={{fontFamily:"sans-serif",fontSize:11,color:C.ink,fontWeight:600,paddingRight:8}}>{day}</td>
                        {slots.map(slot=>{
                          const active=(avail[day]||[]).includes(slot);
                          return <td key={slot} style={{padding:"3px 4px",textAlign:"center"}}>
                            <div style={{padding:"5px",borderRadius:5,background:active?C.goldLight:"#fff",border:`1px solid ${active?C.gold:C.sandDark}`,fontSize:10,fontFamily:"sans-serif",color:active?C.goldDark:C.sandDark,textAlign:"center"}}>
                              {active?"✓":"—"}
                            </div>
                          </td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted,marginBottom:4}}>No availability set</div>}

            {/* Documents */}
            <div style={S.sectionTitle}>Documents</div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:8}}>
              {(selP.provider_docs||[]).length===0
                ? <div style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>No documents uploaded</div>
                : (selP.provider_docs||[]).map(doc=>(
                  <div key={doc.doc_type} style={{background:C.cream,border:`1px solid ${C.sandDark}`,borderRadius:8,padding:"10px 14px",fontSize:12,fontFamily:"sans-serif",minWidth:120}}>
                    <div style={{color:C.muted,marginBottom:4,textTransform:"capitalize"}}>{doc.doc_type.replace(/_/g," ")}</div>
                    {docUrls[doc.doc_type]
                      ? <a href={docUrls[doc.doc_type]} target="_blank" rel="noreferrer" style={{color:C.blue,fontWeight:700,textDecoration:"none"}}>View document ↗</a>
                      : <span style={{color:C.sandDark}}>Loading…</span>}
                  </div>
                ))
              }
            </div>

          </div>

          {/* Sticky footer — always visible */}
          <div style={{padding:"16px 24px",borderTop:`1px solid ${C.sandDark}`,background:"#fff",flexShrink:0}}>
            {!selP.verified && selP.status!=="rejected" && (
              <div style={{display:"flex",gap:10}}>
                <button style={{...S.actionBtn("#fff",C.green),flex:1,padding:"13px",fontSize:14,borderRadius:9}}
                  onClick={()=>updateProviderStatus(selP.id,"approved",true)}>
                  ✓ Approve provider
                </button>
                <button style={{...S.actionBtn("#fff",C.red),flex:1,padding:"13px",fontSize:14,borderRadius:9}}
                  onClick={()=>updateProviderStatus(selP.id,"rejected",false)}>
                  ✗ Reject
                </button>
              </div>
            )}
            {selP.verified && (
              <div style={{background:C.greenBg,color:C.green,fontFamily:"sans-serif",fontSize:13,fontWeight:700,padding:"13px",borderRadius:9,textAlign:"center"}}>
                ✓ Approved and live on Wasta
              </div>
            )}
            {selP.status==="rejected" && (
              <div style={{background:C.redBg,color:C.red,fontFamily:"sans-serif",fontSize:13,fontWeight:700,padding:"13px",borderRadius:9,textAlign:"center"}}>
                ✗ Provider has been rejected
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div style={S.wrap}>
      <div style={S.topbar}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{color:C.gold,fontSize:17,fontWeight:700,letterSpacing:"0.06em"}}>WASTA</div>
          <div style={{color:"#555",fontSize:12,fontFamily:"sans-serif"}}>/ Admin Dashboard</div>
          {loading&&<div style={{color:C.muted,fontSize:11,fontFamily:"sans-serif"}}>Loading…</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:"50%",background:C.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:C.ink}}>AD</div>
          <span style={{color:"#7A7166",fontFamily:"sans-serif",fontSize:12}}>Admin</span>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.sidebar}>
          {[["📋","Bookings","bookings",stats.pending],["👷","Providers","providers",stats.pendingProviders],["📊","Analytics","analytics",0]].map(([ico,lbl,t,badge])=>(
            <button key={t} style={S.sideItem(tab===t)} onClick={()=>setTab(t)}>
              <span>{ico}</span><span>{lbl}</span><NotifBadge count={badge}/>
            </button>
          ))}
        </div>

        <div style={S.main}>
          {/* Stats strip */}
          <div style={{display:"flex",gap:14,marginBottom:22}}>
            {[{label:"Total bookings",val:stats.total,sub:"all time"},{label:"Pending",val:stats.pending,sub:"need action",urgent:stats.pending>0},{label:"Today",val:stats.today,sub:new Date().toLocaleDateString("en-AE",{month:"short",day:"numeric"})},{label:"Revenue",val:"AED "+stats.revenue.toLocaleString(),sub:"completed"}].map(({label,val,sub,urgent})=>(
              <div key={label} style={{...S.statCard,border:urgent?`1.5px solid ${C.gold}`:`1px solid ${C.sandDark}`}}>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:4}}>{label}</div>
                <div style={{fontSize:22,fontWeight:700,color:urgent?C.gold:C.ink,marginBottom:2}}>{val}</div>
                <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted}}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Bookings tab */}
          {tab==="bookings"&&(
            <div style={{display:"flex",gap:18}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",gap:12,marginBottom:16}}>
                  <input style={{...S.input,flex:1}} placeholder="Search by ref, customer, service…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  <select style={S.input} value={filter} onChange={e=>setFilter(e.target.value)}>
                    <option value="all">All ({bookings.length})</option>
                    {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label} ({bookings.filter(b=>b.status===k).length})</option>)}
                  </select>
                </div>
                <div style={{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:10,overflow:"hidden"}}>
                  <table style={{width:"100%",borderCollapse:"collapse"}}>
                    <thead><tr>{["Ref","Customer","Service","Slot","Amount","Status","Actions"].map(h=><th key={h} style={S.tblHead}>{h}</th>)}</tr></thead>
                    <tbody>
                      {filtered.length===0
                        ? <tr><td colSpan={7} style={{...S.tblCell,textAlign:"center",color:C.muted,padding:32}}>No bookings found</td></tr>
                        : filtered.map(b=>(
                          <tr key={b.id} style={S.tblRow(selB?.id===b.id)} onClick={()=>setSelectedBooking(b)}>
                            <td style={{...S.tblCell,fontWeight:700,color:C.goldDark}}>{b.ref||"—"}</td>
                            <td style={S.tblCell}>
                              <div style={{display:"flex",alignItems:"center",gap:8}}>
                                <div style={{width:30,height:30,borderRadius:"50%",background:aColor(b.customer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:C.ink,flexShrink:0}}>{initials(b.customer_name)}</div>
                                <div><div style={{fontSize:13}}>{b.customer_name}</div><div style={{fontSize:11,color:C.muted}}>{b.customer_area}</div></div>
                              </div>
                            </td>
                            <td style={S.tblCell}>{b.service}</td>
                            <td style={{...S.tblCell,color:C.muted,whiteSpace:"nowrap"}}>{b.slot_time?fmtDate(b.slot_time)+" "+fmtTime(b.slot_time):"—"}</td>
                            <td style={{...S.tblCell,fontWeight:700,color:C.gold}}>AED {b.amount}</td>
                            <td style={S.tblCell}><div style={S.badge(b.status)}><div style={S.dot(b.status)}/>{(STATUS[b.status]||STATUS.pending).label}</div></td>
                            <td style={S.tblCell}>
                              <div style={{display:"flex",gap:5}}>
                                {(TRANSITIONS[b.status]||[]).map(ns=>(
                                  <button key={ns} style={{...S.actionBtn(ns==="cancelled"?"#fff":C.ink,ns==="cancelled"?C.red:ns==="completed"?C.green:C.gold),fontSize:10,padding:"5px 10px"}}
                                    onClick={e=>{e.stopPropagation();updateBookingStatus(b.id,ns);}}>
                                    {ns==="cancelled"?"Cancel":ns==="confirmed"?"Confirm":ns==="in_progress"?"Start":"Complete"}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Booking detail panel */}
              <div style={{width:270,flexShrink:0}}>
                {selB?(
                  <div style={S.panel}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
                      <div><div style={{fontWeight:700,fontSize:17,color:C.ink,marginBottom:4}}>{selB.ref}</div><div style={S.badge(selB.status)}><div style={S.dot(selB.status)}/>{(STATUS[selB.status]||STATUS.pending).label}</div></div>
                      <button style={{background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:18}} onClick={()=>setSelectedBooking(null)}>✕</button>
                    </div>
                    <div style={{borderTop:`1px solid ${C.sandDark}`,paddingTop:14,marginBottom:14}}>
                      {[["Customer",selB.customer_name],["Phone",selB.customer_phone],["Area",selB.customer_area],["Service",selB.service],["Provider",selB.providers?`${selB.providers.first_name} ${selB.providers.last_name}`:"—"],["Slot",selB.slot_time?fmtDate(selB.slot_time)+" "+fmtTime(selB.slot_time):"—"],["Amount","AED "+selB.amount]].map(([k,v])=>(
                        <div key={k} style={S.reviewRow}>
                          <span style={{fontFamily:"sans-serif",fontSize:12,color:C.muted}}>{k}</span>
                          <span style={{fontFamily:"sans-serif",fontSize:12,color:C.ink,fontWeight:600,textAlign:"right",maxWidth:"60%"}}>{v}</span>
                        </div>
                      ))}
                    </div>
                    {selB.notes&&<div style={{background:C.sand,borderRadius:8,padding:"9px 11px",marginBottom:14,fontFamily:"sans-serif",fontSize:12,color:C.muted}}><div style={{fontWeight:700,marginBottom:3,color:C.ink}}>Notes</div>{selB.notes}</div>}
                    {(TRANSITIONS[selB.status]||[]).length>0&&(
                      <div>
                        <div style={{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",marginBottom:8}}>Update status</div>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {(TRANSITIONS[selB.status]||[]).map(ns=>(
                            <button key={ns} style={S.actionBtn(ns==="cancelled"?"#fff":C.ink,ns==="cancelled"?C.red:ns==="completed"?C.green:C.gold)} onClick={()=>updateBookingStatus(selB.id,ns)}>
                              {ns==="cancelled"?"Cancel":ns==="confirmed"?"Confirm":ns==="in_progress"?"In progress":"Complete"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ):(
                  <div style={{...S.panel,color:C.muted,fontFamily:"sans-serif",fontSize:14,textAlign:"center",padding:40}}>Select a booking to view details</div>
                )}
              </div>
            </div>
          )}

          {/* Providers tab */}
          {tab==="providers"&&(
            <div style={{background:"#fff",border:`1px solid ${C.sandDark}`,borderRadius:10,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead><tr>{["Provider","Area","Services","Rate","Status","Actions"].map(h=><th key={h} style={S.tblHead}>{h}</th>)}</tr></thead>
                <tbody>
                  {providers.length===0
                    ? <tr><td colSpan={6} style={{...S.tblCell,textAlign:"center",color:C.muted,padding:32}}>No providers yet</td></tr>
                    : providers.map(p=>(
                      <tr key={p.id} style={{background:"#fff",borderBottom:`1px solid ${C.sandDark}`,cursor:"pointer"}} onClick={()=>openProvider(p)}>
                        <td style={S.tblCell}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:36,height:36,borderRadius:"50%",background:aColor(p.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:C.ink,flexShrink:0}}>{initials(`${p.first_name} ${p.last_name}`)}</div>
                            <div>
                              <div style={{fontSize:13,fontWeight:600,color:C.ink}}>{p.first_name} {p.last_name}</div>
                              <div style={{fontSize:11,color:C.muted}}>{p.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{...S.tblCell,color:C.muted,fontSize:12}}>{p.area}</td>
                        <td style={S.tblCell}>
                          <div style={{display:"flex",flexWrap:"wrap",gap:3}}>
                            {(p.services||[]).map(s=><span key={s} style={{...S.chip,fontSize:10,padding:"2px 8px"}}>{s}</span>)}
                          </div>
                        </td>
                        <td style={{...S.tblCell,fontWeight:700,color:C.gold}}>AED {p.rate}</td>
                        <td style={S.tblCell}>
                          <div style={{display:"inline-flex",alignItems:"center",gap:4,background:p.verified?C.greenBg:p.status==="rejected"?C.redBg:C.amberBg,color:p.verified?C.green:p.status==="rejected"?C.red:C.amber,fontSize:11,fontFamily:"sans-serif",fontWeight:700,padding:"3px 9px",borderRadius:20}}>
                            {p.verified?"✓ Verified":p.status==="rejected"?"✗ Rejected":"⏳ Pending"}
                          </div>
                        </td>
                        <td style={S.tblCell}>
                          <div style={{display:"flex",gap:6}}>
                            <button style={{...S.actionBtn(C.ink,C.goldLight),fontSize:11}} onClick={e=>{e.stopPropagation();openProvider(p);}}>View details</button>
                            {!p.verified&&p.status!=="rejected"&&<>
                              <button style={{...S.actionBtn("#fff",C.green),fontSize:11}} onClick={e=>{e.stopPropagation();updateProviderStatus(p.id,"approved",true);}}>Approve</button>
                              <button style={{...S.actionBtn("#fff",C.red),fontSize:11}} onClick={e=>{e.stopPropagation();updateProviderStatus(p.id,"rejected",false);}}>Reject</button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          )}

          {/* Analytics tab */}
          {tab==="analytics"&&(()=>{
            const byService=bookings.reduce((a,b)=>{a[b.service]=(a[b.service]||0)+1;return a;},{});
            const maxSvc=Math.max(...Object.values(byService),1);
            return(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
                <div style={S.panel}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",marginBottom:14}}>Bookings by service</div>
                  {Object.keys(byService).length===0
                    ? <div style={{fontFamily:"sans-serif",fontSize:13,color:C.muted}}>No bookings yet</div>
                    : Object.entries(byService).sort((a,b)=>b[1]-a[1]).map(([svc,count])=>(
                      <div key={svc} style={{marginBottom:10}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontFamily:"sans-serif",fontSize:12,color:C.ink,marginBottom:4}}><span>{svc}</span><span style={{fontWeight:700}}>{count}</span></div>
                        <div style={{background:C.sand,borderRadius:4,height:6}}><div style={{height:"100%",width:Math.round(count/maxSvc*100)+"%",background:C.gold,borderRadius:4}}/></div>
                      </div>
                    ))
                  }
                </div>
                <div style={S.panel}>
                  <div style={{fontFamily:"sans-serif",fontSize:11,letterSpacing:"0.1em",color:C.muted,textTransform:"uppercase",marginBottom:14}}>Status breakdown</div>
                  {Object.entries(STATUS).map(([k,v])=>{
                    const count=bookings.filter(b=>b.status===k).length;
                    return(
                      <div key={k} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:`0.5px solid ${C.sand}`}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:8,height:8,borderRadius:"50%",background:v.dot}}/><span style={{fontFamily:"sans-serif",fontSize:13,color:C.ink}}>{v.label}</span></div>
                        <div style={{display:"flex",gap:12}}><span style={{fontFamily:"sans-serif",fontSize:13,fontWeight:700}}>{count}</span><span style={{fontFamily:"sans-serif",fontSize:11,color:C.muted}}>{bookings.length?Math.round(count/bookings.length*100):0}%</span></div>
                      </div>
                    );
                  })}
                  <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.sandDark}`}}>
                    <div style={{fontFamily:"sans-serif",fontSize:11,color:C.muted,marginBottom:4}}>Total revenue (completed)</div>
                    <div style={{fontSize:22,fontWeight:700,color:C.gold}}>AED {stats.revenue.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Provider modal */}
      <ProviderModal/>
    </div>
  );
}
