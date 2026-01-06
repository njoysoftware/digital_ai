
// Added React import to provide access to the React namespace
import React from 'react';

export interface Message {
  role: 'user' | 'ai';
  content: string;
}

export interface QuickMenuProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}