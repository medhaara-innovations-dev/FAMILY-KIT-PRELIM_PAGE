import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CalendarPlus, House, UsersRound, Plus, LayoutGrid, CreditCard } from "lucide-react";
import "./EventsCalendarPage.css";

const dateParts = new Intl.DateTimeFormat("en-GB", {timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"});
const monthTitle = new Intl.DateTimeFormat("en-GB", {timeZone:"UTC",month:"long",year:"numeric"});
function istToday() {
  const p = Object.fromEntries(dateParts.formatToParts(new Date()).filter(x=>x.type!=="literal").map(x=>[x.type,Number(x.value)]));
  return {year:p.year,month:p.month-1,day:p.day};
}
const keyOf = d => d.year*12+d.month;
function BottomItem({Icon,label,active,onClick}) {return <button type="button" className={`fk-events-nav-item ${active?"active":""}`} onClick={onClick} disabled={!onClick} aria-current={active ? "page" : undefined}><span className="fk-events-nav-icon"><Icon size={20} strokeWidth={1.8}/></span><span>{label}</span></button>}
export default function EventsCalendarPage(){
  const navigate=useNavigate();
  const [today,setToday]=useState(istToday);
  const [displayMonth,setDisplayMonth]=useState(()=>keyOf(istToday()));
  const [followingToday,setFollowingToday]=useState(true);
  const [filter,setFilter]=useState("All");
  useEffect(()=>{
    const refresh=()=>setToday(previous=>{
      const next=istToday();
      return next.year===previous.year&&next.month===previous.month&&next.day===previous.day?previous:next;
    });
    const timer=window.setInterval(refresh,15000);
    window.addEventListener("focus",refresh);
    document.addEventListener("visibilitychange",refresh);
    return ()=>{window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh)};
  },[]);
  useEffect(()=>{if(followingToday)setDisplayMonth(keyOf(today))},[today,followingToday]);
  const year=Math.floor(displayMonth/12),month=((displayMonth%12)+12)%12;
  const first=new Date(Date.UTC(year,month,1)).getUTCDay();
  const days=new Date(Date.UTC(year,month+1,0)).getUTCDate();
  const cells=Array.from({length:Math.ceil((first+days)/7)*7},(_,i)=>{const d=i-first+1;return d>=1&&d<=days?d:null});
  function changeMonth(delta){setFollowingToday(false);setDisplayMonth(value=>value+delta)}
  return <div className="fk-events-page">
    <main className="fk-events-content">
      <div className="fk-events-heading"><button type="button" aria-label="Back to Categories" onClick={()=>navigate("/categories")}><ChevronLeft size={19}/></button><h1>Calendar</h1></div>
      <section className="fk-events-calendar" aria-label="Events calendar">
        <header className="fk-events-calendar-header">
          <button type="button" aria-label="Previous month" onClick={()=>changeMonth(-1)}><ChevronLeft size={19}/></button>
          <h2>{monthTitle.format(new Date(Date.UTC(year,month,1)))}</h2>
          <button type="button" aria-label="Next month" onClick={()=>changeMonth(1)}><ChevronRight size={19}/></button>
        </header>
        <div className="fk-events-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><span key={d}>{d}</span>)}</div>
        <div className="fk-events-days">{cells.map((day,i)=><div className="fk-events-day-cell" key={i}>{day!==null&&<span className={`fk-events-day ${year===today.year&&month===today.month&&day===today.day?"today":""}`} aria-current={year===today.year&&month===today.month&&day===today.day?"date":undefined}>{day}</span>}</div>)}</div>
      </section>
      <button className="fk-events-create" type="button" onClick={()=>{ /* Event creation will be connected in the next step */ }}><CalendarPlus size={17}/>Create a New Event</button>
      <div className="fk-events-filters" role="group" aria-label="Event type">{["All","Reminders","Special events"].map(f=><button type="button" key={f} className={filter===f?"selected":""} aria-pressed={filter===f} onClick={()=>setFilter(f)}>{f}</button>)}</div>
      <p className="fk-events-empty">No events Created</p>
    </main>
    <nav className="fk-events-bottom-nav" aria-label="Dashboard navigation">
      <BottomItem Icon={House} label="Home" onClick={()=>navigate("/my-family")}/>
      <BottomItem Icon={UsersRound} label="My Family" onClick={()=>navigate("/family")}/>
      <button type="button" className="fk-events-nav-add" aria-label="Add family member" onClick={()=>navigate("/family/add")}><Plus size={30}/></button>
      <BottomItem Icon={LayoutGrid} label="Category" onClick={()=>navigate("/categories")}/>
      <BottomItem Icon={CreditCard} label="Pay & Renew"/>
    </nav>
  </div>
}
