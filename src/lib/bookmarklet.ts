// Генератор букмарлета для Этапа 4. Букмарлет — самодостаточный JS: он выполняется
// в контексте открытой страницы объявления (тот же origin → нет CORS), извлекает
// поля из JSON-LD / OpenGraph, кодирует их и открывает наше приложение на /import.
//
// Логика извлечения намеренно продублирована в компактном виде: букмарлет не может
// импортировать наш бандл (он живёт на чужом сайте). Основной парсер (listingParser.ts)
// покрыт тестами и используется на стороне приложения для ручной вставки.

/** Возвращает строку `javascript:...` — значение href для перетаскиваемой ссылки-букмарлета.
 *  `appBaseUrl` — базовый URL приложения (origin + путь до index), например
 *  `https://user.github.io/repo./`. Букмарлет открывает `<base>#/import?d=<payload>`
 *  (HashRouter: маршрут — в хэше, payload — в query-параметре хэша). */
export function buildBookmarklet(appBaseUrl: string): string {
  const src = `(function(){
  function num(v){ if(typeof v==='number')return v; if(typeof v==='string'){var n=Number(v.replace(/[^0-9.]/g,''));return isFinite(n)&&n>0?n:undefined;} return undefined; }
  var r={};
  function ld(node){
    if(!node||typeof node!=='object')return;
    if(Array.isArray(node)){node.forEach(ld);return;}
    if(r.title===undefined&&typeof node.name==='string')r.title=node.name.slice(0,120);
    var o=node.offers;
    if(r.price===undefined)r.price=num(node.price)||(o&&num(o.price))||(o&&num(o.lowPrice));
    if(r.photoUrl===undefined){var im=node.image; if(typeof im==='string')r.photoUrl=im; else if(Array.isArray(im)&&typeof im[0]==='string')r.photoUrl=im[0]; else if(im&&typeof im.url==='string')r.photoUrl=im.url;}
    if(r.address===undefined){var a=node.address; if(typeof a==='string')r.address=a; else if(a&&typeof a==='object')r.address=[a.streetAddress,a.addressLocality,a.addressRegion].filter(Boolean).join(', ')||undefined;}
    if(r.area===undefined){var fs=node.floorSize; r.area=(fs&&num(fs.value))||num(fs);}
    if(r.rooms===undefined)r.rooms=num(node.numberOfRooms);
    ['mainEntity','itemOffered','about','item','@graph'].forEach(function(k){ if(node[k])ld(node[k]); });
  }
  try{ document.querySelectorAll('script[type="application/ld+json"]').forEach(function(s){ try{ ld(JSON.parse(s.textContent)); }catch(e){} }); }catch(e){}
  function meta(p){ var el=document.querySelector('meta[property="'+p+'"],meta[name="'+p+'"]'); return el?el.getAttribute('content'):undefined; }
  if(r.title===undefined)r.title=(meta('og:title')||document.title||'').slice(0,120);
  if(r.photoUrl===undefined)r.photoUrl=meta('og:image');
  if(r.price===undefined)r.price=num(meta('product:price:amount')||meta('og:price:amount'));
  if(r.address===undefined)r.address=meta('og:street-address')||meta('og:locality');
  var t=(document.body?document.body.innerText:'')||'';
  if(r.price===undefined){var pm=t.match(/(\\d[\\d\\s ]{5,})\\s*(?:₽|руб)/i); if(pm)r.price=Number(pm[1].replace(/[\\s ]/g,''));}
  if(r.area===undefined){var am=t.match(/(\\d+(?:[.,]\\d+)?)\\s*(?:м²|кв\\.?\\s?м)/i); if(am)r.area=parseFloat(am[1].replace(',','.'));}
  if(r.rooms===undefined){var rm=t.match(/(\\d+)\\s*-?\\s*(?:комн|-к\\b|ккв)/i); if(rm)r.rooms=Number(rm[1]); else if(/студи/i.test(t))r.rooms=1;}
  var tt=' '+((r.title||'')+' '+t).toLowerCase()+' ';
  if(/коттедж|таунхаус/.test(tt)||/[^а-яё]дом[^а-яё]/.test(tt))r.housingType='house'; else if(/квартир|студи|апартамент/.test(tt))r.housingType='apartment';
  if(/новостройк|сдача/.test(tt)||/[^а-яё]жк[^а-яё]/.test(tt))r.market='new'; else if(/вторичк/.test(tt))r.market='secondary';
  r.sourceUrl=location.href;
  var json=JSON.stringify(r);
  var b64=btoa(unescape(encodeURIComponent(json))).replace(/\\+/g,'-').replace(/\\//g,'_').replace(/=+$/,'');
  window.open('${appBaseUrl}#/import?d='+b64,'_blank');
})();`;
  // Схлопываем переносы и лишние пробелы → одна строка для href.
  return 'javascript:' + encodeURIComponent(src.replace(/\n\s*/g, ''));
}
