import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/paiement_provider.dart';
import '../models/declaration.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';

class PaiementsPage extends StatefulWidget {
  const PaiementsPage({super.key});

  @override
  State<PaiementsPage> createState() => _PaiementsPageState();
}

class _PaiementsPageState extends State<PaiementsPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      String? statut;
      switch (_tabController.index) {
        case 1: statut = 'en_attente'; break;
        case 2: statut = 'paye'; break;
      }
      context.read<PaiementProvider>().load(statut: statut, refresh: true);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaiementProvider>().load(refresh: true);
      context.read<PaiementProvider>().loadStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paiements'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          tabs: const [Tab(text: 'Tous'), Tab(text: 'En attente'), Tab(text: 'Payés')],
        ),
      ),
      body: Consumer<PaiementProvider>(
        builder: (_, provider, __) {
          if (provider.loading && provider.declarations.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (provider.declarations.isEmpty) {
            return const EmptyState(icon: Icons.receipt_long, title: 'Aucun paiement');
          }
          return RefreshIndicator(
            onRefresh: () => provider.load(refresh: true),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: provider.declarations.length,
              itemBuilder: (_, index) => _PaiementTile(declaration: provider.declarations[index]),
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() { _tabController.dispose(); super.dispose(); }
}

class _PaiementTile extends StatelessWidget {
  final DeclarationPaiement declaration;
  const _PaiementTile({required this.declaration});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: (declaration.isPaye ? AppColors.success : AppColors.warning).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(declaration.isPaye ? Icons.check_circle : Icons.pending, color: declaration.isPaye ? AppColors.success : AppColors.warning, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(declaration.personne?.displayName ?? 'N/A', style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(declaration.taxe?.nom ?? '-', style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatMontant(declaration.montantTotal), style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              StatusBadge(statut: declaration.statut, small: true),
            ],
          ),
        ],
      ),
    );
  }
}
