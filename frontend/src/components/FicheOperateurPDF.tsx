import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Personne } from '../types';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica', backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 24, border: '1 solid #e2e8f0' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#4f46e5', paddingBottom: 16 },
  logoBox: { width: 50, height: 50, backgroundColor: '#4f46e5', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  logoText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  headerSubtitle: { fontSize: 9, color: '#64748b', marginTop: 2 },
  photoSection: { flexDirection: 'row', marginBottom: 20, gap: 20 },
  photoBox: { width: 110, height: 130, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { width: 110, height: 130 },
  photoPlaceholder: { fontSize: 32, fontWeight: 'bold', color: '#4f46e5' },
  infoSection: { flex: 1 },
  nameLabel: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  roleLabel: { fontSize: 10, color: '#4f46e5', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  detailItem: { width: '48%', marginBottom: 8 },
  detailLabel: { fontSize: 8, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 11, color: '#1e293b', fontWeight: 'bold', marginTop: 2 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', color: '#4f46e5', marginTop: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  qrSection: { alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  qrLabel: { fontSize: 8, color: '#64748b', marginTop: 6 },
  footer: { position: 'absolute', bottom: 20, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingTop: 8 },
  footerText: { fontSize: 7, color: '#94a3b8' },
});

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function getInitials(p: Personne): string {
  return ((p.prenom?.[0] ?? '') + (p.nom?.[0] ?? '')).toUpperCase() || '?';
}

interface Props {
  personne: Personne;
  qrDataUrl: string;
  photoDataUrl?: string | null;
}

export function FicheOperateurDocument({ personne: p, qrDataUrl, photoDataUrl }: Props) {
  const now = new Date().toLocaleDateString('fr-FR');
  const displayName = p.nom_complet ?? [p.prenom, p.nom].filter(Boolean).join(' ') ?? '';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>GS</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>FICHE IDENTIFICATION OPÉRATEUR</Text>
              <Text style={styles.headerSubtitle}>Système de Gestion I-KIPUSHI</Text>
            </View>
          </View>

          <View style={styles.photoSection}>
            <View style={styles.photoBox}>
              {photoDataUrl ? (
                <Image src={photoDataUrl} style={styles.photoImage} />
              ) : (
                <Text style={styles.photoPlaceholder}>{getInitials(p)}</Text>
              )}
            </View>
            <View style={styles.infoSection}>
              <Text style={styles.nameLabel}>{displayName}</Text>
              <Text style={styles.roleLabel}>{p.type === 'physique' ? 'Personne physique' : 'Personne morale'}</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>ID Opérateur</Text>
                  <Text style={styles.detailValue}>#{p.id}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Type</Text>
                  <Text style={styles.detailValue}>{p.type === 'physique' ? 'Physique' : 'Morale'}</Text>
                </View>
                {p.denomination_sociale && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Dénomination sociale</Text>
                    <Text style={styles.detailValue}>{p.denomination_sociale}</Text>
                  </View>
                )}
                {p.forme_juridique && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Forme juridique</Text>
                    <Text style={styles.detailValue}>{p.forme_juridique}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Informations personnelles */}
          <Text style={styles.sectionTitle}>Informations personnelles</Text>
          <View style={styles.detailGrid}>
            {p.sexe && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Sexe</Text>
                <Text style={styles.detailValue}>{p.sexe === 'M' ? 'Masculin' : 'Féminin'}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date de naissance</Text>
              <Text style={styles.detailValue}>{formatDate(p.date_naissance)}</Text>
            </View>
            {p.lieu_naissance && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Lieu de naissance</Text>
                <Text style={styles.detailValue}>{p.lieu_naissance}</Text>
              </View>
            )}
            {p.nationalite && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Nationalité</Text>
                <Text style={styles.detailValue}>{p.nationalite}</Text>
              </View>
            )}
            {p.cni_numero && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>N° CNI</Text>
                <Text style={styles.detailValue}>{p.cni_numero}</Text>
              </View>
            )}
            {p.date_creation && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date de création</Text>
                <Text style={styles.detailValue}>{formatDate(p.date_creation)}</Text>
              </View>
            )}
          </View>

          {/* Coordonnées */}
          <Text style={styles.sectionTitle}>Coordonnées</Text>
          <View style={styles.detailGrid}>
            {p.telephone && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Téléphone</Text>
                <Text style={styles.detailValue}>{p.telephone}</Text>
              </View>
            )}
            {p.telephone_2 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Téléphone 2</Text>
                <Text style={styles.detailValue}>{p.telephone_2}</Text>
              </View>
            )}
            {p.email && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{p.email}</Text>
              </View>
            )}
            {p.site_web && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Site web</Text>
                <Text style={styles.detailValue}>{p.site_web}</Text>
              </View>
            )}
          </View>

          {/* Adresse */}
          <Text style={styles.sectionTitle}>Localisation</Text>
          <View style={styles.detailGrid}>
            {p.adresse && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Adresse</Text>
                <Text style={styles.detailValue}>{p.adresse}</Text>
              </View>
            )}
            {p.quartier && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Quartier</Text>
                <Text style={styles.detailValue}>{p.quartier}</Text>
              </View>
            )}
            {p.commune && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Commune</Text>
                <Text style={styles.detailValue}>{p.commune}</Text>
              </View>
            )}
            {p.ville && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Ville</Text>
                <Text style={styles.detailValue}>{p.ville}</Text>
              </View>
            )}
            {p.province && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Province</Text>
                <Text style={styles.detailValue}>{p.province}</Text>
              </View>
            )}
          </View>

          {/* Statut */}
          <Text style={styles.sectionTitle}>Statut</Text>
          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Statut</Text>
              <Text style={styles.detailValue}>{p.est_actif ? 'Actif' : 'Inactif'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Formalisé</Text>
              <Text style={styles.detailValue}>{p.est_formalise ? 'Oui' : 'Non'}</Text>
            </View>
            {p.date_formalisation && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Date de formalisation</Text>
                <Text style={styles.detailValue}>{formatDate(p.date_formalisation)}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Date d'enregistrement</Text>
              <Text style={styles.detailValue}>{formatDate(p.created_at)}</Text>
            </View>
          </View>

          {/* QR Code */}
          <View style={styles.qrSection}>
            <Image src={qrDataUrl} style={{ width: 100, height: 100 }} />
            <Text style={styles.qrLabel}>Scannez pour vérifier l'identité</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>I-KIPUSHI — Fiche d'identification — {now}</Text>
          <Text style={styles.footerText}>N° {p.id}</Text>
        </View>
      </Page>
    </Document>
  );
}
