import 'package:flutter/material.dart';
import '../../config/theme.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final List<Widget>? actions;
  final bool showBack;
  final Widget? bottom;

  const AppHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actions,
    this.showBack = true,
    this.bottom,
  });

  @override
  Size get preferredSize => Size.fromHeight(kToolbarHeight + (bottom != null ? 60 : 0));

  @override
  Widget build(BuildContext context) {
    return AppBar(
      leading: showBack
          ? IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            )
          : null,
      title: Column(
        children: [
          Text(title),
          if (subtitle != null)
            Text(
              subtitle!,
              style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
        ],
      ),
      actions: actions,
      bottom: bottom != null
          ? PreferredSize(
              preferredSize: const Size.fromHeight(60),
              child: bottom!,
            )
          : null,
    );
  }
}
