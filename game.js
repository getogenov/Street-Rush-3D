import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.querySelector("#game");
const speedEl=document.querySelector("#speed"),timeEl=document.querySelector("#time");
const menu=document.querySelector("#menu"),finish=document.querySelector("#finish"),result=document.querySelector("#result");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x08090d);
scene.fog=new THREE.Fog(0x08090d,25,130);

const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180);
camera.position.set(0,4.2,9);
camera.lookAt(0,1,-20);

const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace;

scene.add(new THREE.HemisphereLight(0x8899ff,0x202020,2));
const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(5,10,6);scene.add(sun);

const road=new THREE.Mesh(new THREE.PlaneGeometry(14,220),new THREE.MeshStandardMaterial({color:0x20232a,roughness:.9}));
road.rotation.x=-Math.PI/2;road.position.set(0,-.7,-50);scene.add(road);

const lines=[];
for(let i=0;i<30;i++){
  const line=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,4),new THREE.MeshBasicMaterial({color:0xffffff}));
  line.position.set(0,-.67,-i*7);scene.add(line);lines.push(line);
}

function box(w,h,d,color){
  return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.55,metalness:.15}));
}

function makeCar(color=0xe9e9ee){
  const car=new THREE.Group();
  const base=box(1.55,.45,3.1,color);base.position.y=0;car.add(base);
  const cabin=box(1.18,.5,1.55,0x1b2332);cabin.position.set(0,.45,-.15);car.add(cabin);
  const bumper=box(1.5,.18,.25,color);bumper.position.set(0,-.05,-1.63);car.add(bumper);
  for(const x of [-.82,.82]) for(const z of [-1.05,1.05]){
    const w=box(.18,.42,.55,0x090a0d);w.position.set(x,-.12,z);car.add(w);
  }
  const light=box(.38,.16,.12,0xffe9b0);light.position.set(-.48,.08,-1.62);car.add(light);
  const light2=light.clone();light2.position.x=.48;car.add(light2);
  return car;
}

const player=makeCar(0x2de1ff);
player.position.set(0,.15,3);
scene.add(player);

const city=new THREE.Group();
for(let i=0;i<50;i++){
  for(const side of [-1,1]){
    const h=2+Math.random()*9,w=2+Math.random()*3;
    const b=box(w,h,5,Math.random()>.5?0x171a24:0x202330);
    b.position.set(side*(10+Math.random()*6),h/2-0.7,-i*7-15);
    city.add(b);
    for(let k=0;k<3;k++){
      const win=box(.08,.08,.08,0xffc857);
      win.position.set(b.position.x-side*(w/2+.05),2+k*1.5,b.position.z+(Math.random()-.5)*2);
      city.add(win);
    }
  }
}
scene.add(city);

const traffic=[];
function spawnTraffic(){
  const lanes=[-4,-2,2,4];
  const c=makeCar([0xff4747,0xffc13b,0x9b7cff,0x55e36d][Math.floor(Math.random()*4)]);
  c.scale.set(.85,.85,.85);
  c.position.set(lanes[Math.floor(Math.random()*lanes.length)],.15,-95);
  scene.add(c);traffic.push(c);
}

let running=false,elapsed=0,speed=0,playerX=0;
const keys={left:false,right:false,gas:false,brake:false};

function startGame(){
  traffic.splice(0).forEach(x=>scene.remove(x));
  elapsed=0;speed=0;playerX=0;player.position.x=0;running=true;
  menu.classList.add("hidden");finish.classList.add("hidden");
}

function endGame(){
  running=false;result.textContent=elapsed.toFixed(1);finish.classList.remove("hidden");
}

function setKey(k,v){keys[k]=v}

addEventListener("keydown",e=>{
  if(e.key==="a"||e.key==="ArrowLeft")setKey("left",true);
  if(e.key==="d"||e.key==="ArrowRight")setKey("right",true);
  if(e.key==="w"||e.key==="ArrowUp")setKey("gas",true);
  if(e.key==="s"||e.key==="ArrowDown")setKey("brake",true);
  if(e.code==="Space")setKey("brake",true);
  if(e.key.toLowerCase()==="h")document.body.classList.toggle("ui-hidden");
});
addEventListener("keyup",e=>{
  if(e.key==="a"||e.key==="ArrowLeft")setKey("left",false);
  if(e.key==="d"||e.key==="ArrowRight")setKey("right",false);
  if(e.key==="w"||e.key==="ArrowUp")setKey("gas",false);
  if(e.key==="s"||e.key==="ArrowDown"||e.code==="Space")setKey("brake",false);
});

document.querySelectorAll("[data-key]").forEach(btn=>{
  const k=btn.dataset.key;
  btn.addEventListener("pointerdown",e=>{e.preventDefault();setKey(k,true)});
  btn.addEventListener("pointerup",()=>setKey(k,false));
  btn.addEventListener("pointercancel",()=>setKey(k,false));
  btn.addEventListener("pointerleave",()=>setKey(k,false));
});
document.querySelector("#start").onclick=startGame;
document.querySelector("#again").onclick=startGame;
document.querySelector("#hideUI").onclick=()=>document.body.classList.toggle("ui-hidden");
document.querySelector("#restore").onclick=()=>document.body.classList.toggle("ui-hidden");

let spawn=1,last=performance.now();
function update(dt){
  for(const l of lines){l.position.z+=speed*dt;if(l.position.z>8)l.position.z-=210}
  for(const b of city.children){b.position.z+=speed*dt;if(b.position.z>15)b.position.z-=350}

  if(!running)return;
  elapsed+=dt;
  const targetSpeed=keys.gas?28:18;
  speed+=(targetSpeed-speed)*dt*2;
  if(keys.brake)speed*=Math.max(0,1-dt*3);
  if(keys.left)playerX-=dt*6;
  if(keys.right)playerX+=dt*6;
  playerX=Math.max(-5,Math.min(5,playerX));
  player.position.x+=(playerX-player.position.x)*dt*9;
  player.rotation.z=(playerX-player.position.x)*-.08;

  spawn-=dt;
  if(spawn<=0){spawnTraffic();spawn=Math.max(.45,1.15-elapsed*.006)}
  for(let i=traffic.length-1;i>=0;i--){
    const c=traffic[i];c.position.z+=speed*dt;
    if(c.position.z>12){scene.remove(c);traffic.splice(i,1);continue}
    const a=new THREE.Box3().setFromObject(player),b=new THREE.Box3().setFromObject(c);
    if(a.intersectsBox(b)){endGame();return}
  }
  timeEl.textContent=elapsed.toFixed(1);
  speedEl.textContent=Math.round(speed*4);
}

function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;
  update(dt);renderer.render(scene,camera);requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

addEventListener("resize",()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));
});
