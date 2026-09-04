import 'package:flutter/material.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../config/theme.dart';
import '../models/declaration.dart';
import '../utils/formatters.dart';

class FacturePdfPage extends StatelessWidget {
  final DeclarationPaiement declaration;
  const FacturePdfPage({super.key, required this.declaration});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reçu de paiement'),
        actions: [
          IconButton(
            onPressed: () => _printPdf(context),
            icon: const Icon(Icons.print),
            tooltip: 'Imprimer',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildReceipt(context),
          ],
        ),
      ),
    );
  }

  Widget _buildReceipt(BuildContext context) {
    final num = 'FAC-${declaration.id.toString().padLeft(5, '0')}';

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Icon(Icons.location_on, size: 40, color: AppColors.primary),
          const SizedBox(height: 8),
          const Text('GS OPÉRATEUR', style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
          const Text('Reçu de Paiement', style: TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const Divider(color: AppColors.border, height: 30),
          _row('N° Reçu', num),
          _row('Date', formatDateTime(declaration.datePaiement ?? declaration.dateDeclaration)),
          const Divider(color: AppColors.border, height: 20),
          _row('Contribuable', declaration.personne?.displayName ?? 'N/A'),
          _row('Taxe', declaration.taxe?.nom ?? '-'),
          if (declaration.exercice != null) _row('Exercice', declaration.exercice!),
          if (declaration.referencePaiement != null) _row('Référence', declaration.referencePaiement!),
          const Divider(color: AppColors.border, height: 20),
          _row('Montant base', formatMontant(declaration.montantBase)),
          if (declaration.montantTaxe > 0) _row('Taxe', formatMontant(declaration.montantTaxe)),
          if (declaration.penalites > 0) _row('Pénalités', formatMontant(declaration.penalites)),
          const Divider(color: AppColors.border, height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('TOTAL PAYÉ', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              Text(formatMontant(declaration.montantTotal), style: const TextStyle(color: AppColors.success, fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 20),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle, color: AppColors.success, size: 20),
                SizedBox(width: 8),
                Text('PAIEMENT CONFIRMÉ', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Future<void> _printPdf(BuildContext context) async {
    final pdf = pw.Document();
    final num = 'FAC-${declaration.id.toString().padLeft(5, '0')}';

    pdf.addPage(pw.MultiPage(
      build: (context) => [
        pw.Center(child: pw.Text('GS OPÉRATEUR', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold))),
        pw.Center(child: pw.Text('Reçu de Paiement')),
        pw.SizedBox(height: 20),
        pw.Divider(),
        _pdfRow('N° Reçu', num),
        _pdfRow('Date', formatDateTime(declaration.datePaiement ?? declaration.dateDeclaration)),
        pw.Divider(),
        _pdfRow('Contribuable', declaration.personne?.displayName ?? 'N/A'),
        _pdfRow('Taxe', declaration.taxe?.nom ?? '-'),
        if (declaration.referencePaiement != null) _pdfRow('Référence', declaration.referencePaiement!),
        pw.Divider(),
        _pdfRow('Montant base', formatMontant(declaration.montantBase)),
        _pdfRow('TOTAL PAYÉ', formatMontant(declaration.montantTotal)),
        pw.SizedBox(height: 20),
        pw.Center(child: pw.Text('PAIEMENT CONFIRMÉ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold))),
      ],
    ));

    await Printing.layoutPdf(onLayout: (format) => pdf.save());
  }

  pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 4),
      child: pw.Row(
        mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
        children: [
          pw.Text(label, style: const pw.TextStyle(fontSize: 12)),
          pw.Text(value, style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
        ],
      ),
    );
  }
}
