import { useState } from 'react';

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count: number;
}

interface CompetitorGroupManagerProps {
  groups: Group[];
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
  onGroupCreate: (name: string, description: string) => Promise<void>;
  onGroupDelete: (groupId: string) => Promise<void>;
  onAddMember: (groupId: string, entityId: string, entityName: string) => Promise<void>;
  onRemoveMember: (groupId: string, entityId: string) => Promise<void>;
  allEntities: Array<{ id: string; name: string }>;
  apiUrl: string;
}

export function CompetitorGroupManager({
  groups,
  selectedGroupId,
  onGroupSelect,
  onGroupCreate,
  onGroupDelete,
  onAddMember,
  onRemoveMember,
  allEntities,
  apiUrl,
}: CompetitorGroupManagerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<Array<{ id: string; name: string }>>([]);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setLoading(true);
    try {
      await onGroupCreate(newGroupName, newGroupDesc);
      setNewGroupName('');
      setNewGroupDesc('');
      setShowCreateModal(false);
    } catch (err) {
      setError('Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGroup = async (groupId: string) => {
    onGroupSelect(groupId);
    try {
      const response = await fetch(`${apiUrl}/api/competitor-groups/${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setGroupMembers(data.members);
      }
    } catch (err) {
      console.error('Erro ao carregar membros:', err);
    }
  };

  const handleAddMember = async (entityId: string) => {
    const entity = allEntities.find((e) => e.id === entityId);
    if (!selectedGroupId || !entity) return;

    setLoading(true);
    try {
      await onAddMember(selectedGroupId, entityId, entity.name);
      // Reload members
      await handleSelectGroup(selectedGroupId);
    } catch (err) {
      setError('Erro ao adicionar membro');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (entityId: string) => {
    if (!selectedGroupId) return;
    setLoading(true);
    try {
      await onRemoveMember(selectedGroupId, entityId);
      // Reload members
      await handleSelectGroup(selectedGroupId);
    } catch (err) {
      setError('Erro ao remover membro');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Tem certeza que deseja deletar este grupo?')) return;
    setLoading(true);
    try {
      await onGroupDelete(groupId);
      if (selectedGroupId === groupId) {
        onGroupSelect('');
        setGroupMembers([]);
      }
    } catch (err) {
      setError('Erro ao deletar grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Groups List */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">👥 Grupos</h3>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
            >
              ➕ Novo
            </button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-xs text-gray-500">Nenhum grupo criado</p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedGroupId === group.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.member_count} membros</p>
                    </div>
                    {selectedGroupId === group.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteGroup(group.id);
                        }}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Group Details */}
      <div className="md:col-span-2">
        {selectedGroupId ? (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">📋 Membros do Grupo</h3>

            {/* Add Member */}
            <div className="mb-4">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddMember(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
                disabled={loading}
              >
                <option value="">Adicionar entidade...</option>
                {allEntities
                  .filter((e) => !groupMembers.find((m) => m.id === e.id))
                  .map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Members List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groupMembers.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhum membro no grupo</p>
              ) : (
                groupMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                  >
                    <span className="text-sm text-gray-900">{member.name}</span>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={loading}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 flex items-center justify-center h-full">
            <p className="text-gray-500">Selecione um grupo para ver membros</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Criar Novo Grupo</h2>

            <input
              type="text"
              placeholder="Nome do grupo"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3"
              disabled={loading}
            />

            <textarea
              placeholder="Descrição (opcional)"
              value={newGroupDesc}
              onChange={(e) => setNewGroupDesc(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
              rows={3}
              disabled={loading}
            />

            {error && <p className="text-red-600 text-xs mb-4">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
                disabled={loading || !newGroupName.trim()}
              >
                {loading ? '⏳' : '✓'} Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
