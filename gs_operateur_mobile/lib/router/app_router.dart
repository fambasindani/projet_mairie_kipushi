import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../pages/landing_page.dart';
import '../pages/inscription_page.dart';
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
import '../pages/recus_perception_page.dart';
import '../pages/recu_perception_form_page.dart';
import '../pages/recu_perception_pdf_page.dart';
import '../providers/auth_provider.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final auth = context.read<AuthProvider>();
    final isLoggedIn = auth.isAuthenticated;
    final isLoginRoute = state.matchedLocation == '/login';
    final isLandingRoute = state.matchedLocation == '/';
    final isInscriptionRoute = state.matchedLocation == '/inscription';
    final isSplashRoute = state.matchedLocation == '//';

    if (isSplashRoute) return null;

    if (!isLoggedIn && !isLoginRoute && !isLandingRoute && !isInscriptionRoute) return '/';
    if (isLoggedIn && (isLoginRoute || isLandingRoute || isInscriptionRoute)) return '/home';

    return null;
  },
  routes: [
    GoRoute(path: '/', builder: (_, __) => const LandingPage()),
    GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
    GoRoute(path: '/inscription', builder: (_, __) => const InscriptionPage()),
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
        GoRoute(path: '/recus-perception', builder: (_, __) => const RecusPerceptionPage()),
        GoRoute(path: '/recus-perception/ajouter', builder: (_, __) => const RecuPerceptionFormPage()),
        GoRoute(path: '/profil', builder: (_, __) => const ProfilPage()),
      ],
    ),
  ],
);
