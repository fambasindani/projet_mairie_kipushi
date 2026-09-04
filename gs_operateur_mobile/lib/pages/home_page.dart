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

  static const List<_NavItem> _navItems = [
    _NavItem(icon: Icons.people_outline, activeIcon: Icons.people, label: 'Opérateurs', route: '/operateurs'),
    _NavItem(icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long, label: 'Déclarations', route: '/declarations'),
    _NavItem(icon: Icons.receipt_outlined, activeIcon: Icons.receipt, label: 'Factures', route: '/factures'),
    _NavItem(icon: Icons.notifications_outlined, activeIcon: Icons.notifications, label: 'Alertes', route: '/notifications'),
    _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profil', route: '/profil'),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final location = GoRouterState.of(context).matchedLocation;
    int newIndex = 0;
    for (int i = 0; i < _navItems.length; i++) {
      if (location.startsWith(_navItems[i].route)) {
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
            height: 60,
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
                        Stack(
                          clipBehavior: Clip.none,
                          children: [
                            Icon(
                              isActive ? item.activeIcon : item.icon,
                              color: isActive ? AppColors.primary : AppColors.textMuted,
                              size: 24,
                            ),
                            if (item.label == 'Alertes')
                              Consumer<NotificationProvider>(
                                builder: (_, notifProv, __) {
                                  if (notifProv.nonLues == 0) return const SizedBox();
                                  return Positioned(
                                    right: -6, top: -4,
                                    child: Container(
                                      padding: const EdgeInsets.all(4),
                                      decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                                      constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                                      child: Text('${notifProv.nonLues}', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                                    ),
                                  );
                                },
                              ),
                          ],
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

    return Scaffold(
      appBar: AppBar(
        title: const Text('GS Opérateur'),
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
                  Text(auth.isOperateur ? 'Opérateur terrain' : 'Administrateur', style: const TextStyle(color: Colors.white70, fontSize: 14)),
                ],
              ),
            ),
            const SizedBox(height: 20),
            _QuickAction(icon: Icons.people, label: 'Opérateurs', color: AppColors.primary, onTap: () => context.go('/operateurs')),
            _QuickAction(icon: Icons.receipt_long, label: 'Déclarations', color: AppColors.success, onTap: () => context.go('/declarations')),
            _QuickAction(icon: Icons.receipt, label: 'Factures', color: AppColors.info, onTap: () => context.go('/factures')),
            _QuickAction(icon: Icons.folder_open, label: 'Documents', color: AppColors.warning, onTap: () => context.go('/documents')),
            _QuickAction(icon: Icons.receipt, label: 'Taxes', color: AppColors.secondary, onTap: () => context.go('/taxes')),
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
