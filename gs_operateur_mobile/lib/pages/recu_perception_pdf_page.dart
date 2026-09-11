import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../models/recu_perception.dart';
import '../services/printer_service.dart';
import '../utils/formatters.dart';

class RecuPerceptionPdfPage extends StatefulWidget {
  final RecuPerception recu;
  const RecuPerceptionPdfPage({super.key, required this.recu});

  @override
  State<RecuPerceptionPdfPage> createState() => _RecuPerceptionPdfPageState();
}

class _RecuPerceptionPdfPageState extends State<RecuPerceptionPdfPage> {
  bool _printing = false;

  @override
  Widget build(BuildContext context) {
    final recu = widget.recu;
    return Scaffold(
      appBar: AppBar(
        title: Text('Reçu ${recu.numero}'),
        actions: [
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
        child: _buildReceipt(recu),
      ),
    );
  }

  Widget _buildReceipt(RecuPerception recu) {
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
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Text('RÉPUBLIQUE DÉMOCRATIQUE DU CONGO', style: TextStyle(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
                const Text('PROVINCE DU HAUT-KATANGA', style: TextStyle(color: AppColors.textSecondary, fontSize: 10)),
                const Text('COMMUNE DE KIPUSHI', style: TextStyle(color: AppColors.textSecondary, fontSize: 10)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text('REÇU DE PERCEPTION', style: TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.bold)),
          Text(recu.typeLabel, style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
          const SizedBox(height: 16),
          const Divider(color: AppColors.border),
          _row('N° Reçu', recu.numero),
          _row('Type', recu.typeLabel),
          _row('Date', recu.dateEmission),
          if (recu.heureEmission != null) _row('Heure', recu.heureEmission!),
          if (recu.taxe != null) _row('Taxe', recu.taxe!.nom),
          const Divider(color: AppColors.border),
          if (recu.isVehicle) ...[
            if (recu.categorieVehicule != null) _row('Catégorie', recu.categorieVehicule!),
            if (recu.plaqueImmatriculation != null) _row('Plaque', recu.plaqueImmatriculation!),
            if (recu.trajet != null) _row('Trajet', recu.trajet!.toUpperCase()),
            if (recu.chauffeurNom != null) _row('Chauffeur', recu.chauffeurNom!),
          ],
          if (recu.isMarchandise) ...[
            if (recu.designation != null) _row('Désignation', recu.designation!),
            if (recu.poids != null) _row('Poids', '${recu.poids} kg'),
            if (recu.numeroPiece != null) _row('N° Pièce', recu.numeroPiece!),
            if (recu.conducteurNom != null) _row('Conducteur', recu.conducteurNom!),
          ],
          if (recu.personne != null) _row('Personne', recu.personne!.displayName),
          const Divider(color: AppColors.border),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('MONTANT', style: TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.bold)),
              Text(formatMontant(recu.montant), style: TextStyle(color: AppColors.success, fontSize: 20, fontWeight: FontWeight.bold)),
            ],
          ),
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
          if (recu.observations != null && recu.observations!.isNotEmpty) ...[
            const SizedBox(height: 12),
            _row('Observations', recu.observations!),
          ],
          const SizedBox(height: 16),
          Text('Kipushi, le ${recu.dateEmission}', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
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
          Flexible(child: Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500), textAlign: TextAlign.end)),
        ],
      ),
    );
  }

  Future<void> _printThermal() async {
    setState(() => _printing = true);
    try {
      await PrinterService.printRecuPerception(widget.recu);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Impression envoyée'), backgroundColor: AppColors.success),
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
