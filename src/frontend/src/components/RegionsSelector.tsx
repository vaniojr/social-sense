interface RegionsSelectorProps {
  selectedRegions: string[];
  onRegionsChange: (regions: string[]) => void;
}

const BRAZILIAN_STATES = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' },
];

export function RegionsSelector({ selectedRegions, onRegionsChange }: RegionsSelectorProps) {
  const toggleRegion = (code: string) => {
    if (selectedRegions.includes(code)) {
      onRegionsChange(selectedRegions.filter((r) => r !== code));
    } else {
      onRegionsChange([...selectedRegions, code]);
    }
  };

  const selectAll = () => {
    onRegionsChange(BRAZILIAN_STATES.map((s) => s.code));
  };

  const clearAll = () => {
    onRegionsChange([]);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">🗺️ Regiões Prioritárias</h3>
        <div className="space-x-2">
          <button
            onClick={selectAll}
            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
          >
            Todas
          </button>
          <button
            onClick={clearAll}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded transition-colors"
          >
            Nenhuma
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Selecione as regiões onde deseja concentrar o monitoramento.
      </p>

      {/* States grid */}
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {BRAZILIAN_STATES.map(({ code, name }) => (
          <button
            key={code}
            onClick={() => toggleRegion(code)}
            className={`p-3 rounded-lg border-2 text-center transition-all ${
              selectedRegions.includes(code)
                ? 'border-blue-600 bg-blue-50 text-blue-900 font-semibold'
                : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
            }`}
            title={name}
          >
            <div className="font-bold text-sm">{code}</div>
            <div className="text-xs hidden md:block truncate">{name.split(' ')[0]}</div>
          </button>
        ))}
      </div>

      {/* Counter */}
      <div className="mt-4 text-sm text-gray-600">
        {selectedRegions.length} estado(s) selecionado(s)
      </div>
    </div>
  );
}
