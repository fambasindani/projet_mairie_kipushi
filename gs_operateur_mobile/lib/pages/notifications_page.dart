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
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationProvider>().load();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
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
          if (provider.loading && provider.notifications.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (provider.notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_none,
              title: 'Aucune notification',
              subtitle: 'Vous serez notifié des activités importantes',
            );
          }

          final lues = provider.notifications.where((n) => n.estLue).length;
          final nonLues = provider.nonLues;

          return Column(
            children: [
              Container(
                margin: const EdgeInsets.fromLTRB(12, 8, 12, 0),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.bgCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _StatItem(label: 'Total', value: '${provider.notifications.length}', color: AppColors.primary),
                    _StatItem(label: 'Non lues', value: '$nonLues', color: AppColors.warning),
                    _StatItem(label: 'Lues', value: '$lues', color: AppColors.success),
                  ],
                ),
              ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: () => provider.load(),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: provider.notifications.length,
                    itemBuilder: (_, index) {
                      final notif = provider.notifications[index];
                      return _NotificationTile(
                        notification: notif,
                        onTap: () => _showDetail(notif, provider),
                        onDelete: () => _confirmDelete(notif, provider),
                      );
                    },
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showDetail(models.Notification notif, NotificationProvider provider) {
    if (!notif.estLue) {
      provider.markAsRead(notif.id);
    }

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6,
        minChildSize: 0.3,
        maxChildSize: 0.9,
        builder: (ctx, scrollCtrl) => Container(
          decoration: const BoxDecoration(
            color: AppColors.bgSurface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: ListView(
            controller: scrollCtrl,
            padding: const EdgeInsets.all(20),
            children: [
              Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.textMuted.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)))),
              const SizedBox(height: 20),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: _typeColor(notif.typeNotification).withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(_typeIcon(notif.typeNotification), color: _typeColor(notif.typeNotification), size: 24),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(notif.sujet, style: const TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: _typeColor(notif.typeNotification).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(notif.typeLabel, style: TextStyle(color: _typeColor(notif.typeNotification), fontSize: 11, fontWeight: FontWeight.w600)),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: (notif.estLue ? AppColors.success : AppColors.warning).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(notif.estLue ? 'Lu' : 'Non lu', style: TextStyle(
                                color: notif.estLue ? AppColors.success : AppColors.warning,
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                              )),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (notif.message != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.bgInput,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(notif.message!, style: const TextStyle(color: AppColors.textPrimary, fontSize: 14, height: 1.5)),
                ),
                const SizedBox(height: 16),
              ],
              if (notif.dateEnvoi != null)
                _detail('Date d\'envoi', formatDateTime(notif.dateEnvoi!)),
              if (notif.dateLecture != null)
                _detail('Date de lecture', formatDateTime(notif.dateLecture!)),
              if (notif.lienAction != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Text('Lien : ', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    Text(notif.lienAction!, style: const TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w500)),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _confirmDelete(models.Notification notif, NotificationProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer'),
        content: Text('Supprimer la notification "${notif.sujet}" ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await provider.delete(notif.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Notification supprimée'), backgroundColor: AppColors.success),
                );
              }
            },
            child: const Text('Supprimer', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  Widget _detail(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          const SizedBox(width: 8),
          Flexible(child: Text(value, style: const TextStyle(color: AppColors.textPrimary, fontSize: 13), textAlign: TextAlign.end)),
        ],
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'paiement_echu': return AppColors.error;
      case 'renouvellement_permis': return AppColors.warning;
      case 'controle_prochain': return AppColors.info;
      case 'mise_en_demeure': return AppColors.warning;
      case 'information': return AppColors.success;
      default: return AppColors.primary;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'paiement_echu': return Icons.warning_amber;
      case 'renouvellement_permis': return Icons.schedule;
      case 'controle_prochain': return Icons.info_outline;
      case 'mise_en_demeure': return Icons.mail_lock;
      case 'information': return Icons.article_outlined;
      default: return Icons.notifications;
    }
  }
}

class _NotificationTile extends StatelessWidget {
  final models.Notification notification;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _NotificationTile({required this.notification, required this.onTap, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final color = _typeColor(notification.typeNotification);

    return AppCard(
      borderColor: notification.estLue ? AppColors.border : color.withValues(alpha: 0.3),
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_typeIcon(notification.typeNotification), color: color, size: 22),
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
                        notification.sujet,
                        style: TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: notification.estLue ? FontWeight.normal : FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (!notification.estLue)
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
                  formatDateTime(notification.dateEnvoi ?? notification.createdAt),
                  style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onDelete,
            icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.textMuted),
            tooltip: 'Supprimer',
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Color _typeColor(String type) {
    switch (type) {
      case 'paiement_echu': return AppColors.error;
      case 'renouvellement_permis': return AppColors.warning;
      case 'controle_prochain': return AppColors.info;
      case 'mise_en_demeure': return AppColors.warning;
      case 'information': return AppColors.success;
      default: return AppColors.primary;
    }
  }

  IconData _typeIcon(String type) {
    switch (type) {
      case 'paiement_echu': return Icons.warning_amber;
      case 'renouvellement_permis': return Icons.schedule;
      case 'controle_prochain': return Icons.info_outline;
      case 'mise_en_demeure': return Icons.mail_lock;
      case 'information': return Icons.article_outlined;
      default: return Icons.notifications;
    }
  }
}

class _StatItem extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatItem({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 16)),
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
      ],
    );
  }
}
