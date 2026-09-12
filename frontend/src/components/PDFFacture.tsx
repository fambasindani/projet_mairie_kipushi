import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Facture } from '../types';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4f46e5' },
  subtitle: { fontSize: 10, color: '#6b7280', marginTop: 4 },
  infoBlock: { marginBottom: 20 },
  infoLabel: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  infoValue: { fontSize: 11, color: '#111827', marginTop: 2, fontWeight: 'bold' },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#f3f4f6' },
  rowLabel: { fontSize: 10, color: '#6b7280' },
  rowValue: { fontSize: 10, color: '#111827', fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderTopWidth: 2, borderTopColor: '#4f46e5', marginTop: 8 },
  totalLabel: { fontSize: 12, fontWeight: 'bold', color: '#4f46e5' },
  totalValue: { fontSize: 14, fontWeight: 'bold', color: '#4f46e5' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#d1d5db', paddingTop: 10 },
  footerText: { fontSize: 8, color: '#9ca3af' },
  qrSection: { alignItems: 'center', marginTop: 20 },
  qrLabel: { fontSize: 8, color: '#6b7280', marginTop: 4 },
});

const formatCdf = (val: number | string) => {
  const num = Math.round(Number(val) || 0);
  const str = num.toString();
  const parts = str.split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return parts.join('.') + ' CDF';
};

interface Props {
  facture: Facture;
  qrDataUrl: string;
}

export function FactureDocument({ facture, qrDataUrl }: Props) {
  const now = new Date().toLocaleDateString('fr-FR');
  const p = facture.declaration_paiement?.personne;
  const personneNom = p?.nom_complet ?? [p?.prenom, p?.nom].filter(Boolean).join(' ') ?? p?.denomination_sociale ?? '';
  const taxeNom = facture.declaration_paiement?.taxe?.nom ?? '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>FACTURE</Text>
            <Text style={styles.subtitle}>I-KIPUSHI — Système de gestion</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.infoValue}>N° {facture.numero_facture}</Text>
            <Text style={styles.infoLabel}>Date d'émission</Text>
            <Text style={{ fontSize: 10, color: '#111827' }}>
              {new Date(facture.date_emission).toLocaleDateString('fr-FR')}
            </Text>
          </View>
        </View>

        <View style={styles.infoBlock}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {personneNom && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Personne</Text>
              <Text style={styles.rowValue}>{personneNom}</Text>
            </View>
          )}
          {taxeNom && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Taxe</Text>
              <Text style={styles.rowValue}>{taxeNom}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Statut</Text>
            <Text style={styles.rowValue}>
              {facture.statut === 'emise' ? 'Émise' : facture.statut === 'payee' ? 'Payée' : 'Annulée'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Devise</Text>
            <Text style={styles.rowValue}>{facture.devise}</Text>
          </View>
          {facture.observations && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Observations</Text>
              <Text style={{ fontSize: 9, color: '#374151', flex: 1 }}>{facture.observations}</Text>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Détail des montants</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Montant HT</Text>
            <Text style={styles.rowValue}>{formatCdf(facture.montant_ht)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Montant TVA</Text>
            <Text style={styles.rowValue}>{formatCdf(facture.montant_tva)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCdf(facture.montant_total)}</Text>
          </View>
        </View>

        <View style={styles.qrSection}>
          {qrDataUrl && <Image src={qrDataUrl} style={{ width: 100, height: 100 }} />}
          <Text style={styles.qrLabel}>QR Code — Vérification</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>I-KIPUSHI — {now}</Text>
          <Text style={styles.footerText}>Document généré automatiquement</Text>
        </View>
      </Page>
    </Document>
  );
}

export default FactureDocument;
