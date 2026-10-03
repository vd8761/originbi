const fs = require('fs');

const filePaths = [
    'd:/xampp/htdocs/originbi/frontend/app/admin/mindcore/page.tsx',
    'd:/xampp/htdocs/originbi/frontend/app/corporate/mindcore/page.tsx'
];

const svgLogos = `const CustomLogos: Record<string, React.ReactNode> = {
  slack: (
    <svg viewBox="0 0 54 54" className="w-full h-full">
      <path d="M19.712.133a5.381 5.381 0 00-5.376 5.387 5.381 5.381 0 005.376 5.386h5.376V5.52A5.381 5.381 0 0019.712.133m0 14.365H5.376A5.381 5.381 0 000 19.884a5.381 5.381 0 005.376 5.387h14.336a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386" fill="#36c5f0"/>
      <path d="M53.76 19.884a5.381 5.381 0 00-5.376-5.386 5.381 5.381 0 00-5.376 5.386v5.387h5.376a5.381 5.381 0 005.376-5.387m-14.336 0V5.52A5.381 5.381 0 0034.048.133a5.381 5.381 0 00-5.376 5.387v14.364a5.381 5.381 0 005.376 5.387 5.381 5.381 0 005.376-5.387" fill="#2eb67d"/>
      <path d="M34.048 54a5.381 5.381 0 005.376-5.387 5.381 5.381 0 00-5.376-5.386h-5.376v5.386A5.381 5.381 0 0034.048 54m0-14.365h14.336a5.381 5.381 0 005.376-5.386 5.381 5.381 0 00-5.376-5.387H34.048a5.381 5.381 0 00-5.376 5.387 5.381 5.381 0 005.376 5.386" fill="#ecb22e"/>
      <path d="M0 34.249a5.381 5.381 0 005.376 5.386 5.381 5.381 0 005.376-5.386v-5.387H5.376A5.381 5.381 0 000 34.249m14.336 0v14.364A5.381 5.381 0 0019.712 54a5.381 5.381 0 005.376-5.387V34.249a5.381 5.381 0 00-5.376-5.387 5.381 5.381 0 00-5.376 5.387" fill="#e01e5a"/>
    </svg>
  ),
  clickup: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="cu-a" x1="2.594" y1="24.435" x2="27.084" y2="24.435" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8930fd"/><stop offset="1" stopColor="#49ccf9"/>
        </linearGradient>
        <linearGradient id="cu-b" x1="3" y1="8.54" x2="26.74" y2="8.54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8930fd"/><stop offset="1" stopColor="#49ccf9"/>
        </linearGradient>
      </defs>
      <path d="M2.594 22.8L7.73 18.87c2.22 3.01 4.56 4.38 7.14 4.38 2.56 0 4.86-1.35 7.04-4.34l5.17 3.88C23.86 27.27 19.82 30 14.87 30c-4.98 0-9.05-2.77-12.28-7.2z" fill="url(#cu-a)"/>
      <path d="M14.87 8.19L7.29 15.08 3 10.49 14.87 2l11.87 8.49-4.29 4.59z" fill="url(#cu-b)"/>
    </svg>
  ),
  trello: (
    <svg viewBox="0 0 256 256" className="w-full h-full">
      <rect width="256" height="256" rx="25" fill="#0079BF"/>
      <rect x="144" y="32" width="80" height="112" rx="8" fill="white"/>
      <rect x="32" y="32" width="80" height="176" rx="8" fill="white"/>
    </svg>
  ),
  monday: (
    <svg viewBox="0 0 75 75" className="w-full h-full">
      <circle cx="37.5" cy="37.5" r="37.5" fill="#ff3d57"/>
      <ellipse cx="20.5" cy="42.2" rx="11.8" ry="11.8" fill="#ffcb00"/>
      <ellipse cx="37.5" cy="42.2" rx="11.8" ry="11.8" fill="#00ca72"/>
      <ellipse cx="54.5" cy="42.2" rx="11.8" ry="11.8" fill="#ff3d57"/>
    </svg>
  ),
  zoho_crm: (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <rect width="64" height="64" rx="8" fill="#E42527"/>
      <text x="10" y="46" fontSize="38" fontWeight="bold" fill="white" fontFamily="Arial">Z</text>
    </svg>
  ),
  jira: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="jira-a" x1="100%" x2="45.99%" y1="14.17%" y2="88.83%">
          <stop offset="18%" stopColor="#0052cc"/><stop offset="100%" stopColor="#2684ff"/>
        </linearGradient>
        <linearGradient id="jira-b" x1="0%" x2="54.01%" y1="85.83%" y2="11.17%">
          <stop offset="18%" stopColor="#0052cc"/><stop offset="100%" stopColor="#2684ff"/>
        </linearGradient>
      </defs>
      <path d="M15.98 0L8.1 7.88l4.49 4.49 3.39-3.39 7.88 7.88 4.49-4.49z" fill="#2684ff"/>
      <path d="M8.1 7.88L.22 15.76l7.88 7.88 4.49-4.49-3.39-3.39 3.39-3.39z" fill="url(#jira-a)"/>
      <path d="M23.9 7.88l-4.49 4.49 3.39 3.39-3.39 3.39 4.49 4.49 7.88-7.88z" fill="url(#jira-b)"/>
      <path d="M15.98 32l7.88-7.88-4.49-4.49-3.39 3.39-7.88-7.88-4.49 4.49z" fill="#2684ff"/>
    </svg>
  ),
  microsoft_teams: (
    <svg viewBox="0 0 2228.833 2073.333" className="w-full h-full">
      <path d="M1554.637 777.5h575.713c54.391 0 98.483 44.092 98.483 98.483v524.398c0 199.901-162.051 361.952-361.952 361.952h-1.711c-199.901.028-361.975-162.023-361.975-361.924V828.971c.001-28.427 23.044-51.471 51.442-51.471z" fill="#5059c9"/>
      <circle cx="1943.75" cy="440.583" r="233.25" fill="#5059c9"/>
      <circle cx="1218.083" cy="336.917" r="336.917" fill="#7b83eb"/>
      <path d="M1667.323 777.5H717.01c-53.743 1.33-96.257 45.931-94.927 99.676v598.105c-7.843 322.202 247.767 590.862 569.967 598.833 322.2-7.971 577.81-276.631 569.967-598.833V877.176c1.33-53.745-41.184-98.346-94.694-99.676z" fill="#7b83eb"/>
      <path d="M1243 777.5v838.145c-.258 38.435-23.549 72.964-59.09 87.598a91.856 91.856 0 01-34.765 6.782H667.613c-6.667-21.857-12.709-43.712-17.86-65.853-18.494-80.888-27.802-163.637-27.647-246.671V877.02c-1.33-53.611 41.044-98.104 94.549-99.52H1243z" fill="#6264a7" opacity=".5"/>
      <path d="M1218 777.5v864.927c-.076 12.016-1.664 23.981-4.717 35.579a91.328 91.328 0 01-87.282 65.994H691.322A597.492 597.492 0 01667.613 1677a589.263 589.263 0 01-17.86-65.853c-18.494-80.888-27.802-163.637-27.647-246.671V877.02c-1.33-53.611 41.044-98.104 94.549-99.52H1218z" fill="#6264a7" opacity=".5"/>
      <path d="M1243 777.5v711.773c-.285 50.676-41.199 91.588-91.876 91.876H667.613A597.492 597.492 0 01649.753 1677a589.263 589.263 0 01-17.86-65.853V877.02c-1.33-53.611 41.044-98.104 94.549-99.52H1243z" fill="#6264a7" opacity=".5"/>
      <path d="M1218 777.5v711.773c-.285 50.676-41.199 91.588-91.876 91.876H649.753A589.263 589.263 0 01631.893 1677V877.02c-1.33-53.611 41.044-98.104 94.549-99.52H1218z" fill="#6264a7" opacity=".5"/>
      <path d="M0 892.583c0-270.52 219.314-489.833 489.833-489.833s489.833 219.314 489.833 489.833-219.314 489.833-489.833 489.833S0 1163.103 0 892.583z" fill="#7b83eb"/>
      <path d="M701.955 632.5H277.712A489.833 489.833 0 000 892.583c0 198.738 118.305 370.648 289.713 450.288V745.576c.352-62.131 50.968-112.393 113.101-112.393 99.274.328 199.141-.328 299.141.317z" fill="#6264a7"/>
    </svg>
  ),
  office_365: (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <path d="M19.484 3L9 6.69v18.62l10.484 3.69L30 26.31V5.69L19.484 3zm-1.468 20.97L11 22.02V9.98l7.016-1.95v15.94z" fill="#EB3C00"/>
      <path d="M11 22.02l7.016 1.95V8.03L11 9.98v12.04z" fill="#FF8C00"/>
    </svg>
  ),
  google_drive: (
    <svg viewBox="0 0 87.3 78" className="w-full h-full">
      <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.5 53H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3L1.2 48.5A9.06 9.06 0 000 53h27.5z" fill="#00ac47"/>
      <path d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8L73.55 76.8z" fill="#ea4335"/>
      <path d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="M73.4 26.5l-13.2-22.85c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25 59.8 53h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  )
};`;

for (let file of filePaths) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('CustomLogos')) {
        content = content.replace('/* ───────────────────────── data ───────────────────────── */', '/* ───────────────────────── data ───────────────────────── */\n' + svgLogos);
    }
    
    // Replace DOCK with id matching CustomLogos keys
    const newDockStr = \`const DOCK = [
  { name: "Google Drive", id: "google_drive", ab: "GD", color: "#1FA463" }, { name: "Slack", id: "slack", ab: "S", color: "#4A154B" },
  { name: "ClickUp", id: "clickup", ab: "CU", color: "#7B68EE" }, { name: "Trello", id: "trello", ab: "T", color: "#0079BF" },
  { name: "Monday CRM", id: "monday", ab: "M", color: "#FF3D57" }, { name: "Zoho CRM", id: "zoho_crm", ab: "Z", color: "#E42527" },
  { name: "Atlassian / Jira", id: "jira", ab: "J", color: "#2684FF" }, { name: "Microsoft Teams", id: "microsoft_teams", ab: "MT", color: "#5059C9" },
  { name: "Office 365", id: "office_365", ab: "O", color: "#EB3C00" },
];\`;

    content = content.replace(/const DOCK = \[[\\s\\S]*?\];/, newDockStr);
    
    // Find the render block for DOCK icons
    content = content.replace(
        /<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-\[11px\] font-bold text-white" style=\{\{ background: d\.color \}\}>\{d\.ab\}<\/span>/g,
        \`<span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg shadow-sm border border-slate-100 bg-white" style={{ color: d.color }}>{CustomLogos[d.id] ? <span className="w-5 h-5 flex items-center justify-center">{CustomLogos[d.id]}</span> : d.ab}</span>\`
    );
    
    fs.writeFileSync(file, content);
}
console.log('Done');
