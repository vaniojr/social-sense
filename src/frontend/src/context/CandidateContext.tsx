import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Candidate {
  id: string;
  name: string;
  description: string;
  category: string;
  url: string;
  created_at: string;
  updated_at: string;
}

interface CandidateContextType {
  candidates: Candidate[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  selected: Candidate | undefined;
  loading: boolean;
}

const CandidateContext = createContext<CandidateContextType | undefined>(undefined);

export function CandidateProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';

  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const response = await fetch(`${apiUrl}/api/candidates`);
        if (!response.ok) throw new Error('Failed to load candidates');
        const data = await response.json();
        setCandidates(data);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error('Error loading candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCandidates();
  }, [apiUrl]);

  const selected = candidates.find(c => c.id === selectedId);

  return (
    <CandidateContext.Provider value={{ candidates, selectedId, setSelectedId, selected, loading }}>
      {children}
    </CandidateContext.Provider>
  );
}

export function useCandidate() {
  const context = useContext(CandidateContext);
  if (!context) {
    throw new Error('useCandidate must be used within CandidateProvider');
  }
  return context;
}
