import { useEffect, useState } from 'react';
import { useEntity } from '../context/EntityContext';

interface EntityForm {
  name: string;
  type: 'politician' | 'influencer' | 'brand';
  description: string;
  url: string;
}

interface Entity {
  id: string;
  name: string;
  type: string;
  description: string;
  url: string;
  created_at: string;
}

export function EntitiesPage() {
  const { entities, setSelectedId, refreshEntities } = useEntity();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  const [form, setForm] = useState<EntityForm>({
    name: '',
    type: 'brand',
    description: '',
    url: '',
  });

  const resetForm = () => {
    setForm({ name: '', type: 'brand', description: '', url: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const loadEntity = async (id: string) => {
    try {
      const response = await fetch(`${apiUrl}/api/entities/${id}`);
      if (!response.ok) throw new Error('Failed to load entity');
      const entity = await response.json();
      setForm({
        name: entity.name,
        type: entity.type,
        description: entity.description || '',
        url: entity.url || '',
      });
      setEditingId(id);
      setShowForm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entity');
    }
  };

  const saveEntity = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!form.name.trim()) {
        throw new Error('Nome é obrigatório');
      }

      const url = editingId
        ? `${apiUrl}/api/entities/${editingId}`
        : `${apiUrl}/api/entities`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao salvar entidade');
      }

      setSuccess(
        editingId
          ? '✅ Entidade atualizada com sucesso!'
          : '✅ Entidade criada com sucesso!'
      );

      resetForm();
      await refreshEntities();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar entidade');
    } finally {
      setLoading(false);
    }
  };

  const deleteEntity = async (id: string) => {
    setError(null);
    setSuccess(null);
    setDeleting(id);

    try {
      const response = await fetch(`${apiUrl}/api/entities/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao deletar entidade');
      }

      setSuccess('✅ Entidade deletada com sucesso!');
      setDeleteConfirm(null);
      await refreshEntities();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar entidade');
    } finally {
      setDeleting(null);
    }
  };

  const typeLabels: { [key: string]: string } = {
    politician: '🏛️ Político',
    influencer: '⭐ Influenciador',
    brand: '🏢 Marca',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">📋 Entidades</h1>
          <p className="text-gray-600">Gerenciar todas as entidades do seu monitoramento</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
            {success}
          </div>
        )}

        {/* Create Button */}
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            ➕ Nova Entidade
          </button>
        )}

        {/* Form Section */}
        {showForm && (
          <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {editingId ? '✏️ Editar Entidade' : '➕ Criar Nova Entidade'}
            </h2>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Digite o nome da entidade"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as 'politician' | 'influencer' | 'brand',
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="brand">🏢 Marca</option>
                    <option value="politician">🏛️ Político</option>
                    <option value="influencer">⭐ Influenciador</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Digite uma descrição (opcional)"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                  placeholder="https://exemplo.com (opcional)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={saveEntity}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400"
              >
                {loading ? '⏳ Salvando...' : '💾 Salvar'}
              </button>
            </div>
          </div>
        )}

        {/* Entities List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {entities.map((entity) => (
            <div
              key={entity.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Entity Header */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{entity.name}</h3>
                    <span className="text-sm text-gray-500">
                      {typeLabels[entity.type] || entity.type}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              {entity.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{entity.description}</p>
              )}

              {/* URL */}
              {entity.url && (
                <a
                  href={entity.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mb-4 block truncate"
                >
                  🔗 {entity.url}
                </a>
              )}

              {/* Created */}
              <p className="text-xs text-gray-500 mb-4">
                Criado em {new Date(entity.created_at).toLocaleDateString('pt-BR')}
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedId(entity.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                >
                  📊 Monitorar
                </button>
                <button
                  onClick={() => loadEntity(entity.id)}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
                >
                  ✏️ Editar
                </button>
                {deleteConfirm === entity.id ? (
                  <div className="flex gap-2 flex-1">
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 px-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => deleteEntity(entity.id)}
                      disabled={deleting === entity.id}
                      className="flex-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold disabled:bg-gray-400"
                    >
                      {deleting === entity.id ? '🗑️' : 'Confirmar'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(entity.id)}
                    className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-semibold"
                  >
                    🗑️ Deletar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {entities.length === 0 && !showForm && (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600 mb-4">Nenhuma entidade criada ainda</p>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              ➕ Criar Primeira Entidade
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
