import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const canvas=document.querySelector("#game");
const speedEl=document.querySelector("#speed"),timeEl=document.querySelector("#time");
const coinsEl=document.querySelector("#coins"),shopCoinsEl=document.querySelector("#shopCoins"),runCoinsEl=document.querySelector("#runCoins");
const menu=document.querySelector("#menu"),finish=document.querySelector("#finish"),pausePanel=document.querySelector("#pause"),shop=document.querySelector("#shop");
const result=document.querySelector("#result");
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x08090d); scene.fog=new THREE.Fog(0x08090d,25,130);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,180); camera.position.set(0,4.2,9); camera.lookAt(0,1,-20);
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(innerWidth,innerHeight); renderer.outputColorSpace=THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0x8899ff,0x202020,2)); const sun=new THREE.DirectionalLight(0xffffff,2.2);sun.position.set(5,10,6);scene.add(sun);

const road=new THREE.Mesh(new THREE.PlaneGeometry(14,220),new THREE.MeshStandardMaterial({color:0x20232a,roughness:.9})); road.rotation.x=-Math.PI/2; road.position.set(0,-.7,-50);scene.add(road);
const lines=[]; for(let i=0;i<30;i++){const line=new THREE.Mesh(new THREE.BoxGeometry(.12,.02,4),new THREE.MeshBasicMaterial({color:0xffffff}));line.position.set(0,-.67,-i*7);scene.add(line);lines.push(line)}
function box(w,h,d,color,metalness=.15,roughness=.55){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness,metalness}));return m}

// Six visual tiers matching the rarity progression from the generated reference.
const skins=[
 {id:"common",name:"Городской",rarity:"обычный",cost:0,color:0x8d969f,bonus:0,shape:"street"},
 {id:"rare",name:"Neon Blue",rarity:"редкая",cost:80,color:0x168cff,bonus:.05,shape:"street"},
 {id:"veryrare",name:"Violet X",rarity:"очень редкая",cost:180,color:0x9b42ff,bonus:.10,shape:"sport"},
 {id:"epic",name:"Gold Rush",rarity:"эпическая",cost:350,color:0xffb21c,bonus:.15,shape:"sport"},
 {id:"mythic",name:"Crimson Beast",rarity:"мифическая",cost:650,color:0xff254d,bonus:.20,shape:"super"},
 {id:"legendary",name:"Legend",rarity:"легендарная",cost:1000,color:0xffd21f,bonus:.25,shape:"hyper"}
];
const saveKey="streetRush3D_profile_v3";
let profile={coins:0,owned:["common"],selected:"common"};
try{profile={...profile,...JSON.parse(localStorage.getItem(saveKey)||"{}")}}catch{}
// Migrate old saves without deleting their coins.
if(profile.owned?.includes("cyan")){profile.owned=profile.owned.filter(id=>id!=="cyan");profile.owned.unshift("common");if(profile.selected==="cyan")profile.selected="common"}
profile.owned=[...new Set((profile.owned||[]).filter(id=>skins.some(s=>s.id===id)))]; if(!profile.owned.includes("common"))profile.owned.unshift("common"); if(!skins.some(s=>s.id===profile.selected))profile.selected="common";
function saveProfile(){localStorage.setItem(saveKey,JSON.stringify(profile));coinsEl.textContent=profile.coins;shopCoinsEl.textContent=profile.coins}
saveProfile();

function makeCar(skin){
 const car=new THREE.Group(); const c=skin.color;
 const sport=skin.shape!=="street", hyper=skin.shape==="hyper"||skin.shape==="super";
 const base=box(sport?1.65:1.55,sport?.38:.45,sport?3.25:3.1,c,.35,.35);base.userData.skin=true;car.add(base);
 const cabin=box(sport?1.12:1.18,sport?.42:.5,sport?1.5:1.55,0x172131,.3,.2);cabin.position.set(0,sport?.42:.45,-.15);car.add(cabin);
 if(sport){const nose=box(1.25,.16,.55,c,.4,.3);nose.userData.skin=true;nose.position.set(0,.02,-1.63);car.add(nose)}
 const bumper=box(1.5,.18,.25,c,.35,.3);bumper.userData.skin=true;bumper.position.set(0,-.05,-1.63);car.add(bumper);
 if(hyper){for(const x of [-.67,.67]){const fin=box(.08,.35,.65,c,.45,.28);fin.userData.skin=true;fin.position.set(x,.25,.65);fin.rotation.z=x>0?-.18:.18;car.add(fin)}}
 for(const x of [-.82,.82])for(const z of [-1.05,1.05]){const w=box(.18,.42,.55,0x090a0d,.1,.8);w.position.set(x,-.12,z);car.add(w)}
 for(const x of [-.48,.48]){const light=box(.38,.16,.12,0xffe9b0,.1,.3);light.position.set(x,.08,-1.62);car.add(light)}
 return car;
}
let player=makeCar(skins.find(s=>s.id===profile.selected)||skins[0]); player.position.set(0,.15,3);scene.add(player);
function applySkin(){const skin=skins.find(s=>s.id===profile.selected)||skins[0]; player.traverse(o=>{if(o.isMesh&&o.userData.skin&&o.material?.color)o.material.color.setHex(skin.color)})}

const city=new THREE.Group();
for(let i=0;i<50;i++)for(const side of [-1,1]){const h=2+Math.random()*9,w=2+Math.random()*3;const b=box(w,h,5,Math.random()>.5?0x171a24:0x202330);b.position.set(side*(10+Math.random()*6),h/2-.7,-i*7-15);city.add(b);for(let k=0;k<3;k++){const win=box(.08,.08,.08,0xffc857);win.position.set(b.position.x-side*(w/2+.05),2+k*1.5,b.position.z+(Math.random()-.5)*2);city.add(win)}}
scene.add(city);
const traffic=[],obstacles=[],coins=[],boosts=[],lanes=[-4,-2,2,4];
function spawnTraffic(){const c=makeCar(skins[Math.floor(Math.random()*skins.length)]);c.scale.set(.85,.85,.85);c.position.set(lanes[Math.floor(Math.random()*lanes.length)],.15,-95);scene.add(c);traffic.push(c)}
function spawnObstacle(){let o;if(Math.random()<.5){o=box(1.4,.7,.9,0xff7a18);o.position.y=-.25}else{o=box(1.8,.9,.55,0x5d6575);o.position.y=-.2}o.position.x=lanes[Math.floor(Math.random()*lanes.length)];o.position.z=-105;scene.add(o);obstacles.push(o)}
function coinMesh(){const m=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.10,24),new THREE.MeshStandardMaterial({color:0xffd43b,metalness:.75,roughness:.25,emissive:0x5a3d00}));m.rotation.z=Math.PI/2;m.position.y=.25;return m}
function spawnCoin(){const c=coinMesh();c.position.x=lanes[Math.floor(Math.random()*lanes.length)];c.position.z=-100;scene.add(c);coins.push(c)}
function spawnBoost(){const b=new THREE.Group(),core=box(.65,.2,.65,0x55d9ff,.7,.2);core.position.y=.1;b.add(core);const ring=new THREE.Mesh(new THREE.TorusGeometry(.38,.07,8,20),new THREE.MeshBasicMaterial({color:0x9cf1ff}));ring.rotation.x=Math.PI/2;ring.position.y=.22;b.add(ring);b.position.set(lanes[Math.floor(Math.random()*lanes.length)],0,-105);scene.add(b);boosts.push(b)}

let running=false,paused=false,elapsed=0,speed=0,playerX=0,runCoins=0,boostUntil=0;
const keys={left:false,right:false,gas:false,brake:false};
async function enterLandscapeMode(){
 if(!matchMedia("(pointer: coarse)").matches)return;
 try{if(!document.fullscreenElement&&document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen()}catch{}
 try{if(screen.orientation?.lock)await screen.orientation.lock("landscape")}catch{}
}
function startGame(){[...traffic,...obstacles,...coins,...boosts].forEach(x=>scene.remove(x));traffic.length=0;obstacles.length=0;coins.length=0;boosts.length=0;elapsed=0;speed=0;playerX=0;runCoins=0;boostUntil=0;player.position.x=0;running=true;paused=false;menu.classList.add("hidden");finish.classList.add("hidden");pausePanel.classList.add("hidden");shop.classList.add("hidden");enterLandscapeMode()}
function endGame(){running=false;paused=false;result.textContent=elapsed.toFixed(1);runCoinsEl.textContent=runCoins;finish.classList.remove("hidden")}
function togglePause(){if(!running)return;paused=!paused;Object.keys(keys).forEach(k=>keys[k]=false);pausePanel.classList.toggle("hidden",!paused)}
function setKey(k,v){keys[k]=v}

// Keyboard: WASD and arrows work together; physical codes avoid keyboard-layout problems.
addEventListener("keydown",e=>{if(e.code==="KeyA"||e.code==="ArrowLeft")setKey("left",true);if(e.code==="KeyD"||e.code==="ArrowRight")setKey("right",true);if(e.code==="KeyW"||e.code==="ArrowUp")setKey("gas",true);if(e.code==="KeyS"||e.code==="ArrowDown"||e.code==="Space")setKey("brake",true);if(e.code==="Escape"){e.preventDefault();togglePause()}if(e.code==="KeyH")document.body.classList.toggle("ui-hidden")});
addEventListener("keyup",e=>{if(e.code==="KeyA"||e.code==="ArrowLeft")setKey("left",false);if(e.code==="KeyD"||e.code==="ArrowRight")setKey("right",false);if(e.code==="KeyW"||e.code==="ArrowUp")setKey("gas",false);if(e.code==="KeyS"||e.code==="ArrowDown"||e.code==="Space")setKey("brake",false)});

// Mobile controls: Pointer Events only. A held finger keeps the control active.
// Prevent browser gestures, text selection and long-press menus while playing.
const touchPointers=new Map();
const releasePointer=e=>{const k=touchPointers.get(e.pointerId);if(!k)return;touchPointers.delete(e.pointerId);setKey(k,false);e.currentTarget.classList.remove("pressed")};
document.querySelectorAll("[data-key]").forEach(btn=>{
 const k=btn.dataset.key;
 const down=e=>{if(e.pointerType!=="touch"&&e.pointerType!=="pen")return;e.preventDefault();btn.setPointerCapture?.(e.pointerId);touchPointers.set(e.pointerId,k);setKey(k,true);btn.classList.add("pressed")};
 btn.addEventListener("pointerdown",down,{passive:false});
 btn.addEventListener("pointerup",releasePointer,{passive:false});
 btn.addEventListener("pointercancel",releasePointer,{passive:false});
 btn.addEventListener("lostpointercapture",releasePointer,{passive:false});
});
window.addEventListener("pointerup",e=>{const k=touchPointers.get(e.pointerId);if(k){touchPointers.delete(e.pointerId);setKey(k,false)}},{passive:false});
window.addEventListener("pointercancel",e=>{const k=touchPointers.get(e.pointerId);if(k){touchPointers.delete(e.pointerId);setKey(k,false)}},{passive:false});

["contextmenu","selectstart","dragstart"].forEach(type=>document.addEventListener(type,e=>e.preventDefault(),{passive:false}));

document.querySelector("#start").onclick=startGame;document.querySelector("#again").onclick=startGame;document.querySelector("#hideUI").onclick=()=>document.body.classList.toggle("ui-hidden");document.querySelector("#restore").onclick=()=>document.body.classList.toggle("ui-hidden");document.querySelector("#mobilePause").onclick=togglePause;document.querySelector("#resume").onclick=togglePause;document.querySelector("#pauseMenu").onclick=()=>{paused=false;running=false;pausePanel.classList.add("hidden");menu.classList.remove("hidden")};
document.querySelector("#shopOpen").onclick=()=>{renderShop();shop.classList.remove("hidden")};document.querySelector("#finishShop").onclick=()=>{finish.classList.add("hidden");renderShop();shop.classList.remove("hidden")};document.querySelector("#shopClose").onclick=()=>shop.classList.add("hidden");
document.querySelector("#fullscreen").onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen?.();else await document.exitFullscreen?.();try{if(screen.orientation?.lock)await screen.orientation.lock("landscape")}catch{}}catch(err){console.warn("Fullscreen unavailable",err)}};

function renderShop(){shopCoinsEl.textContent=profile.coins;const wrap=document.querySelector("#skins");wrap.innerHTML="";for(const s of skins){const owned=profile.owned.includes(s.id),selected=profile.selected===s.id;const speedText=s.bonus?`+${Math.round(s.bonus*100)}% к скорости`:`Базовая скорость`;const el=document.createElement("div");el.className=`skin ${s.id} ${selected?"selected":""}`;el.innerHTML=`<div class="skin-preview"><div class="mini-car" style="--car:#${s.color.toString(16).padStart(6,"0")}"><i></i></div></div><div class="skin-name">${s.name}</div><div class="rarity">${s.rarity}</div><div class="speed-bonus">${speedText}</div><div class="price">${owned?"Получен":s.cost+" 🪙"}</div><button>${selected?"Выбран":owned?"Выбрать":"Купить"}</button>`;const btn=el.querySelector("button");if(selected)btn.disabled=true;btn.onclick=()=>{if(owned){profile.selected=s.id;saveProfile();applySkin();renderShop();return}if(profile.coins>=s.cost){profile.coins-=s.cost;profile.owned.push(s.id);profile.selected=s.id;saveProfile();applySkin();renderShop()}};wrap.appendChild(el)}}

let spawn=1,coinSpawn=1.4,obstacleSpawn=2.2,boostSpawn=7,last=performance.now();
function update(dt){if(!running||paused)return;for(const l of lines){l.position.z+=speed*dt;if(l.position.z>8)l.position.z-=210}for(const b of city.children){b.position.z+=speed*dt;if(b.position.z>15)b.position.z-=350}elapsed+=dt;
 const skin=skins.find(s=>s.id===profile.selected)||skins[0];const baseTarget=keys.gas?28:18;const rarityMultiplier=1+skin.bonus;const boostMultiplier=performance.now()<boostUntil?1.5:1;const targetSpeed=baseTarget*rarityMultiplier*boostMultiplier;speed+=(targetSpeed-speed)*dt*2;if(keys.brake)speed*=Math.max(0,1-dt*3);
 if(keys.left)playerX-=dt*6;if(keys.right)playerX+=dt*6;playerX=Math.max(-5,Math.min(5,playerX));player.position.x+=(playerX-player.position.x)*dt*9;player.rotation.z=(playerX-player.position.x)*-.08;
 spawn-=dt;if(spawn<=0){spawnTraffic();spawn=Math.max(.55,1.25-elapsed*.005)}obstacleSpawn-=dt;if(obstacleSpawn<=0){spawnObstacle();obstacleSpawn=2+Math.random()*1.5}coinSpawn-=dt;if(coinSpawn<=0){spawnCoin();coinSpawn=.7+Math.random()*.8}boostSpawn-=dt;if(boostSpawn<=0){spawnBoost();boostSpawn=8+Math.random()*7}
 const playerBox=new THREE.Box3().setFromObject(player);
 for(let i=traffic.length-1;i>=0;i--){const c=traffic[i];c.position.z+=speed*dt;if(c.position.z>12){scene.remove(c);traffic.splice(i,1);continue}if(playerBox.intersectsBox(new THREE.Box3().setFromObject(c))){endGame();return}}
 for(let i=obstacles.length-1;i>=0;i--){const o=obstacles[i];o.position.z+=speed*dt;if(o.position.z>12){scene.remove(o);obstacles.splice(i,1);continue}if(playerBox.intersectsBox(new THREE.Box3().setFromObject(o))){endGame();return}}
 for(let i=coins.length-1;i>=0;i--){const c=coins[i];c.position.z+=speed*dt;c.rotation.y+=dt*7;if(c.position.z>12){scene.remove(c);coins.splice(i,1);continue}if(playerBox.intersectsBox(new THREE.Box3().setFromObject(c))){profile.coins++;runCoins++;saveProfile();scene.remove(c);coins.splice(i,1)}}
 for(let i=boosts.length-1;i>=0;i--){const b=boosts[i];b.position.z+=speed*dt;b.rotation.y+=dt*3;if(b.position.z>12){scene.remove(b);boosts.splice(i,1);continue}if(playerBox.intersectsBox(new THREE.Box3().setFromObject(b))){boostUntil=performance.now()+3500;scene.remove(b);boosts.splice(i,1)}}
 timeEl.textContent=elapsed.toFixed(1);speedEl.textContent=Math.round(speed*4);
}
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;update(dt);renderer.render(scene,camera);requestAnimationFrame(loop)}requestAnimationFrame(loop);
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2))});
