import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/personne_provider.dart';
import '../providers/auth_provider.dart';
import '../models/personne.dart';
import '../widgets/widgets.dart';

class OperateursListPage extends StatefulWidget {
  const OperateursListPage({super.key});

  @override
  State<OperateursListPage> createState() => _OperateursListPageState();
}

class _OperateursListPageState extends State<OperateursListPage> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PersonneProvider>().load(refresh: true);
    });
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      context.read<PersonneProvider>().load(search: _searchController.text);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOperateur = context.watch<AuthProvider>().isOperateur;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Opérateurs'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          if (!isOperateur)
            IconButton(
              onPressed: () => context.push('/operateurs/ajouter'),
              icon: const Icon(Icons.person_add),
            ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(60),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: TextField(
              controller: _searchController,
              style: const TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Rechercher un opérateur...',
                prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 20),
                        onPressed: () {
                          _searchController.clear();
                          context.read<PersonneProvider>().load(refresh: true);
                        },
                      )
                    : null,
                filled: true,
                fillColor: AppColors.bgInput,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: (v) {
                setState(() {});
                context.read<PersonneProvider>().load(search: v, refresh: true);
              },
            ),
          ),
        ),
      ),
      body: Consumer<PersonneProvider>(
        builder: (_, provider, __) {
          if (provider.loading && provider.personnes.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (provider.error != null && provider.personnes.isEmpty) {
            return EmptyState(icon: Icons.error_outline, title: 'Erreur', subtitle: provider.error);
          }
          if (provider.personnes.isEmpty) {
            return const EmptyState(icon: Icons.people_outline, title: 'Aucun opérateur', subtitle: 'Commencez par en ajouter un');
          }

          return RefreshIndicator(
            onRefresh: () => provider.load(refresh: true),
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(12),
              itemCount: provider.personnes.length + (provider.hasMore ? 1 : 0),
              itemBuilder: (_, index) {
                if (index == provider.personnes.length) {
                  return const Center(
                    child: Padding(padding: EdgeInsets.all(16), child: CircularProgressIndicator(color: AppColors.primary)),
                  );
                }
                final personne = provider.personnes[index];
                return _PersonneTile(personne: personne, isOperateur: isOperateur);
              },
            ),
          );
        },
      ),
    );
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
}

class _PersonneTile extends StatelessWidget {
  final Personne personne;
  final bool isOperateur;

  const _PersonneTile({required this.personne, required this.isOperateur});

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: () => context.push('/operateurs/${personne.id}'),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.2),
            child: Text(
              personne.nom.isNotEmpty ? personne.nom[0].toUpperCase() : '?',
              style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 18),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  personne.fullName,
                  style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 15),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                if (personne.telephone != null)
                  Text(
                    personne.telephone!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                  ),
                if (personne.cni != null)
                  Text(
                    'CNI: ${personne.cni}',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 12),
                  ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: AppColors.textMuted),
        ],
      ),
    );
  }
}
