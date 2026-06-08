import { useState, useEffect, useMemo } from "react";
import { supabase } from "./supabaseClient";

const aColors=["#C9A84C","#5DA5A5","#A55D5D","#5D7AA5","#8A5DA5","#5DA57A"];
const aC=n=>aColors[(n||"A").charCodeAt(0)%aColors.length];
const ini=n=>(n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const fmtDate=d=>new Date(d).toLocaleDateString("en-AE",{day:"numeric",month:"short",year:"numeric"});
const fmtTime=d=>new Date(d).toLocaleTimeString("en-AE",{hour:"2-digit",minute:"2-digit"});

const STATUS={
  pending:{label:"Pending",bg:"#FFF8E6",color:"#92600A",dot:"#D4900A"},
  confirmed:{label:"Confirmed",bg:"#E6F7F2",color:"#0B6B4A",dot:"#0B9B6A"},
  in_progress:{label:"In progress",bg:"#EEE8FD",color:"#5B3DB5",dot:"#7C5CF0"},
  completed:{label:"Completed",bg:"#E8F5E9",color:"#2E7D32",dot:"#43A047"},
  cancelled:{label:"Cancelled",bg:"#FDECEA",color:"#C62828",dot:"#E53935"},
};
const TRANSITIONS={pending:["confirmed","cancelled"],confirmed:["in_progress","cancelled"],in_progress:["completed"],completed:[],cancelled:[]};

export default function WastaAdmin(){
  const [bookings,setBookings]=useState([]);
  const [providers,setProviders]=useState([]);
  const [users,setUsers]=useState([]);
  const [loading,setLoading]=useState(true);
  const [tab,setTab]=useState("overview");
  const [filter,setFilter]=useState("all");
  const [search,setSearch]=useState("");
  const [selBooking,setSelBooking]=useState(null);
  const [selProvider,setSelProvider]=useState(null);
  const [docUrls,setDocUrls]=useState({});

  useEffect(()=>{
    fetchAll();
    const ch=supabase.channel("admin")
      .on("postgres_changes",{event:"*",schema:"public",table:"bookings"},p=>{
        if(p.eventType==="INSERT")setBookings(b=>[p.new,...b]);
        if(p.eventType==="UPDATE")setBookings(b=>b.map(x=>x.id===p.new.id?{...x,...p.new}:x));
      })
      .on("postgres_changes",{event:"INSERT",schema:"public",table:"providers"},p=>setProviders(pr=>[p.new,...pr]))
      .subscribe();
    return()=>supabase.removeChannel(ch);
  },[]);

  const fetchAll=async()=>{
    setLoading(true);
    const[bR,pR,uR]=await Promise.all([
      supabase.from("bookings").select("*,providers(first_name,last_name,phone,area)").order("created_at",{ascending:false}),
      supabase.from("providers").select("*,provider_docs(doc_type,file_path)").order("created_at",{ascending:false}),
      supabase.from("users").select("*").order("created_at",{ascending:false}),
    ]);
    if(bR.data)setBookings(bR.data);
    if(pR.data)setProviders(pR.data);
    if(uR.data)setUsers(uR.data);
    setLoading(false);
  };

  const updateBooking=async(id,status)=>{
    const{data}=await supabase.from("bookings").update({status}).eq("id",id).select().single();
    if(data){setBookings(b=>b.map(x=>x.id===id?{...x,...data}:x));if(selBooking?.id===id)setSelBooking(s=>({...s,status}));}
  };

  const updateProvider=async(id,status,verified)=>{
    await supabase.from("providers").update({status,verified}).eq("id",id);
    setProviders(p=>p.map(x=>x.id===id?{...x,status,verified}:x));
    if(selProvider?.id===id)setSelProvider(p=>({...p,status,verified}));
  };

  const openProvider=async(p)=>{
    setSelProvider(p);setDocUrls({});
    for(const d of(p.provider_docs||[])){
      try{const{data}=await supabase.storage.from("wasta-docs").createSignedUrl(d.file_path,3600);
        if(data)setDocUrls(u=>({...u,[d.doc_type]:data.signedUrl}));}catch{}
    }
  };

  const stats=useMemo(()=>({
    totalBookings:bookings.length,
    pending:bookings.filter(b=>b.status==="pending").length,
    confirmed:bookings.filter(b=>b.status==="confirmed").length,
    completed:bookings.filter(b=>b.status==="completed").length,
    cancelled:bookings.filter(b=>b.status==="cancelled").length,
    revenue:bookings.filter(b=>b.status==="completed").reduce((a,b)=>a+Number(b.amount),0),
    todayBookings:bookings.filter(b=>new Date(b.created_at).toDateString()===new Date().toDateString()).length,
    totalProviders:providers.length,
    verifiedProviders:providers.filter(p=>p.verified).length,
    pendingProviders:providers.filter(p=>p.status==="pending").length,
    totalUsers:users.length,
    serviceBreakdown:bookings.reduce((a,b)=>{a[b.service]=(a[b.service]||0)+1;return a;},{}),
    providerRevenue:bookings.filter(b=>b.status==="completed").reduce((a,b)=>{
      const k=b.providers?`${b.providers.first_name} ${b.providers.last_name}`:"Unknown";
      a[k]=(a[k]||0)+Number(b.amount);return a;
    },{}),
  }),[bookings,providers,users]);

  const filtered=useMemo(()=>bookings.filter(b=>{
    const mF=filter==="all"||b.status===filter;
    const mS=!search||(b.ref||"").toLowerCase().includes(search.toLowerCase())||(b.customer_name||"").toLowerCase().includes(search.toLowerCase())||(b.service||"").toLowerCase().includes(search.toLowerCase());
    return mF&&mS;
  }),[bookings,filter,search]);

  const selB=selBooking?bookings.find(b=>b.id===selBooking.id)||selBooking:null;

  const S={
    wrap:{fontFamily:"system-ui,-apple-system,sans-serif",background:"#F5F0EB",minHeight:"100vh",display:"flex",flexDirection:"column"},
    top:{background:"#0F0D0B",height:52,padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between"},
    body:{display:"flex",flex:1},
    sidebar:{width:220,background:"#1A1612",padding:"16px 0",flexShrink:0},
    main:{flex:1,padding:24,overflowY:"auto"},
    sideBtn:(a)=>({display:"flex",alignItems:"center",gap:10,padding:"10px 20px",background:a?"rgba(201,168,76,0.15)":"none",borderLeft:a?"3px solid #C9A84C":"3px solid transparent",color:a?"#C9A84C":"#666",fontSize:13,border:"none",width:"100%",textAlign:"left",cursor:"pointer",boxSizing:"border-box"}),
    card:{background:"#fff",border:"1px solid #EDE8DF",borderRadius:14,padding:"16px 18px"},
    stat:{background:"#fff",border:"1px solid #EDE8DF",borderRadius:12,padding:"16px",flex:1},
    tHead:{background:"#F5F0EB",padding:"10px 14px",fontSize:11,letterSpacing:"0.08em",color:"#8A8278",textTransform:"uppercase",fontWeight:700,textAlign:"left",borderBottom:"1px solid #EDE8DF"},
    tCell:{padding:"11px 14px",fontSize:13,color:"#1A1612",verticalAlign:"middle"},
    tRow:(s)=>({background:s?"#FFFBF0":"#fff",borderBottom:"1px solid #EDE8DF",cursor:"pointer"}),
    badge:(s)=>({display:"inline-flex",alignItems:"center",gap:4,background:(STATUS[s]||STATUS.pending).bg,color:(STATUS[s]||STATUS.pending).color,fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}),
    dot:(s)=>({width:6,height:6,borderRadius:"50%",background:(STATUS[s]||STATUS.pending).dot,flexShrink:0}),
    chip:{display:"inline-block",background:"#FFF8E6",color:"#92600A",fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,margin:"2px 2px 2px 0"},
    btn:(c,bg)=>({background:bg||"#C9A84C",color:c||"#0F0D0B",border:"none",borderRadius:8,padding:"7px 14px",fontSize:12,fontWeight:700,cursor:"pointer"}),
    inp:{border:"1px solid #EDE8DF",borderRadius:9,padding:"8px 12px",fontSize:13,color:"#1A1612",background:"#fff",outline:"none"},
    rowLbl:{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8A8278",marginBottom:8},
    rRow:{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"0.5px solid #F5F0EB"},
    secTitle:{fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"#8A8278",margin:"16px 0 10px"},
  };

  const Badge=({s})=>{const m=STATUS[s]||STATUS.pending;return<span style={S.badge(s)}><span style={S.dot(s)}/>{m.label}</span>;};
  const NB=({n})=>n>0?<span style={{background:"#E53935",color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"1px 6px",marginLeft:6}}>{n}</span>:null;

  // ── Overview ─────────────────────────────────────────────
  const Overview=()=>{
    const maxSvc=Math.max(...Object.values(stats.serviceBreakdown),1);
    const topProviders=Object.entries(stats.providerRevenue).sort((a,b)=>b[1]-a[1]).slice(0,5);
    return(
      <div>
        {/* KPI grid */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          {[
            {label:"Total bookings",val:stats.totalBookings,sub:"all time",hi:false},
            {label:"Pending action",val:stats.pending,sub:"need review",hi:stats.pending>0},
            {label:"Today",val:stats.todayBookings,sub:"new bookings",hi:false},
            {label:"Revenue",val:`AED ${stats.revenue.toLocaleString()}`,sub:"completed jobs",hi:false},
          ].map(({label,val,sub,hi})=>(
            <div key={label} style={{...S.stat,border:hi?"1.5px solid #C9A84C":"1px solid #EDE8DF"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8A8278",marginBottom:6}}>{label}</div>
              <div style={{fontSize:24,fontWeight:700,color:hi?"#C9A84C":"#1A1612",marginBottom:2}}>{val}</div>
              <div style={{fontSize:11,color:"#8A8278"}}>{sub}</div>
            </div>
          ))}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
          {/* Booking status */}
          <div style={S.card}>
            <div style={S.rowLbl}>Booking status breakdown</div>
            {Object.entries(STATUS).map(([k,v])=>{
              const c=bookings.filter(b=>b.status===k).length;
              const pct=bookings.length?Math.round(c/bookings.length*100):0;
              return(
                <div key={k} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#1A1612",marginBottom:4}}>
                    <div style={{display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:8,height:8,borderRadius:"50%",background:v.dot,display:"inline-block"}}/>
                      <span>{v.label}</span>
                    </div>
                    <span style={{fontWeight:700}}>{c} <span style={{color:"#8A8278",fontWeight:400}}>({pct}%)</span></span>
                  </div>
                  <div style={{background:"#F5F0EB",borderRadius:4,height:5,overflow:"hidden"}}>
                    <div style={{height:"100%",width:pct+"%",background:v.dot,borderRadius:4}}/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Provider stats */}
          <div style={S.card}>
            <div style={S.rowLbl}>Provider overview</div>
            {[
              {label:"Total providers",val:stats.totalProviders},
              {label:"Verified & live",val:stats.verifiedProviders},
              {label:"Pending approval",val:stats.pendingProviders,hi:true},
              {label:"Total customers",val:stats.totalUsers},
            ].map(({label,val,hi})=>(
              <div key={label} style={S.rRow}>
                <span style={{fontSize:13,color:"#8A8278"}}>{label}</span>
                <span style={{fontSize:14,fontWeight:700,color:hi&&val>0?"#C9A84C":"#1A1612"}}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {/* Services */}
          <div style={S.card}>
            <div style={S.rowLbl}>Bookings by service</div>
            {Object.keys(stats.serviceBreakdown).length===0
              ?<div style={{fontSize:13,color:"#8A8278",padding:"12px 0"}}>No bookings yet</div>
              :Object.entries(stats.serviceBreakdown).sort((a,b)=>b[1]-a[1]).map(([svc,count])=>(
                <div key={svc} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}>
                    <span style={{color:"#1A1612"}}>{svc}</span>
                    <span style={{fontWeight:700,color:"#1A1612"}}>{count}</span>
                  </div>
                  <div style={{background:"#F5F0EB",borderRadius:4,height:5}}>
                    <div style={{height:"100%",width:Math.round(count/maxSvc*100)+"%",background:"#C9A84C",borderRadius:4}}/>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Top providers by revenue */}
          <div style={S.card}>
            <div style={S.rowLbl}>Top providers by revenue</div>
            {topProviders.length===0
              ?<div style={{fontSize:13,color:"#8A8278",padding:"12px 0"}}>No completed bookings yet</div>
              :topProviders.map(([name,rev],i)=>(
                <div key={name} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:"0.5px solid #F5F0EB"}}>
                  <div style={{width:24,height:24,borderRadius:6,background:aC(name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{i+1}</div>
                  <div style={{flex:1,fontSize:13,color:"#1A1612"}}>{name}</div>
                  <div style={{fontSize:13,fontWeight:700,color:"#C9A84C"}}>AED {rev.toLocaleString()}</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    );
  };

  // ── Bookings ──────────────────────────────────────────────
  const BookingsTab=()=>(
    <div style={{display:"flex",gap:18}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",gap:10,marginBottom:14}}>
          <input style={{...S.inp,flex:1}} placeholder="Search by ref, customer, service…" value={search} onChange={e=>setSearch(e.target.value)}/>
          <select style={S.inp} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="all">All ({bookings.length})</option>
            {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label} ({bookings.filter(b=>b.status===k).length})</option>)}
          </select>
        </div>
        <div style={{...S.card,padding:0,overflow:"hidden"}}>
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead><tr>{["Ref","Customer","Service","Provider","Slot","Amount","Status","Actions"].map(h=><th key={h} style={S.tHead}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.length===0
                ?<tr><td colSpan={8} style={{...S.tCell,textAlign:"center",color:"#8A8278",padding:32}}>No bookings match your filter</td></tr>
                :filtered.map(b=>(
                  <tr key={b.id} style={S.tRow(selB?.id===b.id)} onClick={()=>setSelBooking(b)}>
                    <td style={{...S.tCell,fontWeight:700,color:"#8B6914",fontFamily:"monospace",fontSize:12}}>{b.ref||"—"}</td>
                    <td style={S.tCell}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:30,height:30,borderRadius:8,background:aC(b.customer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{ini(b.customer_name)}</div>
                        <div>
                          <div style={{fontSize:13,fontWeight:600}}>{b.customer_name}</div>
                          <div style={{fontSize:11,color:"#8A8278"}}>{b.customer_area}</div>
                        </div>
                      </div>
                    </td>
                    <td style={S.tCell}>{b.service}</td>
                    <td style={{...S.tCell,fontSize:12,color:"#8A8278"}}>{b.providers?`${b.providers.first_name} ${b.providers.last_name}`:"—"}</td>
                    <td style={{...S.tCell,fontSize:11,color:"#8A8278",whiteSpace:"nowrap"}}>{b.slot_time?fmtDate(b.slot_time)+" "+fmtTime(b.slot_time):"—"}</td>
                    <td style={{...S.tCell,fontWeight:700,color:"#C9A84C"}}>AED {b.amount}</td>
                    <td style={S.tCell}><Badge s={b.status}/></td>
                    <td style={S.tCell}>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {(TRANSITIONS[b.status]||[]).map(ns=>(
                          <button key={ns} style={{...S.btn(ns==="cancelled"?"#fff":"#0F0D0B",ns==="cancelled"?"#C62828":ns==="completed"?"#2D6A4F":"#C9A84C"),fontSize:10,padding:"5px 9px"}}
                            onClick={e=>{e.stopPropagation();updateBooking(b.id,ns);}}>
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

      {/* Detail panel */}
      <div style={{width:290,flexShrink:0}}>
        {selB?(
          <div style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#1A1612",marginBottom:4,fontFamily:"monospace"}}>{selB.ref}</div>
                <Badge s={selB.status}/>
              </div>
              <button style={{background:"none",border:"none",cursor:"pointer",color:"#8A8278",fontSize:18}} onClick={()=>setSelBooking(null)}>✕</button>
            </div>
            <div style={{borderTop:"1px solid #EDE8DF",paddingTop:12,marginBottom:12}}>
              <div style={S.secTitle}>Customer</div>
              {[["Name",selB.customer_name],["Phone",selB.customer_phone],["Email",selB.customer_email||"—"],["Area",selB.customer_area]].map(([k,v])=>(
                <div key={k} style={S.rRow}>
                  <span style={{fontSize:12,color:"#8A8278"}}>{k}</span>
                  <span style={{fontSize:12,color:"#1A1612",fontWeight:600,textAlign:"right",maxWidth:"55%"}}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{borderTop:"1px solid #EDE8DF",paddingTop:12,marginBottom:12}}>
              <div style={S.secTitle}>Booking</div>
              {[["Service",selB.service],["Provider",selB.providers?`${selB.providers.first_name} ${selB.providers.last_name}`:"—"],["Provider area",selB.providers?.area||"—"],["Slot",selB.slot_time?fmtDate(selB.slot_time)+" "+fmtTime(selB.slot_time):"—"],["Amount","AED "+selB.amount],["Booked on",selB.created_at?fmtDate(selB.created_at):"—"]].map(([k,v])=>(
                <div key={k} style={S.rRow}>
                  <span style={{fontSize:12,color:"#8A8278"}}>{k}</span>
                  <span style={{fontSize:12,color:"#1A1612",fontWeight:600,textAlign:"right",maxWidth:"55%"}}>{v}</span>
                </div>
              ))}
            </div>
            {selB.notes&&<div style={{background:"#F5F0EB",borderRadius:8,padding:"9px 12px",fontSize:12,color:"#8A8278",marginBottom:12}}><div style={{fontWeight:700,color:"#1A1612",marginBottom:3}}>Notes</div>{selB.notes}</div>}
            {(TRANSITIONS[selB.status]||[]).length>0&&(
              <div>
                <div style={S.secTitle}>Update status</div>
                <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
                  {(TRANSITIONS[selB.status]||[]).map(ns=>(
                    <button key={ns} style={S.btn(ns==="cancelled"?"#fff":"#0F0D0B",ns==="cancelled"?"#C62828":ns==="completed"?"#2D6A4F":"#C9A84C")} onClick={()=>updateBooking(selB.id,ns)}>
                      {ns==="cancelled"?"Cancel":ns==="confirmed"?"Confirm":ns==="in_progress"?"In progress":"Complete"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ):(
          <div style={{...S.card,textAlign:"center",color:"#8A8278",fontSize:13,padding:40}}>Select a booking to view full details</div>
        )}
      </div>
    </div>
  );

  // ── Providers ─────────────────────────────────────────────
  const ProvidersTab=()=>{
    const days=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const slots=["8am–12pm","12pm–4pm","4pm–8pm"];
    const avail=selProvider?.availability||{};
    const provBookings=selProvider?bookings.filter(b=>b.provider_id===selProvider.id):[];

    return(
      <div style={{display:"flex",gap:18}}>
        <div style={{flex:1,minWidth:0}}>
          <div style={{...S.card,padding:0,overflow:"hidden"}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead><tr>{["Provider","Area","Services","Rate","Bookings","Status","Actions"].map(h=><th key={h} style={S.tHead}>{h}</th>)}</tr></thead>
              <tbody>
                {providers.length===0
                  ?<tr><td colSpan={7} style={{...S.tCell,textAlign:"center",color:"#8A8278",padding:32}}>No providers yet</td></tr>
                  :providers.map(p=>{
                    const pBooks=bookings.filter(b=>b.provider_id===p.id);
                    return(
                      <tr key={p.id} style={{...S.tRow(selProvider?.id===p.id),cursor:"pointer"}} onClick={()=>openProvider(p)}>
                        <td style={S.tCell}>
                          <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <div style={{width:34,height:34,borderRadius:9,background:aC(p.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{ini(`${p.first_name} ${p.last_name}`)}</div>
                            <div>
                              <div style={{fontWeight:600,fontSize:13}}>{p.first_name} {p.last_name}</div>
                              <div style={{fontSize:11,color:"#8A8278"}}>{p.phone}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{...S.tCell,fontSize:12,color:"#8A8278"}}>{p.area}</td>
                        <td style={S.tCell}><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{(p.services||[]).map(s=><span key={s} style={S.chip}>{s}</span>)}</div></td>
                        <td style={{...S.tCell,fontWeight:700,color:"#C9A84C"}}>AED {p.rate}</td>
                        <td style={S.tCell}>
                          <div style={{textAlign:"center"}}>
                            <div style={{fontWeight:700,fontSize:15,color:"#1A1612"}}>{pBooks.length}</div>
                            <div style={{fontSize:10,color:"#2D6A4F",fontWeight:600}}>AED {pBooks.filter(b=>b.status==="completed").reduce((a,b)=>a+Number(b.amount),0).toLocaleString()} earned</div>
                          </div>
                        </td>
                        <td style={S.tCell}>
                          <span style={{background:p.verified?"#E8F5E9":p.status==="rejected"?"#FDECEA":"#FFF8E6",color:p.verified?"#2E7D32":p.status==="rejected"?"#C62828":"#92600A",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20}}>
                            {p.verified?"✓ Live":p.status==="rejected"?"Rejected":"Pending"}
                          </span>
                        </td>
                        <td style={S.tCell}>
                          <div style={{display:"flex",gap:5}}>
                            <button style={{...S.btn("#0F0D0B","#FFF8E6"),fontSize:10}} onClick={e=>{e.stopPropagation();openProvider(p);}}>Details</button>
                            {!p.verified&&p.status!=="rejected"&&<>
                              <button style={{...S.btn("#fff","#2D6A4F"),fontSize:10}} onClick={e=>{e.stopPropagation();updateProvider(p.id,"approved",true);}}>Approve</button>
                              <button style={{...S.btn("#fff","#C62828"),fontSize:10}} onClick={e=>{e.stopPropagation();updateProvider(p.id,"rejected",false);}}>Reject</button>
                            </>}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Provider detail slide panel */}
        {selProvider&&(
          <div style={{position:"fixed",top:0,right:0,bottom:0,width:500,background:"#fff",boxShadow:"-4px 0 32px rgba(0,0,0,0.15)",zIndex:100,display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{flex:1,overflowY:"auto",padding:24}}>
              {/* Header */}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:20}}>
                <div style={{display:"flex",gap:14,alignItems:"center"}}>
                  <div style={{width:54,height:54,borderRadius:14,background:aC(selProvider.first_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{ini(`${selProvider.first_name} ${selProvider.last_name}`)}</div>
                  <div>
                    <div style={{fontWeight:700,fontSize:20,color:"#1A1612"}}>{selProvider.first_name} {selProvider.last_name}</div>
                    <div style={{fontSize:12,color:"#8A8278",marginBottom:4}}>{selProvider.phone} · {selProvider.email}</div>
                    <span style={{background:selProvider.verified?"#E8F5E9":selProvider.status==="rejected"?"#FDECEA":"#FFF8E6",color:selProvider.verified?"#2E7D32":selProvider.status==="rejected"?"#C62828":"#92600A",fontSize:11,fontWeight:700,padding:"2px 10px",borderRadius:20}}>
                      {selProvider.verified?"✓ Verified & live":selProvider.status==="rejected"?"✗ Rejected":"⏳ Pending review"}
                    </span>
                  </div>
                </div>
                <button style={{background:"none",border:"none",cursor:"pointer",color:"#8A8278",fontSize:22}} onClick={()=>setSelProvider(null)}>✕</button>
              </div>

              {/* Performance */}
              <div style={S.secTitle}>Performance</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                {[
                  {l:"Total jobs",v:provBookings.length},
                  {l:"Completed",v:provBookings.filter(b=>b.status==="completed").length},
                  {l:"Revenue",v:"AED "+provBookings.filter(b=>b.status==="completed").reduce((a,b)=>a+Number(b.amount),0).toLocaleString()},
                ].map(({l,v})=>(
                  <div key={l} style={{background:"#F5F0EB",borderRadius:10,padding:"10px 12px"}}>
                    <div style={{fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:"#8A8278",marginBottom:4}}>{l}</div>
                    <div style={{fontSize:16,fontWeight:700,color:"#1A1612"}}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Personal */}
              <div style={S.secTitle}>Personal info</div>
              <div style={{background:"#F5F0EB",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                {[["Nationality",selProvider.nationality||"—"],["Primary area",selProvider.area],["Other areas",(selProvider.other_areas||[]).join(", ")||"—"],["Applied",fmtDate(selProvider.created_at)]].map(([k,v])=>(
                  <div key={k} style={S.rRow}>
                    <span style={{fontSize:12,color:"#8A8278"}}>{k}</span>
                    <span style={{fontSize:12,color:"#1A1612",fontWeight:600,textAlign:"right",maxWidth:"55%"}}>{v}</span>
                  </div>
                ))}
                {selProvider.bio&&<div style={{marginTop:8,fontSize:12,color:"#8A8278",fontStyle:"italic"}}>"{selProvider.bio}"</div>}
              </div>

              {/* Services */}
              <div style={S.secTitle}>Services offered</div>
              <div style={{marginBottom:14}}>{(selProvider.services||[]).map(s=><span key={s} style={S.chip}>{s}</span>)}</div>

              {/* Trade */}
              <div style={S.secTitle}>Trade details</div>
              <div style={{background:"#F5F0EB",borderRadius:12,padding:"12px 14px",marginBottom:14}}>
                {[["Experience",selProvider.experience||"—"],["Rate",`AED ${selProvider.rate}/call`],["Insurance",selProvider.insurance?"Yes ✓":"No"],["Emirates ID",selProvider.emirates_id||"—"],["Trade license",selProvider.trade_license||"—"]].map(([k,v])=>(
                  <div key={k} style={S.rRow}>
                    <span style={{fontSize:12,color:"#8A8278"}}>{k}</span>
                    <span style={{fontSize:12,color:"#1A1612",fontWeight:600,textAlign:"right",maxWidth:"55%"}}>{v}</span>
                  </div>
                ))}
              </div>

              {/* Availability */}
              <div style={S.secTitle}>Availability</div>
              <div style={{background:"#F5F0EB",borderRadius:12,padding:"12px 14px",marginBottom:14,overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr><th style={{width:36}}/>{slots.map(s=><th key={s} style={{fontSize:10,color:"#8A8278",fontWeight:600,padding:"4px 6px",textAlign:"center"}}>{s}</th>)}</tr></thead>
                  <tbody>{days.map(day=>(
                    <tr key={day}><td style={{fontSize:11,fontWeight:700,color:"#1A1612",paddingRight:8}}>{day}</td>
                    {slots.map(slot=>{const active=(avail[day]||[]).includes(slot);return<td key={slot} style={{padding:"3px 4px",textAlign:"center"}}><div style={{padding:"5px",borderRadius:5,background:active?"#FFF8E6":"#fff",border:`1px solid ${active?"#C9A84C":"#EDE8DF"}`,fontSize:10,color:active?"#8B6914":"#ccc",textAlign:"center"}}>{active?"✓":"—"}</div></td>;})}</tr>
                  ))}</tbody>
                </table>
              </div>

              {/* Documents */}
              <div style={S.secTitle}>Documents</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
                {(selProvider.provider_docs||[]).length===0
                  ?<div style={{fontSize:12,color:"#8A8278"}}>No documents uploaded</div>
                  :(selProvider.provider_docs||[]).map(doc=>(
                    <div key={doc.doc_type} style={{background:"#F5F0EB",borderRadius:8,padding:"10px 14px",fontSize:12}}>
                      <div style={{color:"#8A8278",marginBottom:4,textTransform:"capitalize"}}>{doc.doc_type.replace(/_/g," ")}</div>
                      {docUrls[doc.doc_type]
                        ?<a href={docUrls[doc.doc_type]} target="_blank" rel="noreferrer" style={{color:"#1565C0",fontWeight:700,textDecoration:"none"}}>View ↗</a>
                        :<span style={{color:"#ccc"}}>Loading…</span>}
                    </div>
                  ))
                }
              </div>

              {/* Booking history for this provider */}
              {provBookings.length>0&&(
                <>
                  <div style={S.secTitle}>Booking history ({provBookings.length})</div>
                  {provBookings.slice(0,5).map(b=>(
                    <div key={b.id} style={{background:"#F5F0EB",borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:700,color:"#1A1612"}}>{b.customer_name}</span>
                        <Badge s={b.status}/>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between"}}>
                        <span style={{fontSize:11,color:"#8A8278"}}>{b.service} · {b.ref}</span>
                        <span style={{fontSize:12,fontWeight:700,color:"#C9A84C"}}>AED {b.amount}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Sticky action footer */}
            <div style={{padding:"16px 24px",borderTop:"1px solid #EDE8DF",background:"#fff",flexShrink:0}}>
              {!selProvider.verified&&selProvider.status!=="rejected"&&(
                <div style={{display:"flex",gap:10}}>
                  <button style={{...S.btn("#fff","#2D6A4F"),flex:1,padding:"13px",fontSize:14,borderRadius:10}} onClick={()=>updateProvider(selProvider.id,"approved",true)}>✓ Approve provider</button>
                  <button style={{...S.btn("#fff","#C62828"),flex:1,padding:"13px",fontSize:14,borderRadius:10}} onClick={()=>updateProvider(selProvider.id,"rejected",false)}>✗ Reject</button>
                </div>
              )}
              {selProvider.verified&&<div style={{background:"#E8F5E9",color:"#2E7D32",fontSize:13,fontWeight:700,padding:13,borderRadius:10,textAlign:"center"}}>✓ Approved and live on Wasta</div>}
              {selProvider.status==="rejected"&&<div style={{background:"#FDECEA",color:"#C62828",fontSize:13,fontWeight:700,padding:13,borderRadius:10,textAlign:"center"}}>✗ Provider has been rejected</div>}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Customers ─────────────────────────────────────────────
  const CustomersTab=()=>(
    <div style={{...S.card,padding:0,overflow:"hidden"}}>
      <table style={{width:"100%",borderCollapse:"collapse"}}>
        <thead><tr>{["Customer","Phone","Email","Area","Building/Flat","Bookings","Joined"].map(h=><th key={h} style={S.tHead}>{h}</th>)}</tr></thead>
        <tbody>
          {users.length===0
            ?<tr><td colSpan={7} style={{...S.tCell,textAlign:"center",color:"#8A8278",padding:32}}>No users yet</td></tr>
            :users.map(u=>{
              const uBooks=bookings.filter(b=>b.customer_phone===u.phone);
              return(
                <tr key={u.id} style={{background:"#fff",borderBottom:"1px solid #EDE8DF"}}>
                  <td style={S.tCell}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:30,height:30,borderRadius:8,background:aC(u.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#0F0D0B",flexShrink:0}}>{ini(u.full_name)}</div>
                      <span style={{fontWeight:600,fontSize:13}}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{...S.tCell,fontSize:12,color:"#8A8278"}}>{u.phone}</td>
                  <td style={{...S.tCell,fontSize:12,color:"#8A8278"}}>{u.email||"—"}</td>
                  <td style={{...S.tCell,fontSize:12}}>{u.area||"—"}</td>
                  <td style={{...S.tCell,fontSize:12,color:"#8A8278"}}>{[u.building,u.flat_no].filter(Boolean).join(", Flat ")||"—"}</td>
                  <td style={S.tCell}>
                    <div style={{fontWeight:700,fontSize:14,color:"#1A1612"}}>{uBooks.length}</div>
                    <div style={{fontSize:10,color:"#C9A84C",fontWeight:600}}>AED {uBooks.filter(b=>b.status==="completed").reduce((a,b)=>a+Number(b.amount),0)} spent</div>
                  </td>
                  <td style={{...S.tCell,fontSize:11,color:"#8A8278"}}>{fmtDate(u.created_at)}</td>
                </tr>
              );
            })
          }
        </tbody>
      </table>
    </div>
  );

  return(
    <div style={S.wrap}>
      <div style={S.top}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{fontSize:18,fontWeight:800,color:"#C9A84C",fontFamily:"Georgia,serif",letterSpacing:"0.08em"}}>WASTA</div>
          <div style={{fontSize:12,color:"#555"}}>/ Admin</div>
          {loading&&<div style={{fontSize:11,color:"#666"}}>Syncing…</div>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:30,height:30,borderRadius:8,background:"#C9A84C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#0F0D0B"}}>AD</div>
          <span style={{fontSize:12,color:"#666"}}>Admin</span>
        </div>
      </div>

      <div style={S.body}>
        <div style={S.sidebar}>
          {[["📊","Overview","overview",0],["📋","Bookings","bookings",stats.pending],["👷","Providers","providers",stats.pendingProviders],["👥","Customers","customers",0]].map(([ico,lbl,t,badge])=>(
            <button key={t} style={S.sideBtn(tab===t)} onClick={()=>setTab(t)}>
              <span style={{fontSize:16}}>{ico}</span><span>{lbl}</span>
              {badge>0&&<span style={{background:"#E53935",color:"#fff",fontSize:9,fontWeight:700,borderRadius:20,padding:"1px 6px",marginLeft:"auto"}}>{badge}</span>}
            </button>
          ))}
        </div>

        <div style={S.main}>
          {tab==="overview"&&<Overview/>}
          {tab==="bookings"&&<BookingsTab/>}
          {tab==="providers"&&<ProvidersTab/>}
          {tab==="customers"&&<CustomersTab/>}
        </div>
      </div>
    </div>
  );
}
