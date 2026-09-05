import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from 'lucide-react';
import type { GuestContact } from '../../types/chatbot.types';
import { primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';
import { TextInput } from '../CommonInputs';

export const GuestContactForm: React.FC<{
  initial: GuestContact;
  onSubmit: (contact: GuestContact) => void;
}> = ({ initial, onSubmit }) => {
  const { t } = useTranslation();
  const [contact, setContact] = useState(initial);
  const valid = contact.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim()) && contact.phone.trim();

  return (
    <ActionShell title={t('chatbot.guestContact')} icon={<User size={13} />}>
      <div style={{ display: 'grid', gap: 8 }}>
        <TextInput value={contact.name} onChange={name => setContact(prev => ({ ...prev, name }))} placeholder={t('chatbot.namePlaceholder')} />
        <TextInput value={contact.email} onChange={email => setContact(prev => ({ ...prev, email }))} placeholder={t('chatbot.emailPlaceholder')} />
        <TextInput value={contact.phone} onChange={phone => setContact(prev => ({ ...prev, phone }))} placeholder={t('chatbot.phonePlaceholder')} />
        <button disabled={!valid} onClick={() => onSubmit(contact)} style={{ ...primaryButton, opacity: valid ? 1 : 0.5 }}>
          {t('chatbot.continueBtn')}
        </button>
      </div>
    </ActionShell>
  );
};
