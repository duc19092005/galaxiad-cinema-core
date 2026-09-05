import React from 'react';
import { Check } from 'lucide-react';
import type { ChoiceOption } from '../../types/chatbot.types';
import { theme, optionButtonStyle } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';

export const ChoicePicker: React.FC<{
  title: string;
  icon: React.ReactNode;
  options: ChoiceOption[];
  onPick: (value: string, option: ChoiceOption) => void;
}> = ({ title, icon, options, onPick }) => (
  <ActionShell title={title} icon={icon}>
    <div style={{ display: 'grid', gap: 8 }}>
      {options.map(option => {
        const value = option.value || option.id || option.label;
        return (
          <button
            key={value}
            onClick={() => onPick(value, option)}
            style={{ ...optionButtonStyle, alignItems: 'flex-start' }}
          >
            <span style={{ textAlign: 'left', minWidth: 0 }}>
              <span style={{ display: 'block', fontWeight: 900 }}>{option.label}</span>
              {option.description && (
                <span style={{ display: 'block', color: theme.muted, fontSize: 11, marginTop: 2 }}>
                  {option.description}
                </span>
              )}
            </span>
            <Check size={14} />
          </button>
        );
      })}
    </div>
  </ActionShell>
);
