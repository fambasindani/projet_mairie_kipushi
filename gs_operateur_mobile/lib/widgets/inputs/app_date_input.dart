import 'package:flutter/material.dart';
import '../../config/theme.dart';

class AppDateInput extends StatelessWidget {
  final String label;
  final String? hint;
  final DateTime? value;
  final ValueChanged<DateTime> onChanged;
  final DateTime? firstDate;
  final DateTime? lastDate;
  final String? Function(DateTime?)? validator;
  final bool enabled;

  const AppDateInput({
    super.key,
    required this.label,
    this.hint,
    this.value,
    required this.onChanged,
    this.firstDate,
    this.lastDate,
    this.validator,
    this.enabled = true,
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
        FormField<DateTime>(
          initialValue: value,
          validator: validator,
          builder: (field) {
            return InkWell(
              onTap: enabled
                  ? () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: value ?? DateTime.now(),
                        firstDate: firstDate ?? DateTime(1900),
                        lastDate: lastDate ?? DateTime(2100),
                        builder: (context, child) {
                          return Theme(
                            data: Theme.of(context).copyWith(
                              colorScheme: const ColorScheme.dark(
                                primary: AppColors.primary,
                                surface: AppColors.bgCard,
                              ),
                            ),
                            child: child!,
                          );
                        },
                      );
                      if (picked != null) {
                        onChanged(picked);
                        field.didChange(picked);
                      }
                    }
                  : null,
              child: InputDecorator(
                decoration: InputDecoration(
                  hintText: hint ?? 'Sélectionner une date',
                  prefixIcon: const Icon(Icons.calendar_today, color: AppColors.textMuted, size: 20),
                  errorText: field.errorText,
                ),
                child: Text(
                  value != null
                      ? '${value!.day.toString().padLeft(2, '0')}/${value!.month.toString().padLeft(2, '0')}/${value!.year}'
                      : hint ?? '',
                  style: TextStyle(
                    color: value != null ? AppColors.textPrimary : AppColors.textMuted,
                    fontSize: 15,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}
