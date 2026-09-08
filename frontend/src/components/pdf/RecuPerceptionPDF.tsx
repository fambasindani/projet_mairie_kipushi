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
    marginBottom: 10,
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
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#000000',
    marginRight: 4,
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
  qrSection: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#CCCCCC',
  },
  qrText: {
    fontSize: 6,
    color: '#666666',
    marginTop: 3,
    textAlign: 'center',
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

const typePerceptionTitre: Record<string, string> = {
  peage_urbain: 'TAXE SUR LE PEAGE',
  pont_bascule: 'TAXE PONT BASCULE',
  etalage: "TAXE D'ETALAGE",
  chargement: 'TAXE DE CHARGEMENT',
  dechargement: 'TAXE DE DECHARGEMENT',
  autre: 'TAXE DE PERCEPTION',
};

interface RecuPDFData {
  numero: string;
  date_emission: string;
  heure_emission?: string | null;
  type_perception: string;
  taxe_nom?: string;
  categorie_vehicule?: string | null;
  plaque_immatriculation?: string | null;
  montant: number;
  trajet?: string | null;
  chauffeur_nom?: string | null;
  conducteur_nom?: string | null;
  designation?: string | null;
  poids?: number | null;
  Numero_Piece?: string | null;
  percepteur_nom?: string;
  observations?: string | null;
  qrcode?: string | null;
}

export const RecuPerceptionPDF = ({ data }: { data: RecuPDFData }) => {
  const titre = typePerceptionTitre[data.type_perception] || 'TAXE DE PERCEPTION';
  const conducteur = data.chauffeur_nom || data.conducteur_nom || '';
  const isVehicule = data.type_perception === 'peage_urbain' || data.type_perception === 'pont_bascule';
  const isMarchandise = data.type_perception === 'chargement' || data.type_perception === 'dechargement';

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
          <Text style={styles.titleText}>{titre}</Text>
          {data.taxe_nom && <Text style={{ fontSize: 8, marginTop: 2 }}>{data.taxe_nom}</Text>}
        </View>

        {/* Tableau principal */}
        <View style={styles.table}>

          {/* Ligne 1 : Date & Heure / Type */}
          <View style={styles.tableRow}>
            <View style={styles.tableColLeft}>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>DATE :</Text>
                <Text style={styles.cellValue}>
                  {data.date_emission ? new Date(data.date_emission).toLocaleDateString('fr-FR') : ''}
                </Text>
              </View>
              <View style={styles.cellContainer}>
                <Text style={styles.cellLabel}>HEURE :</Text>
                <Text style={styles.cellValue}>{data.heure_emission || ''}</Text>
              </View>
            </View>
            <View style={styles.tableColRight}>
              {isVehicule ? (
                <>
                  <View style={styles.cellContainer}>
                    <Text style={[styles.cellLabel, { width: 50 }]}>Catégorie:</Text>
                    <Text style={styles.cellValue}>{data.categorie_vehicule || ''}</Text>
                  </View>
                  <View style={styles.cellContainer}>
                    <Text style={[styles.cellLabel, { width: 50 }]}>Montant:</Text>
                    <Text style={styles.cellValue}>{data.montant?.toLocaleString('fr-FR')} FC</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.cellContainer}>
                    <Text style={[styles.cellLabel, { width: 50 }]}>Type:</Text>
                    <Text style={styles.cellValue}>{data.taxe_nom || ''}</Text>
                  </View>
                  <View style={styles.cellContainer}>
                    <Text style={[styles.cellLabel, { width: 50 }]}>Montant:</Text>
                    <Text style={styles.cellValue}>{data.montant?.toLocaleString('fr-FR')} FC</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Ligne 2 : Plaque / Désignation */}
          <View style={styles.tableRow}>
            <View style={styles.tableColLeft}>
              {isVehicule ? (
                <View style={styles.cellContainer}>
                  <Text style={styles.cellLabel}>N° PLAQUE :</Text>
                  <Text style={styles.cellValue}>{data.plaque_immatriculation || ''}</Text>
                </View>
              ) : isMarchandise ? (
                <View style={styles.cellContainer}>
                  <Text style={styles.cellLabel}>DESIGNATION :</Text>
                  <Text style={styles.cellValue}>
                    {data.designation || ''}{data.poids ? ` — ${data.poids} T` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.cellContainer}>
                  <Text style={styles.cellLabel}>N° PIECE :</Text>
                  <Text style={styles.cellValue}>{data.Numero_Piece || ''}</Text>
                </View>
              )}
            </View>
            <View style={styles.tableColRight}>
              {isMarchandise && (
                <View style={styles.cellContainer}>
                  <Text style={[styles.cellLabel, { width: 50 }]}>N° Pièce:</Text>
                  <Text style={styles.cellValue}>{data.Numero_Piece || ''}</Text>
                </View>
              )}
              {isVehicule && (
                <View style={styles.checkboxContainer}>
                  <View style={styles.checkboxItem}>
                    <View style={[styles.checkboxBox, data.trajet === 'aller' ? { backgroundColor: '#000' } : {}]} />
                    <Text style={{ fontSize: 8 }}>ALLER</Text>
                  </View>
                  <View style={styles.checkboxItem}>
                    <View style={[styles.checkboxBox, data.trajet === 'retour' ? { backgroundColor: '#000' } : {}]} />
                    <Text style={{ fontSize: 8 }}>RETOUR</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Ligne 3 : Conducteur & Signature */}
          <View style={styles.tableRow}>
            <View style={[styles.tableColLeft, { width: '60%' }]}>
              <View style={[styles.cellContainer, { height: 35 }]}>
                <Text style={styles.cellLabel}>{isVehicule ? 'CHAUFFEUR :' : 'CONDUCTEUR :'}</Text>
                <Text style={styles.cellValue}>{conducteur}</Text>
              </View>
            </View>
            <View style={[styles.tableColRight, { width: '40%' }]}>
              <View style={styles.signatureSection}>
                <Text style={styles.signatureLabel}>Nom et Signature du percepteur</Text>
                <Text style={styles.signatureLine}>{data.percepteur_nom || ''}</Text>
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

export default RecuPerceptionPDF;
