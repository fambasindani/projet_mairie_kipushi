import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../models/user.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/widgets.dart';
import '../utils/formatters.dart';
import '../utils/helpers.dart';

class ProfilPage extends StatefulWidget {
  const ProfilPage({super.key});

  @override
  State<ProfilPage> createState() => _ProfilPageState();
}

class _ProfilPageState extends State<ProfilPage> {
  String? _localAvatarPath;

  Future<void> _pickAvatar(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(source: source, maxWidth: 512, maxHeight: 512, imageQuality: 80);
      if (picked == null) return;

      setState(() => _localAvatarPath = picked.path);

      final token = await ApiService().getToken();
      if (token == null) {
        if (mounted) showAppSnackBar(context, 'Non authentifié', isError: true);
        return;
      }

      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(picked.path),
      });

      final response = await ApiService().postFormData('/profile/upload-avatar', formData: formData);

      if (response['success'] == true) {
        if (mounted) {
          showAppSnackBar(context, 'Photo de profil mise à jour');
          context.read<AuthProvider>().init();
        }
      } else {
        if (mounted) showAppSnackBar(context, response['message'] ?? 'Erreur', isError: true);
      }
    } catch (e) {
      if (mounted) showAppSnackBar(context, 'Erreur: $e', isError: true);
    }
  }

  void _showAvatarOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: AppColors.bgDark,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Choisir une photo', style: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera_alt, color: AppColors.primary),
              title: const Text('Prendre une photo', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () { Navigator.pop(context); _pickAvatar(ImageSource.camera); },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library, color: AppColors.primary),
              title: const Text('Choisir dans la galerie', style: TextStyle(color: AppColors.textPrimary)),
              onTap: () { Navigator.pop(context); _pickAvatar(ImageSource.gallery); },
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Profil'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          IconButton(
            onPressed: () async {
              final confirmed = await showConfirmDialog(context, title: 'Déconnexion', message: 'Voulez-vous vous déconnecter ?', confirmText: 'Se déconnecter', isDestructive: true);
              if (confirmed && context.mounted) await auth.logout();
            },
            icon: const Icon(Icons.logout, color: AppColors.error),
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
                gradient: const LinearGradient(colors: [AppColors.primary, AppColors.secondary], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                children: [
                  GestureDetector(
                    onTap: _showAvatarOptions,
                    child: Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        _AvatarWidget(user: user, localPath: _localAvatarPath),
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.camera_alt, color: AppColors.primary, size: 18),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.nomUtilisateur ?? '-', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '-', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(20)),
                    child: Text(auth.isOperateur ? 'Opérateur' : 'Administrateur', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            AppCard(
              child: Column(
                children: [
                  _sectionTitle(Icons.info_outline, 'Informations'),
                  _infoRow('Nom d\'utilisateur', user?.nomUtilisateur ?? '-'),
                  _infoRow('Email', user?.email ?? '-'),
                  _infoRow('Téléphone', user?.telephone ?? '-'),
                  _infoRow('Adresse', user?.adresse ?? '-'),
                  _infoRow('CNI', user?.cni ?? '-'),
                  _infoRow('Personne ID', user?.personneId?.toString() ?? '-'),
                  _infoRow('Membre depuis', formatDateTime(user?.createdAt)),
                  _infoRow('Dernière connexion', formatDateTime(user?.derniereConnexion)),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Text('I-KIPUSHI v1.0.0', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(IconData icon, String title) {
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

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14))),
        ],
      ),
    );
  }
}

class _AvatarWidget extends StatelessWidget {
  final User? user;
  final String? localPath;
  const _AvatarWidget({required this.user, this.localPath});

  @override
  Widget build(BuildContext context) {
    if (localPath != null) {
      return CircleAvatar(
        radius: 40,
        backgroundColor: Colors.white.withValues(alpha: 0.2),
        backgroundImage: FileImage(File(localPath!)),
      );
    }

    final hasAvatar = user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty;
    final initials = (user?.nomUtilisateur.isNotEmpty == true
        ? user!.nomUtilisateur[0]
        : 'U')
        .toUpperCase();

    return CircleAvatar(
      radius: 40,
      backgroundColor: Colors.white.withValues(alpha: 0.2),
      backgroundImage: hasAvatar ? MemoryImage(base64Decode(user!.avatarUrl!.split(',').last)) : null,
      child: hasAvatar
          ? null
          : Text(
              initials,
              style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
            ),
    );
  }
}
