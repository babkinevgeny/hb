export const MUSIC_VIDEO='CL_3mlOPnGI';
export const musicMayPlay=(enabled,blocked)=>enabled&&!blocked;
export function mountMusic(){
 const button=document.querySelector('#music-toggle'),panel=document.querySelector('#music-panel'),status=document.querySelector('#music-status');
 let player=null,enabled=false,blocked=false,ready=false,loading=false;
 function paint(message){button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'♫ Выключить музыку':'♫ Включить музыку';status.textContent=message||(blocked?'Фон на паузе, чтобы были слышны поющие листья.':enabled?'Concerning Hobbits · YouTube':'Музыка выключена.');}
 function apply(){if(!ready)return;if(musicMayPlay(enabled,blocked))player.playVideo();else player.pauseVideo()}
 function load(){
  panel.hidden=false;panel.scrollIntoView({behavior:'smooth',block:'center'});if(loading)return;loading=true;paint('Загружаем YouTube…');
  const create=()=>{player=new window.YT.Player('music-player',{width:'100%',height:200,videoId:MUSIC_VIDEO,host:'https://www.youtube-nocookie.com',playerVars:{playsinline:1,controls:1,loop:1,playlist:MUSIC_VIDEO,origin:location.origin},events:{
   onReady:()=>{ready=true;player.setVolume(25);apply();paint('Если Safari ждёт нажатия, нажми ▶ в плеере ниже.')},
   onStateChange:e=>{if(e.data===1){if(blocked||!enabled){player.pauseVideo();return}paint('Concerning Hobbits · играет тихо на фоне')}else if(e.data===2&&!blocked&&enabled)paint('Музыка на паузе. Нажми ▶ в плеере или включи музыку снова.')},
   onAutoplayBlocked:()=>paint('Нажми ▶ в плеере YouTube ниже — Safari разрешает звук после нажатия.'),
   onError:()=>{enabled=false;paint('YouTube не смог открыть запись. Можно открыть её по ссылке под плеером.')}
  }})};
  if(window.YT?.Player){create();return}
  const previous=window.onYouTubeIframeAPIReady;window.onYouTubeIframeAPIReady=()=>{previous?.();create()};const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.onerror=()=>{enabled=false;loading=false;paint('YouTube недоступен. Проверь подключение и попробуй снова.')};document.head.append(script);
 }
 button.onclick=()=>{enabled=!enabled;if(enabled&&!player)load();else apply();paint()};paint();
 return {setBlocked(value){if(blocked===value)return;blocked=value;apply();paint()},pause(){enabled=false;apply();paint()}};
}
