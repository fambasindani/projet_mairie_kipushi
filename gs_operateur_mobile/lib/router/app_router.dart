import 'package:go_router/go_router.dart';
import '../pages/splash_page.dart';
import '../pages/login_page.dart';
import '../pages/home_page.dart';
import '../pages/operateurs_list_page.dart';
import '../pages/operateur_form_page.dart';
import '../pages/operateur_detail_page.dart';
import '../pages/declarations_page.dart';
import '../pages/declaration_form_page.dart';
import '../pages/factures_page.dart';
import '../pages/paiements_page.dart';
import '../pages/notifications_page.dart';
import '../pages/profil_page.dart';
import '../pages/taxes_page.dart';
import '../pages/documents_page.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(path: '/', builder: (_, __) => const SplashPage()),
    GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
    ShellRoute(
      builder: (context, state, child) => HomePage(child: child),
      routes: [
        GoRoute(path: '/home', builder: (_, __) => const HomeContent()),
        GoRoute(path: '/operateurs', builder: (_, __) => const OperateursListPage()),
        GoRoute(path: '/operateurs/ajouter', builder: (_, __) => const OperateurFormPage()),
        GoRoute(path: '/operateurs/:id', builder: (_, state) => OperateurDetailPage(id: int.parse(state.pathParameters['id']!))),
        GoRoute(path: '/operateurs/:id/modifier', builder: (_, state) => OperateurFormPage(id: int.parse(state.pathParameters['id']!))),
        GoRoute(path: '/declarations', builder: (_, __) => const DeclarationsPage()),
        GoRoute(path: '/declarations/ajouter', builder: (_, __) => const DeclarationFormPage()),
        GoRoute(path: '/factures', builder: (_, __) => const FacturesPage()),
        GoRoute(path: '/paiements', builder: (_, __) => const PaiementsPage()),
        GoRoute(path: '/taxes', builder: (_, __) => const TaxesPage()),
        GoRoute(path: '/documents', builder: (_, __) => const DocumentsPage()),
        GoRoute(path: '/notifications', builder: (_, __) => const NotificationsPage()),
        GoRoute(path: '/profil', builder: (_, __) => const ProfilPage()),
      ],
    ),
  ],
);
