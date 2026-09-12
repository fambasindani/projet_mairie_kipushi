import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../config/theme.dart';
import '../models/declaration.dart';
import '../services/printer_service.dart';
import '../utils/formatters.dart';

class FacturePdfPage extends StatefulWidget {
  final DeclarationPaiement declaration;
  const FacturePdfPage({super.key, required this.declaration});

  @override
  State<FacturePdfPage> createState() => _FacturePdfPageState();
}

class _FacturePdfPageState extends State<FacturePdfPage> {
  bool _printing = false;

  @override
  Widget build(BuildContext context) {
    final declaration = widget.declaration;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Reçu de paiement'),
        actions: [
          IconButton(
            onPressed: _scanPrinter,
            icon: const Icon(Icons.search),
            tooltip: 'Scanner imprimante',
          ),
          IconButton(
            onPressed: _printing ? null : _printThermal,
            icon: _printing
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.print),
            tooltip: 'Imprimer',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildReceipt(declaration),
          ],
        ),
      ),
    );
  }

  Widget _buildReceipt(DeclarationPaiement declaration) {
    final num = 'FAC-${declaration.id.toString().padLeft(5, '0')}';
    final qrData = 'https://totalconceptrdc.org/id_operateur/verifier-recu/$num';

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
          Image.asset(
            'assets/images/logo.png',
            width: 56,
            height: 56,
            fit: BoxFit.contain,
          ),
          const SizedBox(height: 8),
          const Text('I-KIPUSHI', style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
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
          const SizedBox(height: 16),
          Center(
            child: QrImageView(
              data: qrData,
              version: QrVersions.auto,
              size: 120,
              backgroundColor: Colors.white,
              eyeStyle: const QrEyeStyle(color: AppColors.textPrimary),
              dataModuleStyle: const QrDataModuleStyle(color: AppColors.textPrimary),
            ),
          ),
          const SizedBox(height: 8),
          Text('Scanner pour vérifier', style: TextStyle(color: AppColors.textMuted, fontSize: 10)),
          const SizedBox(height: 16),
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

  Future<void> _scanPrinter() async {
    final info = await PrinterService.scanPrinter();
    if (mounted) {
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Text('Scanner Imprimante'),
          content: SizedBox(
            width: double.maxFinite,
            height: 400,
            child: ListView.builder(
              itemCount: info.length,
              itemBuilder: (ctx, i) => Text(info[i], style: TextStyle(
                fontSize: 11,
                color: info[i].contains('FOUND') ? Colors.green.shade700 : Colors.grey.shade700,
              )),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Fermer')),
          ],
        ),
      );
    }
  }

  Future<void> _printThermal() async {
    setState(() => _printing = true);
    try {
      await PrinterService.printDeclaration(widget.declaration);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impression envoyee'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error, duration: const Duration(seconds: 5)),
        );
      }
    } finally {
      if (mounted) setState(() => _printing = false);
    }
  }
}
