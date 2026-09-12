import 'package:flutter/services.dart';
import '../models/declaration.dart';
import '../models/recu_perception.dart';
import '../utils/formatters.dart';

class PrinterService {
  static const _channel = MethodChannel('com.example.gs_operateur/printer');

  static Future<List<String>> scanPrinter() async {
    try {
      final result = await _channel.invokeMethod('scanPrinter');
      return List<String>.from(result);
    } catch (e) {
      return ['Error: $e'];
    }
  }

  static String _center(String text, int width) {
    if (text.length >= width) return text;
    final pad = (width - text.length) ~/ 2;
    return ' ' * pad + text;
  }

  static Future<void> printDeclaration(DeclarationPaiement declaration) async {
    final num = 'FAC-${declaration.id.toString().padLeft(5, '0')}';
    final date = formatDateTime(declaration.datePaiement ?? declaration.dateDeclaration);
    final operateur = declaration.personne?.displayName ?? 'N/A';
    final taxe = declaration.taxe?.nom ?? '-';
    final url = 'https://totalconceptrdc.org/id_operateur/verifier-recu/$num';

    final sb = StringBuffer();
    sb.writeln(_center('REPUBLIQUE DEMOCRATIQUE DU CONGO', 32));
    sb.writeln(_center('PROVINCE DU HAUT-KATANGA', 32));
    sb.writeln(_center('COMMUNE DE KIPUSHI', 32));
    sb.writeln('================================');
    sb.writeln(_center('RECU DE PAIEMENT', 32));
    sb.writeln('--------------------------------');
    sb.writeln('N Recu     : $num');
    sb.writeln('Date       : $date');
    sb.writeln();
    sb.writeln('Contribuable: $operateur');
    sb.writeln('Taxe       : $taxe');
    if (declaration.exercice != null) {
      sb.writeln('Exercice   : ${declaration.exercice!}');
    }
    if (declaration.referencePaiement != null) {
      sb.writeln('Reference  : ${declaration.referencePaiement!}');
    }
    sb.writeln();
    sb.writeln('--------------------------------');
    sb.writeln('Montant base: ${formatMontant(declaration.montantBase)}');
    if (declaration.montantTaxe > 0) {
      sb.writeln('Taxe       : ${formatMontant(declaration.montantTaxe)}');
    }
    if (declaration.penalites > 0) {
      sb.writeln('Penalites  : ${formatMontant(declaration.penalites)}');
    }
    sb.writeln();
    sb.writeln('--------------------------------');
    sb.writeln(_center('TOTAL PAYE : ${formatMontant(declaration.montantTotal)}', 32));
    sb.writeln(_center('PAIEMENT CONFIRME', 32));
    sb.writeln();
    sb.writeln('Verifier: $url');
    sb.writeln();
    sb.writeln();

    final text = sb.toString();

    try {
      await _channel.invokeMethod('printText', {'text': text, 'qrUrl': url});
      return;
    } catch (e) {}

    try {
      final escPos = _toEscPos(text);
      await _channel.invokeMethod('printRaw', {'text': escPos});
      return;
    } catch (_) {}

    throw Exception('Aucune imprimante accessible');
  }

  static Future<void> printRecuPerception(RecuPerception recu) async {
    final url = 'https://totalconceptrdc.org/id_operateur/verifier-recu/${recu.numero}';

    final sb = StringBuffer();
    sb.writeln(_center('REPUBLIQUE DEMOCRATIQUE DU CONGO', 32));
    sb.writeln(_center('PROVINCE DU HAUT-KATANGA', 32));
    sb.writeln(_center('COMMUNE DE KIPUSHI', 32));
    sb.writeln('================================');
    sb.writeln(_center('RECU DE PERCEPTION', 32));
    sb.writeln(_center(recu.typeLabel, 32));
    sb.writeln('--------------------------------');
    sb.writeln('N Recu    : ${recu.numero}');
    sb.writeln('Type      : ${recu.typeLabel}');
    sb.writeln('Date      : ${recu.dateEmission}');
    if (recu.heureEmission != null) {
      sb.writeln('Heure     : ${recu.heureEmission}');
    }
    if (recu.taxe != null) {
      sb.writeln('Taxe      : ${recu.taxe!.nom}');
    }
    sb.writeln();
    if (recu.isVehicle) {
      if (recu.categorieVehicule != null) sb.writeln('Categorie : ${recu.categorieVehicule}');
      if (recu.plaqueImmatriculation != null) sb.writeln('Plaque    : ${recu.plaqueImmatriculation}');
      if (recu.trajet != null) sb.writeln('Trajet    : ${recu.trajet!.toUpperCase()}');
      if (recu.chauffeurNom != null) sb.writeln('Chauffeur : ${recu.chauffeurNom}');
    }
    if (recu.isMarchandise) {
      if (recu.designation != null) sb.writeln('Designat. : ${recu.designation}');
      if (recu.poids != null) sb.writeln('Poids     : ${recu.poids} kg');
      if (recu.numeroPiece != null) sb.writeln('N Piece   : ${recu.numeroPiece}');
      if (recu.conducteurNom != null) sb.writeln('Conducteur: ${recu.conducteurNom}');
    }
    if (recu.personne != null) sb.writeln('Personne  : ${recu.personne!.displayName}');
    sb.writeln();
    sb.writeln('--------------------------------');
    sb.writeln(_center('MONTANT   : ${formatMontant(recu.montant)}', 32));
    sb.writeln(_center('PAIEMENT CONFIRME', 32));
    sb.writeln();
    if (recu.observations != null && recu.observations!.isNotEmpty) {
      sb.writeln('Observat.: ${recu.observations}');
    }
    sb.writeln();
    sb.writeln('Verifier: $url');
    sb.writeln();
    sb.writeln();

    final text = sb.toString();

    try {
      await _channel.invokeMethod('printText', {'text': text, 'qrUrl': url});
      return;
    } catch (e) {}

    try {
      final escPos = _toEscPos(text);
      await _channel.invokeMethod('printRaw', {'text': escPos});
      return;
    } catch (_) {}

    throw Exception('Aucune imprimante accessible');
  }

  static String _toEscPos(String text) {
    final sb = StringBuffer();
    sb.write('\u001B\u0040'); // Init printer
    sb.write('\u001B\u0021\u0030'); // Bold + double height
    sb.write(text);
    sb.write('\u001B\u0021\u0000'); // Reset style
    sb.write('\n\n\n');
    sb.write('\u001B\u0069'); // Cut
    return sb.toString();
  }
}
