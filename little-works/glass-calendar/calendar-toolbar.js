// Organize controls by intent: page appearance in header; date navigation within calendar.
// Preserve original IDs and event listeners by moving nodes, not recreating buttons.
const head=document.querySelector(".calheader");
const previous=document.getElementById("prev");
const next=document.getElementById("next");
const segmented=head?.querySelector("lg-segmented");
if(head&&previous&&next&&segmented){
 const group=document.createElement("div");
 group.className="calendar-controls";
 group.setAttribute("role","group");
 group.setAttribute("aria-label","日期与视图导航");
 const nav=document.createElement("div");
 nav.className="calendar-nav";
 nav.setAttribute("role","group");
 nav.setAttribute("aria-label","切换日期");
 previous.textContent="‹";
 next.textContent="›";
 nav.append(previous,next);
 group.append(nav,segmented);
 head.append(group);
}
