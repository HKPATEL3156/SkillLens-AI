import React from 'react';
import defaultAvatar from '../assets/default-avatar.svg';

const ProfilePreview = ({ draft, profile, profileImagePreview, resolveAsset, onDownloadResume, onSaveQuick }) => {
  return (
    <div>
      <div className="border rounded-lg p-4 mb-4">
        <div className="flex flex-col items-center text-center">
          <img src={profileImagePreview || resolveAsset(draft.profileImage) || resolveAsset(profile.profileImage) || defaultAvatar} alt="avatar" className="w-36 h-36 rounded-full object-cover mb-3 shadow" />
          <div className="text-xl font-semibold">{draft.fullName || profile.fullName || 'Your name'}</div>
          <div className="text-sm text-gray-500">{draft.headline || profile.headline || 'Headline'}</div>
          <div className="text-sm text-gray-400 mt-2">{draft.primaryLocation || profile.primaryLocation || 'Location'}</div>
        </div>
        <div className="mt-4">
          <div className="text-sm font-medium mb-1">Current Status</div>
          <div className="text-sm text-gray-600">{draft.career?.currentStatus || profile.career?.currentStatus || 'Studying'}</div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Preferred Role</div>
          <div className="text-sm text-gray-600">{draft.career?.preferredRole || profile.career?.preferredRole || '-'}</div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Skills</div>
          <div className="flex flex-wrap gap-2">
            {(draft.career?.skills || profile.career?.skills || []).slice(0,8).map((s,i)=> (
              <span key={i} className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs">{s}</span>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-sm font-medium mb-1">Languages</div>
          <div className="flex flex-wrap gap-2">
            {(draft.languages || profile.languages || []).slice(0,8).map((l,i)=> (
              <span key={i} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{l}</span>
            ))}
          </div>
        </div>
        <div className="mt-4 flex gap-2 justify-center">
          {profile.resumeFilePath || draft.career?.resumeFilePath ? (
            <a href={resolveAsset(profile.resumeFilePath || draft.career?.resumeFilePath)} target="_blank" rel="noreferrer" className="text-sm bg-blue-600 text-white px-3 py-1 rounded">View Resume</a>
          ) : (
            <div className="text-sm text-gray-400">No resume uploaded</div>
          )}
        </div>
      </div>
      <div className="border rounded-lg p-4">
        <div className="text-sm font-semibold mb-2">Quick actions</div>
        <div className="flex flex-col gap-2">
          <button onClick={()=>onSaveQuick && onSaveQuick('header')} className="text-sm bg-gray-100 px-3 py-2 rounded">Save Header</button>
          <button onClick={()=>onSaveQuick && onSaveQuick('personal')} className="text-sm bg-gray-100 px-3 py-2 rounded">Save Personal</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePreview;
