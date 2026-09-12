import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';

class HomePage extends StatefulWidget {
  final Widget child;
  const HomePage({super.key, required this.child});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  static const Map<String, String> _routePermissions = {
    '/operateurs': 'operateur:read',
    '/declarations': 'paiement:read',
    '/factures': 'paiement:read',
    '/documents': 'document:read',
    '/notifications': 'notification:read',
    '/recus-perception': 'paiement:read',
    '/taxes': 'taxe:read',
    '/profil': '',
  };

  static const List<_NavItem> _allNavItems = [
    _NavItem(icon: Icons.people_outline, activeIcon: Icons.people, label: 'Opérateurs', route: '/operateurs'),
    _NavItem(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Déclarations', route: '/declarations'),
    _NavItem(icon: Icons.receipt_outlined, activeIcon: Icons.receipt, label: 'Factures', route: '/factures'),
    _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profil', route: '/profil'),
  ];

  List<_NavItem> get _navItems {
    final auth = context.read<AuthProvider>();
    if (auth.isAdmin) return _allNavItems;
    return _allNavItems.where((item) {
      final perm = _routePermissions[item.route];
      if (perm == null || perm.isEmpty) return true;
      return auth.hasPermission(perm);
    }).toList();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final location = GoRouterState.of(context).matchedLocation;
    final items = _navItems;
    int newIndex = 0;
    for (int i = 0; i < items.length; i++) {
      if (location.startsWith(items[i].route)) {
        newIndex = i;
        break;
      }
    }
    if (_currentIndex != newIndex) {
      setState(() => _currentIndex = newIndex);
    }
  }

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    final showFab = location.startsWith('/operateurs') && !location.contains('/ajouter') && !location.contains('/modifier');

    return Scaffold(
      body: widget.child,
      floatingActionButton: showFab
          ? FloatingActionButton(
              onPressed: () => context.push('/operateurs/ajouter'),
              backgroundColor: AppColors.primary,
              child: const Icon(Icons.person_add, color: Colors.white),
            )
          : null,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bgCard,
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              children: _navItems.asMap().entries.map((entry) {
                final i = entry.key;
                final item = entry.value;
                final isActive = _currentIndex == i;

                return Expanded(
                  child: InkWell(
                    onTap: () {
                      setState(() => _currentIndex = i);
                      context.go(item.route);
                    },
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                            decoration: isActive ? BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(16),
                            ) : null,
                            child: Icon(
                              isActive ? item.activeIcon : item.icon,
                              color: isActive ? AppColors.primary : AppColors.textMuted,
                              size: 24,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            item.label,
                            style: TextStyle(
                              color: isActive ? AppColors.primary : AppColors.textMuted,
                              fontSize: 10,
                              fontWeight: isActive ? FontWeight.w600 : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                  ),
                );
              }).toList(),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final String route;
  const _NavItem({required this.icon, required this.activeIcon, required this.label, required this.route});
}

class HomeContent extends StatelessWidget {
  const HomeContent({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.isAdmin;
    bool can(String perm) => isAdmin || auth.hasPermission(perm);

    return Scaffold(
      appBar: AppBar(
        title: const Text('I-KIPUSHI'),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            onPressed: () => context.push('/notifications'),
            icon: const Icon(Icons.notifications_outlined),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {},
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.secondary],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Bienvenue, ${auth.user?.nomUtilisateur ?? ''}', style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(isAdmin ? 'Administrateur' : 'Opérateur terrain', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            if (can('operateur:read'))
              _QuickAction(icon: Icons.people, label: 'Opérateurs', color: AppColors.primary, onTap: () => context.go('/operateurs')),
            if (can('paiement:read'))
              _QuickAction(icon: Icons.receipt_long, label: 'Déclarations', color: AppColors.success, onTap: () => context.go('/declarations')),
            if (can('paiement:read'))
              _QuickAction(icon: Icons.payment, label: 'Factures & Perception', color: AppColors.info, onTap: () => context.go('/factures')),
            if (can('document:read'))
              _QuickAction(icon: Icons.folder_open, label: 'Documents', color: AppColors.warning, onTap: () => context.go('/documents')),
            if (can('taxe:read'))
              _QuickAction(icon: Icons.receipt, label: 'Taxes', color: AppColors.secondary, onTap: () => context.go('/taxes')),
            if (can('notification:read'))
              _QuickAction(icon: Icons.notifications, label: 'Notifications', color: AppColors.primaryLight, onTap: () => context.go('/notifications')),
          ],
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: color, size: 24),
        ),
        title: Text(label, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
        onTap: onTap,
      ),
    );
  }
}
