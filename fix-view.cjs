const fs = require('fs');
let code = fs.readFileSync('src/views/tabs/MatchesTab.tsx', 'utf-8');

const startStr = "      ) : viewMode === 'full' ? (";
const endStr = "      })";
const startIndex = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIndex) + endStr.length;

let newCode = code.substring(0, startIndex) + "      ) : (" + code.substring(code.indexOf("      ) : (", endIdx) + 11);

fs.writeFileSync('src/views/tabs/MatchesTab.tsx', newCode);
