export function project(coordinates,bounds){
 if(!Array.isArray(coordinates)||coordinates.length!==2||!coordinates.every(Number.isFinite))return null;
 const [west,south,east,north]=bounds,[lon,lat]=coordinates;
 if(lon<west||lon>east||lat<south||lat>north)return null;
 return {x:(lon-west)/(east-west)*100,y:(north-lat)/(north-south)*100};
}
export function unproject(x,y,bounds){const [w,s,e,n]=bounds;return [w+x/100*(e-w),n-y/100*(n-s)]}
export function chapterPosition(chapter,privatePlaces,bounds){return project(chapter.privateLocation?(privatePlaces[chapter.id]?.coordinates||chapter.coordinates):chapter.coordinates,bounds)}
