/** The hero landscape: stars, embers and the tree on the hill, copied from the portal prototype so it matches exactly.
 * Purely decorative, so every part is hidden from assistive technology. */
export function HeroArt() {
  return (
    <>
      <div className="hero-stars" aria-hidden="true"></div>
        <div className="hero-embers" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <svg className="hero-land" viewBox="0 0 1440 300" preserveAspectRatio="xMidYMax meet" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="flame" x1="0" x2="1"><stop offset="0" stopColor="#B3260E"/><stop offset=".55" stopColor="#E8541A"/><stop offset="1" stopColor="#F28216"/></linearGradient>
            <linearGradient id="rock" gradientUnits="userSpaceOnUse" x1="560" y1="40" x2="1500" y2="240"><stop offset="0" style={{ "stopColor": "var(--rock-a)" }}/><stop offset="1" style={{ "stopColor": "var(--rock-b)" }}/></linearGradient>
            <linearGradient id="land" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1440" y2="0"><stop offset="0" style={{ "stopColor": "var(--land-a)" }}/><stop offset="1" style={{ "stopColor": "var(--land-b)" }}/></linearGradient>
            <linearGradient id="hill" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="660" y2="0"><stop offset="0" style={{ "stopColor": "var(--cliff-a)" }}/><stop offset="1" style={{ "stopColor": "var(--cliff-b)" }}/></linearGradient>
            <linearGradient id="crown" gradientUnits="userSpaceOnUse" x1="60" y1="0" x2="290" y2="0"><stop offset="0" style={{ "stopColor": "var(--tree-a)" }}/><stop offset=".55" style={{ "stopColor": "var(--tree-b)" }}/><stop offset="1" style={{ "stopColor": "var(--tree-c)" }}/></linearGradient>
            <linearGradient id="lit" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ "stopColor": "var(--lit)" }} stopOpacity=".55"/><stop offset="1" style={{ "stopColor": "var(--lit)" }} stopOpacity="0"/></linearGradient>
            <linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style={{ "stopColor": "var(--mist)" }} stopOpacity="0"/><stop offset="1" style={{ "stopColor": "var(--mist)" }} stopOpacity=".8"/></linearGradient>
            <radialGradient id="sun" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFD08A"/><stop offset=".6" stopColor="#FF9A4D"/><stop offset="1" stopColor="#F28216"/></radialGradient>
            <radialGradient id="glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#FFB070" stopOpacity=".6"/><stop offset="1" stopColor="#FFB070" stopOpacity="0"/></radialGradient>
            <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
            <filter id="softer" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
          </defs>
      
          <g className="clouds"><ellipse cx="470" cy="38" rx="70" ry="11"/><ellipse cx="510" cy="30" rx="40" ry="11"/><ellipse cx="1180" cy="26" rx="80" ry="10"/><ellipse cx="1220" cy="18" rx="42" ry="10"/></g>
          <circle className="sun-glow" cx="560" cy="96" r="150" fill="url(#glow)"/>
          <circle className="sun" cx="560" cy="96" r="44" fill="url(#sun)"/>
      
          <g className="layer far"><path style={{ "fill": "var(--far)" }} d="M-700 200 C-500 150 -300 160 -100 132 S200 92 330 112 S560 66 700 98 S960 52 1100 82 S1350 62 1500 96 S1900 92 2140 122 L2140 300 L-700 300Z"/></g>
          <g className="birds" style={{ "stroke": "var(--bird)" }}><path d="M0 0 q6 -6 12 0 q6 -6 12 0"/><path d="M30 -14 q5 -5 10 0 q5 -5 10 0"/><path d="M-26 -10 q4 -4 8 0 q4 -4 8 0"/></g>
          <path style={{ "fill": "var(--mid)" }} d="M-700 214 C-300 160 60 176 380 156 S820 150 1060 148 S1600 140 2140 158 L2140 260 L-700 260Z"/>
      
          {/* main range: rounded summits, curved ridgelines */}
          <path fill="url(#rock)" d="M450 240 C510 196 570 150 606 112 Q620 94 636 108 C656 120 676 124 690 124 C716 98 748 52 760 40 Q770 28 782 40 C796 54 808 66 820 70 C840 48 862 22 872 13 Q880 4 890 13 C906 30 932 60 950 72 C970 62 992 48 1002 44 Q1010 36 1020 45 C1040 66 1062 98 1080 110 C1104 92 1146 70 1160 64 Q1170 57 1181 66 C1200 84 1230 110 1250 118 C1270 108 1298 98 1310 96 Q1320 91 1331 99 C1352 113 1380 134 1402 140 C1440 134 1500 120 1560 124 C1660 112 1760 118 1860 132 C1960 128 2060 138 2140 144 L2140 240 L450 240Z"/>
          <g fill="url(#lit)" filter="url(#soft)">
            <path d="M622 96 C604 114 572 150 540 186 L588 182 C598 152 610 124 622 96Z"/>
            <path d="M771 31 C752 54 718 94 692 124 L730 130 C744 100 758 64 771 31Z"/>
            <path d="M881 7 C866 26 840 52 822 70 L854 92 C864 66 874 36 881 7Z"/>
            <path d="M1011 39 C996 50 966 66 952 72 L986 86 C996 70 1004 54 1011 39Z"/>
            <path d="M1171 60 C1150 76 1110 100 1082 110 L1124 120 C1140 104 1158 82 1171 60Z"/>
            <path d="M1320 93 C1306 100 1272 112 1252 118 L1288 130 C1300 118 1311 105 1320 93Z"/>
          </g>
          <g className="ridges" fill="none" style={{ "stroke": "var(--ridge)" }} strokeWidth="1.6" strokeLinecap="round" opacity=".28" filter="url(#soft)">
            <path d="M880 14 C894 40 912 64 936 92"/><path d="M770 40 C782 62 796 84 812 108"/><path d="M1170 66 C1182 90 1196 112 1214 140"/><path d="M1010 46 C1022 66 1036 86 1054 112"/>
          </g>
          <g style={{ "fill": "var(--snow)" }} filter="url(#soft)">
            <path d="M872 13 Q880 4 890 13 C898 22 904 30 908 38 C900 35 895 41 888 36 C882 43 875 38 868 43 C867 32 869 21 872 13Z"/>
            <path d="M760 40 Q770 28 782 40 C788 47 792 53 795 60 C788 57 784 62 778 58 C772 63 766 59 759 63 C757 54 758 47 760 40Z"/>
            <path d="M1160 64 Q1170 57 1181 66 C1187 72 1191 78 1194 84 C1188 81 1184 86 1178 82 C1172 87 1166 83 1158 87 C1157 79 1158 70 1160 64Z"/>
            <path d="M1002 44 Q1010 36 1020 45 C1025 51 1028 56 1030 61 C1024 59 1020 63 1015 60 C1010 64 1005 61 999 64 C998 57 1000 50 1002 44Z"/>
          </g>
          <rect x="-700" y="150" width="2840" height="80" fill="url(#mist)"/>
      
          <path fill="url(#land)" d="M-700 300 L-700 212 C-200 200 200 196 560 200 C760 206 980 196 1200 200 C1500 206 1800 200 2140 204 L2140 300Z"/>
          <path className="river" style={{ "fill": "var(--river)" }} d="M990 201 C880 206 740 210 660 224 C560 242 570 262 660 274 C750 286 720 294 600 300 L1100 300 C1080 288 1000 276 880 266 C790 258 780 246 820 236 C880 222 960 214 1030 207Z"/>
          <path className="river-flow" d="M1008 204 C880 214 700 226 680 246 C670 262 760 272 840 282 C920 292 880 296 860 300" fill="none" style={{ "stroke": "var(--river-line)" }} strokeWidth="2.5" strokeDasharray="12 18" strokeLinecap="round"/>
          <path className="river-flow r2" d="M1020 206 C910 218 790 232 790 250 C790 266 900 276 980 286 C1040 294 1030 298 1020 300" fill="none" style={{ "stroke": "var(--river-line)" }} strokeWidth="1.8" strokeDasharray="8 22" strokeLinecap="round" opacity=".7"/>
      
          {/* foothill with the tree, at the foot of the range */}
          <path fill="url(#hill)" d="M40 300 C80 246 180 184 280 172 C380 162 470 190 560 248 C600 274 640 292 660 300Z"/>
          <path style={{ "fill": "var(--lit)" }} opacity=".28" filter="url(#softer)" d="M280 172 C380 162 470 190 560 248 C500 232 430 208 360 198 C330 192 300 184 280 172Z"/>
          <g transform="translate(136.4 5) scale(1.1)">
            <g className="roots" fill="none" style={{ "stroke": "var(--root)" }} strokeLinecap="round">
              <path strokeWidth="3" d="M170 150 C168 175 150 192 140 222"/><path strokeWidth="3" d="M174 150 C178 172 192 188 206 216"/>
              <path strokeWidth="2" d="M168 152 C158 168 130 174 116 196"/><path strokeWidth="2" d="M176 152 C188 164 216 168 234 188"/>
              <path strokeWidth="1.4" d="M150 192 C140 202 136 216 128 234"/><path strokeWidth="1.4" d="M192 190 C202 200 214 204 222 224"/>
              <path strokeWidth="1.2" d="M130 176 C120 182 112 190 100 192"/><path strokeWidth="1.2" d="M216 170 C228 174 240 176 252 172"/>
              <path strokeWidth="1" d="M140 222 C136 232 140 240 134 252"/><path strokeWidth="1" d="M206 216 C214 226 212 236 220 246"/>
            </g>
            <g className="tree">
              <path style={{ "fill": "var(--trunk)" }} d="M164 150 C168 130 170 116 167 100 L185 100 C182 116 184 132 190 150Z"/>
              <g fill="none" style={{ "stroke": "var(--trunk)" }} strokeLinecap="round"><path strokeWidth="5" d="M175 110 C164 100 148 96 130 98"/><path strokeWidth="5" d="M177 106 C192 98 208 98 226 102"/><path strokeWidth="3" d="M174 102 C170 88 166 80 158 72"/><path strokeWidth="3" d="M178 100 C184 86 192 78 202 72"/></g>
              <g className="crown" fill="url(#crown)">
                <circle cx="175" cy="70" r="40"/><circle cx="135" cy="82" r="30"/><circle cx="215" cy="80" r="32"/><circle cx="105" cy="95" r="20"/><circle cx="245" cy="95" r="22"/>
                <circle cx="150" cy="55" r="28"/><circle cx="200" cy="52" r="27"/><circle cx="175" cy="42" r="24"/><circle cx="120" cy="68" r="22"/><circle cx="232" cy="66" r="22"/>
                <circle cx="160" cy="98" r="18"/><circle cx="195" cy="98" r="18"/><circle cx="88" cy="100" r="11"/><circle cx="264" cy="104" r="12"/>
                <circle cx="80" cy="92" r="6"/><circle cx="272" cy="90" r="7"/><circle cx="108" cy="58" r="8"/><circle cx="248" cy="52" r="8"/><circle cx="175" cy="18" r="9"/>
                <circle cx="138" cy="32" r="8"/><circle cx="214" cy="30" r="8"/><circle cx="70" cy="104" r="5"/><circle cx="282" cy="110" r="5"/><circle cx="96" cy="78" r="5"/><circle cx="258" cy="76" r="5"/>
              </g>
              <g style={{ "fill": "var(--leaf-gap)" }}><circle cx="150" cy="75" r="3"/><circle cx="205" cy="86" r="3"/><circle cx="186" cy="60" r="2.5"/><circle cx="128" cy="96" r="2"/><circle cx="226" cy="98" r="2"/><circle cx="166" cy="40" r="2"/><circle cx="236" cy="72" r="2"/><circle cx="114" cy="80" r="2"/></g>
            </g>
          </g>
        </svg>
    </>
  );
}
