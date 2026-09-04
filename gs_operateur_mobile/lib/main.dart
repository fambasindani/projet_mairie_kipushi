import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:provider/provider.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';
import 'providers/personne_provider.dart';
import 'providers/paiement_provider.dart';
import 'providers/notification_provider.dart';
import 'router/app_router.dart';

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

  @override
  void initState() {
    super.initState();
    _authProvider.init();
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
        routerConfig: appRouter,
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
