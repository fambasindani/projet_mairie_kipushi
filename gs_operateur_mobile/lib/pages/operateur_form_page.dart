import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/personne_provider.dart';
import '../services/personne_service.dart';
import '../widgets/widgets.dart';

class OperateurFormPage extends StatefulWidget {
  final int? id;
  const OperateurFormPage({super.key, this.id});

  @override
  State<OperateurFormPage> createState() => _OperateurFormPageState();
}

class _OperateurFormPageState extends State<OperateurFormPage> {
  final _formKey = GlobalKey<FormState>();
  String? _type;
  final _denominationCtrl = TextEditingController();
  final _nomController = TextEditingController();
  final _postnomController = TextEditingController();
  final _prenomController = TextEditingController();
  final _telephoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _adresseController = TextEditingController();
  final _cniController = TextEditingController();
  final _lieuNaissanceController = TextEditingController();
  final _formeJuridiqueController = TextEditingController();
  String? _sexe;
  DateTime? _dateNaissance;
  bool _isLoading = false;
  bool _isEdit = false;

  bool get _isPhysique => _type == 'physique';

  @override
  void initState() {
    super.initState();
    if (widget.id != null) {
      _isEdit = true;
      _loadData();
    } else {
      _type = 'physique';
    }
  }

  void _loadData() async {
    try {
      final service = PersonneService();
      final personne = await service.get(widget.id!);
      _nomController.text = personne.nom;
      _postnomController.text = personne.postnom;
      _prenomController.text = personne.prenom;
      _telephoneController.text = personne.telephone ?? '';
      _emailController.text = personne.email ?? '';
      _adresseController.text = personne.adresse ?? '';
      _cniController.text = personne.cni ?? '';
      _lieuNaissanceController.text = personne.lieuNaissance ?? '';
      setState(() {
        _type = 'physique';
        _sexe = personne.sexe;
        _dateNaissance = personne.dateNaissance;
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    if (_type == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez choisir le type (Physique ou Morale)'), backgroundColor: AppColors.error),
      );
      return;
    }

    if (_isPhysique && _nomController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Le nom est requis pour une personne physique'), backgroundColor: AppColors.error),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final data = <String, dynamic>{
        'type': _type,
      };

      if (_isPhysique) {
        data['nom'] = _nomController.text.trim();
        if (_postnomController.text.isNotEmpty) data['postnom'] = _postnomController.text.trim();
        if (_prenomController.text.isNotEmpty) data['prenom'] = _prenomController.text.trim();
        if (_sexe != null) data['sexe'] = _sexe;
        if (_dateNaissance != null) data['date_naissance'] = _dateNaissance!.toIso8601String().substring(0, 10);
        if (_lieuNaissanceController.text.isNotEmpty) data['lieu_naissance'] = _lieuNaissanceController.text.trim();
      } else {
        if (_denominationCtrl.text.isNotEmpty) data['denomination_sociale'] = _denominationCtrl.text.trim();
        if (_formeJuridiqueController.text.isNotEmpty) data['forme_juridique'] = _formeJuridiqueController.text.trim();
      }

      if (_telephoneController.text.isNotEmpty) data['telephone'] = _telephoneController.text.trim();
      if (_emailController.text.isNotEmpty) data['email'] = _emailController.text.trim();
      if (_adresseController.text.isNotEmpty) data['adresse'] = _adresseController.text.trim();
      if (_cniController.text.isNotEmpty) data['cni_numero'] = _cniController.text.trim();

      final provider = context.read<PersonneProvider>();
      if (_isEdit) {
        await provider.update(widget.id!, data);
      } else {
        await provider.create(data);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEdit ? 'Modifié avec succès' : 'Créé avec succès'),
            backgroundColor: AppColors.success,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEdit ? 'Modifier l\'opérateur' : 'Nouvel opérateur'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              AppDropdown<String>(
                label: 'Type *',
                value: _type,
                hint: 'Sélectionner le type',
                items: const [
                  AppDropdownItem(value: 'physique', label: 'Personne physique'),
                  AppDropdownItem(value: 'morale', label: 'Personne morale'),
                ],
                onChanged: (v) => setState(() => _type = v),
              ),
              const SizedBox(height: 20),

              if (_isPhysique) ...[
                AppInput(label: 'Nom *', controller: _nomController, validator: (v) => v == null || v.isEmpty ? 'Requis' : null),
                const SizedBox(height: 16),
                AppInput(label: 'Post-nom', controller: _postnomController),
                const SizedBox(height: 16),
                AppInput(label: 'Prénom', controller: _prenomController),
                const SizedBox(height: 16),
                AppDropdown<String>(
                  label: 'Sexe',
                  value: _sexe,
                  hint: 'Sélectionner',
                  items: const [
                    AppDropdownItem(value: 'M', label: 'Masculin'),
                    AppDropdownItem(value: 'F', label: 'Féminin'),
                  ],
                  onChanged: (v) => setState(() => _sexe = v),
                ),
                const SizedBox(height: 16),
                AppDateInput(
                  label: 'Date de naissance',
                  value: _dateNaissance,
                  onChanged: (v) => setState(() => _dateNaissance = v),
                ),
                const SizedBox(height: 16),
                AppInput(label: 'Lieu de naissance', controller: _lieuNaissanceController),
              ] else ...[
                AppInput(label: 'Dénomination sociale', controller: _denominationCtrl),
                const SizedBox(height: 16),
                AppInput(label: 'Forme juridique', hint: 'SARL, SA, ASBL...', controller: _formeJuridiqueController),
              ],

              const SizedBox(height: 16),
              AppInput(
                label: 'Téléphone',
                controller: _telephoneController,
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              AppInput(
                label: 'Email',
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              AppInput(label: 'Adresse', controller: _adresseController),
              const SizedBox(height: 16),
              AppInput(label: 'CNI / RCCM', controller: _cniController),
              const SizedBox(height: 32),
              AppButton(
                label: _isEdit ? 'Enregistrer les modifications' : 'Créer l\'opérateur',
                icon: _isEdit ? Icons.save : Icons.person_add,
                isExpanded: true,
                isLoading: _isLoading,
                onPressed: _save,
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
    _denominationCtrl.dispose();
    _nomController.dispose();
    _postnomController.dispose();
    _prenomController.dispose();
    _telephoneController.dispose();
    _emailController.dispose();
    _adresseController.dispose();
    _cniController.dispose();
    _lieuNaissanceController.dispose();
    _formeJuridiqueController.dispose();
    super.dispose();
  }
}
