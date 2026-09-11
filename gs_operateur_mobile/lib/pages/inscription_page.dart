import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../config/theme.dart';
import '../services/api_service.dart';
import '../services/localisation_service.dart';
import '../services/activite_service.dart';
import '../models/localisation.dart';
import '../models/activite.dart';

class InscriptionPage extends StatefulWidget {
  const InscriptionPage({super.key});

  @override
  State<InscriptionPage> createState() => _InscriptionPageState();
}

class _InscriptionPageState extends State<InscriptionPage> {
  final _formKey = GlobalKey<FormState>();
  final _localisationService = LocalisationService();
  final _activiteService = ActiviteService();

  String _type = 'physique';
  final _nomController = TextEditingController();
  final _prenomController = TextEditingController();
  final _emailController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _adresseController = TextEditingController();
  final _denominationController = TextEditingController();
  final _formeJuridiqueController = TextEditingController();
  final _lieuNaissanceController = TextEditingController();
  final _nationaliteController = TextEditingController(text: 'Congolaise');
  final _dateDebutActiviteController = TextEditingController();
  final _valeurIdentifiantController = TextEditingController();
  final _passwordController = TextEditingController();
  final _passwordConfirmController = TextEditingController();

  String? _sexe;
  DateTime? _dateNaissance;
  int? _provinceId;
  int? _villeId;
  int? _communeId;
  int? _quartierId;
  int? _activiteId;
  String? _typeIdentifiant;

  bool _obscurePassword = true;
  bool _isLoading = false;
  String? _error;
  bool _success = false;

  List<Province> _provinces = [];
  List<Ville> _villes = [];
  List<Commune> _communes = [];
  List<Quartier> _quartiers = [];
  List<ActiviteEconomique> _activites = [];
  bool _loadingData = true;
  bool _loadingVilles = false;
  bool _loadingCommunes = false;
  bool _loadingQuartiers = false;

  bool get _isPhysique => _type == 'physique';

  static const Map<String, String> _identifiantLabels = {
    'RCCM': 'RCCM',
    'IDNAT': 'ID NAT',
    'NUMERO_IMPOT': 'Numéro d\'impôt',
    'NIF': 'NIF',
    'CNSS': 'CNSS',
    'ONEM': 'ONEM',
    'PASSEPORT': 'Passeport',
    'PERMIS_CONDURE': 'Permis de conduire',
  };

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() async {
    try {
      final actResult = await _activiteService.list();
      final provResult = await _localisationService.provinces();
      if (mounted) {
        setState(() {
          _activites = actResult;
          _provinces = provResult;
          _loadingData = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loadingData = false);
    }
  }

  void _fetchVilles(int provinceId) async {
    setState(() { _loadingVilles = true; _villes = []; _communes = []; _quartiers = []; _villeId = null; _communeId = null; _quartierId = null; });
    try {
      _villes = await _localisationService.villes(provinceId: provinceId);
    } catch (_) {}
    if (mounted) setState(() => _loadingVilles = false);
  }

  void _fetchCommunes(int villeId) async {
    setState(() { _loadingCommunes = true; _communes = []; _quartiers = []; _communeId = null; _quartierId = null; });
    try {
      _communes = await _localisationService.communes(villeId: villeId);
    } catch (_) {}
    if (mounted) setState(() => _loadingCommunes = false);
  }

  void _fetchQuartiers(int communeId) async {
    setState(() { _loadingQuartiers = true; _quartiers = []; _quartierId = null; });
    try {
      _quartiers = await _localisationService.quartiers(communeId: communeId);
    } catch (_) {}
    if (mounted) setState(() => _loadingQuartiers = false);
  }

  @override
  void dispose() {
    _nomController.dispose();
    _prenomController.dispose();
    _emailController.dispose();
    _telephoneController.dispose();
    _adresseController.dispose();
    _denominationController.dispose();
    _formeJuridiqueController.dispose();
    _lieuNaissanceController.dispose();
    _nationaliteController.dispose();
    _dateDebutActiviteController.dispose();
    _valeurIdentifiantController.dispose();
    _passwordController.dispose();
    _passwordConfirmController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _dateNaissance ?? DateTime(2000),
      firstDate: DateTime(1920),
      lastDate: DateTime.now().subtract(const Duration(days: 365 * 16)),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(colorScheme: ColorScheme.dark(primary: AppColors.primary)),
          child: child!,
        );
      },
    );
    if (picked != null) setState(() => _dateNaissance = picked);
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _isLoading = true; _error = null; });

    try {
      final data = <String, dynamic>{
        'type': _type,
        'nom': _nomController.text.trim(),
        'email': _emailController.text.trim(),
        'mot_de_passe': _passwordController.text,
        'mot_de_passe_confirmation': _passwordConfirmController.text,
      };

      if (_isPhysique) {
        if (_prenomController.text.isNotEmpty) data['prenom'] = _prenomController.text.trim();
        if (_sexe != null) data['sexe'] = _sexe;
        if (_dateNaissance != null) data['date_naissance'] = _dateNaissance!.toIso8601String().substring(0, 10);
        if (_lieuNaissanceController.text.isNotEmpty) data['lieu_naissance'] = _lieuNaissanceController.text.trim();
        if (_nationaliteController.text.isNotEmpty) data['nationalite'] = _nationaliteController.text.trim();
      } else {
        if (_denominationController.text.isNotEmpty) data['denomination_sociale'] = _denominationController.text.trim();
        if (_formeJuridiqueController.text.isNotEmpty) data['forme_juridique'] = _formeJuridiqueController.text.trim();
      }

      if (_telephoneController.text.isNotEmpty) data['telephone'] = _telephoneController.text.trim();
      if (_adresseController.text.isNotEmpty) data['adresse'] = _adresseController.text.trim();
      if (_quartierId != null) data['id_quartier'] = _quartierId;
      if (_activiteId != null) data['activite_id'] = _activiteId;
      if (_dateDebutActiviteController.text.isNotEmpty) data['date_debut_activite'] = _dateDebutActiviteController.text;
      if (_typeIdentifiant != null && _typeIdentifiant!.isNotEmpty) {
        data['type_identifiant'] = _typeIdentifiant;
        if (_valeurIdentifiantController.text.isNotEmpty) data['valeur_identifiant'] = _valeurIdentifiantController.text.trim();
      }

      final api = ApiService();
      await api.post('/inscription', data: data);
      if (mounted) setState(() => _success = true);
    } catch (e) {
      if (mounted) setState(() { _error = e.toString().replaceAll('Exception: ', ''); _isLoading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_success) {
      return Scaffold(
        body: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(colors: [AppColors.bgDark, Color(0xFF1A1A3E)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
          ),
          child: SafeArea(
            child: Center(
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.2), shape: BoxShape.circle),
                      child: const Icon(Icons.check_circle, size: 48, color: AppColors.success),
                    ),
                    const SizedBox(height: 20),
                    const Text('Inscription soumise !', style: TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    const Text(
                      'Votre demande a été envoyée. Un administrateur va examiner votre dossier. Vous recevrez une confirmation par email.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 14, height: 1.5),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: () => context.go('/login'),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                        child: const Text('Retour à la connexion', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [AppColors.bgDark, Color(0xFF1A1A3E)], begin: Alignment.topCenter, end: Alignment.bottomCenter),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      IconButton(onPressed: () => context.go('/'), icon: const Icon(Icons.arrow_back, color: AppColors.textSecondary)),
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Inscription opérateur', style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold)),
                            Text('Créez votre compte pour déclarer vos taxes', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 28),

                  if (_error != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.error.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.error, size: 20),
                          const SizedBox(width: 8),
                          Expanded(child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13))),
                        ],
                      ),
                    ),

                  // === IDENTITE ===
                  _sectionTitle('Identité', Icons.person_outline),
                  const SizedBox(height: 16),

                  _buildLabel('Type de personne *'),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(child: _buildTypeChip('physique', 'Physique')),
                      const SizedBox(width: 12),
                      Expanded(child: _buildTypeChip('morale', 'Morale')),
                    ],
                  ),
                  const SizedBox(height: 16),

                  _buildLabel(_isPhysique ? 'Nom *' : 'Raison sociale *'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _nomController,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: _inputDecoration(hint: _isPhysique ? 'Votre nom' : 'Nom de l\'entreprise'),
                    validator: (v) => v == null || v.isEmpty ? 'Requis' : null,
                  ),
                  const SizedBox(height: 16),

                  if (_isPhysique) ...[
                    _buildLabel('Prénom'),
                    const SizedBox(height: 8),
                    TextFormField(controller: _prenomController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'Votre prénom')),
                    const SizedBox(height: 16),

                    _buildLabel('Sexe *'),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildSexeChip('M', 'Masculin')),
                        const SizedBox(width: 12),
                        Expanded(child: _buildSexeChip('F', 'Féminin')),
                        const SizedBox(width: 12),
                        Expanded(child: _buildSexeChip('Autre', 'Autre')),
                      ],
                    ),
                    const SizedBox(height: 16),

                    _buildLabel('Date de naissance *'),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: _selectDate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        decoration: BoxDecoration(
                          color: AppColors.bgInput,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.calendar_today, color: AppColors.textMuted, size: 20),
                            const SizedBox(width: 12),
                            Text(
                              _dateNaissance != null ? '${_dateNaissance!.day.toString().padLeft(2, '0')}/${_dateNaissance!.month.toString().padLeft(2, '0')}/${_dateNaissance!.year}' : 'Sélectionner...',
                              style: TextStyle(color: _dateNaissance != null ? AppColors.textPrimary : AppColors.textMuted, fontSize: 15),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    _buildLabel('Lieu de naissance'),
                    const SizedBox(height: 8),
                    TextFormField(controller: _lieuNaissanceController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'Ville')),
                    const SizedBox(height: 16),

                    _buildLabel('Nationalité'),
                    const SizedBox(height: 8),
                    TextFormField(controller: _nationaliteController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'Congolaise')),
                    const SizedBox(height: 16),
                  ],

                  if (!_isPhysique) ...[
                    _buildLabel('Forme juridique'),
                    const SizedBox(height: 8),
                    TextFormField(controller: _formeJuridiqueController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'SARL, SAS, ASBL...')),
                    const SizedBox(height: 16),
                  ],

                  // === LOCALISATION ===
                  _sectionTitle('Localisation', Icons.location_on_outlined),
                  const SizedBox(height: 16),

                  _buildLabel('Province'),
                  const SizedBox(height: 8),
                  _loadingData
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : _buildDropdown<int>(
                          value: _provinceId,
                          items: _provinces.map((p) => DropdownMenuItem(value: p.id, child: Text(p.nom, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                          hint: 'Sélectionner une province...',
                          onChanged: (v) {
                            setState(() => _provinceId = v);
                            if (v != null) _fetchVilles(v);
                          },
                        ),
                  const SizedBox(height: 16),

                  _buildLabel('Ville'),
                  const SizedBox(height: 8),
                  _loadingVilles
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : _buildDropdown<int>(
                          value: _villeId,
                          items: _villes.map((v) => DropdownMenuItem(value: v.id, child: Text(v.nom, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                          hint: _provinceId != null ? 'Sélectionner une ville...' : 'Choisir une province d\'abord',
                          onChanged: (v) {
                            setState(() => _villeId = v);
                            if (v != null) _fetchCommunes(v);
                          },
                        ),
                  const SizedBox(height: 16),

                  _buildLabel('Commune'),
                  const SizedBox(height: 8),
                  _loadingCommunes
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : _buildDropdown<int>(
                          value: _communeId,
                          items: _communes.map((c) => DropdownMenuItem(value: c.id, child: Text(c.nom, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                          hint: _villeId != null ? 'Sélectionner une commune...' : 'Choisir une ville d\'abord',
                          onChanged: (v) {
                            setState(() => _communeId = v);
                            if (v != null) _fetchQuartiers(v);
                          },
                        ),
                  const SizedBox(height: 16),

                  _buildLabel('Quartier'),
                  const SizedBox(height: 8),
                  _loadingQuartiers
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : _buildDropdown<int>(
                          value: _quartierId,
                          items: _quartiers.map((q) => DropdownMenuItem(value: q.id, child: Text(q.nom, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                          hint: _communeId != null ? 'Sélectionner un quartier...' : 'Choisir une commune d\'abord',
                          onChanged: (v) => setState(() => _quartierId = v),
                        ),
                  const SizedBox(height: 24),

                  // === CONTACT & ACTIVITE ===
                  _sectionTitle('Contact & Activité', Icons.work_outline),
                  const SizedBox(height: 16),

                  _buildLabel('Email *'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: _inputDecoration(hint: 'email@exemple.com', icon: Icons.email_outlined),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Requis';
                      if (!RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(v)) return 'Email invalide';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Téléphone'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _telephoneController,
                    keyboardType: TextInputType.phone,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: _inputDecoration(hint: '+243...', icon: Icons.phone_outlined),
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Adresse'),
                  const SizedBox(height: 8),
                  TextFormField(controller: _adresseController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'Adresse complète')),
                  const SizedBox(height: 16),

                  _buildLabel('Activité économique'),
                  const SizedBox(height: 8),
                  _loadingData
                      ? const Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2))
                      : _buildDropdown<int>(
                          value: _activiteId,
                          items: _activites.map((a) => DropdownMenuItem(value: a.id, child: Text(a.description ?? a.typeActivite ?? 'Activité ${a.id}', style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                          hint: 'Sélectionner...',
                          onChanged: (v) => setState(() => _activiteId = v),
                        ),
                  const SizedBox(height: 16),

                  _buildLabel('Date début activité'),
                  const SizedBox(height: 8),
                  TextFormField(controller: _dateDebutActiviteController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'AAAA-MM-JJ')),
                  const SizedBox(height: 24),

                  // === IDENTIFIANT OFFICIEL ===
                  _sectionTitle('Identifiant officiel (optionnel)', Icons.badge_outlined),
                  const SizedBox(height: 16),

                  _buildLabel('Type'),
                  const SizedBox(height: 8),
                  _buildDropdown<String>(
                    value: _typeIdentifiant,
                    items: _identifiantLabels.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
                    hint: 'Sélectionner...',
                    onChanged: (v) => setState(() => _typeIdentifiant = v),
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Numéro / Valeur'),
                  const SizedBox(height: 8),
                  TextFormField(controller: _valeurIdentifiantController, style: const TextStyle(color: AppColors.textPrimary), decoration: _inputDecoration(hint: 'Ex: 012345678')),
                  const SizedBox(height: 24),

                  // === MOT DE PASSE ===
                  _sectionTitle('Mot de passe', Icons.lock_outline),
                  const SizedBox(height: 16),

                  _buildLabel('Mot de passe *'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: _inputDecoration(
                      hint: 'Minimum 8 caractères',
                      icon: Icons.lock_outline,
                      suffix: IconButton(
                        icon: Icon(_obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined, color: AppColors.textMuted, size: 20),
                        onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                      ),
                    ),
                    validator: (v) {
                      if (v == null || v.isEmpty) return 'Requis';
                      if (v.length < 8) return 'Minimum 8 caractères';
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),

                  _buildLabel('Confirmer *'),
                  const SizedBox(height: 8),
                  TextFormField(
                    controller: _passwordConfirmController,
                    obscureText: true,
                    style: const TextStyle(color: AppColors.textPrimary),
                    decoration: _inputDecoration(hint: 'Retapez le mot de passe', icon: Icons.lock_outline),
                    validator: (v) {
                      if (v != _passwordController.text) return 'Les mots de passe ne correspondent pas';
                      return null;
                    },
                  ),
                  const SizedBox(height: 32),

                  SizedBox(
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _isLoading
                          ? const SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Text("Soumettre l'inscription", style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextButton(
                    onPressed: () => context.go('/login'),
                    child: const Text('Déjà un compte ? Se connecter', style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _sectionTitle(String text, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 10),
        Text(text, style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Text(text, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.5));
  }

  Widget _buildDropdown<T>({T? value, required List<DropdownMenuItem<T>> items, required String hint, ValueChanged<T?>? onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: AppColors.bgInput,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: DropdownButton<T>(
        value: value,
        isExpanded: true,
        underline: const SizedBox(),
        dropdownColor: AppColors.bgCard,
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
        icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted),
        hint: Text(hint, style: const TextStyle(color: AppColors.textMuted, fontSize: 14)),
        items: items,
        onChanged: onChanged,
      ),
    );
  }

  Widget _buildTypeChip(String value, String label) {
    final isSelected = _type == value;
    return GestureDetector(
      onTap: () => setState(() { _type = value; _sexe = null; }),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.2) : AppColors.bgInput,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Center(child: Text(label, style: TextStyle(color: isSelected ? AppColors.primary : AppColors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500))),
      ),
    );
  }

  Widget _buildSexeChip(String value, String label) {
    final isSelected = _sexe == value;
    return GestureDetector(
      onTap: () => setState(() => _sexe = value),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary.withValues(alpha: 0.2) : AppColors.bgInput,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: isSelected ? AppColors.primary : AppColors.border),
        ),
        child: Center(child: Text(label, style: TextStyle(color: isSelected ? AppColors.primary : AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500))),
      ),
    );
  }

  InputDecoration _inputDecoration({required String hint, IconData? icon, Widget? suffix}) {
    return InputDecoration(
      hintText: hint,
      prefixIcon: icon != null ? Icon(icon, color: AppColors.textMuted, size: 20) : null,
      suffixIcon: suffix,
      filled: true,
      fillColor: AppColors.bgInput,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.border)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.border)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: const BorderSide(color: AppColors.primary, width: 2)),
    );
  }
}
