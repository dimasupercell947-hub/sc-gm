/* A compact, dependency-free pseudo-3D driving renderer. */
const canvas = document.querySelector('#drive-canvas');
const ctx = canvas.getContext('2d');
const $ = (s) => document.querySelector(s);
const ui = { speed: $('#speed'), gear: $('#gear'), traction: $('#traction'), distance: $('#distance'), rpm: $('#rpm-bars'), toast: $('#toast'), paused: $('#paused') };
const input = Object.create(null);
const state = { speed: 0, steering: 0, roadOffset: 0, distance: 2.4, paused: false, elapsed: 0, last: 0, flash: 0 };
const traffic = [{ lane:-.48, z:.32, hue: 3 }, { lane:.36, z:.68, hue: 198 }, { lane:-.12, z:.88, hue: 42 }];
for (let i=0;i<12;i++) { const b=document.createElement('i'); ui.rpm.append(b); }
function resize(){ canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0); }
addEventListener('resize',resize); resize();
addEventListener('keydown',(e)=>{ input[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape')togglePause(); });
addEventListener('keyup',(e)=> input[e.code]=false);
$('#pause-button').addEventListener('click',togglePause);
function togglePause(){ state.paused=!state.paused;ui.paused.classList.toggle('show',state.paused); }
function polygon(points, fill){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function lerp(a,b,t){return a+(b-a)*t;}
function roadX(y){ const h=innerHeight, horizon=h*.39; const t=Math.max(0,(y-horizon)/(h-horizon)); return innerWidth*.5 + state.steering*innerWidth*.22*t*t + Math.sin(state.roadOffset*.004+y*.006)*innerWidth*.025*t; }
function drawMountain(base, color, points){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,base);for(let x=-20;x<=innerWidth+30;x+=30){const n=Math.sin(x*.011+points)*36+Math.sin(x*.028+points*4)*22;ctx.lineTo(x,base-n);}ctx.lineTo(innerWidth,base);ctx.fill();}
function drawWorld(){ const w=innerWidth,h=innerHeight,hor=h*.39; const sky=ctx.createLinearGradient(0,0,0,hor);sky.addColorStop(0,'#07151d');sky.addColorStop(.58,'#183341');sky.addColorStop(1,'#826558');ctx.fillStyle=sky;ctx.fillRect(0,0,w,hor+4);
  // Moon and haze
  ctx.fillStyle='rgba(230,242,225,.9)';ctx.beginPath();ctx.arc(w*.76,h*.17,30,0,7);ctx.fill();ctx.fillStyle='rgba(255,195,135,.10)';ctx.fillRect(0,hor-10,w,42);
  drawMountain(h*.42,'#14272c',1);drawMountain(h*.45,'#0c1e25',5);
  ctx.fillStyle='#19332f';ctx.fillRect(0,hor,w,h-hor);
  // road surface perspective
  polygon([[roadX(hor)-w*.04,hor],[roadX(hor)+w*.04,hor],[roadX(h)+w*.73,h],[roadX(h)-w*.73,h]],'#1b2528');
  for(let z=0;z<1;z+=.04){let y=lerp(hor,h,z*z), y2=lerp(hor,h,(z+.04)*(z+.04)), c=Math.floor(30+z*12); polygon([[roadX(y)-w*(.04+.69*z),y],[roadX(y)+w*(.04+.69*z),y],[roadX(y2)+w*(.04+.69*(z+.04)),y2],[roadX(y2)-w*(.04+.69*(z+.04)),y2]],`rgb(${c},${c+8},${c+9})`);}
  // edge and lane marks
  for(let i=0;i<28;i++){const z=((i*.09+state.roadOffset*.001)%1);if(z<.1)continue;const y=lerp(hor,h,z*z), len=4+z*z*45, width=1+z*8, center=roadX(y); [-.67,0,.67].forEach((lane,index)=>{if(index===1 && i%2) return; const x=center+lane*w*(.04+.69*z);ctx.fillStyle=index===1?'#dfe5d6':'#f3f0d5';ctx.fillRect(x-width/2,y,width,len);}); }
  // roadside poles
  for(let i=0;i<16;i++){const z=((i*.075+state.roadOffset*.00075)%1),y=lerp(hor,h,z*z), span=w*(.05+.72*z),cx=roadX(y);[-1,1].forEach(side=>{ctx.strokeStyle='rgba(210,224,211,.6)';ctx.lineWidth=1+z*2;ctx.beginPath();ctx.moveTo(cx+side*span,y);ctx.lineTo(cx+side*(span+10+z*30),y-10-z*55);ctx.stroke();ctx.fillStyle='#d0ff5e';ctx.beginPath();ctx.arc(cx+side*(span+10+z*30),y-10-z*55,1+z*2,0,7);ctx.fill();}); }
}
function drawCar(lane,z,hue){const h=innerHeight,y=lerp(h*.40,h,z*z),s=.12+z*z*.68,x=roadX(y)+lane*innerWidth*(.04+.64*z),cw=90*s,ch=55*s;ctx.save();ctx.translate(x,y);ctx.shadowBlur=20*s;ctx.shadowColor='#ff2d1b';ctx.fillStyle='#ec3e2c';ctx.fillRect(-cw*.38,ch*.38,cw*.18,ch*.05);ctx.fillRect(cw*.20,ch*.38,cw*.18,ch*.05);ctx.shadowBlur=0;polygon([[-cw*.48,ch*.35],[-cw*.37,-ch*.25],[-cw*.2,-ch*.52],[cw*.22,-ch*.52],[cw*.48,ch*.35]],`hsl(${hue}, 50%, ${34+z*14}%)`);ctx.fillStyle='rgba(143,210,228,.7)';polygon([[-cw*.22,-ch*.42],[cw*.15,-ch*.42],[cw*.26,-ch*.05],[-cw*.30,-ch*.05]],'rgba(120,184,205,.55)');ctx.fillStyle='#090d10';ctx.fillRect(-cw*.5,ch*.25,cw,ch*.23);ctx.restore();}
function drawCockpit(){const w=innerWidth,h=innerHeight; const g=ctx.createLinearGradient(0,h*.78,0,h);g.addColorStop(0,'rgba(4,10,13,0)');g.addColorStop(.45,'rgba(2,7,10,.74)');g.addColorStop(1,'#010405');ctx.fillStyle=g;ctx.fillRect(0,h*.72,w,h*.28);ctx.strokeStyle='rgba(29,43,44,.9)';ctx.lineWidth=18;ctx.beginPath();ctx.arc(w*.5,h*1.08,w*.27,Math.PI*1.16,Math.PI*1.84);ctx.stroke(); }
function updateUI(){const sp=Math.round(state.speed);ui.speed.textContent=String(sp).padStart(3,'0');ui.gear.textContent=sp<2?'N':sp<45?'1':sp<82?'2':sp<125?'3':'4';ui.traction.textContent=`${Math.max(76,99-Math.round(Math.abs(state.steering)*22))}%`;ui.distance.textContent=`${Math.max(0,state.distance).toFixed(1)} KM`;[...ui.rpm.children].forEach((b,i)=>b.className=i<Math.ceil(state.speed/14)?(i>9?'active red':'active'):'' );}
function frame(t){const dt=Math.min(.04,(t-state.last||0)/1000);state.last=t;if(!state.paused){const throttle=input.KeyW||input.ArrowUp,brake=input.KeyS||input.ArrowDown;state.speed+= (throttle?55:0)*dt-(brake?105:0)*dt-(input.Space?95:0)*dt-9*dt;state.speed=Math.max(0,Math.min(168,state.speed));const turn=(input.KeyA||input.ArrowLeft?-1:0)+(input.KeyD||input.ArrowRight?1:0);state.steering=lerp(state.steering,turn*.72,dt*4);state.roadOffset+=state.speed*dt;state.distance-=state.speed*dt/3600;traffic.forEach(c=>{c.z-=dt*(state.speed/245);if(c.z<.13){c.z=.98;c.lane=(Math.random()-.5)*.85;} });if(state.speed>3&&Math.random()<.002){ui.toast.textContent='CLEAN APEX +50';ui.toast.classList.add('show');setTimeout(()=>ui.toast.classList.remove('show'),1500);}updateUI();}ctx.clearRect(0,0,innerWidth,innerHeight);drawWorld();traffic.sort((a,b)=>a.z-b.z).forEach(c=>drawCar(c.lane,c.z,c.hue));drawCockpit();requestAnimationFrame(frame);}
requestAnimationFrame(frame);
