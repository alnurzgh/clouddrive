import { useState, useRef, useCallback, useEffect } from "react";

const API = "http://localhost:8000/api";

function getToken() { return localStorage.getItem("cd_token"); }
function setToken(t) { localStorage.setItem("cd_token", t); }
function clearToken() { localStorage.removeItem("cd_token"); }
function authHeaders() { return { Authorization: `Bearer ${getToken()}` }; }

const C = {
  bg:       "#0c0a1a",
  bg2:      "#110e24",
  bg3:      "#160f2e",
  border:   "rgba(120,80,255,0.15)",
  borderHi: "rgba(160,100,255,0.4)",
  primary:  "#7c3aed",
  bright:   "#a855f7",
  glow:     "#c084fc",
  text:     "#ede9fe",
  textSub:  "#7c6fa0",
  textDim:  "#3d2e6b",
  grad:     "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
  gradHot:  "linear-gradient(135deg, #6d28d9 0%, #c084fc 100%)",
};

const FILE_ICONS = {
  pdf:         { emoji:"📄", bg:"rgba(124,58,237,0.2)" },
  image:       { emoji:"🖼️", bg:"rgba(168,85,247,0.2)" },
  video:       { emoji:"🎬", bg:"rgba(192,132,252,0.15)" },
  zip:         { emoji:"📦", bg:"rgba(109,40,217,0.25)" },
  spreadsheet: { emoji:"📊", bg:"rgba(139,92,246,0.2)" },
  slides:      { emoji:"📋", bg:"rgba(167,139,250,0.15)" },
  text:        { emoji:"📝", bg:"rgba(91,33,182,0.25)" },
  audio:       { emoji:"🎵", bg:"rgba(196,181,253,0.12)" },
  default:     { emoji:"📁", bg:"rgba(124,58,237,0.15)" },
};

function getFileType(mime="",name="") {
  const ext=(name.split(".").pop()||"").toLowerCase();
  const m={pdf:"pdf",jpg:"image",jpeg:"image",png:"image",gif:"image",webp:"image",svg:"image",
    mp4:"video",mov:"video",avi:"video",mkv:"video",webm:"video",
    zip:"zip",rar:"zip","7z":"zip",tar:"zip",
    xlsx:"spreadsheet",xls:"spreadsheet",csv:"spreadsheet",
    pptx:"slides",ppt:"slides",
    txt:"text",md:"text",doc:"text",docx:"text",json:"text",
    mp3:"audio",wav:"audio",ogg:"audio",flac:"audio"};
  if(m[ext]) return m[ext];
  if(mime.startsWith("image/")) return "image";
  if(mime.startsWith("video/")) return "video";
  if(mime.startsWith("audio/")) return "audio";
  if(mime==="application/pdf") return "pdf";
  if(mime.includes("zip")) return "zip";
  if(mime.includes("spreadsheet")||mime.includes("excel")) return "spreadsheet";
  if(mime.includes("presentation")) return "slides";
  if(mime.startsWith("text/")) return "text";
  return "default";
}

function formatSize(b=0){
  if(b<1024) return b+" B";
  if(b<1048576) return (b/1024).toFixed(1)+" KB";
  if(b<1073741824) return (b/1048576).toFixed(1)+" MB";
  return (b/1073741824).toFixed(2)+" GB";
}

function formatDate(d){
  const date=new Date(d),now=new Date(),diff=now-date;
  if(diff<3600000) return Math.floor(diff/60000)+" мин";
  if(diff<86400000) return Math.floor(diff/3600000)+" ч";
  if(diff<604800000) return Math.floor(diff/86400000)+" дн";
  return date.toLocaleDateString("ru-RU",{day:"2-digit",month:"short"});
}

const NAV=[
  {id:"all",    label:"Файлы",    icon:"⊞"},
  {id:"recent", label:"Недавние", icon:"◷"},
  {id:"starred",label:"Избранное",icon:"✦"},
  {id:"shared", label:"Доступ",   icon:"⊹"},
  {id:"trash",  label:"Корзина",  icon:"⊘"},
];

// хук для определения мобилки
function useIsMobile(){
  const [mob,setMob]=useState(window.innerWidth<=768);
  useEffect(()=>{
    const h=()=>setMob(window.innerWidth<=768);
    window.addEventListener("resize",h);
    return ()=>window.removeEventListener("resize",h);
  },[]);
  return mob;
}

// ── AUTH ─────────────────────────────────────────────────────────
function AuthPage({onLogin}){
  const [mode,setMode]=useState("login");
  const [user,setUser]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [load,setLoad]=useState(false);
  const [err,setErr]=useState("");
  const [show,setShow]=useState(false);

  async function submit(e){
    e.preventDefault(); setLoad(true); setErr("");
    try{
      if(mode==="register"){
        const r=await fetch(`${API}/auth/register/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,email,password:pass})});
        if(!r.ok){const d=await r.json();throw new Error(Object.values(d).flat().join(" "));}
      }
      const r=await fetch(`${API}/auth/login/`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:user,password:pass})});
      if(!r.ok) throw new Error("Неверный логин или пароль");
      const{access}=await r.json();
      setToken(access); onLogin(user);
    }catch(e){setErr(e.message);}
    finally{setLoad(false);}
  }

  const inp={width:"100%",padding:"13px 16px",borderRadius:14,border:`1px solid ${C.border}`,background:"rgba(124,58,237,0.06)",color:C.text,fontSize:15,outline:"none",transition:"border-color 0.2s",boxSizing:"border-box"};

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Inter',sans-serif",padding:"20px",position:"relative",overflow:"hidden"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;}
        input::placeholder{color:${C.textDim};}
        input:-webkit-autofill{-webkit-box-shadow:0 0 0 30px #110e24 inset!important;-webkit-text-fill-color:${C.text}!important;}
        @keyframes fadeUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes toastPop{from{transform:translate(-50%,16px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
      `}</style>

      <div style={{position:"fixed",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(124,58,237,0.15) 0%,transparent 65%)",top:-150,left:-100,pointerEvents:"none"}}/>
      <div style={{position:"fixed",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 65%)",bottom:-100,right:-50,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:400,animation:"fadeUp 0.4s ease"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{width:60,height:60,borderRadius:20,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,margin:"0 auto 16px",boxShadow:"0 8px 32px rgba(124,58,237,0.5)"}}>☁</div>
          <div style={{fontSize:26,fontWeight:800,color:C.text,letterSpacing:"-0.5px"}}>CloudDrive</div>
          <div style={{fontSize:14,color:C.textSub,marginTop:6}}>{mode==="login"?"Войди в аккаунт":"Создай аккаунт"}</div>
        </div>

        <div style={{background:C.bg2,borderRadius:24,border:`1px solid ${C.border}`,padding:28,boxShadow:"0 24px 80px rgba(124,58,237,0.15)"}}>
          <div style={{display:"flex",background:"rgba(124,58,237,0.08)",borderRadius:14,padding:4,marginBottom:24,border:`1px solid ${C.border}`}}>
            {[["login","Войти"],["register","Регистрация"]].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr("");}}
                style={{flex:1,padding:"11px",borderRadius:11,border:"none",cursor:"pointer",fontSize:14,fontWeight:600,background:mode===m?C.grad:"transparent",color:mode===m?"#fff":C.textSub,transition:"all 0.2s",boxShadow:mode===m?"0 4px 14px rgba(124,58,237,0.4)":"none"}}>
                {l}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.textSub,display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.8px"}}>Логин</label>
              <input value={user} onChange={e=>setUser(e.target.value)} required placeholder="username" style={inp}
                onFocus={e=>e.target.style.borderColor=C.bright} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            {mode==="register"&&(
              <div>
                <label style={{fontSize:12,fontWeight:600,color:C.textSub,display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.8px"}}>Email</label>
                <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="you@example.com" style={inp}
                  onFocus={e=>e.target.style.borderColor=C.bright} onBlur={e=>e.target.style.borderColor=C.border}/>
              </div>
            )}
            <div>
              <label style={{fontSize:12,fontWeight:600,color:C.textSub,display:"block",marginBottom:7,textTransform:"uppercase",letterSpacing:"0.8px"}}>Пароль</label>
              <div style={{position:"relative"}}>
                <input value={pass} onChange={e=>setPass(e.target.value)} type={show?"text":"password"} required placeholder="••••••••" minLength={6}
                  style={{...inp,paddingRight:48}}
                  onFocus={e=>e.target.style.borderColor=C.bright} onBlur={e=>e.target.style.borderColor=C.border}/>
                <button type="button" onClick={()=>setShow(!show)}
                  style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",border:"none",background:"none",cursor:"pointer",fontSize:16,color:C.textSub,padding:4}}>
                  {show?"🙈":"👁"}
                </button>
              </div>
            </div>
            {err&&<div style={{background:"rgba(192,38,211,0.08)",border:"1px solid rgba(192,38,211,0.25)",borderRadius:12,padding:"11px 14px",fontSize:13,color:"#e879f9"}}>⚠ {err}</div>}
            <button type="submit" disabled={load}
              style={{background:load?"rgba(124,58,237,0.3)":C.grad,color:"#fff",border:"none",borderRadius:14,padding:"15px",fontWeight:700,fontSize:15,cursor:load?"not-allowed":"pointer",marginTop:4,boxShadow:load?"none":"0 6px 24px rgba(124,58,237,0.45)",transition:"all 0.2s"}}>
              {load?"⏳ Подождите...":mode==="login"?"Войти →":"Создать аккаунт →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── MODAL ────────────────────────────────────────────────────────
function Modal({title,onClose,children}){
  useEffect(()=>{
    const h=e=>e.key==="Escape"&&onClose();
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:2000,background:"rgba(12,10,26,0.9)",backdropFilter:"blur(10px)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={onClose}>
      <div style={{background:C.bg2,borderRadius:24,border:`1px solid ${C.borderHi}`,padding:28,width:"100%",maxWidth:400,boxShadow:"0 24px 80px rgba(124,58,237,0.3)",animation:"fadeUp 0.2s ease"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontSize:15,fontWeight:700,color:C.text}}>{title}</span>
          <button onClick={onClose} style={{border:"none",background:"rgba(124,58,237,0.15)",borderRadius:9,width:30,height:30,cursor:"pointer",fontSize:14,color:C.textSub,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function RenameModal({file,onClose,onSave}){
  const [name,setName]=useState(file.name);
  async function save(){
    if(!name.trim()) return;
    try{await fetch(`${API}/v1/files/${file.id}/`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify({name:name.trim()})});}catch{}
    onSave(file.id,name.trim()); onClose();
  }
  return(
    <Modal title="✎ Переименовать" onClose={onClose}>
      <input value={name} onChange={e=>setName(e.target.value)} autoFocus onKeyDown={e=>e.key==="Enter"&&save()}
        style={{width:"100%",padding:"13px 16px",borderRadius:12,border:`1px solid ${C.borderHi}`,background:"rgba(124,58,237,0.08)",color:C.text,fontSize:14,outline:"none",marginBottom:16,boxSizing:"border-box"}}/>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,cursor:"pointer",fontSize:14,fontWeight:600}}>Отмена</button>
        <button onClick={save} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:C.grad,color:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,boxShadow:"0 4px 14px rgba(124,58,237,0.4)"}}>Сохранить</button>
      </div>
    </Modal>
  );
}

function ShareModal({file,onClose}){
  const link=`${window.location.origin}/shared/${file.id}`;
  const [copied,setCopied]=useState(false);
  function copy(){navigator.clipboard.writeText(link).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),2000);}
  return(
    <Modal title="⊹ Поделиться" onClose={onClose}>
      <p style={{fontSize:13,color:C.textSub,marginBottom:12,wordBreak:"break-all"}}>{file.name}</p>
      <div style={{background:"rgba(124,58,237,0.06)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:12,color:C.textSub,wordBreak:"break-all",border:`1px solid ${C.border}`,fontFamily:"monospace"}}>{link}</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onClose} style={{flex:1,padding:"13px",borderRadius:12,border:`1px solid ${C.border}`,background:"transparent",color:C.textSub,cursor:"pointer",fontSize:14,fontWeight:600}}>Закрыть</button>
        <button onClick={copy} style={{flex:1,padding:"13px",borderRadius:12,border:"none",background:copied?"rgba(168,85,247,0.3)":C.grad,color:copied?C.glow:"#fff",cursor:"pointer",fontSize:14,fontWeight:700,transition:"all 0.3s"}}>
          {copied?"✓ Скопировано":"Копировать"}
        </button>
      </div>
    </Modal>
  );
}

// ── BOTTOM SHEET (mobile detail) ─────────────────────────────────
function BottomSheet({file,onClose,onDownload,onRename,onShare,onStar,onDelete}){
  const fi=FILE_ICONS[file.type]||FILE_ICONS.default;
  return(
    <div style={{position:"fixed",inset:0,zIndex:500,background:"rgba(12,10,26,0.7)",backdropFilter:"blur(8px)"}} onClick={onClose}>
      <div style={{position:"absolute",bottom:0,left:0,right:0,background:C.bg2,borderRadius:"24px 24px 0 0",border:`1px solid ${C.borderHi}`,borderBottom:"none",padding:"0 0 34px",maxHeight:"85vh",overflowY:"auto",animation:"slideUp 0.3s cubic-bezier(0.4,0,0.2,1)"}} onClick={e=>e.stopPropagation()}>
        {/* Handle */}
        <div style={{display:"flex",justifyContent:"center",padding:"12px 0 8px"}}>
          <div style={{width:40,height:4,borderRadius:4,background:"rgba(124,58,237,0.3)"}}/>
        </div>

        {/* File info */}
        <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:52,height:52,borderRadius:16,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,border:`1px solid ${C.border}`,overflow:"hidden"}}>
            {file.thumb?<img src={file.thumb} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:fi.emoji}
          </div>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,fontWeight:700,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</div>
            <div style={{fontSize:13,color:C.textSub,marginTop:3}}>{file.type.toUpperCase()} · {formatSize(file.size)}</div>
          </div>
        </div>

        {/* Actions */}
        <div style={{padding:"8px 12px"}}>
          {[
            {icon:"⬇",  label:"Скачать файл",   action:onDownload},
            {icon:"✎",  label:"Переименовать",   action:onRename},
            {icon:"⊹",  label:"Поделиться",      action:onShare},
            {icon:file.starred?"✦":"✧", label:file.starred?"Убрать из избранного":"В избранное", action:onStar},
          ].map(btn=>(
            <button key={btn.label} onClick={()=>{btn.action(); onClose();}}
              style={{display:"flex",alignItems:"center",gap:16,padding:"16px 14px",borderRadius:14,border:"none",background:"transparent",color:C.text,cursor:"pointer",fontSize:15,fontWeight:500,width:"100%",textAlign:"left",transition:"background 0.15s"}}
              onTouchStart={e=>e.currentTarget.style.background="rgba(124,58,237,0.1)"}
              onTouchEnd={e=>e.currentTarget.style.background="transparent"}>
              <span style={{width:40,height:40,borderRadius:12,background:"rgba(124,58,237,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,color:C.glow}}>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
          <div style={{height:1,background:C.border,margin:"4px 14px 4px"}}/>
          <button onClick={()=>{onDelete(); onClose();}}
            style={{display:"flex",alignItems:"center",gap:16,padding:"16px 14px",borderRadius:14,border:"none",background:"transparent",color:"#e879f9",cursor:"pointer",fontSize:15,fontWeight:500,width:"100%",textAlign:"left"}}
            onTouchStart={e=>e.currentTarget.style.background="rgba(232,121,249,0.08)"}
            onTouchEnd={e=>e.currentTarget.style.background="transparent"}>
            <span style={{width:40,height:40,borderRadius:12,background:"rgba(192,38,211,0.12)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>⊘</span>
            Удалить файл
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// MAIN APP
// ════════════════════════════════════════════════════════════════
export default function CloudDrive(){
  const [user,setUser]       = useState(null);
  const [view,setView]       = useState("grid");
  const [section,setSection] = useState("all");
  const [search,setSearch]   = useState("");
  const [files,setFiles]     = useState([]);
  const [selected,setSel]    = useState(null);
  const [detail,setDetail]   = useState(null);
  const [ctxMenu,setCtx]     = useState(null);
  const [dragging,setDrag]   = useState(false);
  const [uploads,setUploads] = useState([]);
  const [loading,setLoading] = useState(false);
  const [toast,setToast]     = useState(null);
  const [rename,setRename]   = useState(null);
  const [share,setShare]     = useState(null);
  const [sidebarOpen,setSidebar] = useState(false);
  const [searchOpen,setSearchOpen] = useState(false);
  const fileRef = useRef();
  const QUOTA = 5*1024**3;
  const isMobile = useIsMobile();

  useEffect(()=>{
    if(getToken()){
      fetch(`${API}/auth/me/`,{headers:authHeaders()})
        .then(r=>r.ok?r.json():null)
        .then(d=>d?setUser(d.username):clearToken())
        .catch(()=>{});
    }
  },[]);

  function showToast(msg,type="ok"){setToast({msg,type}); setTimeout(()=>setToast(null),3000);}
  function logout(){clearToken(); setUser(null); setFiles([]);}

  async function fetchFiles(){
    if(!getToken()) return;
    setLoading(true);
    try{
      const res=await fetch(`${API}/v1/files/`,{headers:authHeaders()});
      if(res.status===401){clearToken();setUser(null);return;}
      if(res.ok){
        const data=await res.json();
        const arr=Array.isArray(data)?data:data.results||[];
        setFiles(arr.map(f=>({
          id:f.id, name:f.name,
          type:getFileType(f.mime_type,f.name),
          size:f.size,
          modified:f.created_at||new Date().toISOString(),
          starred:f.is_starred||false,
          shared:false,
          thumb:f.thumbnail_url||null,
          storageKey:f.storage_key||"",
        })));
      }
    }catch{setFiles([]);}
    finally{setLoading(false);}
  }

  useEffect(()=>{if(user) fetchFiles();},[user]);

  async function downloadFile(file){
    showToast(`⬇ Скачивание...`);
    try{
      const res=await fetch(`${API}/v1/files/${file.id}/download/`,{headers:authHeaders()});
      if(!res.ok) throw new Error();
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=file.name;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`✓ ${file.name} скачан`);
    }catch{showToast("❌ Ошибка скачивания","err");}
  }

  async function uploadFile(file){
    const used=files.reduce((s,f)=>s+f.size,0);
    if(used+file.size>QUOTA){showToast(`❌ Нет места! Доступно ${formatSize(QUOTA-used)}`,"err");return;}
    const uid=Date.now()+Math.random();
    setUploads(u=>[...u,{id:uid,name:file.name,progress:0,done:false,error:false}]);
    const fd=new FormData(); fd.append("file",file); fd.append("name",file.name);
    return new Promise(resolve=>{
      const xhr=new XMLHttpRequest();
      xhr.upload.onprogress=e=>{if(e.lengthComputable) setUploads(u=>u.map(x=>x.id===uid?{...x,progress:Math.round(e.loaded/e.total*100)}:x));};
      xhr.onload=()=>{
        if(xhr.status===201||xhr.status===200){
          setUploads(u=>u.map(x=>x.id===uid?{...x,progress:100,done:true}:x));
          setTimeout(()=>setUploads(u=>u.filter(x=>x.id!==uid)),2500);
          fetchFiles(); showToast(`✓ ${file.name} загружен`);
        }else{
          let msg="Ошибка загрузки";
          try{const d=JSON.parse(xhr.responseText);msg=d.error||msg;}catch{}
          setUploads(u=>u.map(x=>x.id===uid?{...x,error:true}:x));
          showToast(`❌ ${msg}`,"err");
        }
        resolve();
      };
      xhr.onerror=()=>{setUploads(u=>u.map(x=>x.id===uid?{...x,error:true}:x));resolve();};
      xhr.open("POST",`${API}/v1/files/`);
      xhr.setRequestHeader("Authorization",`Bearer ${getToken()}`);
      xhr.send(fd);
    });
  }

  function handleFiles(list){Array.from(list).forEach(uploadFile);}
  const onDrop=useCallback(e=>{e.preventDefault();setDrag(false);handleFiles(e.dataTransfer.files);},[files]);

  async function deleteFile(id){
    try{await fetch(`${API}/v1/files/${id}/`,{method:"DELETE",headers:authHeaders()});}catch{}
    setFiles(fs=>fs.filter(f=>f.id!==id));
    setDetail(null); setCtx(null); showToast("Файл удалён");
  }

  async function toggleStar(id){
    const f=files.find(x=>x.id===id); if(!f) return;
    try{await fetch(`${API}/v1/files/${id}/`,{method:"PATCH",headers:{"Content-Type":"application/json",...authHeaders()},body:JSON.stringify({is_starred:!f.starred})});}catch{}
    setFiles(fs=>fs.map(x=>x.id===id?{...x,starred:!x.starred}:x));
    if(detail?.id===id) setDetail(d=>({...d,starred:!d.starred}));
  }

  function handleRename(id,name){
    setFiles(fs=>fs.map(f=>f.id===id?{...f,name}:f));
    if(detail?.id===id) setDetail(d=>({...d,name}));
    showToast("Переименовано");
  }

  const totalUsed=files.reduce((s,f)=>s+f.size,0);
  const usedPct=Math.min((totalUsed/QUOTA)*100,100);

  const filtered=files.filter(f=>{
    const q=search.toLowerCase();
    const m=!q||f.name.toLowerCase().includes(q)||f.type.includes(q);
    if(section==="all")     return m;
    if(section==="recent")  return m&&(Date.now()-new Date(f.modified))<7*86400000;
    if(section==="starred") return m&&f.starred;
    if(section==="shared")  return m&&f.shared;
    if(section==="trash")   return false;
    return m;
  });

  if(!user) return <AuthPage onLogin={u=>setUser(u)}/>;

  // ── MOBILE LAYOUT ─────────────────────────────────────────────
  if(isMobile) return(
    <div style={{width:"100vw",height:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",flexDirection:"column",overflow:"hidden",position:"fixed",top:0,left:0}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
        @keyframes slideLeft{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes toastPop{from{transform:translate(-50%,16px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
        input::placeholder{color:${C.textDim};}
        ::-webkit-scrollbar{display:none}
      `}</style>

      {rename&&<RenameModal file={rename} onClose={()=>setRename(null)} onSave={handleRename}/>}
      {share&&<ShareModal file={share} onClose={()=>setShare(null)}/>}

      {/* Mobile sidebar overlay */}
      {sidebarOpen&&(
        <div style={{position:"fixed",inset:0,zIndex:300,background:"rgba(12,10,26,0.85)",backdropFilter:"blur(8px)"}} onClick={()=>setSidebar(false)}>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:"75vw",maxWidth:300,background:C.bg2,borderLeft:`1px solid ${C.borderHi}`,display:"flex",flexDirection:"column",animation:"slideLeft 0.25s cubic-bezier(0.4,0,0.2,1)",padding:"0 0 40px"}} onClick={e=>e.stopPropagation()}>
            {/* User */}
            <div style={{padding:"20px 16px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <div style={{width:44,height:44,borderRadius:14,background:C.gradHot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff",boxShadow:"0 4px 14px rgba(124,58,237,0.5)"}}>
                  {user[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{fontSize:16,fontWeight:700,color:C.text}}>{user}</div>
                  <div style={{fontSize:12,color:C.textSub}}>{formatSize(totalUsed)} / 5 GB</div>
                </div>
              </div>
              {/* Storage bar */}
              <div style={{height:5,borderRadius:5,background:"rgba(124,58,237,0.12)",overflow:"hidden"}}>
                <div style={{height:"100%",width:`${usedPct}%`,borderRadius:5,background:C.grad,boxShadow:"0 0 8px rgba(124,58,237,0.5)"}}/>
              </div>
            </div>

            {/* Nav items */}
            <div style={{padding:"12px 10px",flex:1}}>
              {NAV.map(item=>(
                <button key={item.id}
                  onClick={()=>{setSection(item.id);setSidebar(false);}}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"14px 12px",borderRadius:14,border:"none",cursor:"pointer",fontSize:15,fontWeight:section===item.id?600:400,background:section===item.id?"rgba(124,58,237,0.2)":"transparent",color:section===item.id?C.glow:C.textSub,width:"100%",textAlign:"left",marginBottom:4,transition:"all 0.15s"}}>
                  <span style={{fontSize:18,width:24,textAlign:"center"}}>{item.icon}</span>
                  {item.label}
                  {section===item.id&&<span style={{marginLeft:"auto",width:7,height:7,borderRadius:"50%",background:C.bright,boxShadow:`0 0 8px ${C.bright}`}}/>}
                </button>
              ))}
            </div>

            {/* Logout */}
            <div style={{padding:"0 12px"}}>
              <button onClick={logout}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 12px",borderRadius:14,border:`1px solid rgba(192,38,211,0.2)`,background:"rgba(192,38,211,0.06)",color:"#e879f9",cursor:"pointer",fontSize:15,fontWeight:500,width:"100%"}}>
                <span style={{fontSize:18}}>⏻</span> Выйти из аккаунта
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet detail */}
      {detail&&(
        <BottomSheet
          file={detail}
          onClose={()=>setDetail(null)}
          onDownload={()=>downloadFile(detail)}
          onRename={()=>setRename(detail)}
          onShare={()=>setShare(detail)}
          onStar={()=>toggleStar(detail.id)}
          onDelete={()=>deleteFile(detail.id)}
        />
      )}

      {/* ── MOBILE TOPBAR ── */}
      <header style={{display:"flex",alignItems:"center",gap:10,padding:"12px 16px",background:C.bg,borderBottom:`1px solid ${C.border}`,flexShrink:0,paddingTop:"max(12px, env(safe-area-inset-top))"}}>
        <div style={{width:32,height:32,borderRadius:10,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,boxShadow:"0 2px 10px rgba(124,58,237,0.4)"}}>☁</div>
        <span style={{fontSize:16,fontWeight:800,color:C.text,flex:1,letterSpacing:"-0.3px"}}>
          {NAV.find(n=>n.id===section)?.label}
        </span>

        {/* Search toggle */}
        <button onClick={()=>setSearchOpen(!searchOpen)}
          style={{width:38,height:38,borderRadius:12,border:`1px solid ${searchOpen?C.borderHi:C.border}`,background:searchOpen?"rgba(124,58,237,0.2)":"rgba(124,58,237,0.08)",cursor:"pointer",fontSize:16,color:searchOpen?C.glow:C.textSub,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          ⌕
        </button>

        {/* View toggle */}
        <button onClick={()=>setView(v=>v==="grid"?"list":"grid")}
          style={{width:38,height:38,borderRadius:12,border:`1px solid ${C.border}`,background:"rgba(124,58,237,0.08)",cursor:"pointer",fontSize:16,color:C.textSub,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          {view==="grid"?"☰":"⊞"}
        </button>

        {/* Menu */}
        <button onClick={()=>setSidebar(true)}
          style={{width:38,height:38,borderRadius:12,border:`1px solid ${C.border}`,background:"rgba(124,58,237,0.08)",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,overflow:"hidden"}}>
          <div style={{width:28,height:28,borderRadius:9,background:C.gradHot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff"}}>
            {user[0]?.toUpperCase()}
          </div>
        </button>
      </header>

      {/* Search bar */}
      {searchOpen&&(
        <div style={{padding:"10px 16px",background:C.bg,borderBottom:`1px solid ${C.border}`,flexShrink:0,animation:"fadeUp 0.2s ease"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск файлов..." autoFocus
            style={{width:"100%",padding:"12px 16px",borderRadius:14,border:`1px solid ${C.borderHi}`,background:"rgba(124,58,237,0.08)",color:C.text,fontSize:15,outline:"none",boxSizing:"border-box"}}/>
        </div>
      )}

      {/* Upload progress */}
      {uploads.length>0&&(
        <div style={{padding:"8px 16px 0",flexShrink:0}}>
          {uploads.map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"rgba(124,58,237,0.1)",borderRadius:12,border:`1px solid ${C.border}`,marginBottom:4,animation:"fadeUp 0.2s ease"}}>
              <span style={{fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textSub}}>
                {u.error?"❌":u.done?"✓":""} {u.name}
              </span>
              {!u.done&&!u.error&&<>
                <div style={{width:80,height:3,borderRadius:3,background:"rgba(124,58,237,0.2)"}}>
                  <div style={{height:"100%",width:`${u.progress}%`,borderRadius:3,background:C.grad,transition:"width 0.15s"}}/>
                </div>
                <span style={{fontSize:11,color:C.textSub,width:28,textAlign:"right"}}>{u.progress}%</span>
              </>}
            </div>
          ))}
        </div>
      )}

      {/* ── FILE LIST ── */}
      <div
        onDragOver={e=>{e.preventDefault();setDrag(true);}}
        onDragLeave={()=>setDrag(false)}
        onDrop={onDrop}
        style={{flex:1,overflowY:"auto",padding:"16px 16px 100px"}}
      >
        {/* GRID — 2 колонки */}
        {view==="grid"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            {filtered.map(file=>{
              const fi=FILE_ICONS[file.type]||FILE_ICONS.default;
              return(
                <div key={file.id}
                  onClick={()=>setDetail(file)}
                  style={{borderRadius:18,border:`1px solid ${C.border}`,background:C.bg3,padding:14,cursor:"pointer",animation:"fadeUp 0.25s ease",active:{background:"rgba(124,58,237,0.2)"},WebkitTapHighlightColor:"transparent"}}
                  onTouchStart={e=>e.currentTarget.style.background="rgba(124,58,237,0.15)"}
                  onTouchEnd={e=>e.currentTarget.style.background=C.bg3}>
                  <div style={{width:"100%",aspectRatio:"1",borderRadius:14,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,overflow:"hidden",position:"relative",border:`1px solid ${C.border}`}}>
                    {file.thumb?<img src={file.thumb} alt={file.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:32}}>{fi.emoji}</span>}
                    {file.starred&&<span style={{position:"absolute",top:6,right:8,fontSize:12,color:C.glow}}>✦</span>}
                  </div>
                  <div style={{fontSize:13,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.text,marginBottom:4}}>{file.name}</div>
                  <div style={{fontSize:12,color:C.textSub}}>{formatSize(file.size)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* LIST */}
        {view==="list"&&(
          <div style={{display:"flex",flexDirection:"column",gap:4}}>
            {filtered.map(file=>{
              const fi=FILE_ICONS[file.type]||FILE_ICONS.default;
              return(
                <div key={file.id}
                  onClick={()=>setDetail(file)}
                  style={{display:"flex",alignItems:"center",gap:14,padding:"14px 14px",borderRadius:16,background:C.bg3,border:`1px solid ${C.border}`,cursor:"pointer",animation:"fadeUp 0.2s ease",WebkitTapHighlightColor:"transparent"}}
                  onTouchStart={e=>e.currentTarget.style.background="rgba(124,58,237,0.15)"}
                  onTouchEnd={e=>e.currentTarget.style.background=C.bg3}>
                  <div style={{width:48,height:48,borderRadius:14,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,border:`1px solid ${C.border}`,overflow:"hidden"}}>
                    {file.thumb?<img src={file.thumb} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:fi.emoji}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:14,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{file.name}</div>
                    <div style={{fontSize:12,color:C.textSub,marginTop:3}}>{formatSize(file.size)} · {formatDate(file.modified)}</div>
                  </div>
                  {file.starred&&<span style={{fontSize:13,color:C.glow,flexShrink:0}}>✦</span>}
                  <span style={{fontSize:18,color:C.textDim,flexShrink:0}}>›</span>
                </div>
              );
            })}
          </div>
        )}

        {!loading&&filtered.length===0&&(
          <div style={{textAlign:"center",padding:"60px 20px",animation:"fadeUp 0.4s ease"}}>
            <div style={{fontSize:52,marginBottom:16,opacity:0.2}}>⊘</div>
            <div style={{fontSize:17,fontWeight:700,color:C.textSub,marginBottom:8}}>Файлов нет</div>
            <div style={{fontSize:14,color:C.textDim}}>Нажми + чтобы загрузить</div>
          </div>
        )}
      </div>

      {/* ── FAB КНОПКА ЗАГРУЗКИ ── */}
      <button onClick={()=>fileRef.current?.click()}
        style={{position:"fixed",right:20,bottom:90,width:58,height:58,borderRadius:"50%",background:C.grad,border:"none",cursor:"pointer",fontSize:28,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 6px 24px rgba(124,58,237,0.6)",zIndex:100,WebkitTapHighlightColor:"transparent"}}
        onTouchStart={e=>{e.currentTarget.style.transform="scale(0.92)";e.currentTarget.style.boxShadow="0 4px 16px rgba(124,58,237,0.8)";}}
        onTouchEnd={e=>{e.currentTarget.style.transform="scale(1)";e.currentTarget.style.boxShadow="0 6px 24px rgba(124,58,237,0.6)";}}>
        +
      </button>
      <input ref={fileRef} type="file" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>

      {/* ── BOTTOM NAVIGATION ── */}
      <nav style={{position:"fixed",bottom:0,left:0,right:0,background:C.bg2,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",zIndex:99,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(item=>(
          <button key={item.id}
            onClick={()=>setSection(item.id)}
            style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"10px 4px 12px",border:"none",background:"transparent",cursor:"pointer",gap:4,WebkitTapHighlightColor:"transparent",transition:"all 0.15s"}}>
            <span style={{fontSize:20,color:section===item.id?C.bright:C.textDim,transition:"all 0.15s",filter:section===item.id?`drop-shadow(0 0 6px ${C.bright})`:"none"}}>{item.icon}</span>
            <span style={{fontSize:10,fontWeight:section===item.id?700:400,color:section===item.id?C.glow:C.textDim,transition:"all 0.15s",letterSpacing:"0.2px"}}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* TOAST */}
      {toast&&(
        <div style={{position:"fixed",bottom:90,left:"50%",transform:"translateX(-50%)",background:C.bg2,border:`1px solid ${toast.type==="err"?"rgba(232,121,249,0.3)":C.borderHi}`,borderRadius:14,padding:"12px 22px",fontSize:14,fontWeight:600,boxShadow:"0 8px 32px rgba(124,58,237,0.3)",zIndex:3000,animation:"toastPop 0.2s ease",color:toast.type==="err"?"#e879f9":C.glow,whiteSpace:"nowrap",maxWidth:"calc(100vw - 40px)",textAlign:"center"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );

  // ── DESKTOP LAYOUT ────────────────────────────────────────────
  return(
    <div style={{width:"100vw",height:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',sans-serif",display:"flex",overflow:"hidden",position:"fixed",top:0,left:0}}
      onClick={()=>{setCtx(null);setSel(null);}}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
        @keyframes toastPop{from{transform:translate(-50%,16px);opacity:0}to{transform:translate(-50%,0);opacity:1}}
        .fc{transition:all 0.18s ease;}
        .fc:hover{border-color:${C.borderHi}!important;background:rgba(124,58,237,0.12)!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(124,58,237,0.15)!important;}
        .nb:hover{background:rgba(124,58,237,0.12)!important;color:${C.glow}!important;}
        .act:hover{background:rgba(124,58,237,0.15)!important;border-color:${C.borderHi}!important;color:${C.glow}!important;}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(124,58,237,0.3);border-radius:4px}
        input::placeholder{color:${C.textDim};}
      `}</style>

      {rename&&<RenameModal file={rename} onClose={()=>setRename(null)} onSave={handleRename}/>}
      {share&&<ShareModal file={share} onClose={()=>setShare(null)}/>}

      {/* SIDEBAR */}
      <aside style={{width:230,flexShrink:0,background:C.bg2,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflowY:"auto",overflowX:"hidden"}}>
        <div style={{padding:"20px 16px 12px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{width:34,height:34,borderRadius:11,background:C.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,boxShadow:"0 4px 14px rgba(124,58,237,0.45)",flexShrink:0}}>☁</div>
            <span style={{fontSize:16,fontWeight:800,color:C.text,letterSpacing:"-0.4px"}}>CloudDrive</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",background:"rgba(124,58,237,0.1)",borderRadius:12,border:`1px solid ${C.border}`}}>
            <div style={{width:30,height:30,borderRadius:9,background:C.gradHot,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#fff",flexShrink:0,boxShadow:"0 2px 8px rgba(124,58,237,0.4)"}}>{user[0]?.toUpperCase()}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:13,fontWeight:600,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user}</div>
              <div style={{fontSize:10,color:C.textSub}}>{formatSize(totalUsed)} / 5 GB</div>
            </div>
            <button onClick={logout} style={{border:"none",background:"none",cursor:"pointer",fontSize:15,color:C.textDim,padding:4,borderRadius:7,transition:"all 0.2s",flexShrink:0}}
              onMouseEnter={e=>{e.currentTarget.style.color="#e879f9";e.currentTarget.style.background="rgba(192,38,211,0.12)";}}
              onMouseLeave={e=>{e.currentTarget.style.color=C.textDim;e.currentTarget.style.background="none";}}>⏻</button>
          </div>
        </div>

        <div style={{padding:"14px 12px 10px"}}>
          <button onClick={e=>{e.stopPropagation();fileRef.current?.click();}}
            style={{width:"100%",background:C.grad,color:"#fff",border:"none",borderRadius:12,padding:"11px",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,boxShadow:"0 4px 16px rgba(124,58,237,0.4)",transition:"all 0.2s"}}
            onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 6px 22px rgba(124,58,237,0.6)";e.currentTarget.style.transform="translateY(-1px)";}}
            onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 4px 16px rgba(124,58,237,0.4)";e.currentTarget.style.transform="none";}}>
            + Загрузить файл
          </button>
        </div>

        <nav style={{padding:"4px 10px",display:"flex",flexDirection:"column",gap:2}}>
          <div style={{fontSize:9,fontWeight:700,color:C.textDim,textTransform:"uppercase",letterSpacing:"1.2px",padding:"6px 8px"}}>Навигация</div>
          {NAV.map(item=>(
            <button key={item.id} className="nb"
              onClick={e=>{e.stopPropagation();setSection(item.id);}}
              style={{display:"flex",alignItems:"center",gap:10,padding:"10px",borderRadius:10,border:"none",cursor:"pointer",fontSize:13,fontWeight:section===item.id?600:400,background:section===item.id?"rgba(124,58,237,0.18)":"transparent",color:section===item.id?C.glow:C.textSub,textAlign:"left",width:"100%",transition:"all 0.15s"}}>
              <span style={{fontSize:14,width:18,textAlign:"center",opacity:section===item.id?1:0.6}}>{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {section===item.id&&<span style={{width:6,height:6,borderRadius:"50%",background:C.bright,boxShadow:`0 0 8px ${C.bright}`,flexShrink:0}}/>}
            </button>
          ))}
        </nav>

        <div style={{margin:"auto 12px 16px",padding:"14px",background:"rgba(124,58,237,0.07)",borderRadius:14,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,fontWeight:700,color:C.text}}>Хранилище</span>
            <span style={{fontSize:11,color:C.textSub,background:"rgba(124,58,237,0.15)",padding:"2px 8px",borderRadius:20,border:`1px solid ${C.border}`}}>{usedPct.toFixed(0)}%</span>
          </div>
          <div style={{height:5,borderRadius:5,background:"rgba(124,58,237,0.12)",overflow:"hidden",marginBottom:8}}>
            <div style={{height:"100%",width:`${usedPct}%`,borderRadius:5,background:usedPct>80?"linear-gradient(90deg,#a855f7,#e879f9)":C.grad,transition:"width 0.6s ease",boxShadow:`0 0 10px rgba(124,58,237,0.5)`}}/>
          </div>
          <div style={{fontSize:11,color:C.textSub}}>
            {usedPct>80&&<span style={{color:"#e879f9"}}>⚠ Мало места · </span>}
            {formatSize(totalUsed)} из 5 GB
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        <header style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderBottom:`1px solid ${C.border}`,background:C.bg,flexShrink:0}}>
          <div style={{position:"relative",flex:1,maxWidth:480}}>
            <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:13,color:C.textDim}}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск файлов..."
              style={{width:"100%",padding:"9px 14px 9px 34px",borderRadius:10,border:`1px solid ${C.border}`,background:"rgba(124,58,237,0.06)",color:C.text,fontSize:13,outline:"none",transition:"border-color 0.2s"}}
              onFocus={e=>e.target.style.borderColor=C.bright}
              onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",gap:3,background:"rgba(124,58,237,0.08)",borderRadius:10,padding:3,border:`1px solid ${C.border}`}}>
              {[["grid","⊞"],["list","☰"]].map(([v,icon])=>(
                <button key={v} onClick={()=>setView(v)}
                  style={{padding:"7px 12px",borderRadius:8,border:"none",cursor:"pointer",fontSize:14,background:view===v?"rgba(124,58,237,0.35)":"transparent",color:view===v?C.glow:C.textSub,transition:"all 0.15s",fontWeight:view===v?700:400}}>
                  {icon}
                </button>
              ))}
            </div>
            <button onClick={e=>{e.stopPropagation();fileRef.current?.click();}}
              style={{display:"flex",alignItems:"center",gap:6,padding:"8px 16px",borderRadius:10,border:`1px solid rgba(124,58,237,0.4)`,background:"rgba(124,58,237,0.15)",color:C.glow,cursor:"pointer",fontSize:13,fontWeight:600,transition:"all 0.2s",whiteSpace:"nowrap"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(124,58,237,0.28)"}
              onMouseLeave={e=>e.currentTarget.style.background="rgba(124,58,237,0.15)"}>
              ↑ Загрузить
            </button>
          </div>
        </header>
        <input ref={fileRef} type="file" multiple style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>

        {uploads.length>0&&(
          <div style={{padding:"8px 20px 0",flexShrink:0}}>
            {uploads.map(u=>(
              <div key={u.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 14px",background:"rgba(124,58,237,0.08)",borderRadius:10,border:`1px solid ${u.error?"rgba(232,121,249,0.3)":u.done?"rgba(168,85,247,0.3)":C.border}`,marginBottom:4,animation:"fadeUp 0.2s ease"}}>
                <span style={{fontSize:12,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textSub}}>{u.error?"❌":u.done?"✓":""} {u.name}</span>
                {!u.done&&!u.error&&<>
                  <div style={{width:100,height:3,borderRadius:3,background:"rgba(124,58,237,0.15)"}}>
                    <div style={{height:"100%",width:`${u.progress}%`,borderRadius:3,background:C.grad,transition:"width 0.15s"}}/>
                  </div>
                  <span style={{fontSize:11,color:C.textSub,width:30,textAlign:"right"}}>{u.progress}%</span>
                </>}
              </div>
            ))}
          </div>
        )}

        <div style={{display:"flex",flex:1,overflow:"hidden"}}>
          <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
            style={{flex:1,overflowY:"auto",padding:"20px",position:"relative"}}>

            {dragging&&(
              <div style={{position:"fixed",inset:0,zIndex:50,background:"rgba(124,58,237,0.1)",border:`2px dashed ${C.bright}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,backdropFilter:"blur(4px)"}}>
                <div style={{fontSize:48}}>⊕</div>
                <div style={{fontSize:22,fontWeight:800,color:C.bright}}>Отпусти для загрузки</div>
              </div>
            )}

            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
              <div>
                <h1 style={{fontSize:20,fontWeight:800,color:C.text,letterSpacing:"-0.4px"}}>{NAV.find(n=>n.id===section)?.label}</h1>
                <div style={{fontSize:12,color:C.textSub,marginTop:4}}>{loading?"⏳ Загрузка...":`${filtered.length} файлов`}</div>
              </div>
            </div>

            {view==="grid"&&(
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))",gap:12}}>
                {filtered.map(file=>{
                  const fi=FILE_ICONS[file.type]||FILE_ICONS.default;
                  return(
                    <div key={file.id} className="fc"
                      onClick={e=>{e.stopPropagation();setSel(file.id);setDetail(file);}}
                      onContextMenu={e=>{e.stopPropagation();e.preventDefault();setCtx({x:e.clientX,y:e.clientY,file});}}
                      style={{borderRadius:14,border:`1px solid ${selected===file.id?C.borderHi:C.border}`,background:selected===file.id?"rgba(124,58,237,0.15)":C.bg3,padding:14,cursor:"pointer",animation:"fadeUp 0.25s ease",boxShadow:selected===file.id?`0 6px 20px rgba(124,58,237,0.2)`:"none"}}>
                      <div style={{width:"100%",aspectRatio:"1.4",borderRadius:10,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12,overflow:"hidden",position:"relative",border:`1px solid ${C.border}`}}>
                        {file.thumb?<img src={file.thumb} alt={file.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:30}}>{fi.emoji}</span>}
                        {file.starred&&<span style={{position:"absolute",top:5,right:6,fontSize:10,color:C.glow}}>✦</span>}
                      </div>
                      <div style={{fontSize:12,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textSub,marginBottom:3}}>{file.name}</div>
                      <div style={{fontSize:11,color:C.textDim}}>{formatSize(file.size)}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {view==="list"&&(
              <div style={{display:"flex",flexDirection:"column",gap:2}}>
                {filtered.map(file=>{
                  const fi=FILE_ICONS[file.type]||FILE_ICONS.default;
                  return(
                    <div key={file.id}
                      onClick={e=>{e.stopPropagation();setSel(file.id);setDetail(file);}}
                      onContextMenu={e=>{e.stopPropagation();e.preventDefault();setCtx({x:e.clientX,y:e.clientY,file});}}
                      style={{display:"grid",gridTemplateColumns:"2fr 90px 90px 100px",gap:8,padding:"10px 14px",borderRadius:10,border:`1px solid ${selected===file.id?C.borderHi:"transparent"}`,background:selected===file.id?"rgba(124,58,237,0.12)":"transparent",cursor:"pointer",alignItems:"center",transition:"all 0.12s"}}
                      onMouseEnter={e=>{if(selected!==file.id)e.currentTarget.style.background="rgba(124,58,237,0.06)";}}
                      onMouseLeave={e=>{if(selected!==file.id)e.currentTarget.style.background="transparent";}}>
                      <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                        <span style={{width:34,height:34,borderRadius:9,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>{fi.emoji}</span>
                        <span style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:C.textSub}}>{file.name}</span>
                      </div>
                      <span style={{fontSize:12,color:C.textDim,textTransform:"capitalize"}}>{file.type}</span>
                      <span style={{fontSize:12,color:C.textDim}}>{formatSize(file.size)}</span>
                      <span style={{fontSize:12,color:C.textDim}}>{formatDate(file.modified)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading&&filtered.length===0&&(
              <div style={{textAlign:"center",padding:"80px 20px",animation:"fadeUp 0.4s ease"}}>
                <div style={{fontSize:52,marginBottom:16,opacity:0.2}}>⊘</div>
                <div style={{fontSize:16,fontWeight:700,color:C.textSub,marginBottom:8}}>Файлов нет</div>
                <div style={{fontSize:13,color:C.textDim}}>{section==="all"?"Загрузи первый файл":"Ничего не найдено"}</div>
              </div>
            )}
          </div>

          {/* Desktop detail */}
          {detail&&(
            <aside style={{width:260,background:C.bg2,borderLeft:`1px solid ${C.border}`,display:"flex",flexDirection:"column",overflowY:"auto",flexShrink:0,animation:"fadeUp 0.2s ease"}}>
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.bg2,zIndex:1}}>
                <span style={{fontSize:12,fontWeight:700,color:C.textSub,textTransform:"uppercase",letterSpacing:"0.8px"}}>Детали</span>
                <button onClick={()=>setDetail(null)} style={{border:"none",background:"rgba(124,58,237,0.12)",borderRadius:7,width:26,height:26,cursor:"pointer",fontSize:13,color:C.textSub,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
              </div>
              <div style={{padding:16,display:"flex",flexDirection:"column",gap:14}}>
                {(()=>{
                  const fi=FILE_ICONS[detail.type]||FILE_ICONS.default;
                  return<>
                    <div style={{width:"100%",aspectRatio:"1.4",borderRadius:12,background:fi.bg,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden",border:`1px solid ${C.border}`}}>
                      {detail.thumb?<img src={detail.thumb} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:44}}>{fi.emoji}</span>}
                    </div>
                    <div style={{padding:"12px",background:"rgba(124,58,237,0.06)",borderRadius:12,border:`1px solid ${C.border}`}}>
                      <div style={{fontSize:13,fontWeight:600,color:C.text,wordBreak:"break-word",lineHeight:1.5,marginBottom:4}}>{detail.name}</div>
                      <div style={{fontSize:11,color:C.textSub}}>{detail.type.toUpperCase()} · {formatSize(detail.size)}</div>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {[
                        {icon:"↓",label:"Скачать файл",action:()=>downloadFile(detail)},
                        {icon:"✎",label:"Переименовать",action:()=>setRename(detail)},
                        {icon:"⊹",label:"Поделиться",action:()=>setShare(detail)},
                        {icon:detail.starred?"✦":"✧",label:detail.starred?"Убрать из избранного":"В избранное",action:()=>toggleStar(detail.id)},
                      ].map(btn=>(
                        <button key={btn.label} className="act" onClick={btn.action}
                          style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:`1px solid ${C.border}`,background:"rgba(124,58,237,0.05)",color:C.textSub,cursor:"pointer",fontSize:13,fontWeight:500,textAlign:"left",transition:"all 0.15s"}}>
                          <span style={{width:16,textAlign:"center",color:C.primary}}>{btn.icon}</span>{btn.label}
                        </button>
                      ))}
                      <button onClick={()=>deleteFile(detail.id)}
                        style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,border:"1px solid rgba(192,38,211,0.2)",background:"rgba(192,38,211,0.05)",color:"rgba(192,38,211,0.5)",cursor:"pointer",fontSize:13,fontWeight:500,transition:"all 0.15s"}}
                        onMouseEnter={e=>{e.currentTarget.style.background="rgba(192,38,211,0.12)";e.currentTarget.style.color="#e879f9";}}
                        onMouseLeave={e=>{e.currentTarget.style.background="rgba(192,38,211,0.05)";e.currentTarget.style.color="rgba(192,38,211,0.5)";}}>
                        <span style={{width:16,textAlign:"center"}}>⊘</span>Удалить файл
                      </button>
                    </div>
                  </>;
                })()}
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Desktop context menu */}
      {ctxMenu&&(
        <div onClick={e=>e.stopPropagation()}
          style={{position:"fixed",top:Math.min(ctxMenu.y,window.innerHeight-280),left:Math.min(ctxMenu.x,window.innerWidth-215),zIndex:1000,background:C.bg2,border:`1px solid ${C.borderHi}`,borderRadius:14,boxShadow:"0 16px 48px rgba(124,58,237,0.25)",padding:5,minWidth:200,animation:"fadeUp 0.12s ease"}}>
          <div style={{fontSize:11,color:C.textDim,padding:"7px 12px 6px",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontWeight:600,borderBottom:`1px solid ${C.border}`,marginBottom:4}}>{ctxMenu.file.name}</div>
          {[
            {icon:"↓",label:"Скачать",action:()=>{downloadFile(ctxMenu.file);setCtx(null);}},
            {icon:"✎",label:"Переименовать",action:()=>{setRename(ctxMenu.file);setCtx(null);}},
            {icon:"⊹",label:"Поделиться",action:()=>{setShare(ctxMenu.file);setCtx(null);}},
            {icon:ctxMenu.file.starred?"✦":"✧",label:ctxMenu.file.starred?"Убрать из избранного":"В избранное",action:()=>{toggleStar(ctxMenu.file.id);setCtx(null);}},
            null,
            {icon:"⊘",label:"Удалить",action:()=>deleteFile(ctxMenu.file.id),danger:true},
          ].map((item,i)=>item===null
            ?<div key={i} style={{height:1,background:C.border,margin:"4px 0"}}/>
            :<button key={item.label} onClick={item.action}
              style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:9,border:"none",background:"transparent",color:item.danger?"rgba(232,121,249,0.4)":C.textSub,cursor:"pointer",fontSize:13,width:"100%",textAlign:"left",transition:"all 0.1s"}}
              onMouseEnter={e=>{e.currentTarget.style.background=item.danger?"rgba(192,38,211,0.1)":"rgba(124,58,237,0.12)";e.currentTarget.style.color=item.danger?"#e879f9":C.glow;}}
              onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=item.danger?"rgba(232,121,249,0.4)":C.textSub;}}>
              <span style={{width:16,textAlign:"center",color:item.danger?"rgba(232,121,249,0.5)":C.primary}}>{item.icon}</span>{item.label}
            </button>
          )}
        </div>
      )}

      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:C.bg2,border:`1px solid ${toast.type==="err"?"rgba(232,121,249,0.3)":C.borderHi}`,borderRadius:12,padding:"11px 22px",fontSize:13,fontWeight:600,boxShadow:"0 8px 32px rgba(124,58,237,0.3)",zIndex:3000,animation:"toastPop 0.2s ease",color:toast.type==="err"?"#e879f9":C.glow,whiteSpace:"nowrap",maxWidth:"calc(100vw - 40px)",textAlign:"center"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
