import 'package:intl/intl.dart';

String formatMontant(dynamic val) {
  final n = (val is num) ? val.toDouble() : double.tryParse(val?.toString() ?? '0') ?? 0;
  final formatted = n.toStringAsFixed(0).replaceAllMapped(
    RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
    (m) => '${m[1]} ',
  );
  return '$formatted CDF';
}

String formatDate(DateTime? date) {
  if (date == null) return '-';
  return DateFormat('dd/MM/yyyy').format(date);
}

String formatDateTime(DateTime? date) {
  if (date == null) return '-';
  return DateFormat('dd/MM/yyyy HH:mm').format(date);
}

String formatDateApi(DateTime? date) {
  if (date == null) return '';
  return DateFormat('yyyy-MM-dd').format(date);
}

String statutLabel(String statut) {
  const labels = {
    'en_attente': 'En attente',
    'paye': 'Payé',
    'annule': 'Annulé',
    'exonere': 'Exonéré',
    'actif': 'Actif',
    'inactif': 'Inactif',
  };
  return labels[statut] ?? statut;
}
