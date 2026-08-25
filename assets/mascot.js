/* Shared mascot ("the hedgehog") for every mission. Reused as a static
   greeter (hero, section intros) and as a reveal-mode quiz reaction
   (celebrate / sad), driven by mission-engine.js. */

(function () {
  'use strict';

  const STATIC_BASE = `
    <ellipse cx="100" cy="196" rx="46" ry="7" fill="#22301F" opacity="0.08"/>
    <ellipse cx="78" cy="184" rx="14" ry="10" fill="#7A5738"/>
    <ellipse cx="122" cy="184" rx="14" ry="10" fill="#7A5738"/>`;

  const SPIKES = [-70, -52.5, -35, -17.5, 0, 17.5, 35, 52.5, 70]
    .map((deg) => `<polygon points="100,25 92,72 108,72" fill="#7A5738" transform="rotate(${deg} 100 75)"/>`)
    .join('');

  const EARS = `
    <ellipse cx="72" cy="72" rx="10" ry="11" fill="#9C7350"/>
    <ellipse cx="128" cy="72" rx="10" ry="11" fill="#9C7350"/>
    <ellipse cx="72" cy="74" rx="5" ry="6" fill="#E8D2B0"/>
    <ellipse cx="128" cy="74" rx="5" ry="6" fill="#E8D2B0"/>`;

  const BODY = `<path d="M100,55 C140,55 165,86 165,122 C165,160 135,186 100,186 C65,186 35,160 35,122 C35,86 60,55 100,55 Z" fill="#9C7350"/>`;
  const FACE = `<ellipse cx="100" cy="145" rx="52" ry="42" fill="#E8D2B0"/>`;

  const POSES = {
    idle: `
      <g class="mascot-idle">
        ${BODY}${SPIKES}${EARS}${FACE}
        <ellipse cx="158" cy="154" rx="14" ry="17" fill="#7A5738" transform="rotate(20 158 154)"/>
        <ellipse cx="36" cy="100" rx="14" ry="17" fill="#7A5738" transform="rotate(-50 36 100)"/>
        <circle cx="66" cy="148" r="8" fill="#E2703A" opacity="0.3"/>
        <circle cx="134" cy="148" r="8" fill="#E2703A" opacity="0.3"/>
        <circle cx="82" cy="130" r="6" fill="#22301F"/>
        <circle cx="118" cy="130" r="6" fill="#22301F"/>
        <circle cx="84.5" cy="128" r="1.8" fill="#FFFFFF"/>
        <circle cx="120.5" cy="128" r="1.8" fill="#FFFFFF"/>
        <ellipse cx="100" cy="146" rx="7" ry="5" fill="#22301F"/>
        <path d="M82,152 Q100,164 118,152" stroke="#22301F" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`,
    celebrate: `
      <g class="mascot-celebrate">
        ${BODY}${SPIKES}${EARS}${FACE}
        <ellipse cx="28" cy="86" rx="14" ry="17" fill="#7A5738" transform="rotate(-65 28 86)"/>
        <ellipse cx="172" cy="86" rx="14" ry="17" fill="#7A5738" transform="rotate(65 172 86)"/>
        <circle cx="66" cy="148" r="8" fill="#E2703A" opacity="0.35"/>
        <circle cx="134" cy="148" r="8" fill="#E2703A" opacity="0.35"/>
        <path d="M73,124 Q82,114 91,124" stroke="#22301F" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M109,124 Q118,114 127,124" stroke="#22301F" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="100" cy="146" rx="7" ry="5" fill="#22301F"/>
        <path d="M76,148 Q100,172 124,148 Q100,160 76,148 Z" fill="#22301F"/>
      </g>
      <path class="sparkle" d="M22,50 L25,58 L33,61 L25,64 L22,72 L19,64 L11,61 L19,58 Z" fill="#E3A83B"/>
      <path class="sparkle" style="animation-delay: 0.4s;" d="M172,44 L174,50 L180,52 L174,54 L172,60 L170,54 L164,52 L170,50 Z" fill="#E3A83B"/>`,
    curious: `
      <g class="mascot-curious">
        ${BODY}${SPIKES}${EARS}${FACE}
        <ellipse cx="36" cy="158" rx="13" ry="16" fill="#7A5738" transform="rotate(30 36 158)"/>
        <ellipse cx="148" cy="118" rx="14" ry="22" fill="#7A5738" transform="rotate(-22 148 118)"/>
        <circle cx="66" cy="148" r="8" fill="#E2703A" opacity="0.25"/>
        <circle cx="134" cy="148" r="8" fill="#E2703A" opacity="0.25"/>
        <path d="M73,118 Q81,112 90,116" stroke="#22301F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <path d="M110,116 Q119,112 127,118" stroke="#22301F" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <circle cx="82" cy="130" r="6" fill="#22301F"/>
        <circle cx="118" cy="130" r="6" fill="#22301F"/>
        <ellipse cx="100" cy="146" rx="6.5" ry="5" fill="#22301F"/>
        <path d="M86,152 Q100,156 114,150" stroke="#22301F" stroke-width="3" fill="none" stroke-linecap="round"/>
        <g class="glass-sweep">
          <circle cx="120" cy="129" r="17" fill="none" stroke="#C1552A" stroke-width="5"/>
          <line x1="132" y1="141" x2="144" y2="153" stroke="#C1552A" stroke-width="6" stroke-linecap="round"/>
        </g>
      </g>`,
    sad: `
      <g class="mascot-sad">
        <path d="M100,55 C140,55 165,86 165,122 C165,160 135,186 100,186 C65,186 35,160 35,122 C35,86 60,55 100,55 Z" fill="#9C7350"/>
        ${[-64, -48, -32, -16, 0, 16, 32, 48, 64].map((deg) => `<polygon points="100,25 92,72 108,72" fill="#7A5738" transform="rotate(${deg} 100 75)"/>`).join('')}
        <ellipse cx="72" cy="74" rx="10" ry="10" fill="#9C7350"/>
        <ellipse cx="128" cy="74" rx="10" ry="10" fill="#9C7350"/>
        <ellipse cx="72" cy="76" rx="5" ry="5.5" fill="#E8D2B0"/>
        <ellipse cx="128" cy="76" rx="5" ry="5.5" fill="#E8D2B0"/>
        <ellipse cx="100" cy="147" rx="52" ry="42" fill="#E8D2B0"/>
        <ellipse cx="34" cy="166" rx="13" ry="15" fill="#7A5738" transform="rotate(12 34 166)"/>
        <ellipse cx="166" cy="166" rx="13" ry="15" fill="#7A5738" transform="rotate(-12 166 166)"/>
        <circle cx="66" cy="150" r="7" fill="#E2703A" opacity="0.2"/>
        <circle cx="134" cy="150" r="7" fill="#E2703A" opacity="0.2"/>
        <path d="M68,122 L88,112" stroke="#22301F" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M132,122 L112,112" stroke="#22301F" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="82" cy="132" r="5.5" fill="#22301F"/>
        <circle cx="118" cy="132" r="5.5" fill="#22301F"/>
        <path d="M128,136 Q131,144 128,150 Q125,144 128,136 Z" fill="#7EC8E3"/>
        <ellipse cx="100" cy="148" rx="6.5" ry="5" fill="#22301F"/>
        <path d="M82,158 Q100,146 118,158" stroke="#22301F" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>`,
  };

  function renderMascot(pose, size) {
    const inner = POSES[pose];
    if (!inner) return '';
    const px = size || 120;
    return `<svg viewBox="0 0 200 230" width="${px}" height="${Math.round(px * 1.15)}" xmlns="http://www.w3.org/2000/svg">${STATIC_BASE}${inner}</svg>`;
  }

  function mountMascots() {
    document.querySelectorAll('[data-mascot]').forEach((el) => {
      const pose = el.dataset.mascot;
      const size = Number(el.dataset.mascotSize) || 120;
      el.innerHTML = renderMascot(pose, size);
    });
  }

  window.renderMascot = renderMascot;
  window.mountMascots = mountMascots;

  mountMascots();
})();
