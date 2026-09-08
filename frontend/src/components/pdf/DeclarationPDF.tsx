import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 15,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  republicText: {
    fontSize: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subRepublicText: {
    fontSize: 8,
    textAlign: 'center',
  },
  cityText: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bureauText: {
    fontSize: 7,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  qrCode: {
    width: 40,
    height: 40,
  },
  titleContainer: {
    backgroundColor: '#F2F2F2',
    borderWidth: 1,
    borderColor: '#000000',
    padding: 5,
    textAlign: 'center',
    marginBottom: 5,
  },
  titleText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000000',
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  tableColLeft: {
    width: '65%',
    borderRightWidth: 1,
    borderRightColor: '#000000',
  },
  tableColRight: {
    width: '35%',
  },
  cellContainer: {
    padding: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cellLabel: {
    fontSize: 8,
    width: 70,
    fontWeight: 'bold',
  },
  cellValue: {
    fontSize: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#999999',
    flex: 1,
    paddingBottom: 2,
  },
  signatureSection: {
    height: 55,
    padding: 5,
    justifyContent: 'space-between',
  },
  signatureLabel: {
    fontSize: 8,
  },
  signatureLine: {
    textAlign: 'center',
    fontSize: 8,
    marginTop: 25,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    paddingTop: 2,
    width: '70%',
    alignSelf: 'flex-end',
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 15,
    right: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#000000',
    paddingTop: 3,
    textAlign: 'center',
    fontSize: 6,
    color: '#333333',
  },
});

interface DeclarationPDFData {
  id: number;
  operateur_nom?: string;
  taxe_nom?: string;
  exercice: number;
  periode_debut: string;
  periode_fin: string;
  date_limite_paiement: string;
  montant_base: number;
  montant_taxe: number;
  penalites: number;
  montant_total: number;
  statut: string;
  date_paiement?: string | null;
  nombre_jours_retard?: number;
  reference_paiement?: string | null;
  observations?: string | null;
  qrcode?: string | null;
}

const statutLabels: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  en_retard: 'En retard',
  conteste: 'Contesté',
  annule: 'Annulé',
  exonere: 'Exonéré',
};

export const DeclarationPDF = ({ data }: { data: DeclarationPDFData }) => {
  return (
    <Document>
      <Page size="A6" orientation="landscape" style={styles.page}>

        {/* En-tête */}
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <Text style={styles.republicText}>REPUBLIQUE DEMOCRATIQUE DU CONGO</Text>
            <Text style={styles.subRepublicText}>PROVINCE DU HAUT-KATANGA</Text>
            <Text style={styles.cityText}>VILLE DE KIPUSHI</Text>
            <Text style={styles.bureauText}>BUREAU DU MAIRE</Text>
          </View>
          {data.qrcode && (
            <Image src={data.qrcode} style={styles.qrCode} />
          )}
        </View>

        {/* Titre du document */}
        <View style={styles.titleContainer}>
          <Text style={styles.titleText}>DECLARATION DE PAIEMENT</Text>
          {data.taxe_nom && <Text style={{ fontSize: 8, marginTop: 2 }}>{data.taxe_nom}</Text>}
        </View>

        {/* Tableau principal */}
        <View style={styles.table}>

          {/* Ligne 1 : Opérateur / Taxe */}
          <View style={styles.tableRow}>
            <View style={styles.tableColLeft}>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>OPERATEUR :</Text>
                <Text style={styles.cellValue}>{data.operateur_nom || ''}</Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>EXERCICE :</Text>
                <Text style={styles.cellValue}>{String(data.exercice)}</Text>
              </View>
            </View>
            <View style={styles.tableColRight}>
              <View style={styles.cellContainer}>
                <Text style={[styles.cellLabel, { width: 50 }]}>Statut:</Text>
                <Text style={styles.cellValue}>{statutLabels[data.statut] || data.statut}</Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={[styles.cellLabel, { width: 50 }]}>N° Decl:</Text>
                <Text style={styles.cellValue}>#{String(data.id).padStart(4, '0')}</Text>
              </View>
            </View>
          </View>

          {/* Ligne 2 : Période / Dates */}
          <View style={styles.tableRow}>
            <View style={styles.tableColLeft}>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>PERIODE :</Text>
                <Text style={styles.cellValue}>
                  {new Date(data.periode_debut).toLocaleDateString('fr-FR')} - {new Date(data.periode_fin).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>DATE LIMITE :</Text>
                <Text style={styles.cellValue}>{new Date(data.date_limite_paiement).toLocaleDateString('fr-FR')}</Text>
              </View>
            </View>
            <View style={styles.tableColRight}>
              <View style={styles.cellContainer}>
                <Text style={[styles.cellLabel, { width: 50 }]}>Montant:</Text>
                <Text style={styles.cellValue}>{data.montant_taxe?.toLocaleString('fr-FR')} FC</Text>
              </View>
              {data.penalites > 0 && (
                <View style={styles.cellContainer}>
                  <Text style={[styles.cellLabel, { width: 50 }]}>Penalites:</Text>
                  <Text style={styles.cellValue}>{data.penalites?.toLocaleString('fr-FR')} FC</Text>
                </View>
              )}
            </View>
          </View>

          {/* Ligne 3 : Montant total & Signature */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColLeft, { width: '60%' }]}>
              <View style={[styles.cellContainer, { height: 35 }]}>
                <Text style={styles.cellLabel}>TOTAL DU :</Text>
                <Text style={styles.cellValue}>
                  {data.montant_total?.toLocaleString('fr-FR')} FC
                  {data.nombre_jours_retard ? ` (${data.nombre_jours_retard}j retard)` : ''}
                </Text>
              </View>
            </View>
            <View style={[styles.tableColRight, { width: '40%' }]}>
              <View style={styles.signatureSection}>
                <Text style={styles.signatureLabel}>Nom et Signature du percepteur</Text>
                <Text style={styles.signatureLine}></Text>
              </View>
            </View>
          </View>

        </View>

        {/* Pied de page */}
        <Text style={styles.footer}>
          Avenue Pajero, Quartier Kasengaise, Ville de Kipushi, Haut-Katanga, RDC.{'\n'}
          Tel: +243820747471 / +2438870563, Email: contact@kipushi.cd
        </Text>

      </Page>
    </Document>
  );
};

export default DeclarationPDF;
