import test from 'node:test';
import assert from 'node:assert/strict';
import {updateJourney, setJourneyField} from '../dist/mumbai-journey.js';
import {journeyOptions} from '../dist/journey.js';

const ordinary = (extra={}) => updateJourney({sourceCode:'VSH',destinationCode:'GNSL',date:'2026-11-03',time:'18:48',service:'ORDINARY',class:'SECOND',type:'JOURNEY',adults:1,children:0,...extra});

test('a manually entered fare, via and distance survive repricing and saved-ticket reuse',()=>{
  const draft=ordinary();
  assert.equal(draft.fare,null);
  setJourneyField(draft,'via','SANPADA');
  setJourneyField(draft,'distance','8 km');
  setJourneyField(draft,'fare','5');
  const saved=JSON.parse(JSON.stringify(draft));
  const restored=updateJourney({...saved});
  assert.equal(restored.via,'SANPADA');
  assert.equal(restored.distance,'8 km');
  assert.equal(restored.fare,5);
  assert.equal(restored.fareStatus,'manual');
  setJourneyField(restored,'time','19:00');
  assert.equal(restored.fare,5);
});

test('changing class or passenger count clears a manual fare without losing route edits',()=>{
  const draft=ordinary();
  setJourneyField(draft,'via','SANPADA');
  setJourneyField(draft,'fare','5');
  draft.class='FIRST';
  updateJourney(draft);
  assert.equal(draft.fare,null);
  assert.equal(draft.via,'SANPADA');
  setJourneyField(draft,'fare','25');
  draft.adults=2;
  updateJourney(draft);
  assert.equal(draft.fare,null);
  assert.equal(draft.via,'SANPADA');
});

test('changing routes resets manual route fields and the old fare',()=>{
  const draft=ordinary();
  setJourneyField(draft,'via','CUSTOM VIA');
  setJourneyField(draft,'distance','999 km');
  setJourneyField(draft,'fare','5');
  draft.sourceCode='CCG';
  draft.destinationCode='MEL';
  updateJourney(draft);
  assert.equal(draft.distance,'1.3 km');
  assert.notEqual(draft.via,'CUSTOM VIA');
  assert.equal(draft.fare,5);
  assert.equal(draft.fareStatus,'estimate');
  assert.equal(Object.hasOwn(draft.manualValues,'fare'),false);
});

test('a cleared fare stays empty instead of becoming zero or silently reverting',()=>{
  const draft=ordinary({sourceCode:'CCG',destinationCode:'MEL'});
  assert.equal(draft.fare,5);
  setJourneyField(draft,'fare','');
  updateJourney(draft);
  assert.equal(draft.fare,null);
  const html=journeyOptions(draft);
  assert.match(html,/aria-label="Fare amount"[^>]+placeholder="Enter fare" value="" required/);
});

test('booking options keep editing below Book Now and omit unavailable AC',()=>{
  const html=journeyOptions(ordinary());
  assert.ok(html.indexOf('data-action="journey-book"')<html.indexOf('<details class="journey-schedule"'));
  assert.ok(html.indexOf('<details class="journey-schedule"')<html.indexOf('Via route'));
  assert.doesNotMatch(html,/Check fare|AC EMU TRAIN|ac-availability/);
  assert.match(html,/data-journey-field="distance"/);
  assert.match(html,/data-journey-field="via"/);
  assert.match(html,/aria-label="Fare amount"/);
  const ac=ordinary({sourceCode:'CCG',destinationCode:'BVI'});
  assert.equal(ac.acAvailable,true);
  assert.match(journeyOptions(ac),/data-value="AC EMU TRAIN"/);
});
