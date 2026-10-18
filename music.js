export const MUSIC_SOURCE='./concerning-hobbits.mp3';
export const musicMayPlay=(enabled,blocked)=>enabled&&!blocked;
export function mountMusic(doc=document,AudioElement=Audio){
 const button=doc.querySelector('#music-toggle'),status=doc.querySelector('#music-status');
 const audio=new AudioElement();audio.preload='none';audio.loop=true;audio.volume=.25;audio.setAttribute('playsinline','');
 let enabled=false,blocked=false,request=0;
 function paint(message){button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'♫ Выключить музыку':'♫ Включить музыку';status.textContent=message||(blocked?'Фон на паузе, чтобы были слышны поющие листья.':enabled?'Howard Shore · Concerning Hobbits':'Музыка выключена.');}
 function apply(){const current=++request;if(!musicMayPlay(enabled,blocked)){audio.pause();paint();return}if(!audio.getAttribute('src'))audio.src=MUSIC_SOURCE;if(audio.error)audio.load();paint('Загружаем музыку…');try{const result=audio.play();result?.catch(()=>{if(current!==request||!musicMayPlay(enabled,blocked))return;enabled=false;paint('Нажми «Включить музыку» ещё раз. Проверь подключение и громкость телефона.')})}catch{enabled=false;paint('Не удалось включить музыку. Попробуй ещё раз.')}}
 audio.addEventListener('playing',()=>{if(!musicMayPlay(enabled,blocked)){audio.pause();return}paint()});
 audio.addEventListener('error',()=>{if(!enabled)return;enabled=false;request++;paint('Аудио не загрузилось. Проверь подключение и включи музыку ещё раз.')});
 button.onclick=()=>{enabled=!enabled;apply()};paint();
 return {setBlocked(value){if(blocked===value)return;blocked=value;apply()},pause(){enabled=false;apply()}};
}
