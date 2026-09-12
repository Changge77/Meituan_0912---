import test from 'node:test';
import assert from 'node:assert/strict';
import {splitAmount,visitorStatus,confirmPayment,unpaidBills,monthlyBills,conversationKey,visibleMessages,unreadMessages} from '../domain.mjs';
test('AA splits preserve cents and deterministic remainder',()=>{assert.deepEqual(splitAmount(100,['a','b','c']),{a:34,b:33,c:33});assert.deepEqual(splitAmount(100,['a','b'],[1,3]),{a:25,b:75});for(let n=1;n<500;n++)assert.equal(Object.values(splitAmount(n,['a','b','c','d'])).reduce((a,b)=>a+b),n);assert.throws(()=>splitAmount(100,[]));assert.throws(()=>splitAmount(100,['a'],[0]))});
test('visitor requires unanimous approval and expires without it',()=>{const v={start:'2030-01-01T18:00',end:'2030-01-01T20:00',votes:{a:'yes'}};assert.equal(visitorStatus(v,['a','b'],0),'pending');assert.equal(visitorStatus(v,['a','b'],new Date('2030-01-01T19:00').getTime()),'expired');v.votes.b='yes';assert.equal(visitorStatus(v,['a','b'],0),'approved');v.votes.b='no';assert.equal(visitorStatus(v,['a','b'],0),'rejected')});
test('only recipient may confirm uploaded payment; returns require reason',()=>{const b={recipient:'a',payments:{b:{status:'review',receipt:'image'}}};assert.throws(()=>confirmPayment(b,'b','b',true));assert.throws(()=>confirmPayment(b,'a','b',false));confirmPayment(b,'a','b',false,'不清晰');assert.equal(b.payments.b.status,'returned');b.payments.b.status='review';confirmPayment(b,'a','b',true);assert.equal(b.payments.b.status,'paid');assert.throws(()=>confirmPayment(b,'a','b',true))});

test('personal outstanding includes review and returned but excludes settled and non-participants',()=>{
  const bills=['unpaid','review','returned','paid'].map((status,i)=>({id:i,payments:{a:{status}},shares:{a:100}}));
  bills.push({id:4,payments:{b:{status:'unpaid'}}});
  assert.deepEqual(unpaidBills(bills,'a').map(b=>b.id),[0,1,2]);
});

test('history groups by recorded month, not due date or settlement',()=>{
  const bills=[{id:1,created:'2026-09-30',due:'2026-10-02'},{id:2,created:'2026-10-01',due:'2026-10-02'},{id:3,created:'2025-09-01'}];
  assert.deepEqual(monthlyBills(bills,'2026-09').map(b=>b.id),[1]);
  assert.deepEqual(monthlyBills(bills,'2026-08'),[]);
});

test('private conversations are symmetric and hidden from unrelated demo residents',()=>{
  const room=conversationKey('林晓','陈宇');
  assert.equal(room,conversationKey('陈宇','林晓'));
  const messages=[{id:1,room,sender:'林晓',readBy:['林晓']},{id:2,room:'group',sender:'苏晴',readBy:['苏晴']}];
  assert.deepEqual(visibleMessages(messages,'陈宇','林晓').map(m=>m.id),[1]);
  assert.deepEqual(visibleMessages(messages,'周然','林晓'),[]);
  assert.deepEqual(visibleMessages(messages,'周然','group').map(m=>m.id),[2]);
  assert.deepEqual(unreadMessages(messages,'陈宇').map(m=>m.id),[1,2]);
  messages[0].readBy.push('陈宇');
  assert.deepEqual(unreadMessages(messages,'陈宇').map(m=>m.id),[2]);
  assert.deepEqual(unreadMessages(messages,'林晓').map(m=>m.id),[2]);
  assert.deepEqual(unreadMessages(messages,'周然').map(m=>m.id),[2]);
});
