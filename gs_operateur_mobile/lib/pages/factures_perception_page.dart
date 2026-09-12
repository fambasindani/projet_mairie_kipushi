import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/paiement_provider.dart';
import '../models/declaration.dart';
import '../models/recu_perception.dart';
import '../services/recu_perception_service.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import 'facture_pdf.dart';
import 'recu_perception_pdf_page.dart';

class FacturesPerceptionPage extends StatefulWidget {
  const FacturesPerceptionPage({super.key});

  @override
  State<FacturesPerceptionPage> createState() => _FacturesPerceptionPageState();
}

class _FacturesPerceptionPageState extends State<FacturesPerceptionPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _searchController = TextEditingController();
  final _service = RecuPerceptionService();
  List<RecuPerception> _recus = [];
  bool _loadingRecus = true;
  String? _selectedType;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PaiementProvider>().load(refresh: true);
      _loadRecus();
    });
  }

  void _loadRecus() async {
    setState(() => _loadingRecus = true);
    try {
      final data = await _service.list(search: _searchController.text, typePerception: _selectedType);
      if (mounted) setState(() { _recus = data; _loadingRecus = false; });
    } catch (e) {
      if (mounted) setState(() => _loadingRecus = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Factures & Perception'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          if (_tabController.index == 0)
            IconButton(
              onPressed: () => context.push('/recus-perception/ajouter'),
              icon: const Icon(Icons.add),
              tooltip: 'Nouveau reçu',
            ),
        ],
        bottom: TabBar(
          controller: _tabController,
          onTap: (_) => setState(() {}),
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textMuted,
          tabs: const [
            Tab(text: 'Factures', icon: Icon(Icons.receipt_long, size: 20)),
            Tab(text: 'Perception', icon: Icon(Icons.payment, size: 20)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildFacturesTab(),
          _buildPerceptionTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          if (_tabController.index == 1) {
            context.push('/recus-perception/ajouter');
          }
        },
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildFacturesTab() {
    return Column(
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
    );
  }

  Widget _buildPerceptionTab() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Rechercher un reçu...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                    filled: true,
                    fillColor: AppColors.bgInput,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  onChanged: (_) => _loadRecus(),
                ),
              ),
              const SizedBox(width: 8),
              PopupMenuButton<String?>(
                icon: Icon(Icons.filter_list, color: _selectedType != null ? AppColors.primary : AppColors.textMuted),
                onSelected: (value) {
                  setState(() => _selectedType = value);
                  _loadRecus();
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(value: null, child: Text('Tous les types')),
                  ...RecuPerception.typeLabels.entries.map((e) =>
                    PopupMenuItem(value: e.key, child: Text(e.value)),
                  ),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: _loadingRecus
              ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
              : _recus.isEmpty
                  ? const EmptyState(icon: Icons.receipt, title: 'Aucun reçu', subtitle: 'Créez votre premier reçu de perception')
                  : RefreshIndicator(
                      onRefresh: () async { _loadRecus(); },
                      child: ListView.builder(
                        padding: const EdgeInsets.all(12),
                        itemCount: _recus.length,
                        itemBuilder: (_, index) => _RecuPerceptionTile(
                          recu: _recus[index],
                          onTap: () => _showRecuDetails(_recus[index]),
                          onValider: _recus[index].valide ? null : () => _validerRecu(_recus[index]),
                          onPrint: () => _printRecu(_recus[index]),
                          onDelete: _recus[index].valide ? null : () => _deleteRecu(_recus[index]),
                        ),
                      ),
                    ),
        ),
      ],
    );
  }

  void _printRecu(RecuPerception recu) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => RecuPerceptionPdfPage(recu: recu),
    ));
  }

  Future<void> _validerRecu(RecuPerception recu) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Valider le reçu ?',
      message: 'Confirmer la validation du reçu ${recu.numero} ? Cette action est irréversible.',
      confirmText: 'Valider',
    );
    if (!confirmed || !mounted) return;

    try {
      final recuService = RecuPerceptionService();
      await recuService.valider(recu.id);
      if (!mounted) return;
      showAppSnackBar(context, 'Reçu ${recu.numero} validé avec succès');
      _loadRecus();
    } catch (e) {
      if (!mounted) return;
      showAppSnackBar(context, 'Erreur: ${e.toString().replaceAll('Exception: ', '')}', isError: true);
    }
  }

  Future<void> _deleteRecu(RecuPerception recu) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Supprimer ?',
      message: 'Voulez-vous vraiment supprimer le reçu ${recu.numero} ?',
      confirmText: 'Supprimer',
      isDestructive: true,
    );
    if (!confirmed || !mounted) return;

    try {
      final recuService = RecuPerceptionService();
      await recuService.delete(recu.id);
      if (!mounted) return;
      showAppSnackBar(context, 'Reçu supprimé');
      _loadRecus();
    } catch (e) {
      if (!mounted) return;
      showAppSnackBar(context, 'Erreur: ${e.toString().replaceAll('Exception: ', '')}', isError: true);
    }
  }

  void _showRecuDetails(RecuPerception recu) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.4,
        maxChildSize: 0.9,
        builder: (ctx, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: AppColors.bgSurface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(20),
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Row(
                children: [
                  Icon(_typeIcon(recu.typePerception), color: AppColors.primary, size: 28),
                  const SizedBox(width: 12),
                  Expanded(child: Text(recu.numero, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18))),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: AppColors.primary.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(8)),
                    child: Text(recu.typeLabel, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              _detail('Montant', formatMontant(recu.montant)),
              _detail('Date', recu.dateEmission),
              if (recu.heureEmission != null) _detail('Heure', recu.heureEmission!),
              if (recu.taxe != null) _detail('Taxe', recu.taxe!.nom),
              if (recu.personne != null) _detail('Personne', recu.personne!.displayName),
              if (recu.isVehicle) ...[
                if (recu.categorieVehicule != null) _detail('Catégorie', recu.categorieVehicule!),
                if (recu.plaqueImmatriculation != null) _detail('Plaque', recu.plaqueImmatriculation!),
                if (recu.trajet != null) _detail('Trajet', recu.trajet!),
                if (recu.chauffeurNom != null) _detail('Chauffeur', recu.chauffeurNom!),
              ],
              if (recu.isMarchandise) ...[
                if (recu.designation != null) _detail('Désignation', recu.designation!),
                if (recu.poids != null) _detail('Poids', '${recu.poids} kg'),
                if (recu.numeroPiece != null) _detail('N° Pièce', recu.numeroPiece!),
                if (recu.conducteurNom != null) _detail('Conducteur', recu.conducteurNom!),
              ],
              if (recu.observations != null && recu.observations!.isNotEmpty) _detail('Observations', recu.observations!),
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: (recu.valide ? AppColors.success : AppColors.warning).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  recu.valide ? 'Validé' : 'En attente de validation',
                  style: TextStyle(color: recu.valide ? AppColors.success : AppColors.warning, fontWeight: FontWeight.w600, fontSize: 13),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  if (!recu.valide) ...[
                    Expanded(
                      child: AppButton(
                        label: 'Valider',
                        icon: Icons.check_circle,
                        isExpanded: true,
                        onPressed: () { Navigator.pop(ctx); _validerRecu(recu); },
                      ),
                    ),
                  ],
                  if (recu.valide) ...[
                    Expanded(
                      child: AppButton(
                        label: 'Imprimer',
                        icon: Icons.print,
                        isExpanded: true,
                        onPressed: () { Navigator.pop(ctx); _printRecu(recu); },
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _detail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          Flexible(child: Text(value, style: const TextStyle(color: AppColors.textPrimary), textAlign: TextAlign.end)),
        ],
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'peage_urbain': return Icons.traffic;
      case 'pont_bascule': return Icons.scale;
      case 'etalage': return Icons.store;
      case 'chargement': return Icons.upload;
      case 'dechargement': return Icons.download;
      default: return Icons.receipt;
    }
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
                  onPressed: () => Navigator.push(context, MaterialPageRoute(
                    builder: (_) => FacturePdfPage(declaration: declaration),
                  )),
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
}

class _RecuPerceptionTile extends StatelessWidget {
  final RecuPerception recu;
  final VoidCallback onTap;
  final VoidCallback? onValider;
  final VoidCallback onPrint;
  final VoidCallback? onDelete;

  const _RecuPerceptionTile({required this.recu, required this.onTap, this.onValider, required this.onPrint, this.onDelete});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primary.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_typeIcon(recu.typePerception), color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(recu.numero, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: (recu.valide ? AppColors.success : AppColors.warning).withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        recu.valide ? 'Validé' : 'Attente',
                        style: TextStyle(color: recu.valide ? AppColors.success : AppColors.warning, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
                Text(recu.typeLabel, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(formatMontant(recu.montant), style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 15)),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (onValider != null)
                    IconButton(
                      onPressed: onValider,
                      icon: const Icon(Icons.check_circle, size: 18, color: AppColors.success),
                      tooltip: 'Valider',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  if (recu.valide)
                    IconButton(
                      onPressed: onPrint,
                      icon: const Icon(Icons.print, size: 18, color: AppColors.primary),
                      tooltip: 'Imprimer',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  if (onDelete != null)
                    IconButton(
                      onPressed: onDelete,
                      icon: const Icon(Icons.delete, size: 18, color: AppColors.error),
                      tooltip: 'Supprimer',
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'peage_urbain': return Icons.traffic;
      case 'pont_bascule': return Icons.scale;
      case 'etalage': return Icons.store;
      case 'chargement': return Icons.upload;
      case 'dechargement': return Icons.download;
      default: return Icons.receipt;
    }
  }
}
