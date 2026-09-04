import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:dio/dio.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../services/document_service.dart';
import '../services/api_service.dart';
import '../models/document.dart';
import '../widgets/widgets.dart';
import '../utils/helpers.dart';

class DocumentsPage extends StatefulWidget {
  const DocumentsPage({super.key});

  @override
  State<DocumentsPage> createState() => _DocumentsPageState();
}

class _DocumentsPageState extends State<DocumentsPage> {
  List<Document> _documents = [];
  bool _loading = true;
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _load();
  }

  void _load() async {
    setState(() => _loading = true);
    try {
      final docs = await DocumentService().list(search: _searchController.text);
      setState(() { _documents = docs; _loading = false; });
    } catch (e) {
      setState(() => _loading = false);
      if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Documents'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 0),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Rechercher...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                filled: true,
                fillColor: AppColors.bgInput,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: (_) => _load(),
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
                : _documents.isEmpty
                    ? const EmptyState(icon: Icons.folder_open, title: 'Aucun document', subtitle: 'Les documents sont ajoutés depuis les détails d\'un opérateur')
                    : RefreshIndicator(
                        onRefresh: () async => _load(),
                        child: ListView.builder(
                          padding: const EdgeInsets.all(12),
                          itemCount: _documents.length,
                          itemBuilder: (_, index) => _DocumentTile(
                            document: _documents[index],
                            onDelete: () => _delete(_documents[index]),
                            onDownload: () => _download(_documents[index]),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  void _download(Document doc) async {
    final url = DocumentService().downloadUrl(doc.id);
    try {
      showAppSnackBar(context, 'Téléchargement en cours...');
      final dir = await getApplicationDocumentsDirectory();
      final fileName = doc.fichier?.split('/').last ?? 'document_${doc.id}';
      final filePath = '${dir.path}/$fileName';
      final token = await ApiService().getToken();
      final dio = Dio();
      await dio.download(url, filePath, options: token != null ? Options(headers: {'Authorization': 'Bearer $token'}) : null);
      if (mounted) showAppSnackBar(context, 'Enregistré: $filePath');
    } catch (e) {
      if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
    }
  }

  void _delete(Document doc) async {
    final confirmed = await showConfirmDialog(context, title: 'Supprimer', message: 'Supprimer ce document ?', confirmText: 'Supprimer', isDestructive: true);
    if (confirmed) {
      try {
        await DocumentService().delete(doc.id);
        if (mounted) { showAppSnackBar(context, 'Document supprimé'); _load(); }
      } catch (e) {
        if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
      }
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}

class _DocumentTile extends StatelessWidget {
  final Document document;
  final VoidCallback onDelete;
  final VoidCallback onDownload;
  const _DocumentTile({required this.document, required this.onDelete, required this.onDownload});

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                    if (document.personne != null && document.personne!.nomComplet != null)
                      Text(document.personne!.nomComplet!, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    Text(document.fichier?.split('/').last ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11), maxLines: 1, overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppButton(
                  label: 'Télécharger',
                  icon: Icons.download,
                  isExpanded: true,
                  isOutlined: true,
                  onPressed: onDownload,
                ),
              ),
              const SizedBox(width: 8),
              AppButton(
                label: 'Supprimer',
                icon: Icons.delete_outline,
                isDestructive: true,
                isOutlined: true,
                onPressed: onDelete,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
