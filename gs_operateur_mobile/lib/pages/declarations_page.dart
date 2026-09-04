import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../services/paiement_service.dart';
import '../models/declaration.dart';
import '../providers/auth_provider.dart';
import '../widgets/widgets.dart';
import '../utils/helpers.dart';
import '../utils/formatters.dart';

class DeclarationsPage extends StatefulWidget {
  const DeclarationsPage({super.key});

  @override
  State<DeclarationsPage> createState() => _DeclarationsPageState();
}

class _DeclarationsPageState extends State<DeclarationsPage> {
  bool _loading = true;
  List<DeclarationPaiement> _declarations = [];
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() async {
    setState(() => _loading = true);
    try {
      final data = await PaiementService().list(search: _searchController.text);
      if (mounted) setState(() { _declarations = data; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showAppSnackBar(context, 'Erreur: $e', isError: true);
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showDetails(DeclarationPaiement d) {
    final statut = d.statut;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.9,
        builder: (ctx, scrollCtrl) => Container(
          decoration: const BoxDecoration(color: AppColors.bgSurface, borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
          child: ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(20),
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Row(
                children: [
                  Icon(_statusIcon(statut), color: _statusColor(statut), size: 28),
                  const SizedBox(width: 12),
                  Expanded(child: Text(d.taxe?.nom ?? 'Déclaration', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18))),
                  _StatusBadge(statut: statut),
                ],
              ),
              const SizedBox(height: 20),
              _buildDetail('Exercice', d.exercice ?? '-'),
              _buildDetail('Période', '${d.periodeDebut ?? '-'} au ${d.periodeFin ?? '-'}'),
              _buildDetail('Montant de base', formatMontant(d.montantBase)),
              _buildDetail('Montant taxe', formatMontant(d.montantTaxe)),
              _buildDetail('Pénalités', formatMontant(d.penalites)),
              _buildDetail('Montant total', formatMontant(d.montantTotal)),
              _buildDetail('Date limite', d.dateLimitePaiement != null ? formatDate(d.dateLimitePaiement) : '-'),
              if (d.datePaiement != null) _buildDetail('Payé le', formatDate(d.datePaiement)),
              if (d.referencePaiement != null) _buildDetail('Réf. paiement', d.referencePaiement!),
              const SizedBox(height: 20),
              if (statut == 'en_attente' || statut == 'en_retard')
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.push('/scan');
                  },
                  icon: const Icon(Icons.payment, size: 18),
                  label: const Text('Payer maintenant'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: statut == 'en_retard' ? AppColors.error : AppColors.success,
                    minimumSize: const Size(double.infinity, 48),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          Flexible(child: Text(value, style: const TextStyle(color: AppColors.textPrimary), textAlign: TextAlign.end)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isOperateur = context.watch<AuthProvider>().isOperateur;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Déclarations'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
      ),
      floatingActionButton: isOperateur ? null : FloatingActionButton.extended(
        onPressed: () => context.push('/declarations/ajouter'),
        icon: const Icon(Icons.add),
        label: const Text('Déclarer'),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Rechercher une déclaration...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                filled: true,
                fillColor: AppColors.bgInput,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 20),
                        onPressed: () { _searchController.clear(); _load(); },
                      )
                    : null,
              ),
              onChanged: (_) => _load(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _declarations.isEmpty
                    ? const EmptyState(icon: Icons.receipt_long, title: 'Aucune déclaration', subtitle: 'Créez votre première déclaration de taxe')
                    : RefreshIndicator(
                        onRefresh: () async => _load(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _declarations.length,
                          itemBuilder: (_, index) {
                            final d = _declarations[index];
                            final statut = d.statut;
                            return AppCard(
                              onTap: () => _showDetails(d),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(
                                      color: _statusColor(statut).withValues(alpha: 0.15),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Icon(_statusIcon(statut), color: _statusColor(statut)),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(d.taxe?.nom ?? 'Déclaration', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                                        Text('${d.exercice ?? '-'} • ${d.periodeDebut ?? '-'}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                                      ],
                                    ),
                                  ),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: [
                                      Text(formatMontant(d.montantTotal), style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16)),
                                      _StatusBadge(statut: statut),
                                    ],
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String statut) {
    switch (statut) {
      case 'paye': return AppColors.success;
      case 'en_attente': return AppColors.warning;
      case 'en_retard': return AppColors.error;
      case 'conteste': return AppColors.info;
      default: return AppColors.textMuted;
    }
  }

  IconData _statusIcon(String statut) {
    switch (statut) {
      case 'paye': return Icons.check_circle;
      case 'en_attente': return Icons.schedule;
      case 'en_retard': return Icons.warning;
      default: return Icons.receipt;
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final String statut;
  const _StatusBadge({required this.statut});

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (statut) {
      'paye' => ('Payée', AppColors.success),
      'en_attente' => ('En attente', AppColors.warning),
      'en_retard' => ('En retard', AppColors.error),
      'conteste' => ('Contestée', AppColors.info),
      'annule' => ('Annulée', AppColors.textMuted),
      'exonere' => ('Exonérée', AppColors.primary),
      _ => (statut, AppColors.textMuted),
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600)),
    );
  }
}
