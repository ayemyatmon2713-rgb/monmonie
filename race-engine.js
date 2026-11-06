(function(root){
class RaceEngine {
 constructor(player,random=Math.random){this.random=random;this.playerId=player;this.length=6000;this.time=0;this.finished=[];this.shots=[];this.objects=[];this.events=[];this.spawn=.8;this.pickup=2;this.done=false;this.racers=Array.from({length:7},(_,id)=>({id,x:.14+id*.12,d:0,hp:3,shield:0,inv:0,slow:0,boost:0,fireCD:0,shieldCD:0,boostCD:0,ai:1+random()*2,base:173+random()*12,finished:false,dead:false}));this.p=this.racers[player];this.p.x=.5;this.p.base=180;}
 active(r){return !r.dead&&!r.finished}
 order(){return [...this.racers].sort((a,b)=>{const ai=this.finished.indexOf(a.id),bi=this.finished.indexOf(b.id);if(ai>=0||bi>=0)return (ai<0?99:ai)-(bi<0?99:bi);return Number(a.dead)-Number(b.dead)||b.d-a.d||a.id-b.id})}
 action(id,type){const r=this.racers[id];if(this.done||!this.active(r))return false;
  if(type==='shield'&&r.shieldCD<=0){r.shield=2;r.shieldCD=8;this.events.push({type:'shield',id});return true}
  if(type==='boost'&&r.boostCD<=0){r.boost=1.5;r.boostCD=4;this.events.push({type:'boost',id});return true}
  if(type==='fire'&&r.fireCD<=0){r.fireCD=1;const targets=this.racers.filter(t=>t.id!==id&&this.active(t)&&t.d>r.d+20&&t.d<r.d+1300).sort((a,b)=>a.d-b.d);const target=targets[0];this.shots.push({owner:id,target:target?.id??null,x:r.x,d:r.d+25,life:4});this.events.push({type:'fire',id});return true}return false;
 }
 hit(r){if(!this.active(r)||r.shield>0||r.inv>0)return false;r.hp--;r.inv=2;r.slow=.65;this.events.push({type:'hit',id:r.id});if(r.hp<=0){r.dead=true;this.events.push({type:'out',id:r.id})}return true;}
 step(dt,input={}){if(this.done)return;dt=Math.min(.1,Math.max(0,dt));this.time+=dt;this.events=[];
  for(const r of this.racers){if(!this.active(r))continue;for(const k of ['shield','inv','slow','boost','fireCD','shieldCD','boostCD'])r[k]=Math.max(0,r[k]-dt);
   let speed=r.base;if(r.id===this.playerId){r.x=Math.max(.065,Math.min(.935,r.x+(input.x||0)*dt*.75));if(Number.isFinite(input.pointer))r.x+=(Math.max(.065,Math.min(.935,input.pointer))-r.x)*Math.min(1,dt*9);speed+=(input.y||0)*22;
   }else{r.ai-=dt;const danger=this.objects.find(o=>o.type==='rock'&&o.d>r.d&&o.d-r.d<190&&Math.abs(o.x-r.x)<.09);if(danger)r.x+=((danger.x>.5?-1:1)*dt*.25);else r.x+=Math.sin(this.time*.6+r.id*2)*dt*.035;r.x=Math.max(.065,Math.min(.935,r.x));speed+=Math.max(-4,Math.min(4,(this.p.d-r.d)*.008));if(r.ai<=0){r.ai=2+this.random()*3;if(this.shots.some(s=>s.target===r.id&&s.d<r.d&&r.d-s.d<250))this.action(r.id,'shield');else this.action(r.id,this.random()<.6?'fire':'boost');}}
   r.d+=speed*(r.boost>0?2:1)*(r.slow>0?.55:1)*dt;
   if(r.d>=this.length){r.d=this.length;r.finished=true;this.finished.push(r.id);this.events.push({type:'finish',id:r.id});}
  }
  for(const s of this.shots){s.life-=dt;const target=this.racers[s.target];if(target&&this.active(target))s.x+=(target.x-s.x)*dt*1.2;s.d+=500*dt;for(const r of this.racers){if(r.id!==s.owner&&this.active(r)&&Math.abs(s.d-r.d)<32&&Math.abs(s.x-r.x)<.055){this.hit(r);s.life=0;break;}}}this.shots=this.shots.filter(s=>s.life>0);
  this.spawn-=dt;this.pickup-=dt;const lead=Math.max(...this.racers.filter(r=>!r.dead).map(r=>r.d));if(this.spawn<=0){this.spawn=1.2+this.random()*1;this.objects.push({type:'rock',x:.08+this.random()*.84,d:lead+950,used:[]});}if(this.pickup<=0){this.pickup=2+this.random()*2;this.objects.push({type:this.random()<.3?'heart':'energy',x:.12+this.random()*.76,d:this.p.d+800,used:[]});}
  for(const o of this.objects)for(const r of this.racers)if(this.active(r)&&!o.used.includes(r.id)&&Math.abs(o.d-r.d)<32&&Math.abs(o.x-r.x)<.07){o.used.push(r.id);if(o.type==='rock')this.hit(r);else if(o.type==='heart'){r.hp=Math.min(3,r.hp+1);this.events.push({type:'heal',id:r.id})}else{r.boostCD=Math.max(0,r.boostCD-3);r.shieldCD=Math.max(0,r.shieldCD-3);this.events.push({type:'energy',id:r.id})}}
  this.objects=this.objects.filter(o=>o.d>this.p.d-700&&o.d<lead+1800);
  const alive=this.racers.filter(r=>this.active(r));if(this.p.dead||this.p.finished||this.finished.length>=3||alive.length===0||this.time>60)this.done=true;
 }
 result(){const rank=this.finished.indexOf(this.playerId)+1;return {won:rank>0&&rank<=3,rank,reason:this.p.dead?'탈락':rank?'완주':this.finished.length>=3?'상위 3명 도착':'레이스 종료',order:this.order()};}
}
if(typeof module!=='undefined')module.exports=RaceEngine;else root.RaceEngine=RaceEngine;
})(typeof window!=='undefined'?window:globalThis);
