import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../config/theme.dart';
import '../models/personne.dart';
import '../services/personne_service.dart';
import '../services/document_service.dart';
import '../models/document.dart';
import '../providers/auth_provider.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';

class OperateurDetailPage extends StatefulWidget {
  final int id;
  const OperateurDetailPage({super.key, required this.id});

  @override
  State<OperateurDetailPage> createState() => _OperateurDetailPageState();
}

class _OperateurDetailPageState extends State<OperateurDetailPage> {
  final PersonneService _service = PersonneService();
  Personne? _personne;
  bool _loading = true;
  List<Document> _documents = [];
  bool _loadingDocs = true;

  @override
  void initState() {
    super.initState();
    _load();
    _loadDocuments();
  }

  void _load() async {
    try {
      final p = await _service.get(widget.id);
      setState(() {
        _personne = p;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  void _loadDocuments() async {
    try {
      final docs = await DocumentService().list(personneId: widget.id);
      if (mounted) setState(() { _documents = docs; _loadingDocs = false; });
    } catch (e) {
      if (mounted) setState(() => _loadingDocs = false);
    }
  }

  void _showUploadDocumentModal() {
    final numeroController = TextEditingController();
    String selectedType = 'CNI';
    File? selectedFile;
    String? pickedPath;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => StatefulBuilder(
        builder: (ctx, setState) => Container(
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
                Text('Document pour ${_personne!.fullName}', style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                AppDropdown<String>(
                  label: 'Type de document *',
                  value: selectedType,
                  items: DocumentType.all.map((t) => AppDropdownItem(value: t.value, label: t.label)).toList(),
                  onChanged: (v) => setState(() => selectedType = v ?? 'CNI'),
                ),
                const SizedBox(height: 12),
                AppInput(label: 'Numéro', hint: 'Ex: 0045123', controller: numeroController),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _SourceButton(
                        icon: Icons.camera_alt,
                        label: 'Caméra',
                        onTap: () async {
                          final picked = await ImagePicker().pickImage(source: ImageSource.camera);
                          if (picked != null) setState(() { selectedFile = File(picked.path); pickedPath = picked.path; });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SourceButton(
                        icon: Icons.photo_library,
                        label: 'Galerie',
                        onTap: () async {
                          final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
                          if (picked != null) setState(() { selectedFile = File(picked.path); pickedPath = picked.path; });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _SourceButton(
                        icon: Icons.attach_file,
                        label: 'Fichier',
                        onTap: () async {
                          final picked = await ImagePicker().pickMedia();
                          if (picked != null) setState(() { selectedFile = File(picked.path); pickedPath = picked.path; });
                        },
                      ),
                    ),
                  ],
                ),
                if (selectedFile != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: AppColors.success, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(pickedPath!.split('/').last, style: const TextStyle(color: AppColors.success, fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                AppButton(
                  label: 'Uploader',
                  icon: Icons.cloud_upload,
                  isExpanded: true,
                  isLoading: false,
                  onPressed: () async {
                    if (selectedFile == null) {
                      showAppSnackBar(ctx, 'Choisissez un fichier', isError: true);
                      return;
                    }
                    Navigator.pop(ctx);
                    try {
                      showAppSnackBar(context, 'Upload en cours...');
                      await DocumentService().upload(
                        personneId: widget.id,
                        typeDocument: selectedType,
                        numero: numeroController.text,
                        fichier: selectedFile!,
                      );
                      showAppSnackBar(context, 'Document ajouté');
                    } catch (e) {
                      showAppSnackBar(context, 'Erreur: $e', isError: true);
                    }
                    if (mounted) _loadDocuments();
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

  @override
  Widget build(BuildContext context) {
    final isOperateur = context.watch<AuthProvider>().isOperateur;

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détail')),
        body: const Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    if (_personne == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Détail')),
        body: const EmptyState(icon: Icons.error_outline, title: 'Opérateur non trouvé'),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détail opérateur'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          if (!isOperateur)
            IconButton(
              onPressed: () => context.push('/operateurs/${widget.id}/modifier'),
              icon: const Icon(Icons.edit),
            ),
          if (!isOperateur)
            IconButton(
              onPressed: _delete,
              icon: const Icon(Icons.delete_outline, color: AppColors.error),
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 40,
                    backgroundColor: Colors.white.withValues(alpha: 0.2),
                    child: Text(
                      _personne!.nom.isNotEmpty ? _personne!.nom[0].toUpperCase() : '?',
                      style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    _personne!.fullName,
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    textAlign: TextAlign.center,
                  ),
                  if (_personne!.sexe != null)
                    Text(
                      _personne!.sexe == 'M' ? 'Masculin' : 'Féminin',
                      style: const TextStyle(color: Colors.white70, fontSize: 14),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                children: [
                  const _SectionTitle(icon: Icons.person, title: 'Informations'),
                  InfoRow(label: 'Nom', value: _personne!.nom),
                  InfoRow(label: 'Post-nom', value: _personne!.postnom),
                  InfoRow(label: 'Prénom', value: _personne!.prenom),
                  InfoRow(label: 'CNI', value: _personne!.cni ?? '-'),
                  if (_personne!.dateNaissance != null)
                    InfoRow(label: 'Né(e) le', value: formatDate(_personne!.dateNaissance)),
                  if (_personne!.lieuNaissance != null)
                    InfoRow(label: 'Lieu', value: _personne!.lieuNaissance!),
                ],
              ),
            ),
            AppCard(
              child: Column(
                children: [
                  const _SectionTitle(icon: Icons.contact_phone, title: 'Coordonnées'),
                  InfoRow(label: 'Téléphone', value: _personne!.telephone ?? '-'),
                  InfoRow(label: 'Email', value: _personne!.email ?? '-'),
                  InfoRow(label: 'Adresse', value: _personne!.adresse ?? '-'),
                ],
              ),
            ),
            AppCard(
              child: Column(
                children: [
                  const _SectionTitle(icon: Icons.calendar_today, title: 'Dates'),
                  InfoRow(label: 'Créé le', value: formatDateTime(_personne!.createdAt)),
                ],
              ),
            ),
            Row(
              children: [
                const _SectionTitle(icon: Icons.folder_open, title: 'Documents'),
                const Spacer(),
                IconButton(
                  onPressed: _showUploadDocumentModal,
                  icon: const Icon(Icons.add_circle_outline, color: AppColors.primary),
                  tooltip: 'Ajouter un document',
                ),
              ],
            ),
            if (_loadingDocs)
              const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)))
            else if (_documents.isEmpty)
              const Padding(padding: EdgeInsets.all(16), child: Text('Aucun document', style: TextStyle(color: AppColors.textMuted, fontSize: 13)))
            else
              ..._documents.map((doc) => _DocumentTile(document: doc, onDeleted: _loadDocuments)),
          ],
        ),
      ),
    );
  }

  void _delete() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Supprimer',
      message: 'Voulez-vous vraiment supprimer cet opérateur ?',
      confirmText: 'Supprimer',
      isDestructive: true,
    );
    if (confirmed) {
      try {
        await _service.delete(widget.id);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Supprimé'), backgroundColor: AppColors.success),
          );
          context.pop();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Erreur: $e'), backgroundColor: AppColors.error),
          );
        }
      }
    }
  }
}

class _SectionTitle extends StatelessWidget {
  final IconData icon;
  final String title;
  const _SectionTitle({required this.icon, required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, color: AppColors.primary, size: 20),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}

class _SourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _SourceButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppColors.bgInput,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary, size: 24),
            const SizedBox(height: 6),
            Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
          ],
        ),
      ),
    );
  }
}

class _DocumentTile extends StatelessWidget {
  final Document document;
  final VoidCallback onDeleted;
  const _DocumentTile({required this.document, required this.onDeleted});

  @override
  Widget build(BuildContext context) {
    IconData icon;
    Color color;
    switch (document.typeDocument) {
      case 'CNI': icon = Icons.badge; color = AppColors.info; break;
      case 'RCCM': icon = Icons.business; color = AppColors.primary; break;
      case 'PATENTE': icon = Icons.receipt; color = AppColors.warning; break;
      case 'QUITTANCE': icon = Icons.payment; color = AppColors.success; break;
      case 'AVATAR': icon = Icons.photo; color = AppColors.secondary; break;
      default: icon = Icons.description; color = AppColors.primary;
    }

    return AppCard(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(document.typeDocument, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                if (document.numero != null && document.numero!.isNotEmpty)
                  Text('N° ${document.numero!}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                Text(document.fichier?.split('/').last ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          IconButton(
            onPressed: () async {
              final confirmed = await showConfirmDialog(context, title: 'Supprimer', message: 'Supprimer ce document ?', confirmText: 'Supprimer', isDestructive: true);
              if (confirmed) {
                try {
                  await DocumentService().delete(document.id);
                  if (context.mounted) { showAppSnackBar(context, 'Document supprimé'); onDeleted(); }
                } catch (e) {
                  if (context.mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
                }
              }
            },
            icon: const Icon(Icons.delete_outline, color: AppColors.error, size: 20),
          ),
        ],
      ),
    );
  }
}
