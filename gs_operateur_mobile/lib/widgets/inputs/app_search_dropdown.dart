import 'package:flutter/material.dart';
import '../../config/theme.dart';

class AppSearchDropdown<T> extends StatefulWidget {
  final String label;
  final String? hint;
  final T? value;
  final String? valueLabel;
  final Future<List<T>> Function(String search) onSearch;
  final String Function(T item) itemLabel;
  final ValueChanged<T?> onChanged;
  final String? Function(T?)? validator;
  final bool enabled;

  const AppSearchDropdown({
    super.key,
    required this.label,
    this.hint,
    this.value,
    this.valueLabel,
    required this.onSearch,
    required this.itemLabel,
    required this.onChanged,
    this.validator,
    this.enabled = true,
  });

  @override
  State<AppSearchDropdown<T>> createState() => _AppSearchDropdownState<T>();
}

class _AppSearchDropdownState<T> extends State<AppSearchDropdown<T>> {
  final TextEditingController _controller = TextEditingController();
  final FocusNode _focusNode = FocusNode();
  List<T> _items = [];
  bool _isLoading = false;
  bool _isOpen = false;

  @override
  void initState() {
    super.initState();
    if (widget.valueLabel != null) {
      _controller.text = widget.valueLabel!;
    }
  }

  @override
  void didUpdateWidget(AppSearchDropdown<T> oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.valueLabel != null && widget.valueLabel != oldWidget.valueLabel) {
      _controller.text = widget.valueLabel!;
    }
  }

  Future<void> _search(String query) async {
    setState(() => _isLoading = true);
    try {
      final results = await widget.onSearch(query);
      if (mounted) {
        setState(() {
          _items = results;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        FormField<T>(
          initialValue: widget.value,
          validator: widget.validator,
          builder: (field) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextFormField(
                  controller: _controller,
                  focusNode: _focusNode,
                  enabled: widget.enabled,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
                  decoration: InputDecoration(
                    hintText: widget.hint ?? 'Rechercher...',
                    prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                    suffixIcon: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: Padding(
                              padding: EdgeInsets.all(12),
                              child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                            ),
                          )
                        : _controller.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 20),
                                onPressed: () {
                                  _controller.clear();
                                  widget.onChanged(null);
                                  field.didChange(null);
                                },
                              )
                            : null,
                    errorText: field.errorText,
                  ),
                  onChanged: (value) {
                    _search(value);
                    setState(() => _isOpen = value.isNotEmpty);
                  },
                ),
                if (_isOpen && _items.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 4),
                    constraints: const BoxConstraints(maxHeight: 200),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: ListView.builder(
                      shrinkWrap: true,
                      padding: EdgeInsets.zero,
                      itemCount: _items.length,
                      itemBuilder: (context, index) {
                        final item = _items[index];
                        return ListTile(
                          dense: true,
                          title: Text(
                            widget.itemLabel(item),
                            style: const TextStyle(color: AppColors.textPrimary, fontSize: 14),
                          ),
                          onTap: () {
                            _controller.text = widget.itemLabel(item);
                            widget.onChanged(item);
                            field.didChange(item);
                            setState(() => _isOpen = false);
                            _focusNode.unfocus();
                          },
                        );
                      },
                    ),
                  ),
              ],
            );
          },
        ),
      ],
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    _focusNode.dispose();
    super.dispose();
  }
}
