import { EstadoTramiteLabels, EstadoColors, EstadoIcons } from '../../utils/constants';

function StatusBadge({ estado, showIcon = true, size = 'md' }) {
  const label = EstadoTramiteLabels[estado] || estado;
  const colors = EstadoColors[estado] || EstadoColors.PENDIENTE;
  const icon = EstadoIcons[estado] || 'help';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} ${colors.bg} ${colors.text} ${colors.border} border rounded-full font-semibold`}
    >
      {showIcon && <span className="material-symbols-outlined text-sm">{icon}</span>}
      {label}
    </span>
  );
}

export default StatusBadge;
