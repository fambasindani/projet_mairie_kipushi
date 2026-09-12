import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../models/recu_perception.dart';
import '../models/taxe.dart';
import '../services/recu_perception_service.dart';
import '../services/taxe_service.dart';
import '../utils/formatters.dart';
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
  final _montantCtrl = TextEditingController();
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
  bool get _isEditing => widget.id != null;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    setState(() => _loading = true);
    try {
      final taxes = await _taxeService.list();
      if (_isEditing) {
        final recu = await _service.get(widget.id!);
        _typePerception = recu.typePerception;
        _taxeId = recu.taxe?.id;
        _montant = recu.montant;
        _montantCtrl.text = recu.montant.toStringAsFixed(0);
        _categorieVehicule = recu.categorieVehicule;
        _plaque = recu.plaqueImmatriculation;
        _trajet = recu.trajet;
        _chauffeurNom = recu.chauffeurNom;
        _conducteurNom = recu.conducteurNom;
        _numeroPiece = recu.numeroPiece;
        _designation = recu.designation;
        _poids = recu.poids;
        _observations = recu.observations;
        if (recu.dateEmission.isNotEmpty) {
          _dateEmission = DateTime.tryParse(recu.dateEmission) ?? DateTime.now();
        }
        if (recu.heureEmission != null && recu.heureEmission!.isNotEmpty) {
          final parts = recu.heureEmission!.split(':');
          if (parts.length >= 2) {
            _heureEmission = TimeOfDay(hour: int.tryParse(parts[0]) ?? 0, minute: int.tryParse(parts[1]) ?? 0);
          }
        }
      }
      if (mounted) setState(() { _taxes = taxes; _loading = false; });
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  bool get _isVehicle => _typePerception == 'peage_urbain' || _typePerception == 'pont_bascule';
  bool get _isMarchandise => _typePerception == 'chargement' || _typePerception == 'dechargement';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Modifier le Reçu' : 'Nouveau Reçu de Perception'),
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
                    items: _taxes.map((t) => AppDropdownItem(value: t.id, label: '${t.nom} - ${formatMontant(t.taux)} ${t.uniteLabel}')).toList(),
                    onChanged: (v) {
                      setState(() => _taxeId = v);
                      final taxe = _taxes.firstWhere((t) => t.id == v, orElse: () => _taxes.first);
                      setState(() {
                        _montant = taxe.taux;
                        _montantCtrl.text = taxe.taux.toStringAsFixed(0);
                      });
                    },
                    validator: (v) => v == null ? 'Taxe requise' : null,
                  ),
                  const SizedBox(height: 12),
                  AppInput(
                    label: 'Montant (CDF)',
                    controller: _montantCtrl,
                    keyboardType: TextInputType.number,
                    onChanged: (v) => _montant = double.tryParse(v) ?? 0,
                    validator: (v) => (v == null || v.isEmpty || (double.tryParse(v) ?? 0) <= 0) ? 'Montant requis' : null,
                  ),
                  const SizedBox(height: 12),
                  if (_isVehicle) ...[
                    AppInput(
                      label: 'Catégorie véhicule',
                      initialValue: _categorieVehicule,
                      onChanged: (v) => _categorieVehicule = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Plaque d\'immatriculation',
                      initialValue: _plaque,
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
                      initialValue: _chauffeurNom,
                      onChanged: (v) => _chauffeurNom = v,
                    ),
                  ],
                  if (_isMarchandise) ...[
                    AppInput(
                      label: 'Désignation',
                      initialValue: _designation,
                      onChanged: (v) => _designation = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Poids (kg)',
                      keyboardType: TextInputType.number,
                      initialValue: _poids?.toString(),
                      onChanged: (v) => _poids = double.tryParse(v),
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'N° Pièce',
                      initialValue: _numeroPiece,
                      onChanged: (v) => _numeroPiece = v,
                    ),
                    const SizedBox(height: 12),
                    AppInput(
                      label: 'Nom du conducteur',
                      initialValue: _conducteurNom,
                      onChanged: (v) => _conducteurNom = v,
                    ),
                  ],
                  const SizedBox(height: 12),
                  AppInput(
                    label: 'Observations',
                    maxLines: 2,
                    initialValue: _observations,
                    onChanged: (v) => _observations = v,
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    label: _saving
                        ? (_isEditing ? 'Modification...' : 'Enregistrement...')
                        : (_isEditing ? 'Modifier' : 'Enregistrer'),
                    icon: Icons.check,
                    isExpanded: true,
                    isLoading: _saving,
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

      if (_isEditing) {
        await _service.update(widget.id!, data);
      } else {
        await _service.create(data);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(_isEditing ? 'Reçu modifié' : 'Reçu créé'), backgroundColor: AppColors.success),
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

  @override
  void dispose() {
    _montantCtrl.dispose();
    super.dispose();
  }
}
