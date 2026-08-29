import React, { createContext, useContext, useState } from 'react';
import type { Visitor } from '@/src/types/api';

interface GroupDraft {
  groupName: string;
  organization: string;
  hostId?: string;
  departmentId?: string;
  purpose?: string;
  members: Visitor[];
}

interface GroupDraftContextType {
  draft: GroupDraft;
  updateDraft: (partial: Partial<Omit<GroupDraft, 'members'>>) => void;
  addMember: (visitor: Visitor) => void;
  removeMember: (visitorId: string) => void;
  resetDraft: () => void;
}

const initialDraft: GroupDraft = {
  groupName: '',
  organization: '',
  members: [],
};

const GroupDraftContext = createContext<GroupDraftContextType | undefined>(undefined);

export function GroupDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<GroupDraft>(initialDraft);

  function updateDraft(partial: Partial<Omit<GroupDraft, 'members'>>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function addMember(visitor: Visitor) {
    setDraft((prev) => {
      if (prev.members.some((m) => m.id === visitor.id)) return prev;
      return { ...prev, members: [...prev.members, visitor] };
    });
  }

  function removeMember(visitorId: string) {
    setDraft((prev) => ({
      ...prev,
      members: prev.members.filter((m) => m.id !== visitorId),
    }));
  }

  function resetDraft() {
    setDraft(initialDraft);
  }

  return (
    <GroupDraftContext.Provider
      value={{ draft, updateDraft, addMember, removeMember, resetDraft }}
    >
      {children}
    </GroupDraftContext.Provider>
  );
}

export function useGroupDraft() {
  const context = useContext(GroupDraftContext);
  if (context === undefined) {
    throw new Error('useGroupDraft must be used within GroupDraftProvider');
  }
  return context;
}
