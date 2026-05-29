import React from 'react';
import { motion } from 'motion/react';
import { useEvents } from '../lib/eventsContext';
import { cn } from '../lib/utils';

export function MemberFilterBar() {
  const { familyMembers, selectedMembers, toggleMember } = useEvents();

  return (
    <div className="sticky top-0 z-30 bg-[#fcffe4]/95 backdrop-blur-sm py-2 px-2 flex gap-2 overflow-x-auto shrink-0 border-b-2 border-ink/10">
      {familyMembers.map((member) => {
        const isSelected = selectedMembers.includes(member.id);
        return (
          <motion.button
            key={member.id}
            whileTap={{ scale: 0.9 }}
            onClick={() => toggleMember(member.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[2px] border-ink transition-all shrink-0",
              isSelected ? member.bgClass : "bg-surface opacity-50"
            )}
          >
            <div className={cn("w-5 h-5 rounded-full border border-ink flex items-center justify-center text-[9px] font-black", member.bgClass)}>
              {member.name[0]}
            </div>
            <span className="font-bold text-xs">{member.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
