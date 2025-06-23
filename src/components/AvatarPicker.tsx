import React from 'react';
import { useAvatarStore } from '../stores/avatarStore';

interface AvatarPickerProps {
  onClose: () => void;
}

function AvatarPicker({ onClose }: AvatarPickerProps) {
  const { avatars, userProfile, setUserAvatar, loading } = useAvatarStore();

  const handleSelectAvatar = async (avatarId: string) => {
    await setUserAvatar(avatarId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-lg shadow-xl p-6 max-w-lg w-full">
        <h3 className="text-lg font-medium text-white mb-4">Choose Your Avatar</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => handleSelectAvatar(avatar.id)}
              disabled={loading}
              className={`
                p-4 rounded-lg border transition-all
                ${avatar.id === userProfile?.avatar_id
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }
              `}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{avatar.emoji}</span>
                <span className="text-sm text-white font-medium">{avatar.name}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 rounded-md text-white hover:bg-white/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default AvatarPicker;