export function project(coordinates,bounds){
 if(!Array.isArray(coordinates)||coordinates.length!==2||!coordinates.every(Number.isFinite))return null;
 const [west,south,east,north]=bounds,[lon,lat]=coordinates;
 if(lon<west||lon>east||lat<south||lat>north)return null;
 return {x:(lon-west)/(east-west)*100,y:(north-lat)/(north-south)*100};
}
export function unproject(x,y,bounds){const [w,s,e,n]=bounds;return [w+x/100*(e-w),n-y/100*(n-s)]}
export function chapterPosition(chapter,privatePlaces,bounds){return project(chapter.privateLocation?(privatePlaces[chapter.id]?.coordinates||chapter.coordinates):chapter.coordinates,bounds)}

export function visibleMapChapters(chapters,completedCount){return chapters.slice(0,Math.min(chapters.length,Math.max(0,completedCount)+1))}

export function destinationUrl(chapter){
 if(chapter.id==='home')return null;
 if(chapter.mapsUrl){try{const u=new URL(chapter.mapsUrl);if(u.protocol==='https:'&&['www.google.com','google.com','maps.google.com'].includes(u.hostname)&&u.pathname.startsWith('/maps'))return u.href}catch{}}
 if(!Array.isArray(chapter.coordinates)||chapter.coordinates.length!==2||!chapter.coordinates.every(Number.isFinite))return null;
 const [lon,lat]=chapter.coordinates;return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
}
