export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '-';
  }
}

function trimNumber(num: number): string {
  const rounded = Math.round(num * 10) / 10;
  return rounded.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

/**
 * Formate un montant. Abrège les grandes valeurs :
 * 1 000 000 000 -> "1 Md CDF", 1 500 000 -> "1,5 M CDF", sinon "1 234 CDF".
 */
export function formatMontant(value: number | string | null | undefined, devise = 'CDF'): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${trimNumber(n / 1_000_000_000)} Md ${devise}`;
  if (abs >= 1_000_000) return `${trimNumber(n / 1_000_000)} M ${devise}`;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} ${devise}`;
}

export function formatCdf(value: number | string | null | undefined): string {
  return formatMontant(value, 'CDF');
}

/** Version courte (axes de graphiques) : "1 Md", "1,5 M", "12 K", "500". */
export function formatCdfShort(value: number | string | null | undefined): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${trimNumber(n / 1_000_000_000)} Md`;
  if (abs >= 1_000_000) return `${trimNumber(n / 1_000_000)} M`;
  if (abs >= 1_000) return `${trimNumber(n / 1_000)} K`;
  return `${n.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`;
}
