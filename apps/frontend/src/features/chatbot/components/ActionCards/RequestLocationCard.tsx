import React from 'react';
import { Navigation } from 'lucide-react';
import { theme, ghostButton, primaryButton } from '../../theme/chatbotTheme';
import { ActionShell } from '../ActionShell';

export const RequestLocationCard: React.FC<{
  onShare: () => void;
  onManual: () => void;
}> = ({ onShare, onManual }) => {
  return (
    <ActionShell title="Định vị vị trí" icon={<Navigation size={13} />}>
      <p style={{ margin: '0 0 10px', color: theme.muted, fontSize: 12, lineHeight: 1.4 }}>
        Để tìm các rạp gần bạn nhất, vui lòng chia sẻ vị trí hiện tại của bạn.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <button onClick={onManual} style={ghostButton}>Chọn thủ công</button>
        <button onClick={onShare} style={primaryButton}>Chia sẻ vị trí</button>
      </div>
    </ActionShell>
  );
};
