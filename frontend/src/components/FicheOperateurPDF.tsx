import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logoBase64Raw from '../assets/logo_base64.txt?raw';
import type { Personne } from '../types';

const LOGO_SRC = `data:image/png;base64,${logoBase64Raw.replace(/\s/g, '')}`;

const styles = StyleSheet.create({
  page: { padding: 18, fontFamily: 'Helvetica', backgroundColor: '#f8fafc' },
  card: { backgroundColor: '#ffffff', borderRadius: 10, padding: 16, border: '1 solid #e2e8f0' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#000000', paddingBottom: 8 },
  logoImg: { width: 44, height: 44, objectFit: 'contain' },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 6 },
  headerSpacer: { width: 44 },
  republicText: { fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  subRepublicText: { fontSize: 8, textAlign: 'center' },
  cityText: { fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginTop: 1 },
  bureauText: { fontSize: 7, textAlign: 'center', fontStyle: 'italic' },
  titleContainer: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#c7d2fe', borderRadius: 6, padding: 6, marginBottom: 10 },
  titleText: { fontSize: 11, fontWeight: 'bold', textAlign: 'center', color: '#1e293b' },
  titleSub: { fontSize: 7, textAlign: 'center', color: '#64748b', marginTop: 1 },
  photoSection: { flexDirection: 'row', marginBottom: 12, gap: 14 },
  photoBox: { width: 90, height: 105, borderWidth: 2, borderColor: '#e2e8f0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  photoImage: { width: 90, height: 105 },
  photoPlaceholder: { fontSize: 26, fontWeight: 'bold', color: '#4f46e5' },
  infoSection: { flex: 1 },
  nameLabel: { fontSize: 14, fontWeight: 'bold', color: '#1e293b' },
  roleLabel: { fontSize: 9, color: '#4f46e5', marginTop: 1, textTransform: 'uppercase', letterSpacing: 1 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  detailItem: { width: '48%', marginBottom: 5 },
  detailLabel: { fontSize: 7, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { fontSize: 9, color: '#1e293b', fontWeight: 'bold', marginTop: 1 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', color: '#4f46e5', marginTop: 9, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 2 },
  qrSection: { alignItems: 'center', marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  qrLabel: { fontSize: 7, color: '#64748b', marginTop: 4 },
  footer: { position: 'absolute', bottom: 12, left: 18, right: 18, borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingTop: 5 },
  footerAddress: { fontSize: 6, color: '#64748b', textAlign: 'center', marginBottom: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: '#94a3b8' },
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
            <Image src={LOGO_SRC} style={styles.logoImg} />
            <View style={styles.headerCenter}>
              <Text style={styles.republicText}>REPUBLIQUE DEMOCRATIQUE DU CONGO</Text>
              <Text style={styles.subRepublicText}>PROVINCE DU HAUT-KATANGA</Text>
              <Text style={styles.cityText}>VILLE DE KIPUSHI</Text>
              <Text style={styles.bureauText}>BUREAU DU MAIRE</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>FICHE D'IDENTIFICATION OPÉRATEUR / GESTIONNAIRE</Text>
            <Text style={styles.titleSub}>Système de Gestion I-KIPUSHI</Text>
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
            <Image src={qrDataUrl} style={{ width: 80, height: 80 }} />
            <Text style={styles.qrLabel}>Scannez pour vérifier l'identité</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerAddress}>
            Avenue Pajero, Quartier Kasengaise, Ville de Kipushi, Haut-Katanga, RDC — Tél : +243820747471 / +2438870563 — Email : contact@kipushi.cd
          </Text>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>I-KIPUSHI — Fiche d'identification — {now}</Text>
            <Text style={styles.footerText}>N° {p.id}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
