import { useState, useEffect } from 'react';
import { useEntity } from '../context/EntityContext';
import { CompetitorGroupManager } from '../components/CompetitorGroupManager';
import { CompetitorComparison } from '../components/CompetitorComparison';
import { MarketShareWidget } from '../components/MarketShareWidget';

interface Group {
  id: string;
  name: string;
  description?: string;
  member_count: number;
}

export function CompetitorsPage() {
  const { entities } = useEntity();
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  // Load groups on mount
  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    try {
      setError(null);
      const response = await fetch(`${apiUrl}/api/competitor-groups`);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        if (data.length > 0 && !selectedGroupId) {
          setSelectedGroupId(data[0].id);
        }
      } else if (response.status === 404) {
        setError('⚠️ Backend não está rodando. Inicie com: npm run dev');
        setGroups([]);
      } else {
        setError('Erro ao carregar grupos');
        setGroups([]);
      }
    } catch (err) {
      console.error('❌ Error loading groups:', err);
      setError('⚠️ Backend não está respondendo. Verifique se está rodando em localhost:5001');
      setGroups([]);
    }
  };

  const handleGroupCreate = async (name: string, description: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/competitor-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
      if (response.ok) {
        await loadGroups();
      }
    } catch (err) {
      console.error('❌ Error creating group:', err);
      throw err;
    }
  };

  const handleGroupDelete = async (groupId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/competitor-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadGroups();
        if (selectedGroupId === groupId) {
          setSelectedGroupId(null);
        }
      }
    } catch (err) {
      console.error('❌ Error deleting group:', err);
      throw err;
    }
  };

  const handleAddMember = async (groupId: string, entityId: string, entityName: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/competitor-groups/${groupId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_id: entityId, entity_name: entityName }),
      });
      if (response.ok) {
        await loadGroups();
      }
    } catch (err) {
      console.error('❌ Error adding member:', err);
      throw err;
    }
  };

  const handleRemoveMember = async (groupId: string, entityId: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/competitor-groups/${groupId}/members/${entityId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await loadGroups();
      }
    } catch (err) {
      console.error('❌ Error removing member:', err);
      throw err;
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">👥 Análise de Competidores</h1>
        <p className="text-gray-600">Compare sentimento e participação de mercado entre entidades</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-sm text-yellow-800">{error}</p>
        </div>
      )}

      {/* Main content */}
      <div className="space-y-6">
        {/* Group Manager */}
        <CompetitorGroupManager
          groups={groups}
          selectedGroupId={selectedGroupId}
          onGroupSelect={setSelectedGroupId}
          onGroupCreate={handleGroupCreate}
          onGroupDelete={handleGroupDelete}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
          allEntities={entities}
          apiUrl={apiUrl}
        />

        {/* Comparison and Market Share */}
        {selectedGroupId && (
          <div className="space-y-6">
            <CompetitorComparison
              groupId={selectedGroupId}
              apiUrl={apiUrl}
              entities={entities}
            />

            <MarketShareWidget
              groupId={selectedGroupId}
              apiUrl={apiUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
