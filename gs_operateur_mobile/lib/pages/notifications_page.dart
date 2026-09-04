import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../config/theme.dart';
import '../providers/notification_provider.dart';
import '../models/notification.dart' as models;
import '../widgets/widgets.dart';
import '../utils/formatters.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        leading: IconButton(
          onPressed: () => context.go('/home'),
          icon: const Icon(Icons.home),
          tooltip: 'Accueil',
        ),
        actions: [
          Consumer<NotificationProvider>(
            builder: (_, provider, __) {
              if (provider.nonLues == 0) return const SizedBox();
              return TextButton(
                onPressed: () async {
                  await provider.markAllAsRead();
                  if (!mounted) return;
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Toutes marquées comme lues'), backgroundColor: AppColors.success),
                  );
                },
                child: const Text('Tout lire', style: TextStyle(color: AppColors.primaryLight)),
              );
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (_, provider, __) {
          if (provider.loading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (provider.notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none,
              title: 'Aucune notification',
              subtitle: 'Vous serez notifié des activités importantes',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.load(),
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: provider.notifications.length,
              itemBuilder: (_, index) {
                final notif = provider.notifications[index];
                return _NotificationTile(
                  notification: notif,
                  onTap: () {
                    if (!notif.lu) {
                      provider.markAsRead(notif.id);
                    }
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final models.Notification notification;
  final VoidCallback onTap;

  const _NotificationTile({required this.notification, required this.onTap});

  IconData get _icon {
    switch (notification.type) {
      case 'paiement_valide':
        return Icons.check_circle;
      case 'paiement_annule':
        return Icons.cancel;
      case 'document_ajoute':
        return Icons.description;
      case 'nouvel_operateur':
        return Icons.person_add;
      default:
        return Icons.notifications;
    }
  }

  Color get _color {
    switch (notification.type) {
      case 'paiement_valide':
        return AppColors.success;
      case 'paiement_annule':
        return AppColors.error;
      case 'document_ajoute':
        return AppColors.info;
      case 'nouvel_operateur':
        return AppColors.primary;
      default:
        return AppColors.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppCard(
      borderColor: notification.lu ? AppColors.border : _color.withValues(alpha: 0.3),
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: _color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_icon, color: _color, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.titre,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: notification.lu ? FontWeight.normal : FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (!notification.lu)
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                      ),
                  ],
                ),
                if (notification.message != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    notification.message!,
                    style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  formatDateTime(notification.createdAt),
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
