import 'package:flutter/material.dart';
import '../../config/theme.dart';

class AppDropdown<T> extends StatelessWidget {
  final String label;
  final String? hint;
  final T? value;
  final List<AppDropdownItem<T>> items;
  final ValueChanged<T?> onChanged;
  final String? Function(T?)? validator;
  final bool enabled;
  final bool isExpanded;

  const AppDropdown({
    super.key,
    required this.label,
    this.hint,
    this.value,
    required this.items,
    required this.onChanged,
    this.validator,
    this.enabled = true,
    this.isExpanded = true,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        IgnorePointer(
          ignoring: !enabled,
          child: DropdownButtonFormField<T>(
            value: value,
            isExpanded: isExpanded,
            validator: validator,
            dropdownColor: AppColors.bgCard,
            style: TextStyle(
              color: enabled ? AppColors.textPrimary : AppColors.textMuted,
              fontSize: 15,
            ),
            icon: const Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted),
            decoration: InputDecoration(
              hintText: hint ?? 'Sélectionner',
              fillColor: enabled ? null : AppColors.bgInput.withValues(alpha: 0.5),
              filled: !enabled,
            ),
            items: items.map((item) {
              return DropdownMenuItem<T>(
                value: item.value,
                child: Text(item.label),
              );
            }).toList(),
            onChanged: enabled ? onChanged : null,
          ),
        ),
      ],
    );
  }
}

class AppDropdownItem<T> {
  final T value;
  final String label;

  const AppDropdownItem({required this.value, required this.label});
}
