document.addEventListener("DOMContentLoaded",()=>{
 const $=id=>document.getElementById(id);
 let saved={};try{saved=JSON.parse(sessionStorage.getItem("lf-room")||"{}")}catch(e){}
 let host=!!saved.host, roomCode=saved.roomCode||"", myName=saved.myName||"Jogador";
 let peer=null, hostConn=null, conns=[], state=saved.state||null, timerId=null, seconds=0, ended=false;
 const isHost=()=>host;
 const fmt=n=>"€ "+Math.round(n||0).toLocaleString("pt-BR");
 function msg(t){$("mensagem").textContent=t}
 function playersList(){return typeof jogadores!=="undefined"?jogadores:[]}
 function currentUserId(){return host?"host":(peer?.id||"guest")}
 function myPlayer(){return state?.players?.[currentUserId()]||null}
 function broadcast(data){conns=conns.filter(c=>c.open);conns.forEach(c=>c.send(data))}
 function sendToHost(data){if(host){handleHostMessage(data,"host");}else if(hostConn?.open)hostConn.send(data)}
 function publish(){render();sessionStorage.setItem("lf-room",JSON.stringify({host,roomCode,myName,clientId:saved.clientId||"",state}));if(host)broadcast({type:"state",state})}
 function render(){
  if(!state)return;
  $("roomLabel").textContent="Sala "+roomCode;
  $("conexao").textContent=host?"Você é o anfitrião da sala":"Conectado ao anfitrião";
  const me=myPlayer();$("saldo").textContent=fmt(me?.budget);
  $("participantes").innerHTML="";
  Object.values(state.players||{}).forEach(p=>{const li=document.createElement("li");li.textContent=p.name+" — "+fmt(p.budget);$("participantes").appendChild(li)});
  $("meuElenco").innerHTML="";
  if(!me?.roster?.length)$("meuElenco").textContent="Nenhum jogador contratado ainda.";
  else me.roster.forEach(j=>{const d=document.createElement("div");d.className="jogador-elenco";d.innerHTML="<span></span><strong></strong>";d.children[0].textContent=j.nome;d.children[1].textContent=fmt(j.valor);$("meuElenco").appendChild(d)});
  if(state.auction){
   const a=state.auction;$("nomeJogador").textContent=a.player.nome;$("dadosJogador").textContent=a.player.posicao+" • Overall "+a.player.overall;
   $("avatar").textContent=a.player.posicao==="GOL"?"🧤":"⚽";$("maiorLance").textContent=fmt(a.highestBid);
   const bidder=state.players[a.highestBidder];$("maiorLicitante").textContent=bidder?bidder.name:"Sem lances";
   $("timer").textContent=state.finished?"Finalizado":seconds+"s";
   $("darLance").disabled=state.finished||!me||me.budget<a.highestBid+1000000||me.roster.length>=11;
   $("passar").disabled=state.finished;
   $("darLance").textContent="Dar lance + "+fmt(1000000);
  }
  $("historico").innerHTML="";
  (state.history||[]).slice(-12).reverse().forEach(item=>{const li=document.createElement("li");li.textContent=item;$("historico").appendChild(li)});
  $("encerrar").classList.toggle("escondido",!host||state.finished);
  if(state.finished)showResults();
 }
 function showResults(){
  $("resultados").classList.remove("escondido");
  const arr=Object.values(state.players||{}).map(p=>({name:p.name,score:teamScore(p.roster)})).sort((a,b)=>b.score-a.score);
  $("placares").innerHTML="";
  for(let i=0;i<arr.length;i++)for(let j=i+1;j<arr.length;j++){
   const a=arr[i],b=arr[j],ga=Math.max(0,Math.round(1+(a.score-b.score)/12+(Math.random()*2-1)*2)),gb=Math.max(0,Math.round(1+(b.score-a.score)/12+(Math.random()*2-1)*2));
   const d=document.createElement("div");d.className="placar";d.textContent=a.name+" "+ga+" × "+gb+" "+b.name;$("placares").appendChild(d);
  }
  if(arr.length===1){const d=document.createElement("div");d.className="placar";d.textContent="Overall médio: "+arr[0].score;$("placares").appendChild(d)}
 }
 function teamScore(roster){if(!roster?.length)return 0;return Math.round(roster.reduce((s,j)=>s+j.overall,0)/roster.length)}
 function handleHostMessage(data,from){
  if(data.type==="bid"){
   const a=state.auction,p=state.players[from];
   if(!a||!p||state.finished||p.roster.length>=11||p.budget<data.amount||data.amount<=a.highestBid)return;
   a.highestBid=data.amount;a.highestBidder=from;seconds=12;
   state.history.push(p.name+" ofereceu "+fmt(data.amount)+" por "+a.player.nome);
   publish();msg("Novo lance de "+p.name+"!");
  }
 }
 function nextPlayer(){
  if(!host||ended)return;
  if(state.auction?.highestBidder){
   const p=state.players[state.auction.highestBidder],j=state.auction.player;
   p.budget-=state.auction.highestBid;p.roster.push({...j,valor:state.auction.highestBid});
   state.history.push(p.name+" contratou "+j.nome+" por "+fmt(state.auction.highestBid));
  }else if(state.auction)state.history.push("Ninguém comprou "+state.auction.player.nome);
  const available=playersList().filter(j=>!state.used.includes(j.nome)&&Object.values(state.players).some(p=>p.roster.length<11));
  if(!available.length){finish();return}
  const player=available[Math.floor(Math.random()*available.length)];
  state.used.push(player.nome);
  const start=Math.max(1000000,Math.round((player.preco||20000000)*0.05));
  state.auction={player,highestBid:start,highestBidder:null};
  seconds=15;publish();msg("Novo jogador disponível!");
  clearInterval(timerId);timerId=setInterval(()=>{if(!host)return;seconds--;if(state.auction)render();if(seconds<=0){clearInterval(timerId);nextPlayer()}},1000);
 }
 function finish(){
  clearInterval(timerId);state.finished=true;state.auction=null;ended=true;publish();msg("Leilão encerrado! Confira os resultados.");
 }
 function start(){
  if(!host)return;
  state.used=[];state.history=[];state.finished=false;ended=false;
  nextPlayer();
 }
 $("darLance").addEventListener("click",()=>{
  if(!state?.auction)return;
  const me=myPlayer();if(!me)return;
  sendToHost({type:"bid",amount:state.auction.highestBid+1000000});
 });
 $("passar").addEventListener("click",()=>msg("Você passou nesta rodada."));
 $("encerrar").addEventListener("click",()=>{if(host&&confirm("Deseja encerrar o leilão agora?"))finish()});
 function connect(){
  if(!roomCode){$("conexao").textContent="Sala não encontrada. Volte e entre novamente.";return}
  if(host){
   state=state||{roomCode,players:{host:{id:"host",name:myName,budget:500000000,roster:[]}},history:[],used:[],auction:null,finished:false};
   if(!state.players)state.players={host:{id:"host",name:myName,budget:500000000,roster:[]}};
   if(!state.players.host)state.players.host={id:"host",name:myName,budget:500000000,roster:[]};
   state.history=state.history||[];state.used=state.used||[];
   peer=new Peer(roomCode.toLowerCase());
   peer.on("open",()=>{conns=[];render();$("conexao").textContent="Sala pronta. Compartilhe o código e aguarde os amigos.";});
   peer.on("connection",conn=>{conns.push(conn);conn.on("data",data=>{if(data.type==="hello"){const id=conn.peer;if(!state.players[id])state.players[id]={id,name:data.name||"Jogador",budget:500000000,roster:[]};conn.playerId=id;publish();conn.send({type:"state",state})}else handleHostMessage(data,conn.peer)});conn.on("close",()=>{if(conn.playerId){delete state.players[conn.playerId];publish()}})});
   peer.on("error",e=>{$("conexao").textContent="Erro de conexão: "+e.type});
   $("conexao").textContent="Sala criada. Compartilhe "+roomCode;
   const startButton=document.createElement("button");startButton.textContent="Começar leilão";startButton.style.marginTop="12px";startButton.addEventListener("click",()=>{if(Object.keys(state.players).length<2){msg("Convide pelo menos um amigo antes de começar.");return}startButton.remove();start()});$("mensagem").after(startButton);
  }else{
   peer=new Peer(saved.clientId||undefined);
   peer.on("open",()=>{hostConn=peer.connect(roomCode.toLowerCase(),{reliable:true});hostConn.on("open",()=>hostConn.send({type:"hello",name:myName}));hostConn.on("data",data=>{if(data.type==="state"){state=data.state;render()}if(data.type==="error")msg(data.message)});hostConn.on("close",()=>{$("conexao").textContent="Conexão com o anfitrião perdida."})});
   peer.on("error",e=>{$("conexao").textContent="Erro de conexão: "+e.type});
  }
 }
 connect();
});