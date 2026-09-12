import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../models/recu_perception.dart';
import '../services/recu_perception_service.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';
import 'recu_perception_pdf_page.dart';

class RecusPerceptionPage extends StatefulWidget {
  const RecusPerceptionPage({super.key});

  @override
  State<RecusPerceptionPage> createState() => _RecusPerceptionPageState();
}

class _RecusPerceptionPageState extends State<RecusPerceptionPage> {
  final _service = RecuPerceptionService();
  final _searchController = TextEditingController();
  List<RecuPerception> _recus = [];
  bool _loading = true;
  String? _selectedType;
  String? _error;
  int _currentPage = 1;
  bool _hasMore = true;
  Map<String, dynamic>? _stats;

  @override
  void initState() {
    super.initState();
    _load();
    _loadStats();
  }

  void _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await _service.list(
        search: _searchController.text,
        typePerception: _selectedType,
        page: _currentPage,
      );
      if (mounted) setState(() { _recus = data; _loading = false; _hasMore = data.length >= 15; });
    } catch (e) {
      if (mounted) setState(() { _loading = false; _error = e.toString(); });
    }
  }

  void _loadStats() async {
    try {
      final stats = await _service.stats();
      if (mounted) setState(() => _stats = stats);
    } catch (_) {}
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
        title: const Text('Reçus de Perception'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          IconButton(
            onPressed: () => context.push('/recus-perception/ajouter'),
            icon: const Icon(Icons.add),
            tooltip: 'Nouveau reçu',
          ),
        ],
      ),
      body: Column(
        children: [
          if (_stats != null) _buildStats(),
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 0),
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
                    onChanged: (_) => _load(),
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String?>(
                  icon: Icon(
                    Icons.filter_list,
                    color: _selectedType != null ? AppColors.primary : AppColors.textMuted,
                  ),
                  onSelected: (value) {
                    setState(() => _selectedType = value);
                    _load();
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
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _error != null
                    ? EmptyState(icon: Icons.error_outline, title: 'Erreur', subtitle: _error)
                    : _recus.isEmpty
                    ? const EmptyState(icon: Icons.receipt, title: 'Aucun reçu', subtitle: 'Créez votre premier reçu de perception')
                    : RefreshIndicator(
                        onRefresh: () async { _load(); _loadStats(); },
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _recus.length,
                          itemBuilder: (_, index) => _RecuTile(
                            recu: _recus[index],
                            onTap: () => _showDetails(_recus[index]),
                            onValider: _recus[index].valide ? null : () => _validerRecu(_recus[index]),
                            onPrint: () => _printRecu(_recus[index]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStats() {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _StatItem(label: 'Total', value: '${_stats!['total_recus'] ?? 0}', color: AppColors.primary),
          _StatItem(label: 'Montant', value: formatMontant(_stats!['montant_total'] ?? 0), color: AppColors.success),
        ],
      ),
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
      await _service.valider(recu.id);
      if (!mounted) return;
      showAppSnackBar(context, 'Reçu ${recu.numero} validé avec succès');
      _load();
    } catch (e) {
      if (!mounted) return;
      showAppSnackBar(context, 'Erreur: ${e.toString().replaceAll('Exception: ', '')}', isError: true);
    }
  }

  void _showDetails(RecuPerception recu) {
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

class _RecuTile extends StatelessWidget {
  final RecuPerception recu;
  final VoidCallback onTap;
  final VoidCallback? onValider;
  final VoidCallback onPrint;

  const _RecuTile({required this.recu, required this.onTap, this.onValider, required this.onPrint});

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

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ],
    );
  }
}
