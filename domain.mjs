export function splitAmount(cents, people, weights = null) {
  if (!Number.isSafeInteger(cents) || cents <= 0 || !people.length) throw new Error('请输入有效金额，并至少选择一位参与人');
  const w = weights || people.map(() => 1);
  if (w.length !== people.length || w.some(v => !Number.isFinite(v) || v <= 0)) throw new Error('每位参与人的比例必须大于 0');
  const sum = w.reduce((a,b) => a+b,0), raw = w.map(v => cents*v/sum), amounts = raw.map(Math.floor);
  const order = raw.map((v,i)=>({i,r:v-amounts[i]})).sort((a,b)=>b.r-a.r || a.i-b.i);
  for(let i=0, left=cents-amounts.reduce((a,b)=>a+b,0); i<left; i++) amounts[order[i%order.length].i]++;
  return Object.fromEntries(people.map((p,i)=>[p,amounts[i]]));
}
export function visitorStatus(v, members, now = Date.now()) {
  if (Object.values(v.votes).includes('no')) return 'rejected';
  if (members.every(p => v.votes[p] === 'yes')) return new Date(v.end).getTime() <= now ? 'ended' : 'approved';
  return new Date(v.start).getTime() <= now ? 'expired' : 'pending';
}
export function confirmPayment(bill, actor, person, accepted, reason='') {
  if(actor !== bill.recipient) throw new Error('只有本账单收款人可以确认凭证');
  const p = bill.payments[person];
  if(!p || p.status !== 'review' || !p.receipt) throw new Error('该付款尚未提交有效凭证');
  if(!accepted && !reason.trim()) throw new Error('请填写退回原因');
  p.status = accepted ? 'paid' : 'returned'; p.reason = reason; p.confirmedAt = new Date().toISOString();
}
