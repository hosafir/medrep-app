export function Modal({title,subtitle,children,onClose,actions=[]}){
  return(
    <div className="ov" onMouseDown={onClose}>
      <div className="mo" onMouseDown={e=>e.stopPropagation()}>
        <div className="mo-t">{title}</div>
        {subtitle&&<div className="mo-s">{subtitle}</div>}
        {children}
        <div className="mo-f">
          {actions.map((a,i)=><button key={i} className={`btn ${a.kind==="p"?"btn-p":a.kind==="blue"?"btn-blue":a.kind==="rose"?"btn-rose":"btn-g"}`} onClick={a.onClick} disabled={a.disabled}>{a.label}</button>)}
        </div>
      </div>
    </div>
  );
}
