// The reference rolls the entire seconds pair down; minutes and colon stay still.
// Changes are driven by elapsed wall-clock time, so background tabs cannot drift.
export function updateTimer(element, totalSeconds) {
  if (!element) return;
  const minutes=String(Math.floor(totalSeconds/60)).padStart(2,'0');
  const seconds=String(totalSeconds%60).padStart(2,'0');
  const previous=element.dataset.seconds;
  element.querySelector('.timer-minutes').textContent=minutes+':';
  element.setAttribute('aria-label',`${minutes}:${seconds} remaining`);
  if(previous===seconds)return;
  const slot=element.querySelector('.timer-seconds');
  slot.innerHTML=previous===undefined
    ? `<span class="seconds-still">${seconds}</span>`
    : `<span class="seconds-outgoing">${previous}</span><span class="seconds-incoming">${seconds}</span>`;
  element.dataset.seconds=seconds;
}
