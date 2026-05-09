import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Entity {
  id: string;
  name: string;
  description: string;
  type: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface EntityContextType {
  entities: Entity[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: Entity | undefined;
  loading: boolean;
}

const EntityContext = createContext<EntityContextType | undefined>(undefined);

export function EntityProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const loadEntities = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/entities`);
        if (!response.ok) throw new Error('Failed to load entities');
        const data = await response.json();
        setEntities(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading entities:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEntities();
  }, [apiUrl]);

  const selected = entities.find(e => e.id === selectedId);

  return (
    <EntityContext.Provider value={{ entities, selectedId, setSelectedId, selected, loading }}>
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  const context = useContext(EntityContext);
  if (!context) {
    throw new Error('useEntity must be used within EntityProvider');
  }
  return context;
}
