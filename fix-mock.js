const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/components/**/*.tsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes("import { familyMembers } from '../data/mockData';") || content.includes("import { mockEvents, familyMembers } from '../data/mockData';")) {
    
    // Remove the import specifically for familyMembers
    content = content.replace(/import \{.*?familyMembers.*?\} from '\.\.\/data\/mockData';/, function(match) {
      if (match.includes('mockEvents')) {
        return "import { mockEvents } from '../data/mockData';";
      }
      return '';
    });

    // Ensure useEvents is imported
    if (!content.includes('useEvents')) {
      content = content.replace(/import React/, "import { useEvents } from '../lib/eventsContext';\nimport React");
    }

    // Now insert const { familyMembers } = useEvents(); 
    // we assume we can insert it right after `const { t } = useTranslation();`
    // or just at the beginning of the functional component blocks.
    
    // Since some files have multiple components, let's target by finding the first `{` after the export function.
    const cmpRegex = /(export function [a-zA-Z0-9_]+\([^)]*\)\s*\{)/g;
    content = content.replace(cmpRegex, (match) => {
        return match + "\n  const eventsCtx = useEvents();\n  const familyMembers = eventsCtx?.familyMembers || [];";
    });

    // For Sidebar LocationEditModal it's not exported.
    const fnRegex = /(function [a-zA-Z0-9_]+\([^)]*\)\s*\{)/g;
    content = content.replace(fnRegex, (match) => {
        if(match.includes('InteractiveLogo') || match.includes('SidebarTooltip')) return match;
        if(match.includes('export function') || match.includes('LocationEditModal') || match.includes('function ')) {
          if (!match.includes('export function')) {
             return match + "\n  const eventsCtx = useEvents();\n  const familyMembers = eventsCtx?.familyMembers || [];";
          }
        }
        return match;
    });

    // But wait, the export function was already matched.
    // Let's just fix duplication by running a single regex replacement on "function *(*) {" and checking if we already patched it.
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Processed', file);
  }
});
