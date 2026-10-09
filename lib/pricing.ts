export type SaleLike={price:number;salePrice:number|null;saleStart:Date|null;saleEnd:Date|null};
export function activeSalePrice(p:SaleLike,now=new Date()){
  if(p.salePrice==null||p.salePrice>=p.price)return null;
  if(p.saleStart&&now<p.saleStart)return null;
  if(p.saleEnd&&now>p.saleEnd)return null;
  return p.salePrice;
}
export function effectivePrice(p:SaleLike,now=new Date()){return activeSalePrice(p,now)??p.price}
export function discountPercent(regular:number,sale:number){return Math.round((regular-sale)*100/regular)}
