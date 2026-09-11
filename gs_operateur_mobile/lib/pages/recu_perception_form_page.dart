import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../models/recu_perception.dart';
import '../models/taxe.dart';
import '../services/recu_perception_service.dart';
import '../services/taxe_service.dart';
import '../widgets/widgets.dart';

class RecuPerceptionFormPage extends StatefulWidget {
  final int? id;
  const RecuPerceptionFormPage({super.key, this.id});

  @override
  State<RecuPerceptionFormPage> createState() => _RecuPerceptionFormPageState();
}

class _RecuPerceptionFormPageState extends State<RecuPerceptionFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _service = RecuPerceptionService();
  final _taxeService = TaxeService();

  String _typePerception = 'peage_urbain';
  int? _taxeId;
  double _montant = 0;
  String? _categorieVehicule;
  String? _plaque;
  String? _trajet;
  String? _chauffeurNom;
  String? _conducteurNom;
  String? _numeroPiece;
  String? _designation;
  double? _poids;
  String? _observations;
  DateTime _dateEmission = DateTime.now();
  TimeOfDay _heureEmission = TimeOfDay.now();
  List<Taxe> _taxes = [];
  bool _loading = false;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _loadTaxes();
  }

  void _loadTaxes() async {
    setState(() => _loading = true);
    try {
      final taxes = await _taxeService.list();
      if (mounted) setState(() { _taxes = taxes; _loading = false; });
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  bool get _isVehicle => _typePerception == 'peage_urbain' || _typePerception == 'pont_bascule';
  bool get _isMarchandise => _typePerception == 'chargement' || _typePerception == 'dechargement';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouveau Reçu de Perception'),
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.close),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  const Text('Type de perception', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: RecuPerception.typeLabels.entries.map((e) {
                      final selected = _typePerception == e.key;
                      return ChoiceChip(
                        label: Text(e.value, style: TextStyle(
                          color: selected ? Colors.white : AppColors.textPrimary,
                          fontSize: 12,
                        )),
                        selected: selected,
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.bgInput,
                        onSelected: (v) => setState(() => _typePerception = e.key),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                  AppDropdown<int>(
                    label: 'Taxe',
                    value: _taxeId,
                    items: _taxes.map((t) => AppDropdownItem(value: t.id, label: t.nom)).toList(),
                    onChanged: (v) {
                      setState(() => _taxeId = v);
                      final taxe = _taxes.firstWhere((t) => t.id == v, orElse: () => _taxes.first);
                      setState(() => _montant = taxe.taux);
                    },
                    validator: (v) => v == null ? 'Taxe requise' : null,
                  ),
                  const SizedBox(height: 12),
                  AppInput(
                    label: 'Montant (CDF)',
                    keyboardType: TextInputType.number,
                    onChanged: (v) => _montant = double.tryParse(v) ?? 0,
                    validator: (v) => (v == null || v.isEmpty || (double.tryParse(v) ?? 0) <= 0) ? 'Montant requis' : null,
                  ),
                  const SizedBox(height: 12),
                  if (_isVehicle) ...[
                    AppInput(
                      label: 'Catégorie véhicule',
                      onChanged: (v) => _categorieVehicule = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Plaque d\'immatriculation',
                      onChanged: (v) => _plaque = v,
                    ),
                    const SizedBox(height: 12),
                    const Text('Trajet', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: ['aller', 'retour', 'aller_retour'].map((t) {
                        final selected = _trajet == t;
                        final label = t == 'aller' ? 'Aller' : t == 'retour' ? 'Retour' : 'Aller/Retour';
                        return ChoiceChip(
                          label: Text(label, style: TextStyle(color: selected ? Colors.white : AppColors.textPrimary, fontSize: 12)),
                          selected: selected,
                          selectedColor: AppColors.primary,
                          backgroundColor: AppColors.bgInput,
                          onSelected: (v) => setState(() => _trajet = v ? t : null),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Nom du chauffeur',
                      onChanged: (v) => _chauffeurNom = v,
                    ),
                  ],
                  if (_isMarchandise) ...[
                    AppInput(
                      label: 'Désignation',
                      onChanged: (v) => _designation = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Poids (kg)',
                      keyboardType: TextInputType.number,
                      onChanged: (v) => _poids = double.tryParse(v),
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'N° Pièce',
                      onChanged: (v) => _numeroPiece = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Nom du conducteur',
                      onChanged: (v) => _conducteurNom = v,
                    ),
                  ],
                  const SizedBox(height: 12),
                  AppInput(
                    label: 'Observations',
                    maxLines: 2,
                    onChanged: (v) => _observations = v,
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: _saving ? 'Enregistrement...' : 'Enregistrer',
                    icon: Icons.check,
                    isExpanded: true,
                    onPressed: _saving ? null : _submit,
                  ),
                ],
              ),
            ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _saving = true);
    try {
      final heure = '${_heureEmission.hour.toString().padLeft(2, '0')}:${_heureEmission.minute.toString().padLeft(2, '0')}';
      final data = <String, dynamic>{
        'type_perception': _typePerception,
        'taxe_id': _taxeId,
        'montant': _montant,
        'date_emission': _dateEmission.toIso8601String().substring(0, 10),
        'heure_emission': heure,
      };
      if (_isVehicle) {
        if (_categorieVehicule != null) data['categorie_vehicule'] = _categorieVehicule;
        if (_plaque != null) data['plaque_immatriculation'] = _plaque;
        if (_trajet != null) data['trajet'] = _trajet;
        if (_chauffeurNom != null) data['chauffeur_nom'] = _chauffeurNom;
      }
      if (_isMarchandise) {
        if (_designation != null) data['designation'] = _designation;
        if (_poids != null) data['poids'] = _poids;
        if (_numeroPiece != null) data['Numero_Piece'] = _numeroPiece;
        if (_conducteurNom != null) data['conducteur_nom'] = _conducteurNom;
      }
      if (_observations != null && _observations!.isNotEmpty) data['observations'] = _observations;

      await _service.create(data);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Reçu créé'), backgroundColor: AppColors.success),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }
}
