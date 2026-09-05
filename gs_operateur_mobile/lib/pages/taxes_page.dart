import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../services/taxe_service.dart';
import '../models/taxe.dart';
import '../providers/auth_provider.dart';
import '../widgets/widgets.dart';
import '../utils/helpers.dart';

class TaxesPage extends StatefulWidget {
  const TaxesPage({super.key});

  @override
  State<TaxesPage> createState() => _TaxesPageState();
}

class _TaxesPageState extends State<TaxesPage> {
  List<Taxe> _taxes = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() async {
    setState(() => _loading = true);
    try {
      final taxes = await TaxeService().list();
      if (mounted) setState(() { _taxes = taxes; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        showAppSnackBar(context, 'Erreur: $e', isError: true);
      }
    }
  }

  void _showCreateTaxe() {
    final codeCtrl = TextEditingController();
    final nomCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final tauxCtrl = TextEditingController();
    String? categorie;
    String? unite;
    String? periodicite;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setSheetState) => Container(
          padding: EdgeInsets.fromLTRB(16, 16, 16, MediaQuery.of(ctx).viewInsets.bottom + 16),
          decoration: const BoxDecoration(
            color: AppColors.bgDark,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text('Nouvelle Taxe', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                AppInput(label: 'Code *', hint: 'Ex: PAT001', controller: codeCtrl, validator: (v) => v == null || v.isEmpty ? 'Requis' : null),
                const SizedBox(height: 12),
                AppInput(label: 'Nom *', hint: 'Ex: Patente commerciale', controller: nomCtrl, validator: (v) => v == null || v.isEmpty ? 'Requis' : null),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Catégorie *',
                  value: categorie,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'patente', label: 'Patente'),
                    AppDropdownItem(value: 'foncier', label: 'Foncier'),
                    AppDropdownItem(value: 'revenus_locatifs', label: 'Revenus locatifs'),
                    AppDropdownItem(value: 'personnel_minimum', label: 'Personnel minimum'),
                    AppDropdownItem(value: 'vehicule', label: 'Véhicule'),
                    AppDropdownItem(value: 'permis_construire', label: 'Permis de construire'),
                    AppDropdownItem(value: 'etalage', label: 'Étalage'),
                    AppDropdownItem(value: 'autre', label: 'Autre'),
                  ],
                  onChanged: (v) => setSheetState(() => categorie = v),
                ),
                const SizedBox(height: 12),
                AppInput(label: 'Taux', hint: 'Ex: 10', controller: tauxCtrl, keyboardType: TextInputType.number),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Unité *',
                  value: unite,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'pourcentage', label: 'Pourcentage (%)'),
                    AppDropdownItem(value: 'montant_fixe', label: 'Montant fixe (CDF)'),
                    AppDropdownItem(value: 'par_unite', label: 'Par unité'),
                  ],
                  onChanged: (v) => setSheetState(() => unite = v),
                ),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Périodicité *',
                  value: periodicite,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'mensuelle', label: 'Mensuelle'),
                    AppDropdownItem(value: 'trimestrielle', label: 'Trimestrielle'),
                    AppDropdownItem(value: 'semestrielle', label: 'Semestrielle'),
                    AppDropdownItem(value: 'annuelle', label: 'Annuelle'),
                    AppDropdownItem(value: 'evenementielle', label: 'Événementielle'),
                  ],
                  onChanged: (v) => setSheetState(() => periodicite = v),
                ),
                const SizedBox(height: 12),
                AppInput(label: 'Description', hint: 'Description optionnelle', controller: descCtrl, maxLines: 2),
                const SizedBox(height: 20),
                AppButton(
                  label: 'Créer la taxe',
                  icon: Icons.check,
                  isExpanded: true,
                  isLoading: false,
                  onPressed: () async {
                    if (codeCtrl.text.isEmpty || nomCtrl.text.isEmpty || categorie == null || unite == null || periodicite == null) {
                      showAppSnackBar(ctx, 'Remplissez tous les champs obligatoires', isError: true);
                      return;
                    }
                    Navigator.pop(ctx);
                    try {
                      await TaxeService().create({
                        'code': codeCtrl.text.trim(),
                        'nom': nomCtrl.text.trim(),
                        'categorie': categorie,
                        if (tauxCtrl.text.isNotEmpty) 'taux': double.tryParse(tauxCtrl.text),
                        'unite': unite,
                        'periodicite': periodicite,
                        if (descCtrl.text.isNotEmpty) 'description': descCtrl.text.trim(),
                      });
                      if (mounted) {
                        showAppSnackBar(context, 'Taxe créée avec succès');
                        _load();
                      }
                    } catch (e) {
                      if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
                    }
                  },
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _editTaxe(Taxe taxe) {
    final codeCtrl = TextEditingController(text: taxe.code);
    final nomCtrl = TextEditingController(text: taxe.nom);
    final tauxCtrl = TextEditingController(text: taxe.taux.toString());
    final descCtrl = TextEditingController(text: taxe.description ?? '');
    String categorie = taxe.categorie ?? 'patente';
    String unite = taxe.unite ?? 'fixe';
    String periodicite = taxe.periodicite ?? 'mensuelle';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 20),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Modifier la taxe', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 16),
                AppInput(label: 'Code', controller: codeCtrl),
                const SizedBox(height: 12),
                AppInput(label: 'Nom *', controller: nomCtrl),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Catégorie',
                  value: categorie,
                  items: const [
                    AppDropdownItem(value: 'patente', label: 'Patente'),
                    AppDropdownItem(value: 'foncier', label: 'Foncier'),
                    AppDropdownItem(value: 'revenus_locatifs', label: 'Revenus locatifs'),
                    AppDropdownItem(value: 'personnel_minimum', label: 'Personnel minimum'),
                    AppDropdownItem(value: 'vehicule', label: 'Véhicule'),
                    AppDropdownItem(value: 'permis_construire', label: 'Permis de construire'),
                    AppDropdownItem(value: 'etalage', label: 'Étalage'),
                    AppDropdownItem(value: 'autre', label: 'Autre'),
                  ],
                  onChanged: (v) => setSheetState(() => categorie = v ?? categorie),
                ),
                const SizedBox(height: 12),
                AppInput(label: 'Taux', hint: 'Ex: 10', controller: tauxCtrl, keyboardType: TextInputType.number),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Unité *',
                  value: unite,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'pourcentage', label: 'Pourcentage (%)'),
                    AppDropdownItem(value: 'montant_fixe', label: 'Montant fixe (CDF)'),
                    AppDropdownItem(value: 'par_unite', label: 'Par unité'),
                  ],
                  onChanged: (v) => setSheetState(() => unite = v ?? unite),
                ),
                const SizedBox(height: 12),
                AppDropdown<String>(
                  label: 'Périodicité',
                  value: periodicite,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'mensuelle', label: 'Mensuelle'),
                    AppDropdownItem(value: 'trimestrielle', label: 'Trimestrielle'),
                    AppDropdownItem(value: 'semestrielle', label: 'Semestrielle'),
                    AppDropdownItem(value: 'annuelle', label: 'Annuelle'),
                  ],
                  onChanged: (v) => setSheetState(() => periodicite = v ?? periodicite),
                ),
                const SizedBox(height: 12),
                AppInput(label: 'Description', controller: descCtrl, maxLines: 2),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nomCtrl.text.trim().isEmpty) return;
                      try {
                        await TaxeService().update(taxe.id, {
                          'code': codeCtrl.text.trim(),
                          'nom': nomCtrl.text.trim(),
                          'categorie': categorie,
                          if (tauxCtrl.text.isNotEmpty) 'taux': double.tryParse(tauxCtrl.text),
                          'unite': unite,
                          'periodicite': periodicite,
                          if (descCtrl.text.isNotEmpty) 'description': descCtrl.text.trim(),
                        });
                        if (mounted) {
                          Navigator.pop(ctx);
                          showAppSnackBar(context, 'Taxe modifiée');
                          _load();
                        }
                      } catch (e) {
                        if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
                      }
                    },
                    child: const Text('Enregistrer'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _deleteTaxe(Taxe taxe) async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Supprimer',
      message: 'Supprimer la taxe "${taxe.nom}" ?',
      confirmText: 'Supprimer',
      isDestructive: true,
    );
    if (confirmed && mounted) {
      try {
        await TaxeService().delete(taxe.id);
        showAppSnackBar(context, 'Taxe supprimée');
        _load();
      } catch (e) {
        showAppSnackBar(context, 'Erreur: $e', isError: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOperateur = context.watch<AuthProvider>().isOperateur;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Taxes'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          if (!isOperateur)
            IconButton(onPressed: _showCreateTaxe, icon: const Icon(Icons.add_circle_outline)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _taxes.isEmpty
              ? const EmptyState(icon: Icons.receipt_long, title: 'Aucune taxe', subtitle: 'Appuyez + pour ajouter')
              : RefreshIndicator(
                  onRefresh: () async => _load(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _taxes.length,
                    itemBuilder: (_, index) => _TaxeTile(
                      taxe: _taxes[index],
                      isOperateur: isOperateur,
                      onEdit: () => _editTaxe(_taxes[index]),
                      onDelete: () => _deleteTaxe(_taxes[index]),
                    ),
                  ),
                ),
    );
  }
}

class _TaxeTile extends StatelessWidget {
  final Taxe taxe;
  final bool isOperateur;
  final VoidCallback onEdit;
  final VoidCallback onDelete;
  const _TaxeTile({required this.taxe, required this.isOperateur, required this.onEdit, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    IconData catIcon;
    Color catColor;
    switch (taxe.categorie) {
      case 'patente': catIcon = Icons.store; catColor = AppColors.primary; break;
      case 'foncier': catIcon = Icons.home; catColor = AppColors.success; break;
      case 'vehicule': catIcon = Icons.directions_car; catColor = AppColors.warning; break;
      case 'permis_construire': catIcon = Icons.construction; catColor = AppColors.info; break;
      default: catIcon = Icons.receipt; catColor = AppColors.primary;
    }

    return AppCard(
      onTap: isOperateur ? null : onEdit,
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (taxe.estActif ? catColor : AppColors.textMuted).withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(catIcon, color: taxe.estActif ? catColor : AppColors.textMuted, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(taxe.nom, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text('${taxe.code} • ${taxe.periodicite ?? '-'}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                    if (taxe.description != null && taxe.description!.isNotEmpty)
                      Text(taxe.description!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(taxe.tauxFormate, style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: taxe.unite == 'pourcentage' ? 18 : 14)),
                  const SizedBox(height: 4),
                  Text('${taxe.nombreDeclarations} décl.', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: (taxe.estActif ? AppColors.success : AppColors.textMuted).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(taxe.estActif ? 'Actif' : 'Inactif', style: TextStyle(color: taxe.estActif ? AppColors.success : AppColors.textMuted, fontSize: 10)),
                  ),
                ],
              ),
            ],
          ),
          if (!isOperateur) ...[
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onEdit,
                    icon: const Icon(Icons.edit, size: 16),
                    label: const Text('Modifier'),
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.primary),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: onDelete,
                    icon: const Icon(Icons.delete_outline, size: 16),
                    label: const Text('Supprimer'),
                    style: OutlinedButton.styleFrom(foregroundColor: AppColors.error),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
