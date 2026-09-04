import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/paiement_provider.dart';
import '../models/declaration.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import 'facture_pdf.dart';

class FacturesPage extends StatefulWidget {
  const FacturesPage({super.key});

  @override
  State<FacturesPage> createState() => _FacturesPageState();
}

class _FacturesPageState extends State<FacturesPage> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaiementProvider>().load(refresh: true);
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Factures'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Rechercher une facture...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                filled: true,
                fillColor: AppColors.bgInput,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 20),
                        onPressed: () { setState(() => _searchController.clear()); },
                      )
                    : null,
              ),
              onChanged: (_) => setState(() {}),
            ),
          ),
          Expanded(
            child: Consumer<PaiementProvider>(
              builder: (_, provider, __) {
                if (provider.loading && provider.declarations.isEmpty) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primary));
                }
                final query = _searchController.text.toLowerCase();
                final payees = provider.declarations.where((d) {
                  if (!d.isPaye) return false;
                  if (query.isEmpty) return true;
                  return (d.taxe?.nom ?? '').toLowerCase().contains(query) ||
                      (d.personne?.displayName ?? '').toLowerCase().contains(query) ||
                      'FAC-${d.id.toString().padLeft(5, '0')}'.toLowerCase().contains(query);
                }).toList();
                if (payees.isEmpty) {
                  return const EmptyState(icon: Icons.receipt_long, title: 'Aucune facture', subtitle: 'Les factures sont générées après paiement');
                }
                return RefreshIndicator(
                  onRefresh: () => provider.load(refresh: true),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: payees.length,
                    itemBuilder: (_, index) => _FactureTile(declaration: payees[index]),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _FactureTile extends StatelessWidget {
  final DeclarationPaiement declaration;
  const _FactureTile({required this.declaration});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt, color: AppColors.success, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text('FAC-${declaration.id.toString().padLeft(5, '0')}', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
              ),
              StatusBadge(statut: declaration.statut),
            ],
          ),
          const SizedBox(height: 8),
          Text(declaration.personne?.displayName ?? 'N/A', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(height: 4),
          Text(declaration.taxe?.nom ?? '-', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 12, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text(formatDate(declaration.datePaiement ?? declaration.dateDeclaration), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              const Spacer(),
              Text(formatMontant(declaration.montantTotal), style: const TextStyle(color: AppColors.success, fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Voir reçu',
                  icon: Icons.picture_as_pdf,
                  isExpanded: true,
                  isOutlined: true,
                  onPressed: () => _openPdf(context),
                ),
              ),
              const SizedBox(width: 8),
              IconButton(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: 'FAC-${declaration.id.toString().padLeft(5, '0')}'));
                  showAppSnackBar(context, 'Numéro copié');
                },
                icon: const Icon(Icons.copy, size: 18, color: AppColors.primary),
                tooltip: 'Copier le numéro',
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _openPdf(BuildContext context) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => FacturePdfPage(declaration: declaration),
    ));
  }
}
