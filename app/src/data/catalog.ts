import type { JerseyProduct } from '@/types/product';
import { CATEGORY_LABELS } from '@/config/sports';

function p(
  partial: Omit<JerseyProduct, 'categoryLabel'> & { categoryLabel?: string },
): JerseyProduct {
  const isF1OrCricket = partial.sport === 'f1' || partial.sport === 'cricket';
  const isMaster = partial.category === 'master-version';
  const isPlayer = partial.category === 'player-version';
  const price = isF1OrCricket
    ? 1099
    : (isMaster ? 799 : (isPlayer ? 1299 : partial.price));
  const oldPrice = isF1OrCricket
    ? 1399
    : (isMaster
      ? 1099
      : (isPlayer
        ? 1599
        : (partial.oldPrice && partial.oldPrice > price ? partial.oldPrice : price + 300)));
  const discountPercent = Math.round(((oldPrice - price) / oldPrice) * 100);
  const discount =
    partial.discount && partial.discount !== '' && partial.discount !== '-0%'
      ? partial.discount
      : `-${discountPercent}%`;

  return {
    ...partial,
    price,
    oldPrice,
    discount,
    categoryLabel:
      partial.categoryLabel ?? CATEGORY_LABELS[partial.category] ?? partial.category,
  };
}

export const catalogProducts: JerseyProduct[] = [
  p({"id":1,"title":"AC Milan Away 2026/27 Player Version","sport":"football","category":"player-version","team":"AC Milan","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/AC-Milan-26-27-awaykit-playerverison.png","discount":"","tags":["football","player-version","ac-milan"],"popular":87,"createdAt":"2026-07-10"}),
  p({"id":2,"title":"AC Milan Home 2026/27 Player Version","sport":"football","category":"player-version","team":"AC Milan","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/AC-Milan-26-27-homekit-playerverison.png","discount":"","tags":["football","player-version","ac-milan"],"popular":99,"createdAt":"2026-07-10"}),
  p({"id":3,"title":"AC Milan Fourth Master Version","sport":"football","category":"master-version","team":"AC Milan","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/AC-Milan-4th-kit-masterversion.png","discount":"","tags":["football","master-version","ac-milan"],"popular":82,"createdAt":"2026-07-10"}),
  p({"id":4,"title":"Argentina All Over Kit Player Version","sport":"football","category":"player-version","team":"Argentina","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/Argentina-alloverkit-playerversion.png","discount":"","tags":["football","player-version","argentina"],"popular":97,"createdAt":"2026-07-10"}),
  p({"id":5,"title":"Argentina Away Player Version","sport":"football","category":"player-version","team":"Argentina","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/argentina-awaykit-playerversion.webp","discount":"","tags":["football","player-version","argentina"],"popular":70,"createdAt":"2026-07-10"}),
  p({"id":6,"title":"Argentina World Cup 22 Home Master Version","sport":"football","category":"master-version","team":"Argentina","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/argentina-worldcup22-homekit-masterversion.png","discount":"","tags":["football","master-version","argentina"],"popular":94,"createdAt":"2026-07-10"}),
  p({"id":7,"title":"Arsenal Away Player Version","sport":"football","category":"player-version","team":"Arsenal","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/arsenal-awaykit24-25-playerversion.png","discount":"","tags":["football","player-version","arsenal"],"popular":98,"createdAt":"2026-07-10"}),
  p({"id":8,"title":"Arsenal Home Player Version","sport":"football","category":"player-version","team":"Arsenal","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/arsenal-homekit-playerversion.png","discount":"","tags":["football","player-version","arsenal"],"popular":72,"createdAt":"2026-07-10"}),
  p({"id":9,"title":"Barcelona 125th Anniversary Retro Jersey","sport":"football","category":"retro","team":"Barcelona","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/barcelona 125th anniversary retro version.png","discount":"","tags":["football","retro","barcelona"],"popular":56,"createdAt":"2026-07-10"}),
  p({"id":10,"title":"Barcelona Away 2026/27 Master Version","sport":"football","category":"master-version","team":"Barcelona","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/barcelona 26-27 away kit masterversion.png","discount":"","tags":["football","master-version","barcelona"],"popular":64,"createdAt":"2026-07-10"}),
  p({"id":11,"title":"Barcelona Fourth 2026/27 Master Version","sport":"football","category":"master-version","team":"Barcelona","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/barcelona-4th-kit-26-27-player-masterversion.webp","discount":"","tags":["football","master-version","barcelona"],"popular":51,"createdAt":"2026-07-10"}),
  p({"id":12,"title":"Barcelona Purple Jersey 2026 Player Version","sport":"football","category":"player-version","team":"Barcelona","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/barcelona-away-purple-jersey-2026-27-front-view.webp","discount":"","tags":["football","player-version","barcelona"],"popular":84,"createdAt":"2026-07-10"}),
  p({"id":13,"title":"Bayern Munich Fan Version","sport":"football","category":"fan-version","team":"Bayern Munich","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/bayern munich - fan made.png","discount":"","tags":["football","fan-version","bayern-munich"],"popular":89,"createdAt":"2026-07-10"}),
  p({"id":14,"title":"Bayern Munich Home 2026/27 Player Version","sport":"football","category":"player-version","team":"Bayern Munich","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/bayern munich -home jersey 26-27 player version.webp","discount":"","tags":["football","player-version","bayern-munich"],"popular":53,"createdAt":"2026-07-10"}),
  p({"id":15,"title":"England Kit Anime","sport":"football","category":"anime","team":"England","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/England_Kit_Anime_version.png","discount":"","tags":["football","anime","england"],"popular":89,"createdAt":"2026-07-10"}),
  p({"id":16,"title":"Barcelona Home 2026/27 Player Version","sport":"football","category":"player-version","team":"Barcelona","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/fc-barcelona-26-27-home-kit-0-1782981653057-11ujog.webp","discount":"","tags":["football","player-version","barcelona"],"popular":85,"createdAt":"2026-07-10"}),
  p({"id":17,"title":"Inter Miami Away 2026/27 Master Version","sport":"football","category":"master-version","team":"Inter Miami","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/INTER-MIAMI-awayset-26-27-masterversion+playerversion.png","discount":"","tags":["football","master-version","inter-miami"],"popular":82,"createdAt":"2026-07-10"}),
  p({"id":18,"title":"Liverpool Away 2021/22 Master Version","sport":"football","category":"master-version","team":"Liverpool","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/Liverpool-Away-set-21-22-player+master_version.png","discount":"","tags":["football","master-version","liverpool"],"popular":68,"createdAt":"2026-07-10"}),
  p({"id":19,"title":"Man City Third 2025/26 Player Version","sport":"football","category":"player-version","team":"Man City","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/mancity-25-26-third-set-player-version.png","discount":"","tags":["football","player-version","man-city"],"popular":86,"createdAt":"2026-07-10"}),
  p({"id":20,"title":"Man City 2026/27 Player Version","sport":"football","category":"player-version","team":"Man City","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/mancity-26-27-home-player-version.png","discount":"","tags":["football","player-version","man-city"],"popular":96,"createdAt":"2026-07-10"}),
  p({"id":21,"title":"PSG Away 2026/27 Player Version","sport":"football","category":"player-version","team":"PSG","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/psg-awaykit-26-27-playerversion.png","discount":"","tags":["football","player-version","psg"],"popular":78,"createdAt":"2026-07-10"}),
  p({"id":22,"title":"PSG Home 2026/27 Player Version","sport":"football","category":"player-version","team":"PSG","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/psg-homekit-26-27-playerversion.png","discount":"","tags":["football","player-version","psg"],"popular":61,"createdAt":"2026-07-10"}),
  p({"id":23,"title":"Real Madrid Kit 2026/27 Player Version","sport":"football","category":"player-version","team":"Real Madrid","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/realmadrid-26-27-kit-player-version.png","discount":"","tags":["football","player-version","real-madrid"],"popular":74,"createdAt":"2026-07-10"}),
  p({"id":24,"title":"Real Madrid Fan Version","sport":"football","category":"fan-version","team":"Real Madrid","player":null,"price":999,"oldPrice":999,"image":"/jerseys/imported/realmadrid-fanversion.png","discount":"","tags":["football","fan-version","real-madrid"],"popular":68,"createdAt":"2026-07-10"}),
  p({"id":25,"title":"CSK IPL Jersey Player Version","sport":"cricket","category":"player-version","team":"CSK","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/CSK IPL JERSEY.png","discount":"","tags":["cricket","player-version","csk"],"popular":56,"createdAt":"2026-07-10"}),
  p({"id":26,"title":"Gujarat Titans IPL Jersey Player Version","sport":"cricket","category":"player-version","team":"Gujarat Titans","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/Gujrat Titans IPL jersey cricket.webp","discount":"","tags":["cricket","player-version","gujarat-titans"],"popular":76,"createdAt":"2026-07-10"}),
  p({"id":27,"title":"India T20 Kit Player Version","sport":"cricket","category":"player-version","team":"India","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/INDIA T20 KIT.png","discount":"","tags":["cricket","player-version","india"],"popular":84,"createdAt":"2026-07-10"}),
  p({"id":28,"title":"KKR IPL Jersey Player Version","sport":"cricket","category":"player-version","team":"KKR","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/KKR IPL jersey.avif","discount":"","tags":["cricket","player-version","kkr"],"popular":80,"createdAt":"2026-07-10"}),
  p({"id":29,"title":"Punjab Kings Jersey 2026 Player Version","sport":"cricket","category":"player-version","team":"Punjab Kings","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/punjab-kings-jersey-2026-600x800.jpg","discount":"","tags":["cricket","player-version","punjab-kings"],"popular":53,"createdAt":"2026-07-10"}),
  p({"id":30,"title":"RCB IPL Jersey Player Version","sport":"cricket","category":"player-version","team":"RCB","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/RCB IPL JERSEY.png","discount":"","tags":["cricket","player-version","rcb"],"popular":97,"createdAt":"2026-07-10"}),
  p({"id":31,"title":"Rajasthan Royals IPL Kit 2026 Player Version","sport":"cricket","category":"player-version","team":"Rajasthan Royals","player":null,"price":899,"oldPrice":899,"image":"/jerseys/imported/RR IPL KIT 2026.jpg","discount":"","tags":["cricket","player-version","rajasthan-royals"],"popular":57,"createdAt":"2026-07-10"}),
  p({"id":32,"title":"Apex GP Oversized Tee Fan Version","sport":"f1","category":"fan-version","team":"Apex GP","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Apex GP White All Season Oversized Tee.webp","discount":"","tags":["f1","fan-version","apex-gp"],"popular":95,"createdAt":"2026-07-10"}),
  p({"id":33,"title":"Apex GP Polo 2026 Master Version","sport":"f1","category":"master-version","team":"Apex GP","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/APXGP Racing 2026 Team Polo.webp","discount":"","tags":["f1","master-version","apex-gp"],"popular":63,"createdAt":"2026-07-10"}),
  p({"id":34,"title":"Aston Martin Tee 2026 Fan Version","sport":"f1","category":"fan-version","team":"Aston Martin","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Aston Martin Racing 2026 Oversized Team Tee.webp","discount":"","tags":["f1","fan-version","aston-martin"],"popular":73,"createdAt":"2026-07-10"}),
  p({"id":35,"title":"Audi Tee 2026 Player Version","sport":"f1","category":"player-version","team":"Audi","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Audi F1 2026 Performance Tee.webp","discount":"","tags":["f1","player-version","audi"],"popular":61,"createdAt":"2026-07-10"}),
  p({"id":36,"title":"Cadillac Tee 2026 Fan Version","sport":"f1","category":"fan-version","team":"Cadillac","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Cadillac F1 2026 Oversized Team Tee.webp","discount":"","tags":["f1","fan-version","cadillac"],"popular":55,"createdAt":"2026-07-10"}),
  p({"id":37,"title":"Formula 1 Oversized Tee 2025 Fan Version","sport":"f1","category":"fan-version","team":"Formula 1","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/F1 2025 Grand Prix Circuit Oversized Tee.webp","discount":"","tags":["f1","fan-version","formula-1"],"popular":97,"createdAt":"2026-07-10"}),
  p({"id":38,"title":"McLaren Polo Master Version","sport":"f1","category":"master-version","team":"McLaren","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/mclaren team polo.webp","discount":"","tags":["f1","master-version","mclaren"],"popular":71,"createdAt":"2026-07-10"}),
  p({"id":39,"title":"McLaren Tee Player Version","sport":"f1","category":"player-version","team":"McLaren","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/McLaren Track Tee.webp","discount":"","tags":["f1","player-version","mclaren"],"popular":61,"createdAt":"2026-07-10"}),
  p({"id":40,"title":"McLaren Tee Fan Version","sport":"f1","category":"fan-version","team":"McLaren","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/mclarren team tshirt.webp","discount":"","tags":["f1","fan-version","mclaren"],"popular":51,"createdAt":"2026-07-10"}),
  p({"id":41,"title":"Mercedes Tee 2026 Fan Version","sport":"f1","category":"fan-version","team":"Mercedes","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Mercedes AMG Petronas 2026 Oversized Team Tee.webp","discount":"","tags":["f1","fan-version","mercedes"],"popular":50,"createdAt":"2026-07-10"}),
  p({"id":42,"title":"Mercedes Tee Fan Version","sport":"f1","category":"fan-version","team":"Mercedes","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/Mercedes White Oversized Team Tshirt.webp","discount":"","tags":["f1","fan-version","mercedes"],"popular":74,"createdAt":"2026-07-10"}),
  p({"id":43,"title":"Red Bull Polo Master Version","sport":"f1","category":"master-version","team":"Red Bull","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/RB Monaco White Polo.webp","discount":"","tags":["f1","master-version","red-bull"],"popular":80,"createdAt":"2026-07-10"}),
  p({"id":44,"title":"Red Bull Polo Player Version","sport":"f1","category":"player-version","team":"Red Bull","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/RB Off-White Track Polo.webp","discount":"","tags":["f1","player-version","red-bull"],"popular":52,"createdAt":"2026-07-10"}),
  p({"id":45,"title":"Red Bull Oversized Tee Fan Version","sport":"f1","category":"fan-version","team":"Red Bull","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/RB White Oversized Tshirt.webp","discount":"","tags":["f1","fan-version","red-bull"],"popular":96,"createdAt":"2026-07-10"}),
  p({"id":46,"title":"Ferrari Polo Player Version","sport":"f1","category":"player-version","team":"Ferrari","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/SF red performance polo.webp","discount":"","tags":["f1","player-version","ferrari"],"popular":52,"createdAt":"2026-07-10"}),
  p({"id":47,"title":"Ferrari Tee Player Version","sport":"f1","category":"player-version","team":"Ferrari","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/SF red performance tee.webp","discount":"","tags":["f1","player-version","ferrari"],"popular":73,"createdAt":"2026-07-10"}),
  p({"id":48,"title":"Ferrari Tee Player Version","sport":"f1","category":"player-version","team":"Ferrari","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/SF TRACK TEE.png","discount":"","tags":["f1","player-version","ferrari"],"popular":55,"createdAt":"2026-07-10"}),
  p({"id":49,"title":"VCARB Tee 2026 Fan Version","sport":"f1","category":"fan-version","team":"VCARB","player":null,"price":1099,"oldPrice":1099,"image":"/jerseys/imported/VCARB Racing 2026 Oversized Team Tee.webp","discount":"","tags":["f1","fan-version","vcarb"],"popular":62,"createdAt":"2026-07-10"}),
];

export function getProductById(id: number) {
  return catalogProducts.find((p) => p.id === id);
}

export function getTeams(sport?: string) {
  const products =
    sport && sport !== 'all'
      ? catalogProducts.filter((p) => p.sport === sport)
      : catalogProducts;
  return [...new Set(products.map((p) => p.team))].sort();
}

export function getMaxPrice() {
  return Math.max(...catalogProducts.map((p) => p.price));
}
