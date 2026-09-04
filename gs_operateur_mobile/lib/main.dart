import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/personne_provider.dart';
import 'providers/paiement_provider.dart';
import 'providers/notification_provider.dart';
import 'pages/splash_page.dart';
import 'pages/login_page.dart';
import 'pages/home_page.dart';
import 'pages/operateurs_list_page.dart';
import 'pages/operateur_form_page.dart';
import 'pages/operateur_detail_page.dart';
import 'pages/declarations_page.dart';
import 'pages/declaration_form_page.dart';
import 'pages/factures_page.dart';
import 'pages/paiements_page.dart';
import 'pages/notifications_page.dart';
import 'pages/profil_page.dart';
import 'pages/taxes_page.dart';
import 'pages/documents_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  runApp(const GSOperateurApp());
}

class GSOperateurApp extends StatefulWidget {
  const GSOperateurApp({super.key});

  @override
  State<GSOperateurApp> createState() => _GSOperateurAppState();
}

class _GSOperateurAppState extends State<GSOperateurApp> {
  final AuthProvider _authProvider = AuthProvider();
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _authProvider.init();
    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: _authProvider,
      redirect: (context, state) {
        final isLoggedIn = _authProvider.isAuthenticated;
        final isLoginRoute = state.matchedLocation == '/login';
        final isSplashRoute = state.matchedLocation == '/';

        if (isSplashRoute) return null;

        if (!isLoggedIn && !isLoginRoute) return '/login';
        if (isLoggedIn && isLoginRoute) return '/home';

        return null;
      },
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
  }

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: _authProvider),
        ChangeNotifierProvider(create: (_) => PersonneProvider()),
        ChangeNotifierProvider(create: (_) => PaiementProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp.router(
        title: 'GS Opérateur',
        theme: AppTheme.darkTheme,
        routerConfig: _router,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
