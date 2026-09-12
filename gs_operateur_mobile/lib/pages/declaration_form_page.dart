import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/paiement_service.dart';
import '../services/taxe_service.dart';
import '../services/personne_service.dart';
import '../models/taxe.dart';
import '../models/personne.dart';
import '../widgets/widgets.dart';
import '../utils/helpers.dart';
import '../utils/formatters.dart';

class DeclarationFormPage extends StatefulWidget {
  const DeclarationFormPage({super.key});

  @override
  State<DeclarationFormPage> createState() => _DeclarationFormPageState();
}

class _DeclarationFormPageState extends State<DeclarationFormPage> {
  final _formKey = GlobalKey<FormState>();
  List<Taxe> _taxes = [];
  bool _loadingData = true;
  bool _isLoading = false;

  Taxe? _selectedTaxe;
  Personne? _selectedPersonne;
  String? _selectedPersonneLabel;
  final _exerciceCtrl = TextEditingController(text: '${DateTime.now().year}');
  DateTime? _periodeDebut;
  DateTime? _periodeFin;
  DateTime? _dateLimite;
  final _montantBaseCtrl = TextEditingController();
  final _montantTaxeCtrl = TextEditingController();
  final _observationsCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    try {
      final taxes = await TaxeService().list();
      if (mounted) setState(() {
        _taxes = taxes;
        _loadingData = false;
      });
    } catch (e) {
      setState(() => _loadingData = false);
      if (mounted) showAppSnackBar(context, 'Erreur chargement: $e', isError: true);
    }
  }

  Future<List<Personne>> _searchPersonnes(String query) async {
    return PersonneService().list(search: query);
  }

  Future<void> _selectDate(bool isDebut) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isDebut ? (_periodeDebut ?? DateTime.now()) : (_periodeFin ?? DateTime.now()),
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
    );
    if (picked != null) {
      setState(() {
        if (isDebut) {
          _periodeDebut = picked;
          if (_periodeFin == null || _periodeFin!.isBefore(picked)) _periodeFin = picked;
        } else {
          _periodeFin = picked;
        }
      });
    }
  }

  Future<void> _selectDateLimite() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateLimite ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (picked != null) setState(() => _dateLimite = picked);
  }

  String _formatDateApi(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedTaxe == null) {
      showAppSnackBar(context, 'Veuillez sélectionner une taxe', isError: true);
      return;
    }
    if (_selectedPersonne == null) {
      showAppSnackBar(context, 'Veuillez sélectionner un opérateur', isError: true);
      return;
    }
    if (_periodeDebut == null || _periodeFin == null) {
      showAppSnackBar(context, 'Veuillez sélectionner les périodes', isError: true);
      return;
    }
    if (_montantBaseCtrl.text.isEmpty) {
      showAppSnackBar(context, 'Le montant de base est requis', isError: true);
      return;
    }
    if (_montantTaxeCtrl.text.isEmpty) {
      showAppSnackBar(context, 'Le montant de la taxe est requis', isError: true);
      return;
    }
    if (_dateLimite == null) {
      showAppSnackBar(context, 'La date limite de paiement est requise', isError: true);
      return;
    }

    setState(() => _isLoading = true);

    try {
      await PaiementService().create({
        'personne_id': _selectedPersonne!.id,
        'taxe_id': _selectedTaxe!.id,
        'exercice': int.tryParse(_exerciceCtrl.text) ?? DateTime.now().year,
        'periode_debut': _formatDateApi(_periodeDebut!),
        'periode_fin': _formatDateApi(_periodeFin!),
        'montant_base': double.tryParse(_montantBaseCtrl.text) ?? 0,
        'montant_taxe': double.tryParse(_montantTaxeCtrl.text) ?? 0,
        'date_limite_paiement': _formatDateApi(_dateLimite!),
        if (_observationsCtrl.text.isNotEmpty) 'observations': _observationsCtrl.text,
      });

      if (mounted) {
        showAppSnackBar(context, 'Déclaration créée avec succès');
        context.pop();
      }
    } catch (e) {
      if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _personneLabel(Personne p) {
    if (p.type == 'morale' && p.denominationSociale != null && p.denominationSociale!.isNotEmpty) {
      return p.denominationSociale!;
    }
    return [p.nom, p.prenom].where((s) => s != null && s.isNotEmpty).join(' ');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle Déclaration'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
      ),
      body: _loadingData
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AppSearchDropdown<Personne>(
                      label: 'Opérateur *',
                      value: _selectedPersonne,
                      valueLabel: _selectedPersonneLabel,
                      hint: 'Rechercher un opérateur...',
                      onSearch: _searchPersonnes,
                      itemLabel: _personneLabel,
                      onChanged: (v) => setState(() {
                        _selectedPersonne = v;
                        _selectedPersonneLabel = v != null ? _personneLabel(v) : null;
                      }),
                      validator: (v) => v == null ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    AppDropdown<Taxe>(
                      label: 'Taxe *',
                      value: _selectedTaxe,
                      hint: 'Sélectionner une taxe',
                      items: _taxes.map((t) => AppDropdownItem(value: t, label: '${t.nom} - ${formatMontant(t.taux)} ${t.uniteLabel}')).toList(),
                      onChanged: (v) {
                        setState(() => _selectedTaxe = v);
                        if (v != null) {
                          _montantTaxeCtrl.text = v.taux.toStringAsFixed(0);
                        }
                      },
                      validator: (v) => v == null ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: 'Exercice *',
                      controller: _exerciceCtrl,
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: () => _selectDate(true),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Période début *',
                          prefixIcon: Icon(Icons.calendar_today, color: AppColors.textMuted),
                        ),
                        child: Text(
                          _periodeDebut != null ? formatDate(_periodeDebut) : 'Sélectionner...',
                          style: TextStyle(color: _periodeDebut != null ? AppColors.textPrimary : AppColors.textMuted),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: () => _selectDate(false),
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Période fin *',
                          prefixIcon: Icon(Icons.calendar_today, color: AppColors.textMuted),
                        ),
                        child: Text(
                          _periodeFin != null ? formatDate(_periodeFin) : 'Sélectionner...',
                          style: TextStyle(color: _periodeFin != null ? AppColors.textPrimary : AppColors.textMuted),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    InkWell(
                      onTap: _selectDateLimite,
                      child: InputDecorator(
                        decoration: const InputDecoration(
                          labelText: 'Date limite de paiement *',
                          prefixIcon: Icon(Icons.event, color: AppColors.textMuted),
                        ),
                        child: Text(
                          _dateLimite != null ? formatDate(_dateLimite) : 'Sélectionner...',
                          style: TextStyle(color: _dateLimite != null ? AppColors.textPrimary : AppColors.textMuted),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: 'Montant de base (CDF) *',
                      controller: _montantBaseCtrl,
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: 'Montant taxe estimé (CDF) *',
                      controller: _montantTaxeCtrl,
                      keyboardType: TextInputType.number,
                      validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                    ),
                    const SizedBox(height: 16),
                    AppInput(
                      label: 'Observations',
                      controller: _observationsCtrl,
                      maxLines: 3,
                    ),
                    const SizedBox(height: 32),
                    AppButton(
                      label: 'Créer la déclaration',
                      icon: Icons.check,
                      isExpanded: true,
                      isLoading: _isLoading,
                      onPressed: _submit,
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ),
    );
  }

  @override
  void dispose() {
    _exerciceCtrl.dispose();
    _montantBaseCtrl.dispose();
    _montantTaxeCtrl.dispose();
    _observationsCtrl.dispose();
    super.dispose();
  }
}
