'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BsPersonPlusFill, BsXLg, BsDiagram3Fill } from 'react-icons/bs';

function getInitials(name) {
  return (name || 'U').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function MemberCard({ member, isRoot, onClick }) {
  return (
    <div
      className={`tree-card${isRoot ? ' root' : ''}`}
      onClick={() => onClick(member)}
      title={member.name}
    >
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={member.name} className="tree-card-avatar" />
      ) : (
        <div className="tree-card-avatar-placeholder">{getInitials(member.name)}</div>
      )}
      <span className="tree-card-name">{member.name}</span>
      {member.birth_date && (
        <span className="tree-card-meta">
          b. {new Date(member.birth_date).getFullYear()}
        </span>
      )}
    </div>
  );
}

function TreeNode({ member, allMembers, level, onClick }) {
  const children = allMembers.filter((m) => m.parent_id === member.id);
  const spouse = member.spouse_id
    ? allMembers.find((m) => m.id === member.spouse_id)
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Member + spouse */}
      <div className="tree-node-couple">
        <MemberCard member={member} isRoot={level === 0} onClick={onClick} />
        {spouse && (
          <>
            <div className="tree-couple-line" />
            <MemberCard member={spouse} isRoot={false} onClick={onClick} />
          </>
        )}
      </div>

      {/* Children */}
      {children.length > 0 && (
        <>
          <div className="children-connector" />
          <div className="children-row" style={{ '--children-count': children.length }}>
            {children.map((child) => (
              <TreeNode
                key={child.id}
                member={child}
                allMembers={allMembers}
                level={level + 1}
                onClick={onClick}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FamilyTreeView({ members }) {
  const [selectedMember, setSelectedMember] = useState(null);

  const roots = members.filter((m) => !m.parent_id);

  if (!members.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><BsDiagram3Fill style={{ fontSize: '3rem' }} /></div>
        <h3>Family tree is empty</h3>
        <p>Add family members to build your tree</p>
      </div>
    );
  }

  return (
    <>
      <div className="family-tree-container">
        <div className="tree-wrapper">
          {roots.map((root) => (
            <TreeNode
              key={root.id}
              member={root}
              allMembers={members}
              level={0}
              onClick={setSelectedMember}
            />
          ))}
        </div>
      </div>

      {/* Member Detail Modal */}
      {selectedMember && (
        <div className="modal-overlay" onClick={() => setSelectedMember(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>Member Details</h3>
              <button className="modal-close" onClick={() => setSelectedMember(null)}>
                <BsXLg />
              </button>
            </div>

            <div className="member-detail-header">
              {selectedMember.avatar_url ? (
                <img src={selectedMember.avatar_url} alt={selectedMember.name} className="member-detail-avatar" />
              ) : (
                <div style={{
                  width: 88, height: 88, borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.6rem', fontWeight: 800, color: 'white', flexShrink: 0,
                }}>
                  {getInitials(selectedMember.name)}
                </div>
              )}
              <div className="member-detail-info">
                <h3>{selectedMember.name}</h3>
                {selectedMember.gender && (
                  <p className="member-detail-role">{selectedMember.gender}</p>
                )}
                {selectedMember.bio && (
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                    {selectedMember.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="member-detail-grid">
              {selectedMember.birth_date && (
                <div className="member-detail-field">
                  <label>Date of Birth</label>
                  <span>{new Date(selectedMember.birth_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
              {selectedMember.death_date && (
                <div className="member-detail-field">
                  <label>Date of Passing</label>
                  <span>{new Date(selectedMember.death_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
